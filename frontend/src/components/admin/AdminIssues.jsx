import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = "http://127.0.0.1:8000";

const AdminIssues = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [newTask, setNewTask] = useState({
        room_number: "",
        description: "",
        start_date: null,
        end_date: null,
        status: null,
        priority_level: null
    });

    const fetchTasks = () => {
        setLoading(true);
        fetch(`${API}/tasks`)
            .then(res => res.json())
            .then(data => {
                setTasks(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Błąd pobierania zadań:", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleAddTask = async () => {
        try {
            const res = await fetch(`${API}/tasks`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    room_number: Number(newTask.room_number),
                    description: newTask.description,
                    start_date: newTask.start_date,
                    end_date: newTask.end_date,
                    status: newTask.status,
                    priority_level: newTask.priority_level
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.detail || "Błąd dodawania zadania.");
                return;
            }

            alert("Usterka zgłoszena pomyślnie.");
            setNewTask({ room_number: "", description: "", start_date: null, end_date: null, status: null, priority_level: null });
            fetchTasks();

        } catch (err) {
            console.error(err);
            alert("Wystąpił błąd połączenia.");
        }
    };

    const handleUpdateTaskStatus = async (taskId, newStatus) => {
        try {
            await fetch(`${API}/tasks/${taskId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            fetchTasks();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading && tasks.length === 0) return <div className="section"><p>Ładowanie zadań...</p></div>;

    return (
        <div className="section">
            <h2>Zadania hotelowe (Usterki)</h2>

            <div style={{ marginBottom: "30px", padding: "20px", background: "#fff", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                <h3>Zgłoś usterkę</h3>
                <input
                    placeholder="Numer pokoju (ID)"
                    className="input"
                    value={newTask.room_number}
                    onChange={(e) => setNewTask({ ...newTask, room_number: e.target.value })}
                />
                <input
                    placeholder="Opis usterki"
                    className="input"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
                <button className="button" style={{ marginTop: "10px" }} onClick={handleAddTask}>
                    Zgłoś usterkę
                </button>
            </div>

            <table className="table">
                <thead>
                    <tr style={{ textAlign: "left" }}>
                        <th>ID</th>
                        <th>Pokój (ID)</th>
                        <th>Opis</th>
                        <th>Status</th>
                        <th>Pracownik</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.length > 0 ? (
                        tasks.map((t) => (
                            <tr key={t.task_id}>
                                <td>{t.task_id}</td>
                                <td>{t.room_id}</td>
                                <td>{t.description}</td>
                                <td>
                                    <select
                                        value={t.status || "todo"}
                                        onChange={(e) => handleUpdateTaskStatus(t.task_id, e.target.value)}
                                        style={{ padding: "5px" }}
                                    >
                                        <option value="todo">Do zrobienia</option>
                                        <option value="in_progress">W trakcie</option>
                                        <option value="done">Zakończone</option>
                                    </select>
                                </td>
                                <td>-</td> 
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" style={{ textAlign: "center" }}>Brak aktywnych zadań.</td>
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

export default AdminIssues;