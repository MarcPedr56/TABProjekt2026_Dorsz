import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const API = "http://127.0.0.1:8000";

const ReservationDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Odbieramy dane podane przez navigate() z MyReservations
    const initialReservation = location.state?.reservation || null;

    const [reservation, setReservation] = useState(initialReservation);
    const [services, setServices] = useState([]);

    useEffect(() => {
        // Jeśli ktoś wszedł z palca w URL i nie ma state, powiedz mu, żeby spadał
        if (!reservation) {
            alert("Brak danych rezerwacji. Wróć do listy.");
            navigate("/account/reservations");
            return;
        }

        // Dociąganie usług przypisanych do rezerwacji
        fetch(`${API}/services/reservation/${id}`)
            .then(res => res.json())
            .then(data => setServices(Array.isArray(data) ? data : []))
            .catch(err => console.error(err));
    }, [id, reservation, navigate]);

    const handleCancel = async () => {
        try {
            await fetch(`${API}/reservations/${id}/cancel`, { method: "PUT" });
            alert("Anulowano rezerwację.");
            navigate("/account/reservations");
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
        try {
            await fetch(`${API}/services/${serviceId}/cancel`, { method: "PUT" });
            alert("Usługa anulowana.");
            // Hack z przeładowaniem, bo nie trzymamy tu pełnego stanu
            window.location.reload(); 
        } catch (err) {
            console.error(err);
        }
    };

    if (!reservation) return null;

    return (
        <div className="section">
            <h2>Szczegóły rezerwacji #{reservation.reservation_id}</h2>

            <p><strong>Pokój (ID):</strong> {reservation.room_id || "Brak"}</p>
            <p><strong>Data od:</strong> {reservation.start_date}</p>
            <p><strong>Data do:</strong> {reservation.end_date}</p>
            <p><strong>Status:</strong> {reservation.status}</p>

            <div style={{ marginTop: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button className="button" onClick={handleCancel}>Anuluj</button>
                <button className="button" onClick={handleExtend}>Przedłuż</button>
                <button className="button" onClick={handleShorten}>Skróć</button>
                <button className="button" style={{ width: "auto", padding: "10px 20px" }} onClick={downloadConfirmation}>
                    Pobierz potwierdzenie (PDF)
                </button>
            </div>

            <h3 style={{ marginTop: "30px" }}>Zamówione usługi</h3>
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
                                    <button className="button" style={{ padding: "5px 10px", width: "auto" }} onClick={() => cancelService(s.service_id)}>
                                        Anuluj
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>Brak usług dodatkowych.</p>
            )}

            <button className="link" onClick={() => navigate("/account/reservations")}>
                ← Wróć do listy rezerwacji
            </button>
        </div>
    );
};

export default ReservationDetails;