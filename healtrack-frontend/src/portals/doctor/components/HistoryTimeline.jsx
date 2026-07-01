import React from 'react';
import { Clock } from 'lucide-react';

export function HistoryTimeline({ loadingHistory, patientHistory }) {
    return (
        <div className="bg-white border border-[#e9ecef] rounded-2xl p-5 shadow-sm flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Longitudinal History
                </h4>
                <button className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition">Filter</button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 relative">
                {loadingHistory ? (
                    <div className="flex flex-col items-center justify-center h-48 space-y-2">
                        <div className="w-6 h-6 border-2 border-emerald-700/20 border-t-emerald-700 rounded-full animate-spin"></div>
                        <span className="text-xs text-slate-400">Loading timeline...</span>
                    </div>
                ) : !patientHistory || !patientHistory.prescriptions || patientHistory.prescriptions.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">No history records found.</div>
                ) : (
                    <div className="relative border-l-2 border-[#e9ecef] ml-6 pl-8 space-y-6 pb-2">
                        {patientHistory.prescriptions.map((pr, i) => {
                            const date = new Date(pr.appointment_date);
                            const month = date.toLocaleString('en-US', { month: 'short' });
                            const year = date.getFullYear();
                            const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

                            return (
                                <div key={pr.prescription_id} className="relative">
                                    <span className="absolute -left-[54px] top-1.5 w-11 h-11 rounded-full bg-white border border-[#e9ecef] shadow-sm flex flex-col items-center justify-center leading-none text-slate-600">
                                        <span className="text-[10px] font-bold">{month}</span>
                                        <span className="text-[8px] text-slate-400 font-semibold mt-0.5">{year}</span>
                                    </span>

                                    <div className="bg-white border border-[#e9ecef] rounded-xl p-4 shadow-sm hover:border-[#ced4da] transition space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h5 className="font-bold text-slate-800 text-sm leading-snug">{pr.diagnosis}</h5>
                                                <span className="text-[10px] text-slate-400 font-medium">{formattedDate}</span>
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-400 tracking-wider">DR. {pr.doctor_name.toUpperCase()}</span>
                                        </div>

                                        {pr.post_remarks && (
                                            <p className="text-xs text-slate-500 leading-relaxed font-normal">{pr.post_remarks}</p>
                                        )}

                                        {pr.items && pr.items.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                {pr.items.map((it, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-[#f8f9fa] border border-[#e9ecef] rounded-lg text-[10px] text-slate-600 font-medium">
                                                        {it.medicine_name} {it.dosage}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
