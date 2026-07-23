import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Heart, Loader2, LogOut, Home, Search, Activity, FileText, BookOpen, CreditCard, User, AlertCircle, Calendar, Phone, MapPin, LifeBuoy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BottomNav from './components/BottomNav';
import PreventiveAlertBanner from './components/PreventiveAlertBanner';
import ClinicDiscovery from './components/ClinicDiscovery';
import AiTriageAssistant from './components/AiTriageAssistant';
import AppointmentHistory from './components/AppointmentHistory';
import GeneralAwareness from './components/GeneralAwareness';
import PatientPayments from './components/PatientPayments';
import PatientProfile from './components/PatientProfile';
import { CustomDropdown } from '../../components/ui/CustomDropdown';
import Skeleton from '../../components/ui/Skeleton';
import { fetchRecommendations, fetchClinics, fetchAppointments, dismissRecommendation, fetchProfile, updateProfile } from '../../api/patientApi';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { SOCKET_URL } from '../../api/axiosClient';
import { Button } from '../../components/ui/Button';
import { Footer } from '../../components/ui/Footer';

export default function PatientApp() {
    const location = useLocation();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(location.state?.tab || 'home');
    const [recommendations, setRecommendations] = useState([]);
    const [appointments, setAppointments] = useState([]);

    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
        }
    }, [location.state]);
    const [loading, setLoading] = useState(true);
    const { logout, user } = useAuth();

    // Profile completeness state
    const [profile, setProfile] = useState(null);
    const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
    const [modalCountryCode, setModalCountryCode] = useState('+91');
    const [modalPhone, setModalPhone] = useState('');
    const [modalDob, setModalDob] = useState('');
    const [modalGender, setModalGender] = useState('Prefer Not to Say');
    const [modalBloodGroup, setModalBloodGroup] = useState('');
    const [modalSaving, setModalSaving] = useState(false);
    const [modalError, setModalError] = useState('');

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const upcomingAppointments = appointments
        .filter(apt => {
            const aptDate = new Date(apt.appointment_date);
            return aptDate >= todayStart && 
                   apt.status !== 'Completed' && 
                   apt.status !== 'Cancelled' && 
                   apt.status !== 'Canceled';
        })
        .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

    const recentVisits = appointments
        .filter(apt => {
            const aptDate = new Date(apt.appointment_date);
            return aptDate < todayStart || 
                   apt.status === 'Completed' || 
                   apt.status === 'Cancelled' || 
                   apt.status === 'Canceled';
        })
        .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));

    const validatePhoneFormat = (code, num) => {
        const clean = num.replace(/\D/g, '');
        if (['+91', '+1', '+44'].includes(code)) {
            return clean.length === 10;
        }
        if (['+61', '+971', '+966'].includes(code)) {
            return clean.length === 9;
        }
        return clean.length >= 7 && clean.length <= 15;
    };

    const loadData = async () => {
        try {
            const [recsData, apptsData, profileRes] = await Promise.all([
                fetchRecommendations().catch(() => []),
                fetchAppointments().catch(() => []),
                fetchProfile().catch(() => null)
            ]);
            setRecommendations(recsData);
            setAppointments(apptsData);
            if (profileRes && profileRes.success && profileRes.data) {
                setProfile(profileRes.data);
                const p = profileRes.data;
                // If phone or date_of_birth is missing/null, prompt to complete profile
                if (!p.phone || !p.date_of_birth) {
                    setShowCompleteProfileModal(true);
                }
            }
        } catch (err) {
            console.error('Failed to load patient data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteProfileSubmit = async (e) => {
        e.preventDefault();
        setModalError('');

        if (!modalPhone.trim()) {
            setModalError('Phone number is required.');
            return;
        }

        if (!validatePhoneFormat(modalCountryCode, modalPhone)) {
            const expected = ['+91', '+1', '+44'].includes(modalCountryCode) ? '10' : '9';
            setModalError(`Phone number must consist of exactly ${expected} digits for country code ${modalCountryCode}.`);
            return;
        }

        if (!modalDob) {
            setModalError('Date of birth is required.');
            return;
        }

        const birthDate = new Date(modalDob);
        const today = new Date();
        if (birthDate > today) {
            setModalError('Date of birth cannot be a future date.');
            return;
        }

        try {
            setModalSaving(true);
            const combinedPhone = `${modalCountryCode}${modalPhone.replace(/\D/g, '')}`;
            const res = await updateProfile({
                name: profile?.name,
                email: profile?.email,
                phone: combinedPhone,
                date_of_birth: modalDob,
                gender: modalGender,
                blood_group: modalBloodGroup || null
            });

            if (res.success) {
                setShowCompleteProfileModal(false);
                await loadData();
            } else {
                setModalError(res.message || 'Failed to update profile.');
            }
        } catch (err) {
            console.error('Complete profile error:', err);
            setModalError(err.response?.data?.message || 'Error occurred while updating profile.');
        } finally {
            setModalSaving(false);
        }
    };

    useEffect(() => {
        loadData();

        const socket = io(SOCKET_URL);
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
        /* profile item removed from sidebar nav as per request */
        { id: 'records', name: t('nav.records'), icon: FileText },
        { id: 'payments', name: 'Payments', icon: CreditCard },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
                <aside className="hidden md:flex w-64 flex-col bg-[#0B132B] h-screen shrink-0">
                    <div className="p-6 border-b border-slate-800/60 flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-lg bg-slate-700" />
                        <div className="space-y-2">
                            <Skeleton className="w-24 h-4 bg-slate-700" />
                            <Skeleton className="w-16 h-2 bg-slate-700" />
                        </div>
                    </div>
                    <div className="p-4 space-y-3 mt-2">
                        {[1, 2, 3, 4, 5, 6, 7].map(i => (
                            <Skeleton key={i} className="w-full h-11 bg-slate-800/50 rounded-xl" />
                        ))}
                    </div>
                </aside>

                <main className="flex-1 flex flex-col min-h-screen bg-[#F8FAFC] p-4 md:p-8 space-y-6">
                    <div className="md:hidden flex items-center justify-between mb-2">
                         <div className="flex items-center gap-3">
                             <Skeleton className="w-8 h-8 rounded-lg" />
                             <Skeleton className="w-24 h-4" />
                         </div>
                         <Skeleton className="w-8 h-8 rounded-xl" />
                    </div>
                    
                    <Skeleton className="w-full h-32 md:h-40 rounded-3xl" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="w-full h-80 rounded-3xl" />
                        <Skeleton className="w-full h-80 rounded-3xl" />
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="h-screen overflow-hidden flex font-sans antialiased bg-[#F8FAFC]">
            {/* Desktop Floating Sidebar (Close to corners) */}
            <aside className="fixed top-3 left-3 bottom-20 w-64 rounded-2xl bg-gradient-to-b from-[#0B132B] via-[#1C2541] to-[#0B132B] border border-white/10 shadow-xl hidden md:flex flex-col justify-between z-50 overflow-hidden text-slate-200">
                {/* Logo and Portal Title */}
                <div className="p-6 flex items-center justify-between border-b border-slate-800/60">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="HealTrack Logo" className="w-8 h-8 object-contain rounded-lg shadow-md" />
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
                <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
                    {desktopNavItems.map(item => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-[18px] transition-all transform hover:-translate-y-0.5 active:scale-95 border-none outline-none focus:outline-none focus:ring-0 bg-transparent group cursor-pointer ${
                                    isActive 
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-cyan-400'
                                }`}
                            >
                                <item.icon className={`w-4.5 h-4.5 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-400'}`} />
                                <span className={`font-semibold text-xs tracking-wide ${isActive ? 'text-white' : ''}`}>{item.name}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Need Help Support Box & User Profile Footer */}
                <div className="p-4 mt-auto space-y-3">
                    <div className="bg-slate-800/50 rounded-[20px] p-4 border border-slate-700/50 flex flex-col items-center text-center">
                        <div className="w-9 h-9 rounded-full bg-slate-900 shadow-sm flex items-center justify-center mb-2">
                            <LifeBuoy className="w-4 h-4 text-indigo-400" />
                        </div>
                        <p className="text-xs font-bold text-white">Need help?</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5 mb-2.5">Check our docs or contact support</p>
                        <Button 
                            onClick={() => alert("Redirecting to Support Center...")}
                            className="w-full bg-slate-700 hover:bg-slate-600 text-white border-none rounded-[12px] shadow-sm text-xs py-1.5 cursor-pointer"
                        >
                            Support Center
                        </Button>
                    </div>

                    {/* User Profile Footer Row (Icon, First Name, Sign Out) */}
                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className="flex items-center gap-2.5 min-w-0 bg-transparent border-none text-left cursor-pointer group"
                            title="View Profile"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-sm shrink-0">
                                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'PT'}
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-cyan-400 transition-colors">
                                    {user?.name ? user.name.trim().split(' ')[0] : 'Patient'}
                                </h4>
                                <span className="text-[9px] font-medium text-slate-400 block -mt-0.5">My Account</span>
                            </div>
                        </button>

                        <button
                            onClick={logout}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition border-none bg-transparent cursor-pointer shrink-0"
                            title="Sign Out"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative max-w-full bg-[#F8FAFC]">
                {/* Mobile Header (Matches Image 1 style - Dark background) */}
                <header className="md:hidden sticky top-0 z-40 bg-[#0B132B] pt-4 pb-3 px-4 border-b border-slate-800/60 shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="HealTrack Logo" className="w-8 h-8 object-contain rounded-lg shadow-md" />
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
                                onClick={() => setActiveTab('profile')} 
                                className={`p-2 rounded-xl transition-colors border border-slate-800/40 focus:outline-none focus:ring-2 focus:ring-slate-500 ${activeTab === 'profile' ? 'bg-[#7F3DEC] text-white' : 'text-slate-300 hover:text-white bg-slate-800/30'}`}
                            >
                                <User size={16} />
                            </button>
                            <button 
                                onClick={logout} 
                                className="p-2 text-slate-300 hover:text-white bg-slate-800/30 rounded-xl transition-colors border border-slate-800/40 focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content Wrapper */}
                <div className="flex-1 overflow-y-auto pb-36 md:pb-36 p-4 md:p-6 lg:p-8 md:ml-[264px] w-full max-w-7xl">
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
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => setActiveTab('records')}>
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                                                <FileText className="w-6 h-6 text-indigo-500" />
                                            </div>
                                            <p className="text-4xl font-black text-slate-800 tracking-tight">{recentVisits.length}</p>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1.5">Total Clinic Visits</p>
                                        </div>
                                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => setActiveTab('records')}>
                                            <div className="w-12 h-12 rounded-2xl bg-[#ecfdf5] flex items-center justify-center mb-4 border border-emerald-100">
                                                <Heart className="w-6 h-6 text-emerald-500 fill-emerald-500/10" />
                                            </div>
                                            <p className="text-4xl font-black text-slate-800 tracking-tight">
                                                {recommendations.length}
                                            </p>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1.5">Pending Care Alerts</p>
                                        </div>
                                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => setActiveTab('payments')}>
                                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 border border-blue-100">
                                                <CreditCard className="w-6 h-6 text-blue-500" />
                                            </div>
                                            <p className="text-sm font-black text-slate-800 mt-2">Payments & Bills</p>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1.5">View and request refunds</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Appointments Preview (4 columns) */}
                                <div className="lg:col-span-4 space-y-6">
                                    {/* Upcoming Appointments Card */}
                                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col min-h-[220px]">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Upcoming Appointments</h3>
                                            <span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide">
                                                {upcomingAppointments.length}
                                            </span>
                                        </div>
                                        {upcomingAppointments.length > 0 ? (
                                            <div className="space-y-4 overflow-y-auto max-h-[280px] pr-1">
                                                {upcomingAppointments.slice(0, 3).map((apt, idx) => {
                                                    const aptDate = new Date(apt.appointment_date);
                                                    const isTele = apt.consultation_type === 'Teleconsultation';
                                                    return (
                                                        <div key={idx} className="p-3.5 rounded-2xl bg-indigo-50/30 border border-indigo-100/30 hover:border-indigo-100 hover:bg-indigo-50/50 transition-all space-y-2.5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-[#7F3DEC] flex flex-col items-center justify-center shrink-0 text-white shadow-sm shadow-[#7F3DEC]/20">
                                                                    <span className="text-[8px] font-bold uppercase tracking-wider">{aptDate.toLocaleString('default', { month: 'short' })}</span>
                                                                    <span className="text-xs font-black leading-none">{aptDate.getDate()}</span>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-bold text-slate-800 truncate">{apt.clinic_name}</p>
                                                                    <p className="text-[10px] font-medium text-slate-500 truncate mt-0.5">{apt.doctor_name}</p>
                                                                </div>
                                                                <div>
                                                                    <span className={`px-2 py-0.5 text-[8px] font-extrabold rounded-md uppercase tracking-wider ${
                                                                        apt.status === 'Confirmed' 
                                                                            ? 'bg-emerald-50 text-emerald-600' 
                                                                            : apt.status === 'Pending Payment'
                                                                            ? 'bg-amber-50 text-amber-600'
                                                                            : 'bg-blue-50 text-blue-600'
                                                                    }`}>
                                                                        {apt.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 bg-white/60 px-3 py-1.5 rounded-lg">
                                                                <span>{aptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                <span className="font-bold text-indigo-600">{apt.consultation_type}</span>
                                                            </div>
                                                            {isTele && apt.meeting_link ? (
                                                                <a 
                                                                    href={apt.meeting_link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="w-full flex items-center justify-center gap-1.5 p-2 bg-[#7F3DEC] hover:bg-[#6c2ed2] text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                                                                >
                                                                    Join Video Call
                                                                </a>
                                                            ) : !isTele && (
                                                                <a 
                                                                    href={apt.clinic_latitude && apt.clinic_longitude && Number(apt.clinic_latitude) !== 0 ? `https://maps.google.com/?q=${apt.clinic_latitude},${apt.clinic_longitude}` : `https://maps.google.com/?q=${encodeURIComponent(`${apt.clinic_address || apt.clinic_name} ${apt.clinic_city || ''}`.trim())}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="w-full flex items-center justify-center gap-1.5 p-2 bg-[#7F3DEC] hover:bg-[#6c2ed2] text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                                                                >
                                                                    <MapPin size={12} />
                                                                    Navigate
                                                                </a>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No upcoming visits</p>
                                                <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">Book a new appointment to schedule your next visit.</p>
                                                <button
                                                    onClick={() => setActiveTab('find-care')}
                                                    className="mt-3 text-[9px] text-white bg-[#7F3DEC] hover:bg-[#6c2ed2] font-extrabold uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                                                >
                                                    Book Now
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Recent Visits Card */}
                                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col min-h-[220px]">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Recent Visits</h3>
                                            <button
                                                onClick={() => setActiveTab('records')}
                                                className="text-[9px] text-indigo-600 font-extrabold uppercase tracking-widest hover:text-indigo-800 transition-colors bg-indigo-50 px-2.5 py-1.5 rounded-lg cursor-pointer"
                                            >
                                                View All
                                            </button>
                                        </div>
                                        {recentVisits.length > 0 ? (
                                            <div className="space-y-3 overflow-y-auto max-h-[280px] pr-1">
                                                {recentVisits.slice(0, 3).map((apt, idx) => {
                                                    const aptDate = new Date(apt.appointment_date);
                                                    return (
                                                        <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                                                            <div className="w-9 h-9 rounded-lg bg-slate-50 flex flex-col items-center justify-center shrink-0 border border-slate-100">
                                                                <span className="text-[8px] font-bold text-slate-400 uppercase">{aptDate.toLocaleString('default', { month: 'short' })}</span>
                                                                <span className="text-xs font-black text-slate-800 leading-none">{aptDate.getDate()}</span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-bold text-slate-800 truncate">{apt.clinic_name}</p>
                                                                <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5">{apt.doctor_name}</p>
                                                            </div>
                                                            <div>
                                                                <span className={`px-2 py-0.5 text-[8px] font-extrabold rounded-md uppercase tracking-wider ${
                                                                    apt.status === 'Completed' 
                                                                        ? 'bg-emerald-50 text-emerald-600' 
                                                                        : 'bg-amber-50 text-amber-600'
                                                                }`}>
                                                                    {apt.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No recent visits</p>
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
                            <AppointmentHistory appointments={appointments} onRefresh={loadData} />
                        </div>
                    )}

                    {activeTab === 'awareness' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <GeneralAwareness />
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <PatientPayments />
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <PatientProfile />
                        </div>
                    )}
                </div>
                <div className="hidden md:block fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-t border-slate-200">
                    <Footer />
                </div>
            </main>

            {/* Bottom Navigation — mobile only */}
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Complete Profile Modal Overlay */}
            {showCompleteProfileModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
                        <div className="text-center space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto border border-indigo-100">
                                <User className="w-6 h-6 text-indigo-500" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">Complete Your Profile</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Before you can access your dashboard and features, please fill in your details to complete your account profile.
                            </p>
                        </div>

                        {modalError && (
                            <div className="mt-4 p-3 bg-rose-50 text-rose-800 border border-rose-100 rounded-2xl text-[11px] font-bold flex items-center gap-2">
                                <AlertCircle size={14} className="text-rose-600 shrink-0" />
                                <span>{modalError}</span>
                            </div>
                        )}

                        <form onSubmit={handleCompleteProfileSubmit} className="mt-6 space-y-4">
                            {/* Phone Number */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Phone Number</label>
                                <div className="flex gap-2">
                                    <div className="w-24 relative">
                                        <CustomDropdown
                                            value={modalCountryCode}
                                            onChange={setModalCountryCode}
                                            className="w-full h-11"
                                            options={[
                                                { value: "+91", label: "🇮🇳 +91" },
                                                { value: "+1", label: "🇺🇸 +1" },
                                                { value: "+44", label: "🇬🇧 +44" },
                                                { value: "+61", label: "🇦🇺 +61" },
                                                { value: "+971", label: "🇦🇪 +971" },
                                                { value: "+966", label: "🇸🇦 +966" }
                                            ]}
                                        />
                                    </div>
                                    <div className="flex-1 relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                                        <input
                                            type="tel"
                                            value={modalPhone}
                                            onChange={(e) => setModalPhone(e.target.value)}
                                            placeholder="Phone number"
                                            className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl pl-9 pr-3 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Date of Birth */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Date of Birth</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                                    <input
                                        type="date"
                                        value={modalDob}
                                        onChange={(e) => setModalDob(e.target.value)}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl pl-9 pr-3 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Gender */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Gender</label>
                                <div className="relative">
                                    <CustomDropdown
                                        value={modalGender}
                                        onChange={setModalGender}
                                        className="w-full h-11"
                                        options={[
                                            { value: "Male", label: "Male" },
                                            { value: "Female", label: "Female" },
                                            { value: "Other", label: "Other" },
                                            { value: "Prefer Not to Say", label: "Prefer Not to Say" }
                                        ]}
                                    />
                                </div>
                            </div>

                            {/* Blood Group */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Blood Group (Optional)</label>
                                <div className="relative">
                                    <CustomDropdown
                                        value={modalBloodGroup}
                                        onChange={setModalBloodGroup}
                                        className="w-full h-11"
                                        options={[
                                            { value: "", label: "Select Blood Group" },
                                            { value: "A+", label: "A+" },
                                            { value: "A-", label: "A-" },
                                            { value: "B+", label: "B+" },
                                            { value: "B-", label: "B-" },
                                            { value: "AB+", label: "AB+" },
                                            { value: "AB-", label: "AB-" },
                                            { value: "O+", label: "O+" },
                                            { value: "O-", label: "O-" }
                                        ]}
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={modalSaving}
                                    className="w-full bg-[#7F3DEC] hover:bg-[#6c2ed2] text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                                >
                                    {modalSaving ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            Saving...
                                        </>
                                    ) : (
                                        'Save and Continue'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
