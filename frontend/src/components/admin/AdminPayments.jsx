import { useState } from 'react';

const API = "http://127.0.0.1:8000";

const AdminPayments = () => {
    const [searchPesel, setSearchPesel] = useState("");
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedMethods, setSelectedMethods] = useState({});
    const [selectedStatuses, setSelectedStatuses] = useState({});

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

    const updatePayment = async (paymentId) => {
        try {
            const payment = payments.find((p) => p.payment_id === paymentId);
            const res = await fetch(`${API}/payments/${paymentId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    method: selectedMethods[paymentId] || payment.method,
                    status: selectedStatuses[paymentId] || payment.status
                })
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.detail || "Nie udało się zmienić płatności");
                return;
            }

            alert("Płatność została pomyślnie zaktualizowana");
            fetchPayments();
        } catch (err) {
            console.error(err);
            alert("Błąd połączenia");
        }
    };

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
                                <td>{new Date(p.payment_date).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                <td>{p.reservation_id}</td>
                                <td>
                                    <select
                                        value={selectedMethods[p.payment_id] || p.method}
                                        onChange={(e) => setSelectedMethods({
                                            ...selectedMethods,
                                            [p.payment_id]: e.target.value
                                        })}
                                    >
                                        <option value="karta">Karta</option>
                                        <option value="gotowka">Gotówka</option>
                                        <option value="przelew">Przelew</option>
                                    </select>
                                </td>
                                <td>
                                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                        <select
                                            value={selectedStatuses[p.payment_id] || p.status}
                                            onChange={(e) => setSelectedStatuses({
                                                ...selectedStatuses,
                                                [p.payment_id]: e.target.value
                                            })}
                                        >
                                            <option value="niezaplacone">Niezapłacone</option>
                                            <option value="zaplacone">Zapłacone</option>
                                        </select>
                                        <button
                                            className="button"
                                            style={{ width: "auto", padding: "5px 10px" }}
                                            onClick={() => updatePayment(p.payment_id)}
                                        >
                                            Zapisz
                                        </button>
                                    </div>
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