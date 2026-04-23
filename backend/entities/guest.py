# --- Guest entity class file

class Guest:
    guestId: int
    firstName: str
    lastName: str
    pesel: str

    def __init__(self, firstName: str, lastName: str):
        self.firstName = firstName
        self.lastName = lastName