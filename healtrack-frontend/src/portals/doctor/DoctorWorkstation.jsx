import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { ENDPOINTS } from '../../api/endpoints';

// Import Icons from Lucide
import { Activity, Search, Bell, Monitor, CheckCircle2 } from 'lucide-react';
import { io } from 'socket.io-client';

// Import Subcomponents
import { PatientQueue } from './components/PatientQueue';
import { VitalsCard } from './components/VitalsCard';
import { HistoryTimeline } from './components/HistoryTimeline';
import { PrescriptionBuilder } from './components/PrescriptionBuilder';
import { ReportUpload } from './components/ReportUpload';

export default function DoctorWorkstation() {
    const [appointments, setAppointments] = useState([]);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [patientHistory, setPatientHistory] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [dateFilter, setDateFilter] = useState('today');

    // Form fields
    const [diagnosis, setDiagnosis] = useState('');
    const [preRemarks, setPreRemarks] = useState('');
    const [postRemarks, setPostRemarks] = useState('');
    const [vitals, setVitals] = useState({
        weight_kg: '',
        height_cm: '',
        systolic_bp: '',
        diastolic_bp: '',
        pulse_rate: ''
    });
    const [prescriptionItems, setPrescriptionItems] = useState([
        { medicine_name: '', dosage: '', frequency: '1-0-1 (Morning/Night)', duration: '' }
    ]);
    const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        fetchAppointments();
        
        // Setup Socket.io connection
        const socket = io('http://localhost:5001');
        
        socket.on('QUEUE_UPDATE', (data) => {
            console.log("Realtime event received: QUEUE_UPDATE", data);
            fetchAppointments(true); // pass true to indicate it's a background refresh
            fetchStats();
        });

        return () => {
            socket.disconnect();
        };
    }, [dateFilter]); // re-fetch if filter changes

    const fetchAppointments = async (isBackgroundRefresh = false) => {
        if (!isBackgroundRefresh) setLoading(true);
        try {
            const response = await axiosClient.get(`${ENDPOINTS.DOCTOR.GET_APPOINTMENTS}?date_filter=${dateFilter}`);
            if (response.data && response.data.success) {
                setAppointments(response.data.data);
                if (response.data.data.length > 0) {
                    handleSelectAppointment(response.data.data[0]);
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
            pulse_rate: appt.pulse_rate || ''
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
                pulse_rate: vitals.pulse_rate ? parseInt(vitals.pulse_rate) : null
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
            <header className="h-14 bg-white border-b border-[#e9ecef] px-6 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <div className="bg-emerald-700 text-white p-1.5 rounded-lg">
                        <Activity className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <h2 className="font-bold text-slate-800 text-base leading-none">HealTrack <span className="text-emerald-700">Doctor</span></h2>
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-64 relative hidden md:block">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                            <Search className="w-4 h-4 stroke-[2.2]" />
                        </span>
                        <input 
                            type="text" 
                            placeholder="Search patient..."
                            className="w-full bg-[#f1f3f5] border-0 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700 transition"
                        />
                    </div>
                    <div className="h-6 w-px bg-[#e9ecef]"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-[11px]">
                            DR
                        </div>
                        <span className="text-xs font-semibold text-slate-800 hidden sm:block">Doctor Portal</span>
                    </div>
                </div>
            </header>

            {/* MAIN WORKSPACE */}
            <main className="flex-1 flex overflow-hidden">
                {/* COLUMN 1: Daily Queue */}
                <PatientQueue 
                    appointments={appointments} 
                    selectedAppointment={selectedAppointment}
                    handleSelectAppointment={handleSelectAppointment}
                    dateFilter={dateFilter}
                    setDateFilter={setDateFilter}
                />

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
                    </div>
                ) : !selectedAppointment ? (
                    <div className="flex-1 flex items-center justify-center text-slate-400 flex-col">
                        <Monitor className="w-12 h-12 mb-4 text-slate-300" />
                        <p>Select a patient from the queue to start session.</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col relative overflow-hidden">
                        
                        {/* Session Header */}
                        <div className="bg-white border-b border-[#e9ecef] p-4 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">{selectedAppointment.patient_name}</h2>
                                <p className="text-xs text-slate-500">
                                    {selectedAppointment.gender} • {new Date().getFullYear() - new Date(selectedAppointment.date_of_birth).getFullYear()} yrs • Blood: {selectedAppointment.blood_group}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 text-sm font-semibold">
                                <span className={`px-3 py-1 rounded-full border ${
                                    selectedAppointment.status === 'Completed' 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                    {selectedAppointment.status}
                                </span>
                            </div>
                        </div>

                        {/* Split Panes */}
                        <div className="flex-1 flex gap-6 p-6 overflow-hidden">
                            {/* Left Pane: History Timeline */}
                            <div className="flex-1 min-w-0">
                                <HistoryTimeline patientHistory={patientHistory} loadingHistory={loadingHistory} />
                            </div>
                            
                            {/* Right Pane: Vitals & Prescriptions */}
                            <div className="w-[400px] shrink-0 flex flex-col gap-6 overflow-y-auto pr-2 pb-24">
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
                        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#e9ecef] p-4 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                            <div className="text-sm font-medium">
                                {submitStatus.message && (
                                    <span className={submitStatus.type === 'error' ? 'text-red-500' : 'text-emerald-600'}>
                                        {submitStatus.message}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={handleSubmitConsultation}
                                disabled={selectedAppointment.status === 'Completed'}
                                className={`px-6 py-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
                                    selectedAppointment.status === 'Completed'
                                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                        : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-md'
                                }`}
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                {selectedAppointment.status === 'Completed' ? 'Consultation Completed' : 'Sign & Complete Consultation'}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
