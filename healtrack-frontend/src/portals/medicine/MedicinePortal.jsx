import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, ShoppingBag, Package, FileClock, ShieldAlert, LogOut, Activity, LifeBuoy
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { Footer } from '../../components/ui/Footer';
import { Button } from '../../components/ui/Button';
import RaiseTicketModal from '../../components/ui/RaiseTicketModal';

import { MedicineDashboard } from './components/MedicineDashboard';
import { PrescriptionQueue } from './components/PrescriptionQueue';
import { WalkinBilling } from './components/WalkinBilling';
import { InventoryManagement } from './components/InventoryManagement';
import { BillHistory } from './components/BillHistory';
import { AuditLogs } from './components/AuditLogs';

const getInitials = (name) => {
  if (!name) return 'PH';
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};

import { useLocation } from 'react-router-dom';

export default function MedicinePortal() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'dashboard');
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  useEffect(() => {
      if (location.state?.tab) {
          setActiveTab(location.state.tab);
      }
  }, [location.state]);
  
  // Selected Prescription for Billing
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  // States
  const [prescriptions, setPrescriptions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [bills, setBills] = useState([]);
  const [reports, setReports] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  // Loadings
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prescRes, stockRes, billsRes, reportsRes, auditRes] = await Promise.all([
        axiosClient.get('/medicine/prescriptions'),
        axiosClient.get('/medicine/stock'),
        axiosClient.get('/medicine/bills'),
        axiosClient.get('/medicine/reports'),
        axiosClient.get('/medicine/audit-logs')
      ]);

      setPrescriptions(prescRes.data);
      setInventory(stockRes.data);
      setBills(billsRes.data);
      setReports(reportsRes.data);
      setAuditLogs(auditRes.data);
    } catch (err) {
      console.error("Error fetching medicine portal data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectPrescriptionForCheckout = (presc) => {
    setSelectedPrescription(presc);
    setActiveTab('billing');
  };

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <MedicineDashboard reports={reports} inventory={inventory} prescriptions={prescriptions} loading={loading} />;
      case 'prescriptions':
        return <PrescriptionQueue prescriptions={prescriptions} onSelectPrescription={selectPrescriptionForCheckout} loading={loading} />;
      case 'billing':
        return (
          <WalkinBilling 
            selectedPrescription={selectedPrescription} 
            clearPrescription={() => setSelectedPrescription(null)} 
            inventory={inventory} 
            refreshData={fetchData}
          />
        );
      case 'inventory':
        return <InventoryManagement inventory={inventory} refreshData={fetchData} />;
      case 'bills':
        return <BillHistory bills={bills} />;
      case 'logs':
        return <AuditLogs logs={auditLogs} />;
      default:
        return <MedicineDashboard reports={reports} inventory={inventory} prescriptions={prescriptions} loading={loading} />;
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full text-slate-200 justify-between">
      <div>
        {/* Logo Header */}
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <img src="/logo.png" alt="HealTrack Logo" className="w-8 h-8 object-contain rounded-xl shadow-sm" />
          <div>
            <h2 className="font-bold text-base leading-none text-white">Heal<span className="text-cyan-400">Track Pharmacy</span></h2>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-2 mt-2 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Portal Dashboard', icon: LayoutDashboard },
            { id: 'prescriptions', label: 'Prescription Queue', icon: FileText, badge: prescriptions.length },
            { id: 'billing', label: 'Checkout & Billing', icon: ShoppingBag },
            { id: 'inventory', label: 'Inventory Stock', icon: Package },
            { id: 'bills', label: 'Sales History', icon: FileClock },
            { id: 'logs', label: 'Audit Journals', icon: ShieldAlert },
          ].map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-[18px] transition-all transform hover:-translate-y-0.5 active:scale-95 border-none outline-none cursor-pointer group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-cyan-400'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-400'}`} />
                <span className={`font-semibold text-xs tracking-wide ${isActive ? 'text-white' : ''}`}>{item.label}</span>
                {item.badge > 0 && (
                  <span className="ml-auto w-5 h-5 bg-rose-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center shadow-sm">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Need Help Support Box (Same as Clinic Admin) */}
      <div className="p-4 mt-auto">
        <div className="bg-slate-800/50 rounded-[20px] p-4 border border-slate-700/50 flex flex-col items-center text-center">
          <div className="w-9 h-9 rounded-full bg-slate-900 shadow-sm flex items-center justify-center mb-2">
            <LifeBuoy className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xs font-bold text-white">Need help?</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5 mb-2.5">Check our docs or contact support</p>
          <Button 
            onClick={() => setIsTicketModalOpen(true)}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white border-none rounded-[12px] shadow-sm text-xs py-1.5 cursor-pointer"
          >
            Support Center
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden flex font-sans antialiased bg-[#f8f9fa] text-slate-700">
      
      {/* DESKTOP FLOATING SIDEBAR (CLOSE TO CORNERS) */}
      <aside className="fixed top-3 left-3 bottom-20 w-64 rounded-2xl bg-gradient-to-b from-[#0B132B] via-[#1C2541] to-[#0B132B] border border-white/10 shadow-xl hidden lg:flex flex-col z-50 overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Main Panel Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* FLOATING TOPBAR (CLOSE TO CORNERS) */}
        <header className="hidden lg:flex ml-[276px] mr-3 mt-3 h-14 rounded-2xl bg-gradient-to-r from-[#0B132B] via-[#1C2541] to-[#0B132B] border border-white/10 shadow-lg items-center justify-between px-6 z-40 sticky top-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 bg-slate-800/80 border border-slate-700 text-cyan-400 rounded-full text-[10px] font-extrabold tracking-wider uppercase">
              Isolated Clinic Environment
            </span>
            <span className="text-xs text-slate-400 font-bold">•</span>
            <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">{new Date().toDateString()}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchData} 
              className="text-xs font-bold text-slate-300 hover:text-cyan-400 transition flex items-center gap-1.5 bg-transparent border-none cursor-pointer"
            >
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
              Live Sync Active
            </button>
            <div className="h-5 w-px bg-slate-800"></div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                {getInitials(user?.name)}
              </div>
              <div className="hidden md:flex flex-col justify-center leading-tight">
                <span className="text-xs font-bold text-white">{user?.name || 'Pharmacist'}</span>
                <span className="text-[10px] font-medium text-cyan-400">Pharmacy Staff</span>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition border-none bg-transparent cursor-pointer" 
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* MOBILE TOPBAR */}
        <header className="lg:hidden h-14 bg-gradient-to-r from-[#0B132B] via-[#1C2541] to-[#0B132B] border-b border-white/10 px-4 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              Pharmacy Suite
            </h2>
          </div>
          <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-rose-400 border-none bg-transparent">
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* Active Route Wrapper */}
        <div className="flex-1 overflow-y-auto p-4 lg:px-6 lg:pt-2 pb-36 lg:pb-36 lg:ml-[264px] bg-[#f8f9fa] flex flex-col">
          <div className="flex-1 min-h-[calc(100vh-4rem)] flex flex-col">
            {renderActiveComponent()}
          </div>
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-t border-slate-200">
            <Footer />
          </div>
        </div>
      </div>

      <RaiseTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        portalUsed="Pharmacy Suite"
      />
    </div>
  );
}
