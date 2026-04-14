import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMinutes, isBefore, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Globe, CheckCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const BookingPage = () => {
  const { username, slug } = useParams();
  const [eventType, setEventType] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingStep, setBookingStep] = useState('calendar'); // 'calendar', 'details', 'success'
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});
  const abortControllerRef = useRef(null);

  useEffect(() => {
    fetchEventType();
  }, [slug]);

  const fetchEventType = async () => {
    try {
      const res = await axios.get(`${API_BASE}/event-types/${slug}`);
      setEventType(res.data);
    } catch (err) {
      console.error("Event not found");
    }
  };

  useEffect(() => {
    if (eventType) {
      fetchSlots();
    }
  }, [selectedDate, eventType]);

  const fetchSlots = async () => {
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoadingSlots(true);
    setSlots([]); // Clear old slots to prevent flicker
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const res = await axios.get(`${API_BASE}/slots?eventTypeId=${eventType.id}&date=${dateStr}`, {
        signal: controller.signal
      });
      setSlots(res.data);
    } catch (err) {
      if (err.name === 'CanceledError' || axios.isCancel(err)) {
        return; // Ignore cancelled requests
      }
      console.error(err);
      toast.error("Failed to load slots");
    } finally {
      if (!controller.signal.aborted) {
        setLoadingSlots(false);
      }
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/book`, {
        eventTypeId: eventType.id,
        name: formData.name,
        email: formData.email,
        date: selectedDate,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        answers: answers
      });
      setBookingStep('success');
      toast.success("Booking confirmed!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Error booking slot");
    } finally {
      setSubmitting(false);
    }
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-black text-lg text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h3>
          <div className="flex gap-2">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isPast = isBefore(day, startOfDay(new Date()));
            return (
              <button
                key={i}
                disabled={isPast && !isSelected}
                onClick={() => setSelectedDate(day)}
                className={`h-11 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
                  !isCurrentMonth ? 'text-gray-200' : 
                  isSelected ? 'bg-black text-white shadow-lg shadow-black/20' : 
                  isPast ? 'text-gray-200 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (!eventType) return <div className="min-h-screen flex items-center justify-center font-black text-gray-200 animate-pulse uppercase tracking-[0.2em]">Loading Cal.com Clone...</div>;

  if (bookingStep === 'success') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 selection:bg-black selection:text-white">
        <div className="max-w-md w-full text-center p-12 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-black mb-2 text-gray-900">This meeting is scheduled</h1>
          <p className="text-gray-500 mb-10 font-medium">We sent an email with a calendar invitation to your inbox.</p>
          
          <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6 text-left mb-10 space-y-4">
            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">What</p>
                <p className="font-bold text-gray-900">{eventType.title}</p>
            </div>
            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">When</p>
                <p className="font-bold text-gray-900">{format(selectedDate, 'EEEE, MMMM do, yyyy')}</p>
                <p className="font-bold text-gray-900 text-sm opacity-60">{selectedSlot.start} - {selectedSlot.end}</p>
            </div>
          </div>
          
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-4 bg-gray-50 text-black rounded-2xl font-black hover:bg-gray-100 transition-all"
          >
            Schedule another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4 selection:bg-black selection:text-white">
      <div className="max-w-5xl w-full flex flex-col md:flex-row bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-gray-200/50 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Left Sidebar: Event Meta */}
        <div className="md:w-[35%] p-10 border-r border-gray-50 bg-[#fafafa]">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-black text-xs">C</div>
            <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">{username}</span>
          </div>
          
          <h1 className="text-3xl font-black text-gray-900 leading-tight mb-8">{eventType.title}</h1>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-gray-500 font-bold text-sm">
                <Clock className="w-5 h-5 text-gray-300" /> {eventType.duration} Minutes
            </div>
            <div className="flex items-center gap-3 text-gray-500 font-bold text-sm">
                <Globe className="w-5 h-5 text-gray-300" /> Asia/Kolkata
            </div>
            {selectedSlot && (
                <div className="flex items-start gap-3 text-gray-900 font-black text-sm pt-4 animate-in slide-in-from-left-4 duration-300">
                    <CalendarIcon className="w-5 h-5 text-black" /> 
                    <div>
                        <p>{format(selectedDate, 'EEEE, MMM d, yyyy')}</p>
                        <p className="opacity-40">{selectedSlot.start} - {selectedSlot.end}</p>
                    </div>
                </div>
            )}
          </div>

          <div className="mt-20 pt-10 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter italic">"A Cal.com Clone for SDE Intern Assignment"</p>
          </div>
        </div>

        {/* Right Content: Calendar & Details */}
        <div className="flex-1 p-10 lg:p-14 overflow-hidden">
          {bookingStep === 'calendar' ? (
            <div className="flex flex-col lg:flex-row gap-12 h-full">
              <div className="flex-1">
                <h2 className="text-xl font-black mb-10 text-gray-900">Select a Date & Time</h2>
                {renderCalendar()}
              </div>
              
              <div className="w-full lg:w-48 flex flex-col pt-12 lg:pt-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6">{format(selectedDate, 'EEEE, MMM d')}</p>
                {loadingSlots ? (
                    <div className="flex flex-col gap-3">
                        {[1,2,3,4].map(i => <div key={i} className="h-10 bg-gray-50 rounded-xl animate-pulse"></div>)}
                    </div>
                ) : slots.length === 0 ? (
                    <div className="py-20 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">No slots</p>
                    </div>
                ) : (
                    <div className="space-y-2 overflow-y-auto pr-2 max-h-[400px] custom-scrollbar">
                        {slots.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setSelectedSlot(s);
                                    setBookingStep('details');
                                }}
                                className="w-full py-4 border border-gray-100 rounded-xl text-sm font-black text-gray-700 hover:border-black hover:bg-black hover:text-white hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                {s.start}
                            </button>
                        ))}
                    </div>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-md animate-in slide-in-from-right-8 duration-500">
              <button 
                onClick={() => setBookingStep('calendar')} 
                className="mb-8 p-3 hover:bg-gray-100 rounded-2xl transition-all group"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              
              <h2 className="text-3xl font-black mb-10">Confirm Details</h2>
              
              <form onSubmit={handleBook} className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Your Name</label>
                        <input 
                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-black/5 focus:bg-white focus:border-black transition-all outline-none" 
                            placeholder="e.g. Stephen Curry" 
                            required 
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                        <input 
                            type="email" 
                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-black/5 focus:bg-white focus:border-black transition-all outline-none" 
                            placeholder="stephen@warriors.com" 
                            required 
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                    </div>

                    {/* DYNAMIC CUSTOM QUESTIONS */}
                    {eventType.questions?.map((q, idx) => (
                        <div key={idx}>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{q.label} {q.required && '*'}</label>
                            <input 
                                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-black/5 focus:bg-white focus:border-black transition-all outline-none" 
                                placeholder="Your answer..."
                                required={q.required}
                                value={answers[q.label] || ''}
                                onChange={e => setAnswers({...answers, [q.label]: e.target.value})}
                            />
                        </div>
                    ))}
                </div>

                <div className="pt-8">
                  <button 
                    type="submit" 
                    disabled={submitting} 
                    className="w-full py-5 bg-black text-white rounded-[1.5rem] font-black text-lg hover:bg-gray-800 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3"
                  >
                    {submitting ? (
                        <>
                            <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                            Confirming...
                        </>
                    ) : 'Confirm Booking'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
