import { toast } from '../../../components/ui/Toast';
import React, { useState, useEffect } from 'react';
import { CreditCard, FileText, Download, ShieldAlert, ArrowLeft, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { fetchPatientPayments, fetchPaymentDetails, submitRefundRequest } from '../../../api/paymentApi';

export default function PatientPayments() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [viewingDetails, setViewingDetails] = useState(false);
    
    // Refund Modal State
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [refundPaymentId, setRefundPaymentId] = useState(null);
    const [refundReason, setRefundReason] = useState('');
    const [refundSubmitting, setRefundSubmitting] = useState(false);

    useEffect(() => {
        loadPayments();
    }, []);

    const loadPayments = async () => {
        setLoading(true);
        try {
            const data = await fetchPatientPayments();
            setPayments(data);
        } catch (error) {
            console.error('Error fetching patient payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (paymentId) => {
        try {
            const detail = await fetchPaymentDetails(paymentId);
            setSelectedPayment(detail);
            setViewingDetails(true);
        } catch (error) {
            toast.error('Failed to load payment details.');
        }
    };

    const handlePrintInvoice = () => {
        window.print();
    };

    const openRefundModal = (paymentId) => {
        setRefundPaymentId(paymentId);
        setRefundReason('');
        setIsRefundModalOpen(true);
    };

    const handleRefundSubmit = async (e) => {
        e.preventDefault();
        if (!refundReason.trim()) return;

        setRefundSubmitting(true);
        try {
            const res = await submitRefundRequest({
                payment_id: refundPaymentId,
                reason: refundReason
            });
            if (res.success) {
                toast.success('Refund request submitted successfully and is pending review.');
                setIsRefundModalOpen(false);
                loadPayments();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error submitting refund request');
        } finally {
            setRefundSubmitting(false);
        }
    };

    const statusBadge = (status) => {
        const styles = {
            'Paid': 'bg-emerald-50 text-emerald-700 border-emerald-200',
            'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
            'Failed': 'bg-rose-50 text-rose-700 border-rose-200',
            'Refunded': 'bg-blue-50 text-blue-700 border-blue-200'
        };
        return (
            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border uppercase tracking-wider ${styles[status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                {status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Payments...</p>
            </div>
        );
    }

    if (viewingDetails && selectedPayment) {
        return (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 max-w-3xl mx-auto print:p-0 print:border-none print:shadow-none animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 print:hidden">
                    <button
                        onClick={() => setViewingDetails(false)}
                        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider cursor-pointer"
                    >
                        <ArrowLeft size={16} />
                        Back to Payments
                    </button>
                    <button
                        onClick={handlePrintInvoice}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                        <Download size={14} />
                        Download / Print PDF
                    </button>
                </div>

                {/* Printable Invoice Header */}
                <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <img src="/logo.png" alt="HealTrack Logo" className="w-8 h-8 object-contain rounded-lg" />
                            <span className="text-lg font-black text-slate-800 tracking-tight">HealTrack Systems</span>
                        </div>
                        <p className="text-xs text-slate-500">Secure Healthcare Settlements</p>
                        <p className="text-xs text-slate-400 mt-1">support@healtrack.com</p>
                    </div>
                    <div className="md:text-right">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">TAX INVOICE</h2>
                        <p className="text-xs text-slate-400 mt-1">Invoice: <span className="font-bold text-slate-700">{selectedPayment.invoice_id}</span></p>
                        <p className="text-xs text-slate-400">Receipt: <span className="font-bold text-slate-700">{selectedPayment.receipt_id}</span></p>
                        <p className="text-xs text-slate-400">Date: <span className="font-bold text-slate-700">{new Date(selectedPayment.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></p>
                    </div>
                </div>

                <hr className="border-slate-100" />

                {/* Patient & Clinic Split Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="space-y-1">
                        <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Billed To (Patient)</p>
                        <p className="font-bold text-slate-800 text-sm">{selectedPayment.patient_name}</p>
                        <p className="text-slate-500">MRN: {selectedPayment.patient_mrn}</p>
                    </div>
                    <div className="space-y-1 md:text-right">
                        <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Provider (Clinic)</p>
                        <p className="font-bold text-slate-800 text-sm">{selectedPayment.clinic_name}</p>
                        <p className="text-slate-500">{selectedPayment.clinic_address || 'Clinic Address'}</p>
                        <p className="text-slate-500">{selectedPayment.clinic_city || 'City'}</p>
                        {selectedPayment.clinic_license && <p className="text-slate-400">License: {selectedPayment.clinic_license}</p>}
                    </div>
                </div>

                {/* Items Table */}
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 uppercase tracking-wider text-[9px]">
                                <th className="p-3">Description</th>
                                <th className="p-3">Doctor</th>
                                <th className="p-3">Type</th>
                                <th className="p-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-slate-100 text-slate-700 font-medium">
                                <th className="p-3 font-semibold text-slate-800">
                                    Consultation Booking Fee
                                </th>
                                <td className="p-3">Dr. {selectedPayment.doctor_name}</td>
                                <td className="p-3">
                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[9px]">
                                        {selectedPayment.consultation_type}
                                    </span>
                                </td>
                                <td className="p-3 text-right font-bold text-slate-800">₹{parseFloat(selectedPayment.amount).toFixed(2)}</td>
                            </tr>
                            <tr className="font-bold text-slate-800 bg-slate-50/50">
                                <td colSpan="3" className="p-3 text-right text-slate-500">Grand Total (INR)</td>
                                <td className="p-3 text-right text-base text-indigo-600">₹{parseFloat(selectedPayment.amount).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Payment Metadata */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/80 flex flex-col md:flex-row justify-between gap-4 text-xs">
                    <div className="space-y-1">
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Razorpay Order ID</span>
                        <span className="font-mono text-slate-600 font-semibold">{selectedPayment.razorpay_order_id}</span>
                    </div>
                    {selectedPayment.razorpay_payment_id && (
                        <div className="space-y-1 md:text-right">
                            <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Razorpay Transaction ID</span>
                            <span className="font-mono text-slate-600 font-semibold">{selectedPayment.razorpay_payment_id}</span>
                        </div>
                    )}
                    <div className="space-y-1 md:text-right">
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Payment Status</span>
                        {statusBadge(selectedPayment.status)}
                    </div>
                </div>

                {/* Footer terms */}
                <div className="text-[10px] text-center text-slate-400 leading-relaxed font-medium pt-4">
                    This is a computer-generated tax invoice and receipt for healthcare services rendered.
                    <br />
                    All payments are credited to HealTrack Admin account for manual settlement to corresponding clinics.
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Payments & Invoices</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Track booking transactions, download invoices, and request refunds</p>
                </div>
            </div>

            {payments.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                        <CreditCard className="w-6 h-6 text-slate-300" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">No Transactions</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-[280px]">You haven't made any booking payments yet. Appointments booked will appear here.</p>
                </div>
            ) : (
                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
                        <table className="w-full text-left text-xs border-collapse relative">
                            <thead className="sticky top-0 bg-white/90 backdrop-blur-md z-10 shadow-sm">
                                <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 uppercase tracking-wider text-[9px]">
                                    <th className="p-4">Receipt ID</th>
                                    <th className="p-4">Clinic / Doctor</th>
                                    <th className="p-4">Appointment Date</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-indigo-50/60 hover:shadow-sm transition-all duration-200 cursor-pointer font-medium text-slate-700 relative z-0 hover:z-10">
                                        <td className="p-4 font-mono font-bold text-slate-900">{payment.receipt_id}</td>
                                        <td className="p-4">
                                            <p className="font-semibold text-slate-900">{payment.clinic_name}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Dr. {payment.doctor_name}</p>
                                        </td>
                                        <td className="p-4 text-slate-500">
                                            {new Date(payment.appointment_date).toLocaleDateString('en-IN', {
                                                day: '2-digit', month: 'short', year: 'numeric'
                                            })}
                                        </td>
                                        <td className="p-4 font-bold text-slate-900">₹{parseFloat(payment.amount).toFixed(2)}</td>
                                        <td className="p-4">{statusBadge(payment.status)}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewDetails(payment.id)}
                                                    className="flex items-center gap-1 bg-slate-50 border border-slate-100 text-indigo-600 hover:bg-indigo-50 font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                                >
                                                    <FileText size={12} />
                                                    Invoice
                                                </button>
                                                {payment.status === 'Paid' && !payment.refund_status && payment.appointment_status !== 'Completed' && (
                                                    <button
                                                        onClick={() => openRefundModal(payment.id)}
                                                        className="flex items-center gap-1 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        <ShieldAlert size={12} />
                                                        Refund
                                                    </button>
                                                )}
                                                {payment.refund_status && (
                                                    <span className="text-[9px] bg-slate-100 text-slate-500 font-extrabold uppercase px-2 py-1 rounded">
                                                        Refund {payment.refund_status}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Refund Modal */}
            {isRefundModalOpen && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                                <ShieldAlert size={20} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 text-base">Request Refund</h3>
                                <p className="text-xs text-slate-400">Please provide a valid reason for canceling and requesting refund.</p>
                            </div>
                        </div>
                        <form onSubmit={handleRefundSubmit} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Reason for Refund</label>
                                <textarea
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    placeholder="Enter details here (e.g., Doctor was unavailable, had to reschedule...)"
                                    className="w-full text-xs border border-slate-200 rounded-2xl p-3 focus:outline-none focus:border-rose-400 h-28 resize-none"
                                    required
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsRefundModalOpen(false)}
                                    className="px-4 py-2 border border-slate-100 hover:bg-slate-50 rounded-xl text-slate-500 text-xs font-bold uppercase tracking-wider cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={refundSubmitting}
                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    {refundSubmitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
