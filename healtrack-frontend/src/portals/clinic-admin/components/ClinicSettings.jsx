import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { MapPin } from 'lucide-react';
import axiosClient from '../../../api/axiosClient';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function ClinicSettings() {
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

  const clinicId = 1; // hardcoded

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
          alert("Unable to retrieve your location. Please check browser permissions.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
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
      alert("Settings updated successfully!");
    } catch (err) {
      console.error("Failed to save settings", err);
      alert("Failed to save settings.");
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-blue-900">Clinic Settings</h2>
      
      <Card className="p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Clinic Profile</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                <input type="text" value={formData.license_number} disabled className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 text-gray-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500" rows="2"></textarea>
              </div>
              
              {/* Geolocation Fields */}
              <div className="col-span-2 mt-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Geospatial Coordinates</label>
                  <Button type="button" onClick={handleFetchLocation} variant="outline" className="text-xs py-1 px-2 flex items-center space-x-1">
                    <MapPin className="w-3 h-3" /> <span>Fetch My Location</span>
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input type="number" step="any" placeholder="Latitude" value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <input type="number" step="any" placeholder="Longitude" value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Operating Hours</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Operational Days</label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <label key={day} className={`px-3 py-1.5 rounded-full text-sm cursor-pointer border transition-colors ${formData.operational_days.includes(day) ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                    <input type="checkbox" className="hidden" checked={formData.operational_days.includes(day)} onChange={() => handleDayToggle(day)} />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
                <input required type="time" value={formData.opening_time} onChange={e => setFormData({...formData, opening_time: e.target.value})} className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
                <input required type="time" value={formData.closing_time} onChange={e => setFormData({...formData, closing_time: e.target.value})} className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button variant="primary" type="submit">Save Changes</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
