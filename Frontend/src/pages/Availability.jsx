import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { Save, Globe, Calendar as CalendarIcon } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const Availability = () => {
    const [schedule, setSchedule] = useState([]);
    const [scheduleId, setScheduleId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentTimezone, setCurrentTimezone] = useState('Asia/Kolkata');
    const [overrides, setOverrides] = useState([]);
    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [newOverride, setNewOverride] = useState({ 
        id: null,
        date: format(new Date(), 'yyyy-MM-dd'), 
        startTime: '09:00', 
        endTime: '17:00', 
        type: 'hours' 
    });

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    useEffect(() => {
        const init = async () => {
            const sId = await fetchAvailability();
            if (sId) fetchOverrides(sId);
        };
        init();
    }, []);

    const fetchAvailability = async () => {
        try {
            const res = await axios.get(`${API_BASE}/availability`);
            setScheduleId(res.data.id);

            const fullSchedule = Array.from({ length: 7 }, (_, i) => {
                const existing = res.data.availability.find(d => d.dayOfWeek === i);
                if (existing) {
                    return { ...existing, active: true };
                }
                return { dayOfWeek: i, startTime: '09:00', endTime: '17:00', active: false };
            });
            setSchedule(fullSchedule);
            setCurrentTimezone(res.data.timezone || 'Asia/Kolkata');
            return res.data.id;
        } catch (err) {
            toast.error("Error loading availability");
        } finally {
            setLoading(false);
        }
    };

    const fetchOverrides = async (sId) => {
        const idToUse = sId || scheduleId;
        if (!idToUse) return;
        try {
            const res = await axios.get(`${API_BASE}/overrides?scheduleId=${idToUse}`);
            setOverrides(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load date overrides");
        }
    };

    const handleToggle = (index) => {
        const newSchedule = [...schedule];
        newSchedule[index].active = !newSchedule[index].active;
        setSchedule(newSchedule);
    };

    const handleTimeChange = (index, field, value) => {
        const newSchedule = [...schedule];
        newSchedule[index][field] = value;
        setSchedule(newSchedule);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.post(`${API_BASE}/availability`, { 
                schedule, 
                timezone: currentTimezone 
            });
            toast.success("Schedule saved successfully!");
        } catch (err) {
            toast.error("Error saving schedule");
        } finally {
            setSaving(false);
        }
    };

    const handleAddOverride = async (e) => {
        e.preventDefault();
        try {
            const data = newOverride.type === 'blocked' 
                ? { date: newOverride.date, startTime: null, endTime: null, scheduleId }
                : { date: newOverride.date, startTime: newOverride.startTime, endTime: newOverride.endTime, scheduleId };
            
            if (newOverride.id) {
                await axios.put(`${API_BASE}/overrides/${newOverride.id}`, data);
                toast.success("Override updated!");
            } else {
                await axios.post(`${API_BASE}/overrides`, data);
                toast.success("Date override added!");
            }
            setShowOverrideModal(false);
            fetchOverrides();
        } catch (err) {
            toast.error("Error saving override");
        }
    };

    const handleDeleteOverride = (id) => {
        toast(
            <div className="flex flex-col gap-3">
                <p className="font-semibold text-gray-900">Delete this override?</p>
                <div className="flex gap-2 justify-end mt-2">
                    <button 
                        onClick={() => toast.dismiss()} 
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={async () => {
                            toast.dismiss();
                            try {
                                await axios.delete(`${API_BASE}/overrides/${id}`);
                                toast.success("Override deleted");
                                fetchOverrides();
                            } catch (err) {
                                toast.error("Error deleting override");
                            }
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-black text-white hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        Confirm
                    </button>
                </div>
            </div>,
            { autoClose: false, closeOnClick: false, closeButton: false }
        );
    };

    if (loading) return <div className="p-20 text-center font-bold text-gray-400 animate-pulse uppercase tracking-widest">Loading Availability...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-12 p-6 pb-20 selection:bg-black selection:text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Availability</h1>
                    <p className="text-gray-500 mt-2 font-medium">Configure your default schedule and date-specific rules.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-4 py-2 shadow-sm">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <select 
                            value={currentTimezone}
                            onChange={(e) => setCurrentTimezone(e.target.value)}
                            className="text-xs font-bold bg-transparent outline-none cursor-pointer"
                        >
                            <option value="Asia/Kolkata">Asia/Kolkata</option>
                            <option value="UTC">UTC</option>
                            <option value="Europe/London">Europe/London</option>
                            <option value="America/New_York">America/New_York</option>
                            <option value="America/Los_Angeles">America/Los_Angeles</option>
                        </select>
                    </div>
                    <a href="/schedules" className="px-6 py-3 bg-white border border-gray-100 rounded-2xl font-black text-sm hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm">
                        <Globe className="w-4 h-4" />
                        Manage Schedules
                    </a>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black flex items-center gap-2">
                        <Globe className="w-5 h-5 text-gray-400" />
                        Weekly Hours (Default)
                    </h2>
                </div>
                
                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-gray-200/50">
                    <div className="space-y-6">
                        {schedule.sort((a,b) => (a.dayOfWeek || 0) - (b.dayOfWeek || 0)).map((s, idx) => (
                            <div key={s.dayOfWeek} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2 border-b border-gray-50 last:border-0 pb-6 last:pb-0">
                                <div className="flex items-center gap-4 w-full sm:w-1/3">
                                    <input 
                                        type="checkbox" 
                                        checked={s.active} 
                                        onChange={() => handleToggle(idx)}
                                        className="w-6 h-6 rounded-lg accent-black border-gray-200 cursor-pointer shadow-sm"
                                    />
                                    <span className="font-black text-gray-700 text-sm uppercase tracking-wide">{days[s.dayOfWeek]}</span>
                                </div>
                                
                                {s.active ? (
                                    <div className="flex items-center gap-3 w-full sm:flex-1 justify-start sm:justify-end animate-in fade-in slide-in-from-right-4 duration-300">
                                        <input 
                                            type="time" 
                                            value={s.startTime}
                                            onChange={(e) => handleTimeChange(idx, 'startTime', e.target.value)}
                                            className="bg-gray-50 border border-gray-100 focus:bg-white rounded-xl px-4 py-2.5 text-sm font-black focus:outline-none focus:ring-4 focus:ring-black/5 transition-all w-full sm:w-auto" 
                                        />
                                        <span className="text-gray-300 font-bold">-</span>
                                        <input 
                                            type="time" 
                                            value={s.endTime}
                                            onChange={(e) => handleTimeChange(idx, 'endTime', e.target.value)}
                                            className="bg-gray-50 border border-gray-100 focus:bg-white rounded-xl px-4 py-2.5 text-sm font-black focus:outline-none focus:ring-4 focus:ring-black/5 transition-all w-full sm:w-auto" 
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full sm:flex-1 text-left sm:text-right text-xs font-black text-gray-300 uppercase tracking-widest italic">Unavailable</div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-10 pt-10 border-t border-gray-50 flex justify-end">
                        <button 
                            onClick={handleSave} 
                            disabled={saving}
                            className="w-full sm:w-auto px-10 py-4 bg-black text-white rounded-2xl font-black hover:bg-gray-800 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            {saving ? 'Saving...' : 'Save Default Schedule'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-gray-400" />
                            Date Overrides
                        </h2>
                        <p className="text-xs text-gray-400 mt-1 font-bold italic tracking-tighter">Add rules for specific dates (holidays or special hours).</p>
                    </div>
                    <button 
                        onClick={() => {
                            setNewOverride({ id: null, date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', endTime: '17:00', type: 'hours' });
                            setShowOverrideModal(true);
                        }}
                        className="text-[10px] font-black px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-all shadow-lg shadow-black/10 uppercase tracking-widest"
                    >
                        Add Override
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {overrides.length === 0 ? (
                        <div className="col-span-full py-16 text-center bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[2.5rem]">
                            <p className="text-gray-300 text-sm font-black uppercase tracking-widest pb-2">No active overrides</p>
                            <p className="text-[10px] text-gray-200 italic">Your default schedule applies to all dates.</p>
                        </div>
                    ) : (
                        overrides.map(o => (
                            <div key={o.id} className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 bg-white/80 backdrop-blur-sm rounded-bl-2xl border-l border-b border-gray-100 z-20">
                                     <button 
                                        onClick={() => {
                                            setNewOverride({
                                                id: o.id,
                                                date: format(new Date(o.date), 'yyyy-MM-dd'),
                                                startTime: o.startTime || '09:00',
                                                endTime: o.endTime || '17:00',
                                                type: o.startTime ? 'hours' : 'blocked'
                                            });
                                            setShowOverrideModal(true);
                                        }}
                                        className="p-1 px-2 text-[10px] font-black hover:bg-gray-100 rounded-lg text-gray-600"
                                     >
                                        Edit
                                     </button>
                                     <button 
                                        onClick={() => handleDeleteOverride(o.id)}
                                        className="p-1 px-2 text-[10px] font-black hover:bg-red-50 rounded-lg text-red-500"
                                     >
                                        Delete
                                     </button>
                                </div>
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <span className="font-black text-lg text-gray-900">{format(new Date(o.date), 'MMM dd')}</span>
                                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${o.startTime ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {o.startTime ? 'Custom' : 'Blocked'}
                                    </span>
                                </div>
                                {o.startTime && (
                                    <p className="text-sm font-black text-gray-500 relative z-10">{o.startTime} - {o.endTime}</p>
                                )}
                                <p className="text-xs text-gray-300 font-bold mt-2 relative z-10">{format(new Date(o.date), 'yyyy')}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showOverrideModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] max-w-sm w-full p-10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <h3 className="text-2xl font-black mb-8 text-gray-900">New Override</h3>
                        <form onSubmit={handleAddOverride} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Select Date</label>
                                <input 
                                    type="date" 
                                    className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-black rounded-2xl px-5 py-4 font-black transition-all outline-none"
                                    value={newOverride.date}
                                    onChange={e => setNewOverride({...newOverride, date: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="flex gap-4 p-1.5 bg-gray-50 rounded-2xl">
                                <button 
                                    type="button"
                                    onClick={() => setNewOverride({...newOverride, type: 'hours'})}
                                    className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${newOverride.type === 'hours' ? 'bg-white shadow-lg shadow-black/5 text-black' : 'text-gray-400'}`}
                                >
                                    Working
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setNewOverride({...newOverride, type: 'blocked'})}
                                    className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${newOverride.type === 'blocked' ? 'bg-white shadow-lg shadow-black/5 text-red-600' : 'text-gray-400'}`}
                                >
                                    Time Off
                                </button>
                            </div>

                            {newOverride.type === 'hours' && (
                                <div className="flex gap-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 italic">From</label>
                                        <input 
                                            type="time" 
                                            className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-black rounded-xl px-4 py-3 font-black text-sm outline-none transition-all"
                                            value={newOverride.startTime}
                                            onChange={e => setNewOverride({...newOverride, startTime: e.target.value})}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 italic">To</label>
                                        <input 
                                            type="time" 
                                            className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-black rounded-xl px-4 py-3 font-black text-sm outline-none transition-all"
                                            value={newOverride.endTime}
                                            onChange={e => setNewOverride({...newOverride, endTime: e.target.value})}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-3 pt-6">
                                <button type="submit" className="w-full py-5 bg-black text-white rounded-2xl font-black text-sm hover:bg-gray-800 transition-all shadow-xl shadow-black/20">Add Rule</button>
                                <button type="button" onClick={() => setShowOverrideModal(false)} className="w-full py-3 font-bold text-gray-400 hover:text-red-500 transition-colors">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Availability;
