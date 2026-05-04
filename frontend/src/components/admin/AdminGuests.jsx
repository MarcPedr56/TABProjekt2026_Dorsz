import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const API = "http://127.0.0.1:8000";

const AdminGuests = () => {
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);

    useEffect(() => {
        fetch(`${API}/guests`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                setGuests(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Błąd pobierania gości:", err);
                setLoading(false);
            });
    }, [token]);

    if (loading) return <div className="section"><p>Ładowanie gości...</p></div>;

    return (
        <div className="section">
            <h2>Lista gości</h2>
            <table className="table">
                <thead>
                    <tr style={{ textAlign: "left" }}>
                        <th>Imię</th>
                        <th>Nazwisko</th>
                        <th>PESEL</th>
                        <th>Email</th>
                        <th>Telefon</th>
                        <th>Preferencje</th>
                    </tr>
                </thead>
                <tbody>
                    {guests.length > 0 ? (
                        guests.map((g) => (
                            <tr
                                key={g.guest_id}
                                style={{ cursor: "pointer", transition: "0.2s" }}
                                onClick={() => navigate(`/admin/guests/${g.guest_id}/history`)}
                            >
                                <td>{g.first_name}</td>
                                <td>{g.last_name}</td>
                                <td>{g.pesel}</td>
                                <td>{g.email}</td>
                                <td>{g.phone_number}</td>
                                <td>{g.preferences}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" style={{ textAlign: "center" }}>Brak gości w systemie.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <button className="link" onClick={() => navigate("/admin")}>
                ← Powrót do panelu admina
            </button>
        </div>
    );
};

export default AdminGuests;