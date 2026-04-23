# --- Other API endpoints
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

def loadEndpoints(app: FastAPI):

    # --- main page
    @app.get("/")
    def home():
        return {"message": "Serwer hotelowy działa!", "status": "online"}