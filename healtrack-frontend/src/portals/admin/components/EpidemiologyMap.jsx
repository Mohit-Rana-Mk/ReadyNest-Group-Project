import React from 'react';

export function EpidemiologyMap({ outbreakStats }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-[#e9ecef] rounded-2xl p-6 shadow-sm flex flex-col h-[550px]">
                <div className="mb-4">
                    <h3 className="font-bold text-slate-800 text-base">Geospatial Outbreak Heatmap</h3>
                    <p className="text-xs text-slate-400">Platform-wide disease tracking based on active prescriptions and clinic coordinates (SRID 4326).</p>
                </div>
                
                {/* Simulated Map */}
                <div className="flex-1 bg-slate-100 rounded-xl relative overflow-hidden border border-slate-200/50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-slate-50 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    
                    {/* Outbreak Map Coordinates */}
                    {outbreakStats.locations && outbreakStats.locations.map(loc => {
                        const scale = loc.count * 4;
                        return (
                            <div 
                                key={loc.id} 
                                className="absolute flex flex-col items-center"
                                style={{
                                    top: loc.latitude ? `${(loc.latitude % 30) * 12 + 100}px` : '150px',
                                    left: loc.longitude ? `${(loc.longitude % 70) * 4 + 100}px` : '200px'
                                }}
                            >
                                <span className={`animate-ping absolute inline-flex h-${scale} w-${scale} rounded-full opacity-75 ${
                                    loc.risk === 'High' ? 'bg-red-400' : 'bg-yellow-400'
                                }`} style={{ height: `${scale * 2}px`, width: `${scale * 2}px` }}></span>
                                <div className={`w-3.5 h-3.5 rounded-full shadow-md border-2 border-white ${
                                    loc.risk === 'High' ? 'bg-red-500' : 'bg-yellow-500'
                                }`}></div>
                                <span className="mt-1 bg-slate-800/90 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow">
                                    {loc.diagnosis} ({loc.count} cases)
                                </span>
                            </div>
                        );
                    })}

                    <span className="absolute bottom-3 left-3 text-[10px] bg-white border border-slate-200/50 text-slate-500 font-bold px-2 py-1 rounded">
                        🗺️ Mapping India coordinates system (SRID 4326)
                    </span>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white border border-[#e9ecef] rounded-2xl p-6 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Disease Trends (30 Days)</h4>
                    <div className="space-y-4">
                        {outbreakStats.trends && outbreakStats.trends.map((t, idx) => (
                            <div key={idx} className="space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-slate-800">{t.label || t.diagnosis}</span>
                                    <span className="font-semibold text-slate-500">{t.count} cases</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-indigo-700 h-full rounded-full transition-all" 
                                        style={{ width: `${Math.min((t.count / 30) * 100, 100)}%` }}
                                    ></div>
                                </div>
                                <span className="text-[9px] font-bold text-emerald-600 block">{t.change || '+12% this week'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
