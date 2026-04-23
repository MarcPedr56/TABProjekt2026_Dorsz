# --- Permissions related classes
from enum import Enum

class PermissionLevel(Enum):
    USER = 10
    EMPLOYEE = 20
    MANAGER = 30
    ADMIN = 40