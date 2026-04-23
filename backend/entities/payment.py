# --- Payment entity class file
from datetime import date

class Payment:
    payment_id: int
    reservation_id: int
    amount: float
    method: str
    date: date
    status: str
    type: str
    invoice_number: int

    def __init__(self, reservation_id: int, amount: float, method:str,
                 date: date, status: str, type: str, invoice_number: int):
        self.reservation_id = reservation_id
        self.amount = amount
        self.method = method
        self.date = date
        self.status = status
        self.type = type
        self.invoice_number = invoice_number