import React, { useState, useEffect } from 'react';
import { 
    Coins, 
    Search, 
    Filter, 
    Check, 
    X, 
    AlertCircle, 
    TrendingUp, 
    Calendar, 
    Landmark, 
    FileText, 
    Loader2, 
    ExternalLink,
    CheckCircle,
    UserCheck,
    CreditCard
} from 'lucide-react';
import { 
    fetchAdminOverview, 
    fetchAllPayments, 
    fetchClinicsSettlementSummary, 
    recordAdminSettlement, 
    fetchPendingBankAccounts, 
    approveBankDetails, 
    fetchRefundRequests, 
    processRefundRequest 
} from '../../../api/paymentApi';

export function AdminPaymentsDashboard() {
    const [activeSubTab, setActiveSubTab] = useState('transactions'); // 'transactions', 'clinics', 'bank-approvals', 'refunds'
    const [overview, setOverview] = useState(null);
    const [payments, setPayments] = useState([]);
    const [clinics, setClinics] = useState([]);
    const [pendingBanks, setPendingBanks] = useState([]);
    const [refundRequests, setRefundRequests] = useState([]);
    
    // Filters & Search
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);

    // Record Settlement Modal
    const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
    const [selectedClinic, setSelectedClinic] = useState(null);
    const [settlementAmount, setSettlementAmount] = useState('');
    const [refNumber, setRefNumber] = useState('');
    const [remarks, setRemarks] = useState('');
    const [submittingSettlement, setSubmittingSettlement] = useState(false);

    useEffect(() => {
        loadOverview();
        loadTabContent();
    }, [activeSubTab, search, statusFilter]);

    const loadOverview = async () => {
        try {
            const data = await fetchAdminOverview();
            setOverview(data);
        } catch (error) {
            console.error('Error fetching admin overview:', error);
        }
    };

    const loadTabContent = async () => {
        setLoading(true);
        try {
            if (activeSubTab === 'transactions') {
                const data = await fetchAllPayments({ status: statusFilter, search });
                setPayments(data);
            } else if (activeSubTab === 'clinics') {
                const data = await fetchClinicsSettlementSummary();
                setClinics(data);
            } else if (activeSubTab === 'bank-approvals') {
                const data = await fetchPendingBankAccounts();
                setPendingBanks(data);
            } else if (activeSubTab === 'refunds') {
                const data = await fetchRefundRequests();
                setRefundRequests(data);
            }
        } catch (error) {
            console.error('Error loading tab content:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveBank = async (id, approve) => {
        const action = approve ? 'Approved' : 'Rejected';
        if (!window.confirm(`Are you sure you want to set the bank account status to ${action}?`)) return;
        try {
            await approveBankDetails(id, action);
            alert(`Bank details successfully ${action.toLowerCase()}`);
            loadTabContent();
        } catch (error) {
            alert('Failed to update bank account status.');
        }
    };

    const handleProcessRefund = async (id, approve) => {
        const action = approve ? 'Approved' : 'Rejected';
        if (!window.confirm(`Are you sure you want to mark this refund request as ${action}?`)) return;
        try {
            await processRefundRequest(id, action);
            alert(`Refund successfully ${action.toLowerCase()}`);
            loadTabContent();
            loadOverview();
        } catch (error) {
            alert('Failed to process refund request.');
        }
    };

    const openSettlementModal = (clinic) => {
        setSelectedClinic(clinic);
        setSettlementAmount(clinic.pending_settlement.toFixed(2));
        setRefNumber('');
        setRemarks('');
        setIsSettlementModalOpen(true);
    };

    const handleSettlementSubmit = async (e) => {
        e.preventDefault();
        if (parseFloat(settlementAmount) > selectedClinic.pending_settlement) {
            alert('Settlement amount cannot exceed pending settlement balance.');
            return;
        }

        setSubmittingSettlement(true);
        try {
            await recordAdminSettlement({
                clinic_id: selectedClinic.clinic_id,
                amount: parseFloat(settlementAmount),
                reference_number: refNumber,
                remarks
            });
            alert('Settlement recorded successfully.');
            setIsSettlementModalOpen(false);
            loadTabContent();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to record settlement.');
        } finally {
            setSubmittingSettlement(false);
        }
    };

    const statusBadge = (status) => {
        const styles = {
            'Paid': 'bg-emerald-50 text-emerald-700 border-emerald-100',
            'Pending': 'bg-amber-50 text-amber-700 border-amber-100',
            'Failed': 'bg-rose-50 text-rose-700 border-rose-100',
            'Refunded': 'bg-blue-50 text-blue-700 border-blue-100'
        };
        return (
            <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded border uppercase tracking-wider ${styles[status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Overview Metrics Cards */}
            {overview && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Ecosystem Revenue</span>
                        <span className="text-2xl font-black text-slate-800 mt-1 block">₹{overview.revenue.total.toFixed(2)}</span>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Monthly Revenue</span>
                        <span className="text-2xl font-black text-slate-800 mt-1 block">₹{overview.revenue.monthly.toFixed(2)}</span>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Today's Revenue</span>
                        <span className="text-2xl font-black text-indigo-650 mt-1 block text-indigo-600">₹{overview.revenue.today.toFixed(2)}</span>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500">
                        <div className="bg-emerald-50/50 p-1.5 rounded-lg border border-emerald-100/40 text-emerald-800">
                            Success: {overview.status.successful}
                        </div>
                        <div className="bg-amber-50/50 p-1.5 rounded-lg border border-amber-100/40 text-amber-800">
                            Pending: {overview.status.pending}
                        </div>
                        <div className="bg-rose-50/50 p-1.5 rounded-lg border border-rose-100/40 text-rose-800">
                            Failed: {overview.status.failed}
                        </div>
                        <div className="bg-blue-50/50 p-1.5 rounded-lg border border-blue-100/40 text-blue-800">
                            Refunds: {overview.status.refunded}
                        </div>
                    </div>
                </div>
            )}

            {/* Sub Tab Navigation */}
            <div className="bg-white border border-gray-200/60 p-1 rounded-xl flex gap-1 max-w-lg">
                {[
                    { id: 'transactions', label: 'Ledger' },
                    { id: 'clinics', label: 'Clinics Settlement' },
                    { id: 'bank-approvals', label: 'Bank Profile Requests' },
                    { id: 'refunds', label: 'Refund Claims' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id)}
                        className={`flex-1 text-center py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                            activeSubTab === tab.id 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main content frame */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4 min-h-[400px]">
                
                {/* Search Header for Ledger */}
                {activeSubTab === 'transactions' && (
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by Receipt ID, Invoice ID, Patient Name..."
                                className="w-full text-xs border border-gray-200 pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-indigo-400 font-medium"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 focus:outline-none"
                            >
                                <option value="">All Statuses</option>
                                <option value="Paid">Paid</option>
                                <option value="Pending">Pending</option>
                                <option value="Failed">Failed</option>
                                <option value="Refunded">Refunded</option>
                            </select>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading ledger data...</span>
                    </div>
                ) : (
                    <>
                        {/* VIEW 1: TRANSACTIONS */}
                        {activeSubTab === 'transactions' && (
                            payments.length === 0 ? (
                                <div className="text-center py-20 text-slate-400 text-xs">No matching transactions found.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 uppercase tracking-wider text-[9px]">
                                                <th className="p-3">Receipt / Invoice</th>
                                                <th className="p-3">Patient</th>
                                                <th className="p-3">Doctor / Clinic</th>
                                                <th className="p-3">Date</th>
                                                <th className="p-3">Amount</th>
                                                <th className="p-3">Status</th>
                                                <th className="p-3 text-right">Refund status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                            {payments.map(p => (
                                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-3">
                                                        <p className="font-mono font-bold text-slate-900">{p.receipt_id}</p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">{p.invoice_id}</p>
                                                    </td>
                                                    <td className="p-3 font-semibold text-slate-800">{p.patient_name}</td>
                                                    <td className="p-3">
                                                        <p className="font-bold text-slate-800">Dr. {p.doctor_name}</p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">{p.clinic_name}</p>
                                                    </td>
                                                    <td className="p-3 text-slate-500">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                                                    <td className="p-3 font-bold text-slate-950">₹{parseFloat(p.amount).toFixed(2)}</td>
                                                    <td className="p-3">{statusBadge(p.status)}</td>
                                                    <td className="p-3 text-right">
                                                        {p.refund_request_status ? (
                                                            <span className="text-[8px] bg-indigo-50 border border-indigo-150 text-indigo-700 font-extrabold uppercase px-1.5 py-0.5 rounded">
                                                                Refund {p.refund_request_status}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}

                        {/* VIEW 2: CLINIC SETTLEMENT SUMMARY */}
                        {activeSubTab === 'clinics' && (
                            clinics.length === 0 ? (
                                <div className="text-center py-20 text-slate-400 text-xs">No active verified clinics found.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 uppercase tracking-wider text-[9px]">
                                                <th className="p-3">Clinic Name</th>
                                                <th className="p-3">Bank Details Status</th>
                                                <th className="p-3">Total Earnings</th>
                                                <th className="p-3">Total Settled</th>
                                                <th className="p-3">Unsettled Balance</th>
                                                <th className="p-3">Last Settlement</th>
                                                <th className="p-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                            {clinics.map(c => (
                                                <tr key={c.clinic_id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-3 font-semibold text-slate-800">{c.clinic_name}</td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-0.5 text-[8px] font-extrabold rounded uppercase ${
                                                            c.bank_status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                                                            c.bank_status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                                                            'bg-slate-100 text-slate-500'
                                                        }`}>
                                                            {c.bank_status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 font-bold text-slate-900">₹{c.total_earnings.toFixed(2)}</td>
                                                    <td className="p-3 font-bold text-slate-500">₹{c.total_settled.toFixed(2)}</td>
                                                    <td className="p-3 font-bold text-indigo-650 text-indigo-600">₹{c.pending_settlement.toFixed(2)}</td>
                                                    <td className="p-3 text-slate-400">
                                                        {c.last_settlement_date ? new Date(c.last_settlement_date).toLocaleDateString('en-IN') : 'None'}
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <button
                                                            onClick={() => openSettlementModal(c)}
                                                            disabled={c.pending_settlement <= 0 || c.bank_status !== 'Approved'}
                                                            className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-100 disabled:text-slate-400 font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            Record Payout
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}

                        {/* VIEW 3: BANK APPROVALS */}
                        {activeSubTab === 'bank-approvals' && (
                            pendingBanks.length === 0 ? (
                                <div className="text-center py-20 text-slate-400 text-xs">No pending bank account updates.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 uppercase tracking-wider text-[9px]">
                                                <th className="p-3">Clinic</th>
                                                <th className="p-3">Account Holder</th>
                                                <th className="p-3">Bank Details</th>
                                                <th className="p-3">Account Number</th>
                                                <th className="p-3">IFSC</th>
                                                <th className="p-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                            {pendingBanks.map(b => (
                                                <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-3 font-semibold text-slate-800">{b.clinic_name}</td>
                                                    <td className="p-3 font-bold text-slate-800">{b.account_holder_name}</td>
                                                    <td className="p-3">
                                                        {b.bank_name} {b.branch_name && `(${b.branch_name})`}
                                                        {b.upi_id && <p className="text-[10px] text-slate-400 font-mono mt-0.5">{b.upi_id}</p>}
                                                    </td>
                                                    <td className="p-3 font-mono font-bold text-slate-900">{b.account_number}</td>
                                                    <td className="p-3 font-mono text-slate-500">{b.ifsc_code}</td>
                                                    <td className="p-3 text-right">
                                                        <div className="flex justify-end gap-1.5">
                                                            <button
                                                                onClick={() => handleApproveBank(b.id, false)}
                                                                className="p-1 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleApproveBank(b.id, true)}
                                                                className="p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer"
                                                            >
                                                                <Check size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}

                        {/* VIEW 4: REFUND REQUESTS */}
                        {activeSubTab === 'refunds' && (
                            refundRequests.length === 0 ? (
                                <div className="text-center py-20 text-slate-400 text-xs">No pending refund requests.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 uppercase tracking-wider text-[9px]">
                                                <th className="p-3">Receipt</th>
                                                <th className="p-3">Patient</th>
                                                <th className="p-3">Clinic</th>
                                                <th className="p-3">Claim Reason</th>
                                                <th className="p-3">Refund Amount</th>
                                                <th className="p-3">Claim Date</th>
                                                <th className="p-3">Verification</th>
                                                <th className="p-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                            {refundRequests.map(r => (
                                                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-3 font-mono font-bold text-slate-800">{r.receipt_id}</td>
                                                    <td className="p-3 font-semibold text-slate-800">{r.patient_name}</td>
                                                    <td className="p-3 text-slate-500">{r.clinic_name}</td>
                                                    <td className="p-3 text-slate-500 font-medium max-w-xs truncate" title={r.reason}>"{r.reason}"</td>
                                                    <td className="p-3 font-bold text-slate-900">₹{parseFloat(r.amount).toFixed(2)}</td>
                                                    <td className="p-3 text-slate-400">{new Date(r.requested_at).toLocaleDateString('en-IN')}</td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-0.5 text-[8px] font-extrabold rounded uppercase ${
                                                            r.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                                                            r.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                                                            'bg-rose-50 text-rose-600'
                                                        }`}>
                                                            {r.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        {r.status === 'Pending' ? (
                                                            <div className="flex justify-end gap-1.5">
                                                                <button
                                                                    onClick={() => handleProcessRefund(r.id, false)}
                                                                    className="p-1 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleProcessRefund(r.id, true)}
                                                                    className="p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer"
                                                                >
                                                                    <Check size={14} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 text-[10px]">Processed</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}
                    </>
                )}
            </div>

            {/* Manual Settlement Payout Modal */}
            {isSettlementModalOpen && selectedClinic && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
                                <Landmark size={20} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 text-base">Record Manual Settlement</h3>
                                <p className="text-xs text-slate-400">Record a payout transferred to {selectedClinic.clinic_name}'s bank account.</p>
                            </div>
                        </div>

                        {/* Clinic Bank Details Review */}
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-xs text-slate-600 font-medium">
                            <p className="font-bold text-[9px] text-slate-400 uppercase tracking-wider">Settlement Target Account</p>
                            <p><span className="text-slate-400">Beneficiary:</span> <span className="font-bold text-slate-800">{selectedClinic.account_holder_name}</span></p>
                            <p><span className="text-slate-400">Bank:</span> <span className="text-slate-700">{selectedClinic.bank_name}</span></p>
                            <p><span className="text-slate-400">Account:</span> <span className="font-mono font-bold text-slate-800">{selectedClinic.account_number}</span></p>
                            <p><span className="text-slate-400">IFSC:</span> <span className="font-mono text-slate-750 text-slate-700">{selectedClinic.ifsc_code}</span></p>
                            {selectedClinic.upi_id && <p><span className="text-slate-400">UPI ID:</span> <span className="font-mono text-slate-700">{selectedClinic.upi_id}</span></p>}
                        </div>

                        <form onSubmit={handleSettlementSubmit} className="space-y-4 text-xs font-semibold">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Settlement Amount (₹)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={settlementAmount}
                                        onChange={(e) => setSettlementAmount(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-400 font-bold"
                                        max={selectedClinic.pending_settlement}
                                        required
                                    />
                                    <span className="text-[10px] text-slate-400 block mt-1">Max: ₹{selectedClinic.pending_settlement.toFixed(2)}</span>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Reference Number / UTR</label>
                                    <input
                                        type="text"
                                        value={refNumber}
                                        onChange={(e) => setRefNumber(e.target.value)}
                                        placeholder="TXN1829038..."
                                        className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-400 font-mono"
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Remarks</label>
                                    <input
                                        type="text"
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        placeholder="Weekly settlement / July 2026 payout..."
                                        className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-400 font-medium"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsSettlementModalOpen(false)}
                                    className="px-4 py-2 border border-slate-100 hover:bg-slate-50 rounded-xl text-slate-500 text-xs font-bold uppercase tracking-wider cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingSettlement}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    {submittingSettlement ? 'Recording...' : 'Record Payout'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
