import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusCircle, Calendar, Users, Search, X, UserPlus, Trash2, 
  Clock, MapPin, BarChart3, Edit, Eye, Settings, ChevronDown
} from 'lucide-react';

const OfficerDashboard = () => {
  const { register, handleSubmit, reset } = useForm();
  const [options, setOptions] = useState(['', '']);
  const [myElections, setMyElections] = useState([]);
  const [assistedElections, setAssistedElections] = useState([]);
  const [activeTab, setActiveTab] = useState('create');
  const [loading, setLoading] = useState(false);
  
  // DAC Modal State
  const [showAssistantModal, setShowAssistantModal] = useState(false);
  const [selectedElection, setSelectedElection] = useState(null);
  const [assistants, setAssistants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editElection, setEditElection] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: ''
  });
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const [electionsRes, assistedRes] = await Promise.all([
        api.get('/elections'),
        api.get('/elections/my-assisted').catch(() => ({ data: [] }))
      ]);
      setMyElections(electionsRes.data);
      setAssistedElections(assistedRes.data);
    } catch (err) {
      console.error('Error fetching elections:', err);
    }
  };

  const addOption = () => setOptions([...options, '']);
  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };
  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const onSubmit = async (data) => {
    const filteredOptions = options.filter(o => o.trim() !== '');
    if (filteredOptions.length < 2) return toast.error('At least 2 options required');

    setLoading(true);
    try {
      await api.post('/elections', { ...data, options: filteredOptions });
      toast.success('Election created!');
      reset();
      setOptions(['', '']);
      fetchElections();
      setActiveTab('manage');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  // DAC Functions
  const openAssistantModal = async (election) => {
    setSelectedElection(election);
    setShowAssistantModal(true);
    try {
      const res = await api.get(`/elections/${election.id}/assistants`);
      setAssistants(res.data);
    } catch (err) {
      toast.error('Failed to load assistants');
    }
  };

  const searchOfficers = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get(`/elections/search-officers?q=${query}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const addAssistant = async (userId) => {
    try {
      await api.post(`/elections/${selectedElection.id}/assistants`, { assistantId: userId });
      toast.success('Assistant added!');
      const res = await api.get(`/elections/${selectedElection.id}/assistants`);
      setAssistants(res.data);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add assistant');
    }
  };

  const removeAssistant = async (userId) => {
    if (!confirm('Remove this assistant?')) return;
    try {
      await api.delete(`/elections/${selectedElection.id}/assistants/${userId}`);
      toast.success('Assistant removed');
      const res = await api.get(`/elections/${selectedElection.id}/assistants`);
      setAssistants(res.data);
    } catch (err) {
      toast.error('Failed to remove assistant');
    }
  };

  const publishResults = async (electionId) => {
    if (!confirm('Publish results? This will make them public.')) return;
    try {
      await api.post(`/elections/${electionId}/publish`);
      toast.success('Results published!');
      fetchElections();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to publish');
    }
  };

  // Edit Election Functions
  const openEditModal = (election) => {
    console.log('Opening edit modal for:', election);
    setEditElection(election);
    // Format datetime for input fields
    const formatDateTime = (dateStr) => {
      const date = new Date(dateStr);
      return date.toISOString().slice(0, 16);
    };
    setEditForm({
      title: election.title || '',
      description: election.description || '',
      start_time: formatDateTime(election.start_time),
      end_time: formatDateTime(election.end_time)
    });
    setShowEditModal(true);
    console.log('showEditModal set to true');
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const saveEditElection = async () => {
    if (!editForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (new Date(editForm.end_time) <= new Date(editForm.start_time)) {
      toast.error('End time must be after start time');
      return;
    }

    setEditLoading(true);
    try {
      await api.put(`/elections/${editElection.id}`, {
        title: editForm.title,
        description: editForm.description,
        start_time: editForm.start_time,
        end_time: editForm.end_time
      });
      toast.success('Election updated successfully!');
      setShowEditModal(false);
      setEditElection(null);
      fetchElections();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update election');
    } finally {
      setEditLoading(false);
    }
  };

  const getElectionStatus = (election) => {
    const now = new Date();
    const start = new Date(election.start_time);
    const end = new Date(election.end_time);
    if (now < start) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700' };
    if (now > end) return { label: 'Closed', color: 'bg-slate-200 text-slate-700' };
    return { label: 'Active', color: 'bg-emerald-100 text-emerald-700' };
  };

  const headerStyle = {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.9)',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.06)',
    padding: '24px 32px',
    marginBottom: '32px',
  };

  const tabBtnStyle = (isActive) => ({
    padding: '12px 24px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: isActive ? 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)' : 'transparent',
    color: isActive ? 'white' : '#64748B',
    boxShadow: isActive ? '0 4px 15px rgba(20, 184, 166, 0.3)' : 'none',
  });

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={headerStyle}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(20, 184, 166, 0.3)',
            }}>
              <Calendar style={{ width: '28px', height: '28px', color: 'white' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1E293B', marginBottom: '4px' }}>
                Election Officer Dashboard
              </h1>
              <p style={{ fontSize: '14px', color: '#64748B' }}>Create and manage elections, add assistants (DAC)</p>
            </div>
          </div>
          
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', background: '#F8FAFC', padding: '6px', borderRadius: '16px' }}>
            <button onClick={() => setActiveTab('create')} style={tabBtnStyle(activeTab === 'create')}>
              <PlusCircle style={{ width: '16px', height: '16px' }} />
              Create
            </button>
            <button onClick={() => setActiveTab('manage')} style={tabBtnStyle(activeTab === 'manage')}>
              <Settings style={{ width: '16px', height: '16px' }} />
              My Elections
            </button>
            <button onClick={() => setActiveTab('assisted')} style={tabBtnStyle(activeTab === 'assisted')}>
              <Users style={{ width: '16px', height: '16px' }} />
              Assisted
            </button>
          </div>
        </div>
      </motion.div>

      {/* Create Election Tab */}
      {activeTab === 'create' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.06)',
          padding: '40px',
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1E293B', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PlusCircle style={{ width: '22px', height: '22px', color: 'white' }} />
            </div>
            Create New Election
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Election Title *</label>
              <input {...register('title', { required: true })} placeholder='e.g., Student Council President Election' className='w-full p-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-teal-400 focus:border-teal-400 outline-none' />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
              <textarea {...register('description')} placeholder='Describe the election purpose...' className='w-full p-4 border border-slate-200 rounded-xl h-32 focus:ring-4 focus:ring-teal-400' />
            </div>

            <div className='grid md:grid-cols-2 gap-6'>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Start Time *</label>
                <input {...register('start_time', { required: true })} type='datetime-local' className='w-full p-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-teal-400' />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">End Time *</label>
                <input {...register('end_time', { required: true })} type='datetime-local' className='w-full p-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-teal-400' />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Region (ABAC)</label>
                <input {...register('region')} placeholder='Leave blank for all regions' className='w-full p-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-teal-400' />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Election Type *</label>
                <select {...register('election_type', { required: true })} className='w-full p-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-teal-400'>
                  <option value="">Select Type</option>
                  <option value="General Election">General Election</option>
                  <option value="Poll">Poll</option>
                  <option value="Referendum">Referendum</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-4">Candidates / Options *</label>
              <div className="space-y-3">
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-3">
                    <input
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      className='flex-1 p-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-teal-400'
                    />
                    {options.length > 2 && (
                      <button type='button' onClick={() => removeOption(i)} className='p-4 text-rose-500 hover:bg-rose-50 rounded-xl'>
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type='button' onClick={addOption} className='mt-4 flex items-center gap-2 bg-slate-100 px-6 py-3 rounded-lg hover:bg-slate-200 font-bold text-slate-700'>
                <PlusCircle className="w-5 h-5" />
                Add Option
              </button>
            </div>

            <button type='submit' disabled={loading} className='w-full bg-teal-600 text-white py-5 rounded-xl text-xl font-bold hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed'>
              {loading ? 'Creating...' : 'Create Election'}
            </button>
          </form>
        </motion.div>
      )}

      {/* Manage Elections Tab */}
      {activeTab === 'manage' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {myElections.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-12 text-center">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-bold">No elections yet</p>
              <p className="text-slate-400">Create your first election to get started</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {myElections.map(election => {
                const status = getElectionStatus(election);
                return (
                  <div key={election.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{election.title}</h3>
                        <p className="text-slate-500">{election.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${status.color}`}>
                          {status.label}
                        </span>
                        {election.results_published && (
                          <span className="px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700">
                            Published
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{new Date(election.start_time).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{new Date(election.end_time).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-sm">{election.vote_count || 0} votes</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {/* Edit Election Button - Only if not published */}
                      {!election.results_published && (
                        <button
                          onClick={() => openEditModal(election)}
                          className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg font-bold hover:bg-amber-100"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Election
                        </button>
                      )}

                      <button
                        onClick={() => openAssistantModal(election)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-bold hover:bg-indigo-100"
                      >
                        <UserPlus className="w-4 h-4" />
                        Manage Assistants (DAC)
                      </button>
                      
                      {status.label === 'Closed' && !election.results_published && (
                        <button
                          onClick={() => publishResults(election.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg font-bold hover:bg-emerald-100"
                        >
                          <Eye className="w-4 h-4" />
                          Publish Results
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Assisted Elections Tab */}
      {activeTab === 'assisted' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {assistedElections.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-12 text-center">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-bold">No assisted elections</p>
              <p className="text-slate-400">You haven't been added as an assistant to any elections</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {assistedElections.map(election => {
                const status = getElectionStatus(election);
                return (
                  <div key={election.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{election.title}</h3>
                        <p className="text-slate-500">Owner: {election.owner_name}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    
                    {/* DAC Permission Badge */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                        🔓 DAC Permission: {election.permission_type}
                      </span>
                    </div>

                    {/* Edit Button for Assisted Elections */}
                    {election.permission_type === 'manage' && !election.results_published && (
                      <button
                        onClick={() => openEditModal(election)}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg font-bold hover:bg-amber-100"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Election (DAC Granted)
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* DAC Assistant Modal */}
      {showAssistantModal && selectedElection && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 9999
          }}
          onClick={() => setShowAssistantModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Manage Assistants (DAC)</h3>
                </div>
                <button onClick={() => setShowAssistantModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-slate-500 text-sm mt-2">{selectedElection.title}</p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Search for Officers */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Add Assistant</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => searchOfficers(e.target.value)}
                    placeholder="Search Election Officers..."
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-400"
                  />
                </div>
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden">
                    {searchResults.map(user => (
                      <button
                        key={user.id}
                        onClick={() => addAssistant(user.id)}
                        className="w-full flex items-center justify-between p-3 hover:bg-slate-50 border-b last:border-b-0 text-left"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{user.full_name || user.username}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                        <UserPlus className="w-5 h-5 text-indigo-600" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Assistants */}
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">Current Assistants</h4>
                {assistants.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">No assistants added yet</p>
                ) : (
                  <div className="space-y-2">
                    {assistants.map(assistant => (
                      <div key={assistant.permission_id || assistant.user_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div>
                          <p className="font-bold text-slate-900">{assistant.full_name || assistant.username}</p>
                          <p className="text-sm text-slate-500">{assistant.email}</p>
                          <p className="text-xs text-slate-400">Added by {assistant.granted_by_name}</p>
                        </div>
                        <button
                          onClick={() => removeAssistant(assistant.user_id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Election Modal */}
      {showEditModal && editElection && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 9999
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                    <Edit className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Edit Election</h3>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Election Title *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => handleEditChange('title', e.target.value)}
                  placeholder="Enter election title"
                  className="w-full p-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-400 focus:border-amber-400 outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => handleEditChange('description', e.target.value)}
                  placeholder="Describe the election..."
                  className="w-full p-4 border border-slate-200 rounded-xl h-24 focus:ring-4 focus:ring-amber-400 resize-none"
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={editForm.start_time}
                  onChange={(e) => handleEditChange('start_time', e.target.value)}
                  className="w-full p-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-400"
                />
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  End Time (Extend voting period here)
                </label>
                <input
                  type="datetime-local"
                  value={editForm.end_time}
                  onChange={(e) => handleEditChange('end_time', e.target.value)}
                  className="w-full p-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-400"
                />
                <p className="text-xs text-slate-500 mt-2">
                  💡 Tip: Change the end time to extend the voting period
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> You can extend the voting period by updating the end time. 
                  Changes are logged in the audit trail.
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-3 px-4 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveEditElection}
                disabled={editLoading}
                className="flex-1 py-3 px-4 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {editLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerDashboard;
