from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from routers import rooms, guests
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rooms.router)
app.include_router(guests.router)

@app.get("/", tags=["Health Check"])
def root():
    """Endpoint sprawdzający czy system zyje"""
    return {
        "status": "running",
        "project_name": settings.PROJECT_NAME,
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    # Odpalanie serwera ręcznie, jeśli nie używasz komendy w terminalu.
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)