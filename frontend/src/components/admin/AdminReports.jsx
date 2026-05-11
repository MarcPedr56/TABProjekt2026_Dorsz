import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = "http://127.0.0.1:8000";

const AdminReports = () => {
    const navigate = useNavigate();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentReport, setCurrentReport] = useState(null);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchReport = async (endpoint) => {
        setLoading(true);
        setError(null);
        setReportData(null);
        setCurrentReport(endpoint);
        try {
            const url = `${API}/reports/${endpoint}?start_date=${startDate}&end_date=${endDate}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Błąd serwera przy generowaniu raportu");
            const data = await res.json();
            setReportData(data);
        } catch (err) {
            console.error(err);
            setError("Nie udało się pobrać danych. Sprawdź połączenie z bazą.");
        } finally {
            setLoading(false);
        }
    };

    const clearReport = () => {
        setReportData(null);
        setCurrentReport(null);
        setError(null);
    };

    const renderReportResult = () => {
        if (loading) return <p>Generowanie danych...</p>;
        if (error) return <p style={{ color: 'red' }}>{error}</p>;
        if (!reportData) return <p>Brak danych dla wybranego okresu.</p>;

        switch (currentReport) {
            case "revenue":
                return <h1 style={{ fontSize: '40px', color: '#2c3e50' }}>{reportData.total_revenue || 0} PLN</h1>;

            case "occupancy":
                return (
                    <div style={{ textAlign: 'center' }}>
                        <p>Wszystkie pokoje: <strong>{reportData.total_rooms || 0}</strong></p>
                        <p>Zajęte pokoje: <strong>{reportData.occupied_rooms || 0}</strong></p>
                        <h2 style={{ color: '#e67e22', fontSize: '36px' }}>Obłożenie: {reportData.occupancy_rate || 0}%</h2>
                    </div>
                );

            case "average-stay":
                return (
                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{ fontSize: '48px' }}>{reportData.avg_days || 0}</h1>
                        <p>dni (średnio)</p>
                    </div>
                );

            case "services-analysis":
                if (reportData.length === 0) {
                    return <p style={{ margin: '20px 0', fontStyle: 'italic', color: '#666' }}>Brak danych o usługach w tym terminie.</p>;
                }
                return (
                    <table className="table">
                        <thead>
                            <tr><th>Usługa</th><th>Liczba użyć</th><th>Przychód</th></tr>
                        </thead>
                        <tbody>
                            {reportData.map((item, i) => (
                                <tr key={i}>
                                    <td>{item.name}</td>
                                    <td>{item.usage_count}</td>
                                    <td>{item.total_earned} PLN</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );

            case "returning-guests":
                if (reportData.length === 0) {
                    return <p style={{ margin: '20px 0', fontStyle: 'italic', color: '#666' }}>Brak powracających gości w wybranym terminie.</p>;
                }
                return (
                    <table className="table">
                        <thead>
                            <tr><th>Imię</th><th>Nazwisko</th><th>Wizyty</th></tr>
                        </thead>
                        <tbody>
                            {reportData.map((item, i) => (
                                <tr key={i}>
                                    <td>{item.first_name}</td>
                                    <td>{item.last_name}</td>
                                    <td>{item.reservation_count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );

            default: return null;
        }
    };

    return (
        <div className="section">
            <h2>Raporty i Statystyki</h2>

            {!currentReport && (
                <>
                    <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", marginBottom: "20px", display: "flex", gap: "20px", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                        <div><label>Od: </label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" style={{ width: 'auto' }} /></div>
                        <div><label>Do: </label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" style={{ width: 'auto' }} /></div>
                    </div>
                    <div className="accountGrid">
                        <div className="accountCard" onClick={() => fetchReport("occupancy")}><h3>Obłożenie hotelu</h3></div>
                        <div className="accountCard" onClick={() => fetchReport("revenue")}><h3>Przychody</h3></div>
                        <div className="accountCard" onClick={() => fetchReport("services-analysis")}><h3>Analiza usług</h3></div>
                        <div className="accountCard" onClick={() => fetchReport("average-stay")}><h3>Średnia długość pobytu</h3></div>
                        <div className="accountCard" onClick={() => fetchReport("returning-guests")}><h3>Powracający goście</h3></div>
                    </div>
                </>
            )}

            {currentReport && (
                <div style={{ marginTop: "30px", background: "#fff", padding: "30px", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                    <h3>Raport: {currentReport}</h3>
                    <div style={{ margin: '20px 0' }}>{renderReportResult()}</div>
                    <button className="button" onClick={clearReport}>Zamknij raport</button>
                </div>
            )}

            {!currentReport && <button className="link" onClick={() => navigate("/admin")}>← Powrót</button>}
        </div>
    );
};

export default AdminReports;