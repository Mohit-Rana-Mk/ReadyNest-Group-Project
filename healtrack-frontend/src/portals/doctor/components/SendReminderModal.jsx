import React from 'react';
import { X, Send } from 'lucide-react';

export function SendReminderModal({ showReminderModal, selectedAppointment, onClose, reminderText, setReminderText, handleSendReminder, sendingReminder, reminderResult }) {
    if (!showReminderModal || !selectedAppointment) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Send Reminder</h3>
                        <p className="text-[10px] text-slate-400 font-semibold">Recipient: {selectedAppointment.patient_name} (ID: #{selectedAppointment.patient_id})</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSendReminder}>
                    <div className="p-5 space-y-4">
                        <div>
                            <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Notification Message</label>
                            <textarea 
                                rows="6"
                                required
                                value={reminderText}
                                onChange={(e) => setReminderText(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-slate-300 transition font-medium"
                                placeholder="Type the message..."
                            />
                        </div>

                        {reminderResult.message && (
                            <div className={`p-4 rounded-xl border text-xs font-semibold flex flex-col gap-2 ${
                                reminderResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-800 border-red-100'
                            }`}>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                    <span>{reminderResult.message}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-bold transition"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={sendingReminder}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                        >
                            {sendingReminder ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-3.5 h-3.5" />
                                    Send Reminder
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
