import React, { useState } from 'react';
import { ShieldAlert, X, CalendarPlus, ChevronRight } from 'lucide-react';

export default function PreventiveAlertBanner({ recommendations, onBookNow }) {
    const [dismissed, setDismissed] = useState([]);

    const visible = recommendations.filter(r => !dismissed.includes(r.id));

    if (visible.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
                <ShieldAlert size={18} className="text-amber-500" />
                <h3 className="text-sm font-semibold text-gray-800">Health Alerts</h3>
                <span className="ml-auto text-xs text-gray-400">{visible.length} pending</span>
            </div>

            {visible.map(rec => (
                <div
                    key={rec.id}
                    className="relative bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-4 shadow-sm"
                >
                    {/* Dismiss */}
                    <button
                        onClick={() => setDismissed(prev => [...prev, rec.id])}
                        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={16} />
                    </button>

                    <h4 className="text-sm font-bold text-amber-900 pr-6">{rec.alert_title}</h4>
                    <p className="text-xs text-amber-700/80 mt-1 leading-relaxed">{rec.alert_description}</p>

                    <div className="flex items-center justify-between mt-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                            {rec.target_service}
                        </span>
                        <button 
                            onClick={onBookNow}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-xl transition-colors shadow-sm"
                        >
                            <CalendarPlus size={13} />
                            Book Now
                            <ChevronRight size={13} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
