import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Clock, Shield, BarChart2, CheckCircle, AlertTriangle, ArrowLeft, Vote, Users, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const ElectionDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [poll, setPoll] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [voteSelected, setVoteSelected] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [hasVoted, setHasVoted] = useState(false);
    const [totalVotes, setTotalVotes] = useState(0);

    const cardStyle = {
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '28px',
        border: '1px solid rgba(255, 255, 255, 0.9)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.08)',
        padding: '40px',
        position: 'relative',
        overflow: 'hidden',
    };

    useEffect(() => {
        const fetchElectionData = async () => {
            try {
                const electionRes = await api.get(`/elections/${id}`);
                setPoll(electionRes.data);

                // Check if user already voted
                try {
                    const voteCheck = await api.get(`/vote/${id}/check`);
                    setHasVoted(voteCheck.data.hasVoted);
                } catch (e) {
                    console.log('Could not check vote status');
                }

                // Fetch results if election ended or user is admin/officer
                const now = new Date();
                const endTime = new Date(electionRes.data.end_time);
                const userRoles = user?.roles || [user?.role];
                const isAdminOrOfficer = userRoles?.some(r => 
                    ['admin', 'election officer'].includes((r || '').toLowerCase())
                );
                
                if (now > endTime || isAdminOrOfficer) {
                    try {
                        const resultsRes = await api.get(`/vote/${id}/results`);
                        setResults(resultsRes.data.results || []);
                        setTotalVotes(resultsRes.data.totalVotes || 0);
                    } catch (e) {
                        console.log('Results not available yet');
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchElectionData();
    }, [id, user]);

    const handleVote = async () => {
        if (!voteSelected) {
            setError('Please select an option before voting');
            return;
        }
        try {
            await api.post(`/vote/${id}`, { optionId: voteSelected });
            setSuccess('Your vote has been securely recorded!');
            setError('');
            setHasVoted(true);
        } catch (error) {
            setError(error.response?.data?.error || 'Error casting vote');
        }
    };

    const handlePublish = async () => {
        try {
            await api.put(`/elections/${id}/publish`);
            window.location.reload();
        } catch (error) {
            alert('Error publishing results');
        }
    };

    if (loading) return (
        <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', border: '4px solid #E0E7FF', borderTop: '4px solid #4F46E5', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ color: '#64748B', fontWeight: '600' }}>Decrypting election data...</p>
            </div>
        </div>
    );
    
    if (!poll) return (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <Lock style={{ width: '64px', height: '64px', color: '#CBD5E1', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1E293B', marginBottom: '8px' }}>Access Denied</h2>
            <p style={{ color: '#64748B' }}>Election not found or you don't have permission to view it.</p>
        </div>
    );

    const isLive = new Date() >= new Date(poll.start_time) && new Date() <= new Date(poll.end_time);
    const isPast = new Date() > new Date(poll.end_time);

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '48px' }}>
            <motion.button 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => navigate(-1)} 
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#64748B',
                    fontWeight: '600',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: '24px',
                    padding: '8px 0',
                }}
            >
                <ArrowLeft style={{ width: '18px', height: '18px' }} /> Back to Dashboard
            </motion.button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={cardStyle}
            >
                {/* Background Shield */}
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.03 }}>
                    <Shield style={{ width: '200px', height: '200px', color: poll.sensitivity_level === 'Confidential' ? '#EF4444' : '#4F46E5' }} />
                </div>

                <div style={{ position: 'relative', zIndex: 10 }}>
                    {/* Status & ID Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <span style={{
                            padding: '6px 14px',
                            borderRadius: '100px',
                            fontSize: '12px',
                            fontWeight: '700',
                            background: isLive ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : isPast ? '#F1F5F9' : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                            color: isLive ? 'white' : isPast ? '#64748B' : 'white',
                        }}>
                            {isLive ? '● LIVE' : isPast ? 'CONCLUDED' : 'UPCOMING'}
                        </span>
                        <span style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#94A3B8',
                            background: '#F8FAFC',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                        }}>
                            ID: {poll.id?.slice(0, 8)}
                        </span>
                    </div>

                    {/* Title & Description */}
                    <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#1E293B', marginBottom: '16px', lineHeight: '1.2' }}>{poll.title}</h1>
                    <p style={{ fontSize: '17px', color: '#64748B', lineHeight: '1.7', marginBottom: '32px', maxWidth: '700px' }}>{poll.description}</p>

                    {/* Info Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
                        <div style={{ padding: '20px', background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Clock style={{ width: '22px', height: '22px', color: 'white' }} />
                            </div>
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: '600', color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Voting Window</p>
                                <p style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>
                                    {new Date(poll.start_time).toLocaleDateString()} - {new Date(poll.end_time).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div style={{ 
                            padding: '20px', 
                            background: poll.sensitivity_level === 'public' 
                                ? 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)' 
                                : poll.sensitivity_level === 'confidential' 
                                    ? 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)'
                                    : 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', 
                            borderRadius: '16px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '14px' 
                        }}>
                            <div style={{ 
                                width: '44px', 
                                height: '44px', 
                                background: poll.sensitivity_level === 'public' 
                                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' 
                                    : poll.sensitivity_level === 'confidential' 
                                        ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                                        : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', 
                                borderRadius: '12px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center' 
                            }}>
                                <Shield style={{ width: '22px', height: '22px', color: 'white' }} />
                            </div>
                            <div>
                                <p style={{ 
                                    fontSize: '11px', 
                                    fontWeight: '600', 
                                    color: poll.sensitivity_level === 'public' 
                                        ? '#059669' 
                                        : poll.sensitivity_level === 'confidential' 
                                            ? '#DC2626'
                                            : '#B45309', 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.05em' 
                                }}>MAC Classification</p>
                                <p style={{ 
                                    fontSize: '14px', 
                                    fontWeight: '700', 
                                    color: '#1E293B',
                                    textTransform: 'uppercase'
                                }}>
                                    {poll.sensitivity_level || 'INTERNAL'}
                                    {poll.sensitivity_level === 'public' && ' ✓'}
                                    {poll.sensitivity_level === 'confidential' && ' 🔒'}
                                    {(!poll.sensitivity_level || poll.sensitivity_level === 'internal') && ' 🔐'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Voting Section (Only for Voters, when Live, and hasn't voted) */}
                    {user?.roles?.some(r => r?.toLowerCase() === 'voter') && isLive && !success && !hasVoted && (
                        <div style={{
                            marginTop: '48px',
                            padding: '32px',
                            background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                            borderRadius: '24px',
                            border: '1px solid rgba(79, 70, 229, 0.1)',
                        }}>
                            <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#1E293B', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Vote style={{ width: '24px', height: '24px', color: '#4F46E5' }} />
                                Cast Your Secure Vote
                            </h3>
                            {error && (
                                <div style={{ marginBottom: '16px', padding: '14px 18px', background: '#FEE2E2', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', color: '#DC2626', fontWeight: '600', fontSize: '14px' }}>
                                    <AlertTriangle style={{ width: '18px', height: '18px' }} /> {error}
                                </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                {poll.options?.map(opt => (
                                    <label key={opt.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        padding: '18px 20px',
                                        borderRadius: '14px',
                                        border: voteSelected === String(opt.id) ? '2px solid #4F46E5' : '2px solid transparent',
                                        background: voteSelected === String(opt.id) ? 'white' : 'rgba(255,255,255,0.7)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: voteSelected === String(opt.id) ? '0 4px 20px rgba(79, 70, 229, 0.15)' : 'none',
                                    }}>
                                        <input
                                            type="radio" name="vote" value={opt.id}
                                            onChange={e => setVoteSelected(e.target.value)}
                                            style={{ width: '20px', height: '20px', accentColor: '#4F46E5' }}
                                        />
                                        <span style={{ fontWeight: '600', color: '#1E293B' }}>{opt.option_text}</span>
                                    </label>
                                ))}
                            </div>
                            <button
                                onClick={handleVote}
                                disabled={!voteSelected}
                                style={{
                                    width: '100%',
                                    padding: '18px',
                                    borderRadius: '16px',
                                    border: 'none',
                                    fontWeight: '700',
                                    fontSize: '16px',
                                    cursor: voteSelected ? 'pointer' : 'not-allowed',
                                    background: voteSelected ? 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' : '#CBD5E1',
                                    color: 'white',
                                    boxShadow: voteSelected ? '0 10px 30px rgba(79, 70, 229, 0.3)' : 'none',
                                    transition: 'all 0.2s',
                                }}
                            >
                                Submit Secure Vote
                            </button>
                        </div>
                    )}

                    {/* Already Voted Message */}
                    {hasVoted && !success && (
                        <div style={{
                            marginTop: '48px',
                            padding: '48px',
                            background: '#F8FAFC',
                            borderRadius: '24px',
                            textAlign: 'center',
                            border: '1px solid #E2E8F0',
                        }}>
                            <CheckCircle style={{ width: '56px', height: '56px', color: '#94A3B8', margin: '0 auto 16px' }} />
                            <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>You have already voted</h3>
                            <p style={{ color: '#64748B' }}>Your vote was recorded securely. Results will be available after the election ends.</p>
                        </div>
                    )}

                    {success && (
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{
                                marginTop: '48px',
                                padding: '56px',
                                background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
                                borderRadius: '24px',
                                textAlign: 'center',
                            }}
                        >
                            <CheckCircle style={{ width: '72px', height: '72px', color: '#059669', margin: '0 auto 20px' }} />
                            <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#065F46', marginBottom: '12px' }}>Success!</h3>
                            <p style={{ fontSize: '17px', color: '#047857' }}>{success}</p>
                        </motion.div>
                    )}

                    {/* Results Section - Only for Admin/Officer during live, or everyone after election ends */}
                    {/* Voters can ONLY see results after election ends AND results are published */}
                    {(
                        // Admin/Officer can always see results (live or past)
                        user?.roles?.some(r => ['admin', 'election officer'].includes((r || '').toLowerCase())) ||
                        // Voters can only see results if election ended AND results published
                        (isPast && poll.results_published)
                    ) && (
                        <div style={{ marginTop: '48px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                                <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <BarChart2 style={{ width: '20px', height: '20px', color: 'white' }} />
                                    </div>
                                    {isPast ? 'Final Results' : 'Live Results (Admin/Officer Only)'}
                                </h3>
                                <span style={{ fontSize: '14px', fontWeight: '700', color: '#64748B', background: '#F1F5F9', padding: '8px 16px', borderRadius: '10px' }}>
                                    <Users style={{ width: '16px', height: '16px', display: 'inline', marginRight: '6px' }} />
                                    {totalVotes} Total Votes
                                </span>
                            </div>

                            {/* MAC Access Check - Show results only if published OR user is admin/officer */}
                            {(!poll.results_published && !user?.roles?.some(r => ['admin', 'election officer'].includes((r || '').toLowerCase()))) ? (
                                <div style={{
                                    padding: '40px',
                                    background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                                    borderRadius: '20px',
                                    textAlign: 'center',
                                    border: '2px solid #F59E0B',
                                }}>
                                    <Lock style={{ width: '48px', height: '48px', color: '#D97706', margin: '0 auto 16px' }} />
                                    <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#92400E', marginBottom: '8px' }}>
                                        MAC Access Denied
                                    </h4>
                                    <p style={{ color: '#B45309', fontWeight: '500' }}>
                                        Results are classified as <strong>INTERNAL</strong>. 
                                        Results will become PUBLIC when the election officer publishes them.
                                    </p>
                                    <div style={{ 
                                        marginTop: '16px', 
                                        padding: '10px 16px', 
                                        background: 'rgba(255,255,255,0.7)', 
                                        borderRadius: '10px',
                                        display: 'inline-block'
                                    }}>
                                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#78350F' }}>
                                            🔐 Sensitivity Level: {poll.sensitivity_level?.toUpperCase() || 'INTERNAL'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {results.length === 0 ? (
                                        <p style={{ color: '#94A3B8', fontStyle: 'italic', padding: '24px', textAlign: 'center', background: '#F8FAFC', borderRadius: '16px' }}>No votes recorded yet.</p>
                                    ) : (
                                        results.map((res, idx) => {
                                            const percentage = totalVotes > 0 ? Math.round((res.vote_count / totalVotes) * 100) : 0;
                                            return (
                                                <div key={res.option_text} style={{ position: 'relative' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 4px' }}>
                                                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>
                                                            {idx === 0 && res.vote_count > 0 && '🏆 '}{res.option_text}
                                                        </span>
                                                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#4F46E5' }}>{res.vote_count} votes ({percentage}%)</span>
                                                    </div>
                                                    <div style={{ height: '16px', background: '#E2E8F0', borderRadius: '100px', overflow: 'hidden' }}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${percentage}%` }}
                                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                                            style={{
                                                                height: '100%',
                                                                background: idx === 0 ? 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' : 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                                                                borderRadius: '100px',
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}

                            {/* Publish Button for Officers/Admins when election ended but not published */}
                            {isPast && !poll.results_published && user?.roles?.some(r => ['admin', 'election officer'].includes((r || '').toLowerCase())) && (
                                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                                    <button
                                        onClick={handlePublish}
                                        style={{
                                            padding: '16px 32px',
                                            borderRadius: '14px',
                                            border: 'none',
                                            fontWeight: '700',
                                            fontSize: '15px',
                                            cursor: 'pointer',
                                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                            color: 'white',
                                            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                        }}
                                    >
                                        <Shield style={{ width: '18px', height: '18px' }} />
                                        Publish Results (MAC: INTERNAL → PUBLIC)
                                    </button>
                                    <p style={{ marginTop: '12px', fontSize: '13px', color: '#64748B' }}>
                                        This will change the classification from INTERNAL to PUBLIC, allowing all users to view results.
                                    </p>
                                </div>
                            )}

                            {/* Show "Results Published" badge if already published */}
                            {poll.results_published && (
                                <div style={{ 
                                    marginTop: '24px', 
                                    padding: '16px', 
                                    background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)', 
                                    borderRadius: '14px',
                                    textAlign: 'center',
                                    border: '1px solid #10B981'
                                }}>
                                    <CheckCircle style={{ width: '24px', height: '24px', color: '#059669', display: 'inline', marginRight: '10px' }} />
                                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#065F46' }}>
                                        Results Published — MAC Classification: PUBLIC ✓
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ElectionDetails;
