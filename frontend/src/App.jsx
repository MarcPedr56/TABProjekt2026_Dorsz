import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/rooms')
      .then(response => {
        if (!response.ok) {
          throw new Error('Błąd pobierania danych z serwera');
        }
        return response.json();
      })
      .then(data => {
        setRooms(data); 
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🏨 Hotel Rooms Status</h1>
      
      {loading && <p>Ładowanie pokoi z Azure...</p>}
      {error && <p style={{ color: 'red' }}>Błąd: {error}</p>}

      {!loading && !error && (
        <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f2f2f2', color: '#333' }}>
            <tr>
              <th>Number</th>
              <th>Type</th>
              <th>Price/Night</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {/* Mapowanie listy pokoi na wiersze tabeli */}
            {rooms.map((room) => (
              <tr key={room.room_id}>
                <td><strong>{room.room_number}</strong></td>
                <td>{room.room_type}</td>
                <td>{room.price_per_night} PLN</td>
                <td style={{ 
                  color: room.status === 'available' ? 'green' : 
                         room.status === 'occupied' ? 'red' : 'orange',
                  fontWeight: 'bold'
                }}>
                  {room.status.toUpperCase()}
                </td>
              </tr>
            ))}
            
            {/* Komunikat, gdy tabela w Azure jest pusta */}
            {rooms.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center' }}>Brak pokoi w bazie danych.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default App