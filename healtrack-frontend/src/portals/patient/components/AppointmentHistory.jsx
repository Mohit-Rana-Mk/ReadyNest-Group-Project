import React from 'react';
import { Calendar, Clock, User, Building2, FileText } from 'lucide-react';

const statusColors = {
    'Scheduled':       'bg-blue-50 text-blue-700 border-blue-200',
    'Checked-In':      'bg-indigo-50 text-indigo-700 border-indigo-200',
    'In Consultation': 'bg-violet-50 text-violet-700 border-violet-200',
    'Completed':       'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Cancelled':       'bg-red-50 text-red-700 border-red-200',
};

export default function AppointmentHistory({ appointments }) {
    const [selectedPatientId, setSelectedPatientId] = React.useState('');

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
                    <select 
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg p-1.5 focus:outline-none"
                    >
                        <option value="">All Family</option>
                        {uniquePatients.map(([id, name]) => (
                            <option key={id} value={id}>{name}</option>
                        ))}
                    </select>
                )}
            </div>

            <div className="space-y-3">
                {filteredAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <p className="text-sm">No records found for this family member.</p>
                    </div>
                ) : filteredAppointments.map(appt => {
                    const date = new Date(appt.appointment_date);
                    const statusClass = statusColors[appt.status] || 'bg-gray-50 text-gray-700 border-gray-200';

                    return (
                        <div key={appt.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
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

                            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Calendar size={12} />
                                    {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Clock size={12} />
                                    {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </div>
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
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5">Prescriptions</p>
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
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
