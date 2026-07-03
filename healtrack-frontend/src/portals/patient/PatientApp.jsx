import React, { useState, useEffect } from 'react';
import { Heart, Loader2, LogOut, Home, Search, Activity, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BottomNav from './components/BottomNav';
import PreventiveAlertBanner from './components/PreventiveAlertBanner';
import ClinicDiscovery from './components/ClinicDiscovery';
import AiTriageAssistant from './components/AiTriageAssistant';
import AppointmentHistory from './components/AppointmentHistory';
import { fetchRecommendations, fetchClinics, fetchAppointments, dismissRecommendation } from '../../api/patientApi';
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

        const socket = io('https://healtrack-backend-7h3o.onrender.com');
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

    const handleDismissAlert = async (id) => {
        // Optimistically remove from UI
        setRecommendations(prev => prev.filter(r => r.id !== id));
        try {
            await dismissRecommendation(id);
        } catch (error) {
            console.error('Failed to dismiss alert:', error);
            // Optionally, we could reload data here if it fails
        }
    };

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
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Desktop Sidebar (hidden on mobile) */}
            <aside className="hidden md:flex w-64 flex-col bg-white border-r border-gray-200 sticky top-0 h-screen overflow-y-auto shrink-0 z-50">
                <div className="p-6 flex items-center gap-3 border-b border-gray-100">
                    <img src="/logo.png" alt="HealTrack Logo" className="w-8 h-8 object-contain" />
                    <div>
                        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight leading-tight">
                            HealTrack
                        </h1>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Patient Portal</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    {desktopNavItems.map(item => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                    isActive 
                                        ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50' 
                                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                            >
                                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                                    <item.icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                                </div>
                                {item.name}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl p-4 mb-4 border border-indigo-100/50 shadow-sm">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-white shadow-sm">
                                <Heart size={18} className="text-indigo-500" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800">My Health</p>
                                <p className="text-[10px] text-gray-500 font-medium">{recommendations.length} Pending Alerts</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={logout} className="w-full flex items-center justify-center gap-2 p-3 text-sm font-semibold text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-xl transition-colors border border-gray-100 hover:border-red-100">
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-h-screen relative max-w-full overflow-hidden bg-gray-50/50">
                {/* Mobile Header (Hidden on Desktop) */}
                <header className="md:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md pt-4 pb-3 px-4 border-b border-gray-200/50 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <img src="/logo.png" alt="HealTrack Logo" className="w-8 h-8 object-contain" />
                            <div>
                                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight leading-tight">
                                    HealTrack
                                </h1>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Patient Portal</p>
                            </div>
                        </div>
                        <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-xl shadow-sm transition-colors border border-gray-100">
                            <LogOut size={18} />
                        </button>
                    </div>
                </header>

                {/* Scrollable Content Wrapper */}
                <div className="flex-1 overflow-y-auto pb-24 md:pb-8 p-4 md:p-8 lg:p-10 w-full max-w-7xl mx-auto">
                    {/* Tab content */}
                    {activeTab === 'home' && (
                        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Greeting Banner */}
                            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-3xl p-6 md:p-10 shadow-[0_8px_30px_rgba(79,70,229,0.2)] relative overflow-hidden">
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                                <div className="absolute bottom-0 right-20 -mb-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-xl pointer-events-none"></div>
                                
                                <div className="relative z-10">
                                    <p className="text-indigo-200 text-xs md:text-sm font-bold tracking-widest uppercase">Welcome back 👋</p>
                                    <h2 className="text-white text-2xl md:text-4xl font-black mt-2 tracking-tight">How are you feeling today?</h2>
                                    <p className="text-indigo-100/90 text-sm md:text-base mt-3 max-w-xl leading-relaxed font-medium">
                                        Stay on top of your health with AI-powered insights, real-time alerts, and personalized preventive care tracking.
                                    </p>
                                    <div className="flex flex-wrap gap-3 mt-8">
                                        <button
                                            onClick={() => setActiveTab('triage')}
                                            className="text-sm font-bold text-indigo-700 bg-white px-6 py-3 rounded-2xl shadow-sm hover:shadow-md hover:bg-gray-50 transition-all flex items-center gap-2"
                                        >
                                            <Activity size={18} /> Check Symptoms
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('find-care')}
                                            className="text-sm font-bold text-white bg-white/10 border border-white/20 px-6 py-3 rounded-2xl hover:bg-white/20 transition-all backdrop-blur-md flex items-center gap-2"
                                        >
                                            <Search size={18} /> Find a Clinic
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop multi-column layout for alerts + stats + history */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                                {/* Left Column: Alerts & Stats */}
                                <div className="lg:col-span-8 space-y-6 lg:space-y-8">
                                    <div className="bg-white rounded-3xl p-1 shadow-sm border border-gray-100">
                                        <PreventiveAlertBanner 
                                            recommendations={recommendations} 
                                            onBookNow={() => setActiveTab('find-care')}
                                            onDismiss={handleDismissAlert}
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 lg:gap-6">
                                        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group cursor-pointer" onClick={() => setActiveTab('records')}>
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <FileText className="w-6 h-6 text-indigo-600" />
                                            </div>
                                            <p className="text-4xl font-black text-slate-800 tracking-tight">{appointments.length}</p>
                                            <p className="text-sm font-bold text-slate-400 mt-1">Total Clinic Visits</p>
                                        </div>
                                        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group cursor-pointer" onClick={() => setActiveTab('records')}>
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <Heart className="w-6 h-6 text-emerald-600" />
                                            </div>
                                            <p className="text-4xl font-black text-slate-800 tracking-tight">{recommendations.length}</p>
                                            <p className="text-sm font-bold text-slate-400 mt-1">Pending Care Alerts</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Recent Appointments Preview */}
                                <div className="lg:col-span-4">
                                    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm h-full flex flex-col">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-bold text-slate-800">Recent Visits</h3>
                                            <button
                                                onClick={() => setActiveTab('records')}
                                                className="text-xs text-indigo-600 font-bold hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg"
                                            >
                                                View All
                                            </button>
                                        </div>
                                        {appointments.length > 0 ? (
                                            <div className="flex-1">
                                                {/* Instead of using AppointmentHistory which renders a big list, we render a compact preview here */}
                                                <div className="space-y-4">
                                                    {appointments.slice(0, 4).map((apt, idx) => (
                                                        <div key={idx} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                                            <div className="w-12 h-12 rounded-full bg-indigo-50 flex flex-col items-center justify-center shrink-0 border border-indigo-100/50">
                                                                <span className="text-xs font-bold text-indigo-600">{new Date(apt.appointment_date).toLocaleString('default', { month: 'short' })}</span>
                                                                <span className="text-sm font-black text-indigo-700">{new Date(apt.appointment_date).getDate()}</span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-slate-800 truncate">{apt.clinic_name}</p>
                                                                <p className="text-xs font-medium text-slate-500 truncate mt-0.5">{apt.doctor_name}</p>
                                                            </div>
                                                            <div>
                                                                <span className={`px-2 py-1 text-[10px] font-bold rounded-md ${apt.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                    {apt.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                                    <FileText className="w-8 h-8 text-gray-300" />
                                                </div>
                                                <p className="text-sm text-slate-500 font-bold">No recent visits</p>
                                                <p className="text-xs text-slate-400 mt-1">Book an appointment to see it here.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'find-care' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <ClinicDiscovery />
                        </div>
                    )}

                    {activeTab === 'triage' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
                            <AiTriageAssistant />
                        </div>
                    )}

                    {activeTab === 'records' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <AppointmentHistory appointments={appointments} />
                        </div>
                    )}
                </div>
            </main>

            {/* Bottom Navigation — mobile only */}
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
}
