import React, { useState, useEffect } from 'react';
import { Landmark, CreditCard, ChevronRight, CheckCircle2, AlertCircle, FileText, Loader2, ArrowRight } from 'lucide-react';
import { fetchClinicFinancials, fetchClinicBankDetails, updateClinicBankDetails } from '../../../api/paymentApi';

export default function ClinicFinancials({ clinicId }) {
    const [financials, setFinancials] = useState(null);
    const [bankDetails, setBankDetails] = useState({
        account_holder_name: '',
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        branch_name: '',
        upi_id: ''
    });
    const [bankStatus, setBankStatus] = useState(null); // 'Pending', 'Approved', 'Rejected', or 'None'
    const [loading, setLoading] = useState(true);
    const [submittingBank, setSubmittingBank] = useState(false);
    const [bankEditMode, setBankEditMode] = useState(false);

    useEffect(() => {
        loadData();
    }, [clinicId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const finData = await fetchClinicFinancials(clinicId);
            setFinancials(finData);

            const bData = await fetchClinicBankDetails(clinicId);
            if (bData.exists) {
                setBankDetails({
                    account_holder_name: bData.data.account_holder_name || '',
                    bank_name: bData.data.bank_name || '',
                    account_number: bData.data.account_number || '',
                    ifsc_code: bData.data.ifsc_code || '',
                    branch_name: bData.data.branch_name || '',
                    upi_id: bData.data.upi_id || ''
                });
                setBankStatus(bData.data.status);
            } else {
                setBankStatus('None');
                setBankEditMode(true);
            }
        } catch (error) {
            console.error('Error loading clinic financials:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBankSubmit = async (e) => {
        e.preventDefault();
        setSubmittingBank(true);
        try {
            await updateClinicBankDetails({
                clinic_id: clinicId,
                ...bankDetails
            });
            alert('Bank details updated. Status set to Pending approval.');
            setBankEditMode(false);
            loadData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating bank details');
        } finally {
            setSubmittingBank(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                <p className="text-sm text-gray-500 font-medium">Loading Financial Information...</p>
            </div>
        );
    }

    const { totalRevenue, totalSettled, pendingSettlement, lastSettlementDate, breakdown, settlements } = financials;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-gray-900">Earnings & Settlements</h2>
                <p className="text-xs text-gray-500 mt-0.5">Track patient payments, manual admin payouts, and configure bank profiles</p>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Total Earnings */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Revenue (Paid)</span>
                        <h3 className="text-2xl font-black text-gray-900">₹{totalRevenue.toFixed(2)}</h3>
                        <p className="text-[10px] text-gray-400">Sum of all confirmed checkout bookings</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100/50">
                        <CreditCard size={22} />
                    </div>
                </div>

                {/* Card 2: Settled Amount */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Settled</span>
                        <h3 className="text-2xl font-black text-gray-900">₹{totalSettled.toFixed(2)}</h3>
                        {lastSettlementDate ? (
                            <p className="text-[10px] text-gray-500">
                                Last payout: <span className="font-semibold text-gray-700">{new Date(lastSettlementDate).toLocaleDateString('en-IN')}</span>
                            </p>
                        ) : (
                            <p className="text-[10px] text-gray-400">No payouts recorded yet</p>
                        )}
                    </div>
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100/50">
                        <CheckCircle2 size={22} />
                    </div>
                </div>

                {/* Card 3: Pending Balance */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Pending Settlement</span>
                        <h3 className="text-2xl font-black text-indigo-600">₹{pendingSettlement.toFixed(2)}</h3>
                        <p className="text-[10px] text-gray-400">To be transferred by HealTrack Admin</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100/50">
                        <Landmark size={22} />
                    </div>
                </div>
            </div>

            {/* Split layout: Left (Bank details), Right (Settlement Logs) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Side: Bank Details */}
                <div className="lg:col-span-5 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                            <Landmark size={16} className="text-gray-400" />
                            Settlement Bank Profile
                        </h3>
                        {!bankEditMode && bankStatus !== 'Pending' && (
                            <button
                                onClick={() => setBankEditMode(true)}
                                className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition px-2.5 py-1 rounded-lg"
                            >
                                Edit Bank Info
                            </button>
                        )}
                    </div>

                    {/* Verification Status Notification */}
                    {bankStatus && bankStatus !== 'None' && (
                        <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs font-semibold ${
                            bankStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            bankStatus === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                            {bankStatus === 'Approved' && (
                                <>
                                    <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                                    <div>
                                        <p className="font-bold text-emerald-800 text-[11px]">Bank Details Approved</p>
                                        <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Payments will be routed to this verified account.</p>
                                    </div>
                                </>
                            )}
                            {bankStatus === 'Pending' && (
                                <>
                                    <AlertCircle size={16} className="shrink-0 text-amber-500" />
                                    <div>
                                        <p className="font-bold text-amber-800 text-[11px]">Pending Admin Review</p>
                                        <p className="text-[10px] text-amber-600 font-medium mt-0.5">Verification usually takes 24 hours. The portal remains read-only.</p>
                                    </div>
                                </>
                            )}
                            {bankStatus === 'Rejected' && (
                                <>
                                    <AlertCircle size={16} className="shrink-0 text-rose-500" />
                                    <div>
                                        <p className="font-bold text-rose-800 text-[11px]">Details Rejected by Admin</p>
                                        <p className="text-[10px] text-rose-600 font-medium mt-0.5">Please review your credentials and submit again.</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {bankEditMode ? (
                        <form onSubmit={handleBankSubmit} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="col-span-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Account Holder Name</label>
                                    <input
                                        type="text"
                                        value={bankDetails.account_holder_name}
                                        onChange={(e) => setBankDetails({ ...bankDetails, account_holder_name: e.target.value })}
                                        className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-400 font-medium"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Bank Name</label>
                                    <input
                                        type="text"
                                        value={bankDetails.bank_name}
                                        onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                                        className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-400 font-medium"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">IFSC Code</label>
                                    <input
                                        type="text"
                                        value={bankDetails.ifsc_code}
                                        onChange={(e) => setBankDetails({ ...bankDetails, ifsc_code: e.target.value })}
                                        className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-400 font-medium"
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Account Number</label>
                                    <input
                                        type="text"
                                        value={bankDetails.account_number}
                                        onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                                        className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-400 font-medium"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Branch Name</label>
                                    <input
                                        type="text"
                                        value={bankDetails.branch_name}
                                        onChange={(e) => setBankDetails({ ...bankDetails, branch_name: e.target.value })}
                                        className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-400 font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">UPI ID (Optional)</label>
                                    <input
                                        type="text"
                                        value={bankDetails.upi_id}
                                        onChange={(e) => setBankDetails({ ...bankDetails, upi_id: e.target.value })}
                                        className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-400 font-medium"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                                {bankStatus !== 'None' && (
                                    <button
                                        type="button"
                                        onClick={() => setBankEditMode(false)}
                                        className="px-3 py-1.5 border border-gray-100 hover:bg-gray-50 rounded-lg text-gray-500 text-xs font-semibold"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={submittingBank}
                                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                                >
                                    {submittingBank ? 'Saving...' : 'Submit Profile'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4 text-xs font-medium text-gray-700 pt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Account Holder</span>
                                    <span className="text-sm font-semibold text-gray-800">{bankDetails.account_holder_name}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Bank</span>
                                    <span className="text-gray-800">{bankDetails.bank_name}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">IFSC Code</span>
                                    <span className="font-mono text-gray-800">{bankDetails.ifsc_code}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Account Number</span>
                                    <span className="font-mono text-sm font-semibold text-gray-800">{bankDetails.account_number}</span>
                                </div>
                                {bankDetails.branch_name && (
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Branch</span>
                                        <span className="text-gray-800">{bankDetails.branch_name}</span>
                                    </div>
                                )}
                                {bankDetails.upi_id && (
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">UPI ID</span>
                                        <span className="font-mono text-gray-800">{bankDetails.upi_id}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side: Settlement Logs */}
                <div className="lg:col-span-7 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-gray-50">
                        <CheckCircle2 size={16} className="text-gray-400" />
                        Payout History
                    </h3>

                    {settlements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                            <Landmark size={30} strokeWidth={1.2} />
                            <p className="mt-2 text-xs">No manual payouts recorded yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                            {settlements.map((log) => (
                                <div key={log.id} className="p-3 border border-gray-50 hover:border-gray-100 rounded-xl flex justify-between items-center text-xs font-semibold text-gray-700">
                                    <div>
                                        <p className="text-indigo-600 font-bold">₹{parseFloat(log.amount).toFixed(2)}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">Ref: <span className="font-mono text-gray-600">{log.reference_number}</span></p>
                                        {log.remarks && <p className="text-[10px] text-gray-500 italic mt-0.5">"{log.remarks}"</p>}
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-gray-400">{new Date(log.settlement_date).toLocaleDateString('en-IN')}</span>
                                        <span className="block mt-1 text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-100/50 uppercase px-1.5 py-0.5 rounded font-extrabold text-center">Settled</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Section: Transaction Logs */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-gray-50">
                    <CreditCard size={16} className="text-gray-400" />
                    Transaction Ledger
                </h3>

                {breakdown.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <CreditCard size={30} strokeWidth={1.2} />
                        <p className="mt-2 text-xs">No booking transactions found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 font-bold text-gray-500 uppercase tracking-wider text-[9px]">
                                    <th className="p-3">Receipt ID</th>
                                    <th className="p-3">Patient</th>
                                    <th className="p-3">Doctor</th>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Amount</th>
                                    <th className="p-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                                {breakdown.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-3 font-mono font-bold text-gray-900">{row.receipt_id}</td>
                                        <td className="p-3 font-semibold text-gray-800">{row.patient_name}</td>
                                        <td className="p-3">Dr. {row.doctor_name}</td>
                                        <td className="p-3 text-gray-500">{new Date(row.created_at).toLocaleDateString('en-IN')}</td>
                                        <td className="p-3 font-bold text-gray-900">₹{parseFloat(row.amount).toFixed(2)}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 text-[8px] font-extrabold rounded uppercase tracking-wider ${
                                                row.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                row.status === 'Pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                'bg-rose-50 text-rose-600 border border-rose-100'
                                            }`}>
                                                {row.status}
                                            </span>
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
