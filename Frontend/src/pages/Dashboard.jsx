import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Plus, MoreVertical, Clock, Link as LinkIcon, Trash2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const Dashboard = () => {
  const [eventTypes, setEventTypes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [newType, setNewType] = useState({
    title: '',
    slug: '',
    duration: 30,
    description: '',
    bufferTime: 0,
    scheduleId: '',
    questions: []
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchEventTypes();
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
      try {
          const res = await axios.get(`${API_BASE}/schedules`);
          setSchedules(res.data);
        } catch (err) {
          console.error(err);
          toast.error("Error loading event types");
        }
  };

  const fetchEventTypes = async () => {
    try {
      const res = await axios.get(`${API_BASE}/event-types`);
      setEventTypes(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load event types");
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
          ...newType,
          duration: parseInt(newType.duration),
          bufferTime: parseInt(newType.bufferTime),
          scheduleId: newType.scheduleId ? parseInt(newType.scheduleId) : null
      };
      if (editingId) {
        await axios.put(`${API_BASE}/event-types/${editingId}`, payload);
      } else {
        await axios.post(`${API_BASE}/event-types`, payload);
      }
      setShowModal(false);
      setEditingId(null);
      setNewType({ title: '', slug: '', duration: 30, description: '', bufferTime: 0, scheduleId: '', questions: [] });
      fetchEventTypes();
      toast.success(editingId ? "Event type updated!" : "Event type created!");
    } catch (err) {
      toast.error("Error saving event type.");
    }
  };

  const handleDelete = (id) => {
    const CustomToast = ({ closeToast }) => (
      <div className="p-1">
        <p className="font-bold text-sm mb-2 text-gray-800">Are you sure you want to delete this event?</p>
        <div className="flex gap-2">
          <button 
            className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-600 transition-colors"
            onClick={async () => {
              try {
                await axios.delete(`${API_BASE}/event-types/${id}`);
                fetchEventTypes();
                toast.success("Event type deleted");
                closeToast();
              } catch (err) {
                toast.error("Error deleting event type.");
              }
            }}
          >
            Yes, Delete
          </button>
          <button 
            className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-xs font-bold hover:bg-gray-200 transition-colors"
            onClick={closeToast}
          >
            Cancel
          </button>
        </div>
      </div>
    );

    toast.info(<CustomToast />, {
      position: "bottom-right",
      autoClose: false,
      closeOnClick: false,
      draggable: false,
    });
  };

  const openEditModal = (type) => {
    setEditingId(type.id);
    setNewType({
        title: type.title,
        slug: type.slug,
        duration: type.duration,
        description: type.description || '',
        bufferTime: type.bufferTime || 0,
        scheduleId: type.scheduleId || '',
        questions: type.questions || []
    });
    setShowModal(true);
  };

  const addQuestion = () => {
      setNewType({
          ...newType,
          questions: [...newType.questions, { label: '', type: 'text', required: true }]
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Event Types</h1>
          <p className="text-gray-500">Create events that people can book with you.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setNewType({ title: '', slug: '', duration: 30, description: '', bufferTime: 0, scheduleId: '', questions: [] });
            setShowModal(true);
          }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Event Type
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading...</div>
      ) : eventTypes.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl py-20 text-center">
          <p className="text-gray-500">No event types yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventTypes.map((type) => (
            <div key={type.id} className="card group">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <Clock className="w-6 h-6 text-gray-700" />
                </div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2 py-1 bg-gray-50 rounded">
                    {type.schedule?.name || 'Default'}
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-1">{type.title}</h3>
              <p className="text-gray-500 text-sm mb-4">/{type.slug}</p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {type.duration}m
                </span>
                {type.bufferTime > 0 && (
                    <span className="flex items-center gap-1 text-orange-500">
                      + {type.bufferTime}m buffer
                    </span>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <a 
                  href={`/meetflow/${type.slug}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-sm font-medium hover:underline flex items-center gap-1"
                >
                  <LinkIcon className="w-4 h-4" /> Copy Link
                </a>
                <div className="flex gap-2">
                    <button 
                      onClick={() => openEditModal(type)}
                      className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(type.id)}
                      className="p-1 hover:bg-red-50 rounded text-red-500 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black mb-6">{editingId ? 'Edit Event Type' : 'New Event Type'}</h2>
            <form onSubmit={handleCreateOrUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Title</label>
                            <input 
                                className="input" 
                                placeholder="e.g. Quick Chat"
                                value={newType.title}
                                onChange={e => setNewType({...newType, title: e.target.value})}
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">URL Slug</label>
                            <input 
                                className="input" 
                                placeholder="e.g. quick-chat"
                                value={newType.slug}
                                onChange={e => setNewType({...newType, slug: e.target.value})}
                                required 
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Duration (m)</label>
                                <input 
                                    type="number" 
                                    className="input" 
                                    value={newType.duration}
                                    onChange={e => setNewType({...newType, duration: e.target.value})}
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Buffer (m)</label>
                                <input 
                                    type="number" 
                                    className="input text-orange-600" 
                                    value={newType.bufferTime}
                                    onChange={e => setNewType({...newType, bufferTime: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Availability Schedule</label>
                            <select 
                                className="input"
                                value={newType.scheduleId}
                                onChange={e => setNewType({...newType, scheduleId: e.target.value})}
                            >
                                <option value="">Default Schedule</option>
                                {schedules.filter(s => !s.isDefault).map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Custom Questions</h3>
                        <button type="button" onClick={addQuestion} className="text-xs font-bold text-black border border-black px-3 py-1 rounded-lg hover:bg-black hover:text-white transition-all">
                            + Add Question
                        </button>
                    </div>
                    <div className="space-y-3">
                        {newType.questions.map((q, idx) => (
                            <div key={idx} className="flex gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                <input 
                                    className="flex-1 bg-transparent text-sm font-bold focus:outline-none"
                                    placeholder="Question label (e.g. Company Name)"
                                    value={q.label}
                                    onChange={e => {
                                        const newQ = [...newType.questions];
                                        newQ[idx].label = e.target.value;
                                        setNewType({...newType, questions: newQ});
                                    }}
                                />
                                <button type="button" onClick={() => {
                                    const newQ = newType.questions.filter((_, i) => i !== idx);
                                    setNewType({...newType, questions: newQ});
                                }} className="text-red-400 hover:text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 font-bold text-gray-400">Cancel</button>
                <button type="submit" className="px-10 py-3 bg-black text-white rounded-2xl font-black hover:bg-gray-800 transition-all shadow-lg shadow-black/10">
                    {editingId ? 'Save Changes' : 'Create Event Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const User = ({ className }) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    )
}

export default Dashboard;
