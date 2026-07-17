import React, { useState } from 'react';
import { Search, Eye, Printer, FileText, X, Check, DollarSign, Calendar } from 'lucide-react';
import axiosClient from '../../../api/axiosClient';

export function BillHistory({ bills }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Receipt/Bill Details Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBillData, setSelectedBillData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleViewBill = async (billId) => {
    setIsModalOpen(true);
    setLoadingDetails(true);
    try {
      const res = await axiosClient.get(`/medicine/bills/${billId}`);
      setSelectedBillData(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load bill receipt details");
      setIsModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('receipt-print-area').innerHTML;
    const originalContent = document.body.innerHTML;
    
    // Inject printing stylesheet dynamically
    const printWindow = window.open('', '_blank', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Pharmacy Invoice</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #334155; }
      .receipt-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
      .receipt-title { font-size: 24px; font-weight: 800; color: #1e293b; margin: 0; text-transform: uppercase; }
      .receipt-subtitle { font-size: 10px; color: #0ea5e9; font-weight: bold; margin: 5px 0 0; letter-spacing: 2px; }
      .meta-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 12px; }
      .meta-label { color: #94a3b8; font-weight: bold; text-transform: uppercase; font-size: 9px; }
      .meta-value { color: #334155; font-weight: bold; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
      th { border-bottom: 2px solid #e2e8f0; padding: 10px 0; text-align: left; color: #64748b; font-weight: 800; text-transform: uppercase; font-size: 9px; }
      td { border-bottom: 1px solid #f1f5f9; padding: 10px 0; color: #334155; font-weight: 500; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .totals-container { width: 250px; margin-left: auto; font-size: 12px; }
      .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
      .total-row.grand { border-top: 2px solid #e2e8f0; padding-top: 10px; font-weight: 800; font-size: 14px; color: #1e293b; }
      .footer { text-align: center; margin-top: 50px; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const filteredBills = bills.filter(b => 
    b.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.receipt_number && b.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
        <div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Sales Invoice Journal</h3>
          <p className="text-xs text-slate-400 font-medium">Search past sales, track payment states, and reprint patient payment receipts</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 stroke-slate-400" />
          <input
            type="text"
            placeholder="Search Bill Reference, Patient, Doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9fa] border-0 rounded-2xl text-xs font-semibold text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
          />
        </div>
      </div>

      {/* Bills List */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.01)]">
        {filteredBills.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-semibold">
            No transaction records found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="text-left text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                  <th className="pb-3">Bill Number</th>
                  <th className="pb-3 text-center">Receipt</th>
                  <th className="pb-3">Patient</th>
                  <th className="pb-3">Prescribing Doctor</th>
                  <th className="pb-3 text-center">Payment Method</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right">Grand Total</th>
                  <th className="pb-3 text-right">Date</th>
                  <th className="pb-3 text-right w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 text-slate-800 font-bold">{b.bill_number}</td>
                    <td className="py-4 text-center text-slate-500 font-mono">{b.receipt_number || '-'}</td>
                    <td className="py-4 text-slate-800">{b.patient_name}</td>
                    <td className="py-4 text-slate-500">Dr. {b.doctor_name}</td>
                    <td className="py-4 text-center text-slate-500">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-[10px] font-bold uppercase">
                        {b.payment_method}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        b.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {b.payment_status}
                      </span>
                    </td>
                    <td className="py-4 text-right text-slate-800 font-black">₹{parseFloat(b.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-4 text-right text-slate-400 font-medium">
                      {new Date(b.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                      <div className="text-[9px]">{new Date(b.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => handleViewBill(b.id)}
                        className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white transition flex items-center justify-center mx-auto"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bill Receipt Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-40 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl relative z-10 mx-4 overflow-hidden border border-slate-100">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                <FileText className="w-5 h-5 text-indigo-500" />
                Dispensation Invoice Detail
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetails || !selectedBillData ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-600"></div>
              </div>
            ) : (
              <>
                {/* Print Area */}
                <div className="p-8 max-h-[70vh] overflow-y-auto" id="receipt-print-area">
                  
                  {/* Receipt Header */}
                  <div className="receipt-header text-center pb-6 border-b-2 border-slate-100 mb-6">
                    <h1 className="receipt-title text-xl font-black text-slate-900 tracking-tight">HealTrack AI Pharmacy</h1>
                    <p className="receipt-subtitle text-[9px] text-indigo-600 font-extrabold uppercase tracking-widest mt-1">Dispensation Invoice Receipt</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Automated Electronic Health Record (EHR) Ledger</p>
                  </div>

                  {/* Invoice Meta Grid */}
                  <div className="meta-grid grid grid-cols-2 gap-6 text-xs mb-6 border-b border-slate-100 pb-6">
                    <div className="space-y-2">
                      <div>
                        <div className="meta-label text-[9px] text-slate-400 font-extrabold uppercase">Bill Number</div>
                        <div className="meta-value font-bold text-slate-700">{selectedBillData.bill.bill_number}</div>
                      </div>
                      <div>
                        <div className="meta-label text-[9px] text-slate-400 font-extrabold uppercase">Receipt Reference</div>
                        <div className="meta-value font-bold text-slate-700">{selectedBillData.bill.receipt_number || 'Pending'}</div>
                      </div>
                      <div>
                        <div className="meta-label text-[9px] text-slate-400 font-extrabold uppercase">Date & Time</div>
                        <div className="meta-value font-bold text-slate-700">{new Date(selectedBillData.bill.created_at).toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <div className="meta-label text-[9px] text-slate-400 font-extrabold uppercase">Patient Profile</div>
                        <div className="meta-value font-bold text-slate-700">{selectedBillData.bill.patient_name}</div>
                      </div>
                      <div>
                        <div className="meta-label text-[9px] text-slate-400 font-extrabold uppercase">Prescribing Practitioner</div>
                        <div className="meta-value font-bold text-slate-700">Dr. {selectedBillData.bill.doctor_name}</div>
                      </div>
                      <div>
                        <div className="meta-label text-[9px] text-slate-400 font-extrabold uppercase">Payment Details</div>
                        <div className="meta-value font-bold text-slate-700">{selectedBillData.bill.payment_method} ({selectedBillData.bill.payment_status})</div>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table className="w-full text-left text-xs mb-6">
                    <thead>
                      <tr className="border-b-2 border-slate-100 text-[9px] text-slate-400 font-extrabold uppercase">
                        <th className="pb-2">Medicine / Item Description</th>
                        <th className="pb-2 text-center w-20">Unit Cost</th>
                        <th className="pb-2 text-center w-16">Qty</th>
                        <th className="pb-2 text-right w-24">Item Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                      {selectedBillData.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5">
                            <span className="font-bold text-slate-700">{item.medicine_name}</span>
                            <div className="text-[9px] text-slate-400 font-medium">{item.generic_name} ({item.brand})</div>
                          </td>
                          <td className="py-2.5 text-center">₹{parseFloat(item.unit_price).toFixed(2)}</td>
                          <td className="py-2.5 text-center">{item.quantity}</td>
                          <td className="py-2.5 text-right font-bold text-slate-800">₹{parseFloat(item.total_price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals Breakdown */}
                  <div className="totals-container w-60 ml-auto border-t border-slate-100 pt-4 space-y-2 text-xs">
                    <div className="total-row flex justify-between text-slate-500 font-semibold">
                      <span>Subtotal:</span>
                      <span>₹{parseFloat(selectedBillData.bill.subtotal).toFixed(2)}</span>
                    </div>
                    <div className="total-row flex justify-between text-slate-500 font-semibold">
                      <span>Tax (GST):</span>
                      <span>₹{parseFloat(selectedBillData.bill.gst_amount).toFixed(2)}</span>
                    </div>
                    <div className="total-row flex justify-between text-slate-500 font-semibold">
                      <span>Discount:</span>
                      <span className="text-rose-500">-₹{parseFloat(selectedBillData.bill.discount_amount).toFixed(2)}</span>
                    </div>
                    <div className="total-row grand flex justify-between border-t-2 border-slate-100 pt-2 font-black text-sm text-slate-800">
                      <span>Grand Total:</span>
                      <span className="text-indigo-600">₹{parseFloat(selectedBillData.bill.grand_total).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Footer message */}
                  <div className="footer text-center mt-12 pt-4 border-t border-slate-100 text-[9px] text-slate-400 font-bold uppercase">
                    Thank you. Get Well Soon.
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    Print Receipt
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
