import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

let addToastFunction = () => {};

export function ToastContainer() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        addToastFunction = (message, type = 'info', duration = 4000) => {
            const id = Date.now() + Math.random();
            setToasts(prev => [...prev, { id, message, type }]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        };
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
            {toasts.map(toast => {
                const isError = toast.type === 'error';
                const isSuccess = toast.type === 'success';
                return (
                    <div 
                        key={toast.id} 
                        className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border max-w-sm w-full transform transition-all duration-300 animate-in slide-in-from-right-8 fade-in ${
                            isError ? 'bg-white border-rose-100' : 
                            isSuccess ? 'bg-white border-emerald-100' : 
                            'bg-white border-blue-100'
                        }`}
                    >
                        <div className="mt-0.5 shrink-0">
                            {isError ? <AlertCircle className="w-5 h-5 text-rose-500" /> :
                             isSuccess ? <CheckCircle className="w-5 h-5 text-emerald-500" /> :
                             <Info className="w-5 h-5 text-blue-500" />}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800">{toast.message}</p>
                        </div>
                        <button onClick={() => removeToast(toast.id)} className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

export const toast = {
    success: (msg, dur) => addToastFunction(msg, 'success', dur),
    error: (msg, dur) => addToastFunction(msg, 'error', dur),
    info: (msg, dur) => addToastFunction(msg, 'info', dur)
};
