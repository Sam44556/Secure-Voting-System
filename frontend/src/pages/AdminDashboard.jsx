import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, Shield, History, Database, CheckCircle2, XCircle, Search, Filter, AlertTriangle, Clock, HardDrive, RefreshCw, Settings, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [backups, setBackups] = useState([]);
    const [backupStats, setBackupStats] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [activeTab, setActiveTab] = useState('users');
    const [loading, setLoading] = useState(true);
    const [triggeringBackup, setTriggeringBackup] = useState(false);

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
        padding: '12px 20px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
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
        overflow: 'hidden',
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, logsRes, backupsRes, backupStatsRes, alertsRes] = await Promise.all([
                    api.get('/admin/users'),
                    api.get('/admin/audit-logs'),
                    api.get('/backups').catch(() => ({ data: [] })),
                    api.get('/backups/stats').catch(() => ({ data: null })),
                    api.get('/alerts').catch(() => ({ data: [] }))
                ]);
                setUsers(usersRes.data);
                setLogs(logsRes.data);
                setBackups(backupsRes.data);
                setBackupStats(backupStatsRes.data);
                setAlerts(alertsRes.data);
            } catch (error) {
                console.error('Error fetching admin data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const triggerBackup = async () => {
        setTriggeringBackup(true);
        try {
            await api.post('/backups/trigger');
            toast.success('Backup triggered successfully!');
            // Refresh backups
            const [backupsRes, statsRes] = await Promise.all([
                api.get('/backups'),
                api.get('/backups/stats')
            ]);
            setBackups(backupsRes.data);
            setBackupStats(statsRes.data);
        } catch (error) {
            toast.error('Failed to trigger backup');
        } finally {
            setTriggeringBackup(false);
        }
    };

    const seedBackups = async () => {
        try {
            await api.post('/backups/seed');
            toast.success('Demo backups seeded');
            const res = await api.get('/backups');
            setBackups(res.data);
        } catch (error) {
            console.error('Error seeding backups');
        }
    };

    const handleAssignRole = async (userId, role) => {
        console.log('Assigning role', role, 'to user', userId);
        try {
            const response = await api.put(`/admin/users/${userId}/role`, { role });
            console.log('Assign role response:', response);
            // Refresh list
            const res = await api.get('/admin/users');
            setUsers(res.data);
            toast.success(`Role "${role}" assigned successfully!`);
        } catch (error) {
            console.error('Error assigning role:', error);
            toast.error(`Error assigning role: ${error.response?.data?.error || error.message}`);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', border: '4px solid #E0E7FF', borderTop: '4px solid #4F46E5', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ color: '#64748B', fontWeight: '600' }}>Loading administration panel...</p>
            </div>
        </div>
    );

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
                            <Settings style={{ width: '28px', height: '28px', color: 'white' }} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1E293B', marginBottom: '4px' }}>
                                System Administration
                            </h1>
                            <p style={{ fontSize: '14px', color: '#64748B' }}>Manage users, roles, and monitor security events</p>
                        </div>
                    </div>
                    
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '8px', background: '#F8FAFC', padding: '6px', borderRadius: '16px' }}>
                        <button onClick={() => setActiveTab('users')} style={tabBtnStyle(activeTab === 'users')}>
                            <Users style={{ width: '16px', height: '16px' }} />
                            Users
                        </button>
                        <button onClick={() => setActiveTab('logs')} style={tabBtnStyle(activeTab === 'logs')}>
                            <History style={{ width: '16px', height: '16px' }} />
                            Audit Logs
                        </button>
                        <button onClick={() => setActiveTab('system')} style={tabBtnStyle(activeTab === 'system')}>
                            <Database style={{ width: '16px', height: '16px' }} />
                            Backups
                        </button>
                    </div>
                </div>
            </motion.div>

            {activeTab === 'users' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="text" placeholder="Search by name or email..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <button className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900">
                            <Filter className="w-4 h-4" />
                            Filters
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Email Status</th>
                                    <th className="px-6 py-4">Current Role</th>
                                    <th className="px-6 py-4">Assign Role</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                                    {u.username[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-900">{u.username}</div>
                                                    <div className="text-xs text-slate-500">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {u.is_verified ? (
                                                <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                                    <CheckCircle2 className="w-3 h-3" /> Verified
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                                                    <XCircle className="w-3 h-3" /> Unverified
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${(u.roles && u.roles.length > 0) ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                                                {(u.roles && u.roles.length > 0) ? u.roles[0] : 'PENDING'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                className="bg-white border border-slate-200 rounded-lg text-sm p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={(u.roles && u.roles.length > 0) ? u.roles[0] : ''}
                                                onChange={(e) => handleAssignRole(u.id, e.target.value)}
                                            >
                                                <option value="" disabled>Assign Role...</option>
                                                <option value="Voter">Voter</option>
                                                <option value="Election Officer">Election Officer</option>
                                                <option value="Auditor">Auditor</option>
                                                <option value="Admin">Admin</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {activeTab === 'logs' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <History className="w-5 h-5 text-blue-600" />
                            Real-time Audit Trail
                        </h3>
                    </div>
                    <div className="max-h-[600px] overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider sticky top-0">
                                <tr>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Action</th>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">IP Address</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.map(log => (
                                    <tr key={log.id} className="text-sm">
                                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-blue-700 font-bold">
                                            {log.action}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">
                                            {log.username || 'System'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">
                                            {log.ip_address}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
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

            {activeTab === 'system' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    {/* Backup Stats */}
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl">
                            <Database className="w-8 h-8 text-blue-600 mb-3" />
                            <p className="text-xs font-bold text-slate-400 uppercase">Total Backups</p>
                            <p className="text-2xl font-bold text-slate-900">{backupStats?.total_backups || 0}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-3" />
                            <p className="text-xs font-bold text-slate-400 uppercase">Successful</p>
                            <p className="text-2xl font-bold text-emerald-600">{backupStats?.successful || 0}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl">
                            <XCircle className="w-8 h-8 text-rose-600 mb-3" />
                            <p className="text-xs font-bold text-slate-400 uppercase">Failed</p>
                            <p className="text-2xl font-bold text-rose-600">{backupStats?.failed || 0}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl">
                            <HardDrive className="w-8 h-8 text-indigo-600 mb-3" />
                            <p className="text-xs font-bold text-slate-400 uppercase">Database Size</p>
                            <p className="text-2xl font-bold text-indigo-600">{backupStats?.database_size || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
                        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Database className="w-6 h-6 text-blue-600" />
                            Backup Management
                        </h3>
                        <div className="flex flex-wrap gap-4 mb-6">
                            <button 
                                onClick={triggerBackup}
                                disabled={triggeringBackup}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-5 h-5 ${triggeringBackup ? 'animate-spin' : ''}`} />
                                {triggeringBackup ? 'Creating Backup...' : 'Trigger Manual Backup'}
                            </button>
                            {backups.length === 0 && (
                                <button 
                                    onClick={seedBackups}
                                    className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                                >
                                    Load Demo Backups
                                </button>
                            )}
                        </div>

                        {backupStats?.last_backup && (
                            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 mb-6">
                                <div className="flex items-center gap-2 text-emerald-700">
                                    <Clock className="w-5 h-5" />
                                    <span className="font-bold">Last Backup:</span>
                                    <span>{new Date(backupStats.last_backup).toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Backup History */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <History className="w-5 h-5 text-blue-600" />
                                Backup History
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Timestamp</th>
                                        <th className="px-6 py-4">Path</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {backups.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                                No backups yet. Trigger a manual backup or load demo data.
                                            </td>
                                        </tr>
                                    ) : (
                                        backups.map(backup => (
                                            <tr key={backup.id} className="text-sm hover:bg-slate-50">
                                                <td className="px-6 py-4 text-slate-600">
                                                    {new Date(backup.backup_time).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                                    {backup.backup_path}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                        backup.status === 'success' 
                                                            ? 'bg-emerald-100 text-emerald-700' 
                                                            : 'bg-rose-100 text-rose-700'
                                                    }`}>
                                                        {backup.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 text-xs">
                                                    {backup.details}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Alerts Section */}
                    {alerts.length > 0 && (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
                            <h3 className="font-bold text-slate-900 text-xl mb-6 flex items-center gap-2">
                                <AlertTriangle className="w-6 h-6 text-rose-600" />
                                Recent Security Alerts
                            </h3>
                            <div className="space-y-4">
                                {alerts.slice(0, 5).map(alert => (
                                    <div key={alert.id} className={`p-4 rounded-xl border ${
                                        alert.severity === 'high' ? 'bg-red-50 border-red-200' :
                                        alert.severity === 'medium' ? 'bg-amber-50 border-amber-200' :
                                        'bg-blue-50 border-blue-200'
                                    }`}>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                alert.severity === 'high' ? 'bg-red-200 text-red-800' :
                                                alert.severity === 'medium' ? 'bg-amber-200 text-amber-800' :
                                                'bg-blue-200 text-blue-800'
                                            }`}>
                                                {alert.severity}
                                            </span>
                                            <p className="font-bold text-slate-900">{alert.description}</p>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">
                                            {new Date(alert.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default AdminDashboard;
