import { toast } from '../../components/ui/Toast';
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
    Coins,
    FlaskConical,
    LifeBuoy
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CountUp from 'react-countup';

// Import Child Components
import { ClinicOnboarding } from './components/ClinicOnboarding';
import { EpidemiologyMap } from './components/EpidemiologyMap';
import { AiHealthLogs } from './components/AiHealthLogs';
import { EcosystemAnalytics } from './components/EcosystemAnalytics';
import { AuraCareDashboard } from './components/AuraCareDashboard';
import { PatientAnalytics } from './components/PatientAnalytics';
import { AdminPaymentsDashboard } from './components/AdminPaymentsDashboard';
import PharmacyAccounts from './components/PharmacyAccounts';
import SupportDesk from './components/SupportDesk';
import RaiseTicketModal from '../../components/ui/RaiseTicketModal';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import Skeleton from '../../components/ui/Skeleton';
import { Footer } from '../../components/ui/Footer';

import { useLocation } from 'react-router-dom';

export default function AdminDashboard() {
    const location = useLocation();
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState(location.state?.tab || 'onboarding');
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
        }
    }, [location.state]);
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    // States
    const [pendingClinics, setPendingClinics] = useState([]);
    const [outbreakStats, setOutbreakStats] = useState({ locations: [], trends: [] });
    const [aiHealthStats, setAiHealthStats] = useState({ triageRiskRatios: {}, preventiveRecsSent: 0, triageCount: 0 });
    const [ecosystemStats, setEcosystemStats] = useState({ kpis: {}, reviews: [] });
    const [actionMessage, setActionMessage] = useState('');
    const [epiFilter, setEpiFilter] = useState(30);
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        loadDashboardData();
    }, [activeTab, epiFilter]);

    const loadDashboardData = async () => {
        if (activeTab === 'auracare' || activeTab === 'patient-analytics' || activeTab === 'payments' || activeTab === 'pharmacy-accounts') return; // Handled internally by component
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
            setAiHealthStats({ triageRiskRatios: {}, preventiveRecsSent: 0, triageCount: 0 });
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
            toast.error("Failed to update verification status.");
        }
    };

    const handleOnboardClinic = async (formData) => {
        try {
            const res = await axiosClient.post('/admin/create-clinic', formData);
            if (res.data.success) {
                setActionMessage(res.data.message);
                loadDashboardData();
                setTimeout(() => setActionMessage(''), 5000);
                return res.data;
            }
        } catch (error) {
            console.error("Direct onboarding failed:", error);
            toast.error(error.response?.data?.message || "Failed to onboard clinic.");
            throw error;
        }
    };

    const handleDeleteClinic = (clinicId) => {
        setDeleteTarget(clinicId);
    };

    const confirmDeleteClinic = async () => {
        if (!deleteTarget) return;
        try {
            const res = await axiosClient.delete(`/admin/clinics/${deleteTarget}`);
            if (res.data.success) {
                setActionMessage(res.data.message);
                loadDashboardData();
                setTimeout(() => setActionMessage(''), 3000);
            }
        } catch (error) {
            console.error("Failed to delete clinic:", error);
            toast.error("Failed to delete clinic.");
        } finally {
            setDeleteTarget(null);
        }
    };

    const navigation = [
        { id: 'onboarding', name: 'Onboarding & Queue', icon: ShieldCheck },
        { id: 'epidemiology', name: 'Epidemiology Map', icon: Map },
        { id: 'ai-health', name: 'AI System Health', icon: Activity },
        { id: 'analytics', name: 'Ecosystem Analytics', icon: PieChart },
        { id: 'patient-analytics', name: 'Patient Analytics', icon: Users },
        { id: 'auracare', name: 'AuraCare Predictive AI', icon: Globe },
        { id: 'payments', name: 'Payments & Settlements', icon: Coins },
        { id: 'pharmacy-accounts', name: 'Pharmacy Accounts', icon: FlaskConical },
        { id: 'support-desk', name: 'Support Desk', icon: LifeBuoy }
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
                return <EcosystemAnalytics ecosystemStats={ecosystemStats} onVerify={handleVerifyClinic} onDeleteClinic={handleDeleteClinic} />;
            case 'patient-analytics':
                return <PatientAnalytics />;
            case 'payments':
                return <AdminPaymentsDashboard />;
            case 'auracare':
                return <AuraCareDashboard />;
            case 'pharmacy-accounts':
                return <PharmacyAccounts />;
            case 'support-desk':
                return <SupportDesk />;
            default:
                return <ClinicOnboarding pendingClinics={pendingClinics} onVerify={handleVerifyClinic} onOnboardClinic={handleOnboardClinic} />;
        }
    };

    const sidebarContent = (
        <div className="flex flex-col h-full text-slate-200">
            <div className="p-5 border-b border-white/10 flex items-center gap-3">
                <img src="/logo.png" alt="HealTrack Logo" className="w-8 h-8 object-contain rounded-xl shadow-sm" />
                <div>
                    <h2 className="font-bold text-base leading-none text-white">Heal<span className="text-cyan-400">Track</span></h2>
                </div>
                <Button variant="outline" onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto p-1 text-slate-400 hover:text-white border-none bg-transparent">
                    <X className="w-5 h-5" />
                </Button>
            </div>

            <nav className="flex-1 px-3 space-y-2 mt-3 overflow-y-auto">
                {navigation.map(item => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleTabChange(item.id)}
                            className={`w-full flex !justify-start items-center space-x-3.5 px-4 py-3 rounded-[18px] transition-all transform hover:-translate-y-0.5 active:scale-95 border-none outline-none focus:outline-none focus:ring-0 bg-transparent group cursor-pointer ${
                                isActive 
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-indigo-400'
                            }`}
                        >
                            <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                            <span className={`font-semibold text-xs tracking-wide ${isActive ? 'text-white' : ''}`}>{item.name}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );

    return (
        <div className="h-screen overflow-hidden flex font-sans antialiased bg-[#f8f9fa] text-slate-700">
            {/* MOBILE SIDEBAR OVERLAY */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                    <aside className="fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] border-r border-white/10 flex flex-col z-50 shadow-2xl">
                        {sidebarContent}
                    </aside>
                </div>
            )}

            {/* Confirm Modal for Clinic Deletion */}
            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDeleteClinic}
                title="Delete Clinic Facility?"
                message="Are you sure you want to permanently delete this clinic facility? This action will permanently remove all associated appointments, reviews, outbreaks, and administrator accounts and cannot be undone."
                confirmText="Yes, Delete Clinic"
                isDestructive={true}
            />

            {/* DESKTOP FLOATING SIDEBAR (CLOSE TO CORNERS) */}
            <aside className="fixed top-3 left-3 bottom-20 w-64 rounded-2xl bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] border border-white/10 shadow-xl hidden lg:flex flex-col z-50 overflow-hidden">
                {sidebarContent}
            </aside>

            {/* MAIN WORKSPACE */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* FLOATING TOPBAR (CLOSE TO CORNERS) */}
                <header className="hidden lg:flex ml-[276px] mr-3 mt-3 h-14 rounded-2xl bg-gradient-to-r from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] border border-white/10 shadow-lg items-center justify-between px-6 z-40 sticky top-3 shrink-0">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xs lg:text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                            {activeTab.replace('-', ' ')} <span className="text-cyan-400">Workstation</span>
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        {activeTab !== 'auracare' && activeTab !== 'payments' && (
                            <Button 
                                variant="outline"
                                onClick={loadDashboardData}
                                className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full transition border-none bg-transparent"
                                title="Refresh dashboard stats"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        )}
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                                SA
                            </div>
                            <div className="hidden md:flex flex-col justify-center leading-tight">
                                <span className="text-xs font-bold text-white">Super Admin</span>
                                <span className="text-[10px] font-medium text-cyan-400">Platform Owner</span>
                            </div>
                        </div>
                        <div className="h-5 w-px bg-slate-800 hidden md:block"></div>
                        <Button 
                            variant="outline" 
                            onClick={logout} 
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition border-none bg-transparent cursor-pointer" 
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </header>

                {/* MOBILE TOPBAR */}
                <header className="lg:hidden h-14 bg-gradient-to-r from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] border-b border-white/10 px-4 flex justify-between items-center sticky top-0 z-40">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => setSidebarOpen(true)} className="p-1.5 text-slate-300 hover:bg-slate-800 rounded-lg border-none bg-transparent">
                            <Menu className="w-5 h-5" />
                        </Button>
                        <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                            {activeTab.replace('-', ' ')}
                        </h2>
                    </div>
                    <Button variant="outline" onClick={logout} className="p-1.5 text-slate-400 hover:text-rose-400 border-none bg-transparent">
                        <LogOut className="w-4 h-4" />
                    </Button>
                </header>

                {/* WORKSPACE CONTENT */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-6 lg:ml-[264px] bg-[#f8f9fa] flex flex-col pb-36 lg:pb-40">
                    <div className="flex-1 flex flex-col min-h-[calc(100vh-4rem)]">
                    {actionMessage && activeTab !== 'auracare' && (
                        <div className="mb-4 lg:mb-6 p-3 lg:p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-ping"></span>
                            {actionMessage}
                        </div>
                    )}

                    {loading && activeTab !== 'auracare' ? (
                        <div className="space-y-6">
                            {activeTab !== 'patient-analytics' && activeTab !== 'payments' && activeTab !== 'pharmacy-accounts' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="bg-white border border-[#e9ecef] rounded-2xl p-5 shadow-sm flex items-center justify-between">
                                            <div className="space-y-3">
                                                <Skeleton className="w-24 h-3" />
                                                <Skeleton className="w-12 h-6" />
                                            </div>
                                            <Skeleton className="w-10 h-10 rounded-xl" />
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="bg-white border border-[#e9ecef] rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col space-y-6">
                                <div className="flex justify-between items-center mb-4">
                                    <Skeleton className="w-48 h-6" />
                                    <Skeleton className="w-32 h-8 rounded-lg" />
                                </div>
                                <div className="space-y-4">
                                    <Skeleton className="w-full h-16 rounded-xl" />
                                    <Skeleton className="w-full h-16 rounded-xl" />
                                    <Skeleton className="w-full h-16 rounded-xl" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Metrics Ribbon Grid */}
                            {activeTab !== 'auracare' && activeTab !== 'patient-analytics' && activeTab !== 'payments' && activeTab !== 'pharmacy-accounts' && activeTab !== 'support-desk' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-white border border-[#e9ecef] rounded-2xl p-5 shadow-sm flex items-center justify-between">
                                        <div>
                                            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Triage Triggers</span>
                                            <span className="text-2xl font-extrabold text-slate-800 mt-1 block">
                                                <CountUp end={aiHealthStats?.triageCount ?? 0} duration={2} />
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
                                                <CountUp end={pendingClinics?.length || 0} duration={2} />
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
                                                <CountUp end={99.98} duration={2} decimals={2} suffix="%" />
                                            </span>
                                        </div>
                                        <div className="text-indigo-600 bg-indigo-50 p-2.5 rounded-xl">
                                            <RefreshCw className="w-5 h-5 stroke-[2]" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'support-desk' ? (
                                <SupportDesk />
                            ) : (
                                renderContent()
                            )}
                        </>
                    )}
                    </div>
                    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-t border-slate-200">
                    <Footer />
                </div>
            </main>

            <RaiseTicketModal
                isOpen={isTicketModalOpen}
                onClose={() => setIsTicketModalOpen(false)}
                portalUsed="Super Admin Portal"
            />
        </div>
    </div>
  );
}
