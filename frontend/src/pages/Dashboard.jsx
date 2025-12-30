import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Vote, Users, ShieldAlert, Clock, ChevronRight, Plus, Shield, Activity, BarChart3, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { user } = useAuth();
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPolls = async () => {
            try {
                const response = await api.get('/polls');
                setPolls(response.data);
            } catch (err) {
                console.error('Failed to fetch polls');
            } finally {
                setLoading(false);
            }
        };
        fetchPolls();
    }, []);

    const cardStyle = {
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.06)',
        padding: '24px',
        transition: 'all 0.3s ease',
    };

    const statCardStyle = (gradient) => ({
        ...cardStyle,
        background: `linear-gradient(135deg, ${gradient})`,
        border: 'none',
    });

    const stats = [
        { label: 'Active Polls', value: polls.length, icon: Vote, gradient: '#3B82F6, #1D4ED8', textColor: 'white' },
        { label: 'Security Level', value: user.clearance_level || 'Standard', icon: Shield, gradient: '#8B5CF6, #6D28D9', textColor: 'white' },
        { label: 'Department', value: user.department || 'General', icon: Users, gradient: '#10B981, #059669', textColor: 'white' },
        { label: 'Session Time', value: '08:00 - 18:00', icon: Clock, gradient: '#F59E0B, #D97706', textColor: 'white' },
    ];

    return (
        <div style={{ minHeight: '100%' }}>
            {/* Welcome Header */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '40px' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)', padding: '6px 14px', borderRadius: '100px', marginBottom: '12px', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
                            <Activity style={{ width: '14px', height: '14px', color: '#4F46E5' }} />
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#4F46E5' }}>System Active</span>
                        </div>
                        <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#1E293B', marginBottom: '8px' }}>
                            Welcome back, <span style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user.username}</span>
                        </h1>
                        <p style={{ fontSize: '16px', color: '#64748B' }}>Monitoring system integrity and security status</p>
                    </div>
                    {(user.role === 'Admin' || user.role === 'election officer') && (
                        <Link to="/officer-dashboard" style={{
                            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                            color: 'white',
                            padding: '14px 24px',
                            borderRadius: '14px',
                            fontWeight: '700',
                            fontSize: '14px',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 10px 30px rgba(79, 70, 229, 0.3)',
                            transition: 'all 0.3s ease',
                        }}>
                            <Plus style={{ width: '18px', height: '18px' }} />
                            Create New Poll
                        </Link>
                    )}
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        style={statCardStyle(stat.gradient)}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div>
                                <p style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{stat.label}</p>
                                <p style={{ fontSize: '28px', fontWeight: '800', color: stat.textColor }}>{stat.value}</p>
                            </div>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: 'rgba(255,255,255,0.2)',
                                borderRadius: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <stat.icon style={{ width: '24px', height: '24px', color: 'white' }} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                {/* Active Polls List */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    style={cardStyle}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '44px',
                                height: '44px',
                                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Vote style={{ width: '22px', height: '22px', color: 'white' }} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1E293B' }}>Available Polls</h2>
                                <p style={{ fontSize: '13px', color: '#94A3B8' }}>{polls.length} active elections</p>
                            </div>
                        </div>
                        <Link to="/voter-dashboard" style={{ fontSize: '13px', fontWeight: '600', color: '#4F46E5', textDecoration: 'none' }}>
                            View All →
                        </Link>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} style={{ height: '72px', background: '#F1F5F9', borderRadius: '16px', animation: 'pulse 2s infinite' }} />
                            ))
                        ) : polls.length > 0 ? (
                            polls.slice(0, 4).map((poll, i) => (
                                <motion.div
                                    key={poll.id}
                                    whileHover={{ x: 5 }}
                                    style={{
                                        background: '#F8FAFC',
                                        padding: '16px 20px',
                                        borderRadius: '16px',
                                        border: '1px solid #E2E8F0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            background: poll.sensitivity_level === 'Confidential' ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <Vote style={{ width: '20px', height: '20px', color: 'white' }} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1E293B' }}>{poll.title}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                                                <span style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock style={{ width: '12px', height: '12px' }} />
                                                    Ends {new Date(poll.end_time).toLocaleDateString()}
                                                </span>
                                                <span style={{
                                                    fontSize: '10px',
                                                    fontWeight: '700',
                                                    padding: '3px 8px',
                                                    borderRadius: '6px',
                                                    textTransform: 'uppercase',
                                                    background: poll.sensitivity_level === 'Confidential' ? '#FEE2E2' : '#D1FAE5',
                                                    color: poll.sensitivity_level === 'Confidential' ? '#DC2626' : '#059669',
                                                }}>
                                                    {poll.sensitivity_level}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight style={{ width: '20px', height: '20px', color: '#94A3B8' }} />
                                </motion.div>
                            ))
                        ) : (
                            <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '2px dashed #E2E8F0' }}>
                                <Vote style={{ width: '48px', height: '48px', color: '#CBD5E1', margin: '0 auto 16px' }} />
                                <p style={{ color: '#94A3B8', fontSize: '14px' }}>No active polls currently available for your clearance level.</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Audit Log Peek */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{
                        ...cardStyle,
                        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                        border: 'none',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '44px',
                                height: '44px',
                                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <ShieldAlert style={{ width: '22px', height: '22px', color: 'white' }} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'white' }}>Security Audit</h2>
                                <p style={{ fontSize: '13px', color: '#64748B' }}>Real-time feed</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live</span>
                        </div>
                    </div>

                    <div style={{ fontFamily: 'monospace', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '280px', overflowY: 'auto' }}>
                        <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', borderLeft: '3px solid #10B981' }}>
                            <span style={{ color: '#64748B' }}>[{new Date().toISOString().split('T')[1].split('.')[0]}]</span>
                            <span style={{ color: '#10B981', marginLeft: '8px' }}>SUCCESS</span>
                            <p style={{ color: '#94A3B8', marginTop: '4px' }}>Authentication valid for user '{user.username}'</p>
                        </div>
                        <div style={{ padding: '10px 14px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', borderLeft: '3px solid #3B82F6' }}>
                            <span style={{ color: '#64748B' }}>[{new Date().toISOString().split('T')[1].split('.')[0]}]</span>
                            <span style={{ color: '#3B82F6', marginLeft: '8px' }}>ACCESS</span>
                            <p style={{ color: '#94A3B8', marginTop: '4px' }}>Clearance level check 'CONFIDENTIAL' → PASS</p>
                        </div>
                        <div style={{ padding: '10px 14px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '10px', borderLeft: '3px solid #8B5CF6' }}>
                            <span style={{ color: '#64748B' }}>[{new Date().toISOString().split('T')[1].split('.')[0]}]</span>
                            <span style={{ color: '#8B5CF6', marginLeft: '8px' }}>SYSTEM</span>
                            <p style={{ color: '#94A3B8', marginTop: '4px' }}>Policy Engine updated for RuBAC (Working Hours)</p>
                        </div>
                        <div style={{ padding: '10px 14px', background: 'rgba(100, 116, 139, 0.1)', borderRadius: '10px', borderLeft: '3px solid #64748B' }}>
                            <span style={{ color: '#64748B' }}>[{new Date().toISOString().split('T')[1].split('.')[0]}]</span>
                            <span style={{ color: '#94A3B8', marginLeft: '8px' }}>AUDIT</span>
                            <p style={{ color: '#64748B', marginTop: '4px' }}>Snapshot created for encrypted event logs</p>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <Link to="/auditor-dashboard" style={{
                            display: 'block',
                            width: '100%',
                            padding: '14px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: '#94A3B8',
                            fontSize: '13px',
                            fontWeight: '600',
                            textAlign: 'center',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                        }}>
                            View Full System Audit →
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;
