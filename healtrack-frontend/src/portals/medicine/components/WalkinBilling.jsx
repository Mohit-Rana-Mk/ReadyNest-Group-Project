import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Plus, Trash, DollarSign, User, Activity, AlertCircle, CheckCircle, ArrowLeft, Percent } from 'lucide-react';
import axiosClient from '../../../api/axiosClient';

export function WalkinBilling({ selectedPrescription, clearPrescription, inventory, refreshData }) {
  // Patient details
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientMrn, setPatientMrn] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  
  // Doctor details
  const [doctorId, setDoctorId] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorsList, setDoctorsList] = useState([]);

  // Selected Billing items
  const [billingItems, setBillingItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Search medicines
  const [medSearch, setMedSearch] = useState('');
  const [medResults, setMedResults] = useState([]);

  // Processing state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billingSuccess, setBillingSuccess] = useState(null);

  // Load Doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await axiosClient.get('/medicine/doctors');
        setDoctorsList(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDoctors();
  }, []);

  // Handle selected prescription loading
  useEffect(() => {
    if (selectedPrescription) {
      setPatientId(selectedPrescription.patient_id);
      setPatientName(selectedPrescription.patient_name);
      setPatientMrn(selectedPrescription.patient_mrn);
      setDoctorId(selectedPrescription.doctor_id);
      setDoctorName(selectedPrescription.doctor_name);

      // Pre-fill items by looking up prescribed medicines in stock
      const loadPrescItems = async () => {
        try {
          const res = await axiosClient.get(`/medicine/prescriptions/${selectedPrescription.prescription_id}`);
          const prescItems = res.data;
          
          const matchedItems = [];
          prescItems.forEach(item => {
            // Find in inventory by name (case-insensitive)
            const match = inventory.find(inv => 
              inv.medicine_name.toLowerCase().includes(item.medicine_name.toLowerCase()) && 
              inv.available_quantity > 0
            );

            if (match) {
              matchedItems.push({
                medicine_id: match.id,
                medicine_name: match.medicine_name,
                generic_name: match.generic_name,
                brand: match.brand,
                selling_price: parseFloat(match.selling_price),
                gst_percent: parseFloat(match.gst_percent || 0),
                available_quantity: match.available_quantity,
                quantity: 1
              });
            }
          });
          setBillingItems(matchedItems);
        } catch (err) {
          console.error(err);
        }
      };

      loadPrescItems();
    }
  }, [selectedPrescription, inventory]);

  // Search patients
  useEffect(() => {
    if (patientSearch.length < 3) {
      setPatientResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await axiosClient.get(`/medicine/patients?search=${patientSearch}`);
        setPatientResults(res.data);
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [patientSearch]);

  // Search medicines in loaded inventory
  useEffect(() => {
    if (!medSearch) {
      setMedResults([]);
      return;
    }
    const results = inventory.filter(m => 
      m.medicine_name.toLowerCase().includes(medSearch.toLowerCase()) ||
      m.generic_name.toLowerCase().includes(medSearch.toLowerCase()) ||
      m.brand.toLowerCase().includes(medSearch.toLowerCase())
    );
    setMedResults(results.slice(0, 10));
  }, [medSearch, inventory]);

  const handleSelectPatient = (p) => {
    setPatientId(p.id);
    setPatientName(p.name);
    setPatientMrn(p.mrn);
    setPatientSearch('');
    setPatientResults([]);
  };

  const handleAddMedicine = (med) => {
    // Check if already in billing items
    const exists = billingItems.find(item => item.medicine_id === med.id);
    if (exists) {
      alert("Medicine already added. Adjust quantity in the list.");
      return;
    }

    if (med.available_quantity <= 0) {
      alert("Medicine is out of stock.");
      return;
    }

    setBillingItems([...billingItems, {
      medicine_id: med.id,
      medicine_name: med.medicine_name,
      generic_name: med.generic_name,
      brand: med.brand,
      selling_price: parseFloat(med.selling_price),
      gst_percent: parseFloat(med.gst_percent || 0),
      available_quantity: med.available_quantity,
      quantity: 1
    }]);

    setMedSearch('');
    setMedResults([]);
  };

  const handleQtyChange = (medId, qty) => {
    const newQty = parseInt(qty) || 0;
    setBillingItems(billingItems.map(item => {
      if (item.medicine_id === medId) {
        if (newQty > item.available_quantity) {
          alert(`Cannot exceed available stock of ${item.available_quantity} units.`);
          return item;
        }
        return { ...item, quantity: Math.max(1, newQty) };
      }
      return item;
    }));
  };

  const handleRemoveItem = (medId) => {
    setBillingItems(billingItems.filter(item => item.medicine_id !== medId));
  };

  // Calculations
  const subtotal = billingItems.reduce((acc, item) => acc + (item.selling_price * item.quantity), 0);
  const gstAmount = billingItems.reduce((acc, item) => acc + ((item.selling_price * item.quantity) * (item.gst_percent / 100)), 0);
  const grandTotal = Math.max(0, subtotal + gstAmount - parseFloat(discount || 0));

  const handleDispense = async (e) => {
    e.preventDefault();
    if (!patientId) {
      alert("Please select a patient.");
      return;
    }
    if (!doctorId) {
      alert("Please select a prescribing doctor.");
      return;
    }
    if (billingItems.length === 0) {
      alert("Please add at least one medicine item.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        prescription_id: selectedPrescription?.prescription_id || null,
        patient_id: patientId,
        doctor_id: doctorId,
        patient_name: patientName,
        doctor_name: doctorName,
        items: billingItems.map(item => ({ medicine_id: item.medicine_id, quantity: item.quantity })),
        discount_amount: parseFloat(discount || 0),
        payment_method: paymentMethod
      };

      const res = await axiosClient.post('/medicine/dispense', payload);

      if (paymentMethod === 'Cash') {
        setBillingSuccess({
          billId: res.data.billId,
          billNumber: res.data.billNumber,
          receiptNumber: res.data.receiptNumber,
          grandTotal: res.data.grandTotal,
          patientName,
          doctorName
        });
        if (refreshData) refreshData();
      } else {
        // Load Razorpay script
        const rzpLoaded = await new Promise((resolve) => {
          if (window.Razorpay) { resolve(true); return; }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
        if (!rzpLoaded) {
          alert('Failed to load Razorpay payment gateway.');
          setIsSubmitting(false);
          return;
        }

        // Razorpay Payment checkout
        const { rzpOrder } = res.data;
        if (!rzpOrder) {
          throw new Error("Razorpay order details not returned from server.");
        }

        let paymentProcessed = false;

        const options = {
          key: rzpOrder.keyId,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: "HealTrack AI Pharmacy",
          description: `Dispensation Bill ${res.data.billNumber}`,
          order_id: rzpOrder.orderId,
          prefill: {
            name: patientName || '',
            contact: selectedPrescription?.patient_phone || '9999999999',
            email: 'patient@healtrack.com'
          },
          handler: async (response) => {
            paymentProcessed = true;
            try {
              // Verify Online Payment
              const verifyRes = await axiosClient.post('/medicine/verify', {
                bill_id: res.data.billId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              });

              setBillingSuccess({
                billId: res.data.billId,
                billNumber: res.data.billNumber,
                receiptNumber: verifyRes.data.receiptNumber,
                grandTotal: res.data.grandTotal,
                patientName,
                doctorName
              });
              if (refreshData) refreshData();
            } catch (err) {
              console.error(err);
              alert("Online payment verification failed. Please contact the administrator.");
            }
          },
          modal: {
            ondismiss: async () => {
              if (paymentProcessed) return;
              try {
                await axiosClient.post('/medicine/cancel-bill', { bill_id: res.data.billId });
              } catch (err) {
                console.error("Error cancelling bill:", err);
              }
              setIsSubmitting(false);
              if (refreshData) refreshData();
            }
          },
          theme: { color: "#6366f1" }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to process bill.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setPatientId('');
    setPatientName('');
    setPatientMrn('');
    setDoctorId('');
    setDoctorName('');
    setBillingItems([]);
    setDiscount(0);
    setPaymentMethod('Cash');
    setBillingSuccess(null);
    if (clearPrescription) clearPrescription();
  };

  if (billingSuccess) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-slate-100 shadow-[0_4px_30px_rgba(0,0,0,0.03)] rounded-3xl p-8 text-center space-y-6 animate-fadeIn">
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle className="w-12 h-12" />
        </div>

        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Dispensing Checkout Successful</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Bill transaction complete and inventory levels adjusted successfully.
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 text-left border border-slate-100 space-y-3.5 max-w-md mx-auto">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase">Bill Reference:</span>
            <span className="text-slate-700 font-black">{billingSuccess.billNumber}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase">Receipt Number:</span>
            <span className="text-slate-700 font-black">{billingSuccess.receiptNumber || 'Pending'}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase">Total Charged:</span>
            <span className="text-emerald-600 font-black text-sm">₹{parseFloat(billingSuccess.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase">Patient:</span>
            <span className="text-slate-700 font-bold">{billingSuccess.patientName}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleReset}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            New Transaction
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back button if prescription is loaded */}
      {selectedPrescription && (
        <button 
          onClick={handleReset}
          className="text-xs text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-slate-100 transition shadow-sm w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Clear Prescription and Reset Checkout
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Billing Inputs (7 columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Patient Details Selection */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.01)] space-y-4">
            <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4.5 h-4.5 text-indigo-500" />
              Patient & Practitioner Details
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Patient Selector */}
              <div className="relative">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Patient Search</label>
                {patientName ? (
                  <div className="flex items-center justify-between bg-[#f8f9fa] border border-slate-200/50 rounded-xl px-4 py-3 text-xs font-semibold text-slate-700">
                    <div>
                      <div>{patientName}</div>
                      <div className="text-[9px] text-slate-400 font-bold mt-0.5">{patientMrn}</div>
                    </div>
                    {!selectedPrescription && (
                      <button 
                        onClick={() => { setPatientId(''); setPatientName(''); setPatientMrn(''); }}
                        className="text-rose-500 hover:text-rose-600 text-[10px] font-bold"
                      >
                        Change
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 stroke-slate-400" />
                      <input
                        type="text"
                        placeholder="Search Patient name, phone, MRN..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-[#f8f9fa] border-0 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 outline-none focus:ring-1 focus:ring-indigo-500/20"
                      />
                    </div>
                    {patientResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-slate-100 shadow-xl rounded-2xl mt-1 z-30 divide-y divide-slate-50 max-h-48 overflow-y-auto">
                        {patientResults.map(p => (
                          <div 
                            key={p.id}
                            onClick={() => handleSelectPatient(p)}
                            className="p-3 hover:bg-indigo-50/50 cursor-pointer text-xs transition flex justify-between"
                          >
                            <span className="font-bold text-slate-700">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{p.mrn}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Doctor Selector */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Prescribing Practitioner</label>
                {selectedPrescription ? (
                  <div className="bg-[#f8f9fa] border border-slate-200/50 rounded-xl px-4 py-3.5 text-xs font-semibold text-slate-700">
                    Dr. {doctorName}
                  </div>
                ) : (
                  <select
                    value={doctorId}
                    onChange={(e) => {
                      const doc = doctorsList.find(d => d.id === parseInt(e.target.value));
                      setDoctorId(doc?.id || '');
                      setDoctorName(doc?.name || '');
                    }}
                    className="w-full bg-[#f8f9fa] border-0 rounded-xl px-4 py-3.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                  >
                    <option value="">Select doctor...</option>
                    {doctorsList.map(d => (
                      <option key={d.id} value={d.id}>Dr. {d.name} ({d.department || 'General'})</option>
                    ))}
                  </select>
                )}
              </div>

            </div>
          </div>

          {/* Billing items checkout */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.01)] space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-4.5 h-4.5 text-indigo-500" />
                Dispensation Cart
              </h4>
              
              {/* Search Medicine to Add */}
              <div className="relative w-64 z-20">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 stroke-slate-400" />
                <input
                  type="text"
                  placeholder="Search and add medicine..."
                  value={medSearch}
                  onChange={(e) => setMedSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-[#f8f9fa] border-0 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 outline-none focus:ring-1 focus:ring-indigo-500/20"
                />
                
                {medResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-100 shadow-xl rounded-2xl mt-1 z-30 divide-y divide-slate-50 max-h-48 overflow-y-auto">
                    {medResults.map(m => (
                      <div 
                        key={m.id}
                        onClick={() => handleAddMedicine(m)}
                        className="p-3 hover:bg-indigo-50/50 cursor-pointer text-xs transition flex flex-col gap-0.5"
                      >
                        <div className="flex justify-between font-bold text-slate-700">
                          <span>{m.medicine_name}</span>
                          <span className="text-emerald-600">₹{m.selling_price}</span>
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                          <span>{m.brand} • Qty: {m.available_quantity}</span>
                          <span className="text-[8px] bg-indigo-50 px-1 py-0.5 rounded text-indigo-500">Exp: {new Date(m.expiry_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cart Table */}
            {billingItems.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-2xl py-12 text-center text-slate-400 text-xs font-semibold">
                No items added to the dispensation cart. Add items above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="text-left text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                      <th className="pb-3">Medicine</th>
                      <th className="pb-3 text-center">Unit Price</th>
                      <th className="pb-3 text-center w-24">Quantity</th>
                      <th className="pb-3 text-center">Tax (GST)</th>
                      <th className="pb-3 text-right">Total Price</th>
                      <th className="pb-3 text-right w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {billingItems.map((item) => {
                      const itemTotal = item.selling_price * item.quantity;
                      const itemGst = itemTotal * (item.gst_percent / 100);

                      return (
                        <tr key={item.medicine_id} className="group">
                          <td className="py-3">
                            <div>{item.medicine_name}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase">{item.brand} • Stock: {item.available_quantity}</div>
                          </td>
                          <td className="py-3 text-center">₹{item.selling_price.toFixed(2)}</td>
                          <td className="py-3 text-center">
                            <input
                              type="number"
                              min="1"
                              max={item.available_quantity}
                              value={item.quantity}
                              onChange={(e) => handleQtyChange(item.medicine_id, e.target.value)}
                              className="w-16 px-2 py-1 text-center bg-[#f8f9fa] border border-slate-200/50 rounded-lg outline-none text-xs font-bold"
                            />
                          </td>
                          <td className="py-3 text-center text-slate-400">
                            {item.gst_percent}%<div className="text-[8px]">(₹{itemGst.toFixed(2)})</div>
                          </td>
                          <td className="py-3 text-right font-black">₹{itemTotal.toFixed(2)}</td>
                          <td className="py-3 text-right">
                            <button 
                              onClick={() => handleRemoveItem(item.medicine_id)}
                              className="text-rose-400 hover:text-rose-600 transition"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Billing Summary (5 columns) */}
        <div className="lg:col-span-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.01)] flex flex-col justify-between h-fit space-y-6">
          <div className="space-y-4">
            <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4.5 h-4.5 text-indigo-500" />
              Checkout Summary
            </h4>

            {/* Calculations Breakdown */}
            <div className="space-y-3 bg-[#f8f9fa]/70 border border-slate-100 rounded-2xl p-5">
              <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                <span>Tax (GST):</span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>
              
              {/* Discount Input */}
              <div className="flex items-center justify-between border-t border-slate-200/50 pt-2.5">
                <span className="text-xs text-slate-500 font-bold flex items-center gap-0.5">
                  Discount (₹):
                </span>
                <input
                  type="number"
                  min="0"
                  max={subtotal + gstAmount}
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-20 px-2 py-1 text-right bg-white border border-slate-200 rounded-lg outline-none text-xs font-bold"
                />
              </div>

              <div className="flex justify-between items-center border-t border-slate-200/50 pt-3 text-slate-800 font-black">
                <span className="text-sm">Grand Total:</span>
                <span className="text-indigo-600 text-lg">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Payment Option</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Cash')}
                  className={`py-3 rounded-2xl font-bold text-xs transition ${
                    paymentMethod === 'Cash' 
                      ? 'bg-slate-800 text-white shadow-md' 
                      : 'bg-[#f8f9fa] text-slate-500 border border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  💵 Cash payment
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Online')}
                  className={`py-3 rounded-2xl font-bold text-xs transition ${
                    paymentMethod === 'Online' 
                      ? 'bg-slate-800 text-white shadow-md' 
                      : 'bg-[#f8f9fa] text-slate-500 border border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  💳 Razorpay Online
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleDispense}
            disabled={isSubmitting || billingItems.length === 0}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 text-white disabled:text-slate-400 rounded-2xl text-xs uppercase tracking-widest font-black transition shadow-lg hover:shadow-[0_4px_15px_rgba(99,102,241,0.3)] disabled:shadow-none flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Processing Checkout...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Dispense & checkout
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
