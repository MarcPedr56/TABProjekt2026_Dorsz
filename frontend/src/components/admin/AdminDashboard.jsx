import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const logout = useAuthStore(state => state.logout);

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <div className="section">
            <h2>Panel administratora</h2>

            <div className="accountGrid">
                <div className="accountCard" onClick={() => navigate("/rooms")}>
                    <h3>Pokoje</h3>
                    <p>Przejdź do wyszukiwarki i rezerwacji</p>
                </div>
                <div className="accountCard" onClick={() => navigate("/admin/reservations")}>
                    <h3>Rezerwacje</h3>
                    <p>Wszystkie rezerwacje</p>
                </div>
                <div className="accountCard" onClick={() => navigate("/admin/guests")}>
                    <h3>Goście</h3>
                    <p>Baza klientów</p>
                </div>
                <div className="accountCard" onClick={() => navigate("/admin/payments")}>
                    <h3>Płatności</h3>
                    <p>Obsługa płatności</p>
                </div>
                <div className="accountCard" onClick={() => navigate("/admin/issues")}>
                    <h3>Prace hotelowe</h3>
                    <p>Zlecenie zadań pracownikom</p>
                </div>
                <div className="accountCard" onClick={() => navigate("/admin/reports")}>
                    <h3>Raporty</h3>
                    <p>Statystyki i analizy</p>
                </div>
                <div className="accountCard" onClick={() => navigate("/admin/staff")}>
                    <h3>Pracownicy</h3>
                    <p>Zarządzanie personelem</p>
                </div>
            </div>

            <button className="nav-button-primary" style={{ marginTop: '20px' }} onClick={handleLogout}>
                Wyloguj
            </button>
        </div>
    );
};

export default AdminDashboard;