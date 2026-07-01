import React from 'react';
import { Check, X } from 'lucide-react';

export function ClinicOnboarding({ pendingClinics, onVerify }) {
    return (
        <div className="space-y-6">
            <div className="bg-white border border-[#e9ecef] rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                    <h3 className="font-bold text-slate-800 text-base">Clinic Verification Queue</h3>
                    <p className="text-xs text-slate-400">Verify medical licenses, coordinates, and physical addresses of new signups before allowing active patient bookings.</p>
                </div>

                {pendingClinics.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                        All clinics verified. Queue is completely empty!
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-[#e9ecef] text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                                    <th className="py-3 px-4">Clinic Name</th>
                                    <th className="py-3 px-4">License Number</th>
                                    <th className="py-3 px-4">Address</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e9ecef]">
                                {pendingClinics.map(c => (
                                    <tr key={c.id} className="hover:bg-slate-50 transition">
                                        <td className="py-4 px-4 font-bold text-slate-800">{c.name}</td>
                                        <td className="py-4 px-4 font-semibold text-indigo-700">{c.license_number}</td>
                                        <td className="py-4 px-4 text-slate-500 font-medium">
                                            {c.address}, {c.city} - {c.postal_code}
                                        </td>
                                        <td className="py-4 px-4 text-right space-x-2">
                                            <button
                                                onClick={() => onVerify(c.id, 'Approved')}
                                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-100 rounded-lg font-bold transition inline-flex items-center gap-1"
                                            >
                                                <Check className="w-3 h-3" /> Approve
                                            </button>
                                            <button
                                                onClick={() => onVerify(c.id, 'Delisted')}
                                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-100 rounded-lg font-bold transition inline-flex items-center gap-1"
                                            >
                                                <X className="w-3 h-3" /> Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
