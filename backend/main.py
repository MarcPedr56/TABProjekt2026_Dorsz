from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_CONFIG = {
    "host": "localhost",
    "database": "hotel_system",
    "user": "postgres",
    "password": "hotel12",
    "port": "5433"
}

@app.get("/rooms")
def get_rooms():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM Room")
    rooms = cur.fetchall()
    cur.close()
    conn.close()
    return rooms

# Uruchomienie: uvicorn main:app --reload