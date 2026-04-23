# --- Guest entity class file

class Guest:
    guestId: int
    firstName: str
    lastName: str
    pesel: str
    phoneNumber: str
    email: str

    def __init__(self, firstName: str, lastName: str, pesel:str, phoneNumber: str, email:str):
        self.firstName = firstName
        self.lastName = lastName
        self.pesel = pesel
        self.phoneNumber = phoneNumber
        self.email = email