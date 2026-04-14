import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Calendar, Clock, User, Mail, ExternalLink, XCircle, Trash2, RefreshCcw } from 'lucide-react';
import { format, isAfter } from 'date-fns';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming' or 'past'

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/bookings`);
      setBookings(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load bookings");
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
      const date = new Date(b.date);
      const now = new Date();
      // Simple upcoming logic
      const isPast = date < now && format(date, 'yyyy-MM-dd') !== format(now, 'yyyy-MM-dd');
      return filter === 'upcoming' ? !isPast : isPast;
  });

  const handleCancel = (id) => {
    const CancelToast = ({ closeToast }) => (
        <div className="p-1">
          <p className="font-bold text-sm mb-2 text-gray-800">Are you sure you want to cancel this booking?</p>
          <div className="flex gap-2">
            <button 
              className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-600 transition-colors"
              onClick={async () => {
                try {
                  await axios.delete(`${API_BASE}/bookings/${id}`);
                  fetchBookings();
                  setSelectedBooking(null);
                  toast.success("Booking cancelled successfully");
                  closeToast();
                } catch (err) {
                  toast.error("Error cancelling booking.");
                }
              }}
            >
              Confirm Cancel
            </button>
            <button 
              className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-xs font-bold hover:bg-gray-200 transition-colors"
              onClick={closeToast}
            >
              Keep Booking
            </button>
          </div>
        </div>
      );
  
      toast.info(<CancelToast />, {
        position: "bottom-right",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Bookings</h1>
          <p className="text-gray-500 mt-1">See upcoming and past events booked through your link.</p>
        </div>
      </div>

      <div className="flex gap-6 border-b border-gray-100">
        <button 
          onClick={() => setFilter('upcoming')}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-all ${
            filter === 'upcoming' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          Upcoming
        </button>
        <button 
          onClick={() => setFilter('past')}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-all ${
            filter === 'past' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          Past
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl py-24 text-center shadow-sm">
          <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No {filter} bookings yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm group">
              <div className="flex items-center gap-5">
                <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg w-14 h-14 border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{format(new Date(booking.date), 'MMM')}</span>
                    <span className="text-xl font-bold text-gray-800">{format(new Date(booking.date), 'dd')}</span>
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 leading-tight">{booking.eventType.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-500 font-medium">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {booking.startTime} - {booking.endTime}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full hidden md:block"></span>
                        <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {booking.name}</span>
                    </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedBooking(booking)}
                    className="flex-1 md:flex-none px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    Details
                  </button>
                  {filter === 'upcoming' && (
                    <button 
                        onClick={() => handleCancel(booking.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Cancel Booking"
                    >
                        <XCircle className="w-5 h-5" />
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                    <div className="bg-gray-100 p-3 rounded-2xl">
                        <Calendar className="w-8 h-8 text-black" />
                    </div>
                    <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">{selectedBooking.eventType.title}</h2>
                        <p className="text-gray-500 font-medium">{format(new Date(selectedBooking.date), 'EEEE, MMMM do yyyy')}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Time</p>
                            <p className="font-bold text-gray-800">{selectedBooking.startTime} - {selectedBooking.endTime}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Duration</p>
                            <p className="font-bold text-gray-800">{selectedBooking.eventType.duration} Minutes</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-gray-700 bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                            <User className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Attendee</p>
                                <p className="font-bold">{selectedBooking.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700 bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Email</p>
                                <p className="font-bold">{selectedBooking.email}</p>
                            </div>
                        </div>
                    </div>

                    {filter === 'upcoming' && (
                        <div className="flex gap-4">
                          <button 
                            onClick={() => handleCancel(selectedBooking.id)}
                            className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" /> Cancel Meeting
                          </button>
                          <a 
                            href={`/reschedule/${selectedBooking.id}`}
                            className="flex-1 bg-gray-50 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                          >
                            <RefreshCcw className="w-4 h-4" /> Reschedule
                          </a>
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
