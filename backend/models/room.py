# --- Room entity class file

class Room:
    room_id: int
    room_number: int
    floor_number: int
    room_type: str
    price_per_night: float
    status: str
    equipment: str

    def __init__(self, room_number: int, room_type: str, price_per_night: float,
                 status: str, floor_number: int, equipment: str):
        self.room_number = room_number
        self.room_type = room_type
        self.price_per_night = price_per_night
        self.floor_number = floor_number
        self.status = status
        self.equipment = equipment