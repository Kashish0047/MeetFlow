import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Clock, Save, Trash2, Calendar as CalendIcon } from 'lucide-react';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const Schedules = () => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState({
        id: null,
        name: '',
        timezone: 'Asia/Kolkata',
        availability: [
            { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
        ]
    });

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        try {
            const res = await axios.get(`${API_BASE}/schedules`);
            setSchedules(res.data);
        } catch (err) {
            toast.error("Failed to load schedules");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/schedules`, editingSchedule);
            toast.success("Schedule saved!");
            setShowModal(false);
            fetchSchedules();
        } catch (err) {
            toast.error("Error saving schedule");
        }
    };

    const deleteSchedule = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
            try {
                await axios.delete(`${API_BASE}/schedules/${id}`);
                toast.success("Schedule deleted");
                fetchSchedules();
            } catch (err) {
                toast.error("Error deleting schedule");
            }
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Availability Schedules</h1>
                    <p className="text-gray-500 mt-1">Manage multiple sets of working hours for different purposes.</p>
                </div>
                <button 
                    onClick={() => {
                        setEditingSchedule({ id: null, name: 'New Schedule', timezone: 'Asia/Kolkata', availability: [] });
                        setShowModal(true);
                    }}
                    className="btn-primary"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Schedule
                </button>
            </div>

            {loading ? (
                <div className="py-20 text-center animate-pulse text-gray-400 font-medium">Loading schedules...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {schedules.map(s => (
                        <div key={s.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{s.name}</h3>
                                    <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {s.timezone || 'Asia/Kolkata'}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => {
                                            setEditingSchedule({
                                                id: s.id,
                                                name: s.name,
                                                timezone: s.timezone || 'Asia/Kolkata',
                                                availability: s.availability.map(({dayOfWeek, startTime, endTime}) => ({dayOfWeek, startTime, endTime}))
                                            });
                                            setShowModal(true);
                                        }}
                                        className="p-2 hover:bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs transition-colors"
                                    >
                                        Edit
                                    </button>
                                    {!s.isDefault && (
                                        <button 
                                            onClick={() => deleteSchedule(s.id, s.name)}
                                            className="p-2 hover:bg-red-50 border border-gray-100 rounded-xl text-red-500 transition-colors"
                                            title="Delete Schedule"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                {s.availability.sort((a,b) => a.dayOfWeek - b.dayOfWeek).map(a => (
                                    <div key={a.id} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                                        <span className="font-semibold text-gray-600 w-24">{days[a.dayOfWeek]}</span>
                                        <span className="text-gray-400">{a.startTime} - {a.endTime}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                        <h2 className="text-2xl font-black mb-6">{editingSchedule.id ? 'Edit Schedule' : 'New Schedule'}</h2>
                        <form onSubmit={handleSave} className="space-y-8">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Schedule Name</label>
                                <input 
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black focus:bg-white transition-all font-bold"
                                    value={editingSchedule.name}
                                    onChange={e => setEditingSchedule({...editingSchedule, name: e.target.value})}
                                    placeholder="e.g. My Standard Link"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Timezone</label>
                                <select 
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black focus:bg-white transition-all font-bold"
                                    value={editingSchedule.timezone}
                                    onChange={e => setEditingSchedule({...editingSchedule, timezone: e.target.value})}
                                >
                                    <option value="Asia/Kolkata">Asia/Kolkata</option>
                                    <option value="UTC">UTC</option>
                                    <option value="Europe/London">Europe/London</option>
                                    <option value="America/New_York">America/New_York</option>
                                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                                </select>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Working Hours</p>
                                {days.map((day, dIdx) => {
                                    const av = editingSchedule.availability.find(a => a.dayOfWeek === dIdx);
                                    return (
                                        <div key={dIdx} className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-100 transition-all">
                                            <div className="flex items-center gap-3 w-32">
                                                <input 
                                                    type="checkbox" 
                                                    checked={!!av} 
                                                    onChange={() => {
                                                        let newAv = [...editingSchedule.availability];
                                                        if (av) {
                                                            newAv = newAv.filter(a => a.dayOfWeek !== dIdx);
                                                        } else {
                                                            newAv.push({ dayOfWeek: dIdx, startTime: '09:00', endTime: '17:00' });
                                                        }
                                                        setEditingSchedule({...editingSchedule, availability: newAv});
                                                    }}
                                                    className="w-4 h-4 rounded-md accent-black"
                                                />
                                                <span className="font-bold text-gray-700 text-sm">{day}</span>
                                            </div>

                                            {av ? (
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="time" 
                                                        value={av.startTime}
                                                        onChange={e => {
                                                            const newAv = editingSchedule.availability.map(a => a.dayOfWeek === dIdx ? {...a, startTime: e.target.value} : a);
                                                            setEditingSchedule({...editingSchedule, availability: newAv});
                                                        }}
                                                        className="px-2 py-1 bg-white border border-gray-100 rounded-lg text-sm font-bold"
                                                    />
                                                    <span className="text-gray-300">-</span>
                                                    <input 
                                                        type="time" 
                                                        value={av.endTime}
                                                        onChange={e => {
                                                            const newAv = editingSchedule.availability.map(a => a.dayOfWeek === dIdx ? {...a, endTime: e.target.value} : a);
                                                            setEditingSchedule({...editingSchedule, availability: newAv});
                                                        }}
                                                        className="px-2 py-1 bg-white border border-gray-100 rounded-lg text-sm font-bold"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-xs font-bold text-gray-300">Unavailable</span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 font-bold text-gray-500 hover:text-black transition-colors">Cancel</button>
                                <button type="submit" className="px-8 py-3 bg-black text-white rounded-2xl font-black hover:bg-gray-800 transition-all shadow-lg shadow-black/10 flex items-center gap-2">
                                    <Save className="w-5 h-5" />
                                    Save Schedule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Schedules;
