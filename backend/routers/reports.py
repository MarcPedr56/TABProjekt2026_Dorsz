from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from psycopg2.extras import RealDictCursor

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/occupancy")
def get_occupancy(db=Depends(get_db)):
    cursor = db.cursor(cursor_factory=RealDictCursor)
    query = """
        SELECT 
            COUNT(*) as total_rooms,
            COUNT(*) FILTER (WHERE status != 'available') as occupied_rooms,
            ROUND(COUNT(*) FILTER (WHERE status != 'available') * 100.0 / NULLIF(COUNT(*), 0), 2) as occupancy_rate
        FROM room;
    """
    cursor.execute(query)
    return cursor.fetchone()

@router.get("/revenue")
def get_revenue(db=Depends(get_db)):
    cursor = db.cursor(cursor_factory=RealDictCursor)
    query = "SELECT COALESCE(SUM(amount), 0) as total_revenue FROM payment WHERE status = 'zaplacone';"
    cursor.execute(query)
    return cursor.fetchone()

@router.get("/services-analysis")
def get_services_analysis(db=Depends(get_db)):
    cursor = db.cursor(cursor_factory=RealDictCursor)
    query = """
        SELECT s.name, COUNT(su.usage_id) as usage_count, SUM(su.actual_price) as total_earned
        FROM service s
        LEFT JOIN service_usage su ON s.service_id = su.service_id
        GROUP BY s.name
        ORDER BY usage_count DESC;
    """
    cursor.execute(query)
    return cursor.fetchall()

@router.get("/average-stay")
def get_average_stay(db=Depends(get_db)):
    cursor = db.cursor(cursor_factory=RealDictCursor)
    query = """
        SELECT ROUND(AVG(CAST(end_date AS DATE) - CAST(start_date AS DATE))::numeric, 1) as avg_days
        FROM reservation 
        WHERE status != 'cancelled';
    """
    try:
        cursor.execute(query)
        result = cursor.fetchone()
        if result['avg_days'] is None:
            result['avg_days'] = 0
        return result
    except Exception as e:
        print(f"Błąd w raportcie średniej długości: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/returning-guests")
def get_returning_guests(db=Depends(get_db)):
    cursor = db.cursor(cursor_factory=RealDictCursor)
    query = """
        SELECT g.first_name, g.last_name, COUNT(r.reservation_id) as reservation_count
        FROM guest g
        JOIN reservation r ON g.guest_id = r.main_guest_id
        GROUP BY g.guest_id, g.first_name, g.last_name
        HAVING COUNT(r.reservation_id) > 1
        ORDER BY reservation_count DESC;
    """
    cursor.execute(query)
    return cursor.fetchall()