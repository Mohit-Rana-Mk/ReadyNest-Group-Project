import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../../components/ui/Card';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import axiosClient from '../../../api/axiosClient';
import { Calendar, Filter, UserCheck, CreditCard, Users, ShieldAlert } from 'lucide-react';

const DEPARTMENTS = [
  'Cardiology', 'General Medicine', 'Ophthalmology', 'Orthopedics', 
  'Pediatrics', 'Dermatology', 'ENT', 'Neurology', 'Gynecology', 'Psychiatry'
];

const STATUSES = ['Scheduled', 'Checked-In', 'In Consultation', 'Completed', 'Cancelled'];

export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  
  // Filter States
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-06-30');
  const [selectedDepts, setSelectedDepts] = useState(DEPARTMENTS);
  const [selectedStatuses, setSelectedStatuses] = useState(STATUSES);

  // Dropdown UI toggles
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const clinicId = 1; // Hardcoded clinic context
      const params = new URLSearchParams();
      if (selectedDepts.length === 0 || selectedStatuses.length === 0) {
        setData({
          kpis: { noShowRate: 0, totalAppointments: 0, totalRevenue: 0, totalDoctors: 0 },
          doctorUtilization: [],
          revenueOverview: [],
          peakHours: [],
          appointmentsOverview: []
        });
        setLoading(false);
        return;
      }

      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (selectedDepts.length > 0) params.append('departments', selectedDepts.join(','));
      if (selectedStatuses.length > 0) params.append('statuses', selectedStatuses.join(','));

      const res = await axiosClient.get(`/clinic-admin/${clinicId}/operational-dashboard?${params.toString()}`);
      if (res.data && res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch operational dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedDepts, selectedStatuses]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const toggleDept = (dept) => {
    if (selectedDepts.includes(dept)) {
      setSelectedDepts(selectedDepts.filter(d => d !== dept));
    } else {
      setSelectedDepts([...selectedDepts, dept]);
    }
  };

  const toggleStatus = (status) => {
    if (selectedStatuses.includes(status)) {
      setSelectedStatuses(selectedStatuses.filter(s => s !== status));
    } else {
      setSelectedStatuses([...selectedStatuses, status]);
    }
  };

  const handleSelectAllDepts = () => {
    if (selectedDepts.length === DEPARTMENTS.length) {
      setSelectedDepts([]);
    } else {
      setSelectedDepts(DEPARTMENTS);
    }
  };

  const handleSelectAllStatuses = () => {
    if (selectedStatuses.length === STATUSES.length) {
      setSelectedStatuses([]);
    } else {
      setSelectedStatuses(STATUSES);
    }
  };

  // Safe KPI extractors
  const kpis = data?.kpis || { noShowRate: 0, totalAppointments: 0, totalRevenue: 0, totalDoctors: 0 };
  const doctorUtilization = data?.doctorUtilization || [];
  const revenueOverview = data?.revenueOverview || [];
  const peakHours = data?.peakHours || [];
  const appointmentsOverview = data?.appointmentsOverview || [];

  // Formatter for revenue numbers (e.g., 338K)
  const formatRevenue = (val) => {
    if (val >= 1000) {
      return `₹${(val / 1000).toFixed(0)}K`;
    }
    return `₹${val}`;
  };

  return (
    <div className="space-y-6 bg-gray-50 p-6 rounded-2xl border border-gray-200/80 shadow-sm min-h-screen">
      {/* Title */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight text-center">
          HealTrack AI - Operational Dashboard
        </h1>
      </div>

      {/* FILTER & KPI CONTAINER */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start flex-col-reverse xl:flex-row">
        {/* KPI CARDS (Left 3 columns) */}
        <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* No-show Rate */}
          <Card className="p-6 bg-white border-l-4 border-rose-500 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between min-h-[120px]">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">No-show Rate</span>
              <ShieldAlert className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800">{kpis.noShowRate}%</h2>
              <p className="text-[10px] text-slate-400 mt-1">Cancelled Appts Ratio</p>
            </div>
          </Card>

          {/* Count of AppointmentID */}
          <Card className="p-6 bg-white border-l-4 border-blue-500 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between min-h-[120px]">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Appointments</span>
              <UserCheck className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800">{kpis.totalAppointments}</h2>
              <p className="text-[10px] text-slate-400 mt-1">Total Scheduled Visits</p>
            </div>
          </Card>

          {/* Sum of Revenue */}
          <Card className="p-6 bg-white border-l-4 border-emerald-500 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between min-h-[120px]">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Revenue</span>
              <CreditCard className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800">{formatRevenue(kpis.totalRevenue)}</h2>
              <p className="text-[10px] text-slate-400 mt-1">Consultation Earnings</p>
            </div>
          </Card>

          {/* Count of Doctor */}
          <Card className="p-6 bg-white border-l-4 border-indigo-500 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between min-h-[120px]">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Doctors</span>
              <Users className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800">{kpis.totalDoctors}</h2>
              <p className="text-[10px] text-slate-400 mt-1">Active Physicians</p>
            </div>
          </Card>
        </div>

        {/* FILTERS (Right 1 column) */}
        <div className="xl:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-700 font-bold border-b pb-2">
            <Filter className="w-4 h-4 text-blue-500" />
            <span className="text-sm">Filter Dashboard</span>
          </div>

          <div className="space-y-3">
            {/* Department Filter */}
            <div className="relative">
              <label className="text-xs font-semibold text-slate-600 block mb-1">Department</label>
              <button 
                onClick={() => { setShowDeptDropdown(!showDeptDropdown); setShowStatusDropdown(false); }}
                className="w-full text-left bg-slate-50 border border-gray-300 rounded px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-100 flex justify-between items-center"
              >
                <span>{selectedDepts.length === DEPARTMENTS.length ? 'All Departments' : `${selectedDepts.length} Selected`}</span>
                <span className="text-slate-400">▼</span>
              </button>
              {showDeptDropdown && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-48 overflow-y-auto p-2 space-y-1">
                  <div className="flex justify-between items-center border-b pb-1 mb-1">
                    <button onClick={handleSelectAllDepts} className="text-[10px] font-bold text-blue-600 hover:underline">
                      {selectedDepts.length === DEPARTMENTS.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  {DEPARTMENTS.map(d => (
                    <label key={d} className="flex items-center gap-2 text-xs text-slate-600 hover:bg-slate-50 p-1 rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedDepts.includes(d)} 
                        onChange={() => toggleDept(d)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                      />
                      <span>{d}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div className="relative">
              <label className="text-xs font-semibold text-slate-600 block mb-1">Status</label>
              <button 
                onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowDeptDropdown(false); }}
                className="w-full text-left bg-slate-50 border border-gray-300 rounded px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-100 flex justify-between items-center"
              >
                <span>{selectedStatuses.length === STATUSES.length ? 'All Statuses' : `${selectedStatuses.length} Selected`}</span>
                <span className="text-slate-400">▼</span>
              </button>
              {showStatusDropdown && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-48 overflow-y-auto p-2 space-y-1">
                  <div className="flex justify-between items-center border-b pb-1 mb-1">
                    <button onClick={handleSelectAllStatuses} className="text-[10px] font-bold text-blue-600 hover:underline">
                      {selectedStatuses.length === STATUSES.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  {STATUSES.map(s => (
                    <label key={s} className="flex items-center gap-2 text-xs text-slate-600 hover:bg-slate-50 p-1 rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedStatuses.includes(s)} 
                        onChange={() => toggleStatus(s)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                      />
                      <span>{s}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 block flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> Date Range
              </label>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-1/2 bg-slate-50 border border-gray-300 rounded px-2 py-1 text-[11px] text-slate-700 focus:ring-blue-500 focus:border-blue-500" 
                />
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-1/2 bg-slate-50 border border-gray-300 rounded px-2 py-1 text-[11px] text-slate-700 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS LAYOUT (Grid of 2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
        {loading && (
          <div className="absolute inset-0 bg-slate-100/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* LEFT COLUMN CHARTS (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Doctor Utilization */}
          <Card className="p-5 bg-white shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-b pb-2">Doctor Utilization</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={doctorUtilization}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f5" />
                  <XAxis dataKey="doctor_name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(val) => [`${val} Appts`, 'Count']} />
                  <Bar dataKey="count" fill="#1e90ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Revenue Overview */}
          <Card className="p-5 bg-white shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-b pb-2">Revenue Overview</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueOverview}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f5" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} formatter={(val) => `₹${val}`} />
                  <Tooltip formatter={(val) => [`₹${parseFloat(val).toLocaleString()}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Peak Hours */}
          <Card className="p-5 bg-white shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-b pb-2">Peak Hours</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={peakHours}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f5" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip formatter={(val) => [`${val} Appointments`, 'Count']} />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN CHART (1/3 width) */}
        <div className="lg:col-span-1">
          {/* Appointments Overview (Horizontal Bar Chart) */}
          <Card className="p-5 bg-white shadow-sm border border-gray-200 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-b pb-2">Appointments Overview</h3>
              <div className="h-[620px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={appointmentsOverview} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f3f5" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis dataKey="department_name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} width={100} />
                    <Tooltip formatter={(val) => [`${val} Appts`, 'Count']} />
                    <Bar dataKey="count" fill="#1e90ff" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
