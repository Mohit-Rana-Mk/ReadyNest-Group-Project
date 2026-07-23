import React from 'react';
import { Plus, Trash2, Pill, MessageSquare } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';

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
    const [activeTab, setActiveTab] = React.useState('notes');

    return (
        <div className="bg-white border border-[#e9ecef] rounded-2xl shadow-sm flex flex-col h-full shrink-0">
            {/* Header Tabs */}
            <div className="p-2.5 border-b border-[#e9ecef] bg-slate-50 flex items-center gap-2 rounded-t-2xl">
                <button
                    type="button"
                    onClick={() => setActiveTab('notes')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'notes'
                            ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    Clinical Notes
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('erx')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'erx'
                            ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                >
                    <Pill className="w-3.5 h-3.5 text-emerald-600" />
                    eRx
                    {prescriptionItems?.filter(i => i.medicine_name?.trim()).length > 0 && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-0.5">
                            {prescriptionItems.filter(i => i.medicine_name?.trim()).length}
                        </span>
                    )}
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {activeTab === 'notes' ? (
                    <>
                        {/* Diagnosis */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                Primary Diagnosis
                            </label>
                            <Input 
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
                                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
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
                                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                                Post-Consultation Remarks / Clinical Notes
                            </label>
                            <textarea 
                                value={postRemarks}
                                onChange={(e) => setPostRemarks(e.target.value)}
                                placeholder="Enter clinical observations, advice, and next steps here..."
                                className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-xl p-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 min-h-[120px] resize-y"
                            />
                        </div>
                    </>
                ) : (
                    /* Prescription Builder */
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Prescription Items
                            </label>
                            <Button 
                                variant="outline"
                                onClick={addPrescriptionRow}
                                className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg transition border-none"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add Medication
                            </Button>
                        </div>
                        
                        <div className="space-y-3">
                            {prescriptionItems.map((item, index) => (
                                <div key={index} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm relative group">
                                    <Button 
                                        variant="outline"
                                        onClick={() => removePrescriptionRow(index)}
                                        className="absolute -right-2 -top-2 bg-white text-rose-500 border border-slate-200 hover:bg-rose-50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-sm"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                    
                                    <div className="space-y-3">
                                        <Input 
                                            type="text" 
                                            placeholder="Medicine Name (e.g. Paracetamol)"
                                            value={item.medicine_name}
                                            onChange={(e) => handlePrescriptionChange(index, 'medicine_name', e.target.value)}
                                            className="w-full font-bold text-slate-800 text-sm border-b border-slate-200 focus:border-emerald-500 focus:outline-none pb-1 bg-transparent placeholder-slate-300 rounded-none px-0 py-0"
                                        />
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-semibold block mb-1">Dosage</span>
                                                <Input 
                                                    type="text" 
                                                    placeholder="e.g. 500mg"
                                                    value={item.dosage}
                                                    onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                                                    className="w-full text-xs text-slate-700 border border-slate-200 rounded p-1.5 focus:border-emerald-500 focus:outline-none bg-slate-50 px-1.5 py-1.5"
                                                />
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-semibold block mb-1">Frequency</span>
                                                <Select 
                                                    value={item.frequency}
                                                    onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                                                    className="w-full text-xs text-slate-700 border border-slate-200 rounded p-1.5 focus:border-emerald-500 focus:outline-none bg-slate-50 px-1.5 py-1.5"
                                                >
                                                    <option>1-0-1 (Morning/Night)</option>
                                                    <option>1-1-1 (TDS)</option>
                                                    <option>1-0-0 (Morning)</option>
                                                    <option>0-0-1 (Night)</option>
                                                    <option>SOS (As needed)</option>
                                                </Select>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-semibold block mb-1">Duration / Instructions</span>
                                            <Input 
                                                type="text" 
                                                placeholder="e.g. 5 Days, after food"
                                                value={item.duration}
                                                onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                                                className="w-full text-xs text-slate-700 border border-slate-200 rounded p-1.5 focus:border-emerald-500 focus:outline-none bg-slate-50 px-1.5 py-1.5"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {prescriptionItems.length === 0 && (
                                <div className="text-center p-6 border border-dashed border-slate-300 rounded-xl bg-slate-50">
                                    <p className="text-xs text-slate-500 mb-2">No medications added to prescription.</p>
                                    <Button 
                                        variant="outline"
                                        onClick={addPrescriptionRow}
                                        className="text-xs font-bold text-emerald-600 bg-white border border-emerald-200 hover:bg-emerald-50 px-3 py-1.5 rounded-lg shadow-sm"
                                    >
                                        <Plus className="w-3.5 h-3.5 inline mr-1" /> Add First Medication
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
