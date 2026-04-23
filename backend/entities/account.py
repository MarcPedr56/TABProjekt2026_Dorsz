# --- Account entity class file
from permissions import PermissionLevel

class Account:
    accountId: int
    permissionLevel: PermissionLevel
    phoneNumber: str
    email: str

    def __init__(self, phoneNumber: str, email: str):
        self.permissionLevel = PermissionLevel.USER
        self.phoneNumber = phoneNumber
        self.email = email

    