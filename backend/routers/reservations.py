from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extras import RealDictCursor
from database import get_db
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
def create_reservation(reservation: schemas.ReservationCreate, conn=Depends(get_db)):
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # 🔹 znajdź guest
        cur.execute("""
            SELECT g.guest_id
            FROM Guest g
            JOIN Account a ON g.guest_id = a.guest_id
            WHERE a.email = %s
        """, (reservation.email,))
        guest = cur.fetchone()

        if not guest:
            raise HTTPException(status_code=404, detail="Gość nie istnieje")

        guest_id = guest["guest_id"]

        # 🔹 pobierz cenę pokoju
        cur.execute("SELECT price_per_night FROM room WHERE room_id = %s", (reservation.room_id,))
        room = cur.fetchone()

        if not room:
            raise HTTPException(status_code=404, detail="Pokój nie istnieje")

        price = room["price_per_night"]

        # 🔹 utwórz rezerwację
        cur.execute("""
            INSERT INTO Reservation (main_guest_id, start_date, end_date, status, type)
            VALUES (%s, %s, %s, 'created', 'individual')
            RETURNING reservation_id
        """, (
            guest_id,
            reservation.start_date,
            reservation.end_date
        ))

        res = cur.fetchone()
        reservation_id = res["reservation_id"]

        # 🔹 powiąż pokój
        cur.execute("""
            INSERT INTO room_reservation (room_id, reservation_id, actual_price_per_night)
            VALUES (%s, %s, %s)
        """, (
            reservation.room_id,
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