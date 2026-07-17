import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDestructive = false }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-0">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 fade-in duration-200">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isDestructive ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                {message}
                            </p>
                        </div>
                        <button onClick={onClose} className="shrink-0 p-1 text-slate-400 hover:bg-slate-100 rounded-md transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex justify-end gap-3">
                    <Button 
                        variant="outline"
                        onClick={onClose} 
                        className="bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 shadow-sm px-5 py-2 font-semibold text-xs"
                    >
                        {cancelText}
                    </Button>
                    <Button 
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }} 
                        className={`${isDestructive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white shadow-sm px-5 py-2 font-semibold text-xs border-none`}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}
