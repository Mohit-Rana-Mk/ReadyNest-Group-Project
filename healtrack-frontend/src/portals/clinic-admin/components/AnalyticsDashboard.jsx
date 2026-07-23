import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../../components/ui/Card';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import axiosClient from '../../../api/axiosClient';
import CountUp from 'react-countup';
import { Calendar, Filter, UserCheck, CreditCard, Users, ShieldAlert } from 'lucide-react';

const DEPARTMENTS = [
  'Cardiology', 'General Medicine', 'Ophthalmology', 'Orthopedics', 
  'Pediatrics', 'Dermatology', 'ENT', 'Neurology', 'Gynecology', 'Psychiatry'
];

const STATUSES = ['Scheduled', 'Checked-In', 'In Consultation', 'Completed', 'Cancelled'];

export function AnalyticsDashboard({ clinicId = 1 }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  
  // Filter States
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [selectedDepts, setSelectedDepts] = useState(DEPARTMENTS);
  const [selectedStatuses, setSelectedStatuses] = useState(STATUSES);

  // Dropdown UI toggles
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
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
  }, [startDate, endDate, selectedDepts, selectedStatuses, clinicId]);

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
  const kpis = data?.kpis || { noShowRate: 0, totalAppointments: 0, totalRevenue: 0, totalDoctors: 0, repeatPatients: 0 };
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
    <div className="space-y-6">


      {/* FILTER & KPI CONTAINER */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start flex-col-reverse xl:flex-row">
        
        {/* KPI CARDS (Left 3 columns) */}
        <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* No-show Rate */}
          <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:-translate-y-1 transition-transform duration-200 flex flex-col justify-between min-h-[140px] group">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-[18px] bg-rose-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-6 h-6 text-rose-500" />
              </div>
              <div className="px-2 py-1 bg-rose-50 rounded-full text-rose-600 text-[10px] font-bold">+2.4%</div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">No-show Rate</p>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                <CountUp end={kpis.noShowRate || 0} duration={2} decimals={1} suffix="%" />
              </h2>
            </div>
          </div>

          {/* Appointments */}
          <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:-translate-y-1 transition-transform duration-200 flex flex-col justify-between min-h-[140px] group">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-[18px] bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserCheck className="w-6 h-6 text-blue-500" />
              </div>
              <div className="px-2 py-1 bg-emerald-50 rounded-full text-emerald-600 text-[10px] font-bold">+14%</div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Appointments</p>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                <CountUp end={kpis.totalAppointments || 0} duration={2} />
              </h2>
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:-translate-y-1 transition-transform duration-200 flex flex-col justify-between min-h-[140px] group">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-[18px] bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="px-2 py-1 bg-emerald-50 rounded-full text-emerald-600 text-[10px] font-bold">+8.1%</div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Revenue</p>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                <CountUp end={kpis.totalRevenue || 0} duration={2} prefix="₹" separator="," />
              </h2>
            </div>
          </div>

          {/* Doctors */}
          <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:-translate-y-1 transition-transform duration-200 flex flex-col justify-between min-h-[140px] group">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-[18px] bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-indigo-500" />
              </div>
              <div className="px-2 py-1 bg-slate-100 rounded-full text-slate-500 text-[10px] font-bold">Stable</div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Active Doctors</p>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                <CountUp end={kpis.totalDoctors || 0} duration={2} />
              </h2>
            </div>
          </div>
        </div>

      {/* FILTERS (Right 1 column) */}
        <div className="xl:col-span-1 bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 space-y-5 sticky top-28 self-start max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="flex items-center gap-2 text-slate-700 font-bold border-b pb-2">
            <Filter className="w-4 h-4 text-blue-500" />
            <span className="text-sm">Filter Dashboard</span>
          </div>

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

          {/* Start Date */}
          <div className="space-y-1.5 mt-2">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1 mb-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Start Date
            </label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-gray-300 rounded px-2 py-1.5 text-xs text-slate-700 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5 mt-2">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1 mb-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> End Date
            </label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-gray-300 rounded px-2 py-1.5 text-xs text-slate-700 focus:ring-blue-500 focus:border-blue-500" 
            />
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
          <div className="p-6 bg-white rounded-[24px] shadow-sm border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Doctor Utilization</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={doctorUtilization} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDoctor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                  <XAxis dataKey="doctor_name" tick={{ fontSize: 11, fill: '#94a3b8' }} interval={0} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                    itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                    formatter={(val) => [`${val}`, 'Appointments']} 
                  />
                  <Bar dataKey="count" fill="url(#colorDoctor)" radius={[6, 6, 0, 0]} maxBarSize={120} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Overview */}
          <div className="p-6 bg-white rounded-[24px] shadow-sm border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Revenue Overview</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueOverview} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} formatter={(val) => `₹${val}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                    itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                    formatter={(val) => [`₹${parseFloat(val).toLocaleString()}`, 'Revenue']} 
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#3b82f6' }} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Peak Hours */}
          <div className="p-6 bg-white rounded-[24px] shadow-sm border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Peak Hours</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={peakHours} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                    itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                    formatter={(val) => [`${val}`, 'Appointments']} 
                  />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#10b981' }} activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN CHART (1/3 width) */}
        <div className="lg:col-span-1">
          {/* Appointments Overview (Horizontal Bar Chart) */}
          <div className="p-6 bg-white rounded-[24px] shadow-sm border border-slate-100 h-full flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow duration-300">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Appointments Overview</h3>
              </div>
              <div className="h-[620px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={appointmentsOverview} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorDepts" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f8fafc" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis dataKey="department_name" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} width={100} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }} 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                      itemStyle={{ color: '#8b5cf6', fontWeight: 'bold' }}
                      formatter={(val) => [`${val}`, 'Appointments']} 
                    />
                    <Bar dataKey="count" fill="url(#colorDepts)" radius={[0, 6, 6, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
