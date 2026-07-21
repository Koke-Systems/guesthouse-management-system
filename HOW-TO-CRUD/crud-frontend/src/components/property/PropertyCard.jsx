import React from 'react';

export default function PropertyCard({ property, onEdit, onDelete }) {
  const roomTypes = Array.isArray(property.roomTypes) ? property.roomTypes : [];

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit();
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow duration-300">
      <div className="card-body">
        <div className="flex justify-between items-start">
          <h2 className="card-title text-primary text-2xl">{property.name}</h2>
          <div className="flex gap-2">
            <button 
              className="btn btn-sm btn-primary" 
              onClick={handleEditClick}
            >
              ✏️ Edit
            </button>
            <button 
              className="btn btn-sm btn-error" 
              onClick={handleDeleteClick}
            >
              🗑️ Delete
            </button>
          </div>
        </div>
        <p className="text-base-content text-lg">{property.location}</p>

        <div className="grid grid-cols-1 gap-2 text-base text-base-content mt-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-lg">Total Rooms:</span>
            <span className="text-xl font-bold">{property.totalRooms}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-lg">Available:</span>
            <span className="text-success text-xl font-bold">{property.availableRooms}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-lg">Occupied:</span>
            <span className="text-error text-xl font-bold">{property.occupiedRooms}</span>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="font-semibold text-lg mb-2">Room Types:</h4>
          {roomTypes.length === 0 ? (
            <p className="text-base text-gray-500">No room data</p>
          ) : (
            <ul className="text-base mt-1 space-y-2">
              {roomTypes.map((rt) => (
                <li key={rt.type} className="flex justify-between items-center">
                  <span className="capitalize font-medium text-base">{rt.type}</span>
                  <span className="text-base">
                    <span className="text-success font-semibold">{rt.availability?.available || 0} available</span>{' '}
                    | <span className="text-error font-semibold">{rt.availability?.occupied || 0} occupied</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}