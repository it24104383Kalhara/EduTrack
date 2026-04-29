import { useEffect, useState } from "react";
import "../css/RoomsSection.css";

interface Room {
  room_id: number;
  name: string;
  type: string;
  capacity: number;
  description: string;
}

export default function RoomsSection() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000/rooms")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch rooms");
        return res.json();
      })
      .then((data) => {
        setRooms(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load rooms");
        setLoading(false);
      });
  }, []);

  return (
    <div className="rooms-section">
      <h2>🏫 Rooms</h2>

      {loading ? (
        <p>Loading rooms...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : rooms.length === 0 ? (
        <p>No rooms available.</p>
      ) : (
        <table className="rooms-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Capacity</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.room_id}>
                <td>{room.room_id}</td>
                <td>{room.name}</td>
                <td>{room.type}</td>
                <td>{room.capacity}</td>
                <td>{room.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}