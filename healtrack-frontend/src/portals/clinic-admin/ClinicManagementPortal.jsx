import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Grid, Activity, FileText, Settings } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { StaffManagement } from './components/StaffManagement';
import { DepartmentManager } from './components/DepartmentManager';
import { OperationsOverview } from './components/OperationsOverview';
import { ReportsAndLogs } from './components/ReportsAndLogs';
import { ClinicSettings } from './components/ClinicSettings';
import { io } from 'socket.io-client';

export default function ClinicManagementPortal() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [portalData, setPortalData] = useState({
    analytics: { footfall: [], revenue: [] },
    staff: [],
    departments: [],
    operations: []
  });

  const clinicId = 1; // Hardcoded for this phase

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
    
    const socket = io('http://localhost:5001');
    socket.on('QUEUE_UPDATE', () => {
        console.log("Realtime event received: QUEUE_UPDATE");
        fetchPortalData();
    });

    return () => {
        socket.disconnect();
    };
  }, [fetchPortalData]);

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'staff', name: 'Staff Management', icon: Users },
    { id: 'departments', name: 'Departments', icon: Grid },
    { id: 'operations', name: 'Operations', icon: Activity },
    { id: 'reports', name: 'Reports & Logs', icon: FileText },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    if (loading) return <div className="p-8 text-center text-gray-500">Loading portal data...</div>;

    switch (activeTab) {
      case 'dashboard': return <AnalyticsDashboard data={portalData.analytics} />;
      case 'staff': return <StaffManagement staff={portalData.staff} refreshData={fetchPortalData} />;
      case 'departments': return <DepartmentManager departments={portalData.departments} refreshData={fetchPortalData} />;
      case 'operations': return <OperationsOverview operations={portalData.operations} />;
      case 'reports': return <ReportsAndLogs />;
      case 'settings': return <ClinicSettings />;
      default: return <AnalyticsDashboard data={portalData.analytics} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-indigo-900 text-white flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-1">
            <img src="/logo.png" alt="HealTrack Logo" className="w-8 h-8 object-contain" />
            <h1 className="text-2xl font-bold text-white tracking-wide">HealTrack AI</h1>
          </div>
          <p className="text-indigo-300 text-sm pl-11 mt-1">Admin Portal</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navigation.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
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
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="md:hidden bg-indigo-900 p-4 text-white flex justify-between items-center">
          <h1 className="text-xl font-bold">HealTrack Admin</h1>
        </div>
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
