import React from 'react';
import { User, Clock, CheckCircle, AlertCircle, CalendarX2 } from 'lucide-react';
import { CustomDropdown } from '../../../components/ui/CustomDropdown';
import EmptyState from '../../../components/ui/EmptyState';

export function PatientQueue({ appointments, selectedAppointment, handleSelectAppointment, dateFilter, setDateFilter }) {
    return (
        <div className="flex flex-col h-full bg-white border-r border-[#e9ecef] w-80 shrink-0">
            <div className="p-4 border-b border-[#e9ecef] bg-slate-50">
                <div className="flex justify-between items-center mb-1 gap-3">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap">
                        <User className="w-4 h-4 text-emerald-600" />
                        Patient Queue
                    </h3>
                    {setDateFilter && (
                        <CustomDropdown
                            value={dateFilter || 'today'}
                            onChange={setDateFilter}
                            className="w-[120px] h-8 shrink-0"
                            options={[
                                { value: "today", label: "Today" },
                                { value: "past_week", label: "Past 7 Days" },
                                { value: "past_month", label: "Past 30 Days" },
                                { value: "all", label: "All Time" }
                            ]}
                        />
                    )}
                </div>
                <p className="text-xs text-slate-500 mt-1">{appointments?.length || 0} Patients</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {(!appointments || appointments.length === 0) ? (
                    <EmptyState 
                        icon={CalendarX2} 
                        title="No Appointments" 
                        description="There are no patients in the queue for this period." 
                        className="mt-8 border-none bg-transparent"
                    />
                ) : (
                    appointments.map((appt) => {
                    const isSelected = selectedAppointment?.appointment_id === appt.appointment_id;
                    const isCompleted = appt.status === 'Completed';
                    const isCancelled = appt.status === 'Canceled' || appt.status === 'Cancelled';

                    return (
                        <div
                            key={appt.appointment_id}
                            onClick={() => handleSelectAppointment(appt)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                isSelected 
                                    ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                                    : isCancelled
                                    ? 'bg-rose-50/30 border-rose-100/50 hover:bg-rose-50/50 opacity-75'
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
                                    <CheckCircle className="w-4 h-4 text-emerald-500 animate-in zoom-in duration-200" />
                                ) : isCancelled ? (
                                    <span className="px-2 py-0.5 text-[8px] font-black bg-rose-50 border border-rose-100 text-rose-600 rounded-md uppercase tracking-wider animate-in zoom-in duration-200">
                                        Cancelled
                                    </span>
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-amber-500 animate-pulse" />
                                )}
                            </div>
                        </div>
                    );
                }))}
            </div>
        </div>
    );
}
