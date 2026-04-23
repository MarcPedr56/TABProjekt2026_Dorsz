# --- Room API endpoints
from fastapi import FastAPI, HTTPException
from psycopg2.extras import RealDictCursor
from db_connection import get_db_connection
from data_models import RoomCreate

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
        
    # --- create a new room
    @app.post("/rooms")
    def add_room(room: RoomCreate):
        """Dodaje nowy pokój do bazy"""
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Brak połączenia z bazą danych")
        
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            # Dodajemy pokój i od razu zwracamy jego wygenerowane room_id
            cur.execute("""
                INSERT INTO Room (room_number, room_type, price_per_night, floor_number, equipment, status) 
                VALUES (%s, %s, %s, %s, %s, %s) 
                RETURNING room_id;
            """, (
                room.room_number,
                room.room_type,
                room.price_per_night,
                room.floor_number,
                room.status,
                room.equipment
            ))
            
            new_id = cur.fetchone()['room_id'] # pyright: ignore[reportOptionalSubscript]
            conn.commit() # Zatwierdzamy zmiany w bazie
            cur.close()
            conn.close()
            
            return {
                "status": "success", 
                "room_id": new_id, 
                "message": f"Pomyślnie dodano pokój: {room.room_number} {room.floor_number} {room.room_type}"
            }
        except Exception as e:
            print(f"Błąd SQL: {e}")
            if conn:
                conn.rollback() # Cofa operację w razie błędu
                conn.close()
            raise HTTPException(status_code=500, detail=str(e))