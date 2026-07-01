import React from 'react';
import { FileText, Trash2, Plus } from 'lucide-react';

export function PrescriptionBuilder({ prescriptionItems, handlePrescriptionChange, addPrescriptionRow, removePrescriptionRow, postRemarks, setPostRemarks, submitStatus }) {
    return (
        <div className="space-y-6 flex flex-col min-h-0">
            {/* Prescription List Container */}
            <div className="bg-white border border-[#e9ecef] rounded-2xl p-5 shadow-sm flex flex-col min-h-0 max-h-[60vh]">
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        Prescription Builder
                    </h4>
                    <button 
                        type="button"
                        onClick={addPrescriptionRow}
                        className="w-6 h-6 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center font-bold text-sm transition"
                        title="Add Medication"
                    >
                        +
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {prescriptionItems.map((item, index) => (
                        <div key={index} className="bg-[#f8f9fa] border border-[#e9ecef] rounded-xl p-4 space-y-3 relative hover:border-[#ced4da] transition">
                            <button 
                                type="button"
                                onClick={() => removePrescriptionRow(index)}
                                className="absolute top-3.5 right-3.5 text-slate-400 hover:text-red-500 transition"
                                title="Delete medication"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <div>
                                <input 
                                    type="text"
                                    value={item.medicine_name}
                                    onChange={(e) => handlePrescriptionChange(index, 'medicine_name', e.target.value)}
                                    className="font-bold text-slate-800 text-sm bg-transparent border-0 border-b border-transparent focus:border-slate-300 focus:ring-0 focus:outline-none w-[80%] p-0 placeholder-slate-400"
                                    placeholder="Enter medication..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Dosage</label>
                                    <input 
                                        type="text" 
                                        value={item.dosage}
                                        onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                                        className="w-full bg-white border border-[#e9ecef] rounded-lg px-2.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-300 focus:ring-0 transition font-medium"
                                        placeholder="e.g. 10mg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Frequency</label>
                                    <select
                                        value={item.frequency}
                                        onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                                        className="w-full bg-white border border-[#e9ecef] rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-300 focus:ring-0 transition font-semibold"
                                    >
                                        <option>Once Daily</option>
                                        <option>Twice Daily</option>
                                        <option>Thrice Daily</option>
                                        <option>Four Times Daily</option>
                                        <option>As Needed (PRN)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Duration / Notes</label>
                                <input 
                                    type="text" 
                                    value={item.duration}
                                    onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                                    className="w-full bg-white border border-[#e9ecef] rounded-lg px-2.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-300 focus:ring-0 transition font-medium"
                                    placeholder="e.g. 30 Days. Take in morning."
                                />
                            </div>
                        </div>
                    ))}

                    <button 
                        type="button"
                        onClick={addPrescriptionRow}
                        className="w-full border-2 border-dashed border-[#e9ecef] hover:border-emerald-700/50 rounded-xl p-4 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-emerald-700 transition"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="text-xs font-bold">Add Medication</span>
                    </button>
                </div>
            </div>

            {/* Clinical Notes Card */}
            <div className="bg-white border border-[#e9ecef] rounded-2xl p-5 shadow-sm flex flex-col shrink-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Clinical Notes (Internal)</span>
                <textarea 
                    rows="3"
                    value={postRemarks}
                    onChange={(e) => setPostRemarks(e.target.value)}
                    className="w-full bg-slate-50 border border-[#e9ecef] rounded-xl px-3 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-0 transition font-medium"
                    placeholder="Add consultation notes here..."
                />
            </div>

            {submitStatus && submitStatus.message && (
                <div className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-3 transition shrink-0 ${
                    submitStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    submitStatus.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                }`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-ping"></div>
                    {submitStatus.message}
                </div>
            )}
        </div>
    );
}
