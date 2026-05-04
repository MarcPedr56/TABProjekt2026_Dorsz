import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = "http://127.0.0.1:8000";

const AdminReservations = () => {
    const [reservations, setReservations] = useState([]);
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // HACK: Ściąganie całej bazy gości tylko po to, żeby powiązać ID z nazwiskiem. 
        // Do poprawy na backendzie!
        Promise.all([
            fetch(`${API}/reservations`).then(res => res.json()),
            fetch(`${API}/guests`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            }).then(res => res.json())
        ])
        .then(([resData, guestData]) => {
            setReservations(Array.isArray(resData) ? resData : []);
            setGuests(Array.isArray(guestData) ? guestData : []);
            setLoading(false);
        })
        .catch(err => {
            console.error("Błąd pobierania:", err);
            setLoading(false);
        });
    }, []);

    const getGuestName = (guestId) => {
        const guest = guests.find(g => g.guest_id === guestId);
        return guest ? `${guest.first_name} ${guest.last_name}` : "Brak danych";
    };

    if (loading) return <div className="section"><p>Ładowanie...</p></div>;

    return (
        <div className="section" style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
            <h2>Rezerwacje</h2>
            <table className="table" style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
                <thead>
                    <tr style={{ textAlign: "left" }}>
                        <th>ID</th>
                        <th>Gość</th>
                        <th>Data od</th>
                        <th>Data do</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {reservations.length > 0 ? (
                        reservations.map((r) => (
                            <tr 
                                key={r.reservation_id} 
                                style={{ cursor: "pointer", borderBottom: "1px solid #ddd" }}
                                // Wyrzucamy na nowy widok ze szczegółami!
                                onClick={() => navigate(`/admin/reservations/${r.reservation_id}`)}
                            >
                                <td style={{ padding: "10px" }}>{r.reservation_id}</td>
                                <td style={{ padding: "10px" }}>{getGuestName(r.main_guest_id)}</td>
                                <td style={{ padding: "10px" }}>{r.start_date ? r.start_date.split('T')[0] : ""}</td>
                                <td style={{ padding: "10px" }}>{r.end_date ? r.end_date.split('T')[0] : ""}</td>
                                <td style={{ padding: "10px" }}>{r.status}</td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan="5">Brak rezerwacji</td></tr>
                    )}
                </tbody>
            </table>

            <button 
                onClick={() => navigate("/admin")} 
                style={{ background: "none", border: "none", cursor: "pointer", textDecoration: "underline", marginTop: "20px" }}
            >
                ← Powrót
            </button>
        </div>
    );
};

export default AdminReservations;