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