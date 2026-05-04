import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API = "http://127.0.0.1:8000";

const AdminReservationDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [reservation, setReservation] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // HACK: Znowu musimy pobrać listę wszystkich, bo backend nie ma GET /reservations/{id}
        // Dopisz ten endpoint na backendzie!
        fetch(`${API}/reservations`)
            .then(res => res.json())
            .then(data => {
                const found = data.find(r => r.reservation_id === parseInt(id));
                setReservation(found || null);
                setLoading(false);
            })
            .catch(err => {
                console.error("Błąd pobierania szczegółów:", err);
                setLoading(false);
            });

        // Pobierz usługi
        fetch(`${API}/services/reservation/${id}`)
            .then(res => res.json())
            .then(data => setServices(Array.isArray(data) ? data : []))
            .catch(err => console.error(err));
    }, [id]);

    const handleCancel = async () => {
        if(!window.confirm("Czy na pewno chcesz anulować rezerwację?")) return;
        try {
            await fetch(`${API}/reservations/${id}/cancel`, { method: "PUT" });
            alert("Anulowano rezerwację.");
            navigate("/admin/reservations");
        } catch (err) {
            console.error(err);
        }
    };

    const handleExtend = async () => {
        const newDate = prompt("Podaj nową datę końca (YYYY-MM-DD)");
        if (!newDate) return;
        try {
            await fetch(`${API}/reservations/${id}/extend`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ end_date: newDate })
            });
            alert("Przedłużono (odśwież stronę).");
            window.location.reload();
        } catch (err) {
            console.error(err);
        }
    };

    const handleShorten = async () => {
        const newDate = prompt("Podaj nową krótszą datę końca (YYYY-MM-DD)");
        if (!newDate) return;
        try {
            await fetch(`${API}/reservations/${id}/shorten`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ end_date: newDate })
            });
            alert("Skrócono (odśwież stronę).");
            window.location.reload();
        } catch (err) {
            console.error(err);
        }
    };

    const downloadConfirmation = async () => {
        try {
            const response = await fetch(`${API}/reservations/${id}/confirmation`);
            if (!response.ok) throw new Error("Błąd pobierania PDF");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `potwierdzenie_nr_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Błąd PDF:", error);
            alert("Wystąpił problem z pobieraniem potwierdzenia.");
        }
    };

    const cancelService = async (serviceId) => {
        if(!window.confirm("Anulować usługę?")) return;
        try {
            await fetch(`${API}/services/${serviceId}/cancel`, { method: "PUT" });
            alert("Usługa anulowana.");
            window.location.reload(); 
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="section"><p>Ładowanie szczegółów...</p></div>;
    if (!reservation) return <div className="section"><p>Nie znaleziono rezerwacji.</p></div>;

    return (
        <div className="section">
            <h2>Szczegóły rezerwacji #{reservation.reservation_id}</h2>

            <div className="card" style={{ margin: "20px 0", maxWidth: "100%" }}>
                <p><strong>Pokój (ID):</strong> {reservation.room_id || "Brak danych"}</p>
                <p><strong>Gość (ID):</strong> {reservation.main_guest_id}</p>
                <p><strong>Data od:</strong> {reservation.start_date ? reservation.start_date.split('T')[0] : "-"}</p>
                <p><strong>Data do:</strong> {reservation.end_date ? reservation.end_date.split('T')[0] : "-"}</p>
                <p><strong>Status:</strong> <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{reservation.status}</span></p>

                <div style={{ marginTop: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button className="button" style={{ background: "var(--danger-color)" }} onClick={handleCancel}>Anuluj Rezerwację</button>
                    <button className="button" onClick={handleExtend}>Przedłuż</button>
                    <button className="button" onClick={handleShorten}>Skróć</button>
                    <button className="button" style={{ width: "auto" }} onClick={downloadConfirmation}>
                        Pobierz PDF
                    </button>
                </div>
            </div>

            <h3 style={{ marginTop: "30px", marginBottom: "15px" }}>Przypisane usługi</h3>
            
            {services.length > 0 ? (
                <table className="table">
                    <thead>
                        <tr style={{ textAlign: "left" }}>
                            <th>Nazwa</th>
                            <th>Data</th>
                            <th>Status</th>
                            <th>Akcja</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.map((s, i) => (
                            <tr key={i}>
                                <td>{s.name}</td>
                                <td>{s.date}</td>
                                <td>{s.status}</td>
                                <td>
                                    <button 
                                        className="button" 
                                        style={{ padding: "5px 10px", width: "auto", background: "var(--danger-color)" }} 
                                        onClick={() => cancelService(s.service_id)}
                                    >
                                        Anuluj
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="text">Brak usług dodatkowych dla tej rezerwacji.</p>
            )}

            <button className="link" onClick={() => navigate("/admin/reservations")}>
                ← Wróć do listy rezerwacji
            </button>
        </div>
    );
};

export default AdminReservationDetails;