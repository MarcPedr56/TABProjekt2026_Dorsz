import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const API = "http://127.0.0.1:8000";

const ServiceBooking = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, role } = useAuthStore();

    const today = new Date().toISOString().split("T")[0];
    const [service, setService] = useState(null);
    const [reservations, setReservations] = useState([]);
    const [successMsg, setSuccessMsg] = useState(null);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        date: today,
        time: "12:00",
        quantity: 1,
        reservationId: ""
    });

    const isAdmin = role === "admin" || role === "receptionist";

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // 1. Pobierz dane usługi
                const resService = await fetch(`${API}/services`);
                const servicesData = await resService.json();
                const found = servicesData.find(s => s.service_id === parseInt(id));
                setService(found);

                // 2. Jeśli gość - pobierz jego aktywne rezerwacje
                if (role === "guest" && user?.email) {
                    const resRes = await fetch(`${API}/reservations/user/${user.email}/true`);
                    const resData = await resRes.json();
                    const list = Array.isArray(resData) ? resData : [];
                    setReservations(list);

                    // Jeśli ma tylko jedną rezerwację, wybierz ją od razu
                    if (list.length > 0) {
                        setForm(prev => ({ ...prev, reservationId: list[0].reservation_id }));
                    }
                }
            } catch (err) {
                console.error("Błąd ładowania:", err);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [id, role, user]);

    const handleBook = async () => {
        if (!form.reservationId) {
            alert("Proszę podać lub wybrać numer rezerwacji!");
            return;
        }

        if (form.date < today) {
            alert("Nie można zamawiać usług na datę z przeszłości!");
            return;
        }

        try {
            const res = await fetch(`${API}/services/book`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    service_id: parseInt(id),
                    reservation_id: parseInt(form.reservationId),
                    usage_date: form.date,
                    usage_time: form.time,
                    quantity: parseInt(form.quantity)
                })
            });

            const data = await res.json();

            if (!res.ok) {
                // Wyświetlamy szczegółowy błąd z backendu (np. o statusie rezerwacji)
                alert(data.detail || "Błąd zapisu usługi");
                return;
            }

            setSuccessMsg(`Usługa zarezerwowana pomyślnie! Koszt: ${data.actual_price} PLN`);
        } catch (err) {
            console.error(err);
            alert("Błąd połączenia z serwerem.");
        }
    };

    if (loading) return <div className="section"><p>Ładowanie danych...</p></div>;
    if (!service) return <div className="section"><p>Nie znaleziono wybranej usługi.</p></div>;

    return (
        <div className="card" style={{ maxWidth: '500px', margin: '30px auto', padding: '30px' }}>
            <h3 style={{ marginBottom: '10px' }}>Usługa: {service.name}</h3>
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <p>Cena jednostkowa: <strong>{service.price} PLN</strong></p>
                <p>Razem do zapłaty: <strong style={{ color: '#e67e22', fontSize: '20px' }}>{form.quantity * service.price} PLN</strong></p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
                <div>
                    <label>Data i Godzina wykonania:</label>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                        <input
                            type="date"
                            className="input"
                            value={form.date}
                            onChange={e => setForm({ ...form, date: e.target.value })}
                        />
                        <input
                            type="time"
                            className="input"
                            value={form.time}
                            onChange={e => setForm({ ...form, time: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label>Ilość:</label>
                    <input
                        type="number"
                        className="input"
                        min="1"
                        value={form.quantity}
                        onChange={e => setForm({ ...form, quantity: e.target.value })}
                    />
                </div>

                <div>
                    <label>Przypisz do rezerwacji:</label>
                    {isAdmin ? (
                        <input
                            type="number"
                            placeholder="Wpisz ID rezerwacji klienta..."
                            className="input"
                            value={form.reservationId}
                            onChange={e => setForm({ ...form, reservationId: e.target.value })}
                        />
                    ) : (
                        <select
                            className="input"
                            value={form.reservationId}
                            onChange={e => setForm({ ...form, reservationId: e.target.value })}
                        >
                            <option value="">-- Wybierz swoją rezerwację --</option>
                            {reservations.map(r => (
                                <option key={r.reservation_id} value={r.reservation_id}>
                                    Nr {r.reservation_id} (Pokój {r.room_number})
                                </option>
                            ))}
                        </select>
                    )}
                    {reservations.length === 0 && !isAdmin && (
                        <p style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
                            Nie masz żadnych aktywnych rezerwacji, do których można przypisać usługę.
                        </p>
                    )}
                </div>
            </div>

            {!successMsg ? (
                <button
                    className="button"
                    onClick={handleBook}
                    style={{ width: '100%', marginTop: '30px', padding: '12px' }}
                    disabled={!isAdmin && reservations.length === 0}
                >
                    Zatwierdź rezerwację usługi
                </button>
            ) : (
                <div style={{ marginTop: '20px', padding: '15px', background: '#d4edda', color: '#155724', borderRadius: '8px', textAlign: 'center' }}>
                    <p><strong>{successMsg}</strong></p>
                    <button
                        className="button"
                        style={{ marginTop: '10px', width: '100%' }}
                        onClick={() => navigate('/services')}
                    >
                        Wróć do listy usług
                    </button>
                </div>
            )}
        </div>
    );
};

export default ServiceBooking;