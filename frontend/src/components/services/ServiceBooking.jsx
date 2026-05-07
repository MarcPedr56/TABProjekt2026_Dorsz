import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SERVICES_DATA } from './ServiceList'; // Używamy tej samej stałej
import { useAuthStore } from '../../store/useAuthStore';

const API = "http://127.0.0.1:8000";

const ServiceBooking = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const today = new Date().toISOString().split("T")[0];

    // Szukamy usługi na podstawie ID z paska adresu
    const selectedService = SERVICES_DATA.find(s => s.id === parseInt(id));

    const [form, setForm] = useState({
        date: today.toString(),
        time: "",
        quantity: 1,
        reservationId: ""
    });

    const user = useAuthStore(state => state.user);
    
    const [successMsg, setSuccessMsg] = useState(null);

    if (!selectedService) return <p>Nie znaleziono usługi.</p>;

    const calculatedPrice = (Number(form.quantity) || 1) * selectedService.price;

    useEffect(() => {
        if (!user || !user.email) {
            navigate("/services");
            return;
        }

        // Dociąganie aktywnych rezerwacji użytkownika
        fetch(`${API}/reservations/user/${user.email}/true`)
            .then(res => res.json())
            .then(data => setReservations(Array.isArray(data) ? data : []))
            .catch(err => console.error(err));
    }, [user]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const setReservations = async (data) => {
        const select = document.getElementById("activeReservations");

        data.forEach(element => {
            var newOption = document.createElement('option');
            newOption.value = element.reservation_id;
            newOption.innerHTML = element.reservation_id;
            select.appendChild(newOption);
        });
    }

    const handleBook = async () => {
        if (!form.reservationId) {
            alert("Podaj numer rezerwacji!");
            return;
        }

        try {
            const res = await fetch(`${API}/services/book`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    service_id: selectedService.id,
                    reservation_id: Number(form.reservationId),
                    usage_date: form.date.toString(),
                    usage_time: form.time.toString(),
                    quantity: Number(form.quantity || 1)
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.detail || "Błąd zapisu");
                return;
            }

            setSuccessMsg(`Zarezerwowano! Koszt: ${data.actual_price} PLN`);
            
        } catch (err) {
            console.error(err);
            alert("Błąd połączenia");
        }
    };

    return (
        <div className="card">
            <h3 style={{ marginBottom: "10px" }}>Usługa: {selectedService.name}</h3>
            <p>Cena za sztukę: <strong>{selectedService.price} PLN</strong></p>
            <p style={{ marginTop: "10px", fontSize: "16px" }}>
                Do zapłaty: <strong>{calculatedPrice} PLN</strong>
            </p>

            <input name="date" type="date" min={today} value={form.date} onChange={handleChange} className="input" />
            <input name="time" type="time" value={form.time} onChange={handleChange} className="input" />
            <input name="quantity" type="number" min="1" placeholder="Ilość" value={form.quantity} onChange={handleChange} className="input" />
            Wybrana aktywna rezerwacja:
            <select id="activeReservations" name="reservationId" type="number" value={form.reservationId} onChange={handleChange}/>

            <button className="button" onClick={handleBook} style={{ width: '100%', marginTop: '10px' }}>
                Zarezerwuj
            </button>

            {successMsg && (
                <div style={{ marginTop: '15px', padding: '10px', background: '#d4edda', color: '#155724', borderRadius: '5px' }}>
                    {successMsg} <br />
                    <button className="button" style={{ marginTop: '10px' }} onClick={() => navigate('/services')}>Wróć do usług</button>
                </div>
            )}
        </div>
    );
};

export default ServiceBooking;