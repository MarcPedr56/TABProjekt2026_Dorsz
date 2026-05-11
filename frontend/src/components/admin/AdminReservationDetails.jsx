import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API = "http://127.0.0.1:8000";

const AdminReservationDetails = () => {

    const { id } = useParams();

    const navigate = useNavigate();

    const [reservation, setReservation] = useState(null);

    const [services, setServices] = useState([]);

    const [loading, setLoading] = useState(true);

    const [extendDate, setExtendDate] = useState("");

    const [shortenDate, setShortenDate] = useState("");

    // --- NOWE STANY DLA DODAWANIA USŁUG ---
    const [availableServices, setAvailableServices] = useState([]);
    const [selectedServiceId, setSelectedServiceId] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [usageDate, setUsageDate] = useState(new Date().toISOString().split('T')[0]);
    const [usageTime, setUsageTime] = useState("12:00");

    useEffect(() => {

        fetch(`${API}/reservations`)
            .then(res => res.json())
            .then(data => {

                const found = data.find(
                    r => r.reservation_id === parseInt(id)
                );

                setReservation(found || null);

                setLoading(false);

            })
            .catch(err => {

                console.error(err);

                setLoading(false);
            });

        fetch(`${API}/services/reservation/${id}`)
            .then(res => res.json())
            .then(data => setServices(Array.isArray(data) ? data : []))
            .catch(err => console.error(err));

        // --- POBIERANIE LISTY DOSTĘPNYCH USŁUG HOTELU ---
        fetch(`${API}/services`)
            .then(res => res.json())
            .then(data => setAvailableServices(Array.isArray(data) ? data : []))
            .catch(err => console.error(err));

    }, [id]);

    // =========================
    // NOWA FUNKCJA: DODAWANIE USŁUGI
    // =========================

    const handleAddService = async () => {
        if (!selectedServiceId) {
            alert("Wybierz usługę z listy!");
            return;
        }

        // --- DODATKOWA WALIDACJA DATY NA FRONCIIE ---
        if (reservation) {
            const sDate = usageDate; // format RRRR-MM-DD z inputa
            const resStart = reservation.start_date.split('T')[0];
            const resEnd = reservation.end_date.split('T')[0];

            if (sDate < resStart || sDate > resEnd) {
                alert(`Błąd: Data usługi (${sDate}) musi mieścić się w terminie pobytu gościa (${resStart} do ${resEnd})!`);
                return;
            }
        }

        try {
            const res = await fetch(`${API}/services/book`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reservation_id: parseInt(id),
                    service_id: parseInt(selectedServiceId),
                    quantity: parseInt(quantity),
                    usage_date: usageDate,
                    usage_time: usageTime
                })
            });

            const data = await res.json();

            if (!res.ok) {
                // Wyświetlamy błąd z backendu (np. o zakończeniu rezerwacji)
                alert(data.detail || "Błąd zapisu usługi");
                return;
            }

            alert("Usługa została pomyślnie dodana!");

            // Odśwież listę usług pod tabelą
            fetch(`${API}/services/reservation/${id}`)
                .then(res => res.json())
                .then(data => setServices(Array.isArray(data) ? data : []));

            setSelectedServiceId("");
            setQuantity(1); // Warto też zresetować ilość
        } catch (err) {
            alert("Błąd połączenia z API");
        }
    };

    // =========================
    // ANULOWANIE REZERWACJI
    // =========================

    const cancelReservation = async () => {

        const confirmed = window.confirm(
            "Czy na pewno chcesz anulować rezerwację?"
        );

        if (!confirmed) {
            return;
        }

        try {

            const res = await fetch(
                `${API}/reservations/${id}/cancel`,
                {
                    method: "PUT"
                }
            );

            const data = await res.json();

            if (!res.ok) {

                alert(
                    data.detail ||
                    "Nie można anulować rezerwacji"
                );

                return;
            }

            alert(
                data.message ||
                "Anulowano rezerwację"
            );

            navigate("/admin/reservations");

        } catch (err) {

            console.error(err);

            alert("Błąd połączenia");
        }
    };

    // =========================
    // PRZEDŁUŻ
    // =========================

    const handleExtend = async () => {

        if (!extendDate) {

            alert("Wybierz nową datę");

            return;
        }

        const confirmed = window.confirm(
            "Czy na pewno chcesz przedłużyć rezerwację?"
        );

        if (!confirmed) {
            return;
        }

        try {

            const res = await fetch(
                `${API}/reservations/${id}/extend`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        end_date: extendDate
                    })
                }
            );

            const data = await res.json();

            if (!res.ok) {

                alert(
                    data.detail ||
                    "Nie można przedłużyć pobytu"
                );

                return;
            }

            alert(
                data.message ||
                "Przedłużono pobyt"
            );

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

    // =========================
    // SKRÓĆ
    // =========================

    const handleShorten = async () => {

        if (!shortenDate) {

            alert("Wybierz nową datę");

            return;
        }

        const confirmed = window.confirm(
            "Czy na pewno chcesz skrócić rezerwację?"
        );

        if (!confirmed) {
            return;
        }

        try {

            const res = await fetch(
                `${API}/reservations/${id}/shorten`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        end_date: shortenDate
                    })
                }
            );

            const data = await res.json();

            if (!res.ok) {

                alert(
                    data.detail ||
                    "Nie można skrócić pobytu"
                );

                return;
            }

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

    // =========================
    // PDF
    // =========================

    const downloadConfirmation = async () => {

        try {

            const response = await fetch(
                `${API}/reservations/${id}/confirmation`
            );

            if (!response.ok) {
                throw new Error("Błąd pobierania PDF");
            }

            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');

            link.href = url;

            link.setAttribute(
                'download',
                `potwierdzenie_nr_${id}.pdf`
            );

            document.body.appendChild(link);

            link.click();

            link.parentNode.removeChild(link);

            window.URL.revokeObjectURL(url);

        } catch (error) {

            console.error(error);

            alert(
                "Wystąpił problem z pobieraniem potwierdzenia."
            );
        }
    };

    // =========================
    // USŁUGI
    // =========================

    const cancelService = async (usage_id) => {

        const confirmed = window.confirm(
            "Czy na pewno chcesz anulować usługę?"
        );

        if (!confirmed) {
            return;
        }

        try {

            const res = await fetch(
                `${API}/services/${usage_id}/cancel`,
                {
                    method: "PUT"
                }
            );

            const data = await res.json();

            if (!res.ok) {

                alert(
                    data.detail ||
                    "Nie można anulować usługi"
                );

                return;
            }

            alert(
                data.message ||
                "Usługa anulowana"
            );

            setServices(prev =>
                prev.filter(
                    s => s.usage_id !== usage_id
                )
            );

        } catch (err) {

            console.error(err);

            alert("Błąd połączenia");
        }
    };

    if (loading) {
        return (
            <div className="section">
                <p>Ładowanie szczegółów...</p>
            </div>
        );
    }

    if (!reservation) {
        return (
            <div className="section">
                <p>Nie znaleziono rezerwacji.</p>
            </div>
        );
    }

    // =========================
    // CZY STARA REZERWACJA
    // =========================

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const reservationEndDate =
        new Date(reservation.end_date);

    const isPastReservation =
        reservationEndDate < today;

    return (

        <div className="section">

            <h2>
                Szczegóły rezerwacji #
                {reservation.reservation_id}
            </h2>

            <div
                className="card"
                style={{
                    margin: "20px 0",
                    maxWidth: "100%"
                }}
            >

                <p>
                    <strong>Gość (ID):</strong>{" "}
                    {reservation.main_guest_id}
                </p>

                <p>
                    <strong>Data od:</strong>{" "}
                    {reservation.start_date}
                </p>

                <p>
                    <strong>Data do:</strong>{" "}
                    {reservation.end_date}
                </p>

                <p>
                    <strong>Status:</strong>{" "}
                    {reservation.status}
                </p>

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
                                onClick={cancelReservation}
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
                                    onChange={(e) =>
                                        setExtendDate(
                                            e.target.value
                                        )
                                    }
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
                                    onChange={(e) =>
                                        setShortenDate(
                                            e.target.value
                                        )
                                    }
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

            </div>

            {/* =========================
                NOWA SEKCJA: DODAWANIE USŁUGI DLA GOŚCIA
                ========================= */}
            {/* PODMIEŃ SEKCJĘ DODAWANIA USŁUGI NA TĘ POPRAWIONĄ STYLIZACYJNIE */}
            {!isPastReservation && (
                <div className="card" style={{ margin: "20px 0", border: "1px solid #e67e22", textAlign: 'left', padding: '20px' }}>
                    <h3 style={{ marginBottom: '15px' }}>Dodaj usługę dla tego gościa</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ flex: 2 }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Usługa</label>
                                <select className="input" value={selectedServiceId} onChange={e => setSelectedServiceId(e.target.value)} style={{ width: '100%' }}>
                                    <option value="">-- Wybierz usługę z listy --</option>
                                    {availableServices.map(s => (
                                        <option key={s.service_id} value={s.service_id}>{s.name} ({s.price} PLN)</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Ilość</label>
                                <input type="number" className="input" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} style={{ width: '100%' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Data wykonania</label>
                                <input type="date" className="input" value={usageDate} onChange={e => setUsageDate(e.target.value)} style={{ width: '100%' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Godzina</label>
                                <input type="time" className="input" value={usageTime} onChange={e => setUsageTime(e.target.value)} style={{ width: '100%' }} />
                            </div>
                        </div>

                        <button className="button" onClick={handleAddService} style={{ width: '100%', marginTop: '5px', padding: '12px' }}>
                            Zatwierdź i dodaj usługę
                        </button>
                    </div>
                </div>
            )}

            <h3 style={{ marginTop: "30px" }}>
                Zamówione usługi
            </h3>

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

                                    {!isPastReservation && (
                                        <button
                                            className="button"
                                            style={{
                                                padding: "5px 10px",
                                                width: "auto"
                                            }}
                                            onClick={() =>
                                                cancelService(
                                                    s.usage_id
                                                )
                                            }
                                        >
                                            Anuluj
                                        </button>
                                    )}

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            ) : (

                <p>
                    Brak usług dodatkowych.
                </p>

            )}

            <button
                className="link"
                onClick={() =>
                    navigate("/admin/reservations")
                }
            >
                ← Wróć do listy rezerwacji
            </button>

        </div>
    );
};

export default AdminReservationDetails;