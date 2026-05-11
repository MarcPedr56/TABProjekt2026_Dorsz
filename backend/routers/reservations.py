from fastapi import APIRouter, Depends, HTTPException, Response
from psycopg2.extras import RealDictCursor
from database import get_db
from datetime import datetime, timedelta
from fpdf import FPDF
import schemas

def strip_accents(text):
    if not isinstance(text, str):
        return str(text)
    replacements = {
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
        'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
    }
    for search, replace in replacements.items():
        text = text.replace(search, replace)
    return text

router = APIRouter(
    prefix="/reservations",
    tags=["Reservations"]
)

@router.get("/", response_model=list[schemas.ReservationResponse])
def get_all_reservations(conn = Depends(get_db)):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT r.*, rm.room_number 
            FROM Reservation r
            LEFT JOIN Room_Reservation rr ON rr.reservation_id = r.reservation_id
            LEFT JOIN Room rm ON rm.room_id = rr.room_id
            ORDER BY r.start_date DESC;
        """)
        return cur.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()

@router.get("/guest/{guest_id}/{active}", response_model=list[schemas.ReservationResponse])
def get_guest_reservations(guest_id: int, active: str, conn = Depends(get_db)):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        if active == "true":
            cur.execute("""
                SELECT r.*, rm.room_number 
                FROM Reservation r
                LEFT JOIN Room_Reservation rr ON rr.reservation_id = r.reservation_id
                LEFT JOIN Room rm ON rm.room_id = rr.room_id
                WHERE r.main_guest_id = %s
                    AND (r.end_date > cast(now() as date)
                        OR (r.end_date = cast(now() as date)
                        AND NOW() < cast(cast(now() as date) as timestamp) + INTERVAL '10 hours'))
                ORDER BY r.start_date DESC;
                """, (guest_id,))
        else:
            cur.execute("""
                SELECT r.*, rm.room_number 
                FROM Reservation r
                LEFT JOIN Room_Reservation rr ON rr.reservation_id = r.reservation_id
                LEFT JOIN Room rm ON rm.room_id = rr.room_id
                WHERE r.main_guest_id = %s
                ORDER BY r.start_date DESC;
                """, (guest_id,))
        return cur.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()

@router.get("/user/{email}/{active}", response_model=list[schemas.ReservationResponse])
def get_user_reservations(email: str, active: str, conn=Depends(get_db)):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        if active == "true":
            cur.execute("""
                SELECT r.*, rm.room_number
                FROM Reservation r
                JOIN Guest g ON r.main_guest_id = g.guest_id
                JOIN Account a ON g.guest_id = a.guest_id
                JOIN Room_Reservation rr ON rr.reservation_id = r.reservation_id
                JOIN Room rm ON rm.room_id = rr.room_id
                WHERE a.email = %s
                    AND (r.end_date > CAST(NOW() AS date)
                        OR (r.end_date = CAST(NOW() AS date)
                            AND NOW() < CAST(CAST(NOW() AS date) AS timestamp) + INTERVAL '10 hours'))
                ORDER BY r.start_date DESC;
            """, (email,))
        else:
            cur.execute("""
                SELECT r.*, rm.room_number
                FROM Reservation r
                JOIN Guest g ON r.main_guest_id = g.guest_id
                JOIN Account a ON g.guest_id = a.guest_id
                JOIN Room_Reservation rr ON rr.reservation_id = r.reservation_id
                JOIN Room rm ON rm.room_id = rr.room_id
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
        today = datetime.today().date()
        start_d = data.start_date.date() if hasattr(data.start_date, 'date') else datetime.strptime(str(data.start_date).split(' ')[0], '%Y-%m-%d').date()
        end_d = data.end_date.date() if hasattr(data.end_date, 'date') else datetime.strptime(str(data.end_date).split(' ')[0], '%Y-%m-%d').date()
        
        if start_d < today:
            raise HTTPException(status_code=422, detail="Nie można rezerwować pokoju na datę z przeszłości.")

        cur.execute("""
            SELECT g.guest_id FROM Guest g
            JOIN Account a ON g.guest_id = a.guest_id
            WHERE a.email = %s
        """, (data.email,))
        guest = cur.fetchone()

        if guest:
            guest_id = guest["guest_id"]
        else:
            if data.role in ("admin", "receptionist"):
                if not data.first_name or not data.last_name:
                    raise HTTPException(status_code=422, detail="Dla nowego gościa wymagane jest imię i nazwisko.")
                cur.execute("""
                    INSERT INTO Guest (first_name, last_name, pesel, phone_number)
                    VALUES (%s, %s, %s, %s) RETURNING guest_id
                """, (data.first_name, data.last_name, data.pesel, data.phone_number))
                guest_id = cur.fetchone()["guest_id"]
            else:
                raise HTTPException(status_code=404, detail="Użytkownik o tym mailu nie ma konta gościa.")

        cur.execute("SELECT price_per_night FROM Room WHERE room_id = %s", (data.room_id,))
        room = cur.fetchone()
        if not room: raise HTTPException(status_code=404, detail="Pokój nie istnieje")

        cur.execute("""
            SELECT 1 FROM Reservation re JOIN Room_Reservation rr ON rr.reservation_id = re.reservation_id
            WHERE rr.room_id = %s AND re.status != 'cancelled'
            AND (re.start_date, re.end_date) OVERLAPS (%s, %s)
        """, (data.room_id, data.start_date, data.end_date))
        
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="Pokój zajęty w tym terminie")

        cur.execute("""
            INSERT INTO Reservation (main_guest_id, start_date, end_date, status, type)
            VALUES (%s, %s, %s, 'created', 'individual') RETURNING reservation_id
        """, (guest_id, data.start_date, data.end_date))
        res_id = cur.fetchone()["reservation_id"]

        cur.execute("INSERT INTO Room_Reservation (room_id, reservation_id, actual_price_per_night) VALUES (%s, %s, %s)",
                    (data.room_id, res_id, room["price_per_night"]))

        # OBLICZENIE I DODANIE PŁATNOŚCI - TO, CZEGO ZAPOMNIAŁEŚ
        days = (end_d - start_d).days
        if days < 1: days = 1
        total_price = days * room["price_per_night"]

        cur.execute("""
            INSERT INTO Payment (reservation_id, amount, method, status)
            VALUES (%s, %s, %s, %s)
        """, (res_id, total_price, 'karta', 'niezaplacone'))

        conn.commit()
        return {"reservation_id": res_id, "message": "Rezerwacja i płatność stworzone pomyślnie"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()

@router.put("/{id}/extend")
def extend_reservation(id: int, data: schemas.ReservationUpdate, conn=Depends(get_db)):
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # 🔹 pobierz rezerwację + numer pokoju
        cur.execute("""
            SELECT 
                r.reservation_id,
                r.start_date,
                r.end_date,
                rr.room_id
            FROM Reservation r
            JOIN Room_Reservation rr
                ON rr.reservation_id = r.reservation_id
            WHERE r.reservation_id = %s
        """, (id,))

        reservation = cur.fetchone()

        if not reservation:
            raise HTTPException(
                status_code=404,
                detail="Rezerwacja nie istnieje"
            )

        current_end_date = reservation["end_date"]
        room_id = reservation["room_id"]

         # nie można ustawić daty z przeszłości
        if data.end_date < datetime.today().date():
            raise HTTPException(
                status_code=422,
                detail="Nie można przedłużyć pobytu na datę z przeszłości"
            )

        #  data końca nie może być przed początkiem
        if data.end_date <= reservation["start_date"]:
            raise HTTPException(
                status_code=422,
                detail="Data końca musi być późniejsza od daty rozpoczęcia"
            )


        # 🔹 nowa data musi być późniejsza
        if data.end_date <= current_end_date:
            raise HTTPException(
                status_code=422,
                detail="Przedłużona data musi być późniejsza"
            )

        # 🔹 sprawdzenie konfliktu z inną rezerwacją
        cur.execute("""
            SELECT 1
            FROM Reservation r
            JOIN Room_Reservation rr
                ON rr.reservation_id = r.reservation_id
            WHERE rr.room_id = %s
                AND r.reservation_id != %s
                AND r.status != 'cancelled'
                AND (
                    %s < r.end_date
                    AND %s > r.start_date
                )
        """, (
            room_id,
            id,
            reservation["start_date"],
            data.end_date
        ))

        conflict = cur.fetchone()

        if conflict:
            raise HTTPException(
                status_code=409,
                detail="Nie można przedłużyć pobytu — pokój jest już zarezerwowany w tym terminie"
            )

        # 🔹 aktualizacja
        cur.execute("""
            UPDATE Reservation
            SET end_date = %s
            WHERE reservation_id = %s
        """, (
            data.end_date,
            id
        ))

        conn.commit()

        return {
            "message": "Pobyt został przedłużony"
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()
        print("DB ERROR:", e)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        cur.close()



@router.put("/{id}/shorten")
def shorten_reservation(id: int, data: schemas.ReservationUpdate, conn=Depends(get_db)):

    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:

        # pobierz rezerwację
        cur.execute("""
            SELECT
                reservation_id,
                start_date,
                end_date
            FROM Reservation
            WHERE reservation_id = %s
        """, (id,))

        reservation = cur.fetchone()

        if not reservation:
            raise HTTPException(
                status_code=404,
                detail="Rezerwacja nie istnieje"
            )

        current_end_date = reservation["end_date"]
        start_date = reservation["start_date"]

        # ❌ nowa data musi być wcześniejsza
        if data.end_date >= current_end_date:
            raise HTTPException(
                status_code=422,
                detail="Nowa data musi być wcześniejsza niż obecna data zakończenia"
            )

        # ❌ nie może być przed początkiem
        if data.end_date <= start_date:
            raise HTTPException(
                status_code=422,
                detail="Data zakończenia musi być późniejsza od daty rozpoczęcia"
            )

        # ❌ nie można ustawić daty z przeszłości
        if data.end_date < datetime.today().date():
            raise HTTPException(
                status_code=422,
                detail="Nie można skrócić pobytu do daty z przeszłości"
            )

        # aktualizacja
        cur.execute("""
            UPDATE Reservation
            SET end_date = %s
            WHERE reservation_id = %s
        """, (
            data.end_date,
            id
        ))

        conn.commit()

        return {
            "message": "Skrócono rezerwację pomyślnie"
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:

        conn.rollback()

        print("DB ERROR:", e)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

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
            datetime.today().strftime("%Y-%m-%d"),
            datetime.today().strftime("%Y-%m-%d"),
            "created",
            "high"
        ))

        conn.commit()

    except Exception as e:
        conn.rollback()
        print("DB ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()


@router.put("/{id}/cancel")
def cancel_reservation(id: int, conn=Depends(get_db)):
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # pobierz rezerwację
        cur.execute("""
            SELECT 
                reservation_id,
                start_date
            FROM Reservation
            WHERE reservation_id = %s
        """, (id,))

        reservation = cur.fetchone()

        if not reservation:
            raise HTTPException(
                status_code=404,
                detail="Rezerwacja nie istnieje"
            )

        # ❌ blokada anulowania starych rezerwacji
        if reservation["start_date"] < datetime.today().date():
            raise HTTPException(
                status_code=422,
                detail="Nie można anulować rezerwacji z przeszłości"
            )

        # usuń powiązanie pokoju
        cur.execute("""
            DELETE FROM Room_Reservation
            WHERE reservation_id = %s
        """, (id,))

        # usuń rezerwację
        cur.execute("""
            DELETE FROM Reservation
            WHERE reservation_id = %s
        """, (id,))

        conn.commit()

        return {
            "message": "Anulowano rezerwację"
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()

        print("DB ERROR:", e)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        cur.close()

@router.get("/{id}/confirmation")
def generate_confirmation_pdf(id: int, conn = Depends(get_db)):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT 
                r.reservation_id, r.start_date, r.end_date, r.status,
                g.first_name, g.last_name,
                rm.room_number,
                rr.actual_price_per_night
            FROM Reservation r
            JOIN Guest g ON r.main_guest_id = g.guest_id
            JOIN Room_reservation rr ON r.reservation_id = rr.reservation_id
            JOIN Room rm ON rr.room_id = rm.room_id
            WHERE r.reservation_id = %s
        """, (id,))
        
        data = cur.fetchone()

        if not data:
            raise HTTPException(status_code=404, detail="Rezerwacja nie istnieje")

        days = (data['end_date'] - data['start_date']).days
        if days < 1:
            days = 1
            
        total_price = days * data['actual_price_per_night']

        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("helvetica", "B", 16)
        
        pdf.cell(0, 10, f"POTWIERDZENIE REZERWACJI NR {data['reservation_id']}", ln=1, align="C")
        pdf.ln(10)

        pdf.set_font("helvetica", "", 12)
        pdf.cell(0, 10, strip_accents(f"Gosc: {data['first_name']} {data['last_name']}"), ln=1)
        pdf.cell(0, 10, strip_accents(f"Pokoj: {data['room_number']}"), ln=1)
        pdf.cell(0, 10, strip_accents(f"Termin pobytu: {data['start_date']} - {data['end_date']} (Liczba nocy: {days})"), ln=1)
        pdf.cell(0, 10, strip_accents(f"Cena za dobe: {data['actual_price_per_night']} PLN"), ln=1)
        
        pdf.ln(5)
        pdf.set_font("helvetica", "B", 14)
        pdf.cell(0, 10, strip_accents(f"Calkowity koszt pobytu: {total_price:.2f} PLN"), ln=1)

        pdf_bytes = pdf.output(dest='S').encode('latin-1', errors='replace')

        headers = {
            "Content-Disposition": f"attachment; filename=potwierdzenie_{data['reservation_id']}.pdf"
        }
        return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)
    finally:
        cur.close()