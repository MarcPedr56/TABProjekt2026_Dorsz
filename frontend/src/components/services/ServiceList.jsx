import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

// TODO: Wywal to w przyszłości do bazy danych!
export const SERVICES_DATA = [
    { id: 1, name: "Spa", price: 150 },
    { id: 2, name: "Basen", price: 50 },
    { id: 3, name: "Parking", price: 120 },
    { id: 4, name: "Restauracja", price: 10 },
    { id: 5, name: "Pralnia", price: 20 },
    { id: 6, name: "Sala konferencyjna", price: 300 }
];

const ServiceList = () => {
    const navigate = useNavigate();
    const role = useAuthStore(state => state.role);

    const handleBook = (serviceId) => {
        if (!role) {
            navigate('/login');
            return;
        }
        navigate(`/services/book/${serviceId}`);
    };

    return (
        <div className="section">
            <h2>Usługi</h2>
            <p className="text">
                Oferujemy szeroki zakres usług dodatkowych zapewniających komfortowy pobyt.
            </p>

            <div className="servicesList">
                {SERVICES_DATA.map((service) => (
                    <div key={service.id} className="serviceItem">
                        <div>
                            <strong>{service.name}</strong>
                            <p style={{ margin: 0 }}>{service.price} PLN</p>
                        </div>

                        <div className="buttonWrapper">
                            <button className="button" onClick={() => handleBook(service.id)}>
                                Rezerwuj
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ServiceList;