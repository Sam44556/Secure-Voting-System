import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { format, isAfter, isBefore } from 'date-fns';
import { motion } from 'framer-motion';
import { Vote, Clock, Calendar, MapPin, Users, ChevronRight, CheckCircle2, AlertCircle, Timer } from 'lucide-react';

const VoterDashboard = () => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/elections').then(res => {
      setElections(res.data);
    }).catch(err => {
      console.error('Error loading elections:', err);
      toast.error('Failed to load elections');
    }).finally(() => setLoading(false));
  }, []);

  const getStatus = (election) => {
    const now = new Date();
    const startTime = new Date(election.start_time);
    const endTime = new Date(election.end_time);
    
    if (now > endTime) {
      return { text: 'Closed', color: 'bg-slate-100 text-slate-600', dotColor: 'bg-slate-400' };
    }
    if (now < startTime) {
      return { text: 'Upcoming', color: 'bg-amber-100 text-amber-700', dotColor: 'bg-amber-500' };
    }
    return { text: 'Active Now', color: 'bg-emerald-100 text-emerald-700', dotColor: 'bg-emerald-500 animate-pulse' };
  };

  const activeElections = elections.filter(e => {
    const now = new Date();
    return now >= new Date(e.start_time) && now <= new Date(e.end_time);
  });

  const upcomingElections = elections.filter(e => new Date() < new Date(e.start_time));
  const closedElections = elections.filter(e => new Date() > new Date(e.end_time));

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-200 mb-6"
        >
          <Vote className="w-6 h-6" />
          <span className="font-bold">Voter Dashboard</span>
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
          Your <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Voting Portal</span>
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Participate in secure, transparent elections. Your vote matters and is protected by advanced security measures.
        </p>
      </header>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { label: 'Active Elections', value: activeElections.length, icon: Timer, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Upcoming', value: upcomingElections.length, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Completed', value: closedElections.length, icon: CheckCircle2, color: 'text-slate-600', bg: 'bg-slate-50' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl shadow-slate-200/50"
          >
            <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Active Elections - Highlighted */}
      {activeElections.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            <h2 className="text-2xl font-bold text-slate-900">Vote Now</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {activeElections.map((election, i) => (
              <motion.div
                key={election.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="group bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-1 shadow-2xl shadow-indigo-200 hover:shadow-indigo-300 transition-all"
              >
                <div className="bg-white rounded-[22px] p-6 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{election.title}</h3>
                      <p className="text-slate-500 text-sm line-clamp-2">{election.description || 'No description available'}</p>
                    </div>
                    <span className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      LIVE
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Ends {format(new Date(election.end_time), 'MMM d, h:mm a')}
                    </span>
                    {election.region && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {election.region}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => navigate(`/election/${election.id}`)}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 group-hover:shadow-xl"
                  >
                    Cast Your Vote
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* All Elections */}
      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">All Elections</h2>
        {elections.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xl">
            <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">No Elections Available</h3>
            <p className="text-slate-500">Check back later for upcoming elections.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {elections.map((election, i) => {
              const status = getStatus(election);
              return (
                <motion.div
                  key={election.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:border-indigo-200 transition-all cursor-pointer group"
                  onClick={() => navigate(`/election/${election.id}`)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>
                        <span className={`w-2 h-2 rounded-full ${status.dotColor}`} />
                        {status.text}
                      </span>
                      {election.vote_count > 0 && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Users className="w-3 h-3" />
                          {election.vote_count}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                      {election.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                      {election.description || 'No description'}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(election.start_time), 'MMM d')} - {format(new Date(election.end_time), 'MMM d, yyyy')}
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                    <span className="flex items-center justify-center gap-2 text-sm font-bold text-indigo-600 group-hover:text-indigo-700">
                      View Details
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default VoterDashboard;
