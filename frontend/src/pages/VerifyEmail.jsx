import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

function VerifyEmail() {
    const { token } = useParams();

    useEffect(() => {
        api.get(`/auth/verify/${token}`)
            .then(() => toast.success('Email verified! You can now log in.'))
            .catch(() => toast.error('Invalid or expired token'));
    }, [token]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center bg-white p-10 rounded-3xl shadow-xl border border-slate-100 max-w-sm w-full">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Verification Process</h2>
                <p className="text-slate-500 mb-8">Attempting to verify your secure access token...</p>
                <div className="flex justify-center mb-8">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <Link to="/login" className="text-blue-600 font-bold hover:underline">Proceed to Login</Link>
            </motion.div>
        </div>
    );
}

export default VerifyEmail;
