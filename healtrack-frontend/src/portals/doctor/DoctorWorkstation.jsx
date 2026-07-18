import React, { useState, useEffect } from 'react';
import axiosClient, { SOCKET_URL } from '../../api/axiosClient';
import { ENDPOINTS } from '../../api/endpoints';

// Import Icons from Lucide
import { Search, Monitor, CheckCircle2, LogOut, Users, Video } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';

// Import Subcomponents
import { PatientQueue } from './components/PatientQueue';
import { VitalsCard } from './components/VitalsCard';
import { HistoryTimeline } from './components/HistoryTimeline';
import { PrescriptionBuilder } from './components/PrescriptionBuilder';
import { ReportUpload } from './components/ReportUpload';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const getInitials = (name) => {
    if (!name) return 'DR';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
};

export default function DoctorWorkstation() {
    const { logout, user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const selectedApptRef = React.useRef(selectedAppointment);
    selectedApptRef.current = selectedAppointment;

    const [patientHistory, setPatientHistory] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [dateFilter, setDateFilter] = useState('today');
    const [searchQuery, setSearchQuery] = useState('');
    const [showQueue, setShowQueue] = useState(false);

    // Form fields
    const [diagnosis, setDiagnosis] = useState('');
    const [preRemarks, setPreRemarks] = useState('');
    const [postRemarks, setPostRemarks] = useState('');
    const [vitals, setVitals] = useState({
        weight_kg: '',
        height_cm: '',
        systolic_bp: '',
        diastolic_bp: '',
        pulse_rate: '',
        blood_sugar_mgdl: ''
    });
    const [prescriptionItems, setPrescriptionItems] = useState([
        { medicine_name: '', dosage: '', frequency: '1-0-1 (Morning/Night)', duration: '' }
    ]);
    const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
    const [incomingNotifications, setIncomingNotifications] = useState([]);

    useEffect(() => {
        fetchAppointments();
        
        // Setup Socket.io connection
        const socket = io(SOCKET_URL);
        
        socket.on('QUEUE_UPDATE', (data) => {
            console.log("Realtime event received: QUEUE_UPDATE", data);
            fetchAppointments(true); // pass true to indicate it's a background refresh
        });

        socket.on('PATIENT_COMING', (data) => {
            console.log("Realtime event received: PATIENT_COMING", data);
            if (data.doctorId === user?.id) {
                const newNotification = {
                    id: Date.now() + Math.random(),
                    patientName: data.patientName,
                    status: data.status
                };
                setIncomingNotifications(prev => [newNotification, ...prev]);
                setTimeout(() => {
                    setIncomingNotifications(prev => prev.filter(n => n.id !== newNotification.id));
                }, 8000);
                fetchAppointments(true);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [dateFilter, user]); // re-fetch if filter or user changes

    const fetchAppointments = async (isBackgroundRefresh = false) => {
        if (!isBackgroundRefresh) setLoading(true);
        try {
            const response = await axiosClient.get(`${ENDPOINTS.DOCTOR.GET_APPOINTMENTS}?date_filter=${dateFilter}`);
            if (response.data && response.data.success) {
                const activeApps = (response.data.data || []).filter(a => a.status !== 'Cancelled' && a.status !== 'Canceled');
                setAppointments(activeApps);
                
                const currentSel = selectedApptRef.current;
                if (activeApps.length > 0) {
                    const stillExists = currentSel ? activeApps.some(a => a.appointment_id === currentSel.appointment_id) : false;
                    if (!stillExists) {
                        handleSelectAppointment(activeApps[0]);
                    }
                } else {
                    setSelectedAppointment(null);
                }
            }
        } catch (error) {
            console.error("Failed to fetch appointments:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAppointment = async (appt) => {
        setSelectedAppointment(appt);
        setDiagnosis('');
        setPreRemarks(appt.pre_remarks || '');
        setPostRemarks(appt.post_remarks || '');
        setSubmitStatus({ type: '', message: '' });
        
        setVitals({
            weight_kg: appt.weight_kg || '',
            height_cm: appt.height_cm || '',
            systolic_bp: appt.systolic_bp || '',
            diastolic_bp: appt.diastolic_bp || '',
            pulse_rate: appt.pulse_rate || '',
            blood_sugar_mgdl: appt.blood_sugar_mgdl || ''
        });

        setPrescriptionItems([
            { medicine_name: '', dosage: '', frequency: '1-0-1 (Morning/Night)', duration: '' }
        ]);

        setLoadingHistory(true);
        try {
            const response = await axiosClient.get(`${ENDPOINTS.DOCTOR.GET_HISTORY}/${appt.patient_id}`);
            if (response.data && response.data.success) {
                setPatientHistory(response.data.data);
            }
        } catch (error) {
            console.error("Failed to load patient history:", error);
            setPatientHistory({ vitalsHistory: [], prescriptions: [] });
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleVitalsChange = (e) => {
        const { name, value } = e.target;
        setVitals(prev => ({ ...prev, [name]: value }));
    };

    const handlePrescriptionChange = (index, field, value) => {
        const updated = [...prescriptionItems];
        updated[index][field] = value;
        setPrescriptionItems(updated);
    };

    const addPrescriptionRow = () => {
        setPrescriptionItems([...prescriptionItems, { medicine_name: '', dosage: '', frequency: '1-0-1 (Morning/Night)', duration: '' }]);
    };

    const removePrescriptionRow = (index) => {
        setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
    };

    const handleSubmitConsultation = async () => {
        if (!selectedAppointment) return;
        
        // Use generic diagnosis if none provided for MVP
        const finalDiagnosis = diagnosis || 'General Clinical Evaluation';

        setSubmitStatus({ type: 'info', message: 'Finalizing consultation...' });

        const payload = {
            appointmentId: selectedAppointment.appointment_id,
            patientId: selectedAppointment.patient_id,
            diagnosis: finalDiagnosis,
            preRemarks,
            postRemarks,
            vitals: {
                weight_kg: vitals.weight_kg ? parseFloat(vitals.weight_kg) : null,
                height_cm: vitals.height_cm ? parseFloat(vitals.height_cm) : null,
                systolic_bp: vitals.systolic_bp ? parseInt(vitals.systolic_bp) : null,
                diastolic_bp: vitals.diastolic_bp ? parseInt(vitals.diastolic_bp) : null,
                pulse_rate: vitals.pulse_rate ? parseInt(vitals.pulse_rate) : null,
                blood_sugar_mgdl: vitals.blood_sugar_mgdl ? parseInt(vitals.blood_sugar_mgdl) : null
            },
            prescriptionItems: prescriptionItems.filter(item => item.medicine_name.trim() !== '')
        };

        try {
            const response = await axiosClient.post(ENDPOINTS.DOCTOR.COMPLETE_CONSULTATION, payload);
            if (response.data && response.data.success) {
                setSubmitStatus({ type: 'success', message: 'Consultation successfully recorded!' });
                
                // Update local state to reflect completion
                setAppointments(prev => prev.map(a => 
                    a.appointment_id === selectedAppointment.appointment_id
                        ? { ...a, status: 'Completed', pre_remarks: preRemarks, post_remarks: postRemarks }
                        : a
                ));
                setSelectedAppointment(prev => ({ ...prev, status: 'Completed', pre_remarks: preRemarks, post_remarks: postRemarks }));
                
                // Refresh history to show new prescription
                handleSelectAppointment({ ...selectedAppointment, status: 'Completed', pre_remarks: preRemarks, post_remarks: postRemarks });
            } else {
                throw new Error(response.data.message || "Submission failed");
            }
        } catch (error) {
            console.error(error);
            setSubmitStatus({ type: 'error', message: 'Failed to finalize consultation.' });
        }
    };

    return (
        <div className="h-screen bg-[#f8f9fa] text-slate-700 flex flex-col font-sans antialiased overflow-hidden">
            {/* TOP BAR */}
            <header className="h-14 bg-white border-b border-[#e9ecef] px-3 md:px-6 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2 md:gap-4">
                    <Button variant="outline" onClick={() => setShowQueue(!showQueue)} className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg border-none bg-transparent">
                        <Users className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="HealTrack Logo" className="w-7 h-7 md:w-8 md:h-8 object-contain" />
                        <h2 className="font-bold text-slate-800 text-sm md:text-base leading-none">HealTrack <span className="text-indigo-700">Doctor</span></h2>
                    </div>
                    {user?.clinic_name && (
                        <div className="hidden lg:flex items-center px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide mr-2">Clinic:</span>
                            <span className="text-xs font-bold text-indigo-800">{user.clinic_name}</span>
                        </div>
                    )}
                </div>




                <div className="flex items-center gap-2 md:gap-4">
                    <div className="w-48 lg:w-64 relative hidden md:block">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                            <Search className="w-4 h-4 stroke-[2.2]" />
                        </span>
                            <Input 
                                type="text" 
                                placeholder="Search patient..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#f1f3f5] rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-700 transition"
                            />
                    </div>
                    <div className="h-6 w-px bg-[#e9ecef] hidden md:block"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-[11px] uppercase">
                            {getInitials(user?.name)}
                        </div>
                        <span className="text-xs font-semibold text-slate-800 hidden lg:block">{user?.name ? `Dr. ${user.name}` : 'Doctor Portal'}</span>
                        <Button variant="outline" onClick={logout} className="ml-1 md:ml-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition border-none bg-transparent" title="Logout">
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* MAIN WORKSPACE */}
            <main className="flex-1 flex overflow-hidden">
                        {/* COLUMN 1: Daily Queue */}
                        <PatientQueue 
                            appointments={appointments.filter(a => a.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()))} 
                            selectedAppointment={selectedAppointment}
                            handleSelectAppointment={handleSelectAppointment}
                            dateFilter={dateFilter}
                            setDateFilter={setDateFilter}
                        />


                        {loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-700"></div>
                            </div>
                        ) : !selectedAppointment ? (
                            <div className="flex-1 flex items-center justify-center text-slate-400 flex-col p-4">
                                <Monitor className="w-12 h-12 mb-4 text-slate-300" />
                                <p className="text-center">Select a patient from the queue to start session.</p>
                                <Button onClick={() => setShowQueue(true)} className="lg:hidden mt-4 bg-indigo-700 text-white border-none">
                                    Open Patient Queue
                                </Button>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col relative overflow-hidden">
                                
                                {/* Session Header */}
                                <div className="bg-white border-b border-[#e9ecef] p-3 md:p-4 flex justify-between items-center shrink-0">
                                    <div>
                                        <h2 className="text-base md:text-lg font-bold text-slate-800">{selectedAppointment.patient_name}</h2>
                                        <p className="text-xs text-slate-500">
                                            {selectedAppointment.gender} • {new Date().getFullYear() - new Date(selectedAppointment.date_of_birth).getFullYear()} yrs • Blood: {selectedAppointment.blood_group}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-semibold">
                                        {selectedAppointment.consultation_type === 'Teleconsultation' && (
                                            <span className="px-2 md:px-3 py-1 rounded-full border text-xs md:text-sm bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                                                <Video size={14} />
                                                Teleconsultation
                                            </span>
                                        )}
                                        <span className={`px-2 md:px-3 py-1 rounded-full border text-xs md:text-sm ${
                                            selectedAppointment.status === 'Completed' 
                                                ? 'bg-[#eef2ff] text-indigo-700 border-indigo-200'
                                                : selectedAppointment.status === 'Canceled' || selectedAppointment.status === 'Cancelled'
                                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                            {selectedAppointment.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Split Panes — Stack on mobile, side-by-side on desktop */}
                                <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 lg:p-6 overflow-y-auto lg:overflow-hidden">
                                    {/* Left Pane: History Timeline */}
                                    <div className="lg:flex-1 min-w-0 flex flex-col lg:h-full lg:overflow-hidden">
                                        <HistoryTimeline patientHistory={patientHistory} loadingHistory={loadingHistory} />
                                    </div>
                                    
                                    {/* Right Pane: Vitals & Prescriptions */}
                                    <div className="w-full lg:w-[400px] lg:shrink-0 flex flex-col gap-4 lg:gap-6 lg:overflow-y-auto lg:pr-2 pb-24">
                                        <VitalsCard vitals={vitals} handleVitalsChange={handleVitalsChange} />
                                        
                                        <ReportUpload 
                                            patientId={selectedAppointment.patient_id}
                                            appointmentId={selectedAppointment.appointment_id}
                                            doctorId={selectedAppointment.doctor_id}
                                        />

                                        <PrescriptionBuilder 
                                            prescriptionItems={prescriptionItems}
                                            handlePrescriptionChange={handlePrescriptionChange}
                                            addPrescriptionRow={addPrescriptionRow}
                                            removePrescriptionRow={removePrescriptionRow}
                                            diagnosis={diagnosis}
                                            setDiagnosis={setDiagnosis}
                                            preRemarks={preRemarks}
                                            setPreRemarks={setPreRemarks}
                                            postRemarks={postRemarks}
                                            setPostRemarks={setPostRemarks}
                                        />
                                    </div>
                                </div>

                                {/* ATOMIC SIGN-OFF BAR */}
                                <div className="border-t border-slate-200 p-4 lg:p-6 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div className="text-sm font-semibold text-slate-500">
                                        {submitStatus.message && (
                                            <span className={submitStatus.type === 'error' ? 'text-red-500' : 'text-indigo-600'}>
                                                {submitStatus.message}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                        {selectedAppointment.consultation_type === 'Teleconsultation' && selectedAppointment.meeting_link && !['Completed', 'Canceled', 'Cancelled'].includes(selectedAppointment.status) && (
                                            <Button 
                                                onClick={() => window.open(selectedAppointment.meeting_link, '_blank')}
                                                className="w-full sm:w-auto px-4 md:px-6 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md border-none"
                                            >
                                                <Video className="w-5 h-5" />
                                                Join Video Call
                                            </Button>
                                        )}
                                        <Button 
                                            onClick={handleSubmitConsultation}
                                            disabled={['Completed', 'Canceled', 'Cancelled'].includes(selectedAppointment.status)}
                                            className={`w-full sm:w-auto px-4 md:px-6 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm border-none ${
                                                ['Completed', 'Canceled', 'Cancelled'].includes(selectedAppointment.status)
                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-md'
                                            }`}
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                            {selectedAppointment.status === 'Completed' ? 'Completed' : 
                                             ['Canceled', 'Cancelled'].includes(selectedAppointment.status) ? 'Cancelled' : 
                                             'Sign & Complete'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
            </main>

            {/* FLOATING NOTIFICATIONS */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
                {incomingNotifications.map(notification => (
                    <div 
                        key={notification.id}
                        className="pointer-events-auto bg-white border-l-4 border-[#6366f1] rounded-xl shadow-2xl p-4 flex items-start gap-3 transition-all duration-300 border border-slate-100"
                    >
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-[#6366f1] shrink-0">
                            <Users className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xs font-bold text-slate-800">Patient Coming</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                <span className="font-semibold text-[#6366f1]">{notification.patientName}</span> is coming to your workstation. Status: <span className="font-semibold text-amber-600">{notification.status}</span>.
                            </p>
                        </div>
                        <button 
                            onClick={() => setIncomingNotifications(prev => prev.filter(n => n.id !== notification.id))}
                            className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
