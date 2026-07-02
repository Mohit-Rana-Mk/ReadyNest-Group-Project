import React from 'react';
import { Users, ShieldCheck, TrendingUp, AlertTriangle, Check } from 'lucide-react';

export function EcosystemAnalytics({ ecosystemStats }) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-[#e9ecef] rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Patients</span>
                        <span className="text-2xl font-extrabold text-slate-800 mt-1 block">
                            {ecosystemStats.kpis?.totalPatients || 0}
                        </span>
                    </div>
                    <div className="text-indigo-700">
                        <Users className="w-8 h-8 stroke-[1.5]" />
                    </div>
                </div>
                <div className="bg-white border border-[#e9ecef] rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Approved Clinics</span>
                        <span className="text-2xl font-extrabold text-slate-800 mt-1 block">
                            {ecosystemStats.kpis?.totalClinics || 0}
                        </span>
                    </div>
                    <div className="text-indigo-700">
                        <ShieldCheck className="w-8 h-8 stroke-[1.5]" />
                    </div>
                </div>
                <div className="bg-white border border-[#e9ecef] rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Appointments Booked</span>
                        <span className="text-2xl font-extrabold text-slate-800 mt-1 block">
                            {ecosystemStats.kpis?.totalAppointments || 0}
                        </span>
                    </div>
                    <div className="text-indigo-700">
                        <TrendingUp className="w-8 h-8 stroke-[1.5]" />
                    </div>
                </div>
            </div>

            <div className="bg-white border border-[#e9ecef] rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                    <h3 className="font-bold text-slate-800 text-base">Clinic Quality & Performance Reviews</h3>
                    <p className="text-xs text-slate-400">Clinics dropping below a 3.0 rating will trigger delisting review metrics.</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-[#e9ecef] text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                                <th className="py-3 px-4">Clinic Facility</th>
                                <th className="py-3 px-4">Average Rating</th>
                                <th className="py-3 px-4">Total Reviews</th>
                                <th className="py-3 px-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e9ecef]">
                            {ecosystemStats.reviews && ecosystemStats.reviews.map(r => (
                                <tr key={r.id} className="hover:bg-slate-50 transition">
                                    <td className="py-4 px-4 font-bold text-slate-800">{r.name}</td>
                                    <td className="py-4 px-4 font-semibold">
                                        <div className="flex items-center gap-1.5">
                                            <span className={r.rating >= 4.0 ? 'text-emerald-700' : r.rating >= 3.0 ? 'text-yellow-600' : 'text-red-600'}>
                                                ★ {r.rating}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 font-medium text-slate-500">{r.review_count} Reviews</td>
                                    <td className="py-4 px-4 text-right">
                                        {r.rating < 3.0 ? (
                                            <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-100 rounded-lg text-[9px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" /> Flagged for Delisting
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[9px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1">
                                                <Check className="w-3 h-3" /> Standard
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
