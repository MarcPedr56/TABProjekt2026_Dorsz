from fastapi import APIRouter, Depends, HTTPException, Query
from database import get_db
from psycopg2.extras import RealDictCursor
from typing import Optional

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/occupancy")
def get_occupancy(start_date: Optional[str] = None, end_date: Optional[str] = None, db=Depends(get_db)):
    cursor = db.cursor(cursor_factory=RealDictCursor)
    try:
        # 1. Pobieramy całkowitą liczbę pokoi
        cursor.execute("SELECT COUNT(*)::int as total FROM room")
        total_rooms = cursor.fetchone()['total']

        # 2. Pobieramy zajęte pokoje łącząc rezerwację z tabelą room_reservation
        # To tutaj był błąd - room_id jest w room_reservation!
        query = """
            SELECT COUNT(DISTINCT rr.room_id)::int as occupied 
            FROM reservation r
            JOIN room_reservation rr ON r.reservation_id = rr.reservation_id
            WHERE r.status NOT IN ('cancelled', 'anulowano')
        """
        params = []
        if start_date and start_date.strip() and end_date and end_date.strip():
            query += " AND r.start_date <= %s AND r.end_date >= %s"
            params = [end_date, start_date]
        
        cursor.execute(query, params)
        occupied_rooms = cursor.fetchone()['occupied']

        rate = round((occupied_rooms * 100.0 / total_rooms), 2) if total_rooms > 0 else 0
        
        return {
            "total_rooms": total_rooms,
            "occupied_rooms": occupied_rooms,
            "occupancy_rate": rate
        }
    except Exception as e:
        print(f"--- BŁĄD SQL OBŁOŻENIA: {e} ---")
        raise HTTPException(status_code=500, detail="Błąd bazy danych przy liczeniu obłożenia")

@router.get("/revenue")
def get_revenue(start_date: Optional[str] = None, end_date: Optional[str] = None, db=Depends(get_db)):
    cursor = db.cursor(cursor_factory=RealDictCursor)
    try:
        query = "SELECT COALESCE(SUM(amount), 0)::float as total_revenue FROM payment WHERE status IN ('zaplacone', 'paid')"
        params = []
        if start_date and start_date.strip() and end_date and end_date.strip():
            query += " AND payment_date BETWEEN %s AND %s"
            params = [start_date, end_date]
        cursor.execute(query, params)
        return cursor.fetchone()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Błąd przychodów")

@router.get("/services-analysis")
def get_services_analysis(start_date: Optional[str] = None, end_date: Optional[str] = None, db=Depends(get_db)):
    cursor = db.cursor(cursor_factory=RealDictCursor)
    try:
        # LEFT JOIN na tabelę service - dzięki temu pokaże NOWE i NIEUŻYWANE usługi
        query = """
            SELECT 
                s.name, 
                COALESCE(SUM(su.quantity), 0)::int as usage_count, 
                COALESCE(SUM(su.actual_price), 0)::float as total_earned
            FROM service s
            LEFT JOIN service_usage su ON s.service_id = su.service_id
        """
        params = []
        if start_date and start_date.strip() and end_date and end_date.strip():
            query += " AND su.usage_date BETWEEN %s AND %s"
            params = [start_date, end_date]
        
        query += " GROUP BY s.name ORDER BY usage_count DESC"
        cursor.execute(query, params)
        return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Błąd analizy usług")

@router.get("/average-stay")
def get_average_stay(start_date: Optional[str] = None, end_date: Optional[str] = None, db=Depends(get_db)):
    cursor = db.cursor(cursor_factory=RealDictCursor)
    try:
        query = "SELECT AVG(CAST(end_date AS DATE) - CAST(start_date AS DATE))::float as avg_days FROM reservation WHERE status NOT IN ('cancelled', 'anulowano')"
        params = []
        if start_date and start_date.strip() and end_date and end_date.strip():
            query += " AND start_date BETWEEN %s AND %s"
            params = [start_date, end_date]
        cursor.execute(query, params)
        res = cursor.fetchone()
        return {"avg_days": round(res['avg_days'], 1) if res and res['avg_days'] else 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Błąd średniego pobytu")

@router.get("/returning-guests")
def get_returning_guests(start_date: Optional[str] = None, end_date: Optional[str] = None, db=Depends(get_db)):
    cursor = db.cursor(cursor_factory=RealDictCursor)
    try:
        # Podstawowe zapytanie
        query = """
            SELECT g.first_name, g.last_name, COUNT(r.reservation_id)::int as reservation_count
            FROM guest g
            JOIN reservation r ON g.guest_id = r.main_guest_id
            WHERE r.status NOT IN ('cancelled', 'anulowano')
        """
        params = []
        
        # Dodajemy filtr daty, jeśli został wybrany
        if start_date and start_date.strip() and end_date and end_date.strip():
            query += " AND r.start_date >= %s AND r.end_date <= %s"
            params = [start_date, end_date]
            
        # Grupowanie i filtracja osób z min. 2 rezerwacjami
        query += """
            GROUP BY g.guest_id, g.first_name, g.last_name
            HAVING COUNT(r.reservation_id) > 1
            ORDER BY reservation_count DESC;
        """
        
        cursor.execute(query, params)
        return cursor.fetchall()
    except Exception as e:
        print(f"Błąd powracających gości: {e}")
        raise HTTPException(status_code=500, detail="Błąd pobierania danych")