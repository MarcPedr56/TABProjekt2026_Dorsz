from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extras import RealDictCursor
from database import get_db
import schemas
from datetime import date, timedelta
from fastapi import Query

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

@router.get("/available")
def get_available_rooms(
    start_date: date = Query(...),
    end_date: date = Query(...),
    conn=Depends(get_db)
):
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            SELECT *
            FROM Room r
            WHERE r.room_id NOT IN (
                SELECT rr.room_id
                FROM Room_reservation rr
                JOIN Reservation re
                    ON rr.reservation_id = re.reservation_id
                WHERE
                    re.status != 'cancelled'
                    AND (
                        re.start_date,
                        re.end_date
                    ) OVERLAPS (%s, %s)
            )
            ORDER BY r.room_id;
        """, (start_date, end_date))

        rooms = cur.fetchall()
        return rooms

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()

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

@router.get("/{room_number}/calendar")
def get_room_unavailabile_days(room_number: str, start_date: date, end_date: date, conn = Depends(get_db)):
    """Pobiera dni, w które pokój jest zajęty"""
    cur = conn.cursor(cursor_factory=RealDictCursor)

    delta = end_date - start_date   # returns timedelta

    days: list = list()

    for i in range(delta.days + 1):
        day = start_date + timedelta(days=i)
        days.append(day.strftime("%Y-%m-%d"))

    daysString: str = ""
    for day in days:
        daysString += "('{date}'),".format(date = day)

    daysString = daysString[:-1]

    queryString = """
            SELECT d.day
            FROM (values{daysArray}) as d(day)
            WHERE EXISTS 
                (SELECT re.reservation_id
                FROM Reservation re
                JOIN Room_reservation rr ON re.reservation_id = rr.reservation_id
                JOIN Room ro ON rr.room_id = rr.room_id
                WHERE ro.room_number = '{roomNumber}'
                    AND to_TIMESTAMP(d.day,'YYYY-MM-DD') 
                        BETWEEN re.start_date 
                        AND re.end_date);
        """.format(
            daysArray = daysString,
            roomNumber = room_number,
            startDate = start_date,
            endDate = end_date)
    try:
        cur.execute(queryString)
        unavailableDays = cur.fetchall()
        return unavailableDays
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()