import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const API = "http://127.0.0.1:8000";

const MyPayments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    
    // Zaciągamy usera ze stanu (odpowiedzialność frontendu za sesję)
    const user = useAuthStore(state => state.user);

    useEffect(() => {
        if (!user || !user.email) return;

        fetch(`${API}/payments/user/${user.email}`)
            .then(res => res.json())
            .then(data => {
                setPayments(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Błąd pobierania płatności:", err);
                setLoading(false);
            });
    }, [user]);

    const downloadInvoice = async (paymentId) => {
        try {
            const response = await fetch(`${API}/payments/${paymentId}/pdf`);
            if (!response.ok) throw new Error("Błąd przy pobieraniu PDF.");
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `faktura_nr_${paymentId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert("Problem z generowaniem faktury.");
        }
    };

    if (loading) return <div className="section"><p>Ładowanie płatności...</p></div>;

    return (
        <div className="section">
            <h2>Moje Płatności i Faktury</h2>

            {payments.length > 0 ? (
                <table className="table" style={{ marginTop: "20px" }}>
                    <thead>
                        <tr style={{ textAlign: "left" }}>
                            <th>ID</th>
                            <th>Kwota</th>
                            <th>Metoda</th>
                            <th>Status</th>
                            <th>Data</th>
                            <th>Faktura</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map((p) => (
                            <tr key={p.payment_id}>
                                <td style={{ padding: "10px" }}>{p.payment_id}</td>
                                <td>{p.amount} PLN</td>
                                <td>{p.method}</td>
                                <td>{p.status}</td>
                                <td>{new Date(p.payment_date).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                <td>
                                    <button 
                                        className="button" 
                                        style={{ background: "#dc3545", padding: "5px 10px", width: "auto" }} 
                                        onClick={() => downloadInvoice(p.payment_id)}
                                    >
                                        Pobierz PDF
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p style={{ marginTop: '20px' }}>Brak płatności przypisanych do Twojego konta.</p>
            )}

            <button className="link" onClick={() => navigate("/account")} style={{ display: "block", marginTop: "20px" }}>
                ← Powrót do konta
            </button>
        </div>
    );
};

export default MyPayments;