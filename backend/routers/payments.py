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
        cur.execute("SELECT * FROM Payment ORDER BY payment_id;")
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
            ORDER BY p.payment_date DESC;
        """, (pesel,))
        return cur.fetchall()
    except Exception as e:
        print(f"Błąd SQL: {e}")
        raise HTTPException(status_code=500, detail="Błąd bazy danych podczas wyszukiwania")
    finally:
        cur.close()

@router.get("/pesel/{reservation_id}", response_model=list[schemas.PaymentResponse])
def get_payments_by_reservation_id(reservation_id: int, conn = Depends(get_db)):
    """Wyszukuje płatności powiązane z konkretnym id rezerwacji"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT p.* FROM Payment p
            WHERE p.reservation_id = %d
            ORDER BY p.payment_date DESC;
        """, (reservation_id,))
        return cur.fetchall()
    except Exception as e:
        print(f"Błąd SQL: {e}")
        raise HTTPException(status_code=500, detail="Błąd bazy danych podczas wyszukiwania")
    finally:
        cur.close()