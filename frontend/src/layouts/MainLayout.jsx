import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, LogOut, Shield, User as UserIcon, Home, Settings, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const MainLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const containerStyle = {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #EFF6FF 0%, #E0E7FF 50%, #F5F3FF 100%)',
        display: 'flex',
        flexDirection: 'column',
    };

    const navStyle = {
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)',
    };

    const logoContainerStyle = {
        width: '48px',
        height: '48px',
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(79, 70, 229, 0.3)',
    };

    const navLinkStyle = (isActive) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        color: isActive ? '#4F46E5' : '#64748B',
        background: isActive ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
    });

    const userBadgeStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(139, 92, 246, 0.08) 100%)',
        padding: '8px 16px 8px 8px',
        borderRadius: '20px',
        border: '1px solid rgba(79, 70, 229, 0.1)',
    };

    const avatarStyle = {
        width: '36px',
        height: '36px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '14px',
        fontWeight: '700',
        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
    };

    const logoutBtnStyle = {
        width: '42px',
        height: '42px',
        borderRadius: '12px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94A3B8',
        transition: 'all 0.2s ease',
    };

    const footerStyle = {
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.8)',
        padding: '24px',
    };

    return (
        <div style={containerStyle}>
            {/* Decorative Elements */}
            <div style={{
                position: 'fixed',
                top: '-150px',
                right: '-150px',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(79, 70, 229, 0.08) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'fixed',
                bottom: '-150px',
                left: '-150px',
                width: '350px',
                height: '350px',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
            }} />

            {/* Navigation */}
            <nav style={navStyle}>
                <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px' }}>
                        {/* Logo */}
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '14px' }}
                        >
                            <div style={logoContainerStyle}>
                                <Shield style={{ width: '26px', height: '26px', color: 'white' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ 
                                    fontSize: '22px', 
                                    fontWeight: '800', 
                                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', 
                                    WebkitBackgroundClip: 'text', 
                                    WebkitTextFillColor: 'transparent' 
                                }}>
                                    SecureVote
                                </span>
                                <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                    AASTU Security Hub
                                </span>
                            </div>
                        </motion.div>

                        {/* Navigation Links & User */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            {user && (
                                <>
                                    <Link to="/" style={navLinkStyle(location.pathname === '/')}>
                                        <Home style={{ width: '18px', height: '18px' }} />
                                        Home
                                    </Link>

                                    <Link to="/dashboard" style={navLinkStyle(location.pathname === '/dashboard')}>
                                        <LayoutDashboard style={{ width: '18px', height: '18px' }} />
                                        Dashboard
                                    </Link>

                                    <Link to="/profile" style={navLinkStyle(location.pathname === '/profile')}>
                                        <UserIcon style={{ width: '18px', height: '18px' }} />
                                        Profile
                                    </Link>

                                    <div style={{ width: '1px', height: '32px', background: '#E5E7EB', margin: '0 12px' }} />

                                    <div style={userBadgeStyle}>
                                        <div style={avatarStyle}>
                                            {user.username ? user.username[0].toUpperCase() : 'U'}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>
                                                {user.username || user.email}
                                            </span>
                                            <span style={{ 
                                                fontSize: '10px', 
                                                fontWeight: '600', 
                                                color: '#4F46E5',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                            }}>
                                                {user.role || 'Pending Approval'}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleLogout}
                                        style={logoutBtnStyle}
                                        onMouseEnter={(e) => {
                                            e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                                            e.target.style.color = '#EF4444';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.background = 'transparent';
                                            e.target.style.color = '#94A3B8';
                                        }}
                                        title="Logout"
                                    >
                                        <LogOut style={{ width: '20px', height: '20px' }} />
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main style={{ 
                flex: 1, 
                maxWidth: '1280px', 
                margin: '0 auto', 
                padding: '40px 24px', 
                width: '100%',
                position: 'relative',
                zIndex: 1,
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {children}
                </motion.div>
            </main>

            {/* Footer */}
            <footer style={footerStyle}>
                <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{
                            width: '28px',
                            height: '28px',
                            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Shield style={{ width: '16px', height: '16px', color: 'white' }} />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#4F46E5' }}>SecureVote</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>
                        © 2025 Secure Digital Voting System - Computer System Security Platform
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
