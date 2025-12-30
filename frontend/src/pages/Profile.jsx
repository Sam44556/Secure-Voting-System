import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Calendar, MapPin, ShieldCheck, Shield,
    QrCode, Lock, Unlock, CheckCircle, XCircle, Key
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../services/api';

const Profile = () => {
    const { user } = useAuth();
    const [mfaEnabled, setMfaEnabled] = useState(user?.mfaEnabled || false);
    const [showMFASetup, setShowMFASetup] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [loading, setLoading] = useState(false);

    const enableMFA = async () => {
        setLoading(true);
        try {
            const res = await api.post('/auth/enable-mfa');
            setQrCodeUrl(res.data.qrCodeUrl);
            setSecret(res.data.secret);
            setShowMFASetup(true);
            toast.success('🔐 Scan QR code with your authenticator app!', {
                position: 'top-center'
            });
        } catch (err) {
            toast.error('Failed to enable MFA', {
                position: 'top-center',
                className: 'bg-red-500 text-white'
            });
        } finally {
            setLoading(false);
        }
    };

    const disableMFA = async () => {
        if (!window.confirm('Are you sure you want to disable MFA? This will make your account less secure.')) {
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/disable-mfa');
            setMfaEnabled(false);
            toast.success('MFA disabled', {
                position: 'top-center'
            });
        } catch (err) {
            toast.error('Failed to disable MFA', {
                position: 'top-center',
                className: 'bg-red-500 text-white'
            });
        } finally {
            setLoading(false);
        }
    };

    const completeMFASetup = () => {
        setMfaEnabled(true);
        setShowMFASetup(false);
        toast.success('✅ MFA enabled successfully!', {
            position: 'top-center',
            className: 'bg-green-500 text-white'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Profile Settings</h1>
                    <p className="text-slate-600">Manage your account and security preferences</p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Profile Information Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-2 bg-white rounded-3xl shadow-xl p-8 border border-slate-200/50"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Account Information</h2>
                                <p className="text-sm text-slate-500">Your personal details</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Username */}
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <User className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Username</p>
                                    <p className="text-lg font-bold text-slate-900">{user?.username || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Full Name */}
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <User className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Full Name</p>
                                    <p className="text-lg font-bold text-slate-900">{user?.full_name || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Email</p>
                                    <p className="text-lg font-bold text-slate-900">{user?.email || 'N/A'}</p>
                                </div>
                                {user?.isVerified && (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                )}
                            </div>

                            {/* Role */}
                            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-indigo-600 uppercase">Role</p>
                                    <p className="text-lg font-bold text-indigo-900">{user?.role || 'Pending Approval'}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Security Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-3xl shadow-xl p-6 border border-slate-200/50"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Security</h3>
                                <p className="text-xs text-slate-500">MFA Status</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* MFA Status Badge */}
                            <div className={`p-4 rounded-xl border-2 ${mfaEnabled ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-slate-700">Two-Factor Auth</span>
                                    {mfaEnabled ? (
                                        <Lock className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <Unlock className="w-5 h-5 text-amber-600" />
                                    )}
                                </div>
                                <p className={`text-xs font-bold ${mfaEnabled ? 'text-green-700' : 'text-amber-700'}`}>
                                    {mfaEnabled ? '✓ Protected' : '⚠ Not Enabled'}
                                </p>
                            </div>

                            {/* MFA Toggle Button */}
                            {!mfaEnabled ? (
                                <button
                                    onClick={enableMFA}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-5 h-5" />
                                            Enable MFA
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={disableMFA}
                                    disabled={loading}
                                    className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <XCircle className="w-5 h-5" />
                                            Disable MFA
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Security Tips */}
                            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <p className="text-xs font-semibold text-blue-900 mb-2">💡 Security Tip</p>
                                <p className="text-xs text-blue-700">
                                    Enable MFA to add an extra layer of security to your account. Use Google Authenticator or Authy.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* MFA Setup Modal */}
            <AnimatePresence>
                {showMFASetup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
                        >
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <QrCode className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Setup Two-Factor Authentication</h3>
                                <p className="text-slate-600 text-sm">
                                    Scan this QR code with Google Authenticator, Authy, or any TOTP app
                                </p>
                            </div>

                            {/* QR Code */}
                            <div className="flex justify-center mb-6">
                                <div className="p-6 bg-white rounded-2xl border-4 border-slate-200 shadow-inner">
                                    <QRCodeCanvas value={qrCodeUrl} size={200} />
                                </div>
                            </div>

                            {/* Secret Key */}
                            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Manual Entry Key</p>
                                <div className="flex items-center gap-2">
                                    <Key className="w-4 h-4 text-slate-400" />
                                    <code className="text-sm font-mono text-slate-900 break-all">{secret}</code>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="mb-6 space-y-2">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs font-bold text-indigo-600">1</span>
                                    </div>
                                    <p className="text-sm text-slate-600">Open your authenticator app</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs font-bold text-indigo-600">2</span>
                                    </div>
                                    <p className="text-sm text-slate-600">Scan the QR code or enter the key manually</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs font-bold text-indigo-600">3</span>
                                    </div>
                                    <p className="text-sm text-slate-600">You'll be prompted for a code on your next login</p>
                                </div>
                            </div>

                            <button
                                onClick={completeMFASetup}
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Complete Setup
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Profile;
