from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from routers import rooms, guests, payments, reservations, employees, services, auth
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
app.include_router(payments.router)
app.include_router(reservations.router)
app.include_router(employees.router)
app.include_router(services.router)
app.include_router(auth.router)


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
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)