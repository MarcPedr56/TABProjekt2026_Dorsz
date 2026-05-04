import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = "http://127.0.0.1:8000";

const AdminReports = () => {
    const navigate = useNavigate();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentReport, setCurrentReport] = useState(null);

    const fetchReport = async (endpoint) => {
        setLoading(true);
        setCurrentReport(endpoint);
        try {
            const res = await fetch(`${API}/reports/${endpoint}`);
            const data = await res.json();
            setReportData(data);
        } catch (err) {
            console.error("Błąd generowania raportu:", err);
            setReportData(null);
        } finally {
            setLoading(false);
        }
    };

    const clearReport = () => {
        setReportData(null);
        setCurrentReport(null);
    };

    return (
        <div className="section">
            <h2>Raporty i Statystyki</h2>

            {/* Wybór raportu */}
            {!currentReport && (
                <div className="accountGrid">
                    <div className="accountCard" onClick={() => fetchReport("occupancy")}>
                        <h3>Obłożenie hotelu</h3>
                    </div>
                    <div className="accountCard" onClick={() => fetchReport("revenue")}>
                        <h3>Przychody</h3>
                    </div>
                    <div className="accountCard" onClick={() => fetchReport("services-analysis")}>
                        <h3>Analiza usług</h3>
                    </div>
                    <div className="accountCard" onClick={() => fetchReport("average-stay")}>
                        <h3>Średnia długość pobytu</h3>
                    </div>
                    <div className="accountCard" onClick={() => fetchReport("returning-guests")}>
                        <h3>Powracający goście</h3>
                    </div>
                </div>
            )}

            {loading && <p style={{ marginTop: "20px" }}>Generowanie raportu...</p>}

            {/* Wyświetlanie wyników raportu (tu potrzebujesz elastyczności w zależności od tego, co zwraca endpoint) */}
            {reportData && currentReport && (
                 <div style={{ marginTop: "30px", background: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                    <h3>Wynik raportu: {currentReport}</h3>
                    
                    {/* Zabezpieczenie przed błędem, gdy frontend spodziewa się innego formatu */}
                    {typeof reportData === 'object' && !Array.isArray(reportData) ? (
                         <pre style={{ background: "#f4f3ec", padding: "15px", borderRadius: "5px", overflowX: "auto" }}>
                            {JSON.stringify(reportData, null, 2)}
                        </pre>
                    ) : Array.isArray(reportData) ? (
                         <table className="table">
                            <tbody>
                                {reportData.map((item, i) => (
                                    <tr key={i}>
                                        {Object.values(item).map((val, j) => (
                                            <td key={j}>{val}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>{reportData}</p>
                    )}

                    <button className="button" style={{ marginTop: "20px" }} onClick={clearReport}>
                        Zamknij raport
                    </button>
                 </div>
            )}

            {!currentReport && (
                <button className="link" onClick={() => navigate("/admin")}>
                    ← Powrót do panelu admina
                </button>
            )}
        </div>
    );
};

export default AdminReports;