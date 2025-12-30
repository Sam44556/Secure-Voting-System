import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showMFA, setShowMFA] = useState(false);
    const [userId, setUserId] = useState(null);
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await api.post('/auth/login', { username, password });

            if (res.data.requiresMFA) {
                setShowMFA(true);
                setUserId(res.data.userId);
                toast.info('Check your email for MFA code');
            } else {
                console.log('Login response:', res.data);
                console.log('User role:', res.data.user?.role);
                console.log('User roles:', res.data.user?.roles);
                login(res.data);
                
                // Check if user has a role assigned
                const userRole = res.data.user?.role;
                console.log('User role after login:', userRole);
                if (!userRole) {
                    toast.info('Your account is pending role assignment.');
                    navigate('/pending-approval');
                } else {
                    toast.success('Welcome back!');
                    navigate('/');
                }
            }
        } catch (err) {
            console.error('Login error:', err);
            toast.error(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const verifyMFA = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await api.post('/auth/mfa-verify', { userId, otp });
            login(res.data);
            setShowMFA(false);
            
            // Check if user has a role assigned
            const userRole = res.data.user?.role;
            if (!userRole) {
                toast.info('Your account is pending role assignment.');
                navigate('/pending-approval');
            } else {
                toast.success('MFA verified! Welcome back.');
                navigate('/');
            }
        } catch (err) {
            console.error('MFA error:', err);
            toast.error('Invalid MFA code');
        } finally {
            setLoading(false);
        }
    };

    if (showMFA) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #EFF6FF, #E0E7FF)', padding: '1rem' }}>
                <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '2rem', maxWidth: '28rem', width: '100%' }}>
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1F2937', marginBottom: '0.5rem' }}>Two-Factor Authentication</h2>
                        <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Check the backend console for your 6-digit code</p>
                    </div>
                    <form onSubmit={verifyMFA}>
                        <input
                            type="text"
                            maxLength="6"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            autoFocus
                            style={{ width: '100%', padding: '0.75rem 1rem', border: '2px solid #D1D5DB', borderRadius: '0.5rem', textAlign: 'center', fontSize: '1.5rem', fontFamily: 'monospace', letterSpacing: '0.5em', marginBottom: '1rem' }}
                        />
                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            style={{ width: '100%', background: '#4F46E5', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: '600', border: 'none', cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer', opacity: loading || otp.length !== 6 ? 0.5 : 1 }}
                        >
                            {loading ? 'Verifying...' : 'Verify & Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #EFF6FF, #E0E7FF)', padding: '1rem' }}>
            <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxWidth: '28rem', width: '100%', overflow: 'hidden' }}>
                <div style={{ background: '#4F46E5', padding: '1.5rem', color: 'white', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Welcome Back</h2>
                    <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>Secure Access Portal</p>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem' }}
                            placeholder="Enter your username"
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem' }}
                            placeholder="Enter your password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{ width: '100%', background: '#4F46E5', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: '600', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
                    >
                        {loading ? 'Signing In...' : 'Sign In Securely'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <Link to="/register" style={{ fontSize: '0.875rem', color: '#4F46E5', fontWeight: '600', textDecoration: 'none' }}>
                            Don't have an account? Create one
                        </Link>
                    </div>
                </form>

                <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.75rem', color: '#6B7280' }}>
                    <span>🔒 AES-256 Encrypted</span>
                    <span>🛡️ MFA Protected</span>
                </div>
            </div>
        </div>
    );
};

export default Login;
