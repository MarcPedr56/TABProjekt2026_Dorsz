# --- Payment API endpoints
from fastapi import FastAPI, HTTPException
from psycopg2.extras import RealDictCursor
from db_connection import get_db_connection
from data_models import PaymentCreate

def loadEndpoints(app: FastAPI):

    # --- fetch all payments
    @app.get("/payments")
    def get_payments():
        """Pobiera listę wszystkich opłat"""
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Brak połączenia z bazą danych")
        
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT * FROM Payment ORDER BY payment_id;")
            payments = cur.fetchall()
            cur.close()
            conn.close()
            return payments
        except Exception as e:
            print(f"Błąd SQL: {e}")
            if conn:
                conn.close()
            raise HTTPException(status_code=500, detail=str(e))
        

    # --- create a new payment
    @app.post("/payments")
    def add_payment(payment: PaymentCreate):
        """Dodaje nową opłatę do bazy"""
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Brak połączenia z bazą danych")
        
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            # Dodajemy opłatę i od razu zwracamy jej wygenerowane payment_id
            cur.execute("""
                INSERT INTO Payment (reservation_id, amount, method, payment_date, status, type, invoice_number) 
                VALUES (%s, %s, %s, %s, %s, %s, %s) 
                RETURNING payment_id;
            """, (
                payment.reservation_id,
                payment.amount,
                payment.method,
                payment.payment_date,
                payment.status,
                payment.type,
                payment.invoice_number
            ))
            
            new_id = cur.fetchone()['payment_id'] # pyright: ignore[reportOptionalSubscript]
            conn.commit() # Zatwierdzamy zmiany w bazie
            cur.close()
            conn.close()
            
            return {
                "status": "success", 
                "payment_id": new_id, 
                "message": f"Pomyślnie dodano opłatę: {payment.reservation_id} {payment.amount}"
            }
        except Exception as e:
            print(f"Błąd SQL: {e}")
            if conn:
                conn.rollback() # Cofa operację w razie błędu
                conn.close()
            raise HTTPException(status_code=500, detail=str(e))