import React, { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import BottomNav from './components/BottomNav';
import PreventiveAlertBanner from './components/PreventiveAlertBanner';
import ClinicDiscovery from './components/ClinicDiscovery';
import AiTriageAssistant from './components/AiTriageAssistant';
import AppointmentHistory from './components/AppointmentHistory';
import { fetchRecommendations, fetchClinics, fetchAppointments } from '../../api/patientApi';
import { io } from 'socket.io-client';

export default function PatientApp() {
    const [activeTab, setActiveTab] = useState('home');
    const [recommendations, setRecommendations] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [recsData, apptsData] = await Promise.all([
                    fetchRecommendations().catch(() => []),
                    fetchAppointments().catch(() => []),
                ]);
                setRecommendations(recsData);
                setAppointments(apptsData);
            } catch (err) {
                console.error('Failed to load patient data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();

        const socket = io('http://localhost:5001');
        socket.on('QUEUE_UPDATE', () => {
            console.log("Realtime event received: QUEUE_UPDATE");
            loadData();
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    if (loading) {
        return (
            <div className="max-w-md mx-auto min-h-screen bg-gray-50 shadow-xl flex items-center justify-center">
                <Loader2 size={32} className="text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto min-h-screen bg-gray-50 shadow-xl relative">
            {/* Scrollable content area */}
            <div className="pb-24 px-4">

                {/* Top bar (always visible) */}
                <header className="sticky top-0 z-40 bg-gray-50/80 backdrop-blur-md pt-4 pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <img src="/logo.png" alt="HealTrack Logo" className="w-8 h-8 object-contain" />
                            <div>
                                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight leading-tight">
                                    HealTrack
                                </h1>
                                <p className="text-[10px] text-gray-400">Your Health Companion</p>
                            </div>
                        </div>
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-all">
                            <Heart size={18} className="text-white" />
                        </div>
                    </div>
                </header>

                {/* Tab content */}
                {activeTab === 'home' && (
                    <div className="space-y-6">
                        {/* Greeting */}
                        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-2xl p-5 shadow-lg">
                            <p className="text-indigo-100 text-xs font-medium">Welcome back 👋</p>
                            <h2 className="text-white text-lg font-bold mt-1">How are you feeling today?</h2>
                            <p className="text-indigo-200 text-xs mt-2 leading-relaxed">
                                Stay on top of your health with AI-powered insights and preventive care alerts.
                            </p>
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => setActiveTab('triage')}
                                    className="text-xs font-semibold text-indigo-700 bg-white px-4 py-2 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
                                >
                                    Check Symptoms
                                </button>
                                <button
                                    onClick={() => setActiveTab('find-care')}
                                    className="text-xs font-semibold text-white bg-white/20 px-4 py-2 rounded-xl hover:bg-white/30 transition-colors backdrop-blur-sm"
                                >
                                    Find a Clinic
                                </button>
                            </div>
                        </div>

                        {/* Preventive Alerts */}
                        <PreventiveAlertBanner 
                            recommendations={recommendations} 
                            onBookNow={() => setActiveTab('find-care')}
                        />

                        {/* Quick stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                                <p className="text-2xl font-extrabold text-indigo-600">{appointments.length}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Total Visits</p>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                                <p className="text-2xl font-extrabold text-emerald-600">{recommendations.length}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Pending Alerts</p>
                            </div>
                        </div>

                        {/* Recent Appointments Preview */}
                        {appointments.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between px-1 mb-3">
                                    <h3 className="text-sm font-semibold text-gray-800">Recent Visits</h3>
                                    <button
                                        onClick={() => setActiveTab('records')}
                                        className="text-xs text-indigo-600 font-medium"
                                    >
                                        View All →
                                    </button>
                                </div>
                                <AppointmentHistory appointments={appointments.slice(0, 3)} />
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'find-care' && <ClinicDiscovery />}

                {activeTab === 'triage' && <AiTriageAssistant />}

                {activeTab === 'records' && <AppointmentHistory appointments={appointments} />}
            </div>

            {/* Bottom Navigation */}
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
}
