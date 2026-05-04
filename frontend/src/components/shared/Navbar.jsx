import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const Navbar = () => {
    // Magia Zustand - pobierasz tylko to, czego potrzebujesz
    const { role, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/'); // Wyrzucamy na stronę główną
    };

    return (
        <div className="navbar">
            <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                Hotel Bursztyn
            </div>

            <div className="nav-links">
                <Link to="/rooms" className="nav-button">Pokoje</Link>
                <Link to="/services" className="nav-button">Usługi</Link>

                {!role ? (
                    <button className="nav-button-primary" onClick={() => navigate('/login')}>
                        Zaloguj się
                    </button>
                ) : (
                    <>
                        <button 
                            className="nav-button-primary" 
                            onClick={() => navigate(role === 'admin' ? '/admin' : '/account')}
                        >
                            Moje konto
                        </button>
                        <button className="nav-button" onClick={handleLogout}>
                            Wyloguj
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Navbar;