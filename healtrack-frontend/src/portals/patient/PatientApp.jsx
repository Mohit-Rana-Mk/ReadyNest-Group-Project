import React, { useState, useEffect } from 'react';
import { Heart, Loader2, LogOut, Home, Search, Activity, FileText, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BottomNav from './components/BottomNav';
import PreventiveAlertBanner from './components/PreventiveAlertBanner';
import ClinicDiscovery from './components/ClinicDiscovery';
import AiTriageAssistant from './components/AiTriageAssistant';
import AppointmentHistory from './components/AppointmentHistory';
import GeneralAwareness from './components/GeneralAwareness';
import { fetchRecommendations, fetchClinics, fetchAppointments, dismissRecommendation } from '../../api/patientApi';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function PatientApp() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('home');
    const [recommendations, setRecommendations] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { logout, user } = useAuth();

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
        setRecommendations(prev => prev.filter(r => r.id !== id));
        if (typeof id === 'string' && id.startsWith('mock-')) return;
        try {
            await dismissRecommendation(id);
        } catch (error) {
            console.error('Failed to dismiss alert:', error);
        }
    };

    const desktopNavItems = [
        { id: 'home', name: t('nav.home'), icon: Home },
        { id: 'find-care', name: t('nav.findCare'), icon: Search },
        { id: 'triage', name: t('nav.aiTriage'), icon: Activity },
        { id: 'awareness', name: t('nav.generalAwareness'), icon: BookOpen },
        { id: 'records', name: t('nav.records'), icon: FileText },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 size={32} className="text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
            {/* Desktop Sidebar (matches Image 2 style) */}
            <aside className="hidden md:flex w-64 flex-col bg-[#0B132B] sticky top-0 h-screen overflow-y-auto shrink-0 z-50">
                {/* Logo and Portal Title */}
                <div className="p-6 flex items-center justify-between border-b border-slate-800/60">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
                            <Heart className="w-4.5 h-4.5 fill-white/20" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-white tracking-tight leading-tight">
                                HealTrack
                            </h1>
                            <p className="text-[9px] text-[#22d3ee] font-extrabold uppercase tracking-widest">
                                Patient Portal
                            </p>
                        </div>
                    </div>
                </div>

                {/* Language Switcher */}
                <div className="px-6 py-3 border-b border-slate-800/40 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Language</span>
                    <LanguageSwitcher />
                </div>

                {/* Sidebar Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2">
                    {desktopNavItems.map(item => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                                    isActive 
                                        ? 'bg-[#7F3DEC] text-white shadow-md shadow-[#7F3DEC]/10' 
                                        : 'text-slate-300 hover:text-white hover:bg-slate-800/30'
                                }`}
                            >
                                <item.icon className="w-4.5 h-4.5" />
                                {item.name}
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom section of sidebar */}
                <div className="p-4 border-t border-slate-800/60">
                    <div className="bg-[#131B31] rounded-2xl p-4 mb-4 border border-slate-800/40 shadow-sm flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#1e293b] text-[#38bdf8] flex items-center justify-center border border-slate-700/50">
                            <Heart size={16} className="fill-[#38bdf8]/10" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white">My Health</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                {recommendations.length > 0 ? recommendations.length : 1} Care Alerts
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={logout} 
                        className="w-full flex items-center justify-center gap-2 p-3 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-slate-800/20 hover:bg-slate-800/40 rounded-xl transition-colors border border-slate-800/40 cursor-pointer"
                    >
                        <LogOut size={14} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-h-screen relative max-w-full overflow-hidden bg-[#F8FAFC]">
                {/* Mobile Header (Matches Image 1 style - Dark background) */}
                <header className="md:hidden sticky top-0 z-40 bg-[#0B132B] pt-4 pb-3 px-4 border-b border-slate-800/60 shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
                                <Heart className="w-4.5 h-4.5 fill-white/20" />
                            </div>
                            <div>
                                <h1 className="text-base font-bold text-white tracking-tight leading-tight">
                                    HealTrack
                                </h1>
                                <p className="text-[9px] text-[#22d3ee] font-extrabold uppercase tracking-widest">
                                    Patient Portal
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <LanguageSwitcher />
                            <button 
                                onClick={logout} 
                                className="p-2 text-slate-300 hover:text-white bg-slate-800/30 rounded-xl transition-colors border border-slate-800/40 cursor-pointer"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content Wrapper */}
                <div className="flex-1 overflow-y-auto pb-28 md:pb-8 p-4 md:p-8 lg:p-10 w-full max-w-7xl mx-auto">
                    {activeTab === 'home' && (
                        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            
                            {/* Greeting Banner (Dark theme) */}
                            <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-3xl p-6 md:p-10 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
                                <div className="absolute bottom-0 right-20 -mb-10 w-32 h-32 bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>
                                
                                <div className="relative z-10 space-y-1">
                                    <p className="text-blue-400 text-[10px] md:text-xs font-extrabold tracking-widest uppercase">
                                        WELCOME BACK 👋
                                    </p>
                                    <h2 className="text-white text-2xl md:text-3xl font-black tracking-tight">
                                        How are you feeling today?
                                    </h2>
                                    <p className="text-slate-400 text-xs md:text-sm mt-2 max-w-xl leading-relaxed font-medium">
                                        Monitor your vitals, explore nearby clinics, and run AI triage evaluations in seconds.
                                    </p>
                                </div>

                                <div className="flex gap-3 relative z-10 shrink-0">
                                    <button
                                        onClick={() => setActiveTab('triage')}
                                        className="text-xs font-bold text-white bg-white/10 border border-white/15 px-5 py-3 rounded-2xl hover:bg-white/20 transition-all backdrop-blur-md flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <Activity size={14} className="text-[#38bdf8]" /> Check Symptoms
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('find-care')}
                                        className="text-xs font-bold text-white bg-white/10 border border-white/15 px-5 py-3 rounded-2xl hover:bg-white/20 transition-all backdrop-blur-md flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <Search size={14} className="text-[#38bdf8]" /> Find a Clinic
                                    </button>
                                </div>
                            </div>

                            {/* Main split-view dashboard (Left side: Alerts/Stats, Right side: Recent Visits) */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                                {/* Left Column: Alerts & Stats (8 columns) */}
                                <div className="lg:col-span-8 space-y-6 lg:space-y-8">
                                    <PreventiveAlertBanner 
                                        recommendations={recommendations} 
                                        onBookNow={() => setActiveTab('find-care')}
                                        onDismiss={handleDismissAlert}
                                    />
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => setActiveTab('records')}>
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                                                <FileText className="w-6 h-6 text-indigo-500" />
                                            </div>
                                            <p className="text-4xl font-black text-slate-800 tracking-tight">{appointments.length}</p>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1.5">Total Clinic Visits</p>
                                        </div>
                                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => setActiveTab('records')}>
                                            <div className="w-12 h-12 rounded-2xl bg-[#ecfdf5] flex items-center justify-center mb-4 border border-emerald-100">
                                                <Heart className="w-6 h-6 text-emerald-500 fill-emerald-500/10" />
                                            </div>
                                            <p className="text-4xl font-black text-slate-800 tracking-tight">
                                                {recommendations.length > 0 ? recommendations.length : 1}
                                            </p>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1.5">Pending Care Alerts</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Recent Appointments Preview (4 columns) */}
                                <div className="lg:col-span-4">
                                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm h-full flex flex-col min-h-[300px]">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Recent Visits</h3>
                                            <button
                                                onClick={() => setActiveTab('records')}
                                                className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-widest hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg cursor-pointer"
                                            >
                                                View All
                                            </button>
                                        </div>
                                        {appointments.length > 0 ? (
                                            <div className="flex-1 space-y-4">
                                                {appointments.slice(0, 4).map((apt, idx) => (
                                                    <div key={idx} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                                                        <div className="w-11 h-11 rounded-xl bg-slate-50 flex flex-col items-center justify-center shrink-0 border border-slate-100">
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(apt.appointment_date).toLocaleString('default', { month: 'short' })}</span>
                                                            <span className="text-sm font-black text-slate-800 leading-none">{new Date(apt.appointment_date).getDate()}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-slate-800 truncate">{apt.clinic_name}</p>
                                                            <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5">{apt.doctor_name}</p>
                                                        </div>
                                                        <div>
                                                            <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase tracking-wider ${
                                                                apt.status === 'Completed' 
                                                                    ? 'bg-emerald-50 text-emerald-600' 
                                                                    : 'bg-amber-50 text-amber-600'
                                                            }`}>
                                                                {apt.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                                                    <FileText className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">No recent visits</p>
                                                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">Book an appointment to see it here.</p>
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

                    {activeTab === 'awareness' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <GeneralAwareness />
                        </div>
                    )}
                </div>
            </main>

            {/* Bottom Navigation — mobile only */}
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
}
