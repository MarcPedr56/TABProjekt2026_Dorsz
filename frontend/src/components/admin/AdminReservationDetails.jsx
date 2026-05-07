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

    }, [id]);

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

    const cancelService = async (serviceId) => {

        const confirmed = window.confirm(
            "Czy na pewno chcesz anulować usługę?"
        );

        if (!confirmed) {
            return;
        }

        try {

            const res = await fetch(
                `${API}/services/${serviceId}/cancel`,
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
                    s => s.service_id !== serviceId
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