from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extras import RealDictCursor
from database import get_db
import schemas

router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)

@router.get("/", response_model=list[schemas.PaymentResponse])
def get_payments(conn = Depends(get_db)):
    """Pobiera listę wszystkich opłat"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT * FROM Payment ORDER BY status, payment_id;")
        payments = cur.fetchall()
        return payments
    except Exception as e:
        print(f"Błąd SQL: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()

@router.post("/", response_model=schemas.PaymentResponse)
def add_payment(payment: schemas.PaymentCreate, conn = Depends(get_db)):
    """Dodaje nową opłatę do bazy"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            INSERT INTO Payment (reservation_id, amount, method, status, type, invoice_number) 
            VALUES (%s, %s, %s, %s, %s, %s) 
            RETURNING payment_id, reservation_id, amount, method, status, type, invoice_number, payment_date;
        """, (
            payment.reservation_id,
            payment.amount,
            payment.method,
            payment.status,
            payment.type,
            payment.invoice_number
        ))
        
        new_payment = cur.fetchone()
        conn.commit()
        return new_payment
    except Exception as e:
        conn.rollback()
        print(f"Błąd SQL: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()

@router.get("/pesel/{pesel}", response_model=list[schemas.PaymentResponse])
def get_payments_by_pesel(pesel: str, conn = Depends(get_db)):
    """Wyszukuje płatności powiązane z konkretnym numerem PESEL gościa"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT p.* FROM Payment p
            JOIN Reservation r ON p.reservation_id = r.reservation_id
            JOIN Guest g ON r.main_guest_id = g.guest_id
            WHERE g.pesel = %s
            ORDER BY p.status, p.payment_date DESC;
        """, (pesel,))
        return cur.fetchall()
    except Exception as e:
        print(f"Błąd SQL: {e}")
        raise HTTPException(status_code=500, detail="Błąd bazy danych podczas wyszukiwania")
    finally:
        cur.close()

@router.put("/{id}")
def update_payment(id: int, data: schemas.PaymentUpdate, conn = Depends(get_db)):
    """Zmienia metodę i status płatności o danym id"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # znajdź płatność
        cur.execute("""
            SELECT p.payment_id
            FROM Payment p
            WHERE p.payment_id = %s;
        """, (id,))
    
        payment = cur.fetchone()

        if not payment:
            raise HTTPException(status_code=404, detail="Płatność nie istnieje")
        
        # 🔹 zaktualizuj dane płatności
        cur.execute("""
            UPDATE Payment as p
            SET method = %s, status = %s
            WHERE p.payment_id = %s;
        """, (
            data.method,
            data.status,
            payment["payment_id"]
        ))

        conn.commit()

    except Exception as e:
        print(f"Błąd SQL: {e}")
        raise HTTPException(status_code=500, detail="Błąd bazy danych podczas wyszukiwania")
    finally:
        cur.close()