import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../../components/ui/Card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { Filter, Users, Calendar } from 'lucide-react';

const DEPARTMENTS = [
  'Cardiology', 'General Medicine', 'Ophthalmology', 'Orthopedics', 
  'Pediatrics', 'Dermatology', 'ENT', 'Neurology', 'Gynecology', 'Psychiatry'
];

const GENDERS = ['Female', 'Male'];

const PIE_COLORS = ['#3b82f6', '#1e3a8a']; // Matches PowerBI light blue & dark blue

const MOSAIC_COLORS = [
  '#2563eb', '#db2777', '#0f766e', '#a21caf', '#06b6d4', 
  '#4f46e5', '#e11d48', '#b45309', '#1e3a8a', '#7c3aed',
  '#ea580c', '#65a30d', '#059669', '#ca8a04', '#0284c7'
];

export function PatientAnalytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

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
      if (selectedGenders.length > 0) params.append('genders', selectedGenders.join(','));
      if (selectedDepts.length > 0) params.append('departments', selectedDepts.join(','));

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

  useEffect(() => {
    fetchAnalyticsData();
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
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          HealTrack AI - Patient Analytics
        </h1>
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
        <Card className="lg:col-span-3 p-5 bg-white shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
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
      </div>
    </div>
  );
}
