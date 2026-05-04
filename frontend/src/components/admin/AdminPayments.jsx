import { useState } from 'react';

const API = "http://127.0.0.1:8000";

const AdminPayments = () => {
    const [searchPesel, setSearchPesel] = useState("");
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchPayments = async () => {
        if (!searchPesel) return;
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

    const updatePayment = async (paymentId, updateData) => {
        try {
            await fetch(`${API}/payments/${paymentId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData)
            });
            fetchPayments(); // Odśwież listę po zmianie
        } catch (err) {
            console.error(err);
        }
    };

    // Funkcja do pobierania faktury (wynieś to kiedyś do pliku utils.js!)
    const downloadInvoice = async (paymentId) => {
        try {
            const response = await fetch(`${API}/payments/${paymentId}/pdf`);
            if (!response.ok) throw new Error("Błąd generowania faktury na backendzie.");
            
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
            alert("Problem z pobieraniem PDF.");
        }
    };

    return (
        <div className="section">
            <h2>Płatności</h2>

            <div style={{ marginTop: "20px", display: 'flex', gap: '10px' }}>
                <input 
                    placeholder="Wpisz PESEL" 
                    value={searchPesel} 
                    onChange={(e) => setSearchPesel(e.target.value)} 
                    className="input"
                    style={{ width: '200px' }}
                />
                <button className="button" onClick={fetchPayments}>Szukaj</button>
            </div>

            {loading && <p>Ładowanie...</p>}

            {!loading && payments.length > 0 && (
                <table className="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Kwota</th>
                            <th>Data</th>
                            <th>Rezerwacja</th>
                            <th>Metoda</th>
                            <th>Status</th>
                            <th>Faktura</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map((p) => (
                            <tr key={p.payment_id}>
                                <td>{p.payment_id}</td>
                                <td>{p.amount} PLN</td>
                                <td>{p.payment_date}</td>
                                <td>{p.reservation_id}</td>
                                
                                <td>
                                    <select 
                                        value={p.method} 
                                        onChange={(e) => updatePayment(p.payment_id, { method: e.target.value, status: p.status })}
                                    >
                                        <option value="karta">Karta</option>
                                        <option value="gotowka">Gotówka</option>
                                        <option value="przelew">Przelew</option>
                                    </select>
                                </td>
                                
                                <td>
                                    <select 
                                        value={p.status} 
                                        onChange={(e) => updatePayment(p.payment_id, { method: p.method, status: e.target.value })}
                                    >
                                        <option value="niezaplacone">Niezapłacone</option>
                                        <option value="zaplacone">Zapłacone</option>
                                    </select>
                                </td>
                                
                                <td>
                                    <button 
                                        className="button" 
                                        style={{ background: "#dc3545", padding: "5px 10px" }} 
                                        onClick={() => downloadInvoice(p.payment_id)}
                                    >
                                        PDF
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {!loading && payments.length === 0 && searchPesel && (
                <p style={{ marginTop: '20px' }}>Brak płatności dla podanego PESELu.</p>
            )}
        </div>
    );
};

export default AdminPayments;