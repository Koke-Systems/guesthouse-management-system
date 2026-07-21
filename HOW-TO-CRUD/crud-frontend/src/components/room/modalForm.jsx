import { useState, useEffect } from 'react';

export default function ModalForm({ isOpen, onClose, OnSubmit, mode, clientData, properties }) {
  const [formData, setFormData] = useState({
    propertyId: '',
    roomNumber: '',
    roomName: '',
    isAvailable: true,
    pricePerNight: '',
    capacity: 2,
    amenities: []
  });

  const [amenityInput, setAmenityInput] = useState('');

  useEffect(() => {
    if (mode === 'edit' && clientData) {
      setFormData({
        propertyId: clientData.propertyId || '',
        roomNumber: clientData.roomNumber || '',
        roomName: clientData.roomName || '',
        isAvailable: clientData.isAvailable !== undefined ? clientData.isAvailable : true,
        pricePerNight: clientData.pricePerNight || '',
        capacity: clientData.capacity || 2,
        amenities: clientData.amenities || []
      });
    } else {
      setFormData({
        propertyId: properties[0]?._id || '',
        roomNumber: '',
        roomName: '',
        isAvailable: true,
        pricePerNight: '',
        capacity: 2,
        amenities: []
      });
    }
  }, [mode, clientData, properties]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const addAmenity = () => {
    if (amenityInput.trim() && !formData.amenities.includes(amenityInput.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()]
      }));
      setAmenityInput('');
    }
  };

  const removeAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    OnSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-base-100 text-base-content w-full max-w-md rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">{mode === 'edit' ? 'Edit Room' : 'Add New Room'}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Property Selection */}
          <div>
            <label className="block text-sm font-semibold mb-1">Property</label>
            <select
              name="propertyId"
              value={formData.propertyId}
              onChange={handleChange}
              className="select select-bordered w-full"
              required
            >
              <option value="">Select Property</option>
              {properties.map(prop => (
                <option key={prop._id} value={prop._id}>{prop.name}</option>
              ))}
            </select>
          </div>

          {/* Room Number */}
          <div>
            <label className="block text-sm font-semibold mb-1">Room Number</label>
            <input
              type="number"
              name="roomNumber"
              value={formData.roomNumber}
              onChange={handleChange}
              required
              className="input input-bordered w-full"
            />
          </div>

          {/* Room Name */}
          <div>
            <label className="block text-sm font-semibold mb-1">Room Name</label>
            <input
              type="text"
              name="roomName"
              value={formData.roomName}
              onChange={handleChange}
              placeholder="e.g., Nkwe (Leopard)"
              required
              className="input input-bordered w-full"
            />
          </div>

          {/* Price and Capacity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1">Price/Night (Rp)</label>
              <input
                type="number"
                name="pricePerNight"
                value={formData.pricePerNight}
                onChange={handleChange}
                required
                className="input input-bordered w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Capacity</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                min="1"
                max="10"
                required
                className="input input-bordered w-full"
              />
            </div>
          </div>

          {/* Availability Checkbox */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="isAvailable"
              checked={formData.isAvailable}
              onChange={handleChange}
              className="checkbox checkbox-success"
              id="available-checkbox"
            />
            <label htmlFor="available-checkbox" className="text-sm font-semibold">
              Room is Available
            </label>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-semibold mb-1">Amenities</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                placeholder="e.g., AC, WiFi, TV"
                className="input input-bordered flex-1"
              />
              <button type="button" onClick={addAmenity} className="btn btn-primary btn-sm">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.amenities.map((amenity, idx) => (
                <span key={idx} className="badge badge-info gap-1">
                  {amenity}
                  <button type="button" onClick={() => removeAmenity(amenity)} className="ml-1">✕</button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
            >
              {mode === 'edit' ? 'Update Room' : 'Add Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}