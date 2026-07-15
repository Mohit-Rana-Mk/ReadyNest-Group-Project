import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export function CustomDropdown({ 
    options, 
    value, 
    onChange, 
    className = "", 
    placeholder = "Select...",
    renderOption = null,
    renderSelected = null
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div 
                className="w-full h-full min-h-[44px] flex items-center justify-between px-3 bg-[#eef2f6] rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700 select-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex-1 truncate mr-2">
                    {selectedOption ? (renderSelected ? renderSelected(selectedOption) : selectedOption.label) : <span className="text-slate-400">{placeholder}</span>}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-50 min-w-full w-max mt-1 bg-white border border-slate-100 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] py-1.5 max-h-60 overflow-y-auto">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={`px-3 py-2 text-xs font-semibold cursor-pointer transition-colors ${value === option.value ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                        >
                            {renderOption ? renderOption(option) : option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
