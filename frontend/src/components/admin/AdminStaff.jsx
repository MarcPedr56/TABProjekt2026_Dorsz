import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const API = "http://127.0.0.1:8000";

const AdminStaff = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);

    useEffect(() => {
        fetch(`${API}/employees`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res) => {
                if (!res.ok) throw new Error("Błąd pobierania pracowników");
                return res.json();
            })
            .then((data) => {
                setEmployees(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setEmployees([]);
                setLoading(false);
            });
    }, [token]);

    if (loading) return <div className="section"><p>Ładowanie listy pracowników...</p></div>;

    return (
        <div className="section">
            <h2>Pracownicy hotelu</h2>

            <table className="table">
                <thead>
                    <tr style={{ textAlign: "left" }}>
                        <th>Imię</th>
                        <th>Nazwisko</th>
                        <th>Email</th>
                        <th>Telefon</th>
                        <th>Stanowisko</th>
                        <th>Numer Dokumentu</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.length > 0 ? (
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
                            <td colSpan="6" style={{ textAlign: "center" }}>Brak pracowników do wyświetlenia.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <button className="link" onClick={() => navigate("/admin")}>
                ← Powrót do panelu admina
            </button>
        </div>
    );
};

export default AdminStaff;