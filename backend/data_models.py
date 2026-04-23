# --- Pydantic data models, used to define React entity data requested by backend when creating / updating
from pydantic import BaseModel
from typing import Optional

class GuestCreate(BaseModel):
    first_name: str
    last_name: str
    pesel: Optional[str] = None
    phone_number: Optional[str] = None
    e_mail: Optional[str] = None
    preferences: Optional[str] = None