import React, { useState } from 'react';
import { ShieldAlert, Send, Mail, MessageSquare, MapPin, AlertTriangle, Check } from 'lucide-react';

export function OutbreakAlerts({ clinicId }) {
    const [alerts, setAlerts] = useState([
        { id: 1, disease: 'Dengue Fever', sector: 'Sector 4 & 5', severity: 'High', status: 'Active', date: '2026-07-04', patientsCount: 14 },
        { id: 2, disease: 'Influenza A', sector: 'Sector 12', severity: 'Medium', status: 'Active', date: '2026-07-02', patientsCount: 8 },
        { id: 3, disease: 'Gastroenteritis', sector: 'Sector 2', severity: 'Low', status: 'Monitored', date: '2026-06-28', patientsCount: 3 },
    ]);

    const [form, setForm] = useState({
        disease: '',
        sector: '',
        severity: 'Medium',
        message: ''
    });

    const [successMessage, setSuccessMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleBroadcast = (e) => {
        e.preventDefault();
        setSending(true);
        setTimeout(() => {
            const newAlert = {
                id: Date.now(),
                disease: form.disease,
                sector: form.sector,
                severity: form.severity,
                status: 'Active',
                date: new Date().toISOString().split('T')[0],
                patientsCount: 1
            };
            setAlerts([newAlert, ...alerts]);
            setSuccessMessage(`Alert for ${form.disease} successfully broadcasted to ${form.sector}!`);
            setForm({ disease: '', sector: '', severity: 'Medium', message: '' });
            setSending(false);
            setTimeout(() => setSuccessMessage(''), 4000);
        }, 800);
    };

    return (
        <div className="space-y-6">
            {/* Title / Header */}
            <div className="border-b border-gray-200 pb-4">
                <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                    Outbreak Alerts Control Desk & Directory
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                    Monitor localized disease upticks and broadcast alerts to clinical personnel and patients within affected zones.
                </p>
            </div>

            {successMessage && (
                <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <Check className="w-4 h-4 text-emerald-700" />
                    {successMessage}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Main Panel: Outbreak Directory (8 columns) */}
                <div className="lg:col-span-8 bg-white border border-[#e9ecef] rounded-2xl p-6 shadow-sm space-y-4">
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Active Regional Outbreaks</h3>
                        <p className="text-xs text-slate-400">Directory of currently flagged disease clusters in clinic sectors.</p>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {alerts.map((alert) => (
                            <div key={alert.id} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 text-sm">{alert.disease}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${
                                            alert.severity === 'High' 
                                                ? 'bg-red-50 text-red-700 border-red-100' 
                                                : alert.severity === 'Medium'
                                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                : 'bg-blue-50 text-blue-700 border-blue-100'
                                        }`}>
                                            {alert.severity} Severity
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {alert.sector}
                                        </span>
                                        <span>Patients Registered: <span className="font-bold text-slate-700">{alert.patientsCount}</span></span>
                                        <span>First Flagged: {alert.date}</span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wide border ${
                                        alert.status === 'Active'
                                            ? 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse'
                                            : 'bg-slate-50 text-slate-500 border-slate-200'
                                    }`}>
                                        {alert.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Panel: Action Control (4 columns) */}
                <div className="lg:col-span-4 bg-white border border-[#e9ecef] rounded-2xl p-6 shadow-sm space-y-4">
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Broadcast Actions</h3>
                        <p className="text-xs text-slate-400">Issue warnings via platform broadcasts, emails, and SMS.</p>
                    </div>

                    <form onSubmit={handleBroadcast} className="space-y-4 pt-2">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Disease Type</label>
                            <input 
                                type="text"
                                required
                                value={form.disease}
                                onChange={(e) => setForm({ ...form, disease: e.target.value })}
                                placeholder="e.g. Cholera outbreak"
                                className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition placeholder-slate-400"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Sector / Region</label>
                            <input 
                                type="text"
                                required
                                value={form.sector}
                                onChange={(e) => setForm({ ...form, sector: e.target.value })}
                                placeholder="e.g. Sector 3, East Campus"
                                className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition placeholder-slate-400"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Severity</label>
                            <select 
                                value={form.severity}
                                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                                className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Broadcast Message</label>
                            <textarea 
                                required
                                rows="3"
                                value={form.message}
                                onChange={(e) => setForm({ ...form, message: e.target.value })}
                                placeholder="Alert details, precautions, and instructions for patients..."
                                className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition placeholder-slate-400 resize-none"
                            />
                        </div>

                        {/* Broadcast Button - Solid Blue Action Block */}
                        <button
                            type="submit"
                            disabled={sending}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs transition duration-150 shadow-sm flex items-center justify-center gap-1.5 uppercase tracking-wider"
                        >
                            <ShieldAlert className="w-4 h-4" />
                            {sending ? 'Broadcasting...' : 'Broadcast Alert'}
                        </button>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => alert('Sending SMS alerts to all registered patients in the sector...')}
                                className="py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-semibold text-[10px] transition flex items-center justify-center gap-1"
                            >
                                <MessageSquare className="w-3.5 h-3.5 text-slate-400" /> Send SMS
                            </button>
                            <button
                                type="button"
                                onClick={() => alert('Sending Email warnings to all medical staff...')}
                                className="py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-semibold text-[10px] transition flex items-center justify-center gap-1"
                            >
                                <Mail className="w-3.5 h-3.5 text-slate-400" /> Send Emails
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
