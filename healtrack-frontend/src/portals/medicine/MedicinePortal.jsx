import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, ShoppingBag, Package, FileClock, ShieldAlert, LogOut, Activity
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

import { MedicineDashboard } from './components/MedicineDashboard';
import { PrescriptionQueue } from './components/PrescriptionQueue';
import { WalkinBilling } from './components/WalkinBilling';
import { InventoryManagement } from './components/InventoryManagement';
import { BillHistory } from './components/BillHistory';
import { AuditLogs } from './components/AuditLogs';

export default function MedicinePortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  
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

  return (
    <div className="flex h-screen bg-[#F6F8FC] overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-slate-900 text-slate-400 flex flex-col justify-between shrink-0 border-r border-slate-800 shadow-xl">
        <div className="flex flex-col">
          {/* Logo Header */}
          <div className="h-20 px-8 flex items-center gap-3 border-b border-slate-800/60">
            <div className="w-10 h-10 rounded-xl bg-indigo-650 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Activity className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-wider uppercase">HealTrack</h2>
              <span className="text-[9px] font-extrabold text-indigo-400 tracking-widest uppercase">Pharmacy Suite</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-6 space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl text-xs font-bold transition ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-650/15'
                  : 'hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              Portal Dashboard
            </button>

            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`w-full flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl text-xs font-bold transition relative ${
                activeTab === 'prescriptions'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-650/15'
                  : 'hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4.5 h-4.5" />
              Prescription Queue
              {prescriptions.length > 0 && (
                <span className="absolute right-4.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {prescriptions.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl text-xs font-bold transition ${
                activeTab === 'billing'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-650/15'
                  : 'hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              Checkout & Billing
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl text-xs font-bold transition ${
                activeTab === 'inventory'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-650/15'
                  : 'hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <Package className="w-4.5 h-4.5" />
              Inventory Stock
            </button>

            <button
              onClick={() => setActiveTab('bills')}
              className={`w-full flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl text-xs font-bold transition ${
                activeTab === 'bills'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-650/15'
                  : 'hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <FileClock className="w-4.5 h-4.5" />
              Sales History
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl text-xs font-bold transition ${
                activeTab === 'logs'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-650/15'
                  : 'hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-4.5 h-4.5" />
              Audit Journals
            </button>
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="p-6 border-t border-slate-800/60 space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center font-bold text-white uppercase text-sm border border-slate-700/50">
              {user?.name?.substring(0, 2) || 'PH'}
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-200 truncate max-w-[130px]">{user?.name || 'Pharmacist'}</h4>
              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wide">Pharmacy Staff</span>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800/50 hover:bg-rose-500/10 hover:text-rose-500 text-slate-400 rounded-2xl text-xs font-bold transition"
          >
            <LogOut className="w-4 h-4" />
            Logout Session
          </button>
        </div>
      </aside>

      {/* Main Panel Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar Header */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black tracking-wider uppercase">
              Isolated Clinic Environment
            </div>
            <span className="text-xs text-slate-400 font-bold">•</span>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{new Date().toDateString()}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchData} 
              className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition flex items-center gap-1.5"
            >
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              Live Sync Active
            </button>
          </div>
        </header>

        {/* Active Route Wrapper */}
        <div className="flex-1 overflow-y-auto p-10 bg-[#f8f9fa]">
          {renderActiveComponent()}
        </div>
      </main>
    </div>
  );
}
