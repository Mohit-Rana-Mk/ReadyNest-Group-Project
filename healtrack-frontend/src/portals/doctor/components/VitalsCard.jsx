import React from 'react';
import { Heart, Activity, Wind, ChevronRight } from 'lucide-react';

export function VitalsCard({ vitals, handleVitalsChange }) {
    return (
        <div className="bg-white border border-[#e9ecef] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Vitals</h4>
                <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
            </div>

            <div className="space-y-2.5">
                {/* Blood Pressure Item */}
                <div className="bg-[#f0fdfa] border border-[#ccfbf1] rounded-xl p-3.5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="text-emerald-700">
                            <Heart className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        <div>
                            <span className="block text-[10px] text-emerald-800 font-semibold">Blood Pressure</span>
                            <div className="flex items-baseline gap-1.5">
                                <input 
                                    type="text" 
                                    name="systolic_bp"
                                    value={vitals.systolic_bp}
                                    onChange={handleVitalsChange}
                                    className="w-8 bg-transparent border-b border-emerald-300 focus:outline-none focus:border-emerald-700 font-bold text-slate-800 text-sm p-0"
                                />
                                <span className="font-bold text-slate-800 text-sm">/</span>
                                <input 
                                    type="text" 
                                    name="diastolic_bp"
                                    value={vitals.diastolic_bp}
                                    onChange={handleVitalsChange}
                                    className="w-8 bg-transparent border-b border-emerald-300 focus:outline-none focus:border-emerald-700 font-bold text-slate-800 text-sm p-0"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">mmHg</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Heart Rate / Pulse */}
                <div className="bg-[#f8f9fa] border border-[#e9ecef] rounded-xl p-3.5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="text-slate-500">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="block text-[10px] text-slate-500 font-semibold">Heart Rate</span>
                            <div className="flex items-baseline gap-1">
                                <input 
                                    type="text" 
                                    name="pulse_rate"
                                    value={vitals.pulse_rate}
                                    onChange={handleVitalsChange}
                                    className="w-10 bg-transparent border-b border-slate-300 focus:outline-none focus:border-slate-700 font-bold text-slate-800 text-sm p-0"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">bpm</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-slate-400 hover:text-slate-700 cursor-pointer">
                        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                    </div>
                </div>

                {/* SpO2 */}
                <div className="bg-[#f8f9fa] border border-[#e9ecef] rounded-xl p-3.5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="text-slate-500">
                            <Wind className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="block text-[10px] text-slate-500 font-semibold">SpO2</span>
                            <div className="flex items-baseline gap-1">
                                <input 
                                    type="text" 
                                    name="spo2"
                                    value={vitals.spo2}
                                    onChange={handleVitalsChange}
                                    className="w-10 bg-transparent border-b border-slate-300 focus:outline-none focus:border-slate-700 font-bold text-slate-800 text-sm p-0"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">%</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-slate-400 hover:text-slate-700 cursor-pointer">
                        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                    </div>
                </div>
            </div>
        </div>
    );
}
