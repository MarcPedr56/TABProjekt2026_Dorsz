import { useEffect, useState } from 'react'

function App() {
  const [rooms, setRooms] = useState([])

  useEffect(() => {
    fetch('http://127.0.0.1:8000/rooms')
      .then(res => res.json())
      .then(data => setRooms(data))
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <h1>Hotel Rooms Status</h1>
      <table border="1">
        <thead>
          <tr>
            <th>Number</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map(room => (
            <tr key={room.room_id}>
              <td>{room.room_number}</td>
              <td>{room.room_type}</td>
              <td>{room.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App