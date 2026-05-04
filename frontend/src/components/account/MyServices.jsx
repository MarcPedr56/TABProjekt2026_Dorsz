import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const API = "http://127.0.0.1:8000";

const MyServices = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);

    useEffect(() => {
        if (!user || !user.email) return;

        fetch(`${API}/services/user/${user.email}`)
            .then(res => res.json())
            .then(data => {
                setServices(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Błąd pobierania usług:", err);
                setLoading(false);
            });
    }, [user]);

    if (loading) return <div className="section"><p>Ładowanie usług...</p></div>;

    return (
        <div className="section">
            <h2>Moje usługi dodatkowe</h2>

            <table className="table">
                <thead>
                    <tr style={{ textAlign: "left" }}>
                        <th>Nazwa</th>
                        <th>Data użycia</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {services.length > 0 ? (
                        services.map((s, i) => (
                            <tr key={i}>
                                <td style={{ padding: "10px" }}>{s.name}</td>
                                <td style={{ padding: "10px" }}>{s.date}</td>
                                <td style={{ padding: "10px" }}>{s.status}</td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan="3">Brak zarejestrowanych usług.</td></tr>
                    )}
                </tbody>
            </table>

            <button className="link" onClick={() => navigate("/account")}>
                ← Powrót do konta
            </button>
        </div>
    );
};

export default MyServices;