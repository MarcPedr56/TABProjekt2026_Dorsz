import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API = "http://127.0.0.1:8000";

const GuestHistory = () => {
    const { guestId } = useParams();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${API}/reservations/guest/${guestId}`)
            .then((res) => res.json())
            .then((data) => {
                setReservations(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Błąd pobierania historii gościa:", err);
                setLoading(false);
            });
    }, [guestId]);

    if (loading) return <div className="section"><p>Ładowanie historii...</p></div>;

    return (
        <div className="section">
            <h2>Historia pobytów gościa (ID: {guestId})</h2>
            <table className="table">
                <thead>
                    <tr style={{ textAlign: "left" }}>
                        <th>ID Rezerwacji</th>
                        <th>Data od</th>
                        <th>Data do</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {reservations.length > 0 ? (
                        reservations.map((r) => (
                            <tr key={r.reservation_id}>
                                <td>{r.reservation_id}</td>
                                <td>{r.start_date ? r.start_date.split('T')[0] : "-"}</td>
                                <td>{r.end_date ? r.end_date.split('T')[0] : "-"}</td>
                                <td>{r.status}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" style={{ textAlign: "center" }}>Brak rezerwacji dla tego gościa.</td>
                        </tr>
                    )}
                </tbody>
            </table>
            
            <button className="link" onClick={() => navigate("/admin/guests")}>
                ← Powrót do listy gości
            </button>
        </div>
    );
};

export default GuestHistory;