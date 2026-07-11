import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Activity,
  Sparkles,
} from "lucide-react";
import { postTriage } from "../../../api/patientApi";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";

const riskConfig = {
  Low: {
    color: "emerald",
    icon: ShieldCheck,
    label: "Low Risk",
    ring: "from-emerald-400 to-teal-400",
  },
  Moderate: {
    color: "amber",
    icon: ShieldAlert,
    label: "Moderate Risk",
    ring: "from-amber-400 to-orange-400",
  },
  Medium: {
    color: "amber",
    icon: ShieldAlert,
    label: "Medium Risk",
    ring: "from-amber-400 to-orange-400",
  },
  High: {
    color: "red",
    icon: AlertTriangle,
    label: "High Risk",
    ring: "from-red-500 to-rose-500",
  },
  Urgent: {
    color: "red",
    icon: AlertTriangle,
    label: "Urgent Risk",
    ring: "from-red-600 to-rose-600",
  },
};

export default function AiTriageAssistant() {
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      role: "ai",
      type: "greeting",
      text: "Hi! I'm your AI Health Assistant. Describe your symptoms and I'll assess the urgency for you.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setChatHistory((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setIsLoading(true);

    try {
      const data = await postTriage(trimmed);
      console.log(data);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "ai",
          type: "triage",
          predicted_risk: data.predicted_risk,
          extracted_symptoms: data.extracted_symptoms,
          predicted_disease: data.predicted_disease,
          recommendation: data.recommendation,
          predictions: data.predictions,
        },
      ]);
    } catch (err) {
      console.error("Triage error:", err);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "ai",
          type: "error",
          text: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)] max-w-5xl mx-auto w-full">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-[#0B132B] to-[#1a2340] rounded-3xl px-5 py-4 mb-4 flex items-center gap-3 shadow-lg shrink-0 border border-slate-700/40">
        <div className="w-10 h-10 rounded-2xl bg-[#38bdf8]/10 border border-[#38bdf8]/20 flex items-center justify-center">
          <Activity className="w-5 h-5 text-[#38bdf8]" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-white tracking-tight">
            AI Symptom Checker
          </h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
            Powered by HealTrack AI Engine
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 bg-emerald-900/30 border border-emerald-800/40 px-3 py-1.5 rounded-xl">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
          <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">
            Online
          </span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 px-1">
        {chatHistory.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "ai" ? (
              <div className="max-w-[85%] flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0B132B] border border-slate-700/40 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <Bot className="w-4 h-4 text-[#38bdf8]" />
                </div>
                <div>
                  {msg.type === "greeting" || msg.type === "error" ? (
                    <div
                      className={`${msg.type === "error" ? "bg-rose-50 border-rose-100" : "bg-white border-slate-100"} border rounded-3xl rounded-tl-md px-4 py-3.5 shadow-sm`}
                    >
                      <p
                        className={`text-sm font-medium ${msg.type === "error" ? "text-rose-700" : "text-slate-700"} leading-relaxed`}
                      >
                        {msg.text}
                      </p>
                    </div>
                  ) : msg.type === "triage" ? (
                    <TriageCard
                      risk={msg.predicted_risk}
                      symptoms={msg.extracted_symptoms}
                      disease={msg.predicted_disease}
                      recommendation={msg.recommendation}
                      predictions={msg.predictions}
                    />
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="max-w-[75%] bg-[#6366f1] text-white rounded-3xl rounded-tr-md px-4 py-3 shadow-md">
                <p className="text-sm font-medium leading-relaxed">
                  {msg.text}
                </p>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-full bg-[#0B132B] border border-slate-700/40 flex items-center justify-center shadow-sm">
                <Bot className="w-4 h-4 text-[#38bdf8]" />
              </div>
              <div className="bg-white border border-slate-100 rounded-3xl rounded-tl-md px-5 py-3.5 shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                <span className="text-xs text-slate-400 font-medium">
                  Analyzing symptoms...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="pt-2 shrink-0">
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100/60 transition-all">
          <Sparkles className="w-4 h-4 text-slate-300 shrink-0" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your symptoms (e.g. headache, fever, fatigue)..."
            className="flex-1 text-sm text-slate-800 placeholder-slate-400 outline-none bg-transparent font-medium"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-[#6366f1] hover:bg-[#5558e6] disabled:bg-slate-200 text-white rounded-xl transition-all shadow-sm cursor-pointer border-none"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-center text-[10px] text-slate-400 font-medium mt-2">
          AI triage assists diagnosis. Always consult a licensed physician for
          medical advice.
        </p>
      </form>
    </div>
  );
}

// ── Triage Result Card ──────────────────────────────────────
function TriageCard({ risk, symptoms, disease, recommendation, predictions }) {
  const config = riskConfig[risk] || riskConfig.Low;
  const Icon = config.icon;

  const colorMap = {
    emerald: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
      icon: "text-emerald-600",
      symptomBg: "bg-white border-emerald-100 text-emerald-800",
      diseaseBar: "bg-emerald-600",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      icon: "text-amber-600",
      symptomBg: "bg-white border-amber-100 text-amber-800",
      diseaseBar: "bg-amber-500",
    },
    red: {
      bg: "bg-rose-50",
      border: "border-rose-200",
      badge: "bg-rose-100 text-rose-700 border-rose-200",
      icon: "text-rose-600",
      symptomBg: "bg-white border-rose-100 text-rose-800",
      diseaseBar: "bg-rose-600",
    },
  };
  const c = colorMap[config.color];

  const topPrediction = predictions?.[0];
  const description = topPrediction?.description;
  const precautions = topPrediction?.precautions;

  return (
    <div
      className={`${c.bg} border ${c.border} rounded-3xl rounded-tl-md p-5 shadow-sm space-y-4 max-w-[480px]`}
    >
      {/* Risk Badge */}
      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-xl ${c.badge.split(" ")[0]} flex items-center justify-center border ${c.badge.split(" ")[2]}`}
        >
          <Icon className={`w-4 h-4 ${c.icon}`} />
        </div>
        <Badge
          colorClasses={c.badge}
          className="text-xs font-extrabold px-2.5 py-1 rounded-xl border uppercase tracking-wider"
        >
          {config.label}
        </Badge>
      </div>

      {/* Detected Symptoms */}
      {symptoms?.length > 0 && (
        <div>
          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">
            Detected Symptoms
          </p>
          <div className="flex flex-wrap gap-1.5">
            {symptoms.map((s, i) => (
              <Badge
                key={i}
                colorClasses={c.symptomBg}
                className="text-[10px] font-bold px-2.5 py-1 rounded-xl border"
              >
                {s}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* AI Prediction */}
      {disease && (
        <div>
          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">
            AI Prediction
          </p>
          <div className="bg-white/70 border border-indigo-100 rounded-xl p-3 flex items-center gap-2">
            <div className="w-1.5 h-6 rounded-full bg-indigo-500 shrink-0"></div>
            <p className="text-xs font-bold text-indigo-800">{disease}</p>
          </div>
        </div>
      )}

      {/* Disease Description */}
      {description && (
        <div>
          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">
            About
          </p>
          <p className="text-xs text-slate-600 leading-relaxed font-medium bg-white/60 p-3 rounded-xl border border-slate-100">
            {description}
          </p>
        </div>
      )}

      {/* Precautions */}
      {precautions?.length > 0 && (
        <div>
          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">
            Recommended Precautions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {precautions.map((p, i) => (
              <span
                key={i}
                className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      {recommendation && (
        <p className="text-xs text-slate-600 leading-relaxed font-medium border-t border-slate-200/60 pt-3">
          {recommendation}
        </p>
      )}
    </div>
  );
}
