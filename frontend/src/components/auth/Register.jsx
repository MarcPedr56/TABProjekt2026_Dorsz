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
        if (form.password !== form.confirmPassword) {
            alert("Hasła nie są takie same!");
            return;
        }
        if (form.password.length < 6) {
            alert("Hasło musi mieć min. 6 znaków");
            return;
        }

        try {
            const res = await fetch(`${API}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_in: { email: form.email, password: form.password },
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
            
            alert("Rejestracja zakończona sukcesem.");
            navigate("/login"); // <-- Magia routera
            
        } catch (err) {
            console.error(err);
            alert("Błąd połączenia z serwerem");
        }
    };

    return (
        <div className="card">
            <h2>Rejestracja</h2>
            <input name="first_name" placeholder="Imię" value={form.first_name} onChange={handleChange} />
            <input name="last_name" placeholder="Nazwisko" value={form.last_name} onChange={handleChange} />
            <input name="pesel" placeholder="PESEL" value={form.pesel} onChange={handleChange} />
            <input name="phone" placeholder="Numer telefonu" value={form.phone} onChange={handleChange} />
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