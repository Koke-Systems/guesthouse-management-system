import { useState, useEffect } from 'react';
import axios from 'axios';
import NavBar from '../components/room/roomnavbar';
import ModalForm from '../components/room/modalForm';
import RoomCard from '../components/room/roomCard';

const API_URL = import.meta.env.VITE_API_URL;

// Helper to group rooms by propertyId
function groupRoomsByProperty(rooms) {
  const grouped = {};
  rooms.forEach(room => {
    if (!grouped[room.propertyId]) {
      grouped[room.propertyId] = { 
        propertyId: room.propertyId, 
        propertyName: room.propertyName,
        location: room.location,
        rooms: [] 
      };
    }
    grouped[room.propertyId].rooms.push(room);
  });
  return Object.values(grouped);
}

export default function Rooms() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [searchTerm, setSearchTerm] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [allRooms, setAllRooms] = useState([]);
  const [properties, setProperties] = useState([]);

  const fetchRooms = async () => {
    try {
      // Fetch all properties first
      const propertiesRes = await axios.get(`${API_URL}/api/properties`);
      setProperties(propertiesRes.data);
      
      // Extract all rooms from properties
      const roomsData = [];
      propertiesRes.data.forEach(property => {
        const rooms = property.rooms || [];
        rooms.forEach(room => {
          roomsData.push({
            ...room,
            _id: `${property._id}_room_${room.roomNumber}`,
            propertyId: property._id,
            propertyName: property.name,
            location: property.location
          });
        });
      });
      
      setAllRooms(roomsData);
    } catch (err) {
      console.error('Error fetching rooms:', err.message);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleOpen = (mode, room = null) => {
    setRoomData(room);
    setModalMode(mode);
    setIsOpen(true);
  };

  const handleSubmit = async (newRoomData) => {
    try {
      if (modalMode === 'add') {
        const response = await axios.post(`${API_URL}/api/rooms`, newRoomData);
        await fetchRooms(); // Refresh the list
      } else {
        const response = await axios.put(`${API_URL}/api/rooms/${roomData._id}`, newRoomData);
        await fetchRooms(); // Refresh the list
      }
    } catch (error) {
      console.error('Error submitting room:', error);
    }
    setIsOpen(false);
  };

  const handleDelete = async (roomId) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await axios.delete(`${API_URL}/api/rooms/${roomId}`);
        await fetchRooms(); // Refresh the list
      } catch (error) {
        console.error('Error deleting room:', error);
      }
    }
  };

  // Filter rooms by room name or property name
  const filteredRooms = allRooms.filter(room =>
    (room.roomName && room.roomName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (room.roomNumber && room.roomNumber.toString().includes(searchTerm)) ||
    (room.propertyName && room.propertyName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const groupedRooms = groupRoomsByProperty(filteredRooms);

  return (
    <>
      <NavBar onOpen={() => handleOpen('add')} onSearch={setSearchTerm} />

      <div className="p-5 space-y-10">
        {groupedRooms.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            No rooms found. Click "Add Room" to create one.
          </div>
        )}
        
        {groupedRooms.map(({ propertyId, propertyName, location, rooms }) => (
          <div key={propertyId}>
            <h2 className="text-3xl font-semibold mb-1">{propertyName}</h2>
            <p className="text-gray-400 mb-4">{location}</p>

            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {rooms.map(room => (
                <RoomCard 
                  key={room._id} 
                  room={room}
                  onEdit={() => handleOpen('edit', room)}
                  onDelete={() => handleDelete(room._id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <ModalForm
        isOpen={isOpen}
        OnSubmit={handleSubmit}
        onClose={() => setIsOpen(false)}
        mode={modalMode}
        clientData={roomData}
        properties={properties}
      />
    </>
  );
}