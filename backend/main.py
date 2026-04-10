import os
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

# 1. Wczytanie konfiguracji z pliku .env
load_dotenv()

# 2. Inicjalizacja aplikacji FastAPI
app = FastAPI(title="Hotel System API")

# 3. Konfiguracja CORS - żeby React mógł rozmawiać z Pythonem
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Funkcja łącząca z bazą danych na Azure
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

# --- MODELE DANYCH (Pydantic) ---
# Definiują, jakich danych backend oczekuje od Reacta przy dodawaniu (POST)

class GuestCreate(BaseModel):
    first_name: str
    last_name: str
    pesel: Optional[str] = None
    phone_number: Optional[str] = None
    e_mail: Optional[str] = None
    preferences: Optional[str] = None


# --- ENDPOINTY (Trasy API) ---

@app.get("/")
def home():
    return {"message": "Serwer hotelowy działa!", "status": "online"}

# --- POKOJE ---

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


# --- GOŚCIE ---

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
        
        new_id = cur.fetchone()['guest_id']
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