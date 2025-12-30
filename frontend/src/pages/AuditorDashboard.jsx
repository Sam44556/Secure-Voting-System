import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { 
  History, BarChart3, Search, Clock, ShieldCheck, Download, AlertTriangle, 
  CheckCircle2, XCircle, Filter, Bell, TrendingUp, Users, Vote, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AuditorDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [elections, setElections] = useState([]);
  const [stats, setStats] = useState(null);
  const [alertStats, setAlertStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [eventTypes, setEventTypes] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [logsRes, alertsRes, electionsRes, statsRes, alertStatsRes, eventTypesRes] = await Promise.all([
        api.get('/audit/logs'),
        api.get('/alerts'),
        api.get('/audit/elections'),
        api.get('/audit/stats'),
        api.get('/alerts/stats'),
        api.get('/audit/event-types')
      ]);
      setLogs(logsRes.data);
      setAlerts(alertsRes.data);
      setElections(electionsRes.data);
      setStats(statsRes.data);
      setAlertStats(alertStatsRes.data);
      setEventTypes(eventTypesRes.data);
    } catch (error) {
      console.error('Error fetching auditor data:', error);
      toast.error('Failed to load auditor data');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await api.put(`/alerts/${alertId}/acknowledge`);
      toast.success('Alert acknowledged');
      fetchData();
    } catch (error) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const handleSearch = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (eventTypeFilter) params.append('eventType', eventTypeFilter);
      
      const res = await api.get(`/audit/logs?${params.toString()}`);
      setLogs(res.data);
    } catch (error) {
      toast.error('Search failed');
    }
  };

  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      stats,
      alertStats,
      recentLogs: logs.slice(0, 50),
      elections: elections.map(e => ({
        title: e.title,
        status: e.computed_status,
        votes: e.vote_count,
        published: e.results_published
      }))
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success('Report exported');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #E0E7FF', borderTop: '4px solid #4F46E5', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748B', fontWeight: '600' }}>Loading auditor dashboard...</p>
        </div>
      </div>
    );
  }

  const unacknowledgedAlerts = alerts.filter(a => !a.notified);

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
    textTransform: 'capitalize',
    background: isActive ? 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' : 'transparent',
    color: isActive ? 'white' : '#64748B',
    boxShadow: isActive ? '0 4px 15px rgba(79, 70, 229, 0.3)' : 'none',
  });

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.06)',
    padding: '32px',
  };

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
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(79, 70, 229, 0.3)',
            }}>
              <ShieldCheck style={{ width: '28px', height: '28px', color: 'white' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1E293B', marginBottom: '4px' }}>
                Auditor Dashboard
              </h1>
              <p style={{ fontSize: '14px', color: '#64748B' }}>Monitor system integrity, review logs, and verify compliance</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              onClick={exportReport}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'white',
                border: '1px solid #E2E8F0',
                padding: '12px 20px',
                borderRadius: '12px',
                fontWeight: '600',
                color: '#475569',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Download style={{ width: '18px', height: '18px' }} />
              Export Report
            </button>
          </div>
        </div>
      </motion.div>

      {/* Alert Banner */}
      {unacknowledgedAlerts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            color: 'white',
            padding: '24px',
            borderRadius: '20px',
            marginBottom: '24px',
            boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Bell style={{ width: '32px', height: '32px' }} />
              <div>
                <h3 style={{ fontWeight: '700', fontSize: '18px' }}>{unacknowledgedAlerts.length} Unacknowledged Security Alert{unacknowledgedAlerts.length > 1 ? 's' : ''}</h3>
                <p style={{ opacity: 0.9 }}>Immediate attention required for system security</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('alerts')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '10px',
                fontWeight: '700',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              View Alerts
            </button>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', background: '#F8FAFC', padding: '6px', borderRadius: '16px', marginBottom: '32px', width: 'fit-content' }}>
        {['overview', 'logs', 'alerts', 'elections'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={tabBtnStyle(activeTab === tab)}>
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Events', value: stats?.total_events || 0, icon: History, gradient: '#3B82F6, #1D4ED8' },
              { label: 'Security Alerts', value: alertStats?.total || 0, icon: AlertTriangle, gradient: '#EF4444, #DC2626' },
              { label: 'Votes Cast', value: stats?.votes_cast || 0, icon: Vote, gradient: '#10B981, #059669' },
              { label: 'New Registrations', value: stats?.new_registrations || 0, icon: Users, gradient: '#F59E0B, #D97706' }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                style={{
                  background: `linear-gradient(135deg, ${stat.gradient})`,
                  padding: '24px',
                  borderRadius: '20px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', marginBottom: '8px' }}>{stat.label}</p>
                    <p style={{ fontSize: '32px', fontWeight: '800', color: 'white' }}>{stat.value}</p>
                  </div>
                  <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <stat.icon style={{ width: '24px', height: '24px', color: 'white' }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Alert Summary */}
          {alertStats && (
            <div style={cardStyle}>
              <h3 style={{ fontWeight: '700', color: '#1E293B', fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle style={{ width: '20px', height: '20px', color: 'white' }} />
                </div>
                Alert Summary (Last 30 Days)
              </h3>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                  <p className="text-sm font-bold text-red-800">High Severity</p>
                  <p className="text-2xl font-bold text-red-600">{alertStats.high || 0}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="text-sm font-bold text-amber-800">Medium Severity</p>
                  <p className="text-2xl font-bold text-amber-600">{alertStats.medium || 0}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-sm font-bold text-blue-800">Low Severity</p>
                  <p className="text-2xl font-bold text-blue-600">{alertStats.low || 0}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-sm font-bold text-slate-800">Unacknowledged</p>
                  <p className="text-2xl font-bold text-slate-600">{alertStats.unacknowledged || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
            <h3 className="font-bold text-slate-900 text-xl mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {logs.slice(0, 5).map(log => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${log.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <div>
                      <p className="font-bold text-slate-900">{log.action || log.event_type}</p>
                      <p className="text-sm text-slate-500">{log.username} • {log.ip_address}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              Complete Audit Trail
            </h3>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search events..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64" 
                />
              </div>
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Events</option>
                {eventTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <button 
                onClick={handleSearch}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700"
              >
                Search
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="px-6 py-4 border-r border-slate-100">Event ID</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => (
                  <tr key={log.id} className="text-sm hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-400 truncate max-w-[100px] border-r border-slate-100">
                      {log.id?.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-slate-600">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="text-indigo-700 font-bold">{log.action || log.event_type}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-900">{log.username || 'System'}</td>
                    <td className="px-6 py-4 text-slate-500">{log.ip_address || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        log.status === 'SUCCESS' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
            <h3 className="font-bold text-slate-900 text-xl mb-6 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
              Security Alerts
            </h3>
            
            {alerts.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <p className="text-slate-600 font-bold">No security alerts</p>
                <p className="text-slate-400">The system is operating normally</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map(alert => (
                  <motion.div 
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-6 rounded-2xl border ${
                      alert.severity === 'high' ? 'bg-red-50 border-red-200' :
                      alert.severity === 'medium' ? 'bg-amber-50 border-amber-200' :
                      'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <AlertTriangle className={`w-6 h-6 ${
                          alert.severity === 'high' ? 'text-red-600' :
                          alert.severity === 'medium' ? 'text-amber-600' :
                          'text-blue-600'
                        }`} />
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                              alert.severity === 'high' ? 'bg-red-200 text-red-800' :
                              alert.severity === 'medium' ? 'bg-amber-200 text-amber-800' :
                              'bg-blue-200 text-blue-800'
                            }`}>
                              {alert.severity}
                            </span>
                            <span className="text-sm text-slate-500">{alert.alert_type}</span>
                          </div>
                          <p className="font-bold text-slate-900">{alert.description}</p>
                          <p className="text-sm text-slate-500 mt-1">
                            {new Date(alert.created_at).toLocaleString()}
                            {alert.related_user && ` • User: ${alert.related_user}`}
                          </p>
                        </div>
                      </div>
                      {!alert.notified && (
                        <button
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Acknowledge
                        </button>
                      )}
                      {alert.notified && (
                        <span className="flex items-center gap-1 text-sm text-emerald-600 font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          Acknowledged
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Elections Tab */}
      {activeTab === 'elections' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
          <h3 className="font-bold text-slate-900 text-xl mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Election Results & Integrity
          </h3>
          
          <div className="space-y-6">
            {elections.map(election => (
              <div key={election.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">{election.title}</h4>
                    <p className="text-slate-500">{election.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      election.computed_status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      election.computed_status === 'closed' ? 'bg-slate-200 text-slate-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {election.computed_status}
                    </span>
                    {election.results_published ? (
                      <span className="px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700">
                        Published
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-700">
                        Internal (MAC)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-white rounded-xl">
                    <p className="text-xs text-slate-500">Total Votes</p>
                    <p className="text-xl font-bold text-slate-900">{election.vote_count}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl">
                    <p className="text-xs text-slate-500">Start Time</p>
                    <p className="text-sm font-bold text-slate-900">{new Date(election.start_time).toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl">
                    <p className="text-xs text-slate-500">End Time</p>
                    <p className="text-sm font-bold text-slate-900">{new Date(election.end_time).toLocaleString()}</p>
                  </div>
                </div>

                {/* Results */}
                {election.results && election.results.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-bold text-slate-700 mb-3">Vote Distribution:</p>
                    <div className="space-y-2">
                      {election.results.map((result, i) => {
                        const percentage = election.vote_count > 0 
                          ? ((result.vote_count / election.vote_count) * 100).toFixed(1)
                          : 0;
                        const isWinner = i === 0 && result.vote_count > 0;
                        return (
                          <div key={result.id} className="flex items-center gap-4">
                            <div className="w-32 text-sm font-medium text-slate-700 truncate">
                              {result.option_text}
                              {isWinner && <span className="ml-1">🏆</span>}
                            </div>
                            <div className="flex-1 bg-slate-200 rounded-full h-4 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${isWinner ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="w-20 text-right">
                              <span className="font-bold text-slate-900">{result.vote_count}</span>
                              <span className="text-slate-400 text-sm ml-1">({percentage}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AuditorDashboard;
