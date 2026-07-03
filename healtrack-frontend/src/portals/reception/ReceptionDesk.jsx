import React, { useState, useEffect } from 'react';
import { KpiBanner } from './components/KpiBanner';
import { OpdQueueTable } from './components/OpdQueueTable';
import { WalkInModal } from './components/WalkInModal';
import { Button } from '../../components/ui/Button';
import { UserPlus, Bell, LogOut } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';

export default function ReceptionDesk() {
  const { user, logout } = useAuth();
  const [queue, setQueue] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [stats, setStats] = useState({ totalWalkIns: 0, avgWaitTime: "0 mins", activeDoctors: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const clinicId = user?.clinic_id || 1;

  const fetchQueue = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
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

    // Setup Socket.io connection
    const socket = io('https://healtrack-backend-7h3o.onrender.com');
    
    socket.on('QUEUE_UPDATE', (data) => {
        console.log("Realtime event received: QUEUE_UPDATE", data);
        if (data.message) {
            setNotification(`${data.message}`);
            setTimeout(() => setNotification(null), 5000);
        }
        fetchQueue(true); // pass true to indicate it's a background refresh
    });

    return () => {
        socket.disconnect();
    };
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
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="HealTrack Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-3xl font-bold text-indigo-900 leading-tight">Reception Desk</h1>
              <p className="text-gray-500">Manage outpatient department queue and walk-ins.</p>
              {user?.clinic_name && (
                <div className="mt-2 inline-flex items-center px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide mr-2">Clinic:</span>
                  <span className="text-sm font-bold text-indigo-800">{user.clinic_name}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="primary" onClick={() => setIsModalOpen(true)} className="gap-2">
              <UserPlus className="w-5 h-5" />
              Register Walk-In
            </Button>
            <button onClick={logout} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition border border-transparent hover:border-red-100" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {notification && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl flex items-center gap-3 shadow-sm animate-pulse">
            <Bell className="w-5 h-5 text-indigo-500" />
            <span className="font-semibold">{notification}</span>
          </div>
        )}

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
