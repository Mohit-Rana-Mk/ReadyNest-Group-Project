import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { TrendingUp, Users, AlertCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axiosClient from '../../../api/axiosClient';

export function AnalyticsDashboard({ data }) {
  // Use prop data as initial, but allow overriding if timeframe changes
  const [analyticsData, setAnalyticsData] = useState(data);
  const [timeframe, setTimeframe] = useState(6);
  const [loading, setLoading] = useState(false);

  // We only want to fetch if the user changes the timeframe away from the default initial load
  // Actually, to make it robust, if timeframe changes, we fetch fresh data.
  useEffect(() => {
    // Skip the very first render fetch if timeframe is 6, as we already have `data` from props.
    // But if we want it to be clean, let's just fetch it anyway or rely on a flag.
    const fetchNewData = async () => {
      setLoading(true);
      try {
        const clinicId = 1; // hardcoded for now
        const res = await axiosClient.get(`/clinic-admin/${clinicId}/analytics?months=${timeframe}`);
        setAnalyticsData(res.data);
      } catch (err) {
        console.error("Failed to fetch new analytics", err);
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch if it's different from initial prop context (or just always fetch on change)
    fetchNewData();
  }, [timeframe]); // Only run when timeframe changes

  const { revenue = [], footfall = [], noShow = { total_appointments: 0, cancelled_appointments: 0 } } = analyticsData || data;

  const totalRevenue = revenue.reduce((sum, item) => sum + Number(item.revenue), 0);
  const totalPatients = footfall.reduce((sum, item) => sum + Number(item.patients), 0);
  
  const noShowRate = noShow.total_appointments > 0 
    ? ((noShow.cancelled_appointments / noShow.total_appointments) * 100).toFixed(1) 
    : 0;

  const { sources = [] } = analyticsData || data;
  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-indigo-900">Analytics Dashboard</h2>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Timeframe:</label>
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(Number(e.target.value))}
            className="border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={1}>Last 1 Month</option>
            <option value={3}>Last 3 Months</option>
            <option value={6}>Last 6 Months</option>
            <option value={12}>Last 12 Months</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center space-x-4 relative">
          <div className="p-3 bg-indigo-100 rounded-full text-indigo-700">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Revenue ({timeframe}M)</p>
            <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
          </div>
          {loading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">...</div>}
        </Card>
        <Card className="p-5 flex items-center space-x-4 relative">
          <div className="p-3 bg-green-100 rounded-full text-green-700">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Footfall ({timeframe}M)</p>
            <p className="text-2xl font-bold text-gray-900">{totalPatients}</p>
          </div>
          {loading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">...</div>}
        </Card>
        <Card className="p-5 flex items-center space-x-4 relative">
          <div className="p-3 bg-red-100 rounded-full text-red-700">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">No-Show Rate ({timeframe}M)</p>
            <p className="text-2xl font-bold text-gray-900">{noShowRate}%</p>
          </div>
          {loading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">...</div>}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 relative">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue (INR)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                <Bar dataKey="revenue" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {loading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">...</div>}
        </Card>

        <Card className="p-5 relative">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Footfall Trends</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={footfall}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="patients" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {loading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">...</div>}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-5 relative">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Sources Breakdown</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sources}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="booking_source"
                  label={({ booking_source, percent }) => `${booking_source} ${(percent * 100).toFixed(0)}%`}
                >
                  {sources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {loading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">...</div>}
        </Card>
      </div>
    </div>
  );
}
