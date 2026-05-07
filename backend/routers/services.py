from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extras import RealDictCursor
from database import get_db
from datetime import datetime, timedelta, date, time

router = APIRouter(
    prefix="/services",
    tags=["Services"]
)

@router.get("/user/{email}")
def get_user_services(email: str, conn = Depends(get_db)):
    """Wyszukuje wykonane usługi dla danego konta po emailu"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT 
                s.name, 
                TO_CHAR(su.usage_date, 'YYYY-MM-DD HH24:MI') as date, 
                'null' as status
            FROM Service_Usage su
            JOIN Service s ON su.service_id = s.service_id
            JOIN Reservation r ON su.reservation_id = r.reservation_id
            JOIN Guest g ON r.main_guest_id = g.guest_id
            JOIN Account a ON g.guest_id = a.guest_id
            WHERE a.email = %s
            ORDER BY su.usage_date DESC;
        """, (email,))
        return cur.fetchall()
    except Exception as e:
        print(f"Błąd SQL: {e}")
        raise HTTPException(status_code=500, detail="Błąd pobierania usług")
    finally:
        cur.close()

@router.get("/reservation/{reservationId}")
def get_reservation_services(reservationId: int, conn = Depends(get_db)):
    """Wyszukuje wykonane usługi dla danej rezerwacji po id"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT
                su.usage_id,
                s.name, 
                TO_CHAR(su.usage_date, 'YYYY-MM-DD HH24:MI') as date, 
                'Ilość' as quantity,
                'Cena łącznie' as actual_price,
                'null' as status
            FROM Service_Usage su
            JOIN Service s ON su.service_id = s.service_id
            JOIN Reservation r ON su.reservation_id = r.reservation_id
            WHERE r.reservation_id = %s
            ORDER BY su.usage_date DESC;
        """, (reservationId,))
        return cur.fetchall()
    except Exception as e:
        print(f"Błąd SQL: {e}")
        raise HTTPException(status_code=500, detail="Błąd pobierania usług")
    finally:
        cur.close()

@router.post("/book")
def book_service(data: dict, conn = Depends(get_db)):
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # 🔹 znajdź rezerwacje
        cur.execute("""
            SELECT re.reservation_id, rr.room_id, re.status
            FROM Reservation re
            JOIN Room_reservation rr ON re.reservation_id = rr.reservation_id
            WHERE re.reservation_id = %s
        """, (data["reservation_id"],))
        reservation = cur.fetchone()

        if not reservation:
            raise HTTPException(status_code=404, detail="Rezerwacja nie istnieje")
        
        if (reservation["status"] in ("created", "finished")):
            raise HTTPException(status_code=422, detail="Zakaz rezerwowania serwisów dla rezerwacji, która już się skończyła lub nie została potwierdzona")

        cur.execute("""
            INSERT INTO service_usage (service_id, reservation_id, quantity, usage_date, actual_price)
            SELECT 
                s.service_id,
                %s,
                %s,
                %s,
                s.price * %s
            FROM service s
            WHERE s.service_id = %s
            RETURNING usage_id, actual_price;
        """, (
            data["reservation_id"],
            data["quantity"],
            datetime.combine(datetime.strptime(data["usage_date"], "%Y-%m-%d").date(), datetime.strptime(data["usage_time"], "%H:%M").time()),
            data["quantity"],
            data["service_id"]
        ))

        result = cur.fetchone()
        conn.commit()

        return result

    except Exception as e:
        conn.rollback()
        print("Błąd:", e)
        raise HTTPException(status_code=500, detail="Błąd zapisu")

    finally:
        cur.close()

@router.put("/{id}/cancel")
def cancel_booking(id: int, conn=Depends(get_db)):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # 🔹 znajdź rezerwacje serwisu
        cur.execute("""
            SELECT su.usage_id, su.reservation_id, su.usage_date
            FROM Service_usage as su
            WHERE su.usage_id = %s
        """, (id,))
        service = cur.fetchone()

        if not service:
            raise HTTPException(status_code=404, detail="Rezerwacja serwisu nie istnieje")

        # 🔹 znajdź rezerwacje
        cur.execute("""
            SELECT re.reservation_id
            FROM Reservation re
            WHERE re.reservation_id = %s
        """, (service["reservation_id"],))
        reservation = cur.fetchone()

        if not reservation:
            raise HTTPException(status_code=404, detail="Rezerwacja nie istnieje")
        
        if (datetime.today().date() >= service["usage_date"].date()):
            raise HTTPException(status_code=404, detail="Nie można anulować rezerwacji serwisu w dzień jej wykonania lub po jej zakończeniu")
        if service["date"] < datetime.today().date():
            raise HTTPException(
                status_code=422,
                detail="Nie można anulować usługi z przeszłości"
        )
        # 🔹 usuń rezerwację serwisu
        cur.execute("""
            DELETE FROM Service_usage as su
            WHERE su.usage_id = %s
        """, (
            service["usage_id"],
        ))

        conn.commit()

    except Exception as e:
        conn.rollback()
        print("DB ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()