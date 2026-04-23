# --- Payment entity class file
from datetime import date

class Payment:
    paymentId: int
    reservationId: int
    amount: float
    method: str
    date: date
    status: str
    type: str
    invoiceNumber: int

    def __init__(self, reservationId: int, amount: float, method:str,
                 date: date, status: str, type: str, invoiceNumber: int):
        self.reservationId = reservationId
        self.amount = amount
        self.method = method
        self.date = date
        self.status = status
        self.type = type
        self.invoiceNumber = invoiceNumber