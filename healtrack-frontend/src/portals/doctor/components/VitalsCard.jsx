import React from 'react';
import { Heart, Activity, Scale, Droplets } from 'lucide-react';

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
                {/* Weight & Blood Pressure Row */}
                <div className="grid grid-cols-7 gap-2.5">
                    {/* Weight */}
                    <div className="col-span-2 bg-[#f8f9fa] border border-[#e9ecef] rounded-xl p-2.5 flex items-center">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="text-slate-600 bg-white p-1.5 rounded-lg shadow-sm border border-slate-200 shrink-0">
                                <Scale className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <span className="block text-[10px] text-slate-700 font-semibold mb-0.5 truncate">Weight</span>
                                <div className="flex items-baseline gap-0.5">
                                    <input 
                                        type="number" 
                                        name="weight_kg"
                                        value={vitals.weight_kg}
                                        onChange={handleVitalsChange}
                                        placeholder="--"
                                        className="w-11 bg-transparent border-b border-slate-300 focus:outline-none focus:border-slate-500 font-bold text-slate-800 text-sm p-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <span className="text-[10px] text-slate-500 font-semibold">kg</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Blood Pressure Item */}
                    <div className="col-span-5 bg-[#f0fdfa] border border-[#ccfbf1] rounded-xl p-2.5 flex items-center">
                        <div className="flex items-center gap-2.5 min-w-0 w-full">
                            <div className="text-emerald-600 bg-white p-1.5 rounded-lg shadow-sm border border-emerald-100 shrink-0">
                                <Heart className="w-4 h-4 stroke-[2.2]" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="block text-[10px] text-emerald-800 font-semibold mb-0.5 truncate">Blood Pressure</span>
                                <div className="flex items-baseline gap-1">
                                    <input 
                                        type="number" 
                                        name="systolic_bp"
                                        value={vitals.systolic_bp}
                                        onChange={handleVitalsChange}
                                        placeholder="--"
                                        className="w-11 bg-transparent border-b border-emerald-300 focus:outline-none focus:border-emerald-600 font-bold text-emerald-950 text-sm p-0 placeholder-emerald-300 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <span className="font-bold text-emerald-800 text-sm shrink-0">/</span>
                                    <input 
                                        type="number" 
                                        name="diastolic_bp"
                                        value={vitals.diastolic_bp}
                                        onChange={handleVitalsChange}
                                        placeholder="--"
                                        className="w-11 bg-transparent border-b border-emerald-300 focus:outline-none focus:border-emerald-600 font-bold text-emerald-950 text-sm p-0 placeholder-emerald-300 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <span className="text-[10px] text-emerald-700 font-semibold ml-0.5 shrink-0">mmHg</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                {/* Heart Rate / Pulse */}
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-2.5 flex items-center">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="text-orange-500 bg-white p-1.5 rounded-lg shadow-sm border border-orange-100 shrink-0">
                            <Activity className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <span className="block text-[10px] text-orange-800 font-semibold mb-0.5 truncate">Heart Rate</span>
                            <div className="flex items-baseline gap-0.5">
                                <input 
                                    type="number" 
                                    name="pulse_rate"
                                    value={vitals.pulse_rate}
                                    onChange={handleVitalsChange}
                                    placeholder="--"
                                    className="w-11 bg-transparent border-b border-orange-300 focus:outline-none focus:border-orange-500 font-bold text-orange-950 text-sm p-0 placeholder-orange-300 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="text-[10px] text-orange-700 font-semibold">bpm</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Blood Sugar */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 flex items-center">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="text-blue-500 bg-white p-1.5 rounded-lg shadow-sm border border-blue-100 shrink-0">
                            <Droplets className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <span className="block text-[10px] text-blue-800 font-semibold mb-0.5 truncate">Blood Sugar</span>
                            <div className="flex items-baseline gap-0.5">
                                <input 
                                    type="number" 
                                    name="blood_sugar_mgdl"
                                    value={vitals.blood_sugar_mgdl}
                                    onChange={handleVitalsChange}
                                    placeholder="--"
                                    className="w-11 bg-transparent border-b border-blue-300 focus:outline-none focus:border-blue-500 font-bold text-blue-950 text-sm p-0 placeholder-blue-300 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="text-[10px] text-blue-700 font-semibold">mg/dL</span>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
}
