import React from 'react';
import { Home, Search, Bot, ClipboardList } from 'lucide-react';

const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'find-care', label: 'Find Care', icon: Search },
    { id: 'triage', label: 'AI Triage', icon: Bot },
    { id: 'records', label: 'Records', icon: ClipboardList },
];

export default function BottomNav({ activeTab, onTabChange }) {
    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-50">
            <div className="flex items-center justify-around py-2">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                                isActive
                                    ? 'text-indigo-600 scale-105'
                                    : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            <div className={`p-1.5 rounded-xl transition-colors duration-200 ${
                                isActive ? 'bg-indigo-50' : ''
                            }`}>
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                            </div>
                            <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Safe area spacer for iOS */}
            <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
    );
}
