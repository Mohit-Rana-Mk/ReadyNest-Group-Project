import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom DivIcon generator to retain the glowing ping effect
const createGlowingIcon = (risk, count, diagnosis) => {
    const scale = Math.min(count * 4, 30); // Cap the scale
    const baseColor = risk === 'High' ? 'red' : 'yellow';
    
    const htmlString = `
        <div class="relative flex items-center justify-center" style="width: 24px; height: 24px; transform: translate(-50%, -50%);">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-${baseColor}-400" style="width: ${scale * 2}px; height: ${scale * 2}px"></span>
            <div class="w-4 h-4 rounded-full shadow-md border-2 border-white bg-${baseColor}-500 z-10"></div>
            <span class="absolute top-6 whitespace-nowrap bg-slate-800/90 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow z-20">
                ${diagnosis} (${count} cases)
            </span>
        </div>
    `;

    return L.divIcon({
        className: 'custom-leaflet-icon',
        html: htmlString,
        iconSize: [0, 0], // Center it perfectly
        iconAnchor: [0, 0], // Anchor at center
    });
};

export function EpidemiologyMap({ outbreakStats, filter, setFilter }) {
    // Map center (India coordinates)
    const mapCenter = [22.9734, 78.6569];
    const mapZoom = 4;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-[#e9ecef] rounded-2xl p-6 shadow-sm flex flex-col h-[550px]">
                <div className="mb-4 flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-slate-800 text-base">Geospatial Outbreak Heatmap</h3>
                        <p className="text-xs text-slate-400">Platform-wide disease tracking based on active prescriptions and clinic coordinates (SRID 4326).</p>
                    </div>
                    <select 
                        value={filter} 
                        onChange={(e) => setFilter(Number(e.target.value))}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 text-gray-700 outline-none focus:border-indigo-500 font-semibold shadow-sm"
                    >
                        <option value={7}>Last 7 Days</option>
                        <option value={30}>Last 30 Days</option>
                        <option value={90}>Last 90 Days</option>
                        <option value={365}>Last 1 Year</option>
                    </select>
                </div>
                
                {/* Interactive Leaflet Map */}
                <div className="flex-1 bg-slate-100 rounded-xl relative overflow-hidden border border-slate-200/50 flex items-center justify-center z-0">
                    <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%', zIndex: 0 }} zoomControl={false}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        />
                        {outbreakStats.locations && outbreakStats.locations.map((loc, idx) => {
                            if (!loc.latitude || !loc.longitude) return null;
                            const customIcon = createGlowingIcon(loc.risk, loc.count, loc.diagnosis);
                            
                            const lat = parseFloat(loc.latitude);
                            const lng = parseFloat(loc.longitude);
                            // Add deterministic jitter so markers at the exact same location don't overlap text
                            const jitterLat = (loc.diagnosis.charCodeAt(0) % 10 - 5) * 0.15;
                            const jitterLng = (loc.diagnosis.charCodeAt(loc.diagnosis.length - 1) % 10 - 5) * 0.15;
                            
                            return (
                                <Marker 
                                    key={`${loc.id}-${idx}`}
                                    position={[lat + jitterLat, lng + jitterLng]}
                                    icon={customIcon}
                                />
                            );
                        })}
                    </MapContainer>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white border border-[#e9ecef] rounded-2xl p-6 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Disease Trends ({filter === 365 ? '1 Year' : `${filter} Days`})
                    </h4>
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
                                        style={{ width: `${Math.min((t.count / filter) * 100, 100)}%` }}
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
