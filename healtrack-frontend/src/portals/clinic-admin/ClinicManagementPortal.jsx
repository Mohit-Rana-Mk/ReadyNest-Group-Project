import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Grid, Activity, FileText, Settings, LogOut, Menu, X, ShieldAlert, Banknote, Search, Bell, ChevronDown, LifeBuoy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axiosClient, { SOCKET_URL } from '../../api/axiosClient';
import { motion } from 'framer-motion';
import { Footer } from '../../components/ui/Footer';

import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { OutbreakAlerts } from './components/OutbreakAlerts';
import { StaffManagement } from './components/StaffManagement';
import { DepartmentManager } from './components/DepartmentManager';
import { OperationsOverview } from './components/OperationsOverview';
import { ReportsAndLogs } from './components/ReportsAndLogs';
import { ClinicSettings } from './components/ClinicSettings';
import ClinicFinancials from './components/ClinicFinancials';
import { io } from 'socket.io-client';
import { Button } from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';

export default function ClinicManagementPortal() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'dashboard');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [portalData, setPortalData] = useState({
    analytics: { footfall: [], revenue: [] },
    staff: [],
    departments: [],
    operations: []
  });

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  const clinicId = user?.clinic_id || 1;

  const fetchPortalData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [analyticsRes, staffRes, departmentsRes, operationsRes] = await Promise.all([
        axiosClient.get(`/clinic-admin/${clinicId}/analytics`),
        axiosClient.get(`/clinic-admin/${clinicId}/staff`),
        axiosClient.get(`/clinic-admin/${clinicId}/departments`),
        axiosClient.get(`/clinic-admin/${clinicId}/operations`)
      ]);

      setPortalData({
        analytics: analyticsRes.data,
        staff: staffRes.data,
        departments: departmentsRes.data,
        operations: operationsRes.data
      });
    } catch (error) {
      console.error('Error fetching clinic portal data:', error);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    fetchPortalData();
    
    const socket = io(SOCKET_URL);
    socket.on('QUEUE_UPDATE', (data) => {
        fetchPortalData();
    });

    return () => {
        socket.disconnect();
    };
  }, [fetchPortalData]);

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'financials', name: 'Earnings & Settlements', icon: Banknote },
    { id: 'outbreak-alerts', name: 'Outbreak Alerts', icon: ShieldAlert },
    { id: 'staff', name: 'Staff Management', icon: Users },
    { id: 'departments', name: 'Departments', icon: Grid },
    { id: 'operations', name: 'Operations', icon: Activity },
    { id: 'reports', name: 'Reports & Logs', icon: FileText },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    if (loading) return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm space-y-3">
              <Skeleton className="w-24 h-4" />
              <Skeleton className="w-12 h-8" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm min-h-[400px] flex flex-col">
             <Skeleton className="w-48 h-6 mb-6" />
             <div className="flex-1 space-y-4">
               <Skeleton className="w-full h-16 rounded-lg" />
               <Skeleton className="w-full h-16 rounded-lg" />
               <Skeleton className="w-full h-16 rounded-lg" />
             </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm min-h-[400px] flex flex-col">
             <Skeleton className="w-32 h-6 mb-6" />
             <div className="flex-1 space-y-4">
               <Skeleton className="w-full h-12 rounded-lg" />
               <Skeleton className="w-full h-12 rounded-lg" />
               <Skeleton className="w-full h-12 rounded-lg" />
               <Skeleton className="w-full h-12 rounded-lg" />
             </div>
          </div>
        </div>
      </div>
    );

    switch (activeTab) {
      case 'dashboard': return <AnalyticsDashboard data={portalData.analytics} clinicId={clinicId} />;
      case 'financials': return <ClinicFinancials clinicId={clinicId} />;
      case 'outbreak-alerts': return <OutbreakAlerts clinicId={clinicId} />;
      case 'staff': return <StaffManagement staff={portalData.staff} refreshData={fetchPortalData} clinicId={clinicId} />;
      case 'departments': return <DepartmentManager departments={portalData.departments} refreshData={fetchPortalData} clinicId={clinicId} />;
      case 'operations': return <OperationsOverview operations={portalData.operations} clinicId={clinicId} />;
      case 'reports': return <ReportsAndLogs clinicId={clinicId} />;
      case 'settings': return <ClinicSettings clinicId={clinicId} />;
      default: return <AnalyticsDashboard data={portalData.analytics} clinicId={clinicId} />;
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-1">
          <img src="/logo.png" alt="HealTrack Logo" className="w-10 h-10 object-contain rounded-xl shadow-sm" />
          <div>
            <h1 className="text-xl font-black tracking-wide">
              <span className="text-white">Heal</span>
              <span className="text-cyan-400">Track</span>
            </h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden ml-auto p-1 text-slate-400 hover:text-white bg-transparent outline-none focus:outline-none">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex !justify-start items-center space-x-4 px-5 py-4 rounded-[20px] transition-all transform hover:-translate-y-0.5 active:scale-95 border-none outline-none focus:outline-none focus:ring-0 bg-transparent group ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-indigo-400'
              }`}
            >
              <item.icon className={`w-6 h-6 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`} />
              <span className={`font-semibold text-[15px] ${isActive ? 'text-white' : ''}`}>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-slate-800/50 rounded-[20px] p-5 mb-4 border border-slate-700/50 flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-full bg-slate-900 shadow-sm flex items-center justify-center mb-3">
            <LifeBuoy className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-sm font-bold text-white">Need help?</p>
          <p className="text-xs text-slate-400 font-medium mt-1 mb-3">Check our docs or contact support</p>
          <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white border-none rounded-[14px] shadow-sm text-xs py-2">
            Support Center
          </Button>
        </div>
        {/* Sign out moved to top bar */}
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-[#F6F8FC] flex overflow-hidden font-sans text-slate-800">
      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] flex flex-col z-[70] shadow-2xl rounded-r-[28px] border-r border-white/5">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* DESKTOP FLOATING SIDEBAR */}
      <aside className="fixed top-6 left-6 bottom-20 w-[300px] rounded-[28px] bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] border border-white/5 shadow-[0_10px_40px_rgb(0,0,0,0.4)] hidden md:flex flex-col z-50">
        {sidebarContent}
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative pb-20">
        {/* FLOATING NAVBAR */}
        <header className="hidden md:flex ml-[345px] mr-6 mt-6 h-20 rounded-[28px] bg-gradient-to-r from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.3)] items-center justify-between px-6 z-40 sticky top-6 shrink-0">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Welcome back, {user?.name || 'Clinic Admin'} <span className="text-xl">👋</span>
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Here's what's happening at {user?.clinic_name || 'your clinic'} today.
            </p>
          </div>
          
          <div className="flex items-center gap-5 pl-6">
            {/* Clinic Name Box */}
            {user?.clinic_name && (
              <div className="hidden lg:flex items-center px-4 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-2xl transition-colors cursor-pointer">
                <span className="text-sm font-bold text-slate-200">{user.clinic_name}</span>
              </div>
            )}
            {/* Profile Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-semibold tracking-wide">{user?.name ? user.name.substring(0, 2).toUpperCase() : 'CA'}</span>
              </div>
              <div className="flex flex-col items-start hidden sm:flex">
                <span className="text-sm font-bold text-white leading-tight mb-0.5">{user?.name || 'Clinic Admin'}</span>
                <span className="text-xs font-medium text-slate-400 leading-tight">Administrator</span>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-800 hidden sm:block"></div>
            {/* Sign Out Button - Rightmost */}
            <button onClick={logout} className="flex items-center justify-center p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors" title="Sign Out">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* MOBILE HEADER */}
        <div className="md:hidden bg-gradient-to-r from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] border-b border-white/5 p-4 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 border-none bg-transparent rounded-xl">
              <Menu className="w-6 h-6" />
            </Button>
            <h1 className="text-lg font-bold text-white">HealTrack</h1>
          </div>
          <button className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-inner">
            <span className="text-white text-xs font-bold">{user?.name ? user.name.substring(0, 2).toUpperCase() : 'AD'}</span>
          </button>
        </div>

        <div className="flex-1 md:ml-[345px] p-4 md:p-6 lg:p-6 mt-4 md:mt-2 max-w-[1400px] flex flex-col">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1"
          >
            {renderContent()}
          </motion.div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-t border-slate-200">
          <Footer />
        </div>
      </main>
    </div>
  );
}
