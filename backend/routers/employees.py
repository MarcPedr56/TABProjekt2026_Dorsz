from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extras import RealDictCursor
from database import get_db
import schemas

router = APIRouter(
    prefix="/employees",
    tags=["Employees"]
)

@router.get("/", response_model=list[schemas.EmployeeWithEmailResponse])
def get_employees(conn = Depends(get_db)):
    """Pobiera listę pracowników wraz z ich e-mailami z tabeli Account"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT 
                e.*, 
                a.email, 
                r.name as role_name
            FROM Employee e
            LEFT JOIN Account a ON e.employee_id = a.employee_id
            LEFT JOIN Role r ON a.role_id = r.role_id
            ORDER BY e.employee_id;
        """)
        return cur.fetchall()
    except Exception as e:
        print(f"Błąd SQL: {e}")
        raise HTTPException(status_code=500, detail="Błąd pobierania pracowników")
    finally:
        cur.close()