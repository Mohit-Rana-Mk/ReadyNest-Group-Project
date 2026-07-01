import React from 'react';
import { Heart, Activity, Scale, Ruler } from 'lucide-react';

export function VitalsCard({ vitals, handleVitalsChange }) {
    return (
        <div className="bg-white border border-[#e9ecef] rounded-2xl p-5 shadow-sm space-y-4 shrink-0">
            <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Vitals</h4>
                <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
            </div>

            <div className="space-y-3">
                {/* Weight & Height Row */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#f8f9fa] border border-[#e9ecef] rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Scale className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] text-slate-500 font-semibold">Weight</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <input 
                                type="number" 
                                name="weight_kg"
                                value={vitals.weight_kg}
                                onChange={handleVitalsChange}
                                placeholder="--"
                                className="w-12 bg-transparent border-b border-slate-300 focus:outline-none focus:border-emerald-500 font-bold text-slate-800 text-sm p-0"
                            />
                            <span className="text-[10px] text-slate-400 font-semibold">kg</span>
                        </div>
                    </div>
                    
                    <div className="bg-[#f8f9fa] border border-[#e9ecef] rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Ruler className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] text-slate-500 font-semibold">Height</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <input 
                                type="number" 
                                name="height_cm"
                                value={vitals.height_cm}
                                onChange={handleVitalsChange}
                                placeholder="--"
                                className="w-12 bg-transparent border-b border-slate-300 focus:outline-none focus:border-emerald-500 font-bold text-slate-800 text-sm p-0"
                            />
                            <span className="text-[10px] text-slate-400 font-semibold">cm</span>
                        </div>
                    </div>
                </div>

                {/* Blood Pressure Item */}
                <div className="bg-[#f0fdfa] border border-[#ccfbf1] rounded-xl p-3.5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="text-emerald-600 bg-white p-1.5 rounded-lg shadow-sm border border-emerald-100">
                            <Heart className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        <div>
                            <span className="block text-[10px] text-emerald-800 font-semibold mb-0.5">Blood Pressure</span>
                            <div className="flex items-baseline gap-1.5">
                                <input 
                                    type="number" 
                                    name="systolic_bp"
                                    value={vitals.systolic_bp}
                                    onChange={handleVitalsChange}
                                    placeholder="--"
                                    className="w-10 bg-transparent border-b border-emerald-300 focus:outline-none focus:border-emerald-600 font-bold text-emerald-950 text-sm p-0 placeholder-emerald-300 text-center"
                                />
                                <span className="font-bold text-emerald-800 text-sm">/</span>
                                <input 
                                    type="number" 
                                    name="diastolic_bp"
                                    value={vitals.diastolic_bp}
                                    onChange={handleVitalsChange}
                                    placeholder="--"
                                    className="w-10 bg-transparent border-b border-emerald-300 focus:outline-none focus:border-emerald-600 font-bold text-emerald-950 text-sm p-0 placeholder-emerald-300 text-center"
                                />
                                <span className="text-[10px] text-emerald-700 font-semibold ml-1">mmHg</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Heart Rate / Pulse */}
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-3.5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="text-orange-500 bg-white p-1.5 rounded-lg shadow-sm border border-orange-100">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="block text-[10px] text-orange-800 font-semibold mb-0.5">Heart Rate</span>
                            <div className="flex items-baseline gap-1">
                                <input 
                                    type="number" 
                                    name="pulse_rate"
                                    value={vitals.pulse_rate}
                                    onChange={handleVitalsChange}
                                    placeholder="--"
                                    className="w-12 bg-transparent border-b border-orange-300 focus:outline-none focus:border-orange-500 font-bold text-orange-950 text-sm p-0 placeholder-orange-300 text-center"
                                />
                                <span className="text-[10px] text-orange-700 font-semibold ml-1">bpm</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
