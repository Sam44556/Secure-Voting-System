import { useRef, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';

function Register() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showOTP, setShowOTP] = useState(false);
    const [userId, setUserId] = useState('');
    const [otp, setOtp] = useState('');

    // Form fields
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [dob, setDob] = useState('');
    const [region, setRegion] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await api.post('/auth/register', {
                username,
                full_name: fullName,
                email,
                password,
                date_of_birth: dob,
                region,
                captchaToken: 'development_token'
            });

            console.log('Registration response:', res.data);
            setUserId(res.data.userId);
            setShowOTP(true);
            toast.success('Check backend console for OTP code!');
        } catch (err) {
            console.error('Registration error:', err);
            toast.error(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/auth/verify-otp', {
                userId,
                otp,
                purpose: 'verification'
            });
            toast.success('Email verified! You can now login.');
            navigate('/login');
        } catch (err) {
            console.error('OTP error:', err);
            toast.error('Invalid OTP code');
        } finally {
            setLoading(false);
        }
    };

    if (showOTP) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #EFF6FF, #E0E7FF)', padding: '1rem' }}>
                <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '2rem', maxWidth: '28rem', width: '100%' }}>
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1F2937', marginBottom: '0.5rem' }}>Verify Your Email</h2>
                        <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Check the backend console for your 6-digit code</p>
                    </div>
                    <form onSubmit={handleVerifyOTP}>
                        <input
                            type="text"
                            maxLength="6"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            style={{ width: '100%', padding: '0.75rem 1rem', border: '2px solid #D1D5DB', borderRadius: '0.5rem', textAlign: 'center', fontSize: '1.5rem', fontFamily: 'monospace', letterSpacing: '0.5em', marginBottom: '1rem' }}
                        />
                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            style={{ width: '100%', background: '#4F46E5', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: '600', border: 'none', cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer', opacity: loading || otp.length !== 6 ? 0.5 : 1 }}
                        >
                            {loading ? 'Verifying...' : 'Verify & Continue'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #EFF6FF, #E0E7FF)', padding: '1rem' }}>
            <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxWidth: '48rem', width: '100%', overflow: 'hidden' }}>
                <div style={{ background: '#4F46E5', padding: '1.5rem', color: 'white', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Create Account</h2>
                    <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>Join the Secure Voting System</p>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>Username *</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                minLength="3"
                                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem' }}
                                placeholder="johndoe"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>Full Name *</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem' }}
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>Email *</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem' }}
                            placeholder="john@example.com"
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>Password *</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength="12"
                            style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem' }}
                            placeholder="Min 12 chars, upper, lower, number, symbol"
                        />
                        <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>12+ characters with uppercase, lowercase, number, and symbol</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>Date of Birth *</label>
                            <input
                                type="date"
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                                required
                                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>Region *</label>
                            <select
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem' }}
                            >
                                <option value="">Select Region</option>
                                <option value="Addis Ababa">Addis Ababa</option>
                                <option value="Oromia">Oromia</option>
                                <option value="Amhara">Amhara</option>
                                <option value="Tigray">Tigray</option>
                                <option value="Sidama">Sidama</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{ width: '100%', background: '#4F46E5', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: '600', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, marginTop: '0.5rem' }}
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <Link to="/login" style={{ fontSize: '0.875rem', color: '#4F46E5', fontWeight: '600', textDecoration: 'none' }}>
                            Already have an account? Sign In
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Register;
