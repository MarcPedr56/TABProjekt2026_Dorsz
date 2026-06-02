from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extras import RealDictCursor
from datetime import datetime, date
from typing import cast
from database import get_db
import schemas

router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"]
)

@router.get("/", response_model=list[schemas.HotelTaskResponse])
def get_tasks(conn = Depends(get_db)):
    """Pobiera listę prac hotelowych"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT 
                ht.*,
                r.room_number,
                te.employee_id as assigned_employee_id
            FROM Hotel_task ht
            JOIN Room r ON r.room_id = ht.room_id
            LEFT JOIN Task_execution te ON ht.task_id = te.task_id
            ORDER BY ht.priority_level, ht.start_date;
        """)
        return cur.fetchall()
    except Exception as e:
        print(f"Błąd SQL: {e}")
        raise HTTPException(status_code=500, detail="Błąd pobierania prac hotelowych")
    finally:
        cur.close()

@router.get("/{employeeId}", response_model=list[schemas.HotelTaskResponse])
def get_employee_tasks(employeeId: int, conn = Depends(get_db)):
    """Pobiera listę prac hotelowych, do których przypisany jest pracownik o danym id"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT ht.*
            FROM Hotel_task ht
            JOIN Task_execution te ON 
                    te.task_id = ht.task_id
            WHERE te.employee_id = %s
            ORDER BY ht.priority_level, ht.start_date;
        """, (employeeId,))
        return cur.fetchall()
    except Exception as e:
        print(f"Błąd SQL: {e}")
        raise HTTPException(status_code=500, detail="Błąd pobierania prac hotelowych")
    finally:
        cur.close()

@router.post("/")
def create_task(data: schemas.HotelTaskCreate, conn=Depends(get_db)):
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # 🔹 znajdź room
        cur.execute("""
            SELECT r.room_id
            FROM Room r
            WHERE r.room_number = %s
        """, (str(data.room_number),))
        room = cur.fetchone()

        if not room:
            raise HTTPException(status_code=404, detail="Pokój nie istnieje")

        # sprawdź, czy daty zostały odpowiednio podane, jeżeli obie zostały podane
        if data.start_date and data.end_date:
            if not data.start_date <= data.end_date:
                raise HTTPException(status_code=422, detail="Data zakończenia musi być w tym samym dniu lub później, niż data rozpoczęcia")

        # 🔹 utwórz pracę hotelową
        cur.execute("""
            INSERT INTO Hotel_task 
                    (room_id, description, start_date, end_date, status, priority_level)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING task_id
        """, (
            room["room_id"],
            data.description,
            (datetime.today().strftime("%Y-%m-%d"), data.start_date)[data.start_date is not None],
            (datetime.today().strftime("%Y-%m-%d"), data.end_date)[data.end_date is not None],
            ("todo", data.status)[data.status is not None],
            ("normal", data.priority_level)[data.status is not None]
        ))

        task_id = cur.fetchone()["task_id"]

        conn.commit()

        return {
            "task_id": task_id
        }

    except Exception as e:
        conn.rollback()
        print("DB ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()

@router.put("/{id}/status")
def update_task_status(id: int, data: schemas.HotelTaskUpdateStatus, conn=Depends(get_db)):
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # 🔹 znajdź hotel_task
        cur.execute("""
            SELECT ht.task_id
            FROM Hotel_task ht
            WHERE ht.task_id = %s
        """, (id,))
        task = cur.fetchone()

        if not task:
            raise HTTPException(status_code=404, detail="Praca hotelowa nie istnieje")

        # 🔹 zaktualizuj dane pracy hotelowej
        cur.execute("""
            UPDATE Hotel_task as ht
            SET status = %s
            WHERE ht.task_id = %s
        """, (
            data.status,
            id
        ))

        conn.commit()

    except Exception as e:
        conn.rollback()
        print("DB ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()

@router.put("/{id}/assign")
def assign_task(id: int, data: schemas.HotelTaskAssign, conn=Depends(get_db)):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT task_id FROM Hotel_task WHERE task_id = %s", (id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Praca hotelowa nie istnieje")
        
        cur.execute("SELECT employee_id FROM Employee WHERE employee_id = %s", (data.employee_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Wybrany pracownik nie istnieje w bazie")

        cur.execute("SELECT employee_id FROM Task_execution WHERE task_id = %s", (id,))
        existing_assignment = cur.fetchone()

        if existing_assignment:
            cur.execute("""
                UPDATE Task_execution 
                SET employee_id = %s, execution_date = %s
                WHERE task_id = %s
            """, (
                data.employee_id,
                datetime.today().date(),
                id
            ))
            msg = "Pracownik został zmieniony pomyślnie"
        else:
            cur.execute("""
                INSERT INTO Task_execution (employee_id, task_id, execution_date)
                VALUES (%s, %s, %s)
            """, (
                data.employee_id,
                id,
                datetime.today().date()
            ))
            msg = "Pracownik został przypisany pomyślnie"

        conn.commit()
        return {"message": msg}

    except Exception as e:
        conn.rollback()
        print(f"DB ERROR przy przypisywaniu: {e}")
        raise HTTPException(status_code=500, detail="Błąd bazy danych przy przypisywaniu pracownika")
    finally:
        cur.close()