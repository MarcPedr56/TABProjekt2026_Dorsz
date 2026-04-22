import { useState, useEffect } from 'react'
import './App.css'

function App() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [role, setRole] = useState(null); 
    const [view, setView] = useState("dashboard");
    const [selectedGuest, setSelectedGuest] = useState(null);
    const [reservations, setReservations] = useState([]);
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
        preferences: ""
    });
    const [payments, setPayments] = useState([]);
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
    const handleServiceChange = (e) => {
        setServiceForm({
            ...serviceForm,
            [e.target.name]: e.target.value
        });
    };
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
    const fetchEmployees = () => {
        setEmployeesLoading(true);

        fetch("http://127.0.0.1:8000/employees")
            .then(res => res.json())
            .then(data => {
                setEmployees(Array.isArray(data) ? data : []);
                setEmployeesLoading(false);
            })
            .catch(() => setEmployeesLoading(false));
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

        fetch("http://127.0.0.1:8000/guests")
            .then(res => res.json())
            .then(data => {
                setGuests(data);
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

        fetch(`http://127.0.0.1:8000/payments/${searchPesel}`)
            .then(res => res.json())
            .then(data => {
                setPayments(data);
                setPaymentsLoading(false);
            })
            .catch(() => setPaymentsLoading(false));
    };
    const goBack = () => {
        if (!role) setView("dashboard");
        else if (role === "admin") setView("admin");
        else if (role === "reception") setView("reception");
        else setView("account");
    };
    const fetchMyReservations = () => {
        if (!user || !user.email) return;

        setReservationsLoading(true);

        fetch(`http://127.0.0.1:8000/reservations/user/${user.email}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setReservations(data);
                } else {
                    setReservations([]);
                }
                setReservationsLoading(false);
            })
            .catch(() => setReservationsLoading(false));
    };
    const fetchMyServices = () => {
        if (!user || !user.email) return;

        fetch(`http://127.0.0.1:8000/services/user/${user.email}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setMyServices(data);
                } else {
                    setMyServices([]); 
                    console.log("Niepoprawne dane usług:", data);
                }
            })

            .catch(() => setMyServices([]));
    };
    const fetchMyPayments = () => {
        if (!user || !user.email) return;

        setPaymentsLoading(true);

        fetch(`http://127.0.0.1:8000/payments/user/${user.email}`)
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
                            else if (role === "reception") setView("reception");
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

                                <p style={{
                                    color: room.status === "available" ? "green" : "red"
                                }}>
                                    {room.status}
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
                        {[
                            { name: "Spa", price: "150 PLN" },
                            { name: "Basen", price: "50 PLN" },
                            { name: "Parking", price: "120 PLN" },
                            { name: "Restauracja", price: "10 PLN" },
                            { name: "Pralnia", price: "20 PLN" },
                            { name: "Sala konferencyjna", price: "300 PLN" }
                        ].map((service, index) => (
                            <div key={index} style={styles.serviceItem}>
                                <div>
                                    <strong>{service.name}</strong>
                                    <p style={{ margin: 0 }}>{service.price}</p>
                                </div>

                                <div style={styles.buttonWrapper}>
                                    <button
                                        style={styles.button}
                                        onClick={() => {
                                            if (role) {
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
                    <h2>Rezerwacja usługi</h2>

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
                        onClick={() => {
                            console.log("Rezerwacja usługi:", serviceForm);

                            // później tutaj pójdzie fetch do backendu

                            setView("services");
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
            {/* LOGIN */}
            {view === "login" && (
                <div style={styles.card}>
                    <h2>Logowanie</h2>
                    <input placeholder="Email" style={styles.input} />
                    <input type="password" placeholder="Hasło" style={styles.input} />

                    <button
                        onClick={() => {
                            // MOCK LOGIKA
                            const email = document.querySelector("input[placeholder='Email']").value;

                            if (email === "admin@test.com") {
                                setRole("admin");
                                setUser({ email });
                                setView("admin");
                            } else if (email === "recepcja@test.com") {
                                setRole("reception");
                                setUser({ email });
                                setView("reception");
                            } else {
                                setRole("user");
                                setUser({ email }); // 🔥 KLUCZOWE
                                setView("account");
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
                            <h3>Usterki</h3>
                            <p>Zgłoszenia techniczne</p>
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
                style={{ cursor: "pointer" }}
                onClick={() => {
                    setSelectedGuest(g);
                    fetchGuestReservations(g.guest_id);
                    setView("guestHistory");
                }}
            >
                <td>{g.first_name}</td>
                <td>{g.last_name}</td>
                <td>{g.e_mail}</td>
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

                    <button
                        style={styles.button}
                        onClick={() => {
                            console.log("Dane rejestracji:", form);
                            setView("login");
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
                    <p>Tu będzie raport obłożenia</p>
                    <button style={styles.link} onClick={() => setView("adminReports")}>← Powrót</button>
                </div>
            )}

            {view === "reportRevenue" && (
                <div style={styles.section}>
                    <h2>Przychody</h2>
                    <p>Tu będzie raport przychodów</p>
                    <button style={styles.link} onClick={() => setView("adminReports")}>← Powrót</button>
                </div>
            )}

            {view === "reportServices" && (
                <div style={styles.section}>
                    <h2>Analiza usług</h2>
                    <p>Tu będzie analiza usług</p>
                    <button style={styles.link} onClick={() => setView("adminReports")}>← Powrót</button>
                </div>
            )}

            {view === "reportLength" && (
                <div style={styles.section}>
                    <h2>Średnia długość pobytu</h2>
                    <p>Tu będą statystyki pobytu</p>
                    <button style={styles.link} onClick={() => setView("adminReports")}>← Powrót</button>
                </div>
            )}

            {view === "reportReturning" && (
                <div style={styles.section}>
                    <h2>Powracający goście</h2>
                    <p>Tu będą dane o powracających gościach</p>
                    <button style={styles.link} onClick={() => setView("adminReports")}>← Powrót</button>
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

                    <input
                        type="date"
                        style={styles.input}
                        placeholder="Data od"
                    />

                    <input
                        type="date"
                        style={styles.input}
                        placeholder="Data do"
                    />

                    <button
                        style={styles.button}
                        onClick={() => {
                            console.log("Rezerwacja pokoju:", selectedRoom);
                            setView("rooms");
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
                            </tr>
                        </thead>
                        <tbody>
                            {reservations.map((r) => (
                                <tr key={r.reservation_id}>
                                    <td>{r.reservation_id}</td>
                                    <td>{r.start_date}</td>
                                    <td>{r.end_date}</td>
                                    <td>{r.status}</td>
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
                                    <th>Dokument</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.length > 0 ? (
                                    employees.map((e) => (
                                        <tr key={e.employee_id}>
                                            <td>{e.first_name}</td>
                                            <td>{e.last_name}</td>
                                            <td>{e.e_mail}</td>
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
        </div>
    );
}
export default App;