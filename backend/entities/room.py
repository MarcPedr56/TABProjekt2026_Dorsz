# --- Room entity class file

class Room:
    roomId: int
    roomNumber: int
    floorNumber: int
    roomType: str
    pricePerNight: float
    status: str
    equipment: str

    def __init__(self, roomNumber: int, roomType: str, pricePerNight: float,
                 status: str, floorNumber: int, equipment: str):
        self.roomNumber = roomNumber
        self.floorNumber = floorNumber
        self.roomType = roomType
        self.pricePerNight = pricePerNight
        self.status = status
        self.equipment = equipment