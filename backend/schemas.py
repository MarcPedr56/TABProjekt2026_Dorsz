# --- Pydantic data models, used to define React entity data requested by backend when creating / updating
from pydantic import BaseModel
from typing import Optional
from datetime import date

# --- Create Data Models

class GuestCreate(BaseModel):
    first_name: str
    last_name: str
    pesel: Optional[str] = None
    phone_number: Optional[str] = None
    e_mail: Optional[str] = None
    preferences: Optional[str] = None

class RoomCreate(BaseModel):
    room_number: int
    room_type: str
    price_per_night: Optional[float] = None
    floor_number: int
    equipment: Optional[str] = None
    status: str

class PaymentCreate(BaseModel):
    reservation_id: int
    amount: float
    method: str
    payment_date: date
    status: str
    type: str
    invoice_number: Optional[int] = None