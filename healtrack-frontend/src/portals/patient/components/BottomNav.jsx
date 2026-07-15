import React from 'react';
import { Home, Search, Activity, ClipboardList, BookOpen, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function BottomNav({ activeTab, onTabChange }) {
    const { t } = useTranslation();

    const tabs = [
        { id: 'home', label: 'HOME', icon: Home },
        { id: 'find-care', label: 'SEARCH', icon: Search },
        { id: 'triage', label: 'AI TRIAGE', icon: Activity, isSpecial: true },
        { id: 'awareness', label: 'AWARE', icon: BookOpen },
        { id: 'records', label: 'RECORDS', icon: ClipboardList },
        { id: 'payments', label: 'PAY', icon: CreditCard },
    ];

    return (
        <div className="fixed bottom-4 left-4 right-4 bg-white border border-slate-100/80 rounded-[28px] shadow-[0_12px_36px_rgba(0,0,0,0.12)] z-50 md:hidden py-1 px-2">
            <div className="flex items-end justify-around relative">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    if (tab.isSpecial) {
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className="flex flex-col items-center relative -top-3 cursor-pointer group"
                            >
                                {/* Floating Dark Circle */}
                                <div className={`w-14 h-14 bg-[#0B132B] rounded-full flex items-center justify-center shadow-lg border-4 border-white transition-all duration-200 ${
                                    isActive ? 'scale-110 bg-indigo-950' : 'group-hover:scale-105'
                                }`}>
                                    {/* Pulse line/Heartbeat icon in cyan */}
                                    <Icon className="w-6 h-6 text-[#38bdf8]" strokeWidth={2.5} />
                                </div>
                                <span className={`text-[8px] font-extrabold tracking-widest mt-1 ${
                                    isActive ? 'text-[#0B132B]' : 'text-slate-400'
                                }`}>
                                    {tab.label}
                                </span>
                            </button>
                        );
                    }

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className="flex flex-col items-center py-2.5 px-3 cursor-pointer group transition-all"
                        >
                            <Icon 
                                className={`w-5.5 h-5.5 transition-colors duration-200 ${
                                    isActive ? 'text-[#0B132B]' : 'text-slate-400 group-hover:text-slate-600'
                                }`} 
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className={`text-[8px] font-extrabold tracking-widest mt-1 transition-colors duration-200 ${
                                isActive ? 'text-[#0B132B]' : 'text-slate-400 group-hover:text-slate-600'
                            }`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
