import { toast } from '../../components/ui/Toast';
import React, { useState, useEffect } from 'react';
import { KpiBanner } from './components/KpiBanner';
import { OpdQueueTable } from './components/OpdQueueTable';
import { WalkInModal } from './components/WalkInModal';
import { UserPlus, Bell, LogOut, Activity, Clock, Users, CheckCircle, Search, Loader2, Banknote, CreditCard, X, CalendarX2, HelpCircle } from 'lucide-react';
import axiosClient, { SOCKET_URL } from '../../api/axiosClient';
import EmptyState from '../../components/ui/EmptyState';
import { io } from 'socket.io-client';
import { Footer } from '../../components/ui/Footer';
import RaiseTicketModal from '../../components/ui/RaiseTicketModal';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CustomDropdown } from '../../components/ui/CustomDropdown';
import { motion } from 'framer-motion';

import { useLocation } from 'react-router-dom';

export default function ReceptionDesk() {
  const location = useLocation();
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
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

  // Payment modal state
  const [paymentModal, setPaymentModal] = useState(null); // { appointmentId, patientId, doctorId, clinicId, doctorName }
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentDone, setPaymentDone] = useState(null); // { method, receipt_id, fee }

  // Sub Tab Navigation and Ledger History state
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'queue'); // 'queue', 'payments'

  useEffect(() => {
      if (location.state?.tab) {
          setActiveTab(location.state.tab);
      }
  }, [location.state]);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentSearchTerm, setPaymentSearchTerm] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [refundModal, setRefundModal] = useState(null); // { paymentId, amount, patientName }
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

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

  const fetchPayments = async (isBackground = false) => {
    if (!isBackground) setPaymentsLoading(true);
    try {
      const res = await axiosClient.get('/payments/reception/payments');
      setPayments(res.data || []);
    } catch (err) {
      console.error("Failed to fetch reception payments", err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    if (!refundModal || !refundReason.trim()) return;
    setRefundLoading(true);
    try {
      await axiosClient.post('/payments/reception/refund', {
        payment_id: refundModal.paymentId,
        reason: refundReason
      });
      setNotification(`Refund of ₹${parseFloat(refundModal.amount).toFixed(2)} processed successfully for ${refundModal.patientName}`);
      setTimeout(() => setNotification(null), 5000);
      setRefundModal(null);
      setRefundReason('');
      fetchPayments();
      fetchQueue();
    } catch (err) {
      toast.error('Refund failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setRefundLoading(false);
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch =
      p.receipt_id?.toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
      p.invoice_id?.toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
      p.patient_name?.toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
      p.doctor_name?.toLowerCase().includes(paymentSearchTerm.toLowerCase());
    
    const matchesStatus = paymentStatusFilter === '' || p.status === paymentStatusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    fetchQueue();
    fetchPayments();
    const socket = io(SOCKET_URL);
    socket.on('QUEUE_UPDATE', (data) => {
      if (data.message) {
        setNotification(data.message);
        setTimeout(() => setNotification(null), 5000);
      }
      fetchQueue(true);
      fetchPayments(true);
    });
    return () => socket.disconnect();
  }, []);

  // Phone lookup effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (walkInPhone.length >= 5) {
        setLookingUp(true);
        try {
          const res = await axiosClient.get(`/reception/${clinicId}/lookup?phone=${walkInPhone}`);
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
  }, [walkInPhone, clinicId]);

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
      const isNew = selectedPatientId === 'new' || !selectedPatientId;
      const res = await axiosClient.post(`/reception/${clinicId}/walk-in`, {
        phone: walkInPhone,
        doctor_id: walkInDoctorId,
        patient_id: isNew ? null : selectedPatientId,
        new_patient_name: isNew ? walkInName : null,
        dob: isNew ? walkInDob : null,
        pre_remarks: walkInRemarks
      });
      // Show payment modal
      const { appointmentId, doctor_id: aptDoctorId, patientId: aptPatientId } = res.data;
      const selectedDoctor = doctors.find(d => d.id.toString() === walkInDoctorId.toString());
      setPaymentModal({
        appointmentId,
        patientId: aptPatientId,
        doctorId: walkInDoctorId,
        clinicId,
        doctorName: selectedDoctor?.name || 'Doctor',
        fee: selectedDoctor?.consultation_fee || 500
      });
      setPaymentDone(null);
      setWalkInPhone(''); setWalkInName(''); setWalkInDob(''); setWalkInDoctorId(''); setWalkInRemarks('');
      setExistingPatients([]); setSelectedPatientId('');
      fetchQueue();
    } catch (err) {
      setWalkInError('Failed to register walk-in patient.');
    } finally {
      setWalkInLoading(false);
    }
  };

  const handleCashPayment = async () => {
    if (!paymentModal) return;
    setPaymentLoading(true);
    try {
      const res = await axiosClient.post('/payments/reception/walkin-cash', {
        appointment_id: paymentModal.appointmentId,
        patient_id: paymentModal.patientId,
        doctor_id: paymentModal.doctorId,
        clinic_id: paymentModal.clinicId
      });
      setPaymentDone({ method: 'Cash', receipt_id: res.data.receipt_id, fee: res.data.fee });
      fetchQueue();
    } catch (err) {
      toast.error('Failed to record cash payment: ' + (err.response?.data?.message || err.message));
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleOnlinePayment = async () => {
    if (!paymentModal) return;
    setPaymentLoading(true);
    try {
      // Load Razorpay script
      const rzpLoaded = await new Promise((resolve) => {
        if (window.Razorpay) { resolve(true); return; }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
      if (!rzpLoaded) { toast.error('Failed to load payment gateway.'); setPaymentLoading(false); return; }

      // Create order
      const orderRes = await axiosClient.post('/payments/reception/walkin-order', {
        appointment_id: paymentModal.appointmentId,
        patient_id: paymentModal.patientId,
        doctor_id: paymentModal.doctorId,
        clinic_id: paymentModal.clinicId
      });

      let paymentProcessed = false;

      const options = {
        key: orderRes.data.keyId,
        amount: orderRes.data.amount,
        currency: orderRes.data.currency,
        name: 'HealTrack',
        description: `Consultation with Dr. ${paymentModal.doctorName}`,
        order_id: orderRes.data.orderId,
        handler: async function (response) {
          paymentProcessed = true;
          try {
            await axiosClient.post('/payments/reception/walkin-verify', {
              appointment_id: paymentModal.appointmentId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
            setPaymentDone({ method: 'Online', receipt_id: response.razorpay_payment_id, fee: orderRes.data.fee });
            fetchQueue();
          } catch (err) {
            toast.error('Payment verification failed: ' + (err.response?.data?.message || err.message));
          }
        },
        modal: {
          ondismiss: async () => {
            if (paymentProcessed) return;
            try {
              await axiosClient.post('/payments/reception/walkin-cancel', {
                appointment_id: paymentModal.appointmentId
              });
            } catch (err) {
              console.error('Error cancelling payment order:', err);
            }
            fetchQueue();
          }
        },
        theme: { color: '#6366f1' }
      };
      setPaymentLoading(false);
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => toast.error('Payment failed: ' + resp.error.description));
      rzp.open();
    } catch (err) {
      toast.error('Error initiating payment: ' + (err.response?.data?.message || err.message));
      setPaymentLoading(false);
    }
  };

  const closePaymentModal = () => {
    setPaymentModal(null);
    setPaymentDone(null);
    fetchQueue();
    fetchPayments();
  };

  const handleStatusChangeAttempt = (id, newStatus, appointment) => {
    if (appointment.consultation_type === 'In-Person' && appointment.payment_status === 'Pending') {
      if (newStatus !== 'Cancelled' && newStatus !== 'Canceled') {
        toast.info('Payment must be completed first. Please click "Collect Payment" to record the payment.');
        return;
      }
    }
    handleStatusChange(id, newStatus);
  };

  const handleCollectPayment = (appointment) => {
    const doc = doctors.find(d => d.id === appointment.doctor_id || d.name === appointment.doctorName);
    setPaymentModal({
      appointmentId: appointment.id,
      patientId: appointment.patient_id,
      doctorId: appointment.doctor_id || (doc ? doc.id : null),
      clinicId: clinicId,
      doctorName: appointment.doctorName,
      fee: doc?.consultation_fee || 500
    });
    setPaymentDone(null);
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
    <div className="h-screen bg-[#F8FAFC] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-12 md:h-14 bg-gradient-to-r from-slate-700 to-slate-600 border border-slate-500 px-3 md:px-6 flex justify-between items-center shrink-0 rounded-2xl mx-2 md:mx-4 mt-2 shadow-sm sticky top-2 z-50">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="HealTrack Logo" className="w-7 h-7 md:w-8 md:h-8 object-contain rounded-xl shadow-sm" />
            <h2 className="font-bold text-white text-sm md:text-base leading-none">Reception <span className="text-cyan-400">Desk</span></h2>
          </div>
          {user?.clinic_name && (
            <div className="hidden lg:flex items-center px-3 py-1 bg-slate-700 border border-slate-600 rounded-full">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide mr-2">Clinic:</span>
              <span className="text-xs font-bold text-slate-100">{user.clinic_name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Live queue counter badge */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-800/60 text-slate-200 border border-slate-600 rounded-full px-3 py-1 text-xs font-bold">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            {activeQueue.length} Active in Queue
          </div>
          <div className="h-6 w-px bg-slate-600 hidden md:block"></div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200 hidden lg:block">{user?.name ? user.name : 'Reception Desk'}</span>
            <Button
              variant="outline"
              onClick={logout}
              className="ml-1 md:ml-2 p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition border-none bg-transparent cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Live notification toast */}
      {notification && (
        <div className="mx-4 mt-4 p-3.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl flex items-center gap-3 text-xs font-bold animate-pulse shadow-sm">
          <Bell className="w-4 h-4 text-blue-500 shrink-0" />
          {notification}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col overflow-y-auto pb-36"
      >
      <div className="flex flex-col">
      {/* KPI Metrics Bar */}
      <div className="px-4 md:px-8 pt-3.5 pb-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { 
              label: 'Total Walk-ins Today', 
              value: stats.totalWalkIns, 
              icon: Users, 
              gradient: 'from-indigo-500 to-indigo-600', 
              glow: 'shadow-indigo-500/25',
              tag: 'OPD Queue'
            },
            { 
              label: 'Avg Wait Time', 
              value: stats.avgWaitTime, 
              icon: Clock, 
              gradient: 'from-amber-500 to-orange-500', 
              glow: 'shadow-amber-500/25',
              tag: 'Live Status'
            },
            { 
              label: 'Active Doctors', 
              value: stats.activeDoctors, 
              icon: Activity, 
              gradient: 'from-emerald-500 to-teal-600', 
              glow: 'shadow-emerald-500/25',
              tag: 'On Duty'
            },
          ].map((stat) => (
            <div 
              key={stat.label} 
              className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-3xl p-4 md:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between relative overflow-hidden group"
            >
              <div className="flex items-center gap-3.5 z-10">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white flex items-center justify-center shrink-0 shadow-lg ${stat.glow}`}>
                  <stat.icon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-none">{stat.value}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{stat.label}</p>
                </div>
              </div>
              <span className="hidden xl:inline-block px-2.5 py-1 rounded-full text-[9px] font-extrabold bg-slate-100 text-slate-500 uppercase tracking-wider z-10">
                {stat.tag}
              </span>
              <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br ${stat.gradient} opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-300`}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content — Split Column */}
      <div className="px-4 md:px-8 py-3 grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT PANEL: Check-in Form (4 columns) */}
        <div className="lg:col-span-4">
          <div className="bg-slate-300/60 backdrop-blur-md border border-slate-400/60 rounded-3xl p-6 shadow-sm sticky top-[73px]">
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

            <form onSubmit={handleWalkInSubmit} className="space-y-5">
              {/* Phone lookup */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone (Patient Lookup)</label>
                <div className="relative">
                  <Input
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
                  <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <label className="block text-xs font-semibold text-indigo-600 mb-1.5">Select Family Member</label>
                    <CustomDropdown
                      value={selectedPatientId}
                      onChange={(val) => {
                        setSelectedPatientId(val);
                        if (val === 'new') { setWalkInName(''); setWalkInDob(''); }
                        else {
                          const pt = existingPatients.find(p => p.id.toString() === val);
                          if (pt) { setWalkInName(pt.name); setWalkInDob(pt.date_of_birth?.split('T')[0] || ''); }
                        }
                      }}
                      className="w-full"
                      options={[
                        { value: 'new', label: 'Create New Member' },
                        ...existingPatients.map(pt => ({ value: pt.id.toString(), label: `${pt.name} (${pt.date_of_birth?.split('T')[0] || 'No DOB'})` }))
                      ]}
                    />
                  </div>
                )}
              </div>

              {/* Patient Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Patient Name *</label>
                <Input
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date of Birth</label>
                  <Input
                    type="date"
                    value={walkInDob}
                    onChange={(e) => setWalkInDob(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F1F5F9] border-0 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                  />
                </div>
              )}

              {/* Assign Doctor */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Assign Doctor *</label>
                <CustomDropdown
                  value={walkInDoctorId}
                  onChange={setWalkInDoctorId}
                  className="w-full"
                  options={[
                    { value: "", label: "— Select Doctor —" },
                    ...doctors.map(d => ({ 
                      value: d.id.toString(), 
                      label: `${d.name?.toLowerCase().startsWith('dr') ? d.name : 'Dr. ' + d.name} (₹${d.consultation_fee || 500})` 
                    }))
                  ]}
                />
              </div>

              {/* Pre-Consultation Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Remarks</label>
                <textarea
                  rows={3}
                  value={walkInRemarks}
                  onChange={(e) => setWalkInRemarks(e.target.value)}
                  placeholder="Patient complaints, vitals, notes..."
                  className="w-full px-4 py-3 bg-[#F1F5F9] border-0 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 placeholder-slate-400 resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={walkInLoading}
                className="w-full flex justify-center items-center gap-2 py-3.5 bg-[#6366f1] hover:bg-[#5558e6] disabled:bg-slate-300 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border-none shadow-sm"
              >
                {walkInLoading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Registering...</>
                  : <><UserPlus className="w-4 h-4" /> Register & Add to Queue</>
                }
              </Button>
            </form>
          </div>

          {/* Need Help Support Box */}
          <div className="mt-4 bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200/60">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-xs text-slate-800 leading-none">Need help?</h4>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsTicketModalOpen(true)}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition-all shrink-0 border border-slate-200/80 cursor-pointer"
            >
              Support Center
            </Button>
          </div>
        </div>

        {/* RIGHT PANEL: Queue Control (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Sub Tab Navigation */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'queue'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              OPD Queue Management
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'payments'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Payment Ledger & History
            </button>
          </div>

          {activeTab === 'queue' && (
            <>
              {/* Active Queue */}
              <div className="bg-white border border-slate-100 rounded-3xl shadow-sm mb-6">
                <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Today's OPD Queue</h2>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{activeQueue.length} patients waiting</p>
                  </div>
                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                    <Input
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
                  <EmptyState 
                      icon={Users} 
                      title="Queue Empty" 
                      description="There are currently no patients waiting in the active queue."
                      className="border-none bg-transparent py-8"
                  />
                ) : (
                  <div className="divide-y divide-slate-50">
                    {activeQueue.map((apt) => (
                      <div key={apt.id} className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors last:rounded-b-3xl">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                            <span className="text-xs font-black text-indigo-700">{apt.patientName?.charAt(0)?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{apt.patientName}</p>
                            {apt.patientMrn && <p className="text-[9px] text-slate-400 font-medium mt-0.5">{apt.patientMrn}</p>}
                            <p className="text-[9px] text-slate-500 font-medium mt-0.5">Dr. {apt.doctorName} · {apt.time}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-extrabold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                {apt.consultation_type || 'In-Person'}
                              </span>
                              {apt.payment_status === 'Paid' ? (
                                <span className="px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded text-[9px] font-extrabold uppercase">Paid</span>
                              ) : apt.payment_status === 'Pending' ? (
                                <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded text-[9px] font-black uppercase">Payment Pending</span>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded text-[9px] font-semibold uppercase">—</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:shrink-0">
                          <span className={`px-2.5 py-1 border rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${statusBadgeColor(apt.status)}`}>
                            {apt.status}
                          </span>
                          {apt.consultation_type === 'In-Person' && apt.payment_status === 'Pending' ? (
                            <button
                              onClick={() => handleCollectPayment(apt)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-extrabold uppercase tracking-wider rounded-lg transition cursor-pointer border-none"
                            >
                              Collect Payment
                            </button>
                          ) : (
                            (apt.status === 'Scheduled' || apt.status === 'Checked-In') && (
                              <button
                                onClick={() => handleStatusChange(apt.id, 'In Consultation')}
                                className="px-3 py-1.5 bg-[#6366f1] hover:bg-[#5558e6] text-white text-[9px] font-extrabold uppercase tracking-wider rounded-lg transition cursor-pointer border-none"
                              >
                                Send In →
                              </button>
                            )
                          )}
                          {apt.status !== 'Cancelled' && apt.status !== 'Canceled' && (
                            <CustomDropdown
                              value={statusOptions.includes(apt.status) ? apt.status : 'Scheduled'}
                              onChange={(val) => handleStatusChangeAttempt(apt.id, val, apt)}
                              className="w-[120px] h-8 text-[9px] border-0 bg-[#F1F5F9]"
                              options={statusOptions.map(opt => ({ value: opt, label: opt }))}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Completed Appointments */}
              <div className="bg-white border border-slate-100 rounded-3xl shadow-sm">
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
                  <EmptyState 
                      icon={CalendarX2} 
                      title="None Completed" 
                      description="No patients have finished their appointments yet today."
                      className="border-none bg-transparent py-8"
                  />
                ) : (
                  <div className="divide-y divide-slate-50">
                    {completedQueue.map((apt) => (
                      <div key={apt.id} className="px-6 py-5 flex items-center justify-between opacity-75 hover:opacity-100 transition-opacity">
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
            </>
          )}

          {activeTab === 'payments' && (
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Payment Ledger</h2>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Track and refund outpatient transactions</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                    <Input
                      type="text"
                      placeholder="Search payments..."
                      value={paymentSearchTerm}
                      onChange={(e) => setPaymentSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-[#F1F5F9] border-0 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 placeholder-slate-400"
                    />
                  </div>
                  <CustomDropdown
                    value={paymentStatusFilter}
                    onChange={setPaymentStatusFilter}
                    className="w-[140px] h-9 border-0 bg-[#F1F5F9]"
                    options={[
                      { value: "", label: "All Statuses" },
                      { value: "Paid", label: "Paid" },
                      { value: "Refunded", label: "Refunded" },
                      { value: "Pending", label: "Pending" },
                      { value: "Failed", label: "Failed" }
                    ]}
                  />
                </div>
              </div>

              {paymentsLoading ? (
                <div className="p-10 text-center text-slate-400 text-xs font-bold uppercase tracking-wider animate-pulse">Loading Payments...</div>
              ) : filteredPayments.length === 0 ? (
                <EmptyState 
                    icon={CreditCard} 
                    title="No transaction logs found" 
                    description="There are no payment records matching your search or filters."
                    className="border-none bg-transparent"
                />
              ) : (
                <>
                  {/* MOBILE VIEW CARD LIST (Hidden on Desktop) */}
                  <div className="block md:hidden space-y-4">
                    {filteredPayments.map((p) => (
                      <div key={p.id} className="p-4 border border-slate-100 hover:border-indigo-100 rounded-2xl space-y-2 bg-[#FAFBFD]/40 transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-mono font-bold text-slate-900">{p.receipt_id}</p>
                            <p className="text-[8px] text-slate-400 mt-0.5">INV: {p.invoice_id}</p>
                          </div>
                          <span className={`px-2 py-0.5 text-[8px] font-extrabold rounded border uppercase tracking-wider ${
                            p.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            p.status === 'Refunded' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                            p.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                        
                        <div className="text-[11px] font-medium text-slate-600 space-y-1">
                          <p><span className="text-slate-400 font-semibold text-[9px] uppercase tracking-wider mr-1 block sm:inline">Patient:</span> <span className="text-slate-800 font-bold">{p.patient_name}</span></p>
                          <p><span className="text-slate-400 font-semibold text-[9px] uppercase tracking-wider mr-1 block sm:inline">Doctor:</span> Dr. {p.doctor_name}</p>
                          <p><span className="text-slate-400 font-semibold text-[9px] uppercase tracking-wider mr-1 block sm:inline">Date:</span> {new Date(p.created_at).toLocaleString('en-IN')}</p>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                          <p className="text-sm font-black text-slate-900">₹{parseFloat(p.amount).toFixed(2)}</p>
                          {p.status === 'Paid' && (
                            <Button
                              onClick={() => setRefundModal({ paymentId: p.id, amount: p.amount, patientName: p.patient_name })}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[9px] font-extrabold uppercase tracking-wider rounded-lg border-none transition cursor-pointer"
                            >
                              Refund
                            </Button>
                          )}
                          {p.status === 'Refunded' && (
                            <span className="text-[8px] bg-rose-50 border border-rose-100 text-rose-600 font-extrabold uppercase px-1.5 py-0.5 rounded">
                              Refunded
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* DESKTOP TABLE VIEW (Hidden on Mobile) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 uppercase tracking-wider text-[9px]">
                          <th className="p-3">Receipt / Invoice</th>
                          <th className="p-3">Patient</th>
                          <th className="p-3">Doctor</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {filteredPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3">
                              <p className="font-mono font-bold text-slate-900">{p.receipt_id}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{p.invoice_id}</p>
                            </td>
                            <td className="p-3 font-semibold text-slate-800">{p.patient_name}</td>
                            <td className="p-3">Dr. {p.doctor_name}</td>
                            <td className="p-3 text-slate-500">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                            <td className="p-3 font-bold text-slate-950">₹{parseFloat(p.amount).toFixed(2)}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 text-[8px] font-extrabold rounded border uppercase tracking-wider ${
                                p.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                p.status === 'Refunded' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                p.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                'bg-slate-50 text-slate-500 border-slate-200'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              {p.status === 'Paid' ? (
                                <Button
                                  onClick={() => setRefundModal({ paymentId: p.id, amount: p.amount, patientName: p.patient_name })}
                                  className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-extrabold uppercase tracking-wider rounded-lg border-none transition cursor-pointer"
                                >
                                  Refund
                                </Button>
                              ) : p.status === 'Refunded' ? (
                                <span className="text-[8px] bg-rose-50 border border-rose-100 text-rose-600 font-extrabold uppercase px-1.5 py-0.5 rounded">
                                  Refunded
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-t border-slate-200">
          <Footer />
      </div>
      </motion.div>

      {/* PAYMENT MODAL */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-[#f8fafc]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Collect Payment</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Dr. {paymentModal.doctorName} · ₹{paymentModal.fee}</p>
                </div>
              </div>
              {paymentDone && (
                <button onClick={closePaymentModal} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              )}
            </div>

            <div className="p-6">
              {paymentDone ? (
                /* Success state */
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-800 mb-1">Payment Confirmed!</h4>
                  <p className="text-xs text-slate-500 mb-1">Method: <span className="font-bold text-slate-700">{paymentDone.method}</span></p>
                  <p className="text-xs text-slate-500 mb-4">Ref: <span className="font-mono text-slate-700 text-[10px]">{paymentDone.receipt_id}</span></p>
                  <button
                    onClick={closePaymentModal}
                    className="px-6 py-2.5 bg-[#6366f1] hover:bg-[#5558e6] text-white rounded-xl text-xs font-bold uppercase tracking-widest transition"
                  >
                    Done
                  </button>
                </div>
              ) : (
                /* Payment selection */
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 text-center">Patient has been registered. How would they like to pay?</p>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Cash */}
                    <button
                      onClick={handleCashPayment}
                      disabled={paymentLoading}
                      className="flex flex-col items-center gap-3 p-5 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 hover:border-emerald-400 rounded-2xl transition-all group disabled:opacity-60"
                    >
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center transition">
                        <Banknote className="w-6 h-6 text-emerald-700" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-extrabold text-emerald-800">Pay Cash</p>
                        <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Record cash collected</p>
                      </div>
                    </button>

                    {/* Online */}
                    <button
                      onClick={handleOnlinePayment}
                      disabled={paymentLoading}
                      className="flex flex-col items-center gap-3 p-5 bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 hover:border-indigo-400 rounded-2xl transition-all group disabled:opacity-60"
                    >
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center transition">
                        <CreditCard className="w-6 h-6 text-indigo-700" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-extrabold text-indigo-800">Pay Online</p>
                        <p className="text-[10px] text-indigo-600 font-medium mt-0.5">Razorpay gateway</p>
                      </div>
                    </button>
                  </div>

                  {paymentLoading && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <span className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin"></span>
                      <span className="text-xs text-slate-500 font-medium">Processing...</span>
                    </div>
                  )}

                  <button
                    onClick={closePaymentModal}
                    className="w-full text-center text-xs text-slate-400 hover:text-slate-600 font-medium pt-2 transition"
                  >
                    Skip — collect payment later
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* REFUND MODAL */}
      {refundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-[#f8fafc]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Issue Refund</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Patient: {refundModal.patientName} · ₹{parseFloat(refundModal.amount).toFixed(2)}</p>
                </div>
              </div>
              <button onClick={() => { setRefundModal(null); setRefundReason(''); }} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleRefundSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Are you sure you want to refund this payment? This action will refund the payment and automatically cancel the corresponding appointment.
              </p>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Reason for Refund *</label>
                <textarea
                  required
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g., Doctor unavailable, Patient requested cancellation..."
                  className="w-full px-4 py-3 bg-[#F1F5F9] border-0 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-450/30 placeholder-slate-400 resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setRefundModal(null); setRefundReason(''); }}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={refundLoading || !refundReason.trim()}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border-none"
                >
                  {refundLoading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Refunding...</>
                    : 'Confirm Refund'
                  }
                </Button>
              </div>
            </form>
          </div>
        </div>
      {/* Support Ticket Modal */}
      <RaiseTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        portalUsed="Reception Desk"
      />
    </div>
  );
}
