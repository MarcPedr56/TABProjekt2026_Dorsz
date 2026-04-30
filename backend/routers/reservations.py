from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extras import RealDictCursor
from database import get_db
from datetime import datetime, timedelta
import schemas

router = APIRouter(
    prefix="/reservations",
    tags=["Reservations"]
)

@router.get("/", response_model=list[schemas.ReservationResponse])
def get_all_reservations(conn = Depends(get_db)):
    """Pobiera wszystkie rezerwacje (Dla panelu Admina)"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT * FROM Reservation ORDER BY start_date DESC;")
        return cur.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()

@router.get("/guest/{guest_id}", response_model=list[schemas.ReservationResponse])
def get_guest_reservations(guest_id: int, conn = Depends(get_db)):
    """Pobiera rezerwacje po ID Gościa (Dla historii w panelu Admina)"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT * FROM Reservation WHERE main_guest_id = %s ORDER BY start_date DESC;", (guest_id,))
        return cur.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()

@router.get("/user/{email}", response_model=list[schemas.ReservationResponse])
def get_user_reservations(email: str, conn = Depends(get_db)):
    """Pobiera rezerwacje po emailu"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT r.* FROM Reservation r
            JOIN Guest g ON r.main_guest_id = g.guest_id
            JOIN Account a ON g.guest_id = a.guest_id
            WHERE a.email = %s
            ORDER BY r.start_date DESC;
        """, (email,))
        return cur.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()

@router.post("/")
def create_reservation(data: schemas.ReservationCreate, conn=Depends(get_db)):
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # 🔹 znajdź guest
        cur.execute("""
            SELECT g.guest_id
            FROM Guest g
            JOIN Account a ON g.guest_id = a.guest_id
            WHERE a.email = %s
        """, (data.email,))
        guest = cur.fetchone()

        guest_id = 0

        if (data.role == "guest"):
            if not guest:
                raise HTTPException(status_code=404, detail="Gość nie istnieje")
            
            guest_id = guest["guest_id"]
        elif (data.role in ("admin", "receptionist")):
            if guest:
                raise HTTPException(status_code=404, detail="Gość już istnieje")

        # 🔹 pobierz cenę pokoju
        cur.execute("SELECT price_per_night FROM room WHERE room_id = %s", (data.room_id,))
        room = cur.fetchone()

        if not room:
            raise HTTPException(status_code=404, detail="Pokój nie istnieje")

        price = room["price_per_night"]

        if (data.role in ("admin", "receptionist")):
            # utwórz nowego gościa i dodaj do bazy
            cur.execute("""
                INSERT INTO Guest (first_name, last_name, pesel, phone_number, preferences) 
                VALUES (%s, %s, %s, %s, %s) 
                RETURNING guest_id, first_name, last_name, pesel, phone_number, preferences;
            """, (
                guest.first_name, 
                guest.last_name, 
                guest.pesel, 
                guest.phone_number, 
                guest.preferences
            ))

        # 🔹 utwórz rezerwację
        cur.execute("""
            INSERT INTO Reservation (main_guest_id, start_date, end_date, status, type)
            VALUES (%s, %s, %s, 'created', 'individual')
            RETURNING reservation_id
        """, (
            guest_id,
            data.start_date,
            data.end_date
        ))

        res = cur.fetchone()
        reservation_id = res["reservation_id"]

        # 🔹 powiąż pokój
        cur.execute("""
            INSERT INTO room_reservation (room_id, reservation_id, actual_price_per_night)
            VALUES (%s, %s, %s)
        """, (
            data.room_id,
            reservation_id,
            price
        ))

        conn.commit()

        return {
            "reservation_id": reservation_id,
            "price_per_night": price
        }

    except Exception as e:
        conn.rollback()
        print("DB ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()

@router.put("/{id}/extend")
def extend_reservation(id: int, data: schemas.ReservationUpdate, conn=Depends(get_db)):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # 🔹 znajdź rezerwacje
        cur.execute("""
            SELECT r.reservation_id, end_date
            FROM Reservation r
            WHERE r.reservation_id = %s
        """, (id,))

        reservation = cur.fetchone()
        end_date = reservation["end_date"]

        if not reservation:
            raise HTTPException(status_code=404, detail="Rezerwacja nie istnieje")

        # sprawdź, czy data jest odpowiednia
        if data.end_date <= end_date:
            raise HTTPException(status_code=422, detail="Przedłużona data nie może być wcześniejsza lub identyczna do poprzedniej")

        # 🔹 zaktualizuj dane rezerwacji
        cur.execute("""
            UPDATE Reservation as r
            SET end_date = %s
            WHERE r.reservation_id = %s
        """, (
            data.end_date,
            reservation["reservation_id"]
        ))

        conn.commit()

    except Exception as e:
        conn.rollback()
        print("DB ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()

@router.put("/{id}/shorten")
def shorten_reservation(id: int, data: schemas.ReservationUpdate, conn=Depends(get_db)):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # 🔹 znajdź rezerwacje
        cur.execute("""
            SELECT r.reservation_id, end_date
            FROM Reservation r
            WHERE r.reservation_id = %s
        """, (id,))

        reservation = cur.fetchone()
        end_date = reservation["end_date"]

        if not reservation:
            raise HTTPException(status_code=404, detail="Rezerwacja nie istnieje")

        # sprawdź, czy data jest odpowiednia
        if data.end_date >= end_date:
            raise HTTPException(status_code=422, detail="Skrócona data nie może być późniejsza lub identyczna do poprzedniej")

        # 🔹 zaktualizuj dane rezerwacji
        cur.execute("""
            UPDATE Reservation as r
            SET end_date = %s
            WHERE r.reservation_id = %s
        """, (
            data.end_date,
            reservation["reservation_id"]
        ))

        conn.commit()

    except Exception as e:
        conn.rollback()
        print("DB ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()

@router.put("/{id}/end")
def end_reservation(id: int, conn=Depends(get_db)):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # 🔹 znajdź rezerwacje
        cur.execute("""
            SELECT re.reservation_id, rr.room_id
            FROM Reservation re
            JOIN Room_reservation rr ON
                    rr.reservation_id = re.reservation_id
            WHERE re.reservation_id = %s
        """, (id,))

        reservation = cur.fetchone()

        if not reservation:
            raise HTTPException(status_code=404, detail="Rezerwacja nie istnieje")

        # 🔹 zaktualizuj dane rezerwacji
        cur.execute("""
            UPDATE Reservation as r
            SET end_date = %s, status = %s
            WHERE r.reservation_id = %s
        """, (
            datetime.today().strftime("%Y-%M-%D"),
            "ended",
            reservation["reservation_id"]
        ))

        # 🔹 dodaj postprzątanie pokoju powiązanego z tą rezerwacją
        cur.execute("""
            INSERT INTO Hotel_tasks as ht
                (room_id, description, start_date, end_date, status, priority_level)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            reservation["room_id"],
            "sprzątanie po zakończonej rezerwacji",
            datetime.today().strftime("%Y-%M-%D"),
            (datetime.today() + timedelta(days=3)).strftime("%Y-%M-%D"),
            "created",
            "normal"
        ))

        conn.commit()

    except Exception as e:
        conn.rollback()
        print("DB ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()


@router.post("/{id}/cancel")
def cancel_reservation(reservationId: int, conn=Depends(get_db)):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # 🔹 znajdź rezerwacje
        cur.execute("""
            SELECT r.reservation_id, r.room_id
            FROM Reservation r
            WHERE r.reservation_id = %s
        """, (reservationId,))
        reservation = cur.fetchone()

        if not reservation:
            raise HTTPException(status_code=404, detail="Rezerwacja nie istnieje")

        # 🔹 usuń rezerwację
        cur.execute("""
            DELETE FROM Reservation as r
            WHERE r.reservation_id = %s
        """, (
            reservation["reservation_id"],
        ))

        # 🔹 usuń rezerwację pokoju
        cur.execute("""
            DELETE FROM Room_reservation as rr
            WHERE rr.reservation_id = %s
                    AND rr.room_id = %s
        """, (
            reservation["reservation_id"],
            reservation["room_id"]
        ))

        conn.commit()

    except Exception as e:
        conn.rollback()
        print("DB ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()