import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const API = "http://127.0.0.1:8000";

const ServiceList = () => {
    const navigate = useNavigate();
    const role = useAuthStore(state => state.role);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API}/services`)
            .then(res => res.json())
            .then(data => {
                setServices(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleBook = (serviceId) => {
        if (!role) {
            navigate('/login');
            return;
        }
        navigate(`/services/book/${serviceId}`);
    };

    if (loading) return <p>Ładowanie cennika usług...</p>;

    return (
        <div className="section">
            <h2>Usługi Hotelowe</h2>
            <div className="servicesList">
                {services.map((service) => (
                    <div key={service.service_id} className="serviceItem">
                        <div>
                            <strong>{service.name}</strong>
                            <p style={{ margin: 0 }}>{service.price} PLN</p>
                        </div>
                        <div className="buttonWrapper">
                            <button className="button" onClick={() => handleBook(service.service_id)}>
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