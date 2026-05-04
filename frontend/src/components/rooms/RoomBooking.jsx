import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const API = "http://127.0.0.1:8000";

const RoomBooking = () => {
    const { id } = useParams(); // Wyciąga {id} z URL np. /rooms/book/12
    const [searchParams] = useSearchParams(); // Wyciąga parametry po znaku zapytania
    const navigate = useNavigate();
    
    // Dane z globalnego stora
    const { user, role } = useAuthStore();

    // Inicjujemy daty tym, co wpadło z paska adresu
    const [startDate, setStartDate] = useState(searchParams.get("start") || "");
    const [endDate, setEndDate] = useState(searchParams.get("end") || "");
    
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // HACK: Pobieramy wszystkie pokoje, żeby wyłuskać ten jeden. 
        // DO ZROBIENIA NA BACKENDZIE: endpoint GET /rooms/{id} !
        fetch(`${API}/rooms`)
            .then(res => res.json())
            .then(data => {
                const foundRoom = data.find(r => r.room_id === parseInt(id));
                setRoom(foundRoom);
                setLoading(false);
            });
    }, [id]);

    const handleBook = async () => {
        if (!startDate || !endDate) {
            alert("Brak dat!");
            return;
        }
        if (!role) {
            alert("Musisz się zalogować!");
            navigate("/login");
            return;
        }

        try {
            const res = await fetch(`${API}/reservations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    room_id: parseInt(id),
                    start_date: startDate,
                    end_date: endDate,
                    role: role,
                    email: user?.email,
                    // UWAGA: Jeśli to Admin rezerwuje, tu brakuje formularza danych gościa!
                    // Zakładam tu logikę dla zwykłego gościa. 
                })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                alert(data.detail || "Błąd rezerwacji (np. pokój zajęty)");
                return;
            }
            
            alert("Zarezerwowano pomyślnie!");
            navigate("/account"); // Wyrzuć do panelu usera
            
        } catch (err) {
            console.error(err);
            alert("Błąd połączenia API");
        }
    };

    if (loading) return <p>Ładowanie danych pokoju...</p>;
    if (!room) return <p>Nie znaleziono pokoju.</p>;

    // Obliczanie dni i ceny w locie
    const days = Math.max((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24), 1) || 0;

    return (
        <div className="card">
            <h2>Rezerwacja pokoju nr {room.room_number}</h2>
            <p>Typ: {room.room_type}</p>
            <p>Cena za noc: <strong>{room.price_per_night} PLN</strong></p>
            <p>Suma do zapłaty: <strong>{days * room.price_per_night} PLN</strong></p>

            <label>Data przyjazdu</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            
            <label>Data wyjazdu</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />

            <button onClick={handleBook} className="button" style={{marginTop: '20px'}}>
                Potwierdź rezerwację
            </button>
        </div>
    );
};

export default RoomBooking;