# --- Account entity class file
from permissions import PermissionLevel

class Account:
    account_id: int
    permission_level: PermissionLevel
    phone_number: str
    email: str

    def __init__(self, phone_number: str, email: str):
        self.permission_level = PermissionLevel.USER
        self.phone_number = phone_number
        self.email = email

    