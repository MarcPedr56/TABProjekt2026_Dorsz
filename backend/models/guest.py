# --- Guest entity class file

class Guest:
    guest_id: int
    first_name: str
    last_name: str
    pesel: str
    phone_number: str
    email: str

    def __init__(self, first_name: str, last_name: str, pesel:str, phone_number: str, email:str):
        self.first_name = first_name
        self.last_name = last_name
        self.pesel = pesel
        self.phone_number = phone_number
        self.email = email