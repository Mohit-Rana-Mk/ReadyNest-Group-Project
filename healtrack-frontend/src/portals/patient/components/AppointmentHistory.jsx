import React from 'react';
import { Calendar, Clock, User, Building2, FileText, Video, AlertTriangle, X, Loader2, ShieldAlert, CreditCard, MapPin } from 'lucide-react';
import { CustomDropdown } from '../../../components/ui/CustomDropdown';
import axiosClient from '../../../api/axiosClient';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const statusColors = {
    'Scheduled':       'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Confirmed':       'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Checked-In':      'bg-indigo-50 text-indigo-700 border-indigo-200',
    'In Consultation': 'bg-violet-50 text-violet-700 border-violet-200',
    'Completed':       'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Cancelled':       'bg-red-50 text-red-700 border-red-200',
    'Canceled':        'bg-red-50 text-red-700 border-red-200',
};

const downloadPrescriptionPDF = (appt) => {
    try {
        const doc = new jsPDF();
        
        // Header bar
        doc.setFillColor(99, 102, 241); 
        doc.rect(0, 0, 210, 15, 'F');
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(31, 41, 55); 
        doc.text(appt.clinic_name || "HealTrack Clinic", 14, 30);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128); 
        if (appt.clinic_address) {
            doc.text(`${appt.clinic_address}, ${appt.clinic_city || ""}`, 14, 35);
        }
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(99, 102, 241);
        doc.text("MEDICAL PRESCRIPTION", 14, 48);
        
        doc.setDrawColor(229, 231, 235);
        doc.line(14, 52, 196, 52);
        
        // Demographics
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(75, 85, 99);
        doc.text("Patient Name:", 14, 60);
        doc.setFont("helvetica", "normal");
        doc.text(appt.patient_name || "N/A", 42, 60);
        
        doc.setFont("helvetica", "bold");
        doc.text("Doctor Name:", 14, 66);
        doc.setFont("helvetica", "normal");
        doc.text(`Dr. ${appt.doctor_name || "N/A"}`, 42, 66);
        
        doc.setFont("helvetica", "bold");
        doc.text("Date:", 120, 60);
        doc.setFont("helvetica", "normal");
        const dateStr = new Date(appt.appointment_date).toLocaleDateString('en-IN', { 
            day: 'numeric', month: 'short', year: 'numeric' 
        });
        doc.text(dateStr, 135, 60);
        
        // Vitals
        const vitals = [];
        if (appt.weight_kg) vitals.push(`Weight: ${appt.weight_kg} kg`);
        if (appt.systolic_bp && appt.diastolic_bp) vitals.push(`BP: ${appt.systolic_bp}/${appt.diastolic_bp}`);
        if (appt.pulse_rate) vitals.push(`Pulse: ${appt.pulse_rate} bpm`);
        
        if (vitals.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.text("Vitals:", 120, 66);
            doc.setFont("helvetica", "normal");
            doc.text(vitals.join(" | "), 135, 66);
        }
        
        doc.line(14, 72, 196, 72);
        
        let yPos = 80;
        
        // Clinical Notes
        if (appt.post_remarks) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(31, 41, 55);
            doc.text("Doctor's Notes / Remarks:", 14, yPos);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(75, 85, 99);
            
            const splitRemarks = doc.splitTextToSize(appt.post_remarks, 180);
            doc.text(splitRemarks, 14, yPos + 6);
            yPos += 12 + (splitRemarks.length * 5);
        }
        
        // Prescriptions
        let rxs = [];
        try {
            rxs = typeof appt.prescriptions === 'string' ? JSON.parse(appt.prescriptions) : appt.prescriptions;
        } catch (e) {}
        
        if (Array.isArray(rxs) && rxs.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(31, 41, 55);
            doc.text("Prescribed Medications:", 14, yPos);
            
            const columns = [
                { header: 'Medicine Name', dataKey: 'medicine_name' },
                { header: 'Dosage', dataKey: 'dosage' },
                { header: 'Frequency', dataKey: 'frequency' },
                { header: 'Duration', dataKey: 'duration' },
                { header: 'Instructions', dataKey: 'instructions' }
            ];
            
            const rows = rxs.map(rx => ({
                medicine_name: rx.medicine_name || "",
                dosage: rx.dosage || "",
                frequency: rx.frequency || "",
                duration: rx.duration || "",
                instructions: rx.instructions || ""
            }));
            
            autoTable(doc, {
                columns: columns,
                body: rows,
                startY: yPos + 4,
                theme: 'striped',
                headStyles: { fillColor: [99, 102, 241] },
                margin: { left: 14, right: 14 }
            });
        } else {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(10);
            doc.setTextColor(107, 114, 128);
            doc.text("No medications prescribed.", 14, yPos + 6);
        }
        
        doc.save(`Prescription_${appt.patient_name || "Patient"}_${dateStr.replace(/ /g, "_")}.pdf`);
    } catch (error) {
        console.error("Failed to generate PDF", error);
    }
};

export default function AppointmentHistory({ appointments, onRefresh }) {
    const [selectedPatientId, setSelectedPatientId] = React.useState('');
    const [cancelModalOpen, setCancelModalOpen] = React.useState(false);
    const [appointmentToCancel, setAppointmentToCancel] = React.useState(null);
    const [isCancelling, setIsCancelling] = React.useState(false);
    const [cancelError, setCancelError] = React.useState('');

    const [rescheduleModalOpen, setRescheduleModalOpen] = React.useState(false);
    const [appointmentToReschedule, setAppointmentToReschedule] = React.useState(null);
    const [newAppointmentDate, setNewAppointmentDate] = React.useState('');
    const [isRescheduling, setIsRescheduling] = React.useState(false);
    const [rescheduleError, setRescheduleError] = React.useState('');

    const [refundModalOpen, setRefundModalOpen] = React.useState(false);
    const [appointmentToRefund, setAppointmentToRefund] = React.useState(null);
    const [refundReason, setRefundReason] = React.useState('');
    const [isRefundSubmitting, setIsRefundSubmitting] = React.useState(false);
    const [refundError, setRefundError] = React.useState('');

    const handleInitiateCancel = (appt) => {
        setAppointmentToCancel(appt);
        setCancelModalOpen(true);
        setCancelError('');
    };

    const handleInitiateReschedule = (appt) => {
        setAppointmentToReschedule(appt);
        const d = new Date(appt.appointment_date);
        // Format to YYYY-MM-DDTHH:MM local format
        const tzoffset = d.getTimezoneOffset() * 60000; 
        const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
        setNewAppointmentDate(localISOTime);
        setRescheduleModalOpen(true);
        setRescheduleError('');
    };

    const handleInitiateRefund = (appt) => {
        setAppointmentToRefund(appt);
        setRefundReason('');
        setRefundError('');
        setRefundModalOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!appointmentToCancel) return;
        setIsCancelling(true);
        setCancelError('');
        try {
            await axiosClient.put(`/patient/appointments/${appointmentToCancel.id}/cancel`);
            setCancelModalOpen(false);
            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Cancel error:', err);
            setCancelError(err.response?.data?.message || 'Failed to cancel appointment. Please try again.');
        } finally {
            setIsCancelling(false);
        }
    };

    const handleConfirmReschedule = async () => {
        if (!appointmentToReschedule || !newAppointmentDate) return;
        setIsRescheduling(true);
        setRescheduleError('');
        try {
            await axiosClient.put(`/patient/appointments/${appointmentToReschedule.id}/reschedule`, {
                new_date: newAppointmentDate
            });
            setRescheduleModalOpen(false);
            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Reschedule error:', err);
            setRescheduleError(err.response?.data?.message || 'Failed to reschedule appointment. Please try again.');
        } finally {
            setIsRescheduling(false);
        }
    };

    const handleConfirmRefund = async (e) => {
        e.preventDefault();
        if (!appointmentToRefund || !refundReason.trim()) return;
        setIsRefundSubmitting(true);
        setRefundError('');
        try {
            await axiosClient.post('/payments/refund-request', {
                payment_id: appointmentToRefund.payment_id,
                reason: refundReason
            });
            setRefundModalOpen(false);
            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Refund request error:', err);
            setRefundError(err.response?.data?.message || 'Failed to submit refund request. Please try again.');
        } finally {
            setIsRefundSubmitting(false);
        }
    };

    if (!appointments || appointments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <FileText size={40} strokeWidth={1.2} />
                <p className="mt-3 text-sm">No records found yet.</p>
            </div>
        );
    }

    const uniquePatients = Array.from(new Map(appointments.map(a => [a.patient_id, a.patient_name])).entries()).filter(([id, name]) => id && name);
    
    const filteredAppointments = selectedPatientId 
        ? appointments.filter(a => a.patient_id?.toString() === selectedPatientId)
        : appointments;

    return (
        <div className="space-y-4">
            <div className="px-1 flex justify-between items-end">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">My Records</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Your family's health history</p>
                </div>
                {uniquePatients.length > 0 && (
                    <CustomDropdown 
                        value={selectedPatientId}
                        onChange={setSelectedPatientId}
                        className="w-[150px] h-8 text-[10px]"
                        options={[
                            { value: "", label: "All Family" },
                            ...uniquePatients.map(([id, name]) => ({ value: id.toString(), label: name }))
                        ]}
                    />
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAppointments.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
                        <p className="text-sm">No records found for this family member.</p>
                    </div>
                ) : filteredAppointments.map(appt => {
                    const date = new Date(appt.appointment_date);
                    const statusClass = statusColors[appt.status] || 'bg-gray-50 text-gray-700 border-gray-200';

                    return (
                        <div key={appt.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-full">
                            <div>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <User size={13} className="text-gray-400" />
                                            <span className="text-sm font-semibold text-gray-900">Dr. {appt.doctor_name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Building2 size={12} className="text-gray-400" />
                                            <span className="text-xs text-gray-500">{appt.clinic_name}</span>
                                        </div>
                                        {appt.patient_name && (
                                            <div className="mt-1.5 inline-flex items-center text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium border border-indigo-100">
                                                Patient: {appt.patient_name}
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusClass}`}>
                                        {appt.status}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50 flex-wrap">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <Calendar size={12} />
                                        {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <Clock size={12} />
                                        {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    {appt.consultation_type === 'Teleconsultation' && (
                                        <div className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                                            <Video size={10} />
                                            Teleconsultation
                                        </div>
                                    )}
                                </div>

                                {/* Pre Remarks */}
                                {appt.pre_remarks && (
                                    <div className="mt-3 text-xs bg-orange-50 p-2 rounded-lg border border-orange-100">
                                        <span className="font-semibold text-orange-800">Reason for visit: </span>
                                        <span className="text-orange-700">{appt.pre_remarks}</span>
                                    </div>
                                )}

                                {/* Vitals & Post Remarks (Always show if present) */}
                                <div className="mt-3 space-y-2">
                                    {(appt.weight_kg || appt.systolic_bp) && (
                                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Vitals</p>
                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                                {appt.weight_kg && <div><span className="text-gray-400">Weight:</span> <span className="font-medium">{appt.weight_kg}kg</span></div>}
                                                {appt.systolic_bp && appt.diastolic_bp && <div><span className="text-gray-400">BP:</span> <span className="font-medium">{appt.systolic_bp}/{appt.diastolic_bp}</span></div>}
                                                {appt.pulse_rate && <div><span className="text-gray-400">Pulse:</span> <span className="font-medium">{appt.pulse_rate}bpm</span></div>}
                                            </div>
                                        </div>
                                    )}

                                    {appt.post_remarks && (
                                        <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Doctor's Notes</p>
                                            <p className="text-xs text-indigo-900">{appt.post_remarks}</p>
                                        </div>
                                    )}
                                    
                                    {/* Prescriptions */}
                                    {appt.prescriptions && (
                                        <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Prescriptions</p>
                                                <button 
                                                    onClick={() => downloadPrescriptionPDF(appt)}
                                                    className="text-[9px] font-extrabold uppercase bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded transition flex items-center gap-1 cursor-pointer"
                                                >
                                                    <FileText size={10} />
                                                    Download PDF
                                                </button>
                                            </div>
                                            <div className="space-y-1.5">
                                                {(() => {
                                                    let rxs = [];
                                                    try {
                                                        rxs = typeof appt.prescriptions === 'string' ? JSON.parse(appt.prescriptions) : appt.prescriptions;
                                                    } catch (e) {}
                                                    
                                                    if (!Array.isArray(rxs)) return null;

                                                    const validRxs = rxs.filter(rx => rx && rx.medicine_name);
                                                    if (validRxs.length === 0) return <p className="text-xs text-emerald-700 italic">No medications prescribed.</p>;

                                                    return validRxs.map((rx, idx) => (
                                                        <div key={idx} className="flex justify-between items-start text-xs border-b border-emerald-100/50 pb-1.5 last:border-0 last:pb-0">
                                                            <div>
                                                                <span className="font-bold text-emerald-900">{rx.medicine_name}</span>
                                                                <span className="text-emerald-700 ml-1">({rx.dosage})</span>
                                                                <p className="text-[10px] text-emerald-600 mt-0.5">{rx.instructions}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="block font-medium text-emerald-800">{rx.frequency}</span>
                                                                <span className="text-[10px] text-emerald-600">{rx.duration}</span>
                                                            </div>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Report Button */}
                                {appt.report_url && (
                                    <div className="mt-3 flex justify-end">
                                        <a 
                                            href={appt.report_url} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition flex items-center gap-1.5"
                                        >
                                            <FileText size={14} />
                                            View Report
                                        </a>
                                    </div>
                                )}

                                {/* Payment Details Section */}
                                {appt.payment_status && (
                                    <div className="mt-3 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center gap-2">
                                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                                            <CreditCard size={12} className="text-slate-400" />
                                            <span>Paid: <span className="font-bold text-slate-800">₹{parseFloat(appt.payment_amount).toFixed(2)}</span></span>
                                        </div>
                                        {appt.refund_status ? (
                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase border ${
                                                appt.refund_status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                appt.refund_status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                'bg-rose-50 text-rose-700 border-rose-200'
                                            }`}>
                                                Refund {appt.refund_status}
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[9px] font-extrabold uppercase">
                                                {appt.payment_status}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="mt-3">
                                {/* Join Call Button */}
                                {appt.consultation_type === 'Teleconsultation' && appt.meeting_link && appt.status !== 'Completed' && appt.status !== 'Cancelled' && appt.status !== 'Canceled' ? (
                                    <div className="pt-2">
                                        <button 
                                            onClick={() => window.open(appt.meeting_link, '_blank')}
                                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer"
                                        >
                                            <Video size={14} />
                                            Join Video Call
                                        </button>
                                    </div>
                                ) : appt.consultation_type !== 'Teleconsultation' && appt.status !== 'Completed' && appt.status !== 'Cancelled' && appt.status !== 'Canceled' && (
                                    <div className="pt-2">
                                        <a 
                                            href={appt.clinic_latitude && appt.clinic_longitude && Number(appt.clinic_latitude) !== 0 ? `https://maps.google.com/?q=${appt.clinic_latitude},${appt.clinic_longitude}` : `https://maps.google.com/?q=${encodeURIComponent(`${appt.clinic_address || appt.clinic_name} ${appt.clinic_city || ''}`.trim())}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer"
                                        >
                                            <MapPin size={14} />
                                            Navigate to Clinic
                                        </a>
                                    </div>
                                )}

                                {/* Cancel/Reschedule Actions */}
                                {['Scheduled', 'Checked-In', 'Confirmed'].includes(appt.status) && (
                                    <div className="pt-2 border-t border-gray-100 flex gap-2">
                                        <button 
                                            onClick={() => handleInitiateReschedule(appt)}
                                            className="flex-1 flex items-center justify-center gap-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[10px] font-bold uppercase tracking-wider py-2 px-3 rounded-xl border border-slate-200 hover:border-indigo-100 transition-all cursor-pointer"
                                        >
                                            Reschedule
                                        </button>
                                        <button 
                                            onClick={() => handleInitiateCancel(appt)}
                                            className="flex-1 flex items-center justify-center gap-1 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-[10px] font-bold uppercase tracking-wider py-2 px-3 rounded-xl border border-slate-200 hover:border-rose-100 transition-all cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}

                                {/* Refund Action for Paid but not refunded appointments (Only if appointment is not completed yet) */}
                                {appt.payment_status === 'Paid' && !appt.refund_status && appt.status !== 'Completed' && (
                                    <div className="pt-2 border-t border-gray-100 flex">
                                        <button 
                                            onClick={() => handleInitiateRefund(appt)}
                                            className="w-full flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold uppercase tracking-wider py-2 px-3 rounded-xl border border-rose-200 transition-all cursor-pointer"
                                        >
                                            <ShieldAlert size={12} />
                                            Request Refund
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Cancel Modal */}
            {cancelModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 relative">
                        <button 
                            onClick={() => setCancelModalOpen(false)}
                            className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                        
                        <div className="flex items-center gap-3.5 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Cancel Appointment</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Confirmation Required</p>
                            </div>
                        </div>

                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                            Are you sure you want to cancel your appointment with <span className="font-bold text-slate-800">Dr. {appointmentToCancel?.doctor_name}</span> at <span className="font-bold text-slate-800">{appointmentToCancel?.clinic_name}</span>?
                        </p>
                        
                        <div className="mt-3.5 p-3 rounded-2xl bg-rose-50/30 border border-rose-100/30 text-xs text-rose-700 font-medium leading-relaxed">
                            ⚠️ Cancellation will be processed immediately and the slot will be released.
                        </div>

                        {cancelError && (
                            <div className="mt-3 text-xs text-rose-600 font-bold bg-rose-50/50 p-2.5 rounded-xl border border-rose-100 animate-pulse">
                                {cancelError}
                            </div>
                        )}

                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            <button
                                disabled={isCancelling}
                                onClick={() => setCancelModalOpen(false)}
                                className="flex-1 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 transition-colors cursor-pointer"
                            >
                                No, Keep It
                            </button>
                            <button
                                disabled={isCancelling}
                                onClick={handleConfirmCancel}
                                className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-rose-600/10 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isCancelling ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Cancelling...
                                    </>
                                ) : (
                                    'Yes, Cancel'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reschedule Modal */}
            {rescheduleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 relative">
                        <button 
                            onClick={() => setRescheduleModalOpen(false)}
                            className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                        
                        <div className="flex items-center gap-3.5 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#7F3DEC] shrink-0">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Reschedule Appointment</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Select Date & Time</p>
                            </div>
                        </div>

                        <p className="text-sm text-slate-600 leading-relaxed font-medium mb-4">
                            Choose a new slot for your appointment with <span className="font-bold text-slate-800">Dr. {appointmentToReschedule?.doctor_name}</span>.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">New Date & Time</label>
                                <input 
                                    type="datetime-local" 
                                    required
                                    value={newAppointmentDate}
                                    onChange={(e) => setNewAppointmentDate(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all font-medium text-slate-700 bg-slate-50/50"
                                />
                            </div>
                        </div>

                        {rescheduleError && (
                            <div className="mt-3 text-xs text-rose-600 font-bold bg-rose-50/50 p-2.5 rounded-xl border border-rose-100 animate-pulse">
                                {rescheduleError}
                            </div>
                        )}

                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            <button
                                disabled={isRescheduling}
                                onClick={() => setRescheduleModalOpen(false)}
                                className="flex-1 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={isRescheduling}
                                onClick={handleConfirmReschedule}
                                className="flex-1 px-4 py-3 bg-[#7F3DEC] hover:bg-[#6c2ed2] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#7F3DEC]/10 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isRescheduling ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Reschedule'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Refund Modal */}
            {refundModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <form onSubmit={handleConfirmRefund} className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 relative">
                        <button 
                            type="button"
                            onClick={() => setRefundModalOpen(false)}
                            className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                        
                        <div className="flex items-center gap-3.5 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                                <ShieldAlert size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Request Refund</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Submit Refund Request</p>
                            </div>
                        </div>

                        <p className="text-sm text-slate-600 leading-relaxed font-medium mb-4">
                            You are requesting a refund of <span className="font-bold text-slate-800">₹{parseFloat(appointmentToRefund?.payment_amount).toFixed(2)}</span> for your appointment with <span className="font-bold text-slate-800">Dr. {appointmentToRefund?.doctor_name}</span>.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reason for Refund</label>
                                <textarea
                                    required
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    placeholder="Please provide the reason for your refund request..."
                                    rows={3}
                                    className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all font-medium text-slate-700 bg-slate-50/50"
                                />
                            </div>
                        </div>

                        {refundError && (
                            <div className="mt-3 text-xs text-rose-600 font-bold bg-rose-50/50 p-2.5 rounded-xl border border-rose-100 animate-pulse">
                                {refundError}
                            </div>
                        )}

                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                disabled={isRefundSubmitting}
                                onClick={() => setRefundModalOpen(false)}
                                className="flex-1 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isRefundSubmitting}
                                className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-rose-600/10 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isRefundSubmitting ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Request'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
