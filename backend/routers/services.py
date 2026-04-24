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