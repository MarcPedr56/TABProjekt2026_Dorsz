from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extras import RealDictCursor
from database import get_db

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
                'Zrealizowano' as status
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

@router.post("/book")
def book_service(data: dict, conn = Depends(get_db)):
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            INSERT INTO service_usage (service_id, reservation_id, quantity, actual_price)
            SELECT 
                s.service_id,
                %s,
                %s,
                s.price * %s
            FROM service s
            WHERE s.service_id = %s
            RETURNING usage_id, actual_price;
        """, (
            data["reservation_id"],
            data["quantity"],
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