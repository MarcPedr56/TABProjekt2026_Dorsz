import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore'; // Import twojego stanu

const API = "http://127.0.0.1:8000";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    
    const login = useAuthStore(state => state.login);
    const navigate = useNavigate();

    const handleLogin = async () => {
        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);

        try {
            const res = await fetch(`${API}/auth/login`, {
                method: "POST",
                body: formData
            });
            const data = await res.json();

            if (!res.ok) {
                alert(data.detail || "Błąd logowania");
                return;
            }

            login({ email }, data.role, data.access_token);

            if (data.role === "admin") navigate("/admin");
            else if (data.role === "receptionist") navigate("/reception");
            else if (data.role === "guest") navigate("/account");
            else navigate("/");

        } catch (err) {
            console.error(err);
            alert("Błąd połączenia z backendem");
        }
    };

    return (
        <div className="card">
            <h2>Logowanie</h2>
            <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Hasło" value={password} onChange={(e) => setPassword(e.target.value)} />
            
            <button onClick={handleLogin}>Zaloguj</button>
            
            <p>
                Nie masz konta? <Link to="/register">Zarejestruj się</Link>
            </p>
        </div>
    );
};

export default Login;