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
    const [extendDate, setExtendDate] = useState("");
    const [shortenDate, setShortenDate] = useState("");

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


    const handleExtend = async () => {

        if (!extendDate) {
            alert("Wybierz nową datę");
            return;
        }

        try {

            const res = await fetch(`${API}/reservations/${id}/extend`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    end_date: extendDate
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.detail || "Nie można przedłużyć pobytu");
                return;
            }

            alert(data.message || "Przedłużono pobyt");

            setReservation({
                ...reservation,
                end_date: extendDate
            });

            setExtendDate("");

        } catch (err) {

            console.error(err);

            alert("Błąd połączenia");
        }
    };

    const handleShorten = async () => {

        if (!shortenDate) {
            alert("Wybierz nową datę");
            return;
        }

        // 🔹 potwierdzenie
        const confirmed = window.confirm(
            "Czy na pewno chcesz skrócić rezerwację?"
        );

        if (!confirmed) {
            return;
        }

        try {

            const res = await fetch(`${API}/reservations/${id}/shorten`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    end_date: shortenDate
                })
            });

            const data = await res.json();

            // ❌ błąd
            if (!res.ok) {

                alert(data.detail || "Nie można skrócić pobytu");

                return;
            }

            // ✅ sukces
            alert("Skrócono rezerwację pomyślnie");

            setReservation({
                ...reservation,
                end_date: shortenDate
            });

            setShortenDate("");

        } catch (err) {

            console.error(err);

            alert("Błąd połączenia");
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
    const cancelReservation = async (id) => {

        // 🔹 okienko potwierdzenia
        const confirmed = window.confirm(
            "Czy na pewno chcesz anulować rezerwację?"
        );

        // jeśli kliknięto NIE
        if (!confirmed) {
            return;
        }

        try {

            const res = await fetch(`${API}/reservations/${id}/cancel`, {
                method: "PUT"
            });

            const data = await res.json();

            // ❌ błąd
            if (!res.ok) {

                alert(data.detail || "Nie można anulować rezerwacji");

                return;
            }

            // ✅ sukces
            alert(data.message || "Anulowano rezerwację");

            // TODO: Zaimplementować powrót do listy rezerwacji? Może do tego jest kod poniżej?
            // UPDATE: Może tylko tyle wystarczy
            navigate(-1);

            // TODO: Brak implementacji tych 2 funkcji
            // fetchReservations();

            // if (role === "guest") {
            //     fetchMyReservations();
            // }

            // goBack();

        } catch (err) {

            console.error(err);

            alert("Błąd połączenia");
        }
    };

    if (!reservation) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reservationEndDate = new Date(reservation.end_date);

    const isPastReservation = reservationEndDate < today;

    const cancelService = async (usageId) => {
        const confirmed = window.confirm("Czy na pewno chcesz anulować tę usługę?");
        if (!confirmed) return;

        try {
            const res = await fetch(`${API}/services/${usageId}/cancel`, {
                method: "PUT"
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.detail || "Nie można anulować usługi");
                return;
            }

            alert("Usługa anulowana.");
            
            // Aktualizacja stanu lokalnego, żeby zniknęła z tabeli bez odświeżania strony
            setServices(prevServices => prevServices.filter(s => s.usage_id !== usageId));

        } catch (err) {
            console.error("Błąd podczas anulowania usługi:", err);
            alert("Błąd połączenia");
        }
    };

    return (
        <div className="section">
            <h2>Szczegóły rezerwacji #{reservation.reservation_id}</h2>

            <p><strong>Pokój:</strong> {reservation.room_number || "Brak"}</p>
            <p><strong>Data od:</strong> {reservation.start_date}</p>
            <p><strong>Data do:</strong> {reservation.end_date}</p>
            <p><strong>Status:</strong> {reservation.status}</p>

            <div
                style={{
                    marginTop: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "15px",
                    alignItems: "flex-start"
                }}
            >

                {!isPastReservation && (
                    <>

                        {/* ANULUJ */}
                        <button
                            className="button"
                            onClick={() => cancelReservation(id)}
                        >
                            Anuluj
                        </button>

                        {/* PRZEDŁUŻ */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px"
                            }}
                        >
                            <button
                                className="button"
                                onClick={handleExtend}
                            >
                                Przedłuż
                            </button>

                            <input
                                type="date"
                                value={extendDate}
                                onChange={(e) => setExtendDate(e.target.value)}
                            />
                        </div>

                        {/* SKRÓĆ */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px"
                            }}
                        >
                            <button
                                className="button"
                                onClick={handleShorten}
                            >
                                Skróć
                            </button>

                            <input
                                type="date"
                                value={shortenDate}
                                onChange={(e) => setShortenDate(e.target.value)}
                            />
                        </div>

                    </>
                )}

                {/* PDF */}
                <button
                    className="button"
                    style={{
                        width: "auto",
                        padding: "10px 20px"
                    }}
                    onClick={downloadConfirmation}
                >
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
                                    <button className="button" style={{ padding: "5px 10px", width: "auto" }} onClick={() => cancelService(s.usage_id)}>
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