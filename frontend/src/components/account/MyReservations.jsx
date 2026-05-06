import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const API = "http://127.0.0.1:8000";

const MyReservations = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);

    useEffect(() => {
        if (!user || !user.email) return;

        fetch(`${API}/reservations/user/${user.email}/false`)
            .then(res => res.json())
            .then(data => {
                setReservations(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Błąd pobierania rezerwacji:", err);
                setLoading(false);
            });
    }, [user]);

    if (loading) return <div className="section"><p>Ładowanie...</p></div>;

    return (
        <div className="section">
            <h2>Moje rezerwacje</h2>

            <table className="table">
                <thead>
                    <tr style={{ textAlign: "left" }}>
                        <th>ID</th>
                        <th>Data od</th>
                        <th>Data do</th>
                        <th>Status</th>
                        <th>Pokój (ID)</th>
                    </tr>
                </thead>
                <tbody>
                    {reservations.length > 0 ? (
                        reservations.map((r) => (
                            <tr
                                key={r.reservation_id}
                                style={{ cursor: "pointer", borderBottom: "1px solid #ddd" }}
                                onClick={() => navigate(`/account/reservations/${r.reservation_id}`, { state: { reservation: r } })}
                            >
                                <td style={{ padding: "10px" }}>{r.reservation_id}</td>
                                <td style={{ padding: "10px" }}>{r.start_date ? r.start_date.split('T')[0] : "-"}</td>
                                <td style={{ padding: "10px" }}>{r.end_date ? r.end_date.split('T')[0] : "-"}</td>
                                <td style={{ padding: "10px" }}>{r.status}</td>
                                <td style={{ padding: "10px" }}>{r.room_id || "Brak danych"}</td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan="5">Brak rezerwacji</td></tr>
                    )}
                </tbody>
            </table>

            <button className="link" onClick={() => navigate("/account")}>
                ← Powrót do konta
            </button>
        </div>
    );
};

export default MyReservations;