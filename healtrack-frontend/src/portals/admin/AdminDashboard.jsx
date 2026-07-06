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
    LogOut,
    Menu,
    X,
    Users,
    Coins
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Import Child Components
import { ClinicOnboarding } from './components/ClinicOnboarding';
import { EpidemiologyMap } from './components/EpidemiologyMap';
import { AiHealthLogs } from './components/AiHealthLogs';
import { EcosystemAnalytics } from './components/EcosystemAnalytics';
import { AuraCareDashboard } from './components/AuraCareDashboard';
import { PatientAnalytics } from './components/PatientAnalytics';
import { AdminPaymentsDashboard } from './components/AdminPaymentsDashboard';
import { Button } from '../../components/ui/Button';

export default function AdminDashboard() {
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState('onboarding');
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    // States
    const [pendingClinics, setPendingClinics] = useState([]);
    const [outbreakStats, setOutbreakStats] = useState({ locations: [], trends: [] });
    const [aiHealthStats, setAiHealthStats] = useState({ triageRiskRatios: {}, preventiveRecsSent: 0 });
    const [ecosystemStats, setEcosystemStats] = useState({ kpis: {}, reviews: [] });
    const [actionMessage, setActionMessage] = useState('');
    const [epiFilter, setEpiFilter] = useState(30);

    useEffect(() => {
        loadDashboardData();
    }, [activeTab, epiFilter]);

    const loadDashboardData = async () => {
        if (activeTab === 'auracare' || activeTab === 'patient-analytics' || activeTab === 'payments') return; // Handled internally by component
        setLoading(true);
        try {
            if (activeTab === 'onboarding') {
                const res = await axiosClient.get('/admin/pending-clinics');
                setPendingClinics(res.data.data);
            } else if (activeTab === 'epidemiology') {
                const res = await axiosClient.get(`/admin/epidemiology?days=${epiFilter}`);
                setOutbreakStats(res.data.data);
            } else if (activeTab === 'ai-health') {
                const res = await axiosClient.get('/admin/ai-health');
                setAiHealthStats(res.data.data);
            } else if (activeTab === 'analytics') {
                const res = await axiosClient.get('/admin/ecosystem-kpis');
                setEcosystemStats(res.data.data);
            }
        } catch (error) {
            console.error("Error loading dashboard data:", error);
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
            const res = await axiosClient.post('/admin/verify-clinic', { clinicId, status });
            if (res.data.success) {
                setActionMessage(res.data.message);
                loadDashboardData();
                setTimeout(() => setActionMessage(''), 3000);
            }
        } catch (error) {
            console.error("Verification failed:", error);
            alert("Failed to update verification status.");
        }
    };

    const handleOnboardClinic = async (formData) => {
        try {
            const res = await axiosClient.post('/admin/create-clinic', formData);
            if (res.data.success) {
                setActionMessage(res.data.message);
                loadDashboardData();
                setTimeout(() => setActionMessage(''), 3000);
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
        { id: 'patient-analytics', name: 'Patient Analytics', icon: Users },
        { id: 'auracare', name: 'AuraCare Predictive AI', icon: Globe },
        { id: 'payments', name: 'Payments & Settlements', icon: Coins }
    ];

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSidebarOpen(false);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'onboarding':
                return <ClinicOnboarding pendingClinics={pendingClinics} onVerify={handleVerifyClinic} onOnboardClinic={handleOnboardClinic} />;
            case 'epidemiology':
                return <EpidemiologyMap outbreakStats={outbreakStats} filter={epiFilter} setFilter={setEpiFilter} />;
            case 'ai-health':
                return <AiHealthLogs aiHealthStats={aiHealthStats} />;
            case 'analytics':
                return <EcosystemAnalytics ecosystemStats={ecosystemStats} onVerify={handleVerifyClinic} />;
            case 'patient-analytics':
                return <PatientAnalytics />;
            case 'payments':
                return <AdminPaymentsDashboard />;
            case 'auracare':
                return <AuraCareDashboard />;
            default:
                return <ClinicOnboarding pendingClinics={pendingClinics} onVerify={handleVerifyClinic} onOnboardClinic={handleOnboardClinic} />;
        }
    };

    const sidebarContent = (
        <>
            <div className="p-4 lg:p-6 border-b flex items-center gap-3 border-[#f1f3f5]">
                <img src="/logo.png" alt="HealTrack Logo" className="w-8 h-8 object-contain" />
                <div>
                    <h2 className="font-bold text-base leading-none text-slate-800">HealTrack</h2>
                    <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">Super Admin</span>
                </div>
                <Button variant="outline" onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto p-1 text-slate-400 hover:text-slate-600 border-none bg-transparent">
                    <X className="w-5 h-5" />
                </Button>
            </div>

            <nav className="flex-1 p-3 space-y-1 mt-4 overflow-y-auto">
                {navigation.map(item => {
                    const isActive = activeTab === item.id;
                    const activeClass = item.id === 'auracare'
                        ? 'bg-cyan-50 text-cyan-700 border-r-4 border-cyan-500'
                        : 'bg-indigo-50 text-indigo-800 border-r-4 border-indigo-700';
                    return (
                        <Button
                            variant="outline"
                            key={item.id}
                            onClick={() => handleTabChange(item.id)}
                            className={`w-full flex justify-start items-center gap-3 px-4 py-2.5 rounded-xl transition text-sm font-semibold border-none bg-transparent ${
                                isActive 
                                    ? activeClass 
                                    : 'text-slate-500 hover:bg-[#f1f3f5] hover:text-slate-800'
                            }`}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.name}
                        </Button>
                    );
                })}
            </nav>
        </>
    );

    return (
        <div className="min-h-screen flex font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900 bg-[#f8f9fa] text-slate-700">
            {/* MOBILE SIDEBAR OVERLAY */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
                    <aside className="fixed inset-y-0 left-0 w-72 bg-white flex flex-col z-50 shadow-xl">
                        {sidebarContent}
                    </aside>
                </div>
            )}

            {/* DESKTOP SIDEBAR */}
            <aside className="w-64 border-r hidden lg:flex flex-col shrink-0 bg-white border-[#e9ecef]">
                {sidebarContent}
            </aside>

            {/* MAIN WORKSPACE */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* HEADER */}
                <header className="h-14 lg:h-16 border-b px-4 lg:px-8 flex justify-between items-center shrink-0 bg-white border-[#e9ecef]">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg border-none bg-transparent">
                            <Menu className="w-5 h-5" />
                        </Button>
                        <h2 className={`text-xs lg:text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${activeTab === 'auracare' ? 'text-cyan-600' : 'text-slate-800'}`}>
                            {activeTab.replace('-', ' ')} Workstation
                        </h2>
                    </div>
                    <div className="flex items-center gap-2 lg:gap-4">
                        {activeTab !== 'auracare' && activeTab !== 'payments' && (
                            <Button 
                                variant="outline"
                                onClick={loadDashboardData}
                                className="p-2 hover:bg-slate-100 text-slate-500 rounded-full transition border-none bg-transparent"
                                title="Refresh dashboard stats"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        )}
                        <div className="w-7 h-7 rounded-full bg-indigo-700 flex items-center justify-center font-bold text-white text-[11px]">
                            SA
                        </div>
                        <span className="text-xs font-semibold text-slate-800 hidden md:block">Platform Owner</span>
                        <Button variant="outline" onClick={logout} className="ml-1 lg:ml-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition border-none bg-transparent" title="Logout">
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </header>

                {/* WORKSPACE CONTENT */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-[#f8f9fa]">
                    {actionMessage && activeTab !== 'auracare' && (
                        <div className="mb-4 lg:mb-6 p-3 lg:p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-ping"></span>
                            {actionMessage}
                        </div>
                    )}

                    {/* Metrics Ribbon Grid */}
                    {activeTab !== 'auracare' && activeTab !== 'patient-analytics' && activeTab !== 'payments' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white border border-[#e9ecef] rounded-2xl p-5 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Triage Triggers</span>
                                    <span className="text-2xl font-extrabold text-slate-800 mt-1 block">
                                        {aiHealthStats?.preventiveRecsSent || 1420}
                                    </span>
                                </div>
                                <div className="text-indigo-600 bg-indigo-50 p-2.5 rounded-xl">
                                    <Activity className="w-5 h-5 stroke-[2]" />
                                </div>
                            </div>
                            <div className="bg-white border border-[#e9ecef] rounded-2xl p-5 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Approvals</span>
                                    <span className="text-2xl font-extrabold text-slate-800 mt-1 block">
                                        {pendingClinics?.length || 0}
                                    </span>
                                </div>
                                <div className="text-yellow-600 bg-yellow-50 p-2.5 rounded-xl">
                                    <ShieldCheck className="w-5 h-5 stroke-[2]" />
                                </div>
                            </div>
                            <div className="bg-white border border-[#e9ecef] rounded-2xl p-5 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">SVM Inference Status</span>
                                    <span className="text-2xl font-extrabold text-slate-850 mt-1 block text-emerald-600 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Active
                                    </span>
                                </div>
                                <div className="text-emerald-600 bg-emerald-50 p-2.5 rounded-xl">
                                    <Globe className="w-5 h-5 stroke-[2]" />
                                </div>
                            </div>
                            <div className="bg-white border border-[#e9ecef] rounded-2xl p-5 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">System Availability</span>
                                    <span className="text-2xl font-extrabold text-slate-800 mt-1 block">
                                        99.98%
                                    </span>
                                </div>
                                <div className="text-indigo-600 bg-indigo-50 p-2.5 rounded-xl">
                                    <RefreshCw className="w-5 h-5 stroke-[2]" />
                                </div>
                            </div>
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
