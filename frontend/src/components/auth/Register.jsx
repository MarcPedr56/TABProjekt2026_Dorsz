import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API = "http://127.0.0.1:8000";

const Register = () => {
    const navigate = useNavigate();
    
    // Lokalny stan formularza
    const [form, setForm] = useState({
        first_name: "", last_name: "", pesel: "", phone: "",
        email: "", preferences: "", password: "", confirmPassword: ""
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleRegister = async () => {

        // IMIĘ I NAZWISKO — tylko litery
        const nameRegex = /^[A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż]+$/;

        // IMIĘ
        if (form.first_name.trim().length < 2) {
            alert("Imię musi mieć minimum 2 znaki");
            return;
        }

        if (!nameRegex.test(form.first_name.trim())) {
            alert("Imię może zawierać tylko litery");
            return;
        }

        // NAZWISKO
        if (form.last_name.trim().length < 2) {
            alert("Nazwisko musi mieć minimum 2 znaki");
            return;
        }

        if (!nameRegex.test(form.last_name.trim())) {
            alert("Nazwisko może zawierać tylko litery");
            return;
        }

        // EMAIL
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(form.email)) {
            alert("Niepoprawny format email");
            return;
        }

        // PESEL
        const peselRegex = /^[0-9]{11}$/;

        if (!peselRegex.test(form.pesel)) {
            alert("PESEL musi mieć dokładnie 11 cyfr");
            return;
        }

        // TELEFON
        const phoneRegex = /^[0-9]{9}$/;

        if (!phoneRegex.test(form.phone)) {
            alert("Numer telefonu musi mieć 9 cyfr");
            return;
        }

        // HASŁO
        if (form.password.length < 6) {
            alert("Hasło musi mieć minimum 6 znaków");
            return;
        }

        // POWTÓRZENIE HASŁA
        if (form.password !== form.confirmPassword) {
            alert("Hasła nie są takie same");
            return;
        }

        try {

            const res = await fetch(`${API}/auth/register`, {
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

            alert("Rejestracja zakończona sukcesem");

            navigate("/login");

        } catch (err) {

            console.error(err);

            alert("Błąd połączenia z serwerem");
        }
    };
    return (
        <div className="card">
            <h2>Rejestracja</h2>
            <input
                name="first_name"
                placeholder="Imię"
                value={form.first_name}
                onChange={(e) =>
                    setForm({
                        ...form,
                        first_name: e.target.value.replace(/[^A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż]/g, "")
                    })
                }
            />

            <input
                name="last_name"
                placeholder="Nazwisko"
                value={form.last_name}
                onChange={(e) =>
                    setForm({
                        ...form,
                        last_name: e.target.value.replace(/[^A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż]/g, "")
                    })
                }
            />
            <input
                name="pesel"
                placeholder="PESEL"
                value={form.pesel}
                maxLength={11}
                onChange={(e) =>
                    setForm({
                        ...form,
                        pesel: e.target.value.replace(/\D/g, "")
                    })
                }
            />

            <input
                name="phone"
                placeholder="Numer telefonu"
                value={form.phone}
                maxLength={9}
                onChange={(e) =>
                    setForm({
                        ...form,
                        phone: e.target.value.replace(/\D/g, "")
                    })
                }
            />
            <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
            <input name="preferences" placeholder="Uwagi/Preferencje" value={form.preferences} onChange={handleChange} />
            <input name="password" type="password" placeholder="Hasło" value={form.password} onChange={handleChange} />
            <input name="confirmPassword" type="password" placeholder="Powtórz hasło" value={form.confirmPassword} onChange={handleChange} />
            
            <button onClick={handleRegister} className="button">Zarejestruj</button>
            
            <p className="registerText">
                Masz już konto? <Link to="/login">Zaloguj się</Link>
            </p>
        </div>
    );
};

export default Register;