import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { ENDPOINTS } from '../../api/endpoints';

// Import Icons from Lucide
import { 
    Activity, 
    BarChart2, 
    Users, 
    Sliders, 
    FileText, 
    HelpCircle, 
    Settings, 
    Search, 
    Bell, 
    Monitor, 
    Sparkles, 
    Check, 
    User 
} from 'lucide-react';

// Import Subcomponents
import { PatientDemographics } from './components/PatientDemographics';
import { VitalsCard } from './components/VitalsCard';
import { HistoryTimeline } from './components/HistoryTimeline';
import { PrescriptionBuilder } from './components/PrescriptionBuilder';
import { SendReminderModal } from './components/SendReminderModal';

// Import Mock Data
import { MOCK_APPOINTMENTS, MOCK_HISTORY } from './mockData';

export default function DoctorWorkstation() {
    const [appointments, setAppointments] = useState([]);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [patientHistory, setPatientHistory] = useState(null);
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Form fields
    const [diagnosis, setDiagnosis] = useState('Cardiology Consult');
    const [postRemarks, setPostRemarks] = useState('');
    const [vitals, setVitals] = useState({
        weight_kg: '',
        height_cm: '',
        systolic_bp: '',
        diastolic_bp: '',
        blood_sugar_mgdl: '',
        pulse_rate: '',
        spo2: ''
    });
    const [prescriptionItems, setPrescriptionItems] = useState([
        { medicine_name: 'Lisinopril', dosage: '10mg', frequency: 'Once Daily', duration: '30 Days. Take in the morning.' }
    ]);
    const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

    // Reminder States
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [reminderText, setReminderText] = useState('');
    const [sendingReminder, setSendingReminder] = useState(false);
    const [reminderResult, setReminderResult] = useState({ success: null, message: '', previewUrl: '' });

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get(ENDPOINTS.DOCTOR.GET_APPOINTMENTS);
            if (response.data && response.data.success && response.data.data.length > 0) {
                setAppointments(response.data.data);
                setIsDemoMode(false);
                handleSelectAppointment(response.data.data[0], false);
            } else {
                throw new Error("Empty list or backend issue");
            }
        } catch (error) {
            console.warn("Backend unavailable, loading Premium Light Mode Demo.");
            setAppointments(MOCK_APPOINTMENTS);
            setIsDemoMode(true);
            handleSelectAppointment(MOCK_APPOINTMENTS[0], true);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAppointment = async (appt, forceDemo = false) => {
        setSelectedAppointment(appt);
        setPostRemarks(appt.post_remarks || '');
        setSubmitStatus({ type: '', message: '' });
        setReminderResult({ success: null, message: '', previewUrl: '' });
        setReminderText(`Hi ${appt.patient_name},\n\nThis is a care reminder from Dr. Hayes regarding your health tracking. Please continue monitoring your vitals (current Blood Pressure: ${appt.systolic_bp || 140}/${appt.diastolic_bp || 90} mmHg) and remember to follow your treatment plan. Feel free to contact our clinic if you experience any worsening symptoms.\n\nBest regards,\nHealTrack Team`);
        setVitals({
            weight_kg: appt.weight_kg || '',
            height_cm: appt.height_cm || '',
            systolic_bp: appt.systolic_bp || '',
            diastolic_bp: appt.diastolic_bp || '',
            blood_sugar_mgdl: appt.blood_sugar_mgdl || '',
            pulse_rate: appt.pulse_rate || '',
            spo2: appt.spo2 || ''
        });

        if (appt.patient_id === 8492) {
            setDiagnosis('Cardiology Consult');
            setPrescriptionItems([
                { medicine_name: 'Lisinopril', dosage: '10mg', frequency: 'Once Daily', duration: '30 Days. Take in the morning.' }
            ]);
        } else {
            setDiagnosis('General Consultation');
            setPrescriptionItems([
                { medicine_name: 'Multivitamin', dosage: '1 tablet', frequency: 'Once Daily', duration: '30 Days.' }
            ]);
        }

        setLoadingHistory(true);
        try {
            if (forceDemo || isDemoMode) {
                setPatientHistory(MOCK_HISTORY[appt.patient_id] || { vitalsHistory: [], prescriptions: [] });
            } else {
                const response = await axiosClient.get(`${ENDPOINTS.DOCTOR.GET_HISTORY}/${appt.patient_id}`);
                if (response.data && response.data.success) {
                    setPatientHistory(response.data.data);
                }
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
        setPrescriptionItems([...prescriptionItems, { medicine_name: '', dosage: '', frequency: 'Once Daily', duration: '' }]);
    };

    const removePrescriptionRow = (index) => {
        setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
    };

    const calculateAge = (dobString) => {
        if (!dobString) return 'N/A';
        const today = new Date();
        const birthDate = new Date(dobString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const handleSubmitConsultation = async (e) => {
        if (e) e.preventDefault();
        if (!selectedAppointment) return;

        setSubmitStatus({ type: 'info', message: 'Finalizing consultation record...' });

        const payload = {
            appointmentId: selectedAppointment.appointment_id,
            patientId: selectedAppointment.patient_id,
            diagnosis,
            postRemarks,
            vitals: {
                weight_kg: vitals.weight_kg ? parseFloat(vitals.weight_kg) : null,
                height_cm: vitals.height_cm ? parseFloat(vitals.height_cm) : null,
                systolic_bp: vitals.systolic_bp ? parseInt(vitals.systolic_bp) : null,
                diastolic_bp: vitals.diastolic_bp ? parseInt(vitals.diastolic_bp) : null,
                blood_sugar_mgdl: vitals.blood_sugar_mgdl ? parseInt(vitals.blood_sugar_mgdl) : null,
                pulse_rate: vitals.pulse_rate ? parseInt(vitals.pulse_rate) : null,
                spo2: vitals.spo2 ? parseInt(vitals.spo2) : null
            },
            prescriptionItems: prescriptionItems.filter(item => item.medicine_name.trim() !== '')
        };

        try {
            if (isDemoMode) {
                await new Promise(resolve => setTimeout(resolve, 800));
                
                setAppointments(prev => prev.map(appt => 
                    appt.appointment_id === selectedAppointment.appointment_id
                        ? { ...appt, status: 'Completed', post_remarks: postRemarks, ...payload.vitals }
                        : appt
                ));
                
                setSelectedAppointment(prev => ({
                    ...prev,
                    status: 'Completed',
                    post_remarks: postRemarks,
                    ...payload.vitals
                }));

                const newHistoryPresc = {
                    prescription_id: Date.now(),
                    diagnosis,
                    appointment_date: new Date().toISOString(),
                    post_remarks: postRemarks,
                    doctor_name: 'Dr. Hayes',
                    items: payload.prescriptionItems
                };

                if (!MOCK_HISTORY[selectedAppointment.patient_id]) {
                    MOCK_HISTORY[selectedAppointment.patient_id] = { vitalsHistory: [], prescriptions: [] };
                }
                MOCK_HISTORY[selectedAppointment.patient_id].prescriptions.unshift(newHistoryPresc);

                setSubmitStatus({ type: 'success', message: 'Session finalized successfully!' });
            } else {
                const response = await axiosClient.post(ENDPOINTS.DOCTOR.COMPLETE_CONSULTATION, payload);
                if (response.data && response.data.success) {
                    setSubmitStatus({ type: 'success', message: 'Consultation successfully recorded!' });
                    fetchAppointments();
                } else {
                    throw new Error(response.data.message || "Submission failed");
                }
            }
        } catch (error) {
            console.error(error);
            setSubmitStatus({ type: 'error', message: 'Failed to finalize consultation.' });
        }
    };

    const handleSendReminder = async (e) => {
        e.preventDefault();
        if (!selectedAppointment) return;

        setSendingReminder(true);
        setReminderResult({ success: null, message: '', previewUrl: '' });

        try {
            const payload = {
                patientId: selectedAppointment.patient_id,
                reminderText: reminderText
            };

            const response = await axiosClient.post(ENDPOINTS.DOCTOR.SEND_REMINDER, payload);
            if (response.data && response.data.success) {
                setReminderResult({
                    success: true,
                    message: response.data.message || "Push notification sent successfully!"
                });
            } else {
                throw new Error(response.data.message || "Failed to send notification");
            }
        } catch (error) {
            console.error("Error sending push notification:", error);
            if (isDemoMode) {
                await new Promise(resolve => setTimeout(resolve, 600));

                // Native Browser Notification API simulator
                if (window.Notification) {
                    if (Notification.permission === 'granted') {
                        new Notification("HealTrack Patient Alert", { body: reminderText });
                    } else if (Notification.permission !== 'denied') {
                        const permission = await Notification.requestPermission();
                        if (permission === 'granted') {
                            new Notification("HealTrack Patient Alert", { body: reminderText });
                        }
                    }
                }

                setReminderResult({
                    success: true,
                    message: "Push notification simulated successfully on your desktop!"
                });
            } else {
                setReminderResult({
                    success: false,
                    message: error.message || "An error occurred while sending the notification."
                });
            }
        } finally {
            setSendingReminder(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] text-slate-700 flex font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
            {/* LEFT SIDEBAR */}
            <aside className="w-64 bg-white border-r border-[#e9ecef] flex flex-col shrink-0">
                {/* Logo Section */}
                <div className="p-6 border-b border-[#f1f3f5] flex items-center gap-3">
                    <div className="bg-emerald-700 text-white p-2 rounded-lg">
                        <Activity className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800 text-base leading-none">HealTrack</h2>
                        <span className="text-[10px] text-slate-400 font-medium tracking-wide">Enterprise Suite</span>
                    </div>
                </div>

                {/* Patient Search in Sidebar */}
                <div className="p-4 border-b border-[#f1f3f5]">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                            <Search className="w-4 h-4" />
                        </span>
                        <input 
                            type="text" 
                            placeholder="Quick lookup..."
                            className="w-full bg-[#f1f3f5] border-0 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-700 transition"
                        />
                    </div>
                </div>

                {/* Sidebar Navigation */}
                <nav className="flex-1 p-3 space-y-1">
                    <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-500 hover:bg-[#f1f3f5] hover:text-slate-800 transition text-sm font-medium">
                        <Monitor className="w-4 h-4" />
                        Dashboard
                    </a>
                    <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-500 hover:bg-[#f1f3f5] hover:text-slate-800 transition text-sm font-medium">
                        <BarChart2 className="w-4 h-4" />
                        Analytics
                    </a>
                    <a href="#" className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#e6f4f1] text-emerald-800 border-r-4 border-emerald-700 transition text-sm font-semibold">
                        <div className="flex items-center gap-3">
                            <Users className="w-4 h-4 stroke-[2.5]" />
                            Patients
                        </div>
                        <span className="px-1.5 py-0.5 bg-emerald-700 text-white rounded text-[10px]">{appointments.length}</span>
                    </a>
                    <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-500 hover:bg-[#f1f3f5] hover:text-slate-800 transition text-sm font-medium">
                        <Sliders className="w-4 h-4" />
                        Operations
                    </a>
                    <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-500 hover:bg-[#f1f3f5] hover:text-slate-800 transition text-sm font-medium">
                        <FileText className="w-4 h-4" />
                        Logs
                    </a>
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-[#f1f3f5] space-y-1">
                    <a href="#" className="flex items-center gap-3 px-4 py-2 rounded-lg text-slate-400 hover:text-slate-700 transition text-xs font-semibold">
                        <HelpCircle className="w-4 h-4" />
                        Support
                    </a>
                    <a href="#" className="flex items-center gap-3 px-4 py-2 rounded-lg text-slate-400 hover:text-slate-700 transition text-xs font-semibold">
                        <Settings className="w-4 h-4" />
                        Settings
                    </a>
                </div>
            </aside>

            {/* Main Content Area Container */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* TOP BAR */}
                <header className="h-16 bg-white border-b border-[#e9ecef] px-8 flex justify-between items-center shrink-0">
                    {/* Header Left: Global Search */}
                    <div className="w-80 relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                            <Search className="w-4 h-4 stroke-[2.2]" />
                        </span>
                        <input 
                            type="text" 
                            placeholder="Search patient ID or name..."
                            className="w-full bg-[#f1f3f5]/85 border border-[#e9ecef] rounded-full pl-9 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-700/50 focus:ring-1 focus:ring-emerald-700/10 transition"
                        />
                    </div>

                    {/* Header Right: Menu Links & Profile */}
                    <div className="flex items-center gap-8">
                        <div className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
                            <a href="#" className="hover:text-slate-900 transition">Directory</a>
                            <a href="#" className="hover:text-slate-900 transition">Resources</a>
                            <a href="#" className="hover:text-slate-900 transition">Reports</a>
                        </div>
                        
                        {/* Queue dropdown selection */}
                        <div className="flex items-center gap-2 border-l border-[#e9ecef] pl-6">
                            <select 
                                onChange={(e) => {
                                    const appt = appointments.find(a => a.appointment_id === parseInt(e.target.value));
                                    if (appt) handleSelectAppointment(appt);
                                }}
                                value={selectedAppointment?.appointment_id || ''}
                                className="text-xs bg-transparent border-0 font-bold text-slate-700 focus:ring-0 focus:outline-none cursor-pointer hover:text-emerald-700 transition"
                            >
                                {appointments.map(a => (
                                    <option key={a.appointment_id} value={a.appointment_id}>{a.patient_name} (Queue)</option>
                                ))}
                            </select>
                        </div>

                        {/* Quick Icons */}
                        <div className="flex items-center gap-4 text-slate-500">
                            <button className="relative p-1.5 hover:bg-[#f1f3f5] rounded-full transition">
                                <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                                <Bell className="w-5 h-5" />
                            </button>
                            <button className="p-1.5 hover:bg-[#f1f3f5] rounded-full transition">
                                <HelpCircle className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Profile Avatar */}
                        <div className="flex items-center gap-2 bg-[#f1f3f5]/60 px-3 py-1.5 rounded-full border border-[#e9ecef]">
                            <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white text-[11px]">
                                DH
                            </div>
                            <span className="text-xs font-semibold text-slate-800 hidden md:block">Dr. Hayes</span>
                        </div>
                    </div>
                </header>

                {/* WORKSPACE COLUMNS CONTAINER */}
                <main className="flex-1 p-8 overflow-y-auto flex gap-6 min-w-0">
                    {!selectedAppointment ? (
                        <div className="flex-1 flex flex-col items-center justify-center bg-white border border-[#e9ecef] rounded-2xl p-10 text-slate-400">
                            <Activity className="w-12 h-12 text-slate-300 mb-4 animate-bounce" />
                            <h3 className="font-bold text-slate-700 text-lg">No Active Patient</h3>
                            <p className="text-xs text-slate-400 mt-1">Please select an appointment from the dropdown above to begin.</p>
                        </div>
                    ) : (
                        <>
                            {/* COLUMN 1: PATIENT PROFILE & VITALS */}
                            <section className="w-80 flex flex-col gap-6 shrink-0">
                                <PatientDemographics 
                                    selectedAppointment={selectedAppointment} 
                                    calculateAge={calculateAge} 
                                    onOpenReminder={() => {
                                        setReminderResult({ success: null, message: '', previewUrl: '' });
                                        setShowReminderModal(true);
                                    }}
                                />
                                <VitalsCard vitals={vitals} handleVitalsChange={handleVitalsChange} />
                            </section>

                            {/* COLUMN 2: ACTIVE SESSION & HISTORY TIMELINE */}
                            <section className="flex-1 flex flex-col gap-6 min-w-0">
                                {/* Top Banner Card */}
                                <div className="bg-white border border-[#e9ecef] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="text-emerald-700">
                                            <Monitor className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-bold text-slate-800 text-sm">Active Session: Dr. Hayes</h4>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => alert(`Running AI disease/risk prediction engine on selected patient parameters:\nBP: ${vitals.systolic_bp}/${vitals.diastolic_bp}\nPulse: ${vitals.pulse_rate}\nSpO2: ${vitals.spo2}%`)}
                                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                        >
                                            <Sparkles className="w-3.5 h-3.5" />
                                            AI Risk Check
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => handleSubmitConsultation()}
                                            disabled={selectedAppointment.status === 'Completed'}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                                selectedAppointment.status === 'Completed'
                                                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                                    : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm shadow-emerald-700/10 cursor-pointer'
                                            }`}
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                            {selectedAppointment.status === 'Completed' ? 'Session Finalized' : 'Finalize Log'}
                                        </button>
                                    </div>
                                </div>

                                <HistoryTimeline loadingHistory={loadingHistory} patientHistory={patientHistory} />
                            </section>

                            {/* COLUMN 3: PRESCRIPTION BUILDER & CLINICAL NOTES */}
                            <section className="w-80 flex flex-col gap-6 shrink-0">
                                <PrescriptionBuilder 
                                    prescriptionItems={prescriptionItems}
                                    handlePrescriptionChange={handlePrescriptionChange}
                                    addPrescriptionRow={addPrescriptionRow}
                                    removePrescriptionRow={removePrescriptionRow}
                                    postRemarks={postRemarks}
                                    setPostRemarks={setPostRemarks}
                                    submitStatus={submitStatus}
                                />
                            </section>
                        </>
                    )}
                </main>
            </div>

            {/* SEND REMINDER MODAL */}
            <SendReminderModal 
                showReminderModal={showReminderModal}
                selectedAppointment={selectedAppointment}
                onClose={() => setShowReminderModal(false)}
                reminderText={reminderText}
                setReminderText={setReminderText}
                handleSendReminder={handleSendReminder}
                sendingReminder={sendingReminder}
                reminderResult={reminderResult}
            />
        </div>
    );
}
