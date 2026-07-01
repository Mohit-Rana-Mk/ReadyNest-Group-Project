import React from 'react';
import { User, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export function PatientQueue({ appointments, selectedAppointment, handleSelectAppointment, dateFilter, setDateFilter }) {
    return (
        <div className="flex flex-col h-full bg-white border-r border-[#e9ecef] w-72 shrink-0">
            <div className="p-4 border-b border-[#e9ecef] bg-slate-50">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-600" />
                        Patient Queue
                    </h3>
                    {setDateFilter && (
                        <select 
                            value={dateFilter || 'today'} 
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="text-xs border border-slate-200 rounded p-1 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                            <option value="today">Today</option>
                            <option value="past_week">Past 7 Days</option>
                            <option value="past_month">Past 30 Days</option>
                            <option value="all">All Time</option>
                        </select>
                    )}
                </div>
                <p className="text-xs text-slate-500 mt-1">{appointments?.length || 0} Patients</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {(!appointments || appointments.length === 0) ? (
                    <div className="p-4 text-center text-slate-500 text-sm mt-4">
                        No appointments found.
                    </div>
                ) : (
                    appointments.map((appt) => {
                    const isSelected = selectedAppointment?.appointment_id === appt.appointment_id;
                    const isCompleted = appt.status === 'Completed';

                    return (
                        <div
                            key={appt.appointment_id}
                            onClick={() => handleSelectAppointment(appt)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                isSelected 
                                    ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                                    : 'bg-white border-[#e9ecef] hover:border-emerald-100 hover:bg-slate-50'
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className={`font-semibold text-sm ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>
                                        {appt.patient_name}
                                    </h4>
                                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                                        <Clock className="w-3 h-3" />
                                        <span>{new Date(appt.appointment_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                </div>
                                {isCompleted ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-amber-500" />
                                )}
                            </div>
                        </div>
                    );
                }))}
            </div>
        </div>
    );
}
