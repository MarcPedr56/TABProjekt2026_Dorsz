import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = "http://127.0.0.1:8000";

const MyPayments = () => {
    const [searchPesel, setSearchPesel] = useState("");
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchPayments = async () => {
        if (!searchPesel) {
            alert("Podaj PESEL (wina twojego backendu, że wymaga tego od zalogowanego usera).");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API}/payments/pesel/${searchPesel}`);
            const data = await res.json();
            setPayments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

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

    return (
        <div className="section">
            <h2>Moje Płatności i Faktury</h2>

            <div style={{ marginTop: "20px", display: 'flex', gap: '10px' }}>
                <input 
                    placeholder="Twój numer PESEL" 
                    value={searchPesel} 
                    onChange={(e) => setSearchPesel(e.target.value)} 
                    className="input"
                    style={{ width: '200px' }}
                />
                <button className="button" onClick={fetchPayments}>Pokaż płatności</button>
            </div>

            {loading && <p>Ładowanie...</p>}

            {!loading && payments.length > 0 && (
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
                                <td>{p.payment_date}</td>
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
            )}

            {!loading && payments.length === 0 && searchPesel && (
                <p style={{ marginTop: '20px' }}>Brak płatności w systemie.</p>
            )}

            <button className="link" onClick={() => navigate("/account")} style={{ display: "block" }}>
                ← Powrót do konta
            </button>
        </div>
    );
};

export default MyPayments;