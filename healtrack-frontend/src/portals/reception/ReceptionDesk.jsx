import React, { useState, useEffect } from 'react';
import { KpiBanner } from './components/KpiBanner';
import { OpdQueueTable } from './components/OpdQueueTable';
import { WalkInModal } from './components/WalkInModal';
import { Button } from '../../components/ui/Button';
import { UserPlus } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

export default function ReceptionDesk() {
  const [queue, setQueue] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [stats, setStats] = useState({ totalWalkIns: 0, avgWaitTime: "0 mins", activeDoctors: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const clinicId = 1; // Assuming hardcoded clinic ID for now

  const fetchQueue = async () => {
    try {
      const res = await axiosClient.get(`/reception/${clinicId}/queue`);
      setQueue(res.data.queue);
      setDoctors(res.data.doctors);
      setStats({
        totalWalkIns: res.data.queue.length,
        avgWaitTime: res.data.avgWaitTime,
        activeDoctors: res.data.activeDoctors
      });
    } catch (err) {
      console.error("Failed to fetch reception queue", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axiosClient.put(`/reception/${clinicId}/appointments/${id}/status`, { status: newStatus });
      fetchQueue(); // Refresh to get exact time and status
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  };

  const handleRegisterWalkIn = async (data) => {
    try {
      await axiosClient.post(`/reception/${clinicId}/walk-in`, data);
      fetchQueue(); // Refresh to pull the new appointment
    } catch (err) {
      console.error("Error registering walk-in:", err);
      alert("Failed to register walk-in patient");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Reception Desk</h1>
            <p className="text-gray-500 mt-1">Manage outpatient department queue and walk-ins.</p>
          </div>
          <Button variant="primary" onClick={() => setIsModalOpen(true)} className="gap-2 shrink-0">
            <UserPlus className="w-5 h-5" />
            Register Walk-In
          </Button>
        </header>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading Queue...</div>
        ) : (
          <>
            <KpiBanner 
              totalWalkIns={stats.totalWalkIns} 
              avgWaitTime={stats.avgWaitTime} 
              activeDoctors={stats.activeDoctors} 
            />

            <OpdQueueTable 
              queue={queue} 
              onStatusChange={handleStatusChange} 
            />

            <WalkInModal 
              isOpen={isModalOpen} 
              onClose={() => setIsModalOpen(false)} 
              onRegister={handleRegisterWalkIn}
              doctors={doctors}
            />
          </>
        )}
        
      </div>
    </div>
  );
}
