import { Home, CheckCircle, XCircle, Edit, Trash2, Users, DollarSign, Wifi } from 'lucide-react';

export default function RoomCard({ room, onEdit, onDelete }) {
  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div className="bg-transparent border border-gray-600 rounded-xl shadow-sm p-5 text-center hover:shadow-md transition-transform hover:scale-105 duration-300">
      <h3 className="text-2xl font-bold text-blue-400 mb-1">{room.roomName}</h3>
      <p className="text-gray-500 text-sm mb-3">#{room.roomNumber}</p>

      <div className="flex justify-center items-center gap-1 text-gray-300 text-sm mb-3">
        <Home size={16} />
        <span>{room.propertyName || 'Unknown Property'}</span>
      </div>

      <div className="text-gray-300 mb-3 space-y-1">
        <p className="flex justify-center items-center gap-1">
          <DollarSign size={14} />
          <span className="font-semibold">Rp {room.pricePerNight?.toLocaleString()}</span>
          <span className="text-xs text-gray-500">/night</span>
        </p>
        <p className="flex justify-center items-center gap-1">
          <Users size={14} />
          <span>Up to {room.capacity} {room.capacity === 1 ? 'person' : 'people'}</span>
        </p>
      </div>

      {/* Amenities badges */}
      <div className="flex flex-wrap justify-center gap-2 mb-3">
        {room.amenities?.slice(0, 3).map((amenity, idx) => (
          <span
            key={idx}
            className="bg-blue-600 bg-opacity-30 text-blue-300 text-xs px-3 py-1 rounded-full"
          >
            {amenity}
          </span>
        ))}
        {room.amenities?.length > 3 && (
          <span className="bg-gray-600 bg-opacity-30 text-gray-300 text-xs px-3 py-1 rounded-full">
            +{room.amenities.length - 3}
          </span>
        )}
      </div>

      <div className="mt-3 mb-3">
        {room.isAvailable ? (
          <span className="inline-flex items-center gap-1 bg-green-700 bg-opacity-20 text-green-300 text-sm px-3 py-1 rounded-full">
            <CheckCircle size={14} /> Available
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 bg-red-700 bg-opacity-20 text-red-300 text-sm px-3 py-1 rounded-full">
            <XCircle size={14} /> Occupied
          </span>
        )}
      </div>
      
      <div className="flex justify-center gap-2">
        <button
          onClick={handleEdit}
          className="btn btn-xs btn-primary"
        >
          <Edit size={14} /> Edit
        </button>
        <button
          onClick={handleDelete}
          className="btn btn-xs btn-error"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
}