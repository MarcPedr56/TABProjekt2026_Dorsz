import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = "http://127.0.0.1:8000";

const RoomList = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Stan wyszukiwarki
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    
    const navigate = useNavigate();
    const today = new Date().toISOString().split("T")[0];

    // Funkcja przypisująca obrazki, wyciągnięta z Twojego starego kodu
    const getRoomImage = (type) => {
        if (type === "single") return "https://images.unsplash.com/photo-1611892440504-42a792e24d32";
        if (type === "double") return "https://images.unsplash.com/photo-1590490360182-c33d57733427";
        if (type === "suite") return "https://images.unsplash.com/photo-1582719508461-905c673771fd";
        return "https://images.unsplash.com/photo-1566073771259-6a8506099945";
    };

    // Pobranie wszystkich pokoi na start
    useEffect(() => {
        fetch(`${API}/rooms`)
            .then(res => res.json())
            .then(data => {
                setRooms(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const searchAvailableRooms = async () => {
        if (!startDate || !endDate) {
            alert("Wybierz daty!");
            return;
        }
        
        setLoading(true);
        try {
            const res = await fetch(`${API}/rooms/available?start_date=${startDate}&end_date=${endDate}`);
            const data = await res.json();
            setRooms(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            alert("Błąd wyszukiwania pokoi");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="section">
            <h2>Pokoje</h2>
            
            {/* Wyszukiwarka */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input type="date" min={today} value={startDate} onChange={e => setStartDate(e.target.value)} className="input" />
                <input type="date" min={today} value={endDate} onChange={e => setEndDate(e.target.value)} className="input" />
                <button onClick={searchAvailableRooms} className="button" style={{ height: '43px', marginTop: '10px' }}>Szukaj</button>
            </div>

            {loading ? <p>Ładowanie...</p> : (
                <div className="roomsGrid">
                    {rooms.map(room => (
                        <div key={room.room_id} className="roomCard">
                            {/* TUTAJ WRACA TWOJE ZDJĘCIE */}
                            <img
                                src={getRoomImage(room.room_type)}
                                alt={`Pokój ${room.room_type}`}
                                className="roomImage"
                            />
                            
                            <div style={{ padding: '0 15px' }}>
                                <h3>Pokój {room.room_number}</h3>
                                <p>Typ: {room.room_type}</p>
                                <p>Cena: {room.price_per_night} PLN / noc</p>
                                <p style={{ color: room.status === "available" ? "green" : "red" }}>
                                    {room.status === "available" ? "Dostępny" : "Niedostępny"}
                                </p>
                                
                                <button 
                                    className="button"
                                    onClick={() => navigate(`/rooms/book/${room.room_id}?start=${startDate}&end=${endDate}`)}
                                >
                                    Rezerwuj
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RoomList;