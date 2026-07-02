import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';

// Import Icons from Lucide
import { 
    ShieldCheck, 
    Map, 
    Activity, 
    PieChart, 
    Globe, 
    RefreshCw,
    LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Import Child Components
import { ClinicOnboarding } from './components/ClinicOnboarding';
import { EpidemiologyMap } from './components/EpidemiologyMap';
import { AiHealthLogs } from './components/AiHealthLogs';
import { EcosystemAnalytics } from './components/EcosystemAnalytics';
import { AuraCareDashboard } from './components/AuraCareDashboard';

export default function AdminDashboard() {
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState('onboarding');
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // States
    const [pendingClinics, setPendingClinics] = useState([]);
    const [outbreakStats, setOutbreakStats] = useState({ locations: [], trends: [] });
    const [aiHealthStats, setAiHealthStats] = useState({ triageRiskRatios: {}, preventiveRecsSent: 0 });
    const [ecosystemStats, setEcosystemStats] = useState({ kpis: {}, reviews: [] });
    const [actionMessage, setActionMessage] = useState('');

    useEffect(() => {
        loadDashboardData();
    }, [activeTab]);

    const loadDashboardData = async () => {
        if (activeTab === 'auracare') return; // Handled internally by component
        setLoading(true);
        try {
            if (activeTab === 'onboarding') {
                const res = await axiosClient.get('/admin/pending-clinics');
                setPendingClinics(res.data.data);
                setIsDemoMode(false);
            } else if (activeTab === 'epidemiology') {
                const res = await axiosClient.get('/admin/epidemiology');
                setOutbreakStats(res.data.data);
                setIsDemoMode(false);
            } else if (activeTab === 'ai-health') {
                const res = await axiosClient.get('/admin/ai-health');
                setAiHealthStats(res.data.data);
                setIsDemoMode(false);
            } else if (activeTab === 'analytics') {
                const res = await axiosClient.get('/admin/ecosystem-kpis');
                setEcosystemStats(res.data.data);
                setIsDemoMode(false);
            }
        } catch (error) {
            console.error("Error loading dashboard data:", error);
            setIsDemoMode(false);
            setPendingClinics([]);
            setOutbreakStats({ locations: [], trends: [] });
            setAiHealthStats({ triageRiskRatios: {}, preventiveRecsSent: 0 });
            setEcosystemStats({ kpis: {}, reviews: [] });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyClinic = async (clinicId, status) => {
        try {
            if (isDemoMode) {
                setPendingClinics(prev => prev.filter(c => c.id !== clinicId));
                setActionMessage(`Successfully verified clinic as ${status} (Simulated)!`);
                setTimeout(() => setActionMessage(''), 3000);
            } else {
                const res = await axiosClient.post('/admin/verify-clinic', { clinicId, status });
                if (res.data.success) {
                    setActionMessage(res.data.message);
                    loadDashboardData();
                    setTimeout(() => setActionMessage(''), 3000);
                }
            }
        } catch (error) {
            console.error("Verification failed:", error);
            alert("Failed to update verification status.");
        }
    };

    const handleOnboardClinic = async (formData) => {
        try {
            if (isDemoMode) {
                setActionMessage("Successfully onboarded clinic as Approved (Simulated)!");
                setTimeout(() => setActionMessage(''), 3000);
            } else {
                const res = await axiosClient.post('/admin/create-clinic', formData);
                if (res.data.success) {
                    setActionMessage(res.data.message);
                    loadDashboardData();
                    setTimeout(() => setActionMessage(''), 3000);
                }
            }
        } catch (error) {
            console.error("Direct onboarding failed:", error);
            alert("Failed to onboard clinic.");
        }
    };

    const navigation = [
        { id: 'onboarding', name: 'Onboarding & Queue', icon: ShieldCheck },
        { id: 'epidemiology', name: 'Epidemiology Map', icon: Map },
        { id: 'ai-health', name: 'AI System Health', icon: Activity },
        { id: 'analytics', name: 'Ecosystem Analytics', icon: PieChart },
        { id: 'auracare', name: 'AuraCare Predictive AI', icon: Globe }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'onboarding':
                return <ClinicOnboarding pendingClinics={pendingClinics} onVerify={handleVerifyClinic} onOnboardClinic={handleOnboardClinic} />;
            case 'epidemiology':
                return <EpidemiologyMap outbreakStats={outbreakStats} />;
            case 'ai-health':
                return <AiHealthLogs aiHealthStats={aiHealthStats} />;
            case 'analytics':
                return <EcosystemAnalytics ecosystemStats={ecosystemStats} onVerify={handleVerifyClinic} />;
            case 'auracare':
                return <AuraCareDashboard />;
            default:
                return <ClinicOnboarding pendingClinics={pendingClinics} onVerify={handleVerifyClinic} onOnboardClinic={handleOnboardClinic} />;
        }
    };

    return (
        <div className="min-h-screen flex font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900 bg-[#f8f9fa] text-slate-700">
            {/* SIDEBAR */}
            <aside className="w-64 border-r flex flex-col shrink-0 bg-white border-[#e9ecef]">
                <div className="p-6 border-b flex items-center gap-3 border-[#f1f3f5]">
                    <img src="/logo.png" alt="HealTrack Logo" className="w-8 h-8 object-contain" />
                    <div>
                        <h2 className="font-bold text-base leading-none text-slate-800">HealTrack</h2>
                        <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">Super Admin</span>
                    </div>
                </div>

                <nav className="flex-1 p-3 space-y-1 mt-4">
                    {navigation.map(item => {
                        const isActive = activeTab === item.id;
                        const activeClass = item.id === 'auracare'
                            ? 'bg-cyan-50 text-cyan-700 border-r-4 border-cyan-500'
                            : 'bg-indigo-50 text-indigo-800 border-r-4 border-indigo-700';
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition text-sm font-semibold ${
                                    isActive 
                                        ? activeClass 
                                        : 'text-slate-500 hover:bg-[#f1f3f5] hover:text-slate-800'
                                }`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.name}
                            </button>
                        );
                    })}
                </nav>

                {isDemoMode && activeTab !== 'auracare' && (
                    <div className="p-4 m-4 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
                        <span className="text-[10px] text-indigo-700 font-extrabold uppercase tracking-wide">Demo Sandbox Mode</span>
                    </div>
                )}
            </aside>

            {/* MAIN WORKSPACE */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* HEADER */}
                <header className="h-16 border-b px-8 flex justify-between items-center shrink-0 bg-white border-[#e9ecef]">
                    <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${activeTab === 'auracare' ? 'text-cyan-600' : 'text-slate-800'}`}>
                        {activeTab.replace('-', ' ')} Workstation
                    </h2>
                    <div className="flex items-center gap-4">
                        {activeTab !== 'auracare' && (
                            <button 
                                onClick={loadDashboardData}
                                className="p-2 hover:bg-slate-100 text-slate-500 rounded-full transition"
                                title="Refresh dashboard stats"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        )}
                        <div className="w-7 h-7 rounded-full bg-indigo-700 flex items-center justify-center font-bold text-white text-[11px]">
                            SA
                        </div>
                        <span className="text-xs font-semibold text-slate-800 hidden md:block">Platform Owner</span>
                        <button onClick={logout} className="ml-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Logout">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* WORKSPACE CONTENT */}
                <main className="flex-1 overflow-y-auto p-8 bg-[#f8f9fa]">
                    {actionMessage && activeTab !== 'auracare' && (
                        <div className="mb-6 p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-ping"></span>
                            {actionMessage}
                        </div>
                    )}

                    {loading && activeTab !== 'auracare' ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-2">
                            <div className="w-8 h-8 border-3 border-indigo-700/20 border-t-indigo-700 rounded-full animate-spin"></div>
                            <span className="text-xs text-slate-400">Loading system metrics...</span>
                        </div>
                    ) : (
                        renderContent()
                    )}
                </main>
            </div>
        </div>
    );
}
