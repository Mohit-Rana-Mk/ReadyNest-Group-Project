import React, { useState } from 'react';
import { Check, X, Plus, Send } from 'lucide-react';

export function ClinicOnboarding({ pendingClinics, onVerify, onOnboardClinic }) {
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        license_number: '',
        address: '',
        city: '',
        postal_code: '',
        latitude: '',
        longitude: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onOnboardClinic(formData);
            setShowModal(false);
            setFormData({
                name: '',
                license_number: '',
                address: '',
                city: '',
                postal_code: '',
                latitude: '',
                longitude: ''
            });
        } catch (error) {
            console.error("Onboarding failed:", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white border border-[#e9ecef] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-slate-800 text-base">Clinic Verification Queue</h3>
                        <p className="text-xs text-slate-400">Verify medical licenses, coordinates, and physical addresses of new signups before allowing active patient bookings.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                    >
                        <Plus className="w-4 h-4" /> Onboard Clinic
                    </button>
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

            {/* Direct Onboard Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Onboard Approved Clinic</h3>
                                <p className="text-[10px] text-slate-400 font-semibold">Direct insertion into database (auto-Approved, no pending verification queue)</p>
                            </div>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Clinic Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g. Metro Healthcare Central"
                                        className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-700/50 focus:ring-1 focus:ring-indigo-700/10 transition"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">License Number</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.license_number}
                                        onChange={e => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                                        placeholder="e.g. LIC-DL-9988"
                                        className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-700/50 focus:ring-1 focus:ring-indigo-700/10 transition"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Postal Code</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.postal_code}
                                        onChange={e => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                                        placeholder="e.g. 110001"
                                        className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-700/50 focus:ring-1 focus:ring-indigo-700/10 transition"
                                    />
                                </div>

                                <div className="col-span-2 space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Street Address</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.address}
                                        onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                        placeholder="e.g. Block C, Connaught Place"
                                        className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-700/50 focus:ring-1 focus:ring-indigo-700/10 transition"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">City</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.city}
                                        onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                        placeholder="e.g. New Delhi"
                                        className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-700/50 focus:ring-1 focus:ring-indigo-700/10 transition"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Coordinates (Lat / Lng)</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Lat"
                                            value={formData.latitude}
                                            onChange={e => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                                            className="w-1/2 bg-[#f8f9fa] border border-[#e9ecef] rounded-xl px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-700/50 focus:ring-1 focus:ring-indigo-700/10 transition"
                                        />
                                        <input 
                                            type="text" 
                                            placeholder="Lng"
                                            value={formData.longitude}
                                            onChange={e => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                                            className="w-1/2 bg-[#f8f9fa] border border-[#e9ecef] rounded-xl px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-700/50 focus:ring-1 focus:ring-indigo-700/10 transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs font-bold">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:bg-slate-300 text-white rounded-xl transition shadow-sm flex items-center gap-1.5"
                                >
                                    {submitting ? 'Onboarding...' : (
                                        <>
                                            <Send className="w-3.5 h-3.5" /> Save Approved Clinic
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
