from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extras import RealDictCursor
from database import get_db
import schemas

router = APIRouter(
    prefix="/rooms",
    tags=["Rooms"]
)

@router.get("/")
def get_rooms(conn = Depends(get_db)):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM Room ORDER BY room_id;")
    return cur.fetchall()

@router.get("/{room_number}/availability", response_model=list[schemas.RoomAvailabilityResponse])
def get_room_availability(room_number: str, data: schemas.RoomAvailability, conn = Depends(get_db)):
    """Pobiera status pokoju po jego id"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT re.reservation_id, re.start_date, re.end_date, re.status
            FROM Reservation re
            JOIN Room_reservation rr ON re.reservation_id = rr.reservation_id
            JOIN Room ro ON rr.room_id = rr.room_id
            WHERE ro.room_number = %s
                    AND (SELECT (re.start_date, re.end_date) 
                        OVERLAPS (%s, %s));
        """, (room_number, data.start_date, data.end_date))
        new_room = cur.fetchone()
        
        return new_room
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()

@router.post("/", response_model=schemas.RoomResponse)
def add_room(room: schemas.RoomCreate, conn = Depends(get_db)):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            INSERT INTO Room (room_number, room_type, price_per_night, floor_number, equipment, status)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING room_id, room_number, room_type, price_per_night, floor_number, equipment, status;
        """, (room.room_number, room.room_type, room.price_per_night, room.floor_number, room.equipment, room.status))
        new_room = cur.fetchone()
        conn.commit()
        return new_room
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()