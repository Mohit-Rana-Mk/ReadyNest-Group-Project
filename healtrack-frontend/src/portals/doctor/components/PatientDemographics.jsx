import { User, Bell } from 'lucide-react';

export function PatientDemographics({ selectedAppointment, calculateAge, onOpenReminder }) {
    if (!selectedAppointment) return null;

    return (
        <div className="space-y-6">
            {/* Patient Demographic Card */}
            <div className="bg-white border border-[#e9ecef] rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border-2 border-emerald-700/20">
                        <User className="w-8 h-8 text-slate-400" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-bold text-slate-800 text-base leading-snug">{selectedAppointment.patient_name}</h3>
                        <p className="text-[10px] text-slate-400 font-semibold tracking-wide">
                            ID: #{selectedAppointment.patient_id} &bull; {calculateAge(selectedAppointment.date_of_birth)}y &bull; {selectedAppointment.gender.charAt(0)}
                        </p>
                        {selectedAppointment.risk_level && (
                            <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-extrabold tracking-wider ${
                                selectedAppointment.risk_level.includes('HIGH') 
                                    ? 'bg-red-50 text-red-700 border border-red-200' 
                                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            }`}>
                                {selectedAppointment.risk_level}
                            </span>
                        )}
                    </div>
                </div>

                <hr className="border-[#f1f3f5]" />

                <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                        <span className="block text-slate-400 font-semibold mb-0.5">Blood Type</span>
                        <span className="font-bold text-slate-800">{selectedAppointment.blood_group || 'O Negative'}</span>
                    </div>
                    <div>
                        <span className="block text-slate-400 font-semibold mb-0.5">Allergies</span>
                        <span className="font-bold text-red-600">{selectedAppointment.allergies || 'Penicillin'}</span>
                    </div>
                </div>

                <button 
                    type="button"
                    onClick={onOpenReminder}
                    className="w-full mt-2 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-100/50 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                    <Bell className="w-3.5 h-3.5" />
                    Send Reminder
                </button>
            </div>

            {/* Pre-Consult Remarks Card */}
            <div className="bg-white border border-[#e9ecef] rounded-2xl p-5 shadow-sm space-y-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pre-Consult Remarks</span>
                <blockquote className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border-l-4 border-slate-300 italic leading-relaxed">
                    "{selectedAppointment.pre_remarks}"
                </blockquote>
            </div>
        </div>
    );
}
