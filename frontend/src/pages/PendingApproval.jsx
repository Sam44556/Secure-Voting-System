import React from 'react';
import { Clock, ShieldCheck, LogOut, Mail, CheckCircle, UserCog, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const PendingApproval = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Soft background shapes */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-200/50 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-200/40 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative z-10 max-w-3xl w-full"
            >
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Status card */}
                    <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/70 border border-slate-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-6 text-white">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <Clock className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-white/80 font-semibold">Pending Review</p>
                                    <h1 className="text-2xl font-bold leading-tight">Awaiting Role Assignment</h1>
                                    <p className="text-sm text-white/80">Thanks for verifying your email. An admin will grant access soon.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            {/* User info */}
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg shadow-blue-200/50">
                                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <p className="text-slate-900 font-semibold text-lg">{user?.username || 'User'}</p>
                                    <p className="text-slate-500 text-sm">{user?.email || 'Registered user'}</p>
                                </div>
                            </div>

                            {/* Steps */}
                            <div className="space-y-4">
                                {[{
                                    title: 'Account Created',
                                    desc: 'Registration completed',
                                    icon: <CheckCircle className="w-5 h-5 text-emerald-500" />, status: 'DONE', badge: 'text-emerald-600'
                                }, {
                                    title: 'Email Verified',
                                    desc: 'OTP verification passed',
                                    icon: <Mail className="w-5 h-5 text-emerald-500" />, status: 'DONE', badge: 'text-emerald-600'
                                }, {
                                    title: 'Role Assignment',
                                    desc: 'Pending admin approval',
                                    icon: <UserCog className="w-5 h-5 text-amber-500" />, status: 'PENDING', badge: 'text-amber-600 animate-pulse'
                                }, {
                                    title: 'Full Access',
                                    desc: 'Dashboard & features',
                                    icon: <ShieldCheck className="w-5 h-5 text-slate-400" />, status: 'WAITING', badge: 'text-slate-400'
                                }].map((step, idx) => (
                                    <div key={idx} className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                            {step.icon}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-slate-900 font-medium">{step.title}</p>
                                            <p className="text-slate-500 text-xs">{step.desc}</p>
                                        </div>
                                        <span className={`text-xs font-bold ${step.badge}`}>{step.status}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Info box */}
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
                                <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0" />
                                <div>
                                    <p className="text-slate-900 text-sm font-semibold mb-1">Why approval?</p>
                                    <p className="text-slate-500 text-xs leading-relaxed">RBAC policy requires manual vetting to protect the voting process. This is a security feature, not a bug.</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-8 pt-4 flex flex-col gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-300/50 flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Check My Status
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full py-4 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    </div>

                    {/* Side highlight card */}
                    <div className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl shadow-blue-100 border border-slate-100 p-8 flex flex-col justify-between">
                        <div className="space-y-4">
                            <p className="text-xs uppercase tracking-[0.25em] text-blue-500 font-semibold">Security Status</p>
                            <h3 className="text-2xl font-bold text-slate-900 leading-tight">Your account is safe and under review</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">We log every action for auditing. Approvals are typically processed in under 24 hours.</p>
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 text-sm text-slate-700">
                                <p className="font-semibold text-blue-700 mb-1">What happens next?</p>
                                <ul className="list-disc list-inside space-y-1 text-slate-600">
                                    <li>Admin reviews your profile</li>
                                    <li>Role is assigned (Voter, Officer, etc.)</li>
                                    <li>You gain full dashboard access</li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-6 text-xs text-slate-400">
                            ⏱️ Typically approval takes less than 24 hours
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PendingApproval;
