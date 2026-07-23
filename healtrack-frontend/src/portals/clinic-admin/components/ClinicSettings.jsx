import { toast } from '../../../components/ui/Toast';
import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { MapPin } from 'lucide-react';
import axiosClient from '../../../api/axiosClient';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function ClinicSettings({ clinicId }) {
  const [formData, setFormData] = useState({
    name: '',
    license_number: '',
    address: '',
    latitude: '',
    longitude: '',
    opening_time: '',
    closing_time: '',
    operational_days: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axiosClient.get(`/clinic-admin/${clinicId}/settings`);
        const data = res.data;
        setFormData({
          name: data.name || '',
          license_number: data.license_number || '',
          address: data.address || '',
          latitude: data.latitude || '',
          longitude: data.longitude || '',
          // format TIME from DB (e.g., "08:00:00") to "08:00" for input type="time"
          opening_time: data.opening_time ? data.opening_time.substring(0, 5) : '',
          closing_time: data.closing_time ? data.closing_time.substring(0, 5) : '',
          operational_days: data.operational_days ? data.operational_days.split(',') : []
        });
      } catch (err) {
        console.error("Failed to fetch settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleFetchLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }));
        },
        (error) => {
          console.warn("Geolocation failed, using mock fallback location.", error);
          setFormData((prev) => ({
            ...prev,
            latitude: "28.613900",
            longitude: "77.209000"
          }));
          toast.error("Unable to retrieve real location due to browser restrictions. Using default mock location (New Delhi) for demonstration.");
        }
      );
    } else {
      toast.info("Geolocation is not supported by your browser.");
    }
  };

  const handleDayToggle = (day) => {
    setFormData((prev) => {
      const days = [...prev.operational_days];
      if (days.includes(day)) {
        return { ...prev, operational_days: days.filter(d => d !== day) };
      } else {
        return { ...prev, operational_days: [...days, day] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.put(`/clinic-admin/${clinicId}/settings`, {
        ...formData,
        operational_days: formData.operational_days.join(',')
      });
      toast.success("Settings updated successfully!");
    } catch (err) {
      console.error("Failed to save settings", err);
      toast.error("Failed to save settings.");
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-[15px] font-bold text-slate-800 uppercase tracking-wider mb-2">Clinic Settings</h2>
      
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-6 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">Clinic Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Clinic Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">License Number</label>
                <input type="text" value={formData.license_number} disabled className="w-full bg-slate-100/50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-500 cursor-not-allowed" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Address</label>
                <textarea required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 min-h-[60px]" rows="2"></textarea>
              </div>
              
              {/* Geolocation Fields */}
              <div className="col-span-1 md:col-span-2 mt-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-slate-600">Geospatial Coordinates</label>
                  <button type="button" onClick={handleFetchLocation} className="text-[11px] font-semibold py-1 px-2.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center space-x-1">
                    <MapPin className="w-3 h-3" /> <span>Fetch My Location</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <input type="number" step="any" placeholder="Latitude" value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400" />
                  </div>
                  <div>
                    <input type="number" step="any" placeholder="Longitude" value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div>
            <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">Operating Hours</h3>
            
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-600 mb-2">Operational Days</label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <label key={day} className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all duration-200 ${formData.operational_days.includes(day) ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 border-transparent' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'}`}>
                    <input type="checkbox" className="hidden" checked={formData.operational_days.includes(day)} onChange={() => handleDayToggle(day)} />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Opening Time</label>
                <input required type="time" value={formData.opening_time} onChange={e => setFormData({...formData, opening_time: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Closing Time</label>
                <input required type="time" value={formData.closing_time} onChange={e => setFormData({...formData, closing_time: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2 text-sm font-bold shadow-[0_8px_16px_-6px_rgba(37,99,235,0.4)] hover:shadow-[0_12px_20px_-8px_rgba(37,99,235,0.6)] hover:-translate-y-0.5 transition-all duration-200">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
