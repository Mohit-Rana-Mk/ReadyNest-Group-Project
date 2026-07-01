import React from 'react';
import { Plus, Trash2, Pill, MessageSquare } from 'lucide-react';

export function PrescriptionBuilder({ 
    prescriptionItems, 
    handlePrescriptionChange, 
    addPrescriptionRow, 
    removePrescriptionRow,
    diagnosis,
    setDiagnosis,
    preRemarks,
    setPreRemarks,
    postRemarks,
    setPostRemarks
}) {
    return (
        <div className="bg-white border border-[#e9ecef] rounded-2xl shadow-sm flex flex-col h-full shrink-0">
            <div className="p-5 border-b border-[#e9ecef] bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-emerald-600" />
                    Clinical Notes & eRx
                </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Diagnosis */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Primary Diagnosis
                    </label>
                    <input 
                        type="text"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder="e.g. Viral Fever, Hypertension"
                        className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-xl p-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                </div>

                {/* Pre-Consultation Remarks */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Pre-Consultation Remarks
                    </label>
                    <textarea 
                        value={preRemarks}
                        onChange={(e) => setPreRemarks(e.target.value)}
                        placeholder="Vitals summary, initial complaints, or notes from the receptionist..."
                        className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-xl p-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 min-h-[70px] resize-y"
                    />
                </div>

                {/* Post-Consultation Remarks */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Post-Consultation Remarks
                    </label>
                    <textarea 
                        value={postRemarks}
                        onChange={(e) => setPostRemarks(e.target.value)}
                        placeholder="Enter clinical observations, advice, and next steps here..."
                        className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-xl p-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 min-h-[100px] resize-y"
                    />
                </div>

                {/* Prescription Builder */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Prescription
                        </label>
                        <button 
                            onClick={addPrescriptionRow}
                            className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md transition"
                        >
                            <Plus className="w-3 h-3" /> Add Med
                        </button>
                    </div>
                    
                    <div className="space-y-3">
                        {prescriptionItems.map((item, index) => (
                            <div key={index} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm relative group">
                                <button 
                                    onClick={() => removePrescriptionRow(index)}
                                    className="absolute -right-2 -top-2 bg-white text-rose-500 border border-slate-200 hover:bg-rose-50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-sm"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                
                                <div className="space-y-3">
                                    <input 
                                        type="text" 
                                        placeholder="Medicine Name (e.g. Paracetamol)"
                                        value={item.medicine_name}
                                        onChange={(e) => handlePrescriptionChange(index, 'medicine_name', e.target.value)}
                                        className="w-full font-bold text-slate-800 text-sm border-b border-slate-200 focus:border-emerald-500 focus:outline-none pb-1 bg-transparent placeholder-slate-300"
                                    />
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-semibold block mb-1">Dosage</span>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. 500mg"
                                                value={item.dosage}
                                                onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                                                className="w-full text-xs text-slate-700 border border-slate-200 rounded p-1.5 focus:border-emerald-500 focus:outline-none bg-slate-50"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-semibold block mb-1">Frequency</span>
                                            <select 
                                                value={item.frequency}
                                                onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                                                className="w-full text-xs text-slate-700 border border-slate-200 rounded p-1.5 focus:border-emerald-500 focus:outline-none bg-slate-50"
                                            >
                                                <option>1-0-1 (Morning/Night)</option>
                                                <option>1-1-1 (TDS)</option>
                                                <option>1-0-0 (Morning)</option>
                                                <option>0-0-1 (Night)</option>
                                                <option>SOS (As needed)</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-semibold block mb-1">Duration / Instructions</span>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. 5 Days, after food"
                                            value={item.duration}
                                            onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                                            className="w-full text-xs text-slate-700 border border-slate-200 rounded p-1.5 focus:border-emerald-500 focus:outline-none bg-slate-50"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {prescriptionItems.length === 0 && (
                            <div className="text-center p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50">
                                <p className="text-xs text-slate-500">No medications added.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
