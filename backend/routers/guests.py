from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extras import RealDictCursor
from database import get_db
import schemas

router = APIRouter(
    prefix="/guests",
    tags=["Guests"]
)

@router.get("/", response_model=list[schemas.GuestWithEmailResponse])
def get_guests(conn = Depends(get_db)):
    """Pobiera listę wszystkich gości połączonych z emailem z konta"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT 
                g.guest_id, 
                g.first_name, 
                g.last_name, 
                g.pesel, 
                g.phone_number, 
                g.preferences,
                a.email 
            FROM Guest g
            LEFT JOIN Account a ON g.guest_id = a.guest_id
            ORDER BY g.guest_id;
        """)
        guests = cur.fetchall()
        return guests
    except Exception as e:
        print(f"Błąd SQL: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()

@router.post("/", response_model=schemas.GuestResponse)
def add_guest(guest: schemas.GuestCreate, conn = Depends(get_db)):
    """Dodaje nowego gościa do bazy (bez tworzenia konta)"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            INSERT INTO Guest (first_name, last_name, pesel, phone_number, preferences) 
            VALUES (%s, %s, %s, %s, %s) 
            RETURNING guest_id, first_name, last_name, pesel, phone_number, preferences;
        """, (
            guest.first_name, 
            guest.last_name, 
            guest.pesel, 
            guest.phone_number, 
            guest.preferences
        ))
        
        new_guest = cur.fetchone()
        conn.commit()
        return new_guest
    except Exception as e:
        conn.rollback()
        print(f"Błąd SQL: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()