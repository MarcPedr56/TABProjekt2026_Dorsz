import os
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from endpoints import other_endpoints
from endpoints import room_endpoints
from endpoints import guest_endpoints

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

# --- MODELE DANYCH (Pydantic) ---
# Definiują, jakich danych backend oczekuje od Reacta przy dodawaniu (POST)

# --- ENDPOINTY (Trasy API) ---

other_endpoints.loadEndpoints(app)
room_endpoints.loadEndpoints(app)
guest_endpoints.loadEndpoints(app)