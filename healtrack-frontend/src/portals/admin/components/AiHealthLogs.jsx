import React from 'react';
import { FileText } from 'lucide-react';

export function AiHealthLogs({ aiHealthStats }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-[#e9ecef] rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                    <h3 className="font-bold text-slate-800 text-base">Triage Engine Logs</h3>
                    <p className="text-xs text-slate-400">Live monitoring of risk classification breakdown across symptomsChecker runs.</p>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-slate-50 border border-[#e9ecef] rounded-xl p-4 space-y-1">
                        <span className="block text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Low Risk</span>
                        <span className="text-2xl font-bold text-emerald-700">{aiHealthStats.triageRiskRatios?.Low || 0}</span>
                    </div>
                    <div className="bg-slate-50 border border-[#e9ecef] rounded-xl p-4 space-y-1">
                        <span className="block text-[10px] text-yellow-800 font-bold uppercase tracking-wider">Medium Risk</span>
                        <span className="text-2xl font-bold text-yellow-600">{aiHealthStats.triageRiskRatios?.Medium || 0}</span>
                    </div>
                    <div className="bg-slate-50 border border-[#e9ecef] rounded-xl p-4 space-y-1">
                        <span className="block text-[10px] text-red-800 font-bold uppercase tracking-wider">High Risk</span>
                        <span className="text-2xl font-bold text-red-600">{aiHealthStats.triageRiskRatios?.High || 0}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-[#e9ecef] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-100">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">Preventive recommendations Dispatcher</h3>
                        <p className="text-[10px] text-slate-400 font-semibold">Running ML logic checks for chronic diseases</p>
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex justify-between items-center">
                    <div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Preventive Recommendations Sent</span>
                        <span className="text-3xl font-extrabold text-slate-800">{aiHealthStats.preventiveRecsSent}</span>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                        🟢 Active Cron Monitor
                    </span>
                </div>
            </div>
        </div>
    );
}
