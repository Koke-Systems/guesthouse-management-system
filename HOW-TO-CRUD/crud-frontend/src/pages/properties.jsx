import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/property/Navbar';
import PropertyCard from '../components/property/PropertyCard';

const API_URL = import.meta.env.VITE_API_URL;

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState('add');
  const [currentProperty, setCurrentProperty] = useState(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  const fetchProperties = async () => {
    try {
      // Only fetch properties - no summary endpoint needed
      const propertiesRes = await axios.get(`${API_URL}/api/properties`);
      
      // Calculate stats from the rooms array in each property
      const propertiesWithStats = propertiesRes.data.map((prop) => {
        const rooms = prop.rooms || [];
        const totalRooms = rooms.length;
        const availableRooms = rooms.filter(room => room.isAvailable === true).length;
        const occupiedRooms = rooms.filter(room => room.isAvailable === false).length;
        
        // Group rooms by type/category for roomTypes display
        const roomTypeMap = new Map();
        
        rooms.forEach(room => {
          // Extract room type from roomName (e.g., "Nkwe (Leopard)" -> "Nkwe")
          const roomType = room.roomName.split(' ')[0];
          
          if (!roomTypeMap.has(roomType)) {
            roomTypeMap.set(roomType, {
              type: roomType,
              availability: {
                available: 0,
                occupied: 0
              }
            });
          }
          
          const typeData = roomTypeMap.get(roomType);
          if (room.isAvailable) {
            typeData.availability.available++;
          } else {
            typeData.availability.occupied++;
          }
        });
        
        const roomTypes = Array.from(roomTypeMap.values());
        
        return {
          ...prop,
          totalRooms: totalRooms,
          availableRooms: availableRooms,
          occupiedRooms: occupiedRooms,
          roomTypes: roomTypes
        };
      });
      
      console.log('Loaded properties with stats:', propertiesWithStats);
      setProperties(propertiesWithStats);
    } catch (err) {
      console.error('Failed to load properties:', err);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const openModal = (mode = 'add', property = null) => {
    setMode(mode);
    setCurrentProperty(property);
    setName(property?.name || '');
    setLocation(property?.location || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setName('');
    setLocation('');
    setCurrentProperty(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const propertyData = { 
      name, 
      location,
      rooms: [],
      totalRooms: 0
    };

    try {
      if (mode === 'edit' && currentProperty) {
        const res = await axios.put(
          `${API_URL}/api/properties/${currentProperty._id}`,
          { name, location }
        );
        setProperties((prev) =>
          prev.map((p) => (p._id === currentProperty._id ? { ...p, name, location } : p))
        );
      } else {
        // Generate _id from name
        propertyData._id = name.toLowerCase().replace(/\s/g, '_') + '_' + Date.now();
        const res = await axios.post(`${API_URL}/api/properties`, propertyData);
        const newProperty = {
          ...res.data,
          totalRooms: 0,
          availableRooms: 0,
          occupiedRooms: 0,
          roomTypes: []
        };
        setProperties((prev) => [...prev, newProperty]);
      }
      closeModal();
      fetchProperties(); // Refresh the list
    } catch (err) {
      console.error('Failed to save property:', err);
    }
  };

  const handleDelete = async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await axios.delete(`${API_URL}/api/properties/${propertyId}`);
        fetchProperties(); // Refresh the list
      } catch (err) {
        console.error('Failed to delete property:', err);
      }
    }
  };

  const filteredProps = properties.filter((p) =>
    `${p.name} ${p.location}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Navbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onAddClick={() => openModal('add')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        {filteredProps.map((property) => (
          <PropertyCard
            key={property._id}
            property={property}
            onEdit={() => openModal('edit', property)}
            onDelete={() => handleDelete(property._id)}
          />
        ))}
      </div>

      {isModalOpen && (
        <dialog open className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg py-4">
              {mode === 'edit' ? 'Edit Property' : 'Add New Property'}
            </h3>
            <form onSubmit={handleSubmit}>
              <label className="input input-bordered my-2 flex items-center gap-2">
                Property Name
                <input
                  type="text"
                  className="grow"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              <label className="input input-bordered my-2 flex items-center gap-2">
                Location
                <input
                  type="text"
                  className="grow"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </label>

              <div className="modal-action justify-between">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>
                  ✕ Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  {mode === 'edit' ? 'Save Changes' : 'Add Property'}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </>
  );
}