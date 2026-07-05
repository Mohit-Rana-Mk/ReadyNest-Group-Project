import React from 'react';
import { ShieldCheck, X, Calendar, ChevronRight, AlertTriangle } from 'lucide-react';
import { dismissRecommendation } from '../../../api/patientApi';

export default function PreventiveAlertBanner({ recommendations, onBookNow, onDismiss }) {
    // If no database recommendations, default to the Dengue mock alert from reference images
    const alertList = (recommendations && recommendations.length > 0) ? recommendations : [
        {
            id: 'mock-dengue-alert',
            alert_title: 'Epidemic Alert: Dengue Spread',
            alert_description: 'Alert: Elevated caseload trend observed for Dengue. Public awareness, sanitization campaigns, and diagnostic scaling are recommended to prevent further spread.',
            target_service: 'General Medicine',
            isMock: true
        }
    ];

    const handleDismiss = (id) => {
        if (onDismiss) {
            onDismiss(id);
        } else {
            dismissRecommendation(id).catch(err => console.error("Failed to dismiss alert:", err));
        }
    };

    return (
        <div className="bg-white rounded-3xl p-5 border border-slate-100/80 shadow-sm space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                        Preventive Care Alerts
                    </h3>
                </div>
                <span className="bg-[#f1f5f9] text-[#64748b] px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide">
                    {alertList.length} Pending
                </span>
            </div>

            {/* Alerts mapping */}
            <div className="space-y-4">
                {alertList.map(rec => (
                    <div
                        key={rec.id}
                        className="relative bg-[#FFF5F5] border border-[#FFE3E3] rounded-2xl p-5 shadow-[0_2px_8px_rgba(222,26,68,0.02)]"
                    >
                        {/* Dismiss Button */}
                        <button
                            onClick={() => handleDismiss(rec.id)}
                            className="absolute top-4 right-4 text-rose-300 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>

                        {/* Top Category Badge */}
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-[#DE1A44] bg-[#FFF0F2] border border-[#FFD2D9] px-2 py-0.5 rounded-md uppercase tracking-wider">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                Critical Alert
                            </span>
                            <span className="text-slate-400 text-xs font-semibold">•</span>
                            <span className="text-slate-400 text-xs font-semibold">{rec.target_service}</span>
                        </div>

                        {/* Alert Title */}
                        <h4 className="text-sm font-bold text-slate-900 tracking-tight leading-snug pr-6">
                            {rec.alert_title}
                        </h4>

                        {/* Alert Description */}
                        <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
                            {rec.alert_description}
                        </p>

                        {/* Footer row */}
                        <div className="flex items-center justify-between mt-5 pt-4 border-t border-rose-200/40">
                            <span className="text-[10px] font-black text-[#DE1A44] tracking-widest uppercase">
                                Zone Action Required
                            </span>
                            <button 
                                onClick={onBookNow}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#DE1A44] hover:bg-[#C8153A] px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer hover:shadow-md"
                            >
                                <Calendar size={13} className="fill-white/10" />
                                Book Consultation
                                <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
