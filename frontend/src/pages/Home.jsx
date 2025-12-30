import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Vote, BarChart3, Lock, Users, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
    const containerStyle = {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #EFF6FF 0%, #E0E7FF 50%, #F5F3FF 100%)',
    };

    const navStyle = {
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
    };

    const primaryBtnStyle = {
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        color: 'white',
        padding: '16px 32px',
        borderRadius: '16px',
        fontWeight: '700',
        fontSize: '16px',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 10px 40px rgba(79, 70, 229, 0.3)',
        transition: 'all 0.3s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
    };

    const cardStyle = {
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
        padding: '32px',
        transition: 'all 0.3s ease',
    };

    const featureCardStyle = {
        ...cardStyle,
        textAlign: 'center',
    };

    const features = [
        { icon: Lock, label: 'MAC/DAC', desc: 'Mandatory & Discretionary Access', color: '#10B981' },
        { icon: Vote, label: 'RBAC', desc: 'Role-Based Access Control', color: '#3B82F6' },
        { icon: Shield, label: 'ABAC', desc: 'Attribute-Based Access', color: '#8B5CF6' },
        { icon: BarChart3, label: 'RuBAC', desc: 'Rule-Based Access Control', color: '#F59E0B' }
    ];

    const securityFeatures = [
        { 
            icon: Lock, 
            title: 'Multi-Layer Access Control', 
            desc: 'Implementing MAC, DAC, RBAC, RuBAC, and ABAC for granular security that adapts to every scenario.',
            gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'
        },
        { 
            icon: Shield, 
            title: 'Advanced Verification', 
            desc: 'Email verification, MFA with authenticator apps, and real-time threat detection for maximum security.',
            gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)'
        },
        { 
            icon: BarChart3, 
            title: 'Complete Audit Trails', 
            desc: 'Full transparency with encrypted audit logs, anomaly detection, and comprehensive activity monitoring.',
            gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
        }
    ];

    return (
        <div style={containerStyle}>
            {/* Decorative Elements */}
            <div style={{
                position: 'fixed',
                top: '-200px',
                right: '-200px',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(79, 70, 229, 0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'fixed',
                bottom: '-200px',
                left: '-200px',
                width: '500px',
                height: '500px',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
            }} />

            {/* Navigation */}
            <header style={navStyle}>
                <nav style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                    >
                        <div style={{
                            width: '48px',
                            height: '48px',
                            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)',
                        }}>
                            <Shield style={{ width: '28px', height: '28px', color: 'white' }} />
                        </div>
                        <span style={{ fontSize: '24px', fontWeight: '800', background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            SecureVote
                        </span>
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ display: 'flex', gap: '16px', alignItems: 'center' }}
                    >
                        <Link to="/login" style={{ color: '#4B5563', fontWeight: '600', textDecoration: 'none', padding: '12px 20px', borderRadius: '12px', transition: 'all 0.3s' }}>
                            Sign In
                        </Link>
                        <Link to="/register" style={{ ...primaryBtnStyle, padding: '12px 24px', fontSize: '14px' }}>
                            Get Started <ArrowRight style={{ width: '16px', height: '16px' }} />
                        </Link>
                    </motion.div>
                </nav>
            </header>

            <main>
                {/* Hero Section */}
                <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 24px 120px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '80px', alignItems: 'center' }}>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)', padding: '8px 16px', borderRadius: '100px', marginBottom: '24px', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
                                <Sparkles style={{ width: '16px', height: '16px', color: '#4F46E5' }} />
                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#4F46E5' }}>Next-Gen Voting Platform</span>
                            </div>
                            <h1 style={{ fontSize: '56px', fontWeight: '800', color: '#1E293B', lineHeight: '1.1', marginBottom: '24px' }}>
                                The Future of{' '}
                                <span style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    Secure Democracy
                                </span>
                            </h1>
                            <p style={{ fontSize: '18px', color: '#64748B', lineHeight: '1.7', marginBottom: '40px', maxWidth: '500px' }}>
                                Experience a next-generation digital voting system built on advanced security principles.
                                Transparent, tamper-proof, and accessible to everyone.
                            </p>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <Link to="/register" style={{ ...primaryBtnStyle, textDecoration: 'none' }}>
                                    Start Voting <ArrowRight style={{ width: '20px', height: '20px' }} />
                                </Link>
                                <Link to="/login" style={{ 
                                    background: 'white', 
                                    color: '#4F46E5', 
                                    padding: '16px 32px', 
                                    borderRadius: '16px', 
                                    fontWeight: '700', 
                                    border: '2px solid #E0E7FF',
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.3s ease',
                                }}>
                                    <Users style={{ width: '20px', height: '20px' }} />
                                    Sign In
                                </Link>
                            </div>

                            {/* Trust Badges */}
                            <div style={{ marginTop: '48px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                                {['256-bit Encryption', 'MFA Protected', 'Audit Logging'].map((badge, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <CheckCircle style={{ width: '16px', height: '16px', color: '#10B981' }} />
                                        <span style={{ fontSize: '14px', color: '#64748B', fontWeight: '500' }}>{badge}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(139, 92, 246, 0.1) 100%)',
                                borderRadius: '32px',
                                padding: '40px',
                                border: '1px solid rgba(255, 255, 255, 0.8)',
                            }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    {features.map((item, i) => (
                                        <motion.div 
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 + i * 0.1 }}
                                            whileHover={{ scale: 1.05, y: -5 }}
                                            style={{
                                                background: 'white',
                                                padding: '28px 20px',
                                                borderRadius: '20px',
                                                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
                                                border: '1px solid rgba(255, 255, 255, 0.9)',
                                                textAlign: 'center',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <div style={{
                                                width: '56px',
                                                height: '56px',
                                                background: `${item.color}15`,
                                                borderRadius: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                margin: '0 auto 16px',
                                            }}>
                                                <item.icon style={{ width: '28px', height: '28px', color: item.color }} />
                                            </div>
                                            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', marginBottom: '4px' }}>{item.label}</h3>
                                            <p style={{ fontSize: '12px', color: '#94A3B8' }}>{item.desc}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Features Section */}
                <section style={{ background: 'white', padding: '120px 24px', borderTop: '1px solid #E5E7EB' }}>
                    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            style={{ textAlign: 'center', marginBottom: '80px' }}
                        >
                            <span style={{ 
                                display: 'inline-block',
                                background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)', 
                                padding: '8px 20px', 
                                borderRadius: '100px', 
                                fontSize: '14px', 
                                fontWeight: '600', 
                                color: '#4F46E5',
                                marginBottom: '16px',
                            }}>
                                Security Features
                            </span>
                            <h2 style={{ fontSize: '42px', fontWeight: '800', color: '#1E293B', marginBottom: '16px' }}>
                                Enterprise-Grade Protection
                            </h2>
                            <p style={{ fontSize: '18px', color: '#64748B', maxWidth: '600px', margin: '0 auto' }}>
                                Multi-layered security architecture designed to protect every vote and ensure complete transparency.
                            </p>
                        </motion.div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
                            {securityFeatures.map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    whileHover={{ y: -10 }}
                                    style={featureCardStyle}
                                >
                                    <div style={{
                                        width: '72px',
                                        height: '72px',
                                        background: feature.gradient,
                                        borderRadius: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 24px',
                                        boxShadow: '0 10px 30px rgba(79, 70, 229, 0.2)',
                                    }}>
                                        <feature.icon style={{ width: '36px', height: '36px', color: 'white' }} />
                                    </div>
                                    <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#1E293B', marginBottom: '12px' }}>{feature.title}</h3>
                                    <p style={{ fontSize: '16px', color: '#64748B', lineHeight: '1.7' }}>{feature.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section style={{ padding: '120px 24px', background: 'linear-gradient(135deg, #EFF6FF 0%, #E0E7FF 100%)' }}>
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}
                    >
                        <h2 style={{ fontSize: '42px', fontWeight: '800', color: '#1E293B', marginBottom: '24px' }}>
                            Ready to Experience Secure Voting?
                        </h2>
                        <p style={{ fontSize: '18px', color: '#64748B', marginBottom: '40px' }}>
                            Join our platform and be part of the future of digital democracy. Your vote matters, and we keep it safe.
                        </p>
                        <Link to="/register" style={{ ...primaryBtnStyle, textDecoration: 'none', fontSize: '18px', padding: '20px 48px' }}>
                            Create Your Account <ArrowRight style={{ width: '24px', height: '24px' }} />
                        </Link>
                    </motion.div>
                </section>
            </main>

            <footer style={{ background: '#0F172A', padding: '48px 24px' }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Shield style={{ width: '24px', height: '24px', color: 'white' }} />
                        </div>
                        <span style={{ fontSize: '20px', fontWeight: '700', color: 'white' }}>SecureVote</span>
                    </div>
                    <p style={{ color: '#64748B', fontSize: '14px' }}>© 2025 Secure Democracy System. Computer System Security Project.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
