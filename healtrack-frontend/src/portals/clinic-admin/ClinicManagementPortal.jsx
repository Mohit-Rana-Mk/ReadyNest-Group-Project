import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Grid, Activity, FileText, Settings, LogOut, Menu, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axiosClient, { SOCKET_URL } from '../../api/axiosClient';

import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { OutbreakAlerts } from './components/OutbreakAlerts';
import { StaffManagement } from './components/StaffManagement';
import { DepartmentManager } from './components/DepartmentManager';
import { OperationsOverview } from './components/OperationsOverview';
import { ReportsAndLogs } from './components/ReportsAndLogs';
import { ClinicSettings } from './components/ClinicSettings';
import { io } from 'socket.io-client';

export default function ClinicManagementPortal() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [portalData, setPortalData] = useState({
    analytics: { footfall: [], revenue: [] },
    staff: [],
    departments: [],
    operations: []
  });

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
    if (loading) return <div className="p-8 text-center text-gray-500">Loading portal data...</div>;

    switch (activeTab) {
      case 'dashboard': return <AnalyticsDashboard data={portalData.analytics} clinicId={clinicId} />;
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
    <>
      <div className="p-4 md:p-6">
        <div className="flex items-center gap-3 mb-1">
          <img src="/logo.png" alt="HealTrack Logo" className="w-8 h-8 object-contain" />
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-wide">HealTrack AI</h1>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden ml-auto p-1 text-indigo-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-indigo-300 text-sm pl-11 mt-1">Admin Portal</p>
        {user?.clinic_name && (
          <div className="mt-4 px-2 py-2 bg-indigo-800/50 rounded-xl border border-indigo-700/50">
            <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-1">Clinic</div>
            <div className="text-white text-sm font-semibold">{user.clinic_name}</div>
          </div>
        )}
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-indigo-800 text-white' : 'text-indigo-100 hover:bg-indigo-800/50 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-indigo-300'}`} />
              <span className="font-medium">{item.name}</span>
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-indigo-800">
        <button onClick={logout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-indigo-100 hover:bg-indigo-800/50 hover:text-white transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-72 bg-indigo-900 text-white flex flex-col z-50 shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="w-64 bg-indigo-900 text-white flex-shrink-0 hidden md:flex flex-col">
        {sidebarContent}
      </aside>

      <main className="flex-1 overflow-y-auto">
        {/* MOBILE HEADER */}
        <div className="md:hidden bg-indigo-900 p-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-1.5 text-indigo-200 hover:text-white">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">HealTrack Admin</h1>
          </div>
          <button onClick={logout} className="p-1.5 text-indigo-200 hover:text-white">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
