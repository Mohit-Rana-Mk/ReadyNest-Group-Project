import React, { useState } from 'react';
import { Check, X, Plus, Send } from 'lucide-react';

export function ClinicOnboarding({ pendingClinics, onVerify, onOnboardClinic }) {
    const [formData, setFormData] = useState({
        name: '',
        license_number: '',
        address: '',
        city: '',
        postal_code: '',
        latitude: '',
        longitude: '',
        admin_name: '',
        admin_email: '',
        admin_phone: '',
        admin_password: '',
        admin_country_code: '+91'
    });
    const [submitting, setSubmitting] = useState(false);
    const [createdCredentials, setCreatedCredentials] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setCreatedCredentials(null);
        try {
            const phoneVal = formData.admin_phone.trim();
            const combinedPhone = phoneVal 
                ? (phoneVal.startsWith('+') ? phoneVal : `${formData.admin_country_code}${phoneVal}`)
                : '';
            const payload = {
                ...formData,
                admin_phone: combinedPhone
            };
            const res = await onOnboardClinic(payload);
            if (res && res.credentials) {
                setCreatedCredentials(res.credentials);
            }
            setFormData({
                name: '',
                license_number: '',
                address: '',
                city: '',
                postal_code: '',
                latitude: '',
                longitude: '',
                admin_name: '',
                admin_email: '',
                admin_phone: '',
                admin_password: '',
                admin_country_code: '+91'
            });
        } catch (error) {
            console.error("Onboarding failed:", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Panel: Verification Queue (8 columns) */}
            <div className="lg:col-span-8 bg-white border border-[#e9ecef] rounded-2xl p-6 shadow-sm space-y-4">
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
                                        <td className="py-4 px-4 font-bold text-slate-800">
                                            <div>{c.name}</div>
                                            {c.admin_name && (
                                                <div className="text-[10px] text-slate-400 font-medium mt-0.5">Admin: {c.admin_name}</div>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 font-semibold text-indigo-700">{c.license_number}</td>
                                        <td className="py-4 px-4 text-slate-500 font-medium">
                                            {c.address}, {c.city} - {c.postal_code}
                                            {(c.latitude || c.longitude) && (
                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">Lat: {c.latitude || '0.0'}, Lng: {c.longitude || '0.0'}</div>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-right space-x-2">
                                            <button
                                                onClick={() => onVerify(c.id, 'Approved')}
                                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-100 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                                            >
                                                <Check className="w-3.5 h-3.5" /> Approve
                                            </button>
                                            <button
                                                onClick={() => onVerify(c.id, 'Delisted')}
                                                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-100 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                                            >
                                                <X className="w-3.5 h-3.5" /> Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Right Panel: Direct Onboarding Form (4 columns) */}
            <div className="lg:col-span-4 bg-white border border-[#e9ecef] rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                    <h3 className="font-bold text-slate-800 text-base">Direct Onboard</h3>
                    <p className="text-xs text-slate-400">Directly add a pre-approved clinic facility without verification queue.</p>
                </div>

                {createdCredentials && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 animate-fadeIn">
                        <div className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider">Admin Account Created!</div>
                        <div className="text-xs font-semibold text-slate-700">Email: <span className="font-mono select-all bg-white px-1 py-0.5 rounded border border-emerald-100 ml-1">{createdCredentials.email}</span></div>
                        <div className="text-xs font-semibold text-slate-700">Password: <span className="font-mono select-all bg-white px-1 py-0.5 rounded border border-emerald-100 ml-1">{createdCredentials.password}</span></div>
                        <div className="text-[9px] text-slate-400 mt-1">Please copy these credentials before closing or refreshing.</div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Clinic Name</label>
                        <input 
                            type="text" 
                            required
                            value={formData.name}
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Metro Healthcare Central"
                            className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition duration-150 placeholder-slate-400"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">License Number</label>
                        <input 
                            type="text" 
                            required
                            value={formData.license_number}
                            onChange={e => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                            placeholder="LIC-DL-9988"
                            className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition duration-150 placeholder-slate-400"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Street Address</label>
                        <input 
                            type="text" 
                            required
                            value={formData.address}
                            onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Block C, Connaught Place"
                            className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition duration-150 placeholder-slate-400"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">City</label>
                            <input 
                                type="text" 
                                required
                                value={formData.city}
                                onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                placeholder="New Delhi"
                                className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition duration-150 placeholder-slate-400"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Postal Code</label>
                            <input 
                                type="text" 
                                required
                                value={formData.postal_code}
                                onChange={e => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                                placeholder="110001"
                                className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition duration-150 placeholder-slate-400"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Coordinates (Latitude & Longitude)</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="Lat (e.g. 28.6139)"
                                value={formData.latitude}
                                onChange={e => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                                className="w-1/2 bg-[#f8f9fa] border border-[#e9ecef] rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition duration-150 placeholder-slate-400"
                            />
                            <input 
                                type="text" 
                                placeholder="Lng (e.g. 77.2090)"
                                value={formData.longitude}
                                onChange={e => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                                className="w-1/2 bg-[#f8f9fa] border border-[#e9ecef] rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition duration-150 placeholder-slate-400"
                            />
                        </div>
                    </div>

                    <div className="border-t border-[#f1f3f5] pt-4 mt-2">
                        <h4 className="font-bold text-slate-800 text-xs mb-3">Administrator Account</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Admin Name</label>
                                <input 
                                    type="text" 
                                    required={!!formData.admin_email}
                                    value={formData.admin_name}
                                    onChange={e => setFormData(prev => ({ ...prev, admin_name: e.target.value }))}
                                    placeholder="John Doe"
                                    className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition duration-150 placeholder-slate-400"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Admin Email</label>
                                <input 
                                    type="email" 
                                    value={formData.admin_email}
                                    onChange={e => setFormData(prev => ({ ...prev, admin_email: e.target.value }))}
                                    placeholder="admin@metrohealth.com"
                                    className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition duration-150 placeholder-slate-400"
                                />
                            </div>

                             <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Admin Phone</label>
                                <div className="flex gap-2">
                                    <select
                                        value={formData.admin_country_code}
                                        onChange={e => setFormData(prev => ({ ...prev, admin_country_code: e.target.value }))}
                                        className="bg-[#f8f9fa] border border-[#e9ecef] rounded-xl px-2 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 transition duration-150"
                                    >
                                        <option value="+91">🇮🇳 +91</option>
                                        <option value="+1">🇺🇸 +1</option>
                                        <option value="+44">🇬🇧 +44</option>
                                        <option value="+61">🇦🇺 +61</option>
                                        <option value="+971">🇦🇪 +971</option>
                                        <option value="+966">🇸🇦 +966</option>
                                    </select>
                                    <input 
                                        type="text" 
                                        required={!!formData.admin_email}
                                        value={formData.admin_phone}
                                        onChange={e => setFormData(prev => ({ ...prev, admin_phone: e.target.value }))}
                                        placeholder="9876543210"
                                        className="flex-1 bg-[#f8f9fa] border border-[#e9ecef] rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition duration-150 placeholder-slate-400"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Admin Password (Optional)</label>
                                <input 
                                    type="password" 
                                    value={formData.admin_password}
                                    onChange={e => setFormData(prev => ({ ...prev, admin_password: e.target.value }))}
                                    placeholder="Leave blank to auto-generate"
                                    className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition duration-150 placeholder-slate-400"
                                />
                                <p className="mt-1 text-[9px] text-slate-400 leading-relaxed font-medium">
                                    Must consist of at least 6 characters, containing 1 uppercase, 1 lowercase, 1 number, and 1 special character.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs transition duration-150 shadow-sm flex items-center justify-center gap-1.5"
                    >
                        {submitting ? 'Onboarding...' : (
                            <>
                                <Send className="w-3.5 h-3.5" /> Save Approved Clinic
                            </>
                        )}
                    </button>
                </form>
            </div>

        </div>
    );
}
