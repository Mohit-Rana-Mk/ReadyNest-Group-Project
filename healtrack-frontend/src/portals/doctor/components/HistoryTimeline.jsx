import React from 'react';
import { FileText, Clock, Activity, Pill } from 'lucide-react';

export function HistoryTimeline({ patientHistory, loadingHistory }) {
    if (loadingHistory) {
        return (
            <div className="flex-1 bg-white border border-[#e9ecef] rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
                <p className="mt-4 text-slate-500 text-sm">Loading patient history...</p>
            </div>
        );
    }

    if (!patientHistory || patientHistory.prescriptions.length === 0) {
        return (
            <div className="flex-1 bg-white border border-[#e9ecef] rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center h-full text-slate-500">
                <FileText className="w-12 h-12 mb-4 text-slate-300" />
                <p className="font-medium text-sm">No historical records found for this patient.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-white border border-[#e9ecef] rounded-2xl shadow-sm flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[#e9ecef] bg-slate-50 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Clinical History Timeline
                </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
                <div className="relative border-l-2 border-[#e9ecef] ml-3 space-y-8">
                    {patientHistory.prescriptions.map((record, index) => (
                        <div key={record.prescription_id || index} className="relative pl-6">
                            <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-emerald-500 ring-4 ring-white"></span>
                            
                            <div className="bg-white border border-[#e9ecef] rounded-xl p-4 shadow-sm">
                                <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-3">
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{record.diagnosis}</h4>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                            <span>{new Date(record.created_at || record.appointment_date).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>{record.doctor_name}</span>
                                        </div>
                                    </div>
                                </div>

                                {record.post_remarks && (
                                    <div className="mb-4">
                                        <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Clinical Notes</h5>
                                        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            {record.post_remarks}
                                        </p>
                                    </div>
                                )}
                                
                                {record.items && record.items.length > 0 && (
                                    <div>
                                        <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <Pill className="w-3.5 h-3.5" />
                                            Prescribed Medications
                                        </h5>
                                        <div className="grid gap-2">
                                            {record.items.map((item, i) => (
                                                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between text-sm bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/50">
                                                    <span className="font-medium text-slate-800">
                                                        {item.medicine_name} <span className="text-emerald-700 ml-1">{item.dosage}</span>
                                                    </span>
                                                    <div className="flex items-center gap-3 text-slate-500 mt-1 sm:mt-0 text-xs">
                                                        <span className="bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">{item.frequency}</span>
                                                        <span>{item.duration}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
