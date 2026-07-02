import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';

// Import Icons from Lucide
import { 
    ShieldCheck, 
    Map, 
    Activity, 
    PieChart, 
    Globe, 
    RefreshCw 
} from 'lucide-react';

// Import Child Components
import { ClinicOnboarding } from './components/ClinicOnboarding';
import { EpidemiologyMap } from './components/EpidemiologyMap';
import { AiHealthLogs } from './components/AiHealthLogs';
import { EcosystemAnalytics } from './components/EcosystemAnalytics';

// Import Mock Data
import { 
    MOCK_PENDING_CLINICS, 
    MOCK_OUTBREAKS, 
    MOCK_DISEASE_TRENDS, 
    MOCK_AI_HEALTH, 
    MOCK_ECOSYSTEM_KPIS 
} from './mockData';

export default function AdminDashboard() {
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
            console.warn("Backend unavailable, loading local sandbox admin dashboard.");
            setIsDemoMode(true);
            
            // Populate mock data
            setPendingClinics(MOCK_PENDING_CLINICS);
            setOutbreakStats({ locations: MOCK_OUTBREAKS, trends: MOCK_DISEASE_TRENDS });
            setAiHealthStats(MOCK_AI_HEALTH);
            setEcosystemStats(MOCK_ECOSYSTEM_KPIS);
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

    const navigation = [
        { id: 'onboarding', name: 'Onboarding & Queue', icon: ShieldCheck },
        { id: 'epidemiology', name: 'Epidemiology Map', icon: Map },
        { id: 'ai-health', name: 'AI System Health', icon: Activity },
        { id: 'analytics', name: 'Ecosystem Analytics', icon: PieChart }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'onboarding':
                return <ClinicOnboarding pendingClinics={pendingClinics} onVerify={handleVerifyClinic} />;
            case 'epidemiology':
                return <EpidemiologyMap outbreakStats={outbreakStats} />;
            case 'ai-health':
                return <AiHealthLogs aiHealthStats={aiHealthStats} />;
            case 'analytics':
                return <EcosystemAnalytics ecosystemStats={ecosystemStats} />;
            default:
                return <ClinicOnboarding pendingClinics={pendingClinics} onVerify={handleVerifyClinic} />;
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] text-slate-700 flex font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
            {/* SIDEBAR */}
            <aside className="w-64 bg-white border-r border-[#e9ecef] flex flex-col shrink-0">
                <div className="p-6 border-b border-[#f1f3f5] flex items-center gap-3">
                    <img src="/logo.png" alt="HealTrack Logo" className="w-8 h-8 object-contain" />
                    <div>
                        <h2 className="font-bold text-slate-800 text-base leading-none">HealTrack</h2>
                        <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">Super Admin</span>
                    </div>
                </div>

                <nav className="flex-1 p-3 space-y-1 mt-4">
                    {navigation.map(item => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition text-sm font-semibold ${
                                    isActive 
                                        ? 'bg-indigo-50 text-indigo-800 border-r-4 border-indigo-700' 
                                        : 'text-slate-500 hover:bg-[#f1f3f5] hover:text-slate-800'
                                }`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.name}
                            </button>
                        );
                    })}
                </nav>

                {isDemoMode && (
                    <div className="p-4 m-4 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
                        <span className="text-[10px] text-indigo-700 font-extrabold uppercase tracking-wide">Demo Sandbox Mode</span>
                    </div>
                )}
            </aside>

            {/* MAIN WORKSPACE */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* HEADER */}
                <header className="h-16 bg-white border-b border-[#e9ecef] px-8 flex justify-between items-center shrink-0">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        {activeTab.replace('-', ' ')} Workstation
                    </h2>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={loadDashboardData}
                            className="p-2 hover:bg-slate-100 text-slate-500 rounded-full transition"
                            title="Refresh dashboard stats"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <div className="w-7 h-7 rounded-full bg-indigo-700 flex items-center justify-center font-bold text-white text-[11px]">
                            SA
                        </div>
                        <span className="text-xs font-semibold text-slate-800 hidden md:block">Platform Owner</span>
                    </div>
                </header>

                {/* WORKSPACE CONTENT */}
                <main className="flex-1 p-8 overflow-y-auto">
                    {actionMessage && (
                        <div className="mb-6 p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-ping"></span>
                            {actionMessage}
                        </div>
                    )}

                    {loading ? (
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
