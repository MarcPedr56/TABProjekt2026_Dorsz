# --- Room API endpoints
from fastapi import FastAPI, HTTPException
import psycopg2
import os
from psycopg2.extras import RealDictCursor
#from main import get_db_connection

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASS"),
            port=os.getenv("DB_PORT"),
            sslmode="require"
        )
        return conn
    except Exception as e:
        print(f"Błąd połączenia z bazą: {e}")
        return None

def loadEndpoints(app: FastAPI):

    # --- fetch all rooms
    @app.get("/rooms")
    def get_rooms():
        """Pobiera listę wszystkich pokoi"""
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Brak połączenia z bazą danych")
        
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            # Sortujemy po właściwej nazwie kolumny z Twojej bazy (room_id)
            cur.execute("SELECT * FROM Room ORDER BY room_id;")
            rooms = cur.fetchall()
            cur.close()
            conn.close()
            return rooms
        except Exception as e:
            print(f"Błąd SQL: {e}")
            if conn:
                conn.close()
            raise HTTPException(status_code=500, detail=str(e))