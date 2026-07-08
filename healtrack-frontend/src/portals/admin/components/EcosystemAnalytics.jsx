import React, { useState } from 'react';
import { 
    Users, 
    ShieldCheck, 
    TrendingUp, 
    AlertTriangle, 
    Check, 
    Trash2, 
    Settings, 
    X, 
    Plus, 
    Save, 
    Building, 
    ShieldAlert, 
    Activity, 
    UserMinus, 
    UserCheck,
    DollarSign,
    Lock,
    Unlock
} from 'lucide-react';
import axiosClient from '../../../api/axiosClient';

export function EcosystemAnalytics({ ecosystemStats, onVerify, onDeleteClinic }) {
    const [selectedClinicId, setSelectedClinicId] = useState(null);
    const [clinicDetails, setClinicDetails] = useState(null);
    const [activeModalTab, setActiveModalTab] = useState('details');
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Forms
    const [detailsForm, setDetailsForm] = useState({
        name: '',
        license_number: '',
        address: '',
        city: '',
        postal_code: '',
        latitude: '',
        longitude: ''
    });
    const [addDeptForm, setAddDeptForm] = useState({
        serviceId: '',
        consultationFee: ''
    });

    const showTempMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    };

    const fetchClinicDetails = async (clinicId) => {
        setLoadingDetails(true);
        try {
            const res = await axiosClient.get(`/admin/clinics/${clinicId}/details`);
            if (res.data.success) {
                setClinicDetails(res.data.data);
                const c = res.data.data.clinic;
                setDetailsForm({
                    name: c.name || '',
                    license_number: c.license_number || '',
                    address: c.address || '',
                    city: c.city || '',
                    postal_code: c.postal_code || '',
                    latitude: c.latitude || 0,
                    longitude: c.longitude || 0
                });
            }
        } catch (error) {
            console.error("Error loading clinic details:", error);
            showTempMessage('error', 'Failed to load clinic details.');
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleManageClick = (clinicId) => {
        setSelectedClinicId(clinicId);
        setActiveModalTab('details');
        fetchClinicDetails(clinicId);
    };

    const handleCloseModal = () => {
        setSelectedClinicId(null);
        setClinicDetails(null);
    };

    const handleSaveDetails = async (e) => {
        e.preventDefault();
        try {
            const res = await axiosClient.put(`/admin/clinics/${selectedClinicId}`, detailsForm);
            if (res.data.success) {
                showTempMessage('success', res.data.message);
                fetchClinicDetails(selectedClinicId);
            }
        } catch (error) {
            console.error("Error updating clinic:", error);
            showTempMessage('error', error.response?.data?.message || 'Failed to update clinic details.');
        }
    };

    const handleAddDepartment = async (e) => {
        e.preventDefault();
        if (!addDeptForm.serviceId || !addDeptForm.consultationFee) {
            showTempMessage('error', 'Please select a department and specify a fee.');
            return;
        }
        try {
            const res = await axiosClient.post(`/admin/clinics/${selectedClinicId}/departments`, {
                serviceId: parseInt(addDeptForm.serviceId),
                consultationFee: parseFloat(addDeptForm.consultationFee)
            });
            if (res.data.success) {
                showTempMessage('success', res.data.message);
                setAddDeptForm({ serviceId: '', consultationFee: '' });
                fetchClinicDetails(selectedClinicId);
            }
        } catch (error) {
            console.error("Error adding department:", error);
            showTempMessage('error', error.response?.data?.message || 'Failed to add department.');
        }
    };

    const handleRemoveDepartment = async (serviceId) => {
        if (!window.confirm("Are you sure you want to remove this department from the clinic?")) return;
        try {
            const res = await axiosClient.delete(`/admin/clinics/${selectedClinicId}/departments/${serviceId}`);
            if (res.data.success) {
                showTempMessage('success', res.data.message);
                fetchClinicDetails(selectedClinicId);
            }
        } catch (error) {
            console.error("Error removing department:", error);
            showTempMessage('error', 'Failed to remove department.');
        }
    };

    const handleUpdateUserStatus = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
        try {
            const res = await axiosClient.post(`/admin/users/${userId}/status`, { status: newStatus });
            if (res.data.success) {
                showTempMessage('success', res.data.message);
                fetchClinicDetails(selectedClinicId);
            }
        } catch (error) {
            console.error("Error changing staff status:", error);
            showTempMessage('error', 'Failed to change staff status.');
        }
    };

    const handleDeleteUser = async (userId, role) => {
        if (!window.confirm(`Are you sure you want to permanently delete this ${role.toLowerCase()} account? This action cannot be undone.`)) return;
        try {
            const res = await axiosClient.delete(`/admin/users/${userId}`);
            if (res.data.success) {
                showTempMessage('success', res.data.message);
                fetchClinicDetails(selectedClinicId);
            }
        } catch (error) {
            console.error("Error deleting user:", error);
            showTempMessage('error', 'Failed to delete user account.');
        }
    };

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
                    <h3 className="font-bold text-slate-800 text-base">Clinic Facilities Directory</h3>
                    <p className="text-xs text-slate-400">Perform direct clinic settings, staff, and department auditing operations.</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-[#e9ecef] text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                                <th className="py-3 px-4">Clinic Facility</th>
                                <th className="py-3 px-4">Average Rating</th>
                                <th className="py-3 px-4">Total Reviews</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
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
                                     <td className="py-4 px-4">
                                         {r.verification_status === 'Suspended' ? (
                                             <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-100 rounded-lg text-[9px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1">
                                                 <AlertTriangle className="w-3 h-3" /> Suspended
                                             </span>
                                         ) : r.rating < 3.0 ? (
                                             <span className="px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-100 rounded-lg text-[9px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1">
                                                 <AlertTriangle className="w-3 h-3" /> Flagged for Delisting
                                             </span>
                                         ) : (
                                             <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[9px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1">
                                                 <Check className="w-3 h-3" /> Standard
                                             </span>
                                         )}
                                     </td>
                                     <td className="py-4 px-4 text-right flex items-center justify-end gap-2">
                                         <button 
                                             onClick={() => handleManageClick(r.id)}
                                             className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-100 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                                         >
                                             <Settings className="w-3.5 h-3.5" /> Manage
                                         </button>
                                         {r.verification_status === 'Suspended' ? (
                                             <button 
                                                 onClick={() => onVerify && onVerify(r.id, 'Approved')}
                                                 className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-100 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                                             >
                                                 Restore
                                             </button>
                                         ) : (
                                             <button 
                                                 onClick={() => onVerify && onVerify(r.id, 'Suspended')}
                                                 className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-100 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                                             >
                                                 Suspend
                                             </button>
                                         )}
                                         <button 
                                             onClick={() => onDeleteClinic && onDeleteClinic(r.id)}
                                             className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-100 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                                             title="Permanently delete clinic and all associated data"
                                         >
                                             <Trash2 className="w-3.5 h-3.5" /> Delete
                                         </button>
                                     </td>
                                 </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CLINIC MANAGEMENT MODAL */}
            {selectedClinicId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-[#f8f9fa] shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                                    <Building className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                                        Manage {clinicDetails?.clinic?.name || 'Clinic'}
                                    </h3>
                                    <span className="text-[10px] text-slate-400 font-semibold tracking-wider">
                                        ID: {selectedClinicId} • License: {clinicDetails?.clinic?.license_number}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {clinicDetails?.clinic?.verification_status && (
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1 ${
                                        clinicDetails.clinic.verification_status === 'Approved' 
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                            : 'bg-red-50 text-red-700 border border-red-100'
                                    }`}>
                                        {clinicDetails.clinic.verification_status}
                                    </span>
                                )}
                                <button 
                                    onClick={handleCloseModal}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Alert Message banner */}
                        {message.text && (
                            <div className={`px-6 py-3 text-xs font-bold flex items-center gap-2 shrink-0 ${
                                message.type === 'success' 
                                    ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100' 
                                    : 'bg-rose-50 text-rose-800 border-b border-rose-100'
                            }`}>
                                <Activity className="w-4 h-4 animate-pulse" />
                                {message.text}
                            </div>
                        )}

                        {/* Modal Navigation Tabs */}
                        <div className="flex border-b border-slate-100 px-6 bg-slate-50 shrink-0">
                            {[
                                { id: 'details', label: 'Clinic Details & Location' },
                                { id: 'staff', label: 'Doctors & Receptionists' },
                                { id: 'departments', label: 'Departments & Services' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveModalTab(tab.id)}
                                    className={`py-3 px-4 text-xs font-extrabold border-b-2 transition ${
                                        activeModalTab === tab.id
                                            ? 'border-indigo-600 text-indigo-700'
                                            : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-white">
                            {loadingDetails ? (
                                <div className="flex flex-col items-center justify-center py-16 space-y-2">
                                    <div className="w-8 h-8 border-3 border-indigo-700/20 border-t-indigo-700 rounded-full animate-spin"></div>
                                    <span className="text-xs text-slate-400 font-semibold">Retrieving clinic records...</span>
                                </div>
                            ) : clinicDetails ? (
                                <>
                                    {/* DETAILS TAB */}
                                    {activeModalTab === 'details' && (
                                        <form onSubmit={handleSaveDetails} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Clinic Name</label>
                                                    <input 
                                                        type="text" 
                                                        required
                                                        value={detailsForm.name}
                                                        onChange={e => setDetailsForm(prev => ({ ...prev, name: e.target.value }))}
                                                        className="w-full text-xs font-bold text-slate-800 bg-[#f8f9fa] border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-indigo-500 transition"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">License Number</label>
                                                    <input 
                                                        type="text" 
                                                        required
                                                        value={detailsForm.license_number}
                                                        onChange={e => setDetailsForm(prev => ({ ...prev, license_number: e.target.value }))}
                                                        className="w-full text-xs font-bold text-slate-800 bg-[#f8f9fa] border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-indigo-500 transition"
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Street Address</label>
                                                    <input 
                                                        type="text" 
                                                        required
                                                        value={detailsForm.address}
                                                        onChange={e => setDetailsForm(prev => ({ ...prev, address: e.target.value }))}
                                                        className="w-full text-xs font-bold text-slate-800 bg-[#f8f9fa] border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-indigo-500 transition"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">City</label>
                                                    <input 
                                                        type="text" 
                                                        required
                                                        value={detailsForm.city}
                                                        onChange={e => setDetailsForm(prev => ({ ...prev, city: e.target.value }))}
                                                        className="w-full text-xs font-bold text-slate-800 bg-[#f8f9fa] border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-indigo-500 transition"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Postal Code</label>
                                                    <input 
                                                        type="text" 
                                                        required
                                                        value={detailsForm.postal_code}
                                                        onChange={e => setDetailsForm(prev => ({ ...prev, postal_code: e.target.value }))}
                                                        className="w-full text-xs font-bold text-slate-800 bg-[#f8f9fa] border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-indigo-500 transition"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Latitude</label>
                                                    <input 
                                                        type="number" 
                                                        step="0.000001"
                                                        value={detailsForm.latitude}
                                                        onChange={e => setDetailsForm(prev => ({ ...prev, latitude: e.target.value }))}
                                                        className="w-full text-xs font-bold text-slate-800 bg-[#f8f9fa] border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-indigo-500 transition"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Longitude</label>
                                                    <input 
                                                        type="number" 
                                                        step="0.000001"
                                                        value={detailsForm.longitude}
                                                        onChange={e => setDetailsForm(prev => ({ ...prev, longitude: e.target.value }))}
                                                        className="w-full text-xs font-bold text-slate-800 bg-[#f8f9fa] border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-indigo-500 transition"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-end pt-4">
                                                <button 
                                                    type="submit"
                                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 border-none"
                                                >
                                                    <Save className="w-4 h-4" /> Save Clinic Details
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {/* STAFF TAB */}
                                    {activeModalTab === 'staff' && (
                                        <div className="space-y-8">
                                            {/* DOCTORS SUBSECTION */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between border-b pb-2">
                                                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                                                        Registered Doctors ({clinicDetails.doctors?.length || 0})
                                                    </h4>
                                                </div>

                                                {clinicDetails.doctors?.length === 0 ? (
                                                    <div className="p-8 text-center text-slate-400 text-xs font-medium bg-[#f8f9fa] rounded-2xl">
                                                        No doctors registered at this clinic.
                                                    </div>
                                                ) : (
                                                    <div className="overflow-x-auto border border-[#e9ecef] rounded-2xl">
                                                        <table className="w-full text-left text-xs border-collapse">
                                                            <thead>
                                                                <tr className="bg-slate-50 border-b border-[#e9ecef] text-slate-400 uppercase tracking-wider font-extrabold text-[9px]">
                                                                    <th className="py-2.5 px-4">Name</th>
                                                                    <th className="py-2.5 px-4">Contact Info</th>
                                                                    <th className="py-2.5 px-4">Department</th>
                                                                    <th className="py-2.5 px-4">Status</th>
                                                                    <th className="py-2.5 px-4 text-right">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-[#e9ecef]">
                                                                {clinicDetails.doctors.map(doc => (
                                                                    <tr key={doc.id} className="hover:bg-slate-50 transition">
                                                                        <td className="py-3 px-4 font-bold text-slate-800">{doc.name}</td>
                                                                        <td className="py-3 px-4 text-slate-500 font-medium">
                                                                            <div className="text-[11px]">{doc.email}</div>
                                                                            <div className="text-[10px] text-slate-400 mt-0.5">{doc.phone}</div>
                                                                        </td>
                                                                        <td className="py-3 px-4 font-semibold text-indigo-700">{doc.department_name || 'Unassigned'}</td>
                                                                        <td className="py-3 px-4">
                                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                                                                doc.status === 'Active' 
                                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                                                    : 'bg-red-50 text-red-700 border border-red-100'
                                                                            }`}>
                                                                                {doc.status}
                                                                            </span>
                                                                        </td>
                                                                        <td className="py-3 px-4 text-right flex items-center justify-end gap-1.5">
                                                                            <button 
                                                                                type="button"
                                                                                onClick={() => handleUpdateUserStatus(doc.id, doc.status)}
                                                                                className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                                                                                    doc.status === 'Active' 
                                                                                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-100'
                                                                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-100'
                                                                                }`}
                                                                            >
                                                                                {doc.status === 'Active' ? 'Suspend' : 'Activate'}
                                                                            </button>
                                                                            <button 
                                                                                type="button"
                                                                                onClick={() => handleDeleteUser(doc.id, 'Doctor')}
                                                                                className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 rounded text-[10px] font-bold transition inline-flex items-center gap-0.5"
                                                                            >
                                                                                <Trash2 className="w-3 h-3" /> Remove
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>

                                            {/* RECEPTIONISTS SUBSECTION */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between border-b pb-2">
                                                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                                                        Receptionists & Staff ({clinicDetails.receptionists?.length || 0})
                                                    </h4>
                                                </div>

                                                {clinicDetails.receptionists?.length === 0 ? (
                                                    <div className="p-8 text-center text-slate-400 text-xs font-medium bg-[#f8f9fa] rounded-2xl">
                                                        No receptionist staff accounts registered.
                                                    </div>
                                                ) : (
                                                    <div className="overflow-x-auto border border-[#e9ecef] rounded-2xl">
                                                        <table className="w-full text-left text-xs border-collapse">
                                                            <thead>
                                                                <tr className="bg-slate-50 border-b border-[#e9ecef] text-slate-400 uppercase tracking-wider font-extrabold text-[9px]">
                                                                    <th className="py-2.5 px-4">Name</th>
                                                                    <th className="py-2.5 px-4">Contact Info</th>
                                                                    <th className="py-2.5 px-4">Status</th>
                                                                    <th className="py-2.5 px-4 text-right">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-[#e9ecef]">
                                                                {clinicDetails.receptionists.map(rep => (
                                                                    <tr key={rep.id} className="hover:bg-slate-50 transition">
                                                                        <td className="py-3 px-4 font-bold text-slate-800">{rep.name}</td>
                                                                        <td className="py-3 px-4 text-slate-500 font-medium">
                                                                            <div className="text-[11px]">{rep.email}</div>
                                                                            <div className="text-[10px] text-slate-400 mt-0.5">{rep.phone}</div>
                                                                        </td>
                                                                        <td className="py-3 px-4">
                                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                                                                rep.status === 'Active' 
                                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                                                    : 'bg-red-50 text-red-700 border border-red-100'
                                                                            }`}>
                                                                                {rep.status}
                                                                            </span>
                                                                        </td>
                                                                        <td className="py-3 px-4 text-right flex items-center justify-end gap-1.5">
                                                                            <button 
                                                                                type="button"
                                                                                onClick={() => handleUpdateUserStatus(rep.id, rep.status)}
                                                                                className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                                                                                    rep.status === 'Active' 
                                                                                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-100'
                                                                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-100'
                                                                                }`}
                                                                            >
                                                                                {rep.status === 'Active' ? 'Suspend' : 'Activate'}
                                                                            </button>
                                                                            <button 
                                                                                type="button"
                                                                                onClick={() => handleDeleteUser(rep.id, 'Receptionist')}
                                                                                className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 rounded text-[10px] font-bold transition inline-flex items-center gap-0.5"
                                                                            >
                                                                                <Trash2 className="w-3 h-3" /> Remove
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
                                    )}

                                    {/* DEPARTMENTS TAB */}
                                    {activeModalTab === 'departments' && (
                                        <div className="space-y-6">
                                            {/* ADD DEPARTMENT FORM */}
                                            <div className="bg-[#f8f9fa] rounded-2xl p-5 border border-slate-100 space-y-4">
                                                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Plus className="w-4 h-4 text-indigo-700" /> Add Clinical Department
                                                </h4>
                                                <form onSubmit={handleAddDepartment} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                                    <div>
                                                        <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Select Department</label>
                                                        <select
                                                            required
                                                            value={addDeptForm.serviceId}
                                                            onChange={e => setAddDeptForm(prev => ({ ...prev, serviceId: e.target.value }))}
                                                            className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition"
                                                        >
                                                            <option value="">-- Select Service --</option>
                                                            {clinicDetails.availableServices?.map(svc => {
                                                                const isAssociated = clinicDetails.departments?.some(d => d.service_id === svc.id);
                                                                if (isAssociated) return null;
                                                                return (
                                                                    <option key={svc.id} value={svc.id}>{svc.name}</option>
                                                                );
                                                            })}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Consultation Fee (INR)</label>
                                                        <input 
                                                            type="number"
                                                            required
                                                            min="0"
                                                            placeholder="600"
                                                            value={addDeptForm.consultationFee}
                                                            onChange={e => setAddDeptForm(prev => ({ ...prev, consultationFee: e.target.value }))}
                                                            className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition"
                                                        />
                                                    </div>
                                                    <div>
                                                        <button 
                                                            type="submit"
                                                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border-none shadow-sm"
                                                        >
                                                            <Plus className="w-4 h-4" /> Add Department
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>

                                            {/* DEPARTMENTS LIST */}
                                            <div className="space-y-3">
                                                <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 border-b pb-2">
                                                    Active Departments ({clinicDetails.departments?.length || 0})
                                                </h4>

                                                {clinicDetails.departments?.length === 0 ? (
                                                    <div className="p-8 text-center text-slate-400 text-xs font-medium bg-[#f8f9fa] rounded-2xl">
                                                        No active departments registered at this clinic facility.
                                                    </div>
                                                ) : (
                                                    <div className="overflow-x-auto border border-[#e9ecef] rounded-2xl">
                                                        <table className="w-full text-left text-xs border-collapse">
                                                            <thead>
                                                                <tr className="bg-slate-50 border-b border-[#e9ecef] text-slate-400 uppercase tracking-wider font-extrabold text-[9px]">
                                                                    <th className="py-2.5 px-4">Department Name</th>
                                                                    <th className="py-2.5 px-4">Consultation Fee</th>
                                                                    <th className="py-2.5 px-4 text-right">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-[#e9ecef]">
                                                                {clinicDetails.departments.map(dept => (
                                                                    <tr key={dept.service_id} className="hover:bg-slate-50 transition">
                                                                        <td className="py-3.5 px-4 font-bold text-slate-800">{dept.name}</td>
                                                                        <td className="py-3.5 px-4 font-semibold text-slate-700">₹{dept.consultation_fee}</td>
                                                                        <td className="py-3.5 px-4 text-right">
                                                                            <button 
                                                                                type="button"
                                                                                onClick={() => handleRemoveDepartment(dept.service_id)}
                                                                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-100 rounded-lg text-[10px] font-bold transition inline-flex items-center gap-0.5"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" /> Remove
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
                                    )}
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}