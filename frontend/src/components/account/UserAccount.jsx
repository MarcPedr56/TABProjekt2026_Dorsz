import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const UserAccount = () => {
    const navigate = useNavigate();
    const logout = useAuthStore(state => state.logout);

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <div className="section">
            <h2>Moje konto</h2>

            <div className="accountGrid">
                <div className="accountCard" onClick={() => navigate("/account/reservations")}>
                    <h3>Moje rezerwacje</h3>
                    <p>Zobacz i zarządzaj swoimi rezerwacjami</p>
                </div>
                <div className="accountCard" onClick={() => navigate("/account/services")}>
                    <h3>Moje usługi</h3>
                    <p>Zobacz historię usług</p>
                </div>
                <div className="accountCard" onClick={() => navigate("/account/payments")}>
                    <h3>Moje płatności</h3>
                    <p>Sprawdź historię swoich płatności</p>
                </div>
            </div>
            
            <button className="nav-button-primary" style={{ marginTop: "30px" }} onClick={handleLogout}>
                Wyloguj
            </button>
        </div>
    );
};

export default UserAccount;