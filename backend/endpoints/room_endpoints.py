# --- Room API endpoints
from fastapi import FastAPI, HTTPException
from psycopg2.extras import RealDictCursor
from main import get_db_connection

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