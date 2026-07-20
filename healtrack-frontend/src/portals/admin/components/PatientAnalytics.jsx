import { toast } from '../../../components/ui/Toast';
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import { Filter, Users, Calendar, Search, Trash2, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import axiosClient from '../../../api/axiosClient';

const DEPARTMENTS = [
  'Cardiology', 'General Medicine', 'Ophthalmology', 'Orthopedics',
  'Pediatrics', 'Dermatology', 'ENT', 'Neurology', 'Gynecology', 'Psychiatry'
];

const GENDERS = ['Female', 'Male', 'Prefer Not to Say'];

const PIE_COLORS = ['#3b82f6', '#1e3a8a', '#10b981']; // Matches PowerBI light blue, dark blue, and emerald green

const MOSAIC_COLORS = [
  '#2563eb', '#db2777', '#0f766e', '#a21caf', '#06b6d4',
  '#4f46e5', '#e11d48', '#b45309', '#1e3a8a', '#7c3aed',
  '#ea580c', '#65a30d', '#059669', '#ca8a04', '#0284c7'
];

export function PatientAnalytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Patient Directory States
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [patientToDelete, setPatientToDelete] = useState(null);

  // Filter States
  const [minAge, setMinAge] = useState(2);
  const [maxAge, setMaxAge] = useState(85);
  const [selectedGenders, setSelectedGenders] = useState(GENDERS);
  const [selectedDepts, setSelectedDepts] = useState(DEPARTMENTS);

  // Dropdown toggles
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (minAge) params.append('min_age', minAge);
      if (maxAge) params.append('max_age', maxAge);
      if (selectedGenders.length > 0 && selectedGenders.length < GENDERS.length) params.append('genders', selectedGenders.join(','));
      if (selectedDepts.length > 0 && selectedDepts.length < DEPARTMENTS.length) params.append('departments', selectedDepts.join(','));

      const res = await axiosClient.get(`/admin/patient-analytics?${params.toString()}`);
      if (res.data && res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch patient analytics data:', err);
    } finally {
      setLoading(false);
    }
  }, [minAge, maxAge, selectedGenders, selectedDepts]);

  const fetchPatientsList = async () => {
    setPatientsLoading(true);
    try {
      const res = await axiosClient.get('/admin/patients');
      if (res.data && res.data.success) {
        setPatients(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch patient list:', err);
    } finally {
      setPatientsLoading(false);
    }
  };

  const handleTogglePatientStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      const res = await axiosClient.post(`/admin/patients/${userId}/status`, { status: newStatus });
      if (res.data.success) {
        setStatusMessage(res.data.message);
        fetchPatientsList();
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      console.error('Failed to toggle patient status:', err);
      toast.error('Failed to update patient account status.');
    }
  };

  const handleDeletePatient = (patientId) => {
    setPatientToDelete(patientId);
  };

  const confirmDeletePatient = async () => {
    if (!patientToDelete) return;
    try {
      const res = await axiosClient.delete(`/admin/patients/${patientToDelete}`);
      if (res.data.success) {
        setStatusMessage(res.data.message);
        fetchPatientsList();
        fetchAnalyticsData();
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      console.error('Failed to delete patient:', err);
      toast.error('Failed to delete patient account.');
    } finally {
      setPatientToDelete(null);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
    fetchPatientsList();
  }, [fetchAnalyticsData]);

  const toggleGender = (g) => {
    if (selectedGenders.includes(g)) {
      setSelectedGenders(selectedGenders.filter(item => item !== g));
    } else {
      setSelectedGenders([...selectedGenders, g]);
    }
  };

  const toggleDept = (dept) => {
    if (selectedDepts.includes(dept)) {
      setSelectedDepts(selectedDepts.filter(d => d !== dept));
    } else {
      setSelectedDepts([...selectedDepts, dept]);
    }
  };

  const handleSelectAllDepts = () => {
    if (selectedDepts.length === DEPARTMENTS.length) {
      setSelectedDepts([]);
    } else {
      setSelectedDepts(DEPARTMENTS);
    }
  };

  const kpis = data?.kpis || { totalPatients: 0, repeatPatients: 0 };
  const demographics = data?.demographics || [];
  const ageGenderAnalysis = data?.ageGenderAnalysis || [];
  const diseaseDistribution = data?.diseaseDistribution || [];

  // Donut chart formatting
  const pieData = demographics.map(d => ({
    name: d.gender,
    value: d.count
  }));

  const totalPieCount = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6 bg-gray-50 p-6 rounded-2xl border border-gray-200/80 shadow-sm w-full h-full overflow-y-auto">
      {/* Title */}
      <div className="border-b border-gray-200 pb-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <img src="/logo.png" alt="HealTrack Logo" className="w-10 h-10 object-contain rounded-xl shadow-sm" />
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              HealTrack AI - Patient Analytics
            </h1>
        </div>
      </div>

      {/* FILTER & KPI ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* KPI CARDS (Left 1 column) */}
        <div className="lg:col-span-1">
          {/* Total Patients */}
          <Card className="p-6 bg-white border-l-4 border-blue-500 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between h-32">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Patients</span>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800">{kpis.totalPatients}</h2>
              <p className="text-[10px] text-slate-400 mt-1">Unique Patients Enrolled</p>
            </div>
          </Card>
        </div>

        {/* FILTERS (Right 3 columns) */}
        <Card className="lg:col-span-3 p-5 bg-white shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-visible">
          {/* Gender Filter */}
          <div className="relative">
            <label className="text-xs font-semibold text-slate-600 block mb-1">Gender</label>
            <button
              onClick={() => { setShowGenderDropdown(!showGenderDropdown); setShowDeptDropdown(false); }}
              className="w-full text-left bg-slate-50 border border-gray-300 rounded px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-100 flex justify-between items-center"
            >
              <span>{selectedGenders.length === GENDERS.length ? 'All Genders' : selectedGenders.join(', ')}</span>
              <span className="text-slate-400">▼</span>
            </button>
            {showGenderDropdown && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 p-2 space-y-1">
                {GENDERS.map(g => (
                  <label key={g} className="flex items-center gap-2 text-xs text-slate-600 hover:bg-slate-50 p-1 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedGenders.includes(g)}
                      onChange={() => toggleGender(g)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{g}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Department Filter */}
          <div className="relative">
            <label className="text-xs font-semibold text-slate-600 block mb-1">Department</label>
            <button
              onClick={() => { setShowDeptDropdown(!showDeptDropdown); setShowGenderDropdown(false); }}
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

          {/* Age Slider */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 block flex justify-between">
              <span>Age Range</span>
              <span className="text-blue-600 font-bold">{minAge} - {maxAge}</span>
            </label>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="range"
                min="2"
                max="85"
                value={minAge}
                onChange={(e) => setMinAge(Math.min(Number(e.target.value), maxAge - 1))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <input
                type="range"
                min="2"
                max="85"
                value={maxAge}
                onChange={(e) => setMaxAge(Math.max(Number(e.target.value), minAge + 1))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* CHARTS CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
        {loading && (
          <div className="absolute inset-0 bg-slate-100/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Age/Gender Analysis */}
        <Card className="p-5 bg-white shadow-sm border border-gray-200">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-b pb-2">Age/Gender Analysis</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageGenderAnalysis}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f5" />
                <XAxis dataKey="label" label={{ value: 'Age (bins)', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#64748b' }} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis label={{ value: 'Count of PatientID', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#64748b' }} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="female" name="Female" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="male" name="Male" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="preferNotToSay" name="Prefer Not to Say" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Patient Demographics Donut */}
        <Card className="p-5 bg-white shadow-sm border border-gray-200 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-b pb-2">Patient Demographics</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value} (${((value / totalPieCount) * 100).toFixed(2)}%)`}
                >
                  {pieData.map((entry, index) => {
                    let color = '#94a3b8'; // Default slate-400
                    if (entry.name === 'Female') color = '#3b82f6';
                    else if (entry.name === 'Male') color = '#1e3a8a';
                    else if (entry.name === 'Prefer Not to Say') color = '#10b981';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Pie>
                <Tooltip formatter={(value) => `${value} Patients`} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Disease Distribution (Recharts Bar Chart) */}
        <Card className="lg:col-span-2 p-5 bg-white shadow-sm border border-gray-200">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-b pb-2">Disease Distribution</h3>

          {diseaseDistribution.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-slate-400">
              No disease data matches the current filters.
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={diseaseDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f5" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis label={{ value: 'Diagnoses Count', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#64748b' }} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip formatter={(value) => [`${value} Patients`, 'Diagnoses']} />
                  <Bar dataKey="value" name="Diagnoses" radius={[4, 4, 0, 0]}>
                    {diseaseDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={MOSAIC_COLORS[index % MOSAIC_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Patient Directory Section */}
        <Card className="lg:col-span-2 p-6 bg-white shadow-sm border border-gray-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" /> Patient Accounts Directory
              </h3>
              <p className="text-xs text-slate-400">Manage patient user credentials, suspend access, or permanently delete accounts.</p>
            </div>
            
            {/* Search Input */}
            <div className="relative max-w-xs w-full">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search name, MRN, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-700 bg-slate-50/50"
              />
            </div>
          </div>

          {statusMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-300">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              {statusMessage}
            </div>
          )}

          {patientsLoading ? (
            <div className="py-12 flex items-center justify-center text-slate-400 text-xs">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
              Loading patient directory...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e9ecef] text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                    <th className="py-3 px-4">Patient Profile</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Registration Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e9ecef]">
                  {patients.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400">No patients registered in the system.</td>
                    </tr>
                  ) : (
                    patients
                      .filter(p => {
                        const term = searchTerm.toLowerCase();
                        return (
                          (p.name && p.name.toLowerCase().includes(term)) ||
                          (p.mrn && p.mrn.toLowerCase().includes(term)) ||
                          (p.email && p.email.toLowerCase().includes(term)) ||
                          (p.phone && p.phone.toLowerCase().includes(term))
                        );
                      })
                      .map(p => (
                        <tr key={p.patient_id} className="hover:bg-slate-50/70 transition">
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-800">{p.name}</div>
                            <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">{p.mrn || 'N/A'}</div>
                          </td>
                          <td className="py-4 px-4 text-slate-550">
                            <div className="font-medium text-slate-700">{p.email}</div>
                            <div className="text-[10px] text-slate-450 mt-0.5">{p.phone}</div>
                          </td>
                          <td className="py-4 px-4 font-medium text-slate-500">
                            {p.created_at ? new Date(p.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                          </td>
                          <td className="py-4 px-4">
                            {p.user_status === 'Suspended' ? (
                              <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-100 rounded-lg text-[9px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Suspended
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[9px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Active
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleTogglePatientStatus(p.user_id, p.user_status)}
                              className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition inline-flex items-center gap-1 ${
                                p.user_status === 'Suspended'
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-100'
                                  : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border-yellow-100'
                              }`}
                              title={p.user_status === 'Suspended' ? 'Restore access' : 'Suspend login access'}
                            >
                              {p.user_status === 'Suspended' ? 'Restore' : 'Suspend'}
                            </button>
                            <button
                              onClick={() => handleDeletePatient(p.patient_id)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-100 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                              title="Permanently delete patient user account"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Confirm Modal for Patient Deletion */}
      <ConfirmModal
        isOpen={!!patientToDelete}
        onClose={() => setPatientToDelete(null)}
        onConfirm={confirmDeletePatient}
        title="Delete Patient Account?"
        message="Are you sure you want to permanently delete this patient account? This will remove all their appointments and records. This action cannot be undone."
        confirmText="Yes, Delete Patient"
        isDestructive={true}
      />
    </div>
  );
}
