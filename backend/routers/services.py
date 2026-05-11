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
        # 1. Pobierz dane rezerwacji wraz z jej terminem
        cur.execute("""
            SELECT status, start_date, end_date
            FROM Reservation
            WHERE reservation_id = %s
        """, (data["reservation_id"],))
        res_info = cur.fetchone()

        if not res_info:
            raise HTTPException(status_code=404, detail="Rezerwacja nie istnieje")
        
        if res_info["status"] in ("finished", "cancelled", "anulowano"):
            raise HTTPException(status_code=422, detail="Rezerwacja jest już zakończona lub anulowana")

        # --- NOWA WALIDACJA: CZY GOŚĆ MA WTEDY POKÓJ? ---
        service_date = datetime.strptime(data["usage_date"], "%Y-%m-%d").date()
        res_start = res_info["start_date"]
        res_end = res_info["end_date"]

        if not (res_start <= service_date <= res_end):
            raise HTTPException(
                status_code=422, 
                detail=f"Gość nie ma wynajętego pokoju w dniu {service_date}. Pobyt trwa od {res_start} do {res_end}."
            )

        # 2. Zapis usługi
        full_date = f"{data['usage_date']} {data['usage_time']}"
        dt_object = datetime.strptime(full_date, "%Y-%m-%d %H:%M")

        cur.execute("""
            INSERT INTO service_usage (service_id, reservation_id, quantity, usage_date, actual_price)
            SELECT s.service_id, %s, %s, %s, s.price * %s
            FROM service s WHERE s.service_id = %s
            RETURNING usage_id, actual_price;
        """, (int(data["reservation_id"]), int(data["quantity"]), dt_object, int(data["quantity"]), int(data["service_id"])))

        result = cur.fetchone()
        conn.commit()
        return result

    except HTTPException as e:
        conn.rollback()
        raise e
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Błąd bazy danych")
    finally:
        cur.close()

@router.get("/")
def get_all_services(conn = Depends(get_db)):
    """Pobiera listę wszystkich dostępnych usług w hotelu dla dropdowna"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT * FROM Service ORDER BY name ASC;")
        return cur.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()

@router.put("/{id}/cancel")
def cancel_booking(id: int, conn=Depends(get_db)):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # 1. Znajdź rezerwację serwisu
        cur.execute("""
            SELECT su.usage_id, su.reservation_id, su.usage_date
            FROM service_usage as su
            WHERE su.usage_id = %s
        """, (id,))
        service = cur.fetchone()

        if not service:
            raise HTTPException(status_code=404, detail="Rezerwacja serwisu nie istnieje")

        # 2. Sprawdź czy rezerwacja główna istnieje
        cur.execute("SELECT reservation_id FROM Reservation WHERE reservation_id = %s", (service["reservation_id"],))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Rezerwacja główna nie istnieje")
        
        # 3. WALIDACJA DATY (Poprawione nazwy kluczy!)
        today = date.today()
        # usage_date może być typu datetime, musimy wyciągnąć samo date()
        u_date = service["usage_date"].date() if isinstance(service["usage_date"], datetime) else service["usage_date"]

        if today >= u_date:
            raise HTTPException(
                status_code=422, 
                detail="Nie można anulować usługi w dniu jej wykonania lub z przeszłości"
            )

        # 4. Usuń
        cur.execute("DELETE FROM service_usage WHERE usage_id = %s", (id,))
        conn.commit()
        return {"message": "Usługa anulowana"}

    except HTTPException as e:
        conn.rollback()
        raise e
    except Exception as e:
        conn.rollback()
        print(f"BŁĄD SQL: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()