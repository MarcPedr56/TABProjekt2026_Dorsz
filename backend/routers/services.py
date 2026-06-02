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
                su.status
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
                su.status
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
        # 1. Pobierz info o rezerwacji
        cur.execute("SELECT status, start_date, end_date FROM Reservation WHERE reservation_id = %s", (data["reservation_id"],))
        res_info = cur.fetchone()
        if not res_info: raise HTTPException(status_code=404, detail="Rezerwacja nie istnieje")

        # 2. Walidacja daty usługi (czy mieści się w pobycie)
        service_date = datetime.strptime(data["usage_date"], "%Y-%m-%d").date()
        if not (res_info["start_date"] <= service_date <= res_info["end_date"]):
            raise HTTPException(status_code=422, detail="Usługa poza terminem pobytu")
        
        full_date = f"{data['usage_date']} {data['usage_time']}"
        dt_object = datetime.strptime(full_date, "%Y-%m-%d %H:%M")

        if datetime.now() > dt_object: 
            raise HTTPException(status_code=422, detail="Podany termin już minął")
        
        # 3. Sprawdzenie, czy nie został już osiągnięty limit rezerwacji tej usługi

        # pozostałe miejsca rezerwacji tej usługi
        cur.execute("""
            SELECT s.usage_limit - COUNT(su.service_id) as remaining
            FROM Service_usage as su
            JOIN Service s on s.service_id = su.service_id
            WHERE su.service_id = %s
                AND status NOT IN ('Confirmed', 'Ended')
			GROUP BY s.service_id;
        """, (int(data["service_id"]),))
        count = cur.fetchone()

        if int(count["remaining"]) <= 0:
            raise HTTPException(status_code=409, detail="Osiągnięto limit rezerwacji tej usługi")

        # 4. Zapis usługi i pobranie ceny
        cur.execute("""
            INSERT INTO service_usage (service_id, reservation_id, quantity, usage_date, actual_price, status)
            SELECT s.service_id, %s, %s, %s, s.price * %s, %s
            FROM service s WHERE s.service_id = %s
            RETURNING usage_id, actual_price;
        """, (int(data["reservation_id"]), int(data["quantity"]), dt_object, int(data["quantity"]), "Created", int(data["service_id"])))

        result = cur.fetchone()

        # --- KLUCZOWA POPRAWKA: Aktualizacja tabeli Payment ---
        if result:
            cur.execute("""
                UPDATE Payment 
                SET amount = amount + %s 
                WHERE reservation_id = %s
            """, (result["actual_price"], int(data["reservation_id"])))

        conn.commit()
        return result
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
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

@router.get("/{id}")
def get_service_availability(id: int, conn = Depends(get_db)):
    """Pobiera liczbę dostępnych miejsc rezerwacji usługi o podanym id"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # Znajdź usługę o podanym id
        cur.execute("""
            SELECT *
            FROM Service
            WHERE service_id = %s;
        """, (id,))
        service = cur.fetchone()

        if not service:
            raise HTTPException(status_code=404, detail="Usługa o podanym id nie istnieje")
        
        # Policz pozostałe miejsca rezerwacji tej usługi
        cur.execute("""
            SELECT s.usage_limit - COUNT(su.service_id) as remaining
            FROM Service_usage as su
            JOIN Service s on s.service_id = su.service_id
            WHERE su.service_id = %s
                AND status NOT IN ('Confirmed', 'Ended')
			GROUP BY s.service_id;
        """, (id,))
        count = cur.fetchone()

        return count()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()

@router.put("/{id}/cancel")
def cancel_booking(id: int, conn=Depends(get_db)):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # Znajdź rezerwację serwisu i jej wyliczoną kwotę
        cur.execute("""
            SELECT su.usage_id, su.reservation_id, su.usage_date, su.actual_price
            FROM service_usage as su
            WHERE su.usage_id = %s
        """, (id,))
        service = cur.fetchone()

        if not service:
            raise HTTPException(status_code=404, detail="Rezerwacja serwisu nie istnieje")

        cur.execute("SELECT reservation_id FROM Reservation WHERE reservation_id = %s", (service["reservation_id"],))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Rezerwacja główna nie istnieje")
        
        today = date.today()
        u_date = service["usage_date"].date() if isinstance(service["usage_date"], datetime) else service["usage_date"]

        if today >= u_date:
            raise HTTPException(
                status_code=422, 
                detail="Nie można anulować usługi w dniu jej wykonania lub z przeszłości"
            )

        # --- ZMNIEJSZENIE GŁÓWNEGO RACHUNKU ---
        cur.execute("""
            UPDATE Payment 
            SET amount = amount - %s 
            WHERE reservation_id = %s
        """, (service["actual_price"], service["reservation_id"]))

        # Usuń usługę
        cur.execute("DELETE FROM service_usage WHERE usage_id = %s", (id,))
        
        conn.commit()
        return {"message": "Usługa anulowana i rachunek pomniejszony"}

    except HTTPException as e:
        conn.rollback()
        raise e
    except Exception as e:
        conn.rollback()
        print(f"BŁĄD SQL: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()