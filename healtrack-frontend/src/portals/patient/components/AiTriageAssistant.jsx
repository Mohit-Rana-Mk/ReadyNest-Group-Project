import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertTriangle, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { postTriage } from '../../../api/patientApi';

const riskConfig = {
    Low:    { color: 'emerald', icon: ShieldCheck, label: 'Low Risk' },
    Medium: { color: 'amber',   icon: ShieldAlert, label: 'Medium Risk' },
    High:   { color: 'red',     icon: AlertTriangle, label: 'High Risk' },
};

export default function AiTriageAssistant() {
    const [input, setInput] = useState('');
    const [chatHistory, setChatHistory] = useState([
        {
            role: 'ai',
            type: 'greeting',
            text: "Hi! I'm your AI Health Assistant. Describe your symptoms and I'll assess the urgency for you.",
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        // Add user message
        setChatHistory(prev => [...prev, { role: 'user', text: trimmed }]);
        setInput('');
        setIsLoading(true);

        try {
            const data = await postTriage(trimmed);
            setChatHistory(prev => [
                ...prev,
                {
                    role: 'ai',
                    type: 'triage',
                    predicted_risk: data.predicted_risk,
                    extracted_symptoms: data.extracted_symptoms,
                    predicted_disease: data.predicted_disease,
                    recommendation: data.recommendation,
                },
            ]);
        } catch (err) {
            console.error('Triage error:', err);
            setChatHistory(prev => [
                ...prev,
                { role: 'ai', type: 'error', text: 'Sorry, something went wrong. Please try again.' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl mx-1 mb-3 shadow-lg">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Bot size={20} className="text-white" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white">AI Symptom Checker</h3>
                    <p className="text-[10px] text-indigo-100">Powered by HealTrack AI Engine</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] text-indigo-100">Online</span>
                </div>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto px-2 space-y-3 pb-4">
                {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'ai' ? (
                            <div className="max-w-[85%] flex gap-2">
                                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-1">
                                    <Bot size={14} className="text-indigo-600" />
                                </div>
                                <div>
                                    {msg.type === 'greeting' || msg.type === 'error' ? (
                                        <div className={`${msg.type === 'error' ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'} border rounded-2xl rounded-tl-md px-3.5 py-2.5 shadow-sm`}>
                                            <p className={`text-sm ${msg.type === 'error' ? 'text-red-600' : 'text-gray-700'}`}>{msg.text}</p>
                                        </div>
                                    ) : msg.type === 'triage' ? (
                                        <TriageCard
                                            risk={msg.predicted_risk}
                                            symptoms={msg.extracted_symptoms}
                                            disease={msg.predicted_disease}
                                            recommendation={msg.recommendation}
                                        />
                                    ) : null}
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-[80%] bg-indigo-600 text-white rounded-2xl rounded-tr-md px-3.5 py-2.5 shadow-sm">
                                <p className="text-sm">{msg.text}</p>
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex gap-2 items-center">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                                <Bot size={14} className="text-indigo-600" />
                            </div>
                            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                                <Loader2 size={16} className="text-indigo-500 animate-spin" />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            {/* Input bar */}
            <form onSubmit={handleSubmit} className="px-2 pb-2 pt-1">
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-sm focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Describe your symptoms..."
                        className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-xl transition-colors shadow-sm"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </form>
        </div>
    );
}

// ── Triage Result Card ──────────────────────────────────────
function TriageCard({ risk, symptoms, disease, recommendation }) {
    const config = riskConfig[risk] || riskConfig.Low;
    const Icon = config.icon;

    const colorMap = {
        emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', icon: 'text-emerald-600' },
        amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-700',     icon: 'text-amber-600' },
        red:     { bg: 'bg-red-50',      border: 'border-red-200',     badge: 'bg-red-100 text-red-700',         icon: 'text-red-600' },
    };
    const c = colorMap[config.color];

    return (
        <div className={`${c.bg} border ${c.border} rounded-2xl rounded-tl-md p-3.5 shadow-sm space-y-2.5`}>
            {/* Risk badge */}
            <div className="flex items-center gap-2">
                <Icon size={16} className={c.icon} />
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
                    {config.label}
                </span>
            </div>

            {/* Symptoms */}
            <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Detected Symptoms</p>
                <div className="flex flex-wrap gap-1.5">
                    {symptoms.map((s, i) => (
                        <span key={i} className="text-xs bg-white/80 border border-gray-200 text-gray-700 px-2 py-0.5 rounded-lg">
                            {s}
                        </span>
                    ))}
                </div>
            </div>

            {/* Predicted Disease */}
            {disease && (
                <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">AI Prediction</p>
                    <p className="text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 p-2 rounded-lg">
                        {disease}
                    </p>
                </div>
            )}

            {/* Recommendation */}
            <p className="text-xs text-gray-600 leading-relaxed">{recommendation}</p>
        </div>
    );
}
