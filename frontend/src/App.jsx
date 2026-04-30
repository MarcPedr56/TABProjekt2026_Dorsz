import { useState, useEffect } from 'react'
import './App.css'

function App() {
 
    const API = "http://127.0.0.1:8000";
    const [rooms, setRooms] = useState([]);
    const [roomForm, setRoomForm] = useState({
        startDate: "",
        endDate: ""
    });
    const [newTask, setNewTask] = useState({
        room_number: "",
        description: "",
        start_date: null,
        end_date: null,
        status: null,
        priority_level: null
    });
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [role, setRole] = useState(null); 
    const [view, setView] = useState("dashboard");
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingPrice, setBookingPrice] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedGuest, setSelectedGuest] = useState(null);
    const [reservations, setReservations] = useState([]);
    const [reservationServices, setReservationServices] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [myServices, setMyServices] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [employeesLoading, setEmployeesLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [reservationsLoading, setReservationsLoading] = useState(false);
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        pesel: "",
        phone: "",
        email: "",
        preferences: "",
        password: "",
        confirmPassword: ""
    });
    const [payments, setPayments] = useState([]);
    const [reportData, setReportData] = useState(null);
    const [reportsLoading, setReportsLoading] = useState(false);
    const fetchReport = (endpoint) => {
        setReportsLoading(true);
        fetch(`http://127.0.0.1:8000/reports/${endpoint}`)
            .then(res => res.json())
            .then(data => {
                setReportData(data);
                setReportsLoading(false);
            })
            .catch(() => setReportsLoading(false));
    };
    const [paymentsLoading, setPaymentsLoading] = useState(false);
    const [searchPesel, setSearchPesel] = useState("");
    const [guests, setGuests] = useState([]);
    const [guestsLoading, setGuestsLoading] = useState(false);
    const [serviceForm, setServiceForm] = useState({
        date: "",
        time: "",
        quantity: "",
        reservationId: ""
    });
    const servicesData = [
        { id: 1, name: "Spa", price: "150 PLN" },
        { id: 2, name: "Basen", price: "50 PLN" },
        { id: 3, name: "Parking", price: "120 PLN" },
        { id: 4, name: "Restauracja", price: "10 PLN" },
        { id: 5, name: "Pralnia", price: "20 PLN" },
        { id: 6, name: "Sala konferencyjna", price: "300 PLN" }
    ];
    const statusLabel = {
        available: "Dostępny",
        occupied: "Zajęty",
        reserved: "Zarezerwowany"
    };
    const handleServiceChange = (e) => {
        setServiceForm({
            ...serviceForm,
            [e.target.name]: e.target.value
        });
    };
    const fetchTasks = () => {
        setTasksLoading(true);

        fetch("http://127.0.0.1:8000/tasks")
            .then(res => res.json())
            .then(data => {
                console.log("TASKS:", data);
                setTasks(Array.isArray(data) ? data : []);
                setTasksLoading(false);
            })
            .catch(() => setTasksLoading(false));
    };
    const assignEmployee = (taskId, employeeId) => {
        fetch("http://127.0.0.1:8000/tasks/assign", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                task_id: taskId,
                employee_id: employeeId
            })
        })
            .then(() => {
                alert("Przypisano pracownika");
            });
    };
    const updateTaskStatus = (taskId, status) => {
        fetch(`http://127.0.0.1:8000/tasks/${taskId}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status })
        })
            .then(() => fetchTasks());
    };
    const calculateDays = () => {
        if (!roomForm.startDate || !roomForm.endDate) return 0;

        const start = new Date(roomForm.startDate);
        const end = new Date(roomForm.endDate);

        const diff = (end - start) / (1000 * 60 * 60 * 24);

        return diff > 0 ? diff : 0;
    };

    const totalPrice =
        selectedRoom ? calculateDays() * selectedRoom.price_per_night : 0;

    const fetchGuestReservations = (guestId) => {
        setReservationsLoading(true);

        fetch(`http://127.0.0.1:8000/reservations/guest/${guestId}`)
            .then(res => res.json())
            .then(data => {
                setReservations(Array.isArray(data) ? data : []);
                setReservationsLoading(false);
            })
            .catch(() => setReservationsLoading(false));
    };
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };
    const addTask = async () => {
        try {
            const res = await fetch("http://127.0.0.1:8000/tasks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    room_number: Number(newTask.room_number),
                    description: newTask.description,
                    start_date: newTask.start_date,
                    end_date: newTask.end_date,
                    status: newTask.status,
                    priority_level: newTask.priority_level
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.detail || "Błąd");
                return;
            }

            alert("Usterka dodana");
            setNewTask({ room_id: "", description: "" });
            fetchTasks();

        } catch (err) {
            console.error(err);
            alert("Błąd połączenia");
        }
    };
    const fetchEmployees = () => {
        setEmployeesLoading(true);

        fetch("http://127.0.0.1:8000/employees", {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error("Błąd pobierania pracowników");
                }
                return res.json();
            })
            .then(data => {
                console.log("EMPLOYEES:", data);

                if (Array.isArray(data)) {
                    setEmployees(data);
                } else {
                    console.error("To nie tablica:", data);
                    setEmployees([]);
                }

                setEmployeesLoading(false);
            })
            .catch((err) => {
                console.error("ERROR:", err);
                setEmployees([]);
                setEmployeesLoading(false);
            });
    };
    useEffect(() => {
        fetch('http://127.0.0.1:8000/rooms')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Błąd pobierania danych z serwera');
                }
                return response.json();
            })
            .then(data => {
                setRooms(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);
    const fetchGuests = () => {
        setGuestsLoading(true);

        fetch("http://127.0.0.1:8000/guests", {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("GUESTS:", data); // 🔥 dodaj debug
                setGuests(Array.isArray(data) ? data : []);
                setGuestsLoading(false);
            })
            .catch(() => setGuestsLoading(false));
    };
    const fetchReservations = () => {
        setReservationsLoading(true);

        fetch("http://127.0.0.1:8000/reservations")
            .then(res => res.json())
            .then(data => {
                setReservations(data);
                setReservationsLoading(false);
            })
            .catch(() => setReservationsLoading(false));
    };
    const fetchPayments = () => {
        if (!searchPesel) return;

        setPaymentsLoading(true);

        fetch(`http://127.0.0.1:8000/payments/pesel/${searchPesel}`)
            .then(res => res.json())
            
            .then(data => {
                console.log("PAYMENTS:", data);
                setPayments(data);
                setPaymentsLoading(false);
            })
            .catch(() => setPaymentsLoading(false));
    };
    const fetchReservationServices = (reservationId) => {
        fetch(`${API}/services/reservation/${reservationId}`)
            .then(res => res.json())
            .then(data => {
                console.log("RESERVATION SERVICES:", data);
                setReservationServices(Array.isArray(data) ? data : []);
            });
    };
    const calculatedPrice =
        selectedService && serviceForm.quantity
            ? Number(serviceForm.quantity) * parseFloat(selectedService.price)
            : 0;


    const goBack = () => {
        if (!role) setView("dashboard");
        else if (role === "admin") setView("admin");
        else if (role === "receptionist") setView("reception");
        else if (role === "guest") setView("account");
        else setView("dashboard");
    };
    const fetchMyReservations = () => {
        if (!user || !user.email) return;

        setReservationsLoading(true);

        fetch(`http://127.0.0.1:8000/reservations/user/${user.email}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setReservations(Array.isArray(data) ? data : []);
                } else {
                    setReservations([]);
                }
                setReservationsLoading(false);
            })
            .catch(() => setReservationsLoading(false));
    };
    const cancelReservation = (id) => {
        fetch(`${API}/reservations/${id}/cancel`, {
            method: "PUT"
        }).then(() => {
            alert("Anulowano");
            fetchReservations();
            goBack();
        });
    };

    const extendReservation = (id) => {
        const newDate = prompt("Podaj nową datę końca (YYYY-MM-DD)");

        fetch(`${API}/reservations/${id}/extend`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ end_date: newDate })
        }).then(() => fetchReservations());
    };

    const shortenReservation = (id) => {
        const newDate = prompt("Podaj nową krótszą datę końca");

        fetch(`${API}/reservations/${id}/shorten`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ end_date: newDate })
        }).then(() => fetchReservations());
    };

    const downloadConfirmation = (id) => {
        window.open(`${API}/reservations/${id}/confirmation`);
    };

    const cancelService = (serviceId) => {
        fetch(`${API}/services/${serviceId}/cancel`, {
            method: "PUT"
        }).then(() => fetchMyServices());
    };
    const fetchMyServices = () => {
        if (!user || !user.email) return;

        fetch(`http://127.0.0.1:8000/services/user/${user.email}`)
            .then(res => res.json())
            .then(data => {
                console.log("SERVICES:", data);

                if (Array.isArray(data)) {
                    setMyServices(data);
                } else {
                    setMyServices([]);
                }
            })
            .catch((err) => {
                console.error("Błąd usług:", err);
                setMyServices([]);
            });
    };
    const getGuestName = (guestId) => {
        const guest = guests.find(g => g.guest_id === guestId);
        return guest ? `${guest.first_name} ${guest.last_name}` : "Brak danych";
    };
    const fetchMyPayments = () => {
        if (!user || !user.email) return;

        setPaymentsLoading(true);

        fetch(`http://127.0.0.1:8000/payments/pesel/${searchPesel}`)
            .then(res => res.json())
            .then(data => {
                setPayments(Array.isArray(data) ? data : []);
                setPaymentsLoading(false);
            })
            .catch(() => setPaymentsLoading(false));
    };
    const getRoomImage = (type) => {
        if (type === "single") {
            return "https://images.unsplash.com/photo-1611892440504-42a792e24d32";
        }
        if (type === "double") {
            return "https://images.unsplash.com/photo-1590490360182-c33d57733427";
        }
        if (type === "suite") {
            return "https://images.unsplash.com/photo-1582719508461-905c673771fd";
        }
        return "https://images.unsplash.com/photo-1566073771259-6a8506099945";
    };
    const addGuest = async () => {
        try {
            const res = await fetch("http://127.0.0.1:8000/guests", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    first_name: form.first_name,
                    last_name: form.last_name,
                    pesel: form.pesel,
                    phone_number: form.phone,
                    preferences: form.preferences
                })
            });

            const data = await res.json();
            console.log("NEW GUEST:", data);

            if (!res.ok) {
                alert("Błąd dodawania gościa");
                return;
            }

            alert("Dodano gościa");
            fetchGuests();

        } catch (err) {
            console.error(err);
        }
    };
    const updatePayment = (paymentId, data) => {
        fetch(`http://127.0.0.1:8000/payments/${paymentId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
            .then(() => fetchPayments());
    };

    const styles = {
        page: {
            fontFamily: "Georgia, sans-serif",
            background: "#f8f9fa",
            minHeight: "100vh"
        },

        navbar: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "15px 30px",
            background: "#ffffff",
            borderBottom: "1px solid #ddd"
        },

        logo: {
            fontSize: "20px",
            fontWeight: "bold"
        },

        navLinks: {
            display: "flex",
            gap: "15px"
        },

        navButton: {
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "14px"
        },

        navButtonPrimary: {
            background: "#000",
            color: "#fff",
            border: "none",
            padding: "8px 12px",
            borderRadius: "5px",
            cursor: "pointer"
        },

        hero: {
            height: "400px",
            backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        },

        overlay: {
            background: "rgba(0,0,0,0.5)",
            color: "white",
            padding: "40px",
            textAlign: "center"
        },

        heroTitle: {
            fontSize: "32px",
            marginBottom: "10px",
            fontFamily: "Georgia",
            color: "#fff"
        },
        textTitle: {
            fontSize: "22px",
            marginBottom: "10px",
            fontFamily: "Georgia",
        },

        heroSubtitle: {
            fontSize: "16px"
        },

        section: {
            padding: "40px",
            maxWidth: "900px",
            textAlign: "left",
            margin: "0 auto"
        },

        text: {
            marginTop: "10px",
            fontFamily: "Georgia",
            textAlign: "left",
            lineHeight: "1.6"
        },

        table: {
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px"
        },

        card: {
            maxWidth: "500px",
            margin: "100px auto",
            fontFamily: "Georgia",
            background: "white",
            padding: "20px",
            borderRadius: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        },

        input: {
            width: "90%",
            padding: "10px",
            margin: "10px 0",
            fontFamily: "Georgia",
            border: "1px solid #ccc"
        },

        button: {
            width: "120px",
            padding: "10px",
            background: "#000",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            textAlign: "center"
        },
        container: {
            minHeight: "100vh",
            background: "#f8f9fa",
            fontFamily: "Georgia",
            display: "flex",
            flexDirection: "column"
        },
        registerText: {
            marginTop: "15px",
            fontSize: "14px",
            fontFamily: "Georgia",
            color: "#555"
        },

        registerLink: {
            color: "#000",
            cursor: "pointer",
            textDecoration: "underline",
            fontWeight: "500"
        },
        servicesList: {
            marginTop: "20px",
            display: "flex",
            fontFamily: "Georgia",
            flexDirection: "column",
            gap: "15px"
        },

        serviceItem: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "15px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            background: "#fff"
        },
        buttonWrapper: {
            display: "flex",
            justifyContent: "flex-end",
            minWidth: "140px"
        },
        logo: {
            fontSize: "20px",
            fontWeight: "bold",
            cursor: "pointer"
        },
        roomsGrid: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "20px",
            marginTop: "20px"
        },

        roomCard: {
            background: "#fff",
            borderRadius: "10px",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            paddingBottom: "15px"
        },
        accountGrid: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginTop: "30px"
        },

        accountCard: {
            padding: "25px",
            background: "#fff",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            cursor: "pointer",
            transition: "0.2s"
        },

        roomImage: {
            width: "100%",
            height: "150px",
            objectFit: "cover"
        },
        adminMenu: {
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            marginTop: "20px"
        }
    };

    return (
        <div style={styles.page}>

            {/* NAVBAR */}
            <div style={styles.navbar}>
                <div
                    style={styles.logo}
                    onClick={() => setView("dashboard")}
                >
                    Hotel Bursztyn
                </div>

                <div style={styles.navLinks}>
                    <button style={styles.navButton} onClick={() => setView("rooms")}>
                        Pokoje
                    </button>

                    <button style={styles.navButton} onClick={() => setView("services")}>
                        Usługi
                    </button>

                    <button
                        style={styles.navButtonPrimary}
                        onClick={() => {
                            if (!role) setView("login");
                            else if (role === "admin") setView("admin");
                            else if (role === "receptionist") setView("reception");
                            else setView("account");
                        }}
                    >
                        {role ? "Moje konto" : "Zaloguj się"}
                    </button>
                </div>
            </div>

            {/* HERO SECTION */}
            {view === "dashboard" && (
                <>
                    <div style={styles.hero}>
                        <div style={styles.overlay}>
                            <h1 style={styles.heroTitle}>Hotel Bursztyn</h1>
                            <p style={styles.heroSubtitle}>
                                Wyjątkowe miejsce nad morzem, gdzie komfort spotyka elegancję
                            </p>
                        </div>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.textTitle}>O hotelu</h2>
                        <p style={styles.text}>
                            Hotel Bursztyn to nowoczesny obiekt oferujący komfortowe pokoje oraz szeroki zakres usług.
                            Naszym celem jest zapewnienie najwyższej jakości wypoczynku w spokojnej i eleganckiej atmosferze.
                            Oferujemy dostęp do restauracji, strefy spa oraz profesjonalnej obsługi przez całą dobę.
                        </p>
                    </div>
                </>
            )}

            {/* ROOMS VIEW */}
            {view === "rooms" && (
                <div style={styles.section}>
                    <h2 style={styles.textTitle}>Pokoje</h2>

                    {loading && <p>Ładowanie pokoi...</p>}
                    {error && <p style={{ color: 'red' }}>Błąd: {error}</p>}

                    <div style={styles.roomsGrid}>
                        {rooms.map((room) => (
                            <div key={room.room_id} style={styles.roomCard}>

                                <img
                                    src={getRoomImage(room.room_type)}
                                    alt="Pokój"
                                    style={styles.roomImage}
                                />

                                <h3>Pokój {room.room_number}</h3>
                                <p>Typ: {room.room_type}</p>
                                <p>Cena: {room.price_per_night} PLN</p>
                                <p>Piętro: {room.floor_number}</p>
                                <p>Wyposażenie: {room.equipment}</p>

                                <p style={{
                                    color: room.status === "available" ? "green" : "red"
                                }}>
                                    {statusLabel[room.status] || room.status}
                                </p>

                                <button
                                    style={styles.button}
                                    onClick={() => {
                                        if (!role) {
                                            setView("login");
                                        } else {
                                            setSelectedRoom(room);
                                            setView("roomBooking");
                                        }
                                    }}
                                >
                                    Rezerwuj
                                </button>

                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SERVICES VIEW */}
            {view === "services" && (
                <div style={styles.section}>

                    <p style={styles.text}>
                        Oferujemy szeroki zakres usług dodatkowych zapewniających komfortowy pobyt.
                    </p>

                    <div style={styles.servicesList}>
                        {servicesData.map((service) => (
                            <div key={service.id} style={styles.serviceItem}>
                                <div>
                                    <strong>{service.name}</strong>
                                    <p style={{ margin: 0 }}>{service.price}</p>
                                </div>

                                <div style={styles.buttonWrapper}>
                                    <button
                                        style={styles.button}
                                        onClick={() => {
                                            if (role) {
                                                setSelectedService(service);
                                                setView("serviceBooking");
                                            } else {
                                                setView("login");
                                            }
                                        }}
                                    >
                                        Rezerwuj
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {view === "serviceBooking" && (
                <div style={styles.card}>
                    <h3 style={{ marginBottom: "10px" }}>
                        Usługa: {selectedService?.name}
                    </h3>

                    <p>
                        Cena za sztukę: <strong>{selectedService?.price}</strong>
                    </p>
                    <p style={{ marginTop: "10px", fontSize: "16px" }}>
                        Do zapłaty: <strong>{calculatedPrice} PLN</strong>
                    </p>
                    <input
                        name="date"
                        type="date"
                        style={styles.input}
                        value={serviceForm.date}
                        onChange={handleServiceChange}
                    />

                    <input
                        name="time"
                        type="time"
                        style={styles.input}
                        value={serviceForm.time}
                        onChange={handleServiceChange}
                    />

                    <input
                        name="quantity"
                        type="number"
                        placeholder="Ilość"
                        style={styles.input}
                        value={serviceForm.quantity}
                        onChange={handleServiceChange}
                    />

                    <input
                        name="reservationId"
                        placeholder="Numer rezerwacji pobytu"
                        style={styles.input}
                        value={serviceForm.reservationId}
                        onChange={handleServiceChange}
                    />

                    <button
                        style={styles.button}
                        onClick={async () => {
                            try {
                                const res = await fetch("http://127.0.0.1:8000/services/book", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({
                                        service_id: selectedService.id,
                                        reservation_id: Number(serviceForm.reservationId),
                                        quantity: Number(serviceForm.quantity || 1)
                                    })
                                });

                                const data = await res.json();

                                if (!res.ok) {
                                    alert("Błąd zapisu");
                                    return;
                                }

                                setBookingPrice(data.actual_price);
                                setBookingSuccess(true);


                            } catch (err) {
                                console.error(err);
                                alert("Błąd połączenia");
                            }
                        }}
                    >
                        Zarezerwuj
                    </button>

                    <button
                        style={styles.link}
                        onClick={() => setView("services")}
                    >
                        ← Powrót
                    </button>
                </div>
            )}
            {bookingSuccess && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 999
                }}>
                    <div style={{
                        background: "#fff",
                        padding: "30px",
                        borderRadius: "12px",
                        textAlign: "center",
                        minWidth: "300px",
                        boxShadow: "0 5px 20px rgba(0,0,0,0.2)"
                    }}>
                        <h2>Usługa zarezerwowana</h2>
                        <p style={{ marginTop: "10px" }}>
                            Koszt: <strong>{bookingPrice} PLN</strong>
                        </p>

                        <button
                            style={{ ...styles.button, marginTop: "20px" }}
                            onClick={() => {
                                setBookingSuccess(false);
                                setView("services");
                            }}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
            {/* LOGIN */}
            {view === "login" && (
                <div style={styles.card}>
                    <h2>Logowanie</h2>
                    <input
                        placeholder="Email"
                        style={styles.input}
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Hasło"
                        style={styles.input}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                    />

                    <button
                        onClick={async () => {
                            const email = loginEmail;
                            const password = loginPassword;

                            const formData = new URLSearchParams();
                            formData.append("username", email);
                            formData.append("password", password);

                            try {
                                const res = await fetch("http://127.0.0.1:8000/auth/login", {
                                    method: "POST",
                                    body: formData
                                });

                                const data = await res.json();

                                console.log("LOGIN:", data);

                                if (!res.ok) {
                                    alert(data.detail || "Błąd logowania");
                                    return;
                                }

                                // zapis tokena
                                localStorage.setItem("token", data.access_token);

                                setRole(data.role);
                                setUser({ email });

                                if (data.role === "admin") setView("admin");
                                else if (data.role === "receptionist") setView("reception");
                                else if (data.role === "guest") setView("account");
                                else setView("dashboard");

                            } catch (err) {
                                console.error(err);
                                alert("Błąd połączenia z backendem");
                            }
                        }}
                    >
                        Zaloguj
                    </button>
                    <p style={styles.registerText}>
                        Nie masz konta?{" "}
                        <span style={styles.registerLink} onClick={() => setView("register")}>
                            Zarejestruj się
                        </span>
                    </p>
                </div>
            )}

            {/* ACCOUNT */}
            {view === "account" && (
                <div style={styles.section}>
                    <h2>Moje konto</h2>

                    <div style={styles.accountGrid}>

                        <div
                            style={styles.accountCard}
                            onClick={() => {
                                fetchMyReservations();
                                setView("myReservations");
                            }}
                        >
                            <h3>Moje rezerwacje</h3>
                            <p>Zobacz i zarządzaj swoimi rezerwacjami</p>
                        </div>
                        <div
                            style={styles.accountCard}
                            onClick={() => {
                                fetchMyServices();
                                setView("myServices");
                            }}
                        >
                            <h3>Moje usługi</h3>
                            <p>Zobacz historię usług</p>
                        </div>
                        <div
                            style={styles.accountCard}
                            onClick={() => {
                                fetchMyPayments();
                                setView("myPayments");
                            }}
                        >
                            <h3>Moje płatności</h3>
                            <p>Sprawdź historię swoich płatności</p>
                        </div>
                        <button
                            style={styles.link}
                            onClick={() => {
                                setRole(null);
                                setView("dashboard");
                            }}
                        >
                            Wyloguj
                        </button>
                    </div>

                </div>
            )}
            {view === "admin" && (
                <div style={styles.section}>
                    <h2>Panel administratora</h2>

                    <div style={styles.accountGrid}>

                        <div
                            style={styles.accountCard}
                            onClick={() => setView("rooms")}
                        >
                            <h3>Pokoje</h3>
                            <p>Zarządzaj pokojami</p>
                        </div>

                        <div
                            style={styles.accountCard}
                            onClick={() => {
                                fetchGuests();
                                fetchReservations();
                                setView("adminReservations");
                            }}
                        >
                            <h3>Rezerwacje</h3>
                            <p>Wszystkie rezerwacje</p>
                        </div>

                        <div
                            style={styles.accountCard}
                            onClick={() => {
                                fetchGuests();
                                setView("adminGuests");
                            }}
                        >
                            <h3>Goście</h3>
                            <p>Baza klientów</p>
                        </div>

                        <div
                            style={styles.accountCard}
                            onClick={() => setView("adminPayments")}
                        >
                            <h3>Płatności</h3>
                            <p>Obsługa płatności</p>
                        </div>

                        <div
                            style={styles.accountCard}
                            onClick={() => setView("adminIssues")}
                        >
                            <h3>Prace hotelowe</h3>
                            <p>Zlecenie zadań pracownikom</p>
                           
                        </div>

                        <div
                            style={styles.accountCard}
                            onClick={() => setView("adminReports")}
                        >
                            <h3>Raporty</h3>
                            <p>Statystyki i analizy</p>
                        </div>

                        <div
                            style={styles.accountCard}
                            onClick={() => {
                                fetchEmployees();
                                setView("adminStaff");
                            }}
                        >
                            <h3>Pracownicy</h3>
                            <p>Zarządzanie personelem</p>
                        </div>

                    </div>

                    
                    <button
                        style={styles.link}
                        onClick={() => {
                            setRole(null);
                            setView("dashboard");
                        }}
                    >
                        Wyloguj
                    </button>
                </div>
            )}
            {view === "adminGuests" && (
                <div style={styles.section}>
                    <h2>Lista gości</h2>

                    {guestsLoading && <p>Ładowanie...</p>}

                    {!guestsLoading && (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th>Imię</th>
                                    <th>Nazwisko</th>
                                    <th>PESEL</th>
                                    <th>Email</th>
                                    <th>Telefon</th>
                                    <th>Preferencje</th>
                                </tr>
                            </thead>
                            <tbody>
    {Array.isArray(guests) && guests.length > 0 ? (
        guests.map((g) => (
            <tr
                key={g.guest_id}
                style={{ cursor: "pointer", transition: "0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f1f1f1"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                onClick={() => {
                    setSelectedGuest(g);
                    fetchGuestReservations(g.guest_id);
                    setView("guestHistory");
                }}
            >
                <td>{g.first_name}</td>
                <td>{g.last_name}</td>
                <td>{g.pesel}</td>
                <td>{g.email}</td>
                <td>{g.phone_number}</td>
                <td>{g.preferences}</td>
            </tr>
        ))
    ) : (
        <tr>
            <td colSpan="5">Brak gości</td>
        </tr>
    )}
</tbody>
                        </table>
                    )}

                    <button
                        style={styles.link}
                        onClick={goBack}
                    >
                        ← Powrót
                    </button>
                </div>
            )}
            {view === "register" && (
                <div style={styles.card}>

                    <input
                        name="first_name"
                        placeholder="Imię"
                        style={styles.input}
                        value={form.first_name}
                        onChange={handleChange}
                    />

                    <input
                        name="last_name"
                        placeholder="Nazwisko"
                        style={styles.input}
                        value={form.last_name}
                        onChange={handleChange}
                    />

                    <input
                        name="pesel"
                        placeholder="PESEL"
                        style={styles.input}
                        value={form.pesel}
                        onChange={handleChange}
                    />

                    <input
                        name="phone"
                        placeholder="Numer telefonu"
                        style={styles.input}
                        value={form.phone}
                        onChange={handleChange}
                    />

                    <input
                        name="email"
                        placeholder="Email"
                        style={styles.input}
                        value={form.email}
                        onChange={handleChange}
                    />

                    <input
                        name="preferences"
                        placeholder="Uwagi/Preferencje"
                        style={styles.input}
                        value={form.preferences}
                        onChange={handleChange}
                    />

                    <input
                        name="password"
                        type="password"
                        placeholder="Hasło"
                        style={styles.input}
                        value={form.password}
                        onChange={handleChange}
                    />

                    <input
                        name="confirmPassword"
                        type="password"
                        placeholder="Powtórz hasło"
                        style={styles.input}
                        value={form.confirmPassword}
                        onChange={handleChange}
                    />

                    <button
                        style={styles.button}
                        onClick={async () => {

                            if (form.password !== form.confirmPassword) {
                                alert("Hasła nie są takie same!");
                                return;
                            }

                            if (form.password.length < 6) {
                                alert("Hasło musi mieć min. 6 znaków");
                                return;
                            }

                            try {
                                const res = await fetch("http://127.0.0.1:8000/auth/register", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({
                                        user_in: {
                                            email: form.email,
                                            password: form.password
                                        },
                                        guest_in: {
                                            first_name: form.first_name,
                                            last_name: form.last_name,
                                            pesel: form.pesel,
                                            phone_number: form.phone,
                                            preferences: form.preferences
                                        }
                                    })
                                });

                                const data = await res.json();

                                if (!res.ok) {
                                    alert(data.detail || "Błąd rejestracji");
                                    return;
                                }

                                alert("Rejestracja OK");
                                setView("login");

                            } catch (err) {
                                console.error(err);
                                alert("Błąd połączenia");
                            }
                        }}
                    >
                        Zarejestruj
                    </button>

                    <p style={styles.registerText}>
                        Masz już konto?{" "}
                        <span style={styles.registerLink} onClick={() => setView("login")}>
                            Zaloguj się
                        </span>
                    </p>
                </div>
            )}
            
            {view === "adminReservations" && (
                <div style={styles.section}>
                    <h2>Rezerwacje</h2>

                    {reservationsLoading && <p>Ładowanie...</p>}

                    {!reservationsLoading && (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Gość</th>
                                    <th>Data od</th>
                                    <th>Data do</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.isArray(reservations) && reservations.length > 0 ? (
                                    reservations.map((r) => (
                                        <tr
                                            key={r.reservation_id}
                                            style={{ cursor: "pointer" }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = "#f1f1f1"}
                                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                            onClick={() => {
                                                setSelectedReservation(r);
                                                fetchReservationServices(r.reservation_id);
                                                setView("reservationDetails");
                                            }}
                                        >
                                            <td>{r.reservation_id}</td>
                                            <td>{getGuestName(r.main_guest_id)}</td>
                                            <td>{r.start_date ? r.start_date.split('T')[0] : ""}</td>
                                            <td>{r.end_date ? r.end_date.split('T')[0] : ""}</td>
                                            <td>{r.status}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4">Brak rezerwacji</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}

                    <button
                        style={styles.link}
                        onClick = { goBack }
                    >
                        ← Powrót
                    </button>
                </div>
            )}
            {view === "adminReports" && (
                <div style={styles.section}>

                    <h2>Raporty</h2>

                    <div style={styles.accountGrid}>

                        <div
                            style={styles.accountCard}
                            onClick={() => setView("reportOccupancy")}
                        >
                            <h3>Obłożenie hotelu</h3>
                        </div>

                        <div
                            style={styles.accountCard}
                            onClick={() => setView("reportRevenue")}
                        >
                            <h3>Przychody</h3>
                        </div>

                        <div
                            style={styles.accountCard}
                            onClick={() => setView("reportServices")}
                        >
                            <h3>Analiza usług</h3>
                        </div>

                        <div
                            style={styles.accountCard}
                            onClick={() => setView("reportLength")}
                        >
                            <h3>Średnia długość pobytu</h3>
                        </div>

                        <div
                            style={styles.accountCard}
                            onClick={() => setView("reportReturning")}
                        >
                            <h3>Powracający goście</h3>
                        </div>

                    </div>

                    <button
                        style={styles.link}
                        onClick={() => setView("admin")}
                    >
                        ← Powrót
                    </button>

                </div>
            )}
            {view === "reportOccupancy" && (
                <div style={styles.section}>
                    <h2>Obłożenie hotelu</h2>
                    <button style={styles.button} onClick={() => fetchReport("occupancy")}>Generuj raport</button>
                    {reportData && (
                        <div style={{marginTop: '20px'}}>
                            <p>Wszystkich pokoi: {reportData.total_rooms}</p>
                            <p>Zajętych: {reportData.occupied_rooms}</p>
                            <h3>Obłożenie: {reportData.occupancy_rate}%</h3>
                        </div>
                    )}
                    <button style={styles.link} onClick={() => {setView("adminReports"); setReportData(null);}}>← Powrót</button>
                </div>
            )}

            {view === "reportRevenue" && (
                <div style={styles.section}>
                    <h2>Przychody</h2>
                    <button style={styles.button} onClick={() => fetchReport("revenue")}>Generuj raport</button>
                    {reportData && (
                        <h1 style={{marginTop: '20px'}}>Suma: {reportData.total_revenue || 0} PLN</h1>
                    )}
                    <button style={styles.link} onClick={() => {setView("adminReports"); setReportData(null);}}>← Powrót</button>
                </div>
            )}

            {view === "reportServices" && (
                <div style={styles.section}>
                    <h2>Analiza usług</h2>
                    <button style={styles.button} onClick={() => fetchReport("services-analysis")}>Pobierz statystyki</button>
                    {reportData && Array.isArray(reportData) && (
                        <table style={styles.table}>
                            <thead>
                                <tr><th>Usługa</th><th>Liczba użyć</th><th>Suma przychodu</th></tr>
                            </thead>
                            <tbody>
                                {reportData.map((s, i) => (
                                    <tr key={i}>
                                        <td>{s.name}</td>
                                        <td>{s.usage_count}</td>
                                        <td>{s.total_earned || 0} PLN</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    <button style={styles.link} onClick={() => {setView("adminReports"); setReportData(null);}}>← Powrót</button>
                </div>
            )}

            {view === "reportLength" && (
                <div style={styles.section}>
                    <h2>Średnia długość pobytu</h2>
                    <button style={styles.button} onClick={() => fetchReport("average-stay")}>Oblicz średnią</button>
                    {reportData && (
                        <div style={{marginTop: '20px', textAlign: 'center'}}>
                            <h1 style={{fontSize: '48px'}}>{reportData.avg_days || 0}</h1>
                            <p>dni (średnio na rezerwację)</p>
                        </div>
                    )}
                    <button style={styles.link} onClick={() => {setView("adminReports"); setReportData(null);}}>← Powrót</button>
                </div>
            )}

            {view === "reportReturning" && (
                <div style={styles.section}>
                    <h2>Powracający goście</h2>
                    <button style={styles.button} onClick={() => fetchReport("returning-guests")}>Pobierz listę</button>
                    <table style={styles.table}>
                        <thead>
                            <tr><th>Imię</th><th>Nazwisko</th><th>Liczba wizyt</th></tr>
                        </thead>
                        <tbody>
                            {Array.isArray(reportData) && reportData.map((g, i) => (
                                <tr key={i}><td>{g.first_name}</td><td>{g.last_name}</td><td>{g.reservation_count}</td></tr>
                            ))}
                        </tbody>
                    </table>
                    <button style={styles.link} onClick={() => {setView("adminReports"); setReportData(null);}}>← Powrót</button>
                </div>
            )}

            {view === "adminPayments" && (
                <div style={styles.section}>
                    <h2>Płatności</h2>

                    <div style={{ marginTop: "20px" }}>
                        <input
                            placeholder="Wpisz PESEL"
                            style={styles.input}
                            value={searchPesel}
                            onChange={(e) => setSearchPesel(e.target.value)}
                        />

                        <button style={styles.button} onClick={fetchPayments}>
                            Szukaj
                        </button>
                    </div>

                    {paymentsLoading && <p>Ładowanie...</p>}

                    {!paymentsLoading && payments.length > 0 && (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th>ID płatności</th>
                                    <th>Kwota</th>
                                    <th>Data</th>
                                    <th>Rezerwacja</th>
                                    <th>Metoda</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((p) => (
                                    <tr key={p.payment_id}>
                                        <td>{p.payment_id}</td>
                                        <td>{p.amount} PLN</td>
                                        <td>{p.payment_date}</td>
                                        <td>{p.reservation_id}</td>

                                        {/* METODA */}
                                        <td>
                                            <select
                                                value={p.method}
                                                onChange={(e) =>
                                                    updatePayment(p.payment_id, {
                                                        method: e.target.value,
                                                        status: p.status
                                                    })
                                                }
                                            >
                                                <option value="karta">Karta</option>
                                                <option value="gotowka">Gotówka</option>
                                                <option value="przelew">Przelew</option>
                                            </select>
                                        </td>

                                        {/* STATUS */}
                                        <td>
                                            <select
                                                value={p.status}
                                                onChange={(e) =>
                                                    updatePayment(p.payment_id, {
                                                        method: p.method,
                                                        status: e.target.value
                                                    })
                                                }
                                            >
                                                <option value="niezaplacone">Niezapłacone</option>
                                                <option value="zaplacone">Zapłacone</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {!paymentsLoading && payments.length === 0 && (
                        <p>Brak płatności dla tego użytkownika</p>
                    )}

                    <button
                        style={styles.link}
                        onClick={goBack}
                    >
                        ← Powrót
                    </button>
                </div>
            )}
            {view === "reception" && (
                <div style={styles.section}>
                    <h2>Panel recepcjonisty</h2>

                    <div style={styles.accountGrid}>

                        <div
                            style={styles.accountCard}
                            onClick={() => {
                                fetchGuests();
                                fetchReservations();
                                setView("adminReservations");
                            }}
                        >
                            <h3>Rezerwacje</h3>
                            <p>Zarządzaj rezerwacjami</p>
                        </div>

                        <div
                            style={styles.accountCard}
                            onClick={() => {
                                fetchGuests();
                                setView("adminGuests");
                            }}
                        >
                            <h3>Goście</h3>
                            <p>Baza klientów</p>
                        </div>

                        <div
                            style={styles.accountCard}
                            onClick={() => setView("adminPayments")}
                        >
                            <h3>Płatności</h3>
                            <p>Obsługa płatności</p>
                        </div>

                    </div>

                    <button
                        style={styles.link}
                        onClick={() => {
                            setRole(null);
                            setView("dashboard");
                        }}
                    >
                        Wyloguj
                    </button>
                </div>
            )}
            {view === "roomBooking" && selectedRoom && (
                <div style={styles.card}>
                    <h2>Rezerwacja pokoju</h2>

                    <p><strong>Pokój:</strong> {selectedRoom.room_number}</p>
                    <p><strong>Typ:</strong> {selectedRoom.room_type}</p>
                    <p><strong>Cena:</strong> {selectedRoom.price_per_night} PLN</p>
                    <p>
                        Liczba dni: <strong>{calculateDays()}</strong>
                    </p>

                    <p>
                        Do zapłaty: <strong>{totalPrice} PLN</strong>
                    </p>
                    <input
                        type="date"
                        style={styles.input}
                        value={roomForm.startDate}
                        onChange={(e) =>
                            setRoomForm({ ...roomForm, startDate: e.target.value })
                        }
                    />

                    <input
                        type="date"
                        style={styles.input}
                        value={roomForm.endDate}
                        onChange={(e) =>
                            setRoomForm({ ...roomForm, endDate: e.target.value })
                        }
                    />

                    <button
                        style={styles.button}
                        onClick={async () => {
                            try {
                                const res = await fetch(`${API}/reservations`, {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({
                                        room_id: selectedRoom.room_id,
                                        start_date: roomForm.startDate,
                                        end_date: roomForm.endDate,
                                        email: user.email,
                                        role: role
                                    })
                                });

                                const data = await res.json();

                                if (!res.ok) {
                                    alert("Błąd rezerwacji");
                                    return;
                                }

                                setBookingPrice(totalPrice);
                                setBookingSuccess(true);

                            } catch (err) {
                                console.error(err);
                                alert("Błąd połączenia");
                            }
                        }}
                    >
                        Zarezerwuj
                    </button>

                    <button style={styles.link} onClick={goBack}>
                        ← Powrót
                    </button>
                </div>
            )}
            {view === "myReservations" && (
                <div style={styles.section}>
                    <h2>Moje rezerwacje</h2>

                    {reservationsLoading && <p>Ładowanie...</p>}

                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Data od</th>
                                <th>Data do</th>
                                <th>Status</th>
                                <th>Pokój</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservations.map((r) => (
                                <tr
                                    key={r.reservation_id}
                                    style={{ cursor: "pointer", transition: "0.2s" }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = "#f1f1f1"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                    onClick={() => {
                                        setSelectedReservation(r);
                                        fetchReservationServices(r.reservation_id);
                                        setView("reservationDetails");
                                    }}
                                >
                                    <td>{r.reservation_id}</td>
                                    <td>{r.start_date}</td>
                                    <td>{r.end_date}</td>
                                    <td>{r.status}</td>
                                    <td>{r.room_id}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <button style={styles.link} onClick={goBack}>
                        ← Powrót
                    </button>
                </div>
            )}
            {view === "myServices" && (
                <div style={styles.section}>
                    <h2>Moje usługi</h2>

                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th>Nazwa</th>
                                <th>Data</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myServices.map((s, i) => (
                                <tr key={i}>
                                    <td>{s.name}</td>
                                    <td>{s.date}</td>
                                    <td>{s.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <button style={styles.link} onClick={goBack}>
                        ← Powrót
                    </button>
                </div>
            )}
            {view === "myPayments" && (
                <div style={styles.section}>
                    <h2>Płatności użytkownika</h2>

                    {paymentsLoading && <p>Ładowanie...</p>}

                    {!paymentsLoading && payments.length > 0 && (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Kwota</th>
                                    <th>Metoda</th>
                                    <th>Status</th>
                                    <th>Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((p) => (
                                    <tr key={p.payment_id}>
                                        <td>{p.payment_id}</td>
                                        <td>{p.amount} PLN</td>
                                        <td>{p.method}</td>
                                        <td>{p.status}</td>
                                        <td>{p.payment_date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {!paymentsLoading && payments.length === 0 && (
                        <p>Brak płatności</p>
                    )}

                    <button style={styles.link} onClick={goBack}>
                        ← Powrót
                    </button>
                </div>
            )}
            {view === "guestHistory" && selectedGuest && (
                <div style={styles.section}>
                    <h2>
                        Historia pobytu: {selectedGuest.first_name} {selectedGuest.last_name}
                    </h2>

                    {reservationsLoading && <p>Ładowanie...</p>}

                    {!reservationsLoading && (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th>ID rezerwacji</th>
                                    <th>Data od</th>
                                    <th>Data do</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.isArray(reservations) && reservations.length > 0 ? (
                                    reservations.map((r) => (
                                        <tr key={r.reservation_id}>
                                            <td>{r.reservation_id}</td>
                                            <td>{r.start_date}</td>
                                            <td>{r.end_date}</td>
                                            <td>{r.status}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4">Brak rezerwacji</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}

                    <button
                        style={styles.link}
                        onClick={() => setView("adminGuests")}
                    >
                        ← Powrót
                    </button>
                </div>
            )}
            {view === "adminStaff" && (
                <div style={styles.section}>
                    <h2>Pracownicy</h2>

                    {employeesLoading && <p>Ładowanie...</p>}

                    {!employeesLoading && (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th>Imię</th>
                                    <th>Nazwisko</th>
                                    <th>Email</th>
                                    <th>Telefon</th>
                                    <th>Stanowisko</th>
                                    <th>Numer Dokumentu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.isArray(employees) && employees.length > 0 ? (
                                    employees.map((e) => (
                                        <tr key={e.employee_id}>
                                            <td>{e.first_name}</td>
                                            <td>{e.last_name}</td>
                                            <td>{e.email}</td>
                                            <td>{e.phone_number}</td>
                                            <td>{e.position}</td>
                                            <td>{e.document_number}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6">Brak pracowników</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}

                    <button style={styles.link} onClick={goBack}>
                        ← Powrót
                    </button>
                </div>
            )}
            {view === "adminIssues" && (
                <div style={styles.section}>
                    <h2>Zadania hotelowe</h2>

                    {tasksLoading && <p>Ładowanie...</p>}

                    {!tasksLoading && (
                        <>
                            <h3>Zgłoś usterkę</h3>

                            <input
                                placeholder="Numer pokoju"
                                style={styles.input}
                                value={newTask.room_number}
                                onChange={(e) => setNewTask({ ...newTask, room_number: e.target.value })}
                            />

                            <input
                                placeholder="Opis usterki"
                                style={styles.input}
                                value={newTask.description}
                                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                            />

                            <button style={styles.button} onClick={addTask}>
                                Zgłoś usterkę
                            </button>

                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Pokój</th>
                                        <th>Opis</th>
                                        <th>Status</th>
                                        <th>Pracownik</th>
                                        <th>Akcje</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {tasks.map((t) => (
                                        <tr key={t.task_id}>
                                            <td>{t.task_id}</td>
                                            <td>{t.room_id}</td>
                                            <td>{t.description}</td>

                                            <td>
                                                <select
                                                    value={t.status}
                                                    onChange={(e) =>
                                                        updateTaskStatus(t.task_id, e.target.value)
                                                    }
                                                >
                                                    <option value="todo">Do zrobienia</option>
                                                    <option value="in_progress">W trakcie</option>
                                                    <option value="done">Zakończone</option>
                                                </select>
                                            </td>

                                            <td>-</td>
                                            <td>-</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}

                    <button style={styles.link} onClick={goBack}>
                        ← Powrót
                    </button>
                </div>
            )}
            {view === "reservationDetails" && selectedReservation && (
                <div style={styles.section}>
                    <h2>Szczegóły rezerwacji #{selectedReservation.reservation_id}</h2>

                    <p><strong>Pokój:</strong> {selectedReservation.room_id}</p>
                    <p><strong>Data od:</strong> {selectedReservation.start_date}</p>
                    <p><strong>Data do:</strong> {selectedReservation.end_date}</p>
                    <p><strong>Status:</strong> {selectedReservation.status}</p>

                    {/* AKCJE */}
                    <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                        <button style={styles.button} onClick={() => cancelReservation(selectedReservation.reservation_id)}>
                            Anuluj
                        </button>

                        <button style={styles.button} onClick={() => extendReservation(selectedReservation.reservation_id)}>
                            Przedłuż
                        </button>

                        <button style={styles.button} onClick={() => shortenReservation(selectedReservation.reservation_id)}>
                            Skróć
                        </button>

                        <button style={styles.button} onClick={() => downloadConfirmation(selectedReservation.reservation_id)}>
                            Pobierz potwierdzenie
                        </button>
                    </div>

                    {/* USŁUGI */}
                    <h3 style={{ marginTop: "30px" }}>Usługi</h3>

                    {reservationServices.length ? (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th>Nazwa</th>
                                    <th>Data</th>
                                    <th>Status</th>
                                    <th>Akcja</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reservationServices.map((s, i) => (
                                    <tr key={i}>
                                        <td>{s.name}</td>
                                        <td>{s.date}</td>
                                        <td>{s.status}</td>
                                        <td>
                                            <button
                                                style={styles.button}
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
                        <p>Brak usług</p>
                    )}

                    <button style={styles.link} onClick={goBack}>
                        ← Powrót
                    </button>
                </div>
            )}
        </div>
    );
}
export default App;