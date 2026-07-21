import { useState, useEffect } from 'react';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const API_URL = import.meta.env.VITE_API_URL;

export default function Bookings() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [debug, setDebug] = useState('');

  // Fetch all properties
  const fetchProperties = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/properties`);
      setProperties(res.data);
      console.log('Properties loaded:', res.data.length);
      setDebug(`Loaded ${res.data.length} properties`);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setDebug('Error loading properties: ' + err.message);
    }
  };

  // Fetch all bookings for calendar
  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/bookings`);
      setBookings(res.data);
      console.log('Bookings loaded:', res.data.length);
      
      // Convert to calendar events
      const calendarEvents = res.data.map(booking => ({
        id: booking._id,
        title: `${booking.roomName} - ${booking.clientName}`,
        start: booking.checkInDate,
        end: booking.checkOutDate,
        backgroundColor: booking.status === 'Confirmed' ? '#10B981' : '#F59E0B',
        borderColor: booking.status === 'Confirmed' ? '#10B981' : '#F59E0B'
      }));
      setEvents(calendarEvents);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  // Fetch availability for selected date
  const fetchAvailability = async (date) => {
    setLoading(true);
    try {
      console.log('Fetching availability for date:', date);
      const res = await axios.get(`${API_URL}/api/bookings/availability/${date}`);
      console.log('Availability response:', res.data);
      setAvailability(res.data);
      setDebug(`Found ${res.data.length} properties with rooms`);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setDebug('Error loading availability: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
    fetchBookings();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailability(selectedDate);
    }
  }, [selectedDate]);

  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr);
  };

  const handlePropertyClick = (property) => {
    setSelectedProperty(selectedProperty === property ? null : property);
  };

  // Get current date for display
  const displayDate = new Date(selectedDate);
  const formattedDate = displayDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Room Availability Calendar</h1>
        
        {/* Debug info */}
        {debug && (
          <div className="alert alert-info mb-4 text-sm">
            <span>ℹ️ {debug}</span>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left side - Calendar */}
          <div className="lg:col-span-2 bg-base-100 rounded-xl shadow-lg p-4">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={events}
              dateClick={handleDateClick}
              height="auto"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth'
              }}
            />
            <div className="mt-4 text-sm text-gray-500 text-center">
              💡 Click on any date to see room availability
            </div>
          </div>

          {/* Right side - Availability for selected date */}
          <div className="bg-base-100 rounded-xl shadow-lg p-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-primary">
                Availability for {formattedDate}
              </h2>
              <p className="text-sm text-gray-500">Click on a property to see room details</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : availability.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-2">📭 No properties found</div>
                <p className="text-sm text-gray-400">
                  Make sure you have properties in your database<br />
                  and they have rooms configured.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {availability.map((property) => (
                  <div key={property.propertyId} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                    <div 
                      className="cursor-pointer flex justify-between items-center"
                      onClick={() => handlePropertyClick(property)}
                    >
                      <div>
                        <h3 className="font-semibold text-lg">{property.propertyName}</h3>
                        <p className="text-sm text-gray-500">{property.location}</p>
                      </div>
                      <div className="text-right">
                        <div className="badge badge-success">Available: {property.availableRooms}</div>
                        <div className="badge badge-error ml-2">Booked: {property.bookedRooms}</div>
                      </div>
                    </div>
                    
                    {selectedProperty === property && (
                      <div className="mt-3 overflow-x-auto">
                        <table className="table table-xs w-full">
                          <thead>
                            <tr>
                              <th>Room</th>
                              <th>Type</th>
                              <th>Status</th>
                              <th>Price/Night</th>
                              <th>Client</th>
                            </tr>
                          </thead>
                          <tbody>
                            {property.rooms.map((room) => (
                              <tr key={room.roomNumber} className={room.isBooked ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}>
                                <td>
                                  <div className="font-medium">{room.roomName}</div>
                                  <div className="text-xs text-gray-500">#{room.roomNumber}</div>
                                </td>
                                <td className="text-xs">{room.capacity} ppl</td>
                                <td>
                                  {room.isAvailable ? (
                                    <span className="badge badge-success badge-sm">🟢 Available</span>
                                  ) : (
                                    <span className="badge badge-error badge-sm">🔴 Booked</span>
                                  )}
                                </td>
                                <td className="text-xs">Rp {room.pricePerNight?.toLocaleString()}</td>
                                <td className="text-xs">
                                  {room.clientName ? (
                                    <span className="font-medium">{room.clientName}</span>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bookings List */}
        <div className="mt-8 bg-base-100 rounded-xl shadow-lg p-4">
          <h2 className="text-xl font-bold mb-4">Current Bookings</h2>
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No bookings found. Add some booking data to see them here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Room</th>
                    <th>Property</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Status</th>
                    <th>Total Amount</th>
                    <th>Paid</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking._id}>
                      <td className="font-medium">{booking.clientName}</td>
                      <td>{booking.roomName}<br/><span className="text-xs text-gray-500">#{booking.roomNumber}</span></td>
                      <td>{booking.propertyName}</td>
                      <td>{new Date(booking.checkInDate).toLocaleDateString()}</td>
                      <td>{new Date(booking.checkOutDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${
                          booking.status === 'Confirmed' ? 'badge-success' :
                          booking.status === 'Checked-in' ? 'badge-warning' :
                          'badge-neutral'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td>Rp {booking.totalAmount?.toLocaleString()}</td>
                      <td>Rp {booking.paidAmount?.toLocaleString()}</td>
                      <td>Rp {booking.dueAmount?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}