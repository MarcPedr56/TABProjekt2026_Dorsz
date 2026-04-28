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