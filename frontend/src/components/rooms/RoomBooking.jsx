import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const API = "http://127.0.0.1:8000";

const RoomBooking = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, role } = useAuthStore();

    const [startDate, setStartDate] = useState(searchParams.get("start") || "");
    const [endDate, setEndDate] = useState(searchParams.get("end") || "");

    // NOWE POLA DLA ADMINA / RECEPCJI
    const [guestEmail, setGuestEmail] = useState(user?.email || "");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [pesel, setPesel] = useState("");

    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);

    const isAdmin = role === "admin" || role === "receptionist";

    useEffect(() => {
        fetch(`${API}/rooms`)
            .then(res => res.json())
            .then(data => {
                const foundRoom = data.find(r => r.room_id === parseInt(id));
                setRoom(foundRoom);
                setLoading(false);
            });
    }, [id]);

    const handleBook = async () => {
        // 1. Walidacja dat (zakaz przeszłości)
        const today = new Date().toISOString().split('T')[0];
        if (startDate < today) {
            alert("Błąd: Nie można rezerwować dat z przeszłości!");
            return;
        }
        if (!startDate || !endDate || startDate >= endDate) {
            alert("Błąd: Nieprawidłowy zakres dat!");
            return;
        }

        // 2. Walidacja dla Admina/Recepcjonisty (rezerwacja dla kogoś)
        if (isAdmin) {
            // --- Walidacja Email ---
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(guestEmail)) {
                alert("Błąd: Wpisz poprawny adres e-mail (np. nazwa@domena.pl)!");
                return;
            }

            // --- Walidacja Imienia i Nazwiska ---
            if (firstName.trim().length < 2) {
                alert("Błąd: Imię musi mieć co najmniej 2 znaki!");
                return;
            }
            if (lastName.trim().length < 2) {
                alert("Błąd: Nazwisko musi mieć co najmniej 2 znaki!");
                return;
            }

            // --- Walidacja PESEL (opcjonalna, ale jeśli wpisany to musi być poprawny) ---
            if (pesel && !/^\d{11}$/.test(pesel)) {
                alert("Błąd: PESEL musi składać się z dokładnie 11 cyfr!");
                return;
            }

            // --- Walidacja Telefonu (minimum 9 cyfr) ---
            if (phone && !/^\d{9,}$/.test(phone.replace(/\s/g, ""))) {
                alert("Błąd: Numer telefonu powinien mieć co najmniej 9 cyfr!");
                return;
            }
        }

        // Jeśli wszystko ok, wysyłamy do bazy
        try {
            const res = await fetch(`${API}/reservations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    room_id: parseInt(id),
                    start_date: startDate,
                    end_date: endDate,
                    role: role,
                    email: isAdmin ? guestEmail : user?.email,
                    first_name: firstName,
                    last_name: lastName,
                    phone_number: phone,
                    pesel: pesel,
                    preferences: ""
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.detail || "Wystąpił błąd podczas rezerwacji.");
                return;
            }

            alert("Rezerwacja zakończona sukcesem!");
            navigate(isAdmin ? "/admin" : "/account");

        } catch (err) {
            console.error(err);
            alert("Błąd: Brak połączenia z serwerem.");
        }
    };

    if (loading) return <p>Ładowanie danych pokoju...</p>;
    if (!room) return <p>Nie znaleziono pokoju.</p>;

    const days = Math.max((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24), 0) || 0;

    return (
        <div className="card" style={{ maxWidth: '500px', margin: '20px auto', padding: '30px' }}>
            <h2>Rezerwacja pokoju nr {room.room_number}</h2>
            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <p>Typ: {room.room_type}</p>
                <p>Cena za noc: <strong>{room.price_per_night} PLN</strong></p>
                <p>Suma do zapłaty: <strong style={{ color: '#e67e22', fontSize: '20px' }}>{days * room.price_per_night} PLN</strong></p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label>Data przyjazdu</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" />
                </div>
                <div>
                    <label>Data wyjazdu</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" />
                </div>

                {/* DODATKOWE POLA DLA ADMINA (Zadanie: opcjonalne pole na maila i dane) */}
                {isAdmin && (
                    <div style={{ borderTop: '1px solid #ddd', paddingTop: '15px', marginTop: '10px' }}>
                        <h4 style={{ marginBottom: '10px' }}>Dane gościa:</h4>
                        <input type="email" placeholder="Email gościa" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} className="input" style={{ marginBottom: '10px' }} />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input type="text" placeholder="Imię" value={firstName} onChange={e => setFirstName(e.target.value)} className="input" />
                            <input type="text" placeholder="Nazwisko" value={lastName} onChange={e => setLastName(e.target.value)} className="input" />
                        </div>
                        <input type="text" placeholder="PESEL (opcjonalnie)" value={pesel} onChange={e => setPesel(e.target.value)} className="input" style={{ marginTop: '10px' }} />
                        <input type="text" placeholder="Telefon" value={phone} onChange={e => setPhone(e.target.value)} className="input" style={{ marginTop: '10px' }} />
                    </div>
                )}
            </div>

            <button onClick={handleBook} className="button" style={{ marginTop: '30px', width: '100%' }}>
                Potwierdź rezerwację
            </button>
        </div>
    );
};

export default RoomBooking;