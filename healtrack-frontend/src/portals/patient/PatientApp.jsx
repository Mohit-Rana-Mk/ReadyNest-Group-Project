import React, { useState, useEffect } from 'react';
import { Heart, Loader2, LogOut, Home, Search, Activity, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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
    const { logout } = useAuth();

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
            loadData();
        });
        socket.on('NEW_ALERT', (alert) => {
            loadData();
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const desktopNavItems = [
        { id: 'home', name: 'Home', icon: Home },
        { id: 'find-care', name: 'Find Care', icon: Search },
        { id: 'triage', name: 'AI Triage', icon: Activity },
        { id: 'records', name: 'Records', icon: FileText },
    ];

    if (loading) {
        return (
            <div className="max-w-md md:max-w-2xl lg:max-w-5xl mx-auto min-h-screen bg-gray-50 shadow-xl flex items-center justify-center">
                <Loader2 size={32} className="text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-md md:max-w-2xl lg:max-w-6xl mx-auto min-h-screen bg-gray-50 shadow-xl relative">
            {/* Scrollable content area */}
            <div className="pb-24 md:pb-8 px-4 md:px-6 lg:px-8">

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

                        {/* DESKTOP NAV (hidden on mobile — BottomNav used instead) */}
                        <nav className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-full">
                            {desktopNavItems.map(item => {
                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                                            isActive 
                                                ? 'bg-indigo-600 text-white shadow-sm' 
                                                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'
                                        }`}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        {item.name}
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-all">
                                <Heart size={18} className="text-white" />
                            </div>
                            <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 rounded-xl shadow-sm transition-colors">
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Tab content */}
                {activeTab === 'home' && (
                    <div className="space-y-6">
                        {/* Greeting */}
                        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-2xl p-5 md:p-8 shadow-lg">
                            <p className="text-indigo-100 text-xs md:text-sm font-medium">Welcome back 👋</p>
                            <h2 className="text-white text-lg md:text-2xl font-bold mt-1">How are you feeling today?</h2>
                            <p className="text-indigo-200 text-xs md:text-sm mt-2 leading-relaxed">
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

                        {/* Desktop 2-column layout for alerts + stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Preventive Alerts */}
                            <div>
                                <PreventiveAlertBanner 
                                    recommendations={recommendations} 
                                    onBookNow={() => setActiveTab('find-care')}
                                />
                            </div>

                            {/* Quick stats */}
                            <div className="grid grid-cols-2 gap-3 content-start">
                                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                                    <p className="text-2xl font-extrabold text-indigo-600">{appointments.length}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Total Visits</p>
                                </div>
                                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                                    <p className="text-2xl font-extrabold text-emerald-600">{recommendations.length}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Pending Alerts</p>
                                </div>
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

            {/* Bottom Navigation — mobile only */}
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
}
