from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional, List
from datetime import date, datetime

# ==========================
# KONFIGURACJA BAZOWA
# ==========================
class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

# ==========================
# 1. ROLA (Role)
# ==========================
class RoleBase(BaseSchema):
    name: str = Field(..., max_length=20)

class RoleResponse(RoleBase):
    role_id: int

# ==========================
# 2. GOŚĆ (Guest)
# ==========================
class GuestBase(BaseSchema):
    first_name: str = Field(..., max_length=50)
    last_name: str = Field(..., max_length=100)
    pesel: Optional[str] = Field(None, max_length=20)
    phone_number: Optional[str] = Field(None, max_length=20)
    preferences: Optional[str] = None

class GuestCreate(GuestBase):
    pass

class GuestResponse(GuestBase):
    guest_id: int

# ==========================
# 3. PRACOWNIK (Employee)
# ==========================
class EmployeeBase(BaseSchema):
    first_name: str = Field(..., max_length=50)
    last_name: str = Field(..., max_length=100)
    document_number: Optional[str] = Field(None, max_length=20)
    phone_number: Optional[str] = Field(None, max_length=20)
    position: str = Field(..., max_length=50)

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeResponse(EmployeeBase):
    employee_id: int

# ==========================
# 4. KONTO (Account)
# ==========================
class AccountBase(BaseSchema):
    email: EmailStr
    role_id: int
    is_active: bool = True

class AccountCreate(AccountBase):
    password: str = Field(..., min_length=6)
    guest_id: Optional[int] = None
    employee_id: Optional[int] = None

class AccountResponse(AccountBase):
    account_id: int
    created_at: datetime
    guest_id: Optional[int] = None
    employee_id: Optional[int] = None

# ==========================
# WIDOKI ZŁĄCZONE (JOIN) - DLA FRONTENDU
# ==========================
class GuestWithEmailResponse(GuestResponse):
    email: EmailStr

class EmployeeWithEmailResponse(EmployeeResponse):
    email: EmailStr
    role_name: str

# ==========================
# 5. POKÓJ (Room)
# ==========================
class RoomBase(BaseSchema):
    room_number: str = Field(..., max_length=10)
    room_type: str = Field(..., max_length=50)
    price_per_night: float = Field(..., gt=0)
    floor_number: Optional[int] = None
    equipment: Optional[str] = None
    status: str = "available"

class RoomCreate(RoomBase):
    pass

class RoomResponse(RoomBase):
    room_id: int

# ==========================
# 6. REZERWACJA (Reservation)
# ==========================
class ReservationBase(BaseSchema):
    start_date: date
    end_date: date
    status: str = "created"
    type: Optional[str] = None

class ReservationCreate(ReservationBase):
    main_guest_id: int

class ReservationResponse(ReservationBase):
    reservation_id: int
    main_guest_id: int
    creation_date: datetime

# ==========================
# 7. PRZYPISANIE POKOJU DO REZERWACJI (Room_Reservation)
# ==========================
class RoomReservationBase(BaseSchema):
    room_id: int
    reservation_id: int
    actual_price_per_night: float

class RoomReservationCreate(RoomReservationBase):
    pass

class RoomReservationResponse(RoomReservationBase):
    pass

# ==========================
# 8. USŁUGA (Service)
# ==========================
class ServiceBase(BaseSchema):
    name: str = Field(..., max_length=100)
    price: float = Field(..., ge=0)

class ServiceCreate(ServiceBase):
    pass

class ServiceResponse(ServiceBase):
    service_id: int

# ==========================
# 9. ZUŻYCIE USŁUGI (Service_Usage)
# ==========================
class ServiceUsageBase(BaseSchema):
    service_id: int
    reservation_id: int
    quantity: int = 1
    actual_price: float

class ServiceUsageCreate(ServiceUsageBase):
    pass

class ServiceUsageResponse(ServiceUsageBase):
    usage_id: int
    usage_date: datetime

# ==========================
# 10. PŁATNOŚĆ (Payment)
# ==========================
class PaymentBase(BaseSchema):
    reservation_id: int
    amount: float = Field(..., gt=0)
    method: str = Field(..., max_length=30)
    status: str = "pending"
    type: Optional[str] = None
    invoice_number: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    payment_id: int
    payment_date: datetime

# ==========================
# 11. ZADANIE HOTELOWE (Hotel_Task)
# ==========================
class HotelTaskBase(BaseSchema):
    room_id: Optional[int] = None
    description: str
    status: str = "todo"
    priority_level: str = "normal"

class HotelTaskCreate(HotelTaskBase):
    pass

class HotelTaskResponse(HotelTaskBase):
    task_id: int
    start_date: Optional[datetime]
    end_date: Optional[datetime]

# ==========================
# 12. WYKONANIE ZADANIA (Task_Execution)
# ==========================
class TaskExecutionBase(BaseSchema):
    employee_id: int
    task_id: int

class TaskExecutionCreate(TaskExecutionBase):
    pass

class TaskExecutionResponse(TaskExecutionBase):
    execution_date: datetime