import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMinutes, isBefore, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Globe, CheckCircle, RefreshCcw } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const ReschedulePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [step, setStep] = useState('calendar'); // 'calendar', 'success'
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchBooking();
    }, [id]);

    const fetchBooking = async () => {
        try {
            const res = await axios.get(`${API_BASE}/bookings`);
            const found = res.data.find(b => b.id === parseInt(id));
            if (found) {
                setBooking(found);
            } else {
                toast.error("Booking not found");
            }
        } catch (err) {
            toast.error("Error loading booking details");
        }
    };

    useEffect(() => {
        if (booking) {
            fetchSlots();
        }
    }, [selectedDate, booking]);

    const fetchSlots = async () => {
        setLoadingSlots(true);
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const res = await axios.get(`${API_BASE}/slots?eventTypeId=${booking.eventTypeId}&date=${dateStr}`);
            setSlots(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load available slots");
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleReschedule = async () => {
        setSubmitting(true);
        try {
            await axios.post(`${API_BASE}/bookings/${id}/reschedule`, {
                date: selectedDate,
                startTime: selectedSlot.start,
                endTime: selectedSlot.end
            });
            setStep('success');
            toast.success("Rescheduled successfully!");
        } catch (err) {
            toast.error("Error rescheduling meeting");
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

    if (!booking) return <div className="min-h-screen flex items-center justify-center font-black text-gray-200 animate-pulse uppercase tracking-widest">Loading Booking...</div>;

    if (step === 'success') {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center p-12">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle className="w-10 h-10 text-blue-500" />
                    </div>
                    <h1 className="text-3xl font-black mb-2 text-gray-900">Meeting Rescheduled</h1>
                    <p className="text-gray-500 mb-10 font-medium text-sm">Your meeting has been successfully moved to the new time. An update notification has been sent.</p>
                    <div className="bg-gray-50 rounded-3xl p-6 text-left border border-gray-100 mb-10">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">New Time</p>
                        <p className="font-bold text-gray-900">{format(selectedDate, 'PPPP')}</p>
                        <p className="font-bold text-gray-500 text-sm">{selectedSlot.start} - {selectedSlot.end}</p>
                    </div>
                    <p className="text-gray-400 text-xs italic">You can close this window now.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4">
            <div className="max-w-5xl w-full flex flex-col md:flex-row bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-gray-200/50">

                <div className="md:w-[35%] p-10 border-r border-gray-50 bg-[#fafafa]">
                    <div className="flex items-center gap-2 mb-10">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <RefreshCcw className="w-4 h-4" />
                        </div>
                        <span className="font-black text-[10px] uppercase tracking-widest text-blue-600">Rescheduling</span>
                    </div>
                    
                    <h1 className="text-3xl font-black text-gray-900 leading-tight mb-8">Move your meeting</h1>
                    
                    <div className="space-y-6">
                        <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Original Meeting</p>
                            <p className="font-bold text-gray-900">{booking.eventType.title}</p>
                            <p className="text-sm text-gray-500 font-medium">with MeetFlow</p>
                        </div>
                        <div className="flex items-center gap-3 text-gray-500 font-bold text-sm">
                            <Clock className="w-5 h-5 text-gray-300" /> {booking.eventType.duration} Minutes
                        </div>
                        {selectedSlot && (
                            <div className="flex items-start gap-3 text-blue-600 font-black text-sm pt-4 animate-in slide-in-from-left-4 duration-300">
                                <CalendarIcon className="w-5 h-5" /> 
                                <div>
                                    <p>{format(selectedDate, 'EEEE, MMM d, yyyy')}</p>
                                    <p className="opacity-60">{selectedSlot.start} - {selectedSlot.end}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 p-10 lg:p-14">
                    <div className="flex flex-col lg:flex-row gap-12 h-full">
                        <div className="flex-1">
                            <h2 className="text-xl font-black mb-10 text-gray-900">Select new Date & Time</h2>
                            {renderCalendar()}
                        </div>
                        
                        <div className="w-full lg:w-48 flex flex-col pt-12 lg:pt-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6">{format(selectedDate, 'EEEE, MMM d')}</p>
                            {loadingSlots ? (
                                <div className="flex flex-col gap-3">
                                    {[1,2,3,4].map(i => <div key={i} className="h-10 bg-gray-50 rounded-xl animate-pulse"></div>)}
                                </div>
                            ) : slots.length === 0 ? (
                                <div className="py-20 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-100 font-bold text-xs text-gray-300 uppercase">
                                    No Slots
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2 overflow-y-auto pr-2 max-h-[300px] custom-scrollbar">
                                        {slots.map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedSlot(s)}
                                                className={`w-full py-4 border rounded-xl text-sm font-black transition-all ${
                                                    selectedSlot?.start === s.start 
                                                    ? 'bg-black text-white border-black scale-[1.05] shadow-lg shadow-black/20' 
                                                    : 'border-gray-100 text-gray-700 hover:border-black'
                                                }`}
                                            >
                                                {s.start}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    {selectedSlot && (
                                        <button 
                                            onClick={handleReschedule}
                                            disabled={submitting}
                                            className="w-full py-4 bg-black text-white rounded-xl font-black text-sm hover:bg-gray-800 transition-all shadow-xl shadow-black/20 mt-4 animate-in fade-in duration-300"
                                        >
                                            {submitting ? 'Updating...' : 'Confirm New Time'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReschedulePage;
