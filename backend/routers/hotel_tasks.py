from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extras import RealDictCursor
from datetime import datetime
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
            SELECT *
            FROM Hotel_task ht
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
            WHERE r.room_id = %s
        """, (data.room_id,))
        room = cur.fetchone()

        if not room:
            raise HTTPException(status_code=404, detail="Pokój nie istnieje")

        # sprawdź, czy daty zostały odpowiednio podane, jeżeli obie zostały podane
        if data.start_date and data.end_date:
            if not data.start_date <= data.end_date:
                raise HTTPException(status_code=422, detail="Data zakończenia musi być w tem samym dniu lub później, niż data rozpoczęcia")

        price = room["price_per_night"]

        # 🔹 utwórz pracę hotelową
        cur.execute("""
            INSERT INTO Hotel_task 
                    (room_id, description, start_date, end_date, status, priority_level)
            VALUES (%s, %s, %s, %s, 'created', %s')
            RETURNING task_id
        """, (
            data.room_id,
            data.description,
            (datetime.today().strftime("%Y-%M-%D"), data.start_date)[data.start_date != None],
            (datetime.today().strftime("%Y-%M-%D"), data.end_date)[data.end_date != None],
            ("created", data.status)[data.status != None],
            ("normal", data.priority_level)[data.status != None]
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
        # 🔹 znajdź hotel_task
        cur.execute("""
            SELECT ht.task_id
            FROM Hotel_task ht
            WHERE ht.task_id = %s
        """, (id,))
        task = cur.fetchone()

        if not task:
            raise HTTPException(status_code=404, detail="Praca hotelowa nie istnieje")
        
        # 🔹 znajdź employee
        cur.execute("""
            SELECT e.employee_id
            FROM Employee e
            WHERE e.employee_id = %s
        """, (data.employee_id,))
        employee = cur.fetchone()

        if not employee:
            raise HTTPException(status_code=404, detail="Pracownik nie istnieje")
        
        # 🔹 sprawdź, czy pracownik nie został już przypisany do tej pracy
        cur.execute("""
            SELECT te.employee_id, te.task_id
            FROM Task_execution te
            WHERE te.employee_id = %s 
                    AND te.task_id = %s
        """, (data.employee_id,id))
        task_execution = cur.fetchone()

        if task_execution:
            raise HTTPException(status_code=422, detail="Pracownik jest już przypisany do tego zadania hotelowego")

        # 🔹 utwórz nowe task_execution
        cur.execute("""
            INSERT INTO Task_execution 
                    (employee_id, task_id, execution_date)
            VALUES (%s, %s, %s)
            RETURNING task_id
        """, (
            data.employee_id,
            id,
            (datetime.today().strftime("%Y-%M-%D"), data.execution_date)[data.execution_date != None],
        ))

        conn.commit()

    except Exception as e:
        conn.rollback()
        print("DB ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()