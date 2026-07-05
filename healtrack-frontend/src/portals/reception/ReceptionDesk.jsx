import React, { useState, useEffect } from 'react';
import { KpiBanner } from './components/KpiBanner';
import { OpdQueueTable } from './components/OpdQueueTable';
import { WalkInModal } from './components/WalkInModal';
import { UserPlus, Bell, LogOut, Activity, Clock, Users, CheckCircle, Search, Loader2 } from 'lucide-react';
import axiosClient, { SOCKET_URL } from '../../api/axiosClient';
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
  const [searchTerm, setSearchTerm] = useState('');

  // Inline walk-in form state (left panel)
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInName, setWalkInName] = useState('');
  const [walkInDob, setWalkInDob] = useState('');
  const [walkInDoctorId, setWalkInDoctorId] = useState('');
  const [walkInRemarks, setWalkInRemarks] = useState('');
  const [walkInLoading, setWalkInLoading] = useState(false);
  const [walkInSuccess, setWalkInSuccess] = useState('');
  const [walkInError, setWalkInError] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [existingPatients, setExistingPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');

  const clinicId = user?.clinic_id || 1;

  const fetchQueue = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await axiosClient.get(`/reception/${clinicId}/queue`);
      setQueue(res.data.queue || []);
      setDoctors(res.data.doctors || []);
      setStats({
        totalWalkIns: res.data.queue?.length || 0,
        avgWaitTime: res.data.avgWaitTime || '—',
        activeDoctors: res.data.activeDoctors || 0
      });
    } catch (err) {
      console.error("Failed to fetch reception queue", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const socket = io(SOCKET_URL);
    socket.on('QUEUE_UPDATE', (data) => {
      if (data.message) {
        setNotification(data.message);
        setTimeout(() => setNotification(null), 5000);
      }
      fetchQueue(true);
    });
    return () => socket.disconnect();
  }, []);

  // Phone lookup effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (walkInPhone.length >= 5) {
        setLookingUp(true);
        try {
          const res = await axiosClient.get(`/reception/1/lookup?phone=${walkInPhone}`);
          if (res.data.exists && res.data.patients?.length > 0) {
            setExistingPatients(res.data.patients);
            setSelectedPatientId(res.data.patients[0].id.toString());
            setWalkInName(res.data.patients[0].name);
            setWalkInDob(res.data.patients[0].date_of_birth?.split('T')[0] || '');
          } else {
            setExistingPatients([]);
            setSelectedPatientId('new');
          }
        } catch {
          setExistingPatients([]);
          setSelectedPatientId('new');
        } finally {
          setLookingUp(false);
        }
      } else {
        setExistingPatients([]);
        setSelectedPatientId('');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [walkInPhone]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axiosClient.put(`/reception/${clinicId}/appointments/${id}/status`, { status: newStatus });
      fetchQueue();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    if (!walkInDoctorId) { setWalkInError('Please select a doctor.'); return; }
    setWalkInLoading(true);
    setWalkInError('');
    try {
      await axiosClient.post(`/reception/${clinicId}/walk-in`, {
        phone: walkInPhone,
        doctor_id: walkInDoctorId,
        patient_id: selectedPatientId === 'new' ? null : selectedPatientId,
        new_patient_name: selectedPatientId === 'new' ? walkInName : null,
        dob: selectedPatientId === 'new' ? walkInDob : null,
        pre_remarks: walkInRemarks
      });
      setWalkInSuccess('Patient registered and added to queue!');
      setWalkInPhone(''); setWalkInName(''); setWalkInDob(''); setWalkInDoctorId(''); setWalkInRemarks('');
      setExistingPatients([]); setSelectedPatientId('');
      setTimeout(() => setWalkInSuccess(''), 4000);
      fetchQueue();
    } catch (err) {
      setWalkInError('Failed to register walk-in patient.');
    } finally {
      setWalkInLoading(false);
    }
  };

  // Filtered queue lists
  const statusOptions = ['Scheduled', 'Checked-In', 'In Consultation', 'Completed', 'Cancelled'];
  const filteredQueue = (queue || []).filter(a =>
    (a.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.patientMrn || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const activeQueue = filteredQueue.filter(a => a.status !== 'Completed');
  const completedQueue = filteredQueue.filter(a => a.status === 'Completed');

  const statusBadgeColor = (status) => {
    const map = {
      'Scheduled': 'bg-blue-50 text-blue-700 border-blue-100',
      'Checked-In': 'bg-amber-50 text-amber-700 border-amber-100',
      'In Consultation': 'bg-violet-50 text-violet-700 border-violet-100',
      'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-100',
      'Cancelled': 'bg-red-50 text-red-600 border-red-100',
    };
    return map[status] || 'bg-slate-50 text-slate-500 border-slate-100';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-[#0B132B] sticky top-0 z-50 px-6 md:px-10 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white tracking-tight">Reception Desk</h1>
            <p className="text-[9px] text-[#22d3ee] font-bold uppercase tracking-widest">
              {user?.clinic_name || 'Digital Check-in & Queue Control'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live queue counter badge */}
          <div className="hidden md:flex items-center gap-1.5 bg-white/10 text-white border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            {activeQueue.length} Active in Queue
          </div>
          <button
            onClick={logout}
            className="p-2 text-slate-300 hover:text-white bg-slate-800/30 hover:bg-slate-800/60 rounded-xl transition border border-slate-800/40 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Live notification toast */}
      {notification && (
        <div className="mx-4 mt-4 p-3.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl flex items-center gap-3 text-xs font-bold animate-pulse shadow-sm">
          <Bell className="w-4 h-4 text-blue-500 shrink-0" />
          {notification}
        </div>
      )}

      {/* KPI Metrics Bar */}
      <div className="px-6 md:px-10 pt-6 pb-2">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Walk-ins Today', value: stats.totalWalkIns, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Avg Wait Time', value: stats.avgWaitTime, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Active Doctors', value: stats.activeDoctors, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-800 tracking-tight leading-none">{stat.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content — Split Column */}
      <div className="px-6 md:px-10 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: Check-in Form (4 columns) */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm sticky top-[73px]">
            <div className="mb-6">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Digital Check-in</h2>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Register a new walk-in patient to the OPD queue.</p>
            </div>

            {walkInSuccess && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                {walkInSuccess}
              </div>
            )}
            {walkInError && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-800">
                {walkInError}
              </div>
            )}

            <form onSubmit={handleWalkInSubmit} className="space-y-4">
              {/* Phone lookup */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Phone (Patient Lookup)</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-4 py-3 pr-10 bg-[#F1F5F9] border-0 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 placeholder-slate-400"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {lookingUp
                      ? <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                      : <Search className="w-4 h-4 text-slate-300" />
                    }
                  </div>
                </div>
                {existingPatients.length > 0 && (
                  <div className="mt-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-indigo-500 mb-1.5">Select Family Member</label>
                    <select
                      value={selectedPatientId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedPatientId(val);
                        if (val === 'new') { setWalkInName(''); setWalkInDob(''); }
                        else {
                          const pt = existingPatients.find(p => p.id.toString() === val);
                          if (pt) { setWalkInName(pt.name); setWalkInDob(pt.date_of_birth?.split('T')[0] || ''); }
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-indigo-100 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                    >
                      {existingPatients.map(p => (
                        <option key={p.id} value={p.id}>{p.name} {p.mrn ? `(${p.mrn})` : ''}</option>
                      ))}
                      <option value="new">+ Add New Family Member</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Patient Name */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Patient Name *</label>
                <input
                  type="text"
                  required
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  disabled={selectedPatientId !== 'new' && existingPatients.length > 0}
                  placeholder="Full name"
                  className="w-full px-4 py-3 bg-[#F1F5F9] border-0 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Date of Birth */}
              {(selectedPatientId === 'new' || existingPatients.length === 0) && (
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={walkInDob}
                    onChange={(e) => setWalkInDob(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F1F5F9] border-0 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                  />
                </div>
              )}

              {/* Assign Doctor */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Assign Doctor *</label>
                <select
                  required
                  value={walkInDoctorId}
                  onChange={(e) => setWalkInDoctorId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F1F5F9] border-0 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                >
                  <option value="">— Select Doctor —</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>Dr. {d.name} (₹{d.consultation_fee || 500})</option>
                  ))}
                </select>
              </div>

              {/* Pre-Consultation Remarks */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Remarks</label>
                <textarea
                  rows={3}
                  value={walkInRemarks}
                  onChange={(e) => setWalkInRemarks(e.target.value)}
                  placeholder="Patient complaints, vitals, notes..."
                  className="w-full px-4 py-3 bg-[#F1F5F9] border-0 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 placeholder-slate-400 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={walkInLoading}
                className="w-full flex justify-center items-center gap-2 py-3.5 bg-[#6366f1] hover:bg-[#5558e6] disabled:bg-slate-300 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
              >
                {walkInLoading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Registering...</>
                  : <><UserPlus className="w-4 h-4" /> Register & Add to Queue</>
                }
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT PANEL: Queue Control (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Queue */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Today's OPD Queue</h2>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{activeQueue.length} patients waiting</p>
              </div>
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#F1F5F9] border-0 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 placeholder-slate-400"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-10 text-center text-slate-400 text-xs font-bold uppercase tracking-wider animate-pulse">Loading Queue...</div>
            ) : activeQueue.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                  <Users className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No active patients in queue</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {activeQueue.map((apt) => (
                  <div key={apt.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                        <span className="text-xs font-black text-indigo-700">{apt.patientName?.charAt(0)?.toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{apt.patientName}</p>
                        {apt.patientMrn && <p className="text-[9px] text-slate-400 font-medium mt-0.5">{apt.patientMrn}</p>}
                        <p className="text-[9px] text-slate-500 font-medium mt-0.5">Dr. {apt.doctorName} · {apt.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:shrink-0">
                      <span className={`px-2.5 py-1 border rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${statusBadgeColor(apt.status)}`}>
                        {apt.status}
                      </span>
                      {(apt.status === 'Scheduled' || apt.status === 'Checked-In') && (
                        <button
                          onClick={() => handleStatusChange(apt.id, 'In Consultation')}
                          className="px-3 py-1.5 bg-[#6366f1] hover:bg-[#5558e6] text-white text-[9px] font-extrabold uppercase tracking-wider rounded-lg transition cursor-pointer"
                        >
                          Send In →
                        </button>
                      )}
                      <select
                        value={apt.status}
                        onChange={(e) => handleStatusChange(apt.id, e.target.value)}
                        className="px-2 py-1.5 bg-[#F1F5F9] border-0 rounded-lg text-[9px] font-bold text-slate-600 focus:outline-none cursor-pointer"
                      >
                        {statusOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Appointments */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/40">
              <div>
                <h2 className="text-sm font-black text-emerald-800 uppercase tracking-wider">Completed Appointments</h2>
                <p className="text-[10px] text-emerald-600 font-medium mt-0.5">{completedQueue.length} seen today</p>
              </div>
              <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-extrabold uppercase tracking-widest rounded-xl border border-emerald-200">
                {completedQueue.length} done
              </span>
            </div>

            {completedQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                No completed appointments yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {completedQueue.map((apt) => (
                  <div key={apt.id} className="px-6 py-4 flex items-center justify-between opacity-75 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">{apt.patientName}</p>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">Dr. {apt.doctorName} · {apt.time}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 border border-emerald-100 bg-emerald-50 text-emerald-700 text-[9px] font-extrabold uppercase tracking-wider rounded-lg">
                      Completed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
