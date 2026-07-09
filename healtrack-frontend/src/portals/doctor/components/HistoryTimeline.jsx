import React, { useState } from 'react';
import { FileText, Clock, Activity, Pill, Search, ChevronDown, ChevronUp, Heart, Scale, Droplet } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export function HistoryTimeline({ patientHistory, loadingHistory }) {
    const [activeTab, setActiveTab] = useState('encounters'); // 'encounters' or 'vitals'
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedPrescriptions, setExpandedPrescriptions] = useState({});

    if (loadingHistory) {
        return (
            <div className="flex-1 bg-white/80 backdrop-blur-md border border-[#e9ecef] rounded-3xl p-6 shadow-sm flex flex-col justify-center items-center h-full min-h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-slate-500 text-sm">Loading patient history...</p>
            </div>
        );
    }

    const hasPrescriptions = patientHistory && patientHistory.prescriptions && patientHistory.prescriptions.length > 0;
    const hasVitals = patientHistory && patientHistory.vitalsHistory && patientHistory.vitalsHistory.length > 0;

    const prescriptionsList = hasPrescriptions ? patientHistory.prescriptions : [];
    
    // Sort or map vitals history for charts (chronological order)
    const rawVitals = hasVitals ? patientHistory.vitalsHistory : [];
    const latestVitals = rawVitals[0] || null; // first element in DESC list is latest

    // Filter prescriptions by search term
    const filteredPrescriptions = prescriptionsList.filter(record => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const diagnosisMatch = record.diagnosis?.toLowerCase().includes(term);
        const doctorMatch = record.doctor_name?.toLowerCase().includes(term);
        const medicineMatch = record.items?.some(item => item.medicine_name?.toLowerCase().includes(term));
        return diagnosisMatch || doctorMatch || medicineMatch;
    });

    const togglePrescription = (id) => {
        setExpandedPrescriptions(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Classify pulse rate
    const getPulseClass = (pulse) => {
        if (!pulse) return { text: 'N/A', style: 'text-slate-500 bg-slate-50 border-slate-200' };
        const val = parseInt(pulse);
        if (val >= 60 && val <= 100) return { text: 'Normal', style: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
        if ((val >= 50 && val < 60) || (val > 100 && val <= 110)) return { text: 'Borderline', style: 'text-amber-700 bg-amber-50 border-amber-200' };
        return { text: 'Critical', style: 'text-rose-700 bg-rose-50 border-rose-200' };
    };

    // Classify BP
    const getBpClass = (systolic, diastolic) => {
        if (!systolic || !diastolic) return { text: 'N/A', style: 'text-slate-500 bg-slate-50 border-slate-200' };
        const sys = parseInt(systolic);
        const dia = parseInt(diastolic);
        if (sys < 120 && dia < 80) return { text: 'Normal', style: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
        if (sys >= 120 && sys <= 129 && dia < 80) return { text: 'Borderline', style: 'text-amber-700 bg-amber-50 border-amber-200' };
        if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) return { text: 'Prehypertension', style: 'text-orange-700 bg-orange-50 border-orange-200' };
        return { text: 'Hypertension L2', style: 'text-rose-700 bg-rose-50 border-rose-200' };
    };

    // Classify Blood Sugar
    const getSugarClass = (sugar) => {
        if (!sugar) return { text: 'N/A', style: 'text-slate-500 bg-slate-50 border-slate-200' };
        const val = parseInt(sugar);
        if (val < 100) return { text: 'Normal', style: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
        if (val >= 100 && val <= 125) return { text: 'Prediabetes', style: 'text-orange-700 bg-orange-50 border-orange-200' };
        return { text: 'Critical', style: 'text-rose-700 bg-rose-50 border-rose-200' };
    };

    // Setup chart data in chronological order (oldest to newest)
    const chartData = [...rawVitals].reverse().map(v => ({
        date: new Date(v.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        systolic: v.systolic_bp || null,
        diastolic: v.diastolic_bp || null,
        pulse: v.pulse_rate || null,
        sugar: v.blood_sugar_mgdl || null,
        weight: v.weight_kg || null
    }));

    return (
        <div className="flex-1 w-full h-full bg-white border border-[#e9ecef] rounded-3xl shadow-sm flex flex-col overflow-hidden">
            {/* Header Area */}
            <div className="p-5 border-b border-[#e9ecef] bg-slate-50/80 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
                <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        Clinical History Timeline
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase mt-0.5">
                        Patient Diagnostics & Vitals Ledger
                    </p>
                </div>

                {/* Segmented Tab Switcher */}
                <div className="flex bg-slate-200/60 p-1 rounded-xl items-center sm:self-center">
                    <button
                        onClick={() => setActiveTab('encounters')}
                        className={`flex-1 sm:flex-initial px-4 py-1.5 text-[11px] font-bold rounded-xl transition-all duration-200 ${
                            activeTab === 'encounters'
                                ? 'bg-white text-indigo-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Encounters
                    </button>
                    <button
                        onClick={() => setActiveTab('vitals')}
                        className={`flex-1 sm:flex-initial px-4 py-1.5 text-[11px] font-bold rounded-xl transition-all duration-200 ${
                            activeTab === 'vitals'
                                ? 'bg-white text-indigo-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Vitals Trends
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
                {activeTab === 'encounters' ? (
                    <div className="flex flex-col h-full">
                        {/* Search Bar */}
                        <div className="p-4 border-b border-slate-100 bg-white relative shrink-0">
                            <span className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by diagnosis, doctor, or medication..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200"
                            />
                        </div>

                        {/* Encounters Timeline Body */}
                        <div className="flex-1 p-6">
                            {!hasPrescriptions ? (
                                <div className="flex flex-col justify-center items-center h-64 text-slate-400">
                                    <FileText className="w-12 h-12 mb-3 text-slate-300" />
                                    <p className="text-xs font-semibold">No historical encounters found.</p>
                                </div>
                            ) : filteredPrescriptions.length === 0 ? (
                                <div className="flex flex-col justify-center items-center h-64 text-slate-400">
                                    <Search className="w-8 h-8 mb-3 text-slate-300" />
                                    <p className="text-xs font-semibold">No matches for "{searchTerm}".</p>
                                </div>
                            ) : (
                                <div className="relative border-l-2 border-slate-100 ml-4 space-y-6">
                                    {filteredPrescriptions.map((record, index) => {
                                        const isExpanded = expandedPrescriptions[record.prescription_id] !== false; // default expanded
                                        const isFirst = index === 0;
                                        return (
                                            <div key={record.prescription_id || index} className="relative pl-6">
                                                {/* Timeline node marker */}
                                                <span 
                                                    className={`absolute -left-[11px] top-1.5 w-5 h-5 bg-white border-2 rounded-full transition-all flex items-center justify-center ring-4 ring-white ${
                                                        isExpanded 
                                                            ? 'border-indigo-600 bg-indigo-50' 
                                                            : 'border-slate-300'
                                                    }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isExpanded ? 'bg-indigo-600' : 'bg-slate-400'}`} />
                                                </span>

                                                {/* Accordion Card */}
                                                <div 
                                                    className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all duration-255 ${
                                                        isExpanded 
                                                            ? 'border-indigo-100 ring-4 ring-indigo-500/5' 
                                                            : 'border-slate-200/80 hover:border-slate-300'
                                                    }`}
                                                >
                                                    {/* Card Header (Toggle Action) */}
                                                    <div 
                                                        onClick={() => togglePrescription(record.prescription_id)}
                                                        className="p-4 flex justify-between items-center cursor-pointer select-none bg-slate-50/20 hover:bg-slate-50/50 transition-colors"
                                                    >
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 text-sm">{record.diagnosis}</h4>
                                                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                                                                <span>{new Date(record.created_at || record.appointment_date).toLocaleDateString()}</span>
                                                                <span>•</span>
                                                                <span className="font-medium text-slate-600">{record.doctor_name}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-slate-400 p-1 hover:bg-slate-100 rounded-lg">
                                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </div>
                                                    </div>

                                                    {/* Card Body */}
                                                    {isExpanded && (
                                                        <div className="p-4 border-t border-slate-100 bg-white space-y-4">
                                                            {record.post_remarks && (
                                                                <div>
                                                                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Clinical Evaluation Notes</h5>
                                                                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                                                        {record.post_remarks}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {record.items && record.items.length > 0 && (
                                                                <div>
                                                                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                                        <Pill className="w-3.5 h-3.5 text-indigo-500" />
                                                                        Prescribed Medications
                                                                    </h5>
                                                                    <div className="space-y-2">
                                                                        {record.items.map((item, idx) => (
                                                                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-white border border-slate-200/60 p-3 rounded-xl gap-2 hover:bg-slate-50/30 transition-colors">
                                                                                <span className="font-medium text-slate-800">
                                                                                    {item.medicine_name} 
                                                                                </span>
                                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                                    <span className="text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                                                                                        {item.dosage}
                                                                                    </span>
                                                                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px]">
                                                                                        {item.frequency}
                                                                                    </span>
                                                                                    {item.duration && (
                                                                                        <span className="text-slate-500 text-[10px] pl-1 border-l border-slate-200">
                                                                                            {item.duration}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-6 space-y-6">
                        {/* Latest Vitals KPI Highlight Grid */}
                        <div>
                            <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-3">Latest Recorded Diagnostics</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {/* Pulse Rate Card */}
                                <div className="bg-white border border-slate-200/70 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pulse Rate</span>
                                        <Activity className="w-8 h-8 text-rose-500 bg-rose-50 rounded-xl p-1.5 fill-rose-50/50" />
                                    </div>
                                    <div className="mt-3">
                                        <span className="text-lg font-bold text-slate-800">
                                            {latestVitals?.pulse_rate ? `${latestVitals.pulse_rate} ` : 'N/A '}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-semibold">bpm</span>
                                    </div>
                                    <div className="mt-2.5">
                                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getPulseClass(latestVitals?.pulse_rate).style}`}>
                                            {getPulseClass(latestVitals?.pulse_rate).text}
                                        </span>
                                    </div>
                                </div>

                                {/* Blood Pressure Card */}
                                <div className="bg-white border border-slate-200/70 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blood Pressure</span>
                                        <Heart className="w-8 h-8 text-amber-500 bg-amber-50 rounded-xl p-1.5 fill-amber-50/50" />
                                    </div>
                                    <div className="mt-3">
                                        <span className="text-lg font-bold text-slate-800">
                                            {latestVitals?.systolic_bp && latestVitals?.diastolic_bp 
                                                ? `${latestVitals.systolic_bp}/${latestVitals.diastolic_bp} ` 
                                                : 'N/A '}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-semibold">mmHg</span>
                                    </div>
                                    <div className="mt-2.5">
                                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getBpClass(latestVitals?.systolic_bp, latestVitals?.diastolic_bp).style}`}>
                                            {getBpClass(latestVitals?.systolic_bp, latestVitals?.diastolic_bp).text}
                                        </span>
                                    </div>
                                </div>

                                {/* Blood Sugar Card */}
                                <div className="bg-white border border-slate-200/70 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blood Sugar</span>
                                        <Droplet className="w-8 h-8 text-indigo-500 bg-indigo-50 rounded-xl p-1.5 fill-indigo-50/50" />
                                    </div>
                                    <div className="mt-3">
                                        <span className="text-lg font-bold text-slate-800">
                                            {latestVitals?.blood_sugar_mgdl ? `${latestVitals.blood_sugar_mgdl} ` : 'N/A '}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-semibold">mg/dL</span>
                                    </div>
                                    <div className="mt-2.5">
                                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getSugarClass(latestVitals?.blood_sugar_mgdl).style}`}>
                                            {getSugarClass(latestVitals?.blood_sugar_mgdl).text}
                                        </span>
                                    </div>
                                </div>

                                {/* Body Weight Card */}
                                <div className="bg-white border border-slate-200/70 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weight</span>
                                        <Scale className="w-8 h-8 text-emerald-500 bg-emerald-50 rounded-xl p-1.5 fill-emerald-50/50" />
                                    </div>
                                    <div className="mt-3">
                                        <span className="text-lg font-bold text-slate-800">
                                            {latestVitals?.weight_kg ? `${latestVitals.weight_kg} ` : 'N/A '}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-semibold">kg</span>
                                    </div>
                                    <div className="mt-2.5">
                                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-slate-200 text-slate-500 bg-slate-50 uppercase tracking-wider">
                                            Measured
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {rawVitals.length === 0 ? (
                            <div className="flex flex-col justify-center items-center py-12 px-4 border border-dashed border-slate-200 rounded-3xl bg-white text-slate-400 text-center">
                                <Activity className="w-10 h-10 mb-2.5 text-indigo-500 stroke-[1.5]" />
                                <h5 className="text-xs font-bold text-slate-700">No Vitals Trend Data Available</h5>
                                <p className="text-[10px] text-slate-400 mt-1 max-w-[280px]">
                                    Historical trends for Cardiology and Metabolism will appear once vitals are recorded during consultations.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Cardiology Trend Chart */}
                                <div className="bg-white border border-slate-200/75 rounded-3xl p-5 shadow-xs">
                                    <div className="mb-4">
                                        <h5 className="font-bold text-slate-800 text-xs">Cardiology Trend</h5>
                                        <p className="text-[10px] text-slate-400">Systolic/Diastolic blood pressure (mmHg) & Pulse rate (bpm) over time</p>
                                    </div>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                                                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                                                    labelStyle={{ fontSize: 10, fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                                                    itemStyle={{ fontSize: 10 }}
                                                />
                                                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                                                <Line type="monotone" dataKey="systolic" name="Systolic BP" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                                <Line type="monotone" dataKey="diastolic" name="Diastolic BP" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                                <Line type="monotone" dataKey="pulse" name="Pulse Rate" stroke="#10b981" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Metabolic Trend Chart */}
                                <div className="bg-white border border-slate-200/75 rounded-3xl p-5 shadow-xs">
                                    <div className="mb-4">
                                        <h5 className="font-bold text-slate-800 text-xs">Metabolic Trend</h5>
                                        <p className="text-[10px] text-slate-400">Fasting/Random Blood sugar (mg/dL) & Body weight (kg) over time</p>
                                    </div>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                                                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                                                    labelStyle={{ fontSize: 10, fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                                                    itemStyle={{ fontSize: 10 }}
                                                />
                                                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                                                <Line type="monotone" dataKey="sugar" name="Blood Sugar" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                                <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
