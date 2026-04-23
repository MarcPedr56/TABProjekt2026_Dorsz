# --- Guest API endpoints
from fastapi import FastAPI, HTTPException
from psycopg2.extras import RealDictCursor
from db_connection import get_db_connection
from data_models import GuestCreate

def loadEndpoints(app: FastAPI):

    # --- fetch all guests
    @app.get("/guests")
    def get_guests():
        """Pobiera listę wszystkich gości"""
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Brak połączenia z bazą danych")
        
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT * FROM Guest ORDER BY guest_id;")
            guests = cur.fetchall()
            cur.close()
            conn.close()
            return guests
        except Exception as e:
            print(f"Błąd SQL: {e}")
            if conn:
                conn.close()
            raise HTTPException(status_code=500, detail=str(e))
        

    # --- create a new guest
    @app.post("/guests")
    def add_guest(guest: GuestCreate):
        """Dodaje nowego gościa do bazy"""
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Brak połączenia z bazą danych")
        
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            # Dodajemy gościa i od razu zwracamy jego wygenerowane guest_id
            cur.execute("""
                INSERT INTO Guest (first_name, last_name, pesel, phone_number, e_mail, preferences) 
                VALUES (%s, %s, %s, %s, %s, %s) 
                RETURNING guest_id;
            """, (
                guest.first_name, 
                guest.last_name, 
                guest.pesel, 
                guest.phone_number, 
                guest.e_mail, 
                guest.preferences
            ))
            
            new_id = cur.fetchone()['guest_id'] # pyright: ignore[reportOptionalSubscript]
            conn.commit() # Zatwierdzamy zmiany w bazie
            cur.close()
            conn.close()
            
            return {
                "status": "success", 
                "guest_id": new_id, 
                "message": f"Pomyślnie dodano gościa: {guest.first_name} {guest.last_name}"
            }
        except Exception as e:
            print(f"Błąd SQL: {e}")
            if conn:
                conn.rollback() # Cofa operację w razie błędu
                conn.close()
            raise HTTPException(status_code=500, detail=str(e))