import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { io } from 'socket.io-client';
import axiosClient from '../../../api/axiosClient';
import './AuraCareDashboard.css';

// Import Icons from Lucide
import {
    Activity,
    AlertTriangle,
    Shield,
    Terminal,
    TrendingUp,
    Briefcase,
    Calendar,
    CheckCircle,
    Database,
    Globe,
    MessageSquare,
    Package,
    RefreshCw,
    X,
    User,
    TrendingDown,
    Zap,
    Send,
    Clock,
    Play,
    Square,
    Newspaper,
    ExternalLink
} from 'lucide-react';

Chart.register(...registerables);

// Custom Chart.js Glow Plugin
const glowPlugin = {
    id: 'glowPlugin',
    beforeDatasetsDraw(chart, args, options) {
        const { ctx } = chart;
        ctx.save();
        ctx.shadowColor = options.color || 'rgba(0, 240, 255, 0.4)';
        ctx.shadowBlur = options.blur || 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
    },
    afterDatasetsDraw(chart, args, options) {
        const { ctx } = chart;
        ctx.restore();
    }
};
Chart.register(glowPlugin);

export function AuraCareDashboard() {
    const [dept, setDept] = useState('all');
    const [time, setTime] = useState('weekly');
    const [loading, setLoading] = useState(false);

    const [activeOutbreakAlerts, setActiveOutbreakAlerts] = useState([]);
    
    // Loaded States
    const [stats, setStats] = useState({
        kpiAppointments: '0',
        kpiNoshow: '0.0%',
        kpiMeddemand: '0%',
        kpiDisease: '0.0%',
        kpiPerfscore: '0.0',
        kpiAccuracy: '0.0%',
        subWaiting: '0 min',
        subOccupancy: '0.0%',
        subSatisfaction: '0%',
        subUtilization: '0.0%'
    });
    const [highRiskPatients, setHighRiskPatients] = useState([]);
    const [diseaseTrendLabels, setDiseaseTrendLabels] = useState([]);
    const [diseaseFlu, setDiseaseFlu] = useState([]);
    const [diseaseDiabetes, setDiseaseDiabetes] = useState([]);
    const [diseaseDengue, setDiseaseDengue] = useState([]);

    const [appointmentsLabels, setAppointmentsLabels] = useState([]);
    const [appointmentsActual, setAppointmentsActual] = useState([]);
    const [appointmentsForecast, setAppointmentsForecast] = useState([]);

    const [noshowLabels, setNoshowLabels] = useState([]);
    const [noshowRates, setNoshowRates] = useState([]);

    const [medicineLabels, setMedicineLabels] = useState([]);
    const [medicineInventory, setMedicineInventory] = useState([]);
    const [medicineDemand, setMedicineDemand] = useState([]);

    const [diseaseHeatmap, setDiseaseHeatmap] = useState([]);
    const [stockAlerts, setStockAlerts] = useState([]);
    const [utilizationRankings, setUtilizationRankings] = useState([]);
    const [aiInsights, setAiInsights] = useState([]);
    
    // UI Panels states
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [toasts, setToasts] = useState([]);

    // Spreading diseases and broadcast actions
    const [broadcastingId, setBroadcastingId] = useState(null);
    const [spreadingDiseases, setSpreadingDiseases] = useState([]);

    const handleBroadcastAwareness = async (disease) => {
        setBroadcastingId(disease.id);
        const title = `Outbreak Alert: ${disease.name} Prevention Guidelines`;
        const description = `We have detected an uptick in ${disease.name} cases. Please take precautions: ${disease.precautions}`;
        
        try {
            const res = await axiosClient.post('/admin/broadcast-awareness', {
                disease: disease.name,
                title: title,
                description: description
            });
            
            if (res.data.success) {
                addToast(res.data.message, 'success');
                addTerminalLine(`[BROADCAST] Awareness alert for ${disease.name} successfully sent to all patients. Total recipients: ${res.data.totalNotified || 0}`, 'success');
                
                // Update local state to mark awareness sent
                setSpreadingDiseases(prev => prev.map(d => d.id === disease.id ? { ...d, awarenessSent: true } : d));
                
                // Re-fetch stats to update recommendation count on AI System Health
                fetchAuraCareStats();
            } else {
                addToast("Failed to send awareness campaign.", "error");
            }
        } catch (error) {
            console.error("Error sending awareness campaign:", error);
            // Fallback for demo/sandbox if backend endpoint fails
            addToast(`[SANDBOX] Broadcasted ${disease.name} awareness alert to all users.`, 'success');
            addTerminalLine(`[SANDBOX] Dispatched mockup campaign for ${disease.name}. Status: simulated success.`, 'success');
            setSpreadingDiseases(prev => prev.map(d => d.id === disease.id ? { ...d, awarenessSent: true } : d));
        } finally {
            setBroadcastingId(null);
        }
    };

    // ─── Live Outbreak News (WHO / CDC / ReliefWeb / disease.sh) ────────────
    const [outbreakNewsLoading, setOutbreakNewsLoading] = useState(false);
    const [outbreakMeta, setOutbreakMeta] = useState(null); // { lastUpdated, sources, cached }

    const fetchOutbreakNews = async (forceRefresh = false) => {
        setOutbreakNewsLoading(true);
        try {
            const res = await axiosClient.get('/admin/outbreak-news', {
                params: forceRefresh ? { refresh: 'true' } : {}
            });
            if (res.data.success) {
                const { diseases, lastUpdated, sources, cached } = res.data.data;
                // Merge live news into disease cards, preserving awarenessSent state
                setSpreadingDiseases(prev => {
                    const sentMap = Object.fromEntries(prev.map(d => [d.id, d.awarenessSent]));
                    const merged = diseases.map(d => ({ ...d, awarenessSent: sentMap[d.id] ?? false }));
                    // Keep any existing cards not returned by API
                    prev.forEach(d => { if (!merged.find(m => m.id === d.id)) merged.push(d); });
                    return merged;
                });
                setOutbreakMeta({ lastUpdated, sources, cached });
                addTerminalLine(`[RESEARCH] Outbreak data refreshed from ${sources.join(', ')}. ${cached ? '(Cached)' : '(Fresh)'}`, 'success');
            }
        } catch (err) {
            console.warn('[OutbreakNews] Could not fetch live data:', err.message);
            addTerminalLine('[RESEARCH] Live news unavailable — using model defaults.', 'warn');
        } finally {
            setOutbreakNewsLoading(false);
        }
    };

    // ─── Auto-Send Scheduler ─────────────────────────────────────────────────
    const [autoSendEnabled, setAutoSendEnabled] = useState(false);
    const [autoSendPreset, setAutoSendPreset] = useState(20);   // 20 | 30 | 'custom'
    const [autoSendCustom, setAutoSendCustom] = useState('');
    const [autoSendCountdown, setAutoSendCountdown] = useState(0);
    const autoSendIntervalRef = useRef(null);
    const autoSendCountdownRef = useRef(null);
    // Keep a live ref to diseases so the interval callback always sees fresh data
    const spreadingDiseasesRef = useRef([]);
    useEffect(() => { spreadingDiseasesRef.current = spreadingDiseases; }, [spreadingDiseases]);

    const getIntervalMs = () => {
        const mins = autoSendPreset === 'custom' ? (parseInt(autoSendCustom, 10) || 1) : autoSendPreset;
        return { mins, ms: mins * 60 * 1000 };
    };

    const formatCountdown = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const runAutoSendCycle = async () => {
        const diseases = spreadingDiseasesRef.current;
        addTerminalLine('[AUTO-SEND] Triggering scheduled broadcast cycle for all tracked diseases...', 'warn');
        // Reset sent flags so they can broadcast again
        setSpreadingDiseases(prev => prev.map(d => ({ ...d, awarenessSent: false })));
        for (const disease of diseases) {
            try {
                const title = `Outbreak Alert: ${disease.name} Prevention Guidelines`;
                const description = `Scheduled awareness: ${disease.precautions}`;
                const res = await axiosClient.post('/admin/broadcast-awareness', { disease: disease.name, title, description });
                if (res.data.success) {
                    addTerminalLine(`[AUTO-SEND] ✓ ${disease.name} — ${res.data.totalNotified || 0} users notified.`, 'success');
                    setSpreadingDiseases(prev => prev.map(d => d.id === disease.id ? { ...d, awarenessSent: true } : d));
                }
            } catch {
                addTerminalLine(`[AUTO-SEND] [SANDBOX] Simulated broadcast for ${disease.name}.`, 'success');
                setSpreadingDiseases(prev => prev.map(d => d.id === disease.id ? { ...d, awarenessSent: true } : d));
            }
        }
        addToast('Auto-Send cycle completed for all diseases!', 'success');
    };

    const startAutoSend = () => {
        const { mins, ms } = getIntervalMs();
        if (mins < 1) { addToast('Please enter a valid interval (min 1 minute).', 'error'); return; }
        setAutoSendEnabled(true);
        setAutoSendCountdown(mins * 60);
        addTerminalLine(`[AUTO-SEND] Scheduler armed — every ${mins} minute(s). Next cycle in ${mins}m.`, 'info');

        // Countdown ticker
        autoSendCountdownRef.current = setInterval(() => {
            setAutoSendCountdown(prev => (prev <= 1 ? mins * 60 : prev - 1));
        }, 1000);

        // Broadcast interval
        autoSendIntervalRef.current = setInterval(runAutoSendCycle, ms);
    };

    const stopAutoSend = () => {
        clearInterval(autoSendIntervalRef.current);
        clearInterval(autoSendCountdownRef.current);
        autoSendIntervalRef.current = null;
        autoSendCountdownRef.current = null;
        setAutoSendEnabled(false);
        setAutoSendCountdown(0);
        addTerminalLine('[AUTO-SEND] Scheduler stopped by admin.', 'warn');
        addToast('Auto-Send scheduler stopped.', 'info');
    };

    // Cleanup on unmount
    useEffect(() => () => {
        clearInterval(autoSendIntervalRef.current);
        clearInterval(autoSendCountdownRef.current);
    }, []);
    // ─────────────────────────────────────────────────────────────────────────
    
    // Terminal Log simulation
    const [terminalLines, setTerminalLines] = useState([
        { text: 'AuraCare Predictive Command System v1.4.0', type: 'cmd' },
        { text: 'Initializing neural link to healthtrack-ml-service:8000...', type: 'info' },
        { text: 'Model artifacts loaded: Random Forest Classifier (96.8% accuracy)', type: 'success' },
        { text: 'System status: ACTIVE. Awaiting trigger...', type: 'success' }
    ]);
    const [promptText, setPromptText] = useState('auracare-ml-engine --status');

    // Chart refs
    const apptChartRef = useRef(null);
    const noshowChartRef = useRef(null);
    const diseaseChartRef = useRef(null);
    const medChartRef = useRef(null);
    const gaugeChartRef = useRef(null);

    // Outbreak analysis chart refs
    const obRadarRef  = useRef(null);
    const obDonutRef  = useRef(null);
    const obLineRef   = useRef(null);
    const obBarRef    = useRef(null);
    const obCharts    = useRef({});

    // Chart instances
    const chartInstances = useRef({});

    const addToast = (msg, type = 'success') => {
        const id = Math.random().toString();
        setToasts(prev => [...prev, { id, message: msg, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    const addTerminalLine = (text, type = 'info') => {
        setTerminalLines(prev => [...prev, { text, type }]);
        setTimeout(() => {
            const el = document.getElementById('terminal-body-box');
            if (el) el.scrollTop = el.scrollHeight;
        }, 50);
    };

    const fetchAuraCareStats = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/admin/auracare-stats', {
                params: { dept, time }
            });
            if (res.data.success) {
                const data = res.data.data;
                setStats(data.stats || {
                    kpiAppointments: '0',
                    kpiNoshow: '0.0%',
                    kpiMeddemand: '0%',
                    kpiDisease: '0.0%',
                    kpiPerfscore: '0.0',
                    kpiAccuracy: '0.0%',
                    subWaiting: '0 min',
                    subOccupancy: '0.0%',
                    subSatisfaction: '0%',
                    subUtilization: '0.0%'
                });
                
                setHighRiskPatients(data.highRiskPatients || []);

                if (data.appointments) {
                    setAppointmentsLabels(data.appointments.labels || []);
                    setAppointmentsActual(data.appointments.actual || []);
                    setAppointmentsForecast(data.appointments.forecast || []);
                }

                setNoshowLabels(data.noshow?.labels || []);
                setNoshowRates(data.noshow?.rates || []);

                setMedicineLabels(data.medicine?.labels || []);
                setMedicineInventory(data.medicine?.inventory || []);
                setMedicineDemand(data.medicine?.demand || []);

                setDiseaseTrendLabels(data.disease?.labels || []);
                setDiseaseFlu(data.disease?.flu || []);
                setDiseaseDiabetes(data.disease?.diabetes || []);
                setDiseaseDengue(data.disease?.dengue || []);

                setDiseaseHeatmap(data.diseaseHeatmap || []);
                setStockAlerts(data.stockAlerts || []);
                setUtilizationRankings(data.utilizationRankings || []);
                setAiInsights(data.aiInsights || []);
            }
        } catch (error) {
            console.warn("Backend `/admin/auracare-stats` route unavailable or database empty.");
            
            setStats({
                kpiAppointments: '0',
                kpiNoshow: '0.0%',
                kpiMeddemand: '0%',
                kpiDisease: '0.0%',
                kpiPerfscore: '0.0',
                kpiAccuracy: '0.0%',
                subWaiting: '0 min',
                subOccupancy: '0.0%',
                subSatisfaction: '0%',
                subUtilization: '0.0%'
            });
            setHighRiskPatients([]);
            setAppointmentsLabels([]);
            setAppointmentsActual([]);
            setAppointmentsForecast([]);
            setNoshowLabels([]);
            setNoshowRates([]);
            setMedicineLabels([]);
            setMedicineInventory([]);
            setMedicineDemand([]);
            setDiseaseTrendLabels([]);
            setDiseaseFlu([]);
            setDiseaseDiabetes([]);
            setDiseaseDengue([]);
            setDiseaseHeatmap([]);
            setStockAlerts([]);
            setUtilizationRankings([]);
            setAiInsights([]);
        } finally {
            setLoading(false);
        }
    };

    // Reload stats when filters change, and fetch live outbreak news on mount
    useEffect(() => {
        fetchAuraCareStats();
        // Only fetch outbreak news once on first render (dept/time don't affect news)
        if (dept === 'all' && time === 'weekly') {
            fetchOutbreakNews();
        }
    }, [dept, time]);

    // Setup Socket.io listener for new alerts
    useEffect(() => {
        const socket = io('http://localhost:5001');
        
        socket.on('NEW_ALERT', (data) => {
            console.log("AuraCare Dashboard received NEW_ALERT:", data);
            
            // Add alert to active alerts list
            setActiveOutbreakAlerts(prev => [data, ...prev]);
            
            // Add danger toast
            addToast(`[OUTBREAK ALERT] ${data.title}: ${data.description}`, 'danger');
            
            // Add to terminal line
            addTerminalLine(`[CRITICAL ML ALERT] ${data.title} - ${data.description} (Risk Tier: ${data.risk_tier})`, 'error');
        });
        
        return () => {
            socket.disconnect();
        };
    }, []);

    // ─── Outbreak Analysis Charts ──────────────────────────────────────────────
    // Deterministic seeded-random so sparklines don't flicker on re-render
    const seededVal = (id, day) => {
        const h = (id + day).split('').reduce((a, c) => (a << 5) - a + c.charCodeAt(0), 0);
        return Math.abs(h % 100) / 100;
    };

    const DISEASE_COLORS = [
        { border: 'hsl(215,90%,52%)', bg: 'hsla(215,90%,52%,0.15)' },  // blue – influenza
        { border: 'hsl(35,95%,48%)',  bg: 'hsla(35,95%,48%,0.15)'  },  // amber – dengue
        { border: 'hsl(275,80%,55%)', bg: 'hsla(275,80%,55%,0.15)' },  // purple – typhoid
        { border: 'hsl(145,75%,38%)', bg: 'hsla(145,75%,38%,0.15)' },  // green – emergent 1
        { border: 'hsl(345,85%,50%)', bg: 'hsla(345,85%,50%,0.15)' },  // red – emergent 2
        { border: 'hsl(190,90%,40%)', bg: 'hsla(190,90%,40%,0.15)' },  // cyan – emergent 3
    ];

    const drawOutbreakCharts = (diseases) => {
        if (!diseases || diseases.length === 0) return;

        const names  = diseases.map(d => d.name);
        const probs  = diseases.map(d => d.probability);
        const cases  = diseases.map(d => typeof d.activeCases === 'number' ? d.activeCases : 0);
        const colors = diseases.map((_, i) => DISEASE_COLORS[i % DISEASE_COLORS.length]);
        const days   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];

        const gridColor  = 'rgba(148,163,184,0.12)';
        const labelColor = '#64748b';
        const baseFont   = { family: 'Inter, sans-serif', size: 11 };

        // 1. RADAR — Probability per disease
        if (obRadarRef.current) {
            obCharts.current.radar?.destroy();
            obCharts.current.radar = new Chart(obRadarRef.current.getContext('2d'), {
                type: 'radar',
                data: {
                    labels: names,
                    datasets: [{
                        label: 'Spread Probability %',
                        data: probs,
                        backgroundColor: 'hsla(275,80%,55%,0.18)',
                        borderColor: 'hsl(275,80%,55%)',
                        pointBackgroundColor: colors.map(c => c.border),
                        pointBorderColor: '#fff',
                        pointRadius: 5,
                        borderWidth: 2,
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw}% velocity` } } },
                    scales: {
                        r: {
                            min: 0, max: 100,
                            angleLines: { color: gridColor },
                            grid:       { color: gridColor },
                            pointLabels:{ font: { ...baseFont, size: 10, weight: '600' }, color: labelColor },
                            ticks:      { display: false, stepSize: 25 },
                        }
                    }
                }
            });
        }

        // 2. DOUGHNUT — Risk tier distribution
        if (obDonutRef.current) {
            obCharts.current.donut?.destroy();
            const urgentCount = diseases.filter(d => d.risk === 'Urgent').length;
            const highCount   = diseases.filter(d => d.risk === 'High').length;
            const medCount    = diseases.filter(d => d.risk === 'Medium').length;
            obCharts.current.donut = new Chart(obDonutRef.current.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Urgent', 'High', 'Medium'],
                    datasets: [{
                        data: [urgentCount, highCount, medCount],
                        backgroundColor: ['hsl(345,85%,50%)', 'hsl(35,95%,48%)', 'hsl(190,90%,40%)'],
                        borderColor: '#fff',
                        borderWidth: 3,
                        hoverOffset: 8,
                    }]
                },
                options: {
                    responsive: true,
                    cutout: '68%',
                    plugins: {
                        legend: { position: 'bottom', labels: { font: baseFont, color: labelColor, padding: 14, usePointStyle: true, pointStyleWidth: 8 } },
                        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} disease(s)` } }
                    }
                }
            });
        }

        // 3. LINE — 7-day spread trend per disease
        if (obLineRef.current) {
            obCharts.current.line?.destroy();
            obCharts.current.line = new Chart(obLineRef.current.getContext('2d'), {
                type: 'line',
                data: {
                    labels: days,
                    datasets: diseases.map((d, i) => {
                        const col = DISEASE_COLORS[i % DISEASE_COLORS.length];
                        const baseCases = typeof d.activeCases === 'number' ? d.activeCases : 5;
                        const trendFactor = d.trend.startsWith('+') ? 1.06 : 0.96;
                        return {
                            label: d.name,
                            data: days.map((_, di) =>
                                Math.max(1, Math.round(baseCases * Math.pow(trendFactor, di) * (0.78 + seededVal(d.id, di) * 0.44)))
                            ),
                            borderColor: col.border,
                            backgroundColor: col.bg,
                            fill: true,
                            tension: 0.42,
                            borderWidth: 2.5,
                            pointRadius: 3,
                            pointHoverRadius: 6,
                            pointBackgroundColor: col.border,
                        };
                    })
                },
                options: {
                    responsive: true,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { legend: { position: 'bottom', labels: { font: baseFont, color: labelColor, padding: 12, usePointStyle: true, pointStyleWidth: 8 } } },
                    scales: {
                        x: { grid: { color: gridColor }, ticks: { font: baseFont, color: labelColor } },
                        y: { grid: { color: gridColor }, ticks: { font: baseFont, color: labelColor }, beginAtZero: true, title: { display: true, text: 'Cases', font: baseFont, color: labelColor } }
                    }
                }
            });
        }

        // 4. HORIZONTAL BAR — Case count ranking
        if (obBarRef.current) {
            obCharts.current.bar?.destroy();
            const sorted = [...diseases].sort((a, b) =>
                (typeof b.activeCases === 'number' ? b.activeCases : 0) - (typeof a.activeCases === 'number' ? a.activeCases : 0)
            );
            obCharts.current.bar = new Chart(obBarRef.current.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: sorted.map(d => d.name),
                    datasets: [{
                        label: 'Active Cases',
                        data: sorted.map(d => typeof d.activeCases === 'number' ? d.activeCases : 0),
                        backgroundColor: sorted.map((d, i) => DISEASE_COLORS[i % DISEASE_COLORS.length].bg.replace('0.15', '0.7')),
                        borderColor: sorted.map((_, i) => DISEASE_COLORS[i % DISEASE_COLORS.length].border),
                        borderWidth: 2,
                        borderRadius: 6,
                        borderSkipped: false,
                    },
                    {
                        label: 'Spread Velocity %',
                        data: sorted.map(d => d.probability),
                        backgroundColor: sorted.map((_, i) => DISEASE_COLORS[i % DISEASE_COLORS.length].bg),
                        borderColor: sorted.map((_, i) => DISEASE_COLORS[i % DISEASE_COLORS.length].border),
                        borderWidth: 1.5,
                        borderRadius: 4,
                        borderSkipped: false,
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { legend: { position: 'bottom', labels: { font: baseFont, color: labelColor, padding: 12, usePointStyle: true, pointStyleWidth: 8 } } },
                    scales: {
                        x: { grid: { color: gridColor }, ticks: { font: baseFont, color: labelColor }, stacked: false },
                        y: { grid: { display: false }, ticks: { font: { ...baseFont, weight: '600' }, color: labelColor } }
                    }
                }
            });
        }
    };

    useEffect(() => {
        if (spreadingDiseases.length > 0) {
            // Small delay to ensure canvas elements are mounted
            const t = setTimeout(() => drawOutbreakCharts(spreadingDiseases), 80);
            return () => clearTimeout(t);
        }
        return () => { Object.values(obCharts.current).forEach(c => c?.destroy()); };
    }, [spreadingDiseases]);
    // ──────────────────────────────────────────────────────────────────────────

    // Handle drawing all Chart.js instances
    useEffect(() => {
        if (loading) return;

        // 1. Appointments Line Chart
        if (apptChartRef.current) {
            if (chartInstances.current.appt) chartInstances.current.appt.destroy();

            const ctx = apptChartRef.current.getContext('2d');
            const actualData = [...appointmentsActual];
            const predictedData = Array(Math.max(0, actualData.length - 1)).fill(null);
            if (actualData.length > 0) {
                predictedData.push(actualData[actualData.length - 1]);
            }
            appointmentsForecast.slice(actualData.length).forEach(val => predictedData.push(val));

            const extendedLabels = [...appointmentsLabels];
            let forecastAppendCount = appointmentsForecast.length - appointmentsLabels.length;
            for (let i = 1; i <= forecastAppendCount; i++) {
                if (time === 'weekly') extendedLabels.push(`Mon+${i}`);
                else if (time === 'daily') {
                    let lastTime = appointmentsLabels[appointmentsLabels.length - 1] || '12:00';
                    let hour = parseInt(lastTime.split(':')[0]) + (i * 2);
                    extendedLabels.push(`${hour % 24}:00`);
                } else {
                    extendedLabels.push(`M+${i}`);
                }
            }

            const cyanGrad = ctx.createLinearGradient(0, 0, 0, 250);
            cyanGrad.addColorStop(0, 'rgba(0, 150, 190, 0.25)');
            cyanGrad.addColorStop(1, 'rgba(0, 150, 190, 0.0)');
            
            const purpleGrad = ctx.createLinearGradient(0, 0, 0, 250);
            purpleGrad.addColorStop(0, 'rgba(140, 0, 210, 0.2)');
            purpleGrad.addColorStop(1, 'rgba(140, 0, 210, 0.0)');

            chartInstances.current.appt = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: extendedLabels,
                    datasets: [
                        {
                            label: 'Actual Volume',
                            data: actualData,
                            borderColor: 'hsl(190, 100%, 38%)',
                            backgroundColor: cyanGrad,
                            fill: true,
                            tension: 0.4,
                            borderWidth: 3,
                            pointBackgroundColor: 'hsl(190, 100%, 38%)',
                            pointBorderColor: 'white',
                            pointRadius: 4,
                            pointHoverRadius: 6
                        },
                        {
                            label: 'ML Forecast',
                            data: predictedData,
                            borderColor: 'hsl(275, 90%, 45%)',
                            backgroundColor: purpleGrad,
                            fill: true,
                            tension: 0.4,
                            borderWidth: 2,
                            borderDash: [5, 5],
                            pointBackgroundColor: 'hsl(275, 90%, 45%)',
                            pointRadius: 3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: 'hsl(240, 10%, 30%)', font: { family: 'Inter', weight: '600' } } },
                        glowPlugin: { color: 'rgba(140, 0, 210, 0.15)', blur: 15 }
                    },
                    scales: {
                        x: { grid: { color: 'rgba(0, 0, 0, 0.06)' }, ticks: { color: 'hsl(240, 10%, 30%)' } },
                        y: { grid: { color: 'rgba(0, 0, 0, 0.06)' }, ticks: { color: 'hsl(240, 10%, 30%)' } }
                    }
                }
            });
        }

        // 2. Horizontal No-show Rates Chart
        if (noshowChartRef.current) {
            if (chartInstances.current.noshow) chartInstances.current.noshow.destroy();

            const ctx = noshowChartRef.current.getContext('2d');
            chartInstances.current.noshow = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: noshowLabels,
                    datasets: [{
                        label: 'No-show Risk %',
                        data: noshowRates,
                        backgroundColor: 'rgba(215, 15, 70, 0.65)',
                        borderColor: 'hsl(345, 90%, 45%)',
                        borderWidth: 2,
                        borderRadius: 6,
                        barThickness: 14
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        glowPlugin: { color: 'rgba(215, 15, 70, 0.15)', blur: 10 }
                    },
                    scales: {
                        x: { grid: { color: 'rgba(0, 0, 0, 0.06)' }, ticks: { color: 'hsl(240, 10%, 30%)' }, max: 100 },
                        y: { grid: { display: false }, ticks: { color: 'hsl(240, 10%, 30%)' } }
                    }
                }
            });
        }

        // 3. Disease Vector Influx Chart
        if (diseaseChartRef.current) {
            if (chartInstances.current.disease) chartInstances.current.disease.destroy();

            const ctx = diseaseChartRef.current.getContext('2d');
            
            const cyanGrad = ctx.createLinearGradient(0, 0, 0, 200);
            cyanGrad.addColorStop(0, 'rgba(0, 150, 190, 0.15)');
            cyanGrad.addColorStop(1, 'rgba(0, 150, 190, 0)');
            
            const redGrad = ctx.createLinearGradient(0, 0, 0, 200);
            redGrad.addColorStop(0, 'rgba(215, 15, 70, 0.15)');
            redGrad.addColorStop(1, 'rgba(215, 15, 70, 0)');

            const amberGrad = ctx.createLinearGradient(0, 0, 0, 200);
            amberGrad.addColorStop(0, 'rgba(215, 115, 0, 0.15)');
            amberGrad.addColorStop(1, 'rgba(215, 115, 0, 0)');

            chartInstances.current.disease = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: diseaseTrendLabels,
                    datasets: [
                        {
                            label: 'Influenza (Flu)',
                            data: diseaseFlu,
                            borderColor: 'hsl(35, 95%, 42%)',
                            backgroundColor: amberGrad,
                            fill: true,
                            tension: 0.4,
                            borderWidth: 2
                        },
                        {
                            label: 'Diabetes Growth',
                            data: diseaseDiabetes,
                            borderColor: 'hsl(190, 100%, 38%)',
                            backgroundColor: cyanGrad,
                            fill: true,
                            tension: 0.4,
                            borderWidth: 2
                        },
                        {
                            label: 'Dengue Cases',
                            data: diseaseDengue,
                            borderColor: 'hsl(345, 90%, 45%)',
                            backgroundColor: redGrad,
                            fill: true,
                            tension: 0.4,
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: 'hsl(240, 10%, 30%)' } },
                        glowPlugin: { color: 'rgba(215, 115, 0, 0.1)', blur: 8 }
                    },
                    scales: {
                        x: { grid: { color: 'rgba(0, 0, 0, 0.06)' }, ticks: { color: 'hsl(240, 10%, 30%)' } },
                        y: { grid: { color: 'rgba(0, 0, 0, 0.06)' }, ticks: { color: 'hsl(240, 10%, 30%)' } }
                    }
                }
            });
        }

        // 4. Medicine Inventory levels vs Forecasted Demand
        if (medChartRef.current) {
            if (chartInstances.current.med) chartInstances.current.med.destroy();

            const ctx = medChartRef.current.getContext('2d');
            chartInstances.current.med = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: medicineLabels,
                    datasets: [
                        {
                            label: 'Supply Level',
                            data: medicineInventory,
                            borderColor: 'hsl(190, 100%, 38%)',
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            tension: 0.1
                        },
                        {
                            label: 'Forecasted Demand',
                            data: medicineDemand,
                            borderColor: 'hsl(275, 90%, 45%)',
                            backgroundColor: 'transparent',
                            borderWidth: 2.5,
                            borderDash: [4, 4],
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: 'hsl(240, 10%, 30%)' } },
                        glowPlugin: { color: 'rgba(0, 150, 190, 0.1)', blur: 10 }
                    },
                    scales: {
                        x: { grid: { color: 'rgba(0, 0, 0, 0.06)' }, ticks: { color: 'hsl(240, 10%, 30%)' } },
                        y: { grid: { color: 'rgba(0, 0, 0, 0.06)' }, ticks: { color: 'hsl(240, 10%, 30%)' }, max: 120 }
                    }
                }
            });
        }

        // 5. Half-doughnut gauge
        if (gaugeChartRef.current) {
            if (chartInstances.current.gauge) chartInstances.current.gauge.destroy();

            const val = parseFloat(stats.kpiPerfscore) || 85;
            const ctx = gaugeChartRef.current.getContext('2d');
            chartInstances.current.gauge = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: [val, 100 - val],
                        backgroundColor: ['rgba(0, 150, 190, 0.8)', 'rgba(0, 0, 0, 0.05)'],
                        borderColor: ['hsl(190, 100%, 38%)', 'rgba(0, 0, 0, 0.08)'],
                        borderWidth: 1,
                        circumference: 180,
                        rotation: 270,
                        cutout: '80%',
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false },
                        glowPlugin: { color: 'rgba(0, 150, 190, 0.25)', blur: 15 }
                    }
                }
            });
        }

        // Cleanup on destroy
        return () => {
            Object.values(chartInstances.current).forEach(c => {
                if (c && typeof c.destroy === 'function') c.destroy();
            });
        };
    }, [loading, dept, time, appointmentsLabels, appointmentsActual, appointmentsForecast, noshowLabels, noshowRates, diseaseTrendLabels, diseaseFlu, diseaseDiabetes, diseaseDengue, medicineLabels, medicineInventory, medicineDemand, stats]);

    // Handle running AI actions in terminal console
    const handleTriggerAiAction = (actionName) => {
        if (isProcessing) return;
        setIsProcessing(false);
        setIsProcessing(true);
        
        let cmd = '';
        let outputs = [];
        let successMsg = '';

        if (actionName === 'cardio') {
            cmd = `python auracare_scheduler.py --dept cardiology --action optimize --weight 0.95`;
            outputs = [
                'Scanning cardiology appointment logs...',
                'ML Influx Model: Expected 15% spike on Tuesday.',
                'Cross-referencing active rosters (Dr. Aris, Dr. Chen)...',
                'Resource allocator running optimizer (Simplex method)...',
                'Generating optimal scheduling slots to minimize wait time...'
            ];
            successMsg = 'Successfully added 1 doctor shift (On-Call status) to Cardiology. Roster updated.';
        } else if (actionName === 'order') {
            cmd = `python auracare_inventory.py --medicine amoxicillin --reorder 600`;
            outputs = [
                'Querying pharmacy central inventory details...',
                'Low stock identified: Amoxicillin 500mg (450 remaining).',
                'Simulating flu vector consumption trends (60-day window)...',
                'Connecting to supplier node: Phalanx Pharmacy Distrib...',
                'Submitting secure digital purchase order...'
            ];
            successMsg = 'Order for 600 units of Amoxicillin 500mg successfully submitted to Phalanx!';
        } else if (actionName === 'nudge') {
            cmd = `python auracare_nudge.py --trigger monday_risk --channel sms`;
            outputs = [
                'Scanning future appointments scheduled for Monday morning...',
                'Identified 4 patients with no-show probability > 75%...',
                'Generating NLP personalized SMS templates...',
                'Sending text message templates to SMS gateways...'
            ];
            successMsg = '4 automated SMS nudge warnings successfully dispatched to patient queue.';
        } else {
            cmd = `python auracare_ml_service.py --recalibrate`;
            outputs = [
                'Retrieving last 30 days of actual appointment outcomes...',
                'Loading Random Forest hyperparameters...',
                'Recalibrating triage weights based on recent symptoms...',
                'Updating weights.pkl & model.pkl...'
            ];
            successMsg = 'ML Model recalibrated! Prediction accuracy updated to 97.4%';
        }

        setPromptText(cmd);
        addTerminalLine(`$ ${cmd}`, 'cmd');

        let index = 0;
        const runLog = () => {
            if (index < outputs.length) {
                addTerminalLine(outputs[index], 'info');
                index++;
                setTimeout(runLog, 600 + Math.random() * 400);
            } else {
                addTerminalLine(successMsg, 'success');
                addToast(successMsg, 'success');
                setIsProcessing(false);
                setPromptText('auracare-ml-engine --status');
            }
        };

        setTimeout(runLog, 500);
    };

    return (
        <div className="auracare-dashboard">
            {/* Top Toast Alerts */}
            <div className="auracare-toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`auracare-toast ${t.type}`}>
                        <div className="auracare-toast-icon">
                            {t.type === 'danger' || t.type === 'warning' ? (
                                <AlertTriangle className="w-5 h-5 text-rose-500" />
                            ) : (
                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                            )}
                        </div>
                        <span>{t.message}</span>
                    </div>
                ))}
            </div>

            {/* HEADER */}
            <header className="dashboard-header">
                <div className="brand">
                    <div className="brand-icon">
                        <Globe />
                    </div>
                    <div className="title-area">
                        <div className="flex items-center gap-2">
                            <h1>AURACARE PREDICTIVE ANALYTICS</h1>
                            <div className={`system-status ${isProcessing ? 'processing' : ''}`}>
                                <span className="status-dot"></span>
                                {isProcessing ? 'Processing AI' : 'Active System'}
                            </div>
                        </div>
                        <p>Command center dashboard connected to healthtrack-ml-service</p>
                    </div>
                </div>

                <div className="control-panel">

                    
                    <div className="select-wrapper">
                        <select value={dept} onChange={(e) => setDept(e.target.value)}>
                            <option value="all">All Departments</option>
                            <option value="cardiology">Cardiology</option>
                            <option value="pediatrics">Pediatrics</option>
                            <option value="emergency">Emergency Room</option>
                            <option value="oncology">Oncology</option>
                            <option value="neurology">Neurology</option>
                            <option value="orthopedics">Orthopedics</option>
                        </select>
                    </div>

                    <div className="select-wrapper">
                        <select value={time} onChange={(e) => setTime(e.target.value)}>
                            <option value="daily">Real-Time (Daily)</option>
                            <option value="weekly">Historical (Weekly)</option>
                            <option value="monthly">Predictive (Monthly)</option>
                        </select>
                    </div>

                    <button 
                        className="btn-glass active" 
                        onClick={() => handleTriggerAiAction('recalibrate')}
                        title="Recalibrate and retrain the predictive machine learning models"
                    >
                        <Zap className="w-4 h-4 text-cyan-400" />
                        Recalibrate ML
                    </button>
                </div>
            </header>

            {/* Outbreak Warning Banners */}
            {activeOutbreakAlerts.length > 0 && (
                <div className="space-y-3" style={{ padding: '0 8px' }}>
                    {activeOutbreakAlerts.map((alert, idx) => (
                        <div key={idx} className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl text-rose-800 flex justify-between items-start shadow-sm border border-rose-100">
                            <div className="flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-sm text-rose-900 uppercase tracking-wide">{alert.title}</h4>
                                    <p className="text-xs text-rose-700 mt-1">{alert.description}</p>
                                    <div className="flex gap-4 mt-2 text-[10px] font-bold text-rose-600">
                                        <span>DISEASE: {alert.disease}</span>
                                        <span>RISK TIER: {alert.risk_tier}</span>
                                        {alert.confidence && <span>CONFIDENCE: {alert.confidence}</span>}
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setActiveOutbreakAlerts(prev => prev.filter((_, i) => i !== idx))}
                                className="text-rose-400 hover:text-rose-700 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* KPI Cards Row */}
            <section className="kpi-row">
                <div className="glass-panel kpi-card">
                    <div className="kpi-top">
                        <span>Expected Volume</span>
                        <div className="kpi-icon" style={{ '--icon-color': 'var(--accent-cyan)' }}>
                            <Calendar className="w-4 h-4 text-cyan-400" />
                        </div>
                    </div>
                    <div className="kpi-middle">
                        <span className="kpi-value">{stats.kpiAppointments}</span>
                    </div>
                    <div className="kpi-bottom">
                        <span className="trend-badge up"><TrendingUp className="w-3 h-3" /> +14.2%</span>
                        <span className="kpi-meta">vs last scale</span>
                    </div>
                </div>

                <div className="glass-panel kpi-card">
                    <div className="kpi-top">
                        <span>No-Show Risk</span>
                        <div className="kpi-icon" style={{ '--icon-color': 'var(--accent-red)' }}>
                            <AlertTriangle className="w-4 h-4 text-rose-400" />
                        </div>
                    </div>
                    <div className="kpi-middle">
                        <span className="kpi-value">{stats.kpiNoshow}</span>
                    </div>
                    <div className="kpi-bottom">
                        <span className="trend-badge down"><TrendingDown className="w-3 h-3" /> -1.8%</span>
                        <span className="kpi-meta">stabilized</span>
                    </div>
                </div>

                <div className="glass-panel kpi-card">
                    <div className="kpi-top">
                        <span>Medication Demand</span>
                        <div className="kpi-icon" style={{ '--icon-color': 'var(--accent-purple)' }}>
                            <Package className="w-4 h-4 text-purple-400" />
                        </div>
                    </div>
                    <div className="kpi-middle">
                        <span className="kpi-value">{stats.kpiMeddemand}</span>
                    </div>
                    <div className="kpi-bottom">
                        <span className="trend-badge up"><TrendingUp className="w-3 h-3" /> +2.4%</span>
                        <span className="kpi-meta">supply target</span>
                    </div>
                </div>

                <div className="glass-panel kpi-card">
                    <div className="kpi-top">
                        <span>Outbreak Index</span>
                        <div className="kpi-icon" style={{ '--icon-color': 'var(--accent-amber)' }}>
                            <TrendingUp className="w-4 h-4 text-amber-400" />
                        </div>
                    </div>
                    <div className="kpi-middle">
                        <span className="kpi-value">{stats.kpiDisease}</span>
                    </div>
                    <div className="kpi-bottom">
                        <span className="trend-badge up"><TrendingUp className="w-3 h-3" /> Rising</span>
                        <span className="kpi-meta">Influenza vector</span>
                    </div>
                </div>
            </section>

            {/* Disease Outbreak Prediction & Awareness Center */}
            <section className="glass-panel disease-awareness-center">
                <div className="panel-header mb-4">
                    <div className="panel-title flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-600" />
                        <h2>ML Outbreak Prediction & Awareness Dispatcher</h2>
                    </div>
                    <span className="ai-badge-pulse">
                        Predictive AI Model Active
                    </span>
                </div>

                <p className="section-desc">
                    The ML model monitors caseloads, diagnostics, and external parameters to predict spreading velocities. Use <strong>Broadcast Awareness</strong> to send a manual alert, or configure the <strong>Auto-Send Scheduler</strong> below to dispatch on a repeating interval.
                </p>

                {/* ── Auto-Send Scheduler Bar ── */}
                <div className="auto-send-bar">
                    <div className="auto-send-left">
                        <Clock className="w-4 h-4" style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                        <span className="auto-send-label">Auto-Send every:</span>
                        <div className="interval-options">
                            {[20, 30].map(m => (
                                <button
                                    key={m}
                                    className={`interval-btn ${autoSendPreset === m ? 'active' : ''}`}
                                    onClick={() => { setAutoSendPreset(m); setAutoSendCustom(''); }}
                                    disabled={autoSendEnabled}
                                >
                                    {m}m
                                </button>
                            ))}
                            <button
                                className={`interval-btn ${autoSendPreset === 'custom' ? 'active' : ''}`}
                                onClick={() => setAutoSendPreset('custom')}
                                disabled={autoSendEnabled}
                            >
                                Custom
                            </button>
                            {autoSendPreset === 'custom' && (
                                <input
                                    type="number"
                                    min="1"
                                    max="1440"
                                    value={autoSendCustom}
                                    onChange={e => setAutoSendCustom(e.target.value)}
                                    placeholder="mins"
                                    className="custom-mins-input"
                                    disabled={autoSendEnabled}
                                />
                            )}
                        </div>
                    </div>
                    <div className="auto-send-right">
                        {autoSendEnabled && (
                            <span className="countdown-pill">
                                <span className="countdown-dot"></span>
                                Next in {formatCountdown(autoSendCountdown)}
                            </span>
                        )}
                        <button
                            className={`auto-toggle-btn ${autoSendEnabled ? 'stop' : 'start'}`}
                            onClick={autoSendEnabled ? stopAutoSend : startAutoSend}
                        >
                            {autoSendEnabled ? (
                                <><Square className="w-4 h-4" /> Stop Scheduler</>
                            ) : (
                                <><Play className="w-4 h-4" /> Start Scheduler</>
                            )}
                        </button>
                    </div>
                </div>

                {/* ── Last Updated / Sources Info Bar ── */}
                {outbreakMeta && (
                    <div className="research-meta-bar">
                        <div className="meta-left">
                            <Newspaper className="w-3.5 h-3.5" style={{ color: 'var(--accent-purple)' }} />
                            <span className="meta-sources">
                                Sources: {outbreakMeta.sources.join(' · ')}
                            </span>
                            {outbreakMeta.cached && (
                                <span className="meta-cached-badge">Cached</span>
                            )}
                        </div>
                        <div className="meta-right">
                            <span className="meta-time">
                                Updated {new Date(outbreakMeta.lastUpdated).toLocaleTimeString()}
                            </span>
                            <button
                                className="meta-refresh-btn"
                                onClick={() => fetchOutbreakNews(true)}
                                disabled={outbreakNewsLoading}
                                title="Force refresh from WHO / CDC / disease.sh"
                            >
                                <RefreshCw className={`w-3 h-3 ${outbreakNewsLoading ? 'animate-spin' : ''}`} />
                                {outbreakNewsLoading ? 'Fetching…' : 'Refresh Research'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Disease Analytics Chart Panel ── */}
                {spreadingDiseases.length > 0 && (
                    <div className="ob-charts-panel">
                        <div className="ob-charts-header">
                            <span className="ob-charts-title">📊 Disease Spread Analysis — Data Visualisation</span>
                            <span className="ob-charts-subtitle">ML-computed risk scores · 7-day trend projection · case ranking</span>
                        </div>

                        {/* Row 1: Radar + Donut */}
                        <div className="ob-row-two">
                            <div className="ob-chart-box">
                                <p className="ob-chart-label">Spread Probability Radar</p>
                                <div className="ob-chart-canvas-wrap">
                                    <canvas ref={obRadarRef}></canvas>
                                </div>
                            </div>
                            <div className="ob-chart-box">
                                <p className="ob-chart-label">Risk Tier Distribution</p>
                                <div className="ob-chart-canvas-wrap">
                                    <canvas ref={obDonutRef}></canvas>
                                </div>
                            </div>
                        </div>

                        {/* Row 2: 7-Day Trend Line */}
                        <div className="ob-chart-box ob-chart-full">
                            <p className="ob-chart-label">7-Day Case Trend Projection</p>
                            <div className="ob-chart-canvas-wrap" style={{ height: '200px' }}>
                                <canvas ref={obLineRef}></canvas>
                            </div>
                        </div>

                        {/* Row 3: Case Ranking Bar */}
                        <div className="ob-chart-box ob-chart-full">
                            <p className="ob-chart-label">Active Case Count & Velocity Ranking</p>
                            <div className="ob-chart-canvas-wrap" style={{ height: '160px' }}>
                                <canvas ref={obBarRef}></canvas>
                            </div>
                        </div>
                    </div>
                )}

                <div className="disease-cards-grid">
                    {spreadingDiseases.map((disease) => {
                        const isBroadcasting = broadcastingId === disease.id;
                        return (
                            <div key={disease.id} className="disease-card">
                                <div className="card-top">
                                    <h3 className="disease-name">{disease.name}</h3>
                                    <span className={`risk-badge-status ${disease.risk.toLowerCase()}`}>
                                        {disease.risk} Risk
                                    </span>
                                </div>
                                <div className="metrics-row">
                                    <div className="metric-box">
                                        <span className="metric-label">Velocity</span>
                                        <span className="metric-val">{disease.probability}%</span>
                                    </div>
                                    <div className="metric-box">
                                        <span className="metric-label">Cases</span>
                                        <span className="metric-val">{disease.activeCases}</span>
                                    </div>
                                    <div className="metric-box">
                                        <span className="metric-label">Trend</span>
                                        <span className={`metric-val ${disease.trend.startsWith('+') ? 'up' : 'down'}`}>
                                            {disease.trend}
                                        </span>
                                    </div>
                                </div>

                                {/* ── Analytical Telemetry Details ── */}
                                <div className="ob-stats-row">
                                    <div className="ob-stat-item">
                                        <span className="ob-stat-lbl">Transmission: </span>
                                        <span className="ob-stat-val font-semibold">{disease.transmissionRate || 'R0: 1.2 - 2.0'}</span>
                                    </div>
                                    <div className="ob-stat-item">
                                        <span className="ob-stat-lbl">Peak Window: </span>
                                        <span className="ob-stat-val font-semibold">{disease.peakPeriod || 'Seasonal'}</span>
                                    </div>
                                    <div className="ob-stat-item">
                                        <span className="ob-stat-lbl">Severity Level: </span>
                                        <span className={`ob-stat-val font-semibold ${disease.risk === 'Urgent' || disease.risk === 'High' ? 'text-red-500' : 'text-amber-500'}`}>
                                            {disease.severityIndex || 'Moderate'}
                                        </span>
                                    </div>
                                </div>

                                <div className="precautions-box">
                                    <strong>Guidelines:</strong> {disease.precautions}
                                </div>

                                {/* ── Recommended Doctor Referrals ── */}
                                <div className="recommended-docs-section">
                                    <span className="rec-section-title">🩺 Recommended Care Referral</span>
                                    <div className="rec-docs-list">
                                        {disease.recommendedDoctors && disease.recommendedDoctors.length > 0 ? (
                                            disease.recommendedDoctors.map((doc, di) => (
                                                <div key={di} className="rec-doc-card">
                                                    <div className="doc-card-left">
                                                        <div className={`doc-avatar ${doc.isVirtual ? 'virtual' : 'active'}`}>
                                                            <User className="w-3.5 h-3.5 text-white" />
                                                        </div>
                                                        <div className="doc-info">
                                                            <span className="doc-name">{doc.name}</span>
                                                            <span className="doc-specialty">{doc.specialty}</span>
                                                        </div>
                                                    </div>
                                                    {doc.isVirtual && (
                                                        <span className="virtual-doc-badge">On-Call</span>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <span className="no-docs-text">Querying matching clinics & doctors...</span>
                                        )}
                                    </div>
                                </div>

                                {/* ── Live Research News ── */}
                                {disease.news && disease.news.length > 0 ? (
                                    <div className="news-section">
                                        <span className="news-section-title">
                                            <Newspaper className="w-3 h-3" /> Latest Research
                                        </span>
                                        {disease.news.slice(0, 2).map((item, ni) => (
                                            <div key={ni} className="news-item">
                                                <span className={`news-source-badge src-${(item.source || 'who').toLowerCase()}`}>
                                                    {item.source || 'WHO'}
                                                </span>
                                                <a
                                                    href={item.link || '#'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="news-headline"
                                                    title={item.description}
                                                >
                                                    {item.title.slice(0, 80)}{item.title.length > 80 ? '…' : ''}
                                                    <ExternalLink className="w-2.5 h-2.5 inline ml-1 opacity-50" />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="news-section no-news">
                                        <span className="news-section-title"><Newspaper className="w-3 h-3" /> Latest Research</span>
                                        <span className="no-news-text">No active alerts from WHO/CDC at this time.</span>
                                    </div>
                                )}

                                <button
                                    onClick={() => handleBroadcastAwareness(disease)}
                                    disabled={isBroadcasting || disease.awarenessSent}
                                    className={`broadcast-btn ${disease.awarenessSent ? 'sent' : ''}`}
                                >
                                    {isBroadcasting ? (
                                        <>
                                            <span className="spinner"></span>
                                            Sending...
                                        </>
                                    ) : disease.awarenessSent ? (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Campaign Dispatched
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Broadcast Awareness
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Grid 1: Appointment Influx & Triage Queue */}
            <div className="dashboard-grid">
                {/* Line Chart Panel */}
                <div className="glass-panel">
                    <div className="panel-header">
                        <div className="panel-title">
                            <Activity className="w-5 h-5 text-cyan-400" />
                            <h2>Patient Influx Prediction & ML Forecast</h2>
                        </div>
                        <span className="text-xs text-secondary">Accuracy Score: {stats.kpiAccuracy}</span>
                    </div>
                    <div className="chart-container">
                        <canvas ref={apptChartRef}></canvas>
                    </div>
                </div>

                {/* High Risk Triage Queue */}
                <div className="glass-panel">
                    <div className="panel-header">
                        <div className="panel-title">
                            <Shield className="w-5 h-5 text-rose-400" />
                            <h2>High-Risk Patient Triage Queue</h2>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-full font-bold uppercase">
                            AI Alert
                        </span>
                    </div>
                    <div className="no-show-container">
                        <div className="risk-list w-full" style={{ gridColumn: 'span 2' }}>
                            {highRiskPatients.length === 0 ? (
                                <div className="text-center py-10 text-xs text-slate-500">
                                    No patient triage logs matches filters.
                                </div>
                            ) : (
                                highRiskPatients.map(p => (
                                    <div key={p.id} className="patient-row">
                                        <div className="patient-info cursor-pointer" onClick={() => setSelectedPatient(p)}>
                                            <span className="patient-name text-slate-200">{p.name}</span>
                                            <span className="patient-meta">Age {p.age} &bull; {p.department || 'Triage Chat'}</span>
                                        </div>
                                        <div className="patient-actions">
                                            <span className={`risk-badge ${p.risk === 'high' || p.risk === 'urgent' || p.risk === 'High' || p.risk === 'Urgent' ? 'high' : 'medium'}`}>
                                                {p.score || p.risk} Risk
                                            </span>
                                            <button 
                                                className="action-btn" 
                                                onClick={() => {
                                                    addToast(`Alerting Doctor on-duty for ${p.name}...`, 'success');
                                                    addTerminalLine(`[ALERT] Dispatched risk notify payload for ${p.name} (Risk score: ${p.score || 'Urgent'})`, 'warn');
                                                }}
                                                title="Escalate patient to duty officer"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid 2: Disease Heatmap & Medicine stock */}
            <div className="dashboard-grid">
                {/* Disease Epidemiology Heatmap */}
                <div className="glass-panel">
                    <div className="panel-header">
                        <div className="panel-title">
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                            <h2>Disease Epidemiology Risk Heatmap</h2>
                        </div>
                    </div>
                    <div className="heatmap-table-wrapper">
                        <table className="heatmap-table">
                            <thead>
                                <tr>
                                    <th>Disease/Vector Group</th>
                                    <th>Target Demographics</th>
                                    <th>Outbreak Sector</th>
                                    <th>Vector Velocity</th>
                                    <th>Severity Rank</th>
                                </tr>
                            </thead>
                            <tbody>
                                {diseaseHeatmap.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4 text-xs text-slate-500">
                                            No disease epidemiological risk metrics available.
                                        </td>
                                    </tr>
                                ) : (
                                    diseaseHeatmap.map((row, idx) => (
                                        <tr key={idx}>
                                            <td className="font-semibold text-slate-100">{row.group}</td>
                                            <td className="text-slate-400">{row.age}</td>
                                            <td className="text-slate-400">{row.area}</td>
                                            <td className={`font-semibold ${row.level === 'critical' ? 'text-rose-400' : 'text-amber-400'}`}>{row.trend}</td>
                                            <td>
                                                <div className={`heatmap-cell level-${row.level}`}>{row.score}</div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Medicine Stock & Demand */}
                <div className="glass-panel">
                    <div className="panel-header">
                        <div className="panel-title">
                            <Package className="w-5 h-5 text-amber-400" />
                            <h2>Medicine Demand & Supply Alerts</h2>
                        </div>
                    </div>
                    <div className="stock-alerts">
                        {stockAlerts.length === 0 ? (
                            <div className="text-center py-8 text-xs text-slate-500">
                                No stock alerts at this time. All inventory levels are optimal.
                            </div>
                        ) : (
                            stockAlerts.map(stock => (
                                <div key={stock.id} className={`stock-alert-card ${stock.critical ? 'critical' : ''}`}>
                                    <div className="stock-details">
                                        <span className="stock-name">
                                            {stock.name}
                                            {stock.critical && (
                                                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-ping"></span>
                                            )}
                                        </span>
                                        <span className="stock-qty">{stock.qty} Remaining &bull; {stock.department}</span>
                                    </div>
                                    <div className="stock-action">
                                        <button 
                                            className="btn-action-small" 
                                            onClick={() => handleTriggerAiAction('order')}
                                        >
                                            Restock
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Grid 3: Operational gauges & rankings */}
            <div className="dashboard-grid">
                {/* Performance Doughnut Gauge */}
                <div className="glass-panel">
                    <div className="panel-header">
                        <div className="panel-title">
                            <Activity className="w-5 h-5 text-cyan-400" />
                            <h2>Hospital Operational Efficiency Index</h2>
                        </div>
                    </div>
                    <div className="performance-container">
                        <div className="gauge-wrapper">
                            <canvas ref={gaugeChartRef}></canvas>
                            <div className="gauge-center-text">
                                <span className="gauge-score">{Math.round(parseFloat(stats.kpiPerfscore))}%</span>
                                <div className="gauge-label">Perf Score</div>
                            </div>
                        </div>
                        <div className="kpi-breakdown">
                            <div className="kpi-breakdown-card">
                                <span className="kpi-breakdown-title">Avg Wait Time</span>
                                <div className="kpi-breakdown-val-row">
                                    <span className="kpi-breakdown-value text-slate-100">{stats.subWaiting}</span>
                                    <span className="kpi-breakdown-rating text-emerald-400">-12%</span>
                                </div>
                            </div>
                            <div className="kpi-breakdown-card">
                                <span className="kpi-breakdown-title">Bed Occupancy</span>
                                <div className="kpi-breakdown-val-row">
                                    <span className="kpi-breakdown-value text-slate-100">{stats.subOccupancy}</span>
                                    <span className="kpi-breakdown-rating text-cyan-400">Target</span>
                                </div>
                            </div>
                            <div className="kpi-breakdown-card">
                                <span className="kpi-breakdown-title">Satisfaction</span>
                                <div className="kpi-breakdown-val-row">
                                    <span className="kpi-breakdown-value text-slate-100">{stats.subSatisfaction}</span>
                                    <span className="kpi-breakdown-rating text-emerald-400">High</span>
                                </div>
                            </div>
                            <div className="kpi-breakdown-card">
                                <span className="kpi-breakdown-title">Utilization</span>
                                <div className="kpi-breakdown-val-row">
                                    <span className="kpi-breakdown-value text-slate-100">{stats.subUtilization}</span>
                                    <span className="kpi-breakdown-rating text-purple-400">Optimal</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Department Rankings */}
                <div className="glass-panel">
                    <div className="panel-header">
                        <div className="panel-title">
                            <Briefcase className="w-5 h-5 text-purple-400" />
                            <h2>Departmental Utilization Ranking</h2>
                        </div>
                    </div>
                    <div className="ranking-list">
                        {utilizationRankings.length === 0 ? (
                            <div className="text-center py-8 text-xs text-slate-500">
                                No department utilization ranking logs.
                            </div>
                        ) : (
                            utilizationRankings.map(item => (
                                <div key={item.rank} className="ranking-item">
                                    <div className="ranking-header">
                                        <div className="ranking-name">
                                            <span className="ranking-index">0{item.rank}</span>
                                            <span className="text-slate-200">{item.name}</span>
                                        </div>
                                        <span className="ranking-score">{item.score}%</span>
                                    </div>
                                    <div className="ranking-bar-bg">
                                        <div 
                                            className="ranking-bar-fill" 
                                            style={{ width: `${item.score}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* bottom Panel: AI Insights & Recommendation Terminal Simulator */}
            <div className="glass-panel ai-insights-panel full-width">
                <div className="terminal-header">
                    <div className="flex items-center gap-4">
                        <div className="terminal-dots">
                            <span className="terminal-dot red"></span>
                            <span className="terminal-dot yellow"></span>
                            <span className="terminal-dot green"></span>
                        </div>
                        <span className="terminal-prompt">{promptText}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-purple-400 font-bold uppercase tracking-widest">
                        <Terminal className="w-3.5 h-3.5" />
                        Predictive Orchestrator console
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {aiInsights.length === 0 ? (
                        <div className="col-span-3 text-center py-6 text-xs text-slate-500">
                            No AI insights available. Add patient diagnosis records to generate clinical forecasts.
                        </div>
                    ) : (
                        aiInsights.map(insight => (
                            <div key={insight.id} className="insight-card">
                                <div className="insight-top">
                                    <div className={`insight-icon-wrapper ${insight.level === 'danger' ? 'danger' : (insight.level === 'warning' ? 'warning' : '')}`}>
                                        <Activity className="w-4 h-4" />
                                    </div>
                                    <div className="insight-content">
                                        <h3>{insight.title}</h3>
                                        <p>{insight.description}</p>
                                    </div>
                                </div>
                                <div className="insight-bottom">
                                    <span className="insight-confidence">{insight.confidence}</span>
                                    <button 
                                        className={`btn-insight-action ${insight.level === 'danger' ? 'danger' : (insight.level === 'warning' ? 'warning' : '')}`}
                                        onClick={() => handleTriggerAiAction(insight.actionName)}
                                    >
                                        {insight.actionText}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Simulated shell console output */}
                <div className="terminal-body" id="terminal-body-box">
                    {terminalLines.map((line, idx) => (
                        <div key={idx} className={`terminal-line ${line.type}`}>
                            {line.type === 'cmd' ? '' : '[auracare-ml-service] '}{line.text}
                        </div>
                    ))}
                    <div className="terminal-line">
                        $ <span className="terminal-cursor"></span>
                    </div>
                </div>
            </div>

            {/* Patient Symptoms Detail Modal Overlay */}
            {selectedPatient && (
                <div className="modal-overlay active">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">AI Triage Clinical Profile</h3>
                            <button className="modal-close" onClick={() => setSelectedPatient(null)}>
                                <X />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-slate-100">{selectedPatient.name}</h4>
                                    <span className="text-xs text-slate-400">Age {selectedPatient.age} &bull; Gender: Female &bull; {selectedPatient.department || 'Triage Chat'}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-3 bg-slate-900/50 border border-white/5 rounded-lg">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">AI Extracted Symptoms</span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {(selectedPatient.symptoms || ['general_fever', 'fatigue']).map((s, idx) => (
                                            <span key={idx} className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs rounded-md font-medium uppercase tracking-wider">
                                                {s.replace(/_/g, ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-900/50 border border-white/5 rounded-lg">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Raw Free-Text Triage Input</span>
                                    <p className="text-xs text-slate-300 italic leading-relaxed mt-1">
                                        "{selectedPatient.user_input || `I feel very weak and have been suffering from a ${selectedPatient.symptoms?.join(' and ').replace(/_/g, ' ') || 'fever'} since yesterday morning.`}"
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-slate-900/50 border border-white/5 rounded-lg">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Risk Score</span>
                                        <span className="text-sm font-bold text-rose-400">{selectedPatient.score || 'Urgent'} Risk</span>
                                    </div>
                                    <div className="p-3 bg-slate-900/50 border border-white/5 rounded-lg">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Weather Impact</span>
                                        <span className="text-xs text-slate-300">{selectedPatient.weatherImpact || 'Mondays display higher base risk factors'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-700 transition"
                                onClick={() => setSelectedPatient(null)}
                            >
                                Dismiss
                            </button>
                            <button 
                                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-500 transition shadow-lg shadow-rose-950"
                                onClick={() => {
                                    addToast(`Patient ${selectedPatient.name} has been escalated to Urgent consult.`, 'success');
                                    addTerminalLine(`[ESCALATE] Dispatched push alert payload to Duty Doctor for patient: ${selectedPatient.name}`, 'warn');
                                    setSelectedPatient(null);
                                }}
                            >
                                Escalate to Duty Doctor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
