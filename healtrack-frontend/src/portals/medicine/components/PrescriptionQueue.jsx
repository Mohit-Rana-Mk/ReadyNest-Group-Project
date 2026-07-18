import React, { useState } from 'react';
import { Search, FileText, User, ShoppingBag, Eye, Calendar, Sparkles } from 'lucide-react';
import axiosClient from '../../../api/axiosClient';
import { toast } from '../../../components/ui/Toast';

export function PrescriptionQueue({ prescriptions, onSelectPrescription, loading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState(null);
  const [viewingPrescId, setViewingPrescId] = useState(null);
  const [itemsLoading, setItemsLoading] = useState(false);

  const handleViewDetails = async (e, prescId) => {
    e.stopPropagation();
    if (viewingPrescId === prescId) {
      setViewingPrescId(null);
      setSelectedItems(null);
      return;
    }
    setViewingPrescId(prescId);
    setItemsLoading(true);
    try {
      const res = await axiosClient.get(`/medicine/prescriptions/${prescId}`);
      setSelectedItems(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load prescription items");
    } finally {
      setItemsLoading(false);
    }
  };

  const filteredQueue = prescriptions.filter(p => 
    p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patient_mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.doctor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
        <div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Prescription Worklist</h3>
          <p className="text-xs text-slate-400 font-medium">Select a patient prescription to review details or process for billing</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 stroke-slate-400" />
          <input
            type="text"
            placeholder="Search by Patient MRN, Name, Doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9fa] border-0 rounded-2xl text-xs font-semibold text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
          />
        </div>
      </div>

      {/* Main Container */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-600"></div>
        </div>
      ) : filteredQueue.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl py-16 px-6 text-center shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 text-indigo-500">
            <FileText className="w-8 h-8" />
          </div>
          <h4 className="text-sm font-black text-slate-800 tracking-tight">Prescription Queue Empty</h4>
          <p className="text-xs text-slate-400 font-medium mt-1 max-w-sm">
            There are currently no active patient prescriptions sent to the pharmacy for dispensing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredQueue.map((item) => {
            const isViewing = viewingPrescId === item.prescription_id;
            const patientAge = item.date_of_birth 
              ? new Date().getFullYear() - new Date(item.date_of_birth).getFullYear() 
              : 'N/A';

            return (
              <div 
                key={item.prescription_id} 
                className="bg-white rounded-3xl border border-slate-100 hover:border-indigo-100 shadow-[0_4px_25px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_30px_rgba(99,102,241,0.04)] transition duration-200 overflow-hidden"
              >
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Column: Patient Profile */}
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-800 tracking-tight">{item.patient_name}</h4>
                        <span className="text-[9px] font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg tracking-wider">
                          {item.patient_mrn}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-bold">
                        {item.gender} • {patientAge} Years Old • Phone: {item.patient_phone || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Middle Column: Clinical Details */}
                  <div className="space-y-1">
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Prescribing Practitioner</p>
                    <h5 className="text-xs font-bold text-slate-700">Dr. {item.doctor_name}</h5>
                    <p className="text-[10px] text-slate-500 font-semibold">{item.department_name || 'General Medicine'}</p>
                  </div>

                  {/* Diagnosis */}
                  <div className="space-y-1">
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Diagnosis</p>
                    <span className="text-xs font-bold text-slate-700 bg-indigo-50/50 px-2.5 py-1 rounded-xl inline-block">
                      {item.diagnosis || 'General Checkup'}
                    </span>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleViewDetails(e, item.prescription_id)}
                      className={`h-9 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        isViewing 
                          ? 'bg-slate-800 text-white hover:bg-slate-700' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      {isViewing ? 'Hide Details' : 'View Items'}
                    </button>
                    <button
                      onClick={() => onSelectPrescription(item)}
                      className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow-[0_2px_10px_rgba(99,102,241,0.2)] flex items-center gap-1.5"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Process Bill
                    </button>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isViewing && (
                  <div className="border-t border-slate-50 bg-[#fafbfe]/50 px-6 py-5 animate-slideDown">
                    <h5 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      Doctor Prescribed Therapeutics
                    </h5>
                    {itemsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-indigo-600"></div>
                      </div>
                    ) : !selectedItems || selectedItems.length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium">No medicines registered in this prescription.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedItems.map((med, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100/80 shadow-sm flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start">
                                <h6 className="text-xs font-extrabold text-slate-800">{med.medicine_name}</h6>
                                <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                  {med.duration}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">
                                Dosage: {med.dosage}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                Frequency: {med.frequency}
                              </p>
                            </div>
                            {med.instructions && (
                              <p className="text-[10px] text-slate-400 font-medium italic mt-2.5 bg-slate-50 p-2 rounded-lg border border-slate-100/50">
                                Info: "{med.instructions}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
