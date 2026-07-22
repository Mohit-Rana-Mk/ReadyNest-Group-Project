import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutDashboard, Calendar, Users, Activity, LogOut, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const inputRef = useRef(null);

    // Toggle on Cmd/Ctrl + K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setSearchQuery('');
        }
    }, [isOpen]);

    const getActions = () => {
        const baseActions = [
            { id: 'logout', label: 'Log Out', icon: <LogOut className="w-4 h-4 text-slate-500" />, action: () => { logout(); navigate('/login'); } },
        ];

        if (!user) return baseActions;

        switch (user.role) {
            case 'SuperAdmin':
                return [
                    { id: 'admin-dash', label: 'Admin Dashboard', icon: <LayoutDashboard className="w-4 h-4 text-slate-500" />, action: () => navigate('/admin', { state: { tab: 'ecosystem' } }) },
                    { id: 'admin-stats', label: 'System Analytics', icon: <Activity className="w-4 h-4 text-slate-500" />, action: () => navigate('/admin', { state: { tab: 'auracare' } }) },
                    ...baseActions
                ];
            case 'Doctor':
                return [
                    { id: 'doc-dash', label: 'Doctor Workstation', icon: <LayoutDashboard className="w-4 h-4 text-slate-500" />, action: () => navigate('/doctor', { state: { showQueue: false } }) },
                    { id: 'doc-appointments', label: 'My Appointments', icon: <Calendar className="w-4 h-4 text-slate-500" />, action: () => navigate('/doctor', { state: { showQueue: true } }) },
                    { id: 'doc-patients', label: 'Patient Records', icon: <Users className="w-4 h-4 text-slate-500" />, action: () => navigate('/doctor', { state: { showQueue: false } }) },
                    ...baseActions
                ];
            case 'Patient':
                return [
                    { id: 'pat-dash', label: 'Patient Portal', icon: <LayoutDashboard className="w-4 h-4 text-slate-500" />, action: () => navigate('/patient', { state: { tab: 'dashboard' } }) },
                    { id: 'pat-book', label: 'Book Appointment', icon: <Calendar className="w-4 h-4 text-slate-500" />, action: () => navigate('/patient', { state: { tab: 'booking' } }) },
                    { id: 'pat-health', label: 'My Health Vitals', icon: <Activity className="w-4 h-4 text-slate-500" />, action: () => navigate('/patient', { state: { tab: 'analytics' } }) },
                    ...baseActions
                ];
            case 'ClinicAdmin':
                return [
                    { id: 'ca-dash', label: 'Clinic Dashboard', icon: <LayoutDashboard className="w-4 h-4 text-slate-500" />, action: () => navigate('/clinic', { state: { tab: 'dashboard' } }) },
                    { id: 'ca-staff', label: 'Manage Staff', icon: <Users className="w-4 h-4 text-slate-500" />, action: () => navigate('/clinic', { state: { tab: 'staff' } }) },
                    ...baseActions
                ];
            case 'Reception':
            case 'ClinicStaff':
                return [
                    { id: 'rec-dash', label: 'Reception Desk', icon: <LayoutDashboard className="w-4 h-4 text-slate-500" />, action: () => navigate('/reception', { state: { tab: 'appointments' } }) },
                    { id: 'rec-book', label: 'Book Appointment', icon: <Calendar className="w-4 h-4 text-slate-500" />, action: () => navigate('/reception', { state: { tab: 'appointments' } }) },
                    ...baseActions
                ];
            case 'Medicine':
            case 'Pharmacy':
                return [
                    { id: 'phar-dash', label: 'Pharmacy Dashboard', icon: <LayoutDashboard className="w-4 h-4 text-slate-500" />, action: () => navigate('/medicine', { state: { tab: 'dashboard' } }) },
                    { id: 'phar-inventory', label: 'Manage Inventory', icon: <Activity className="w-4 h-4 text-slate-500" />, action: () => navigate('/medicine', { state: { tab: 'inventory' } }) },
                    ...baseActions
                ];
            default:
                return baseActions;
        }
    };

    const allActions = getActions();
    const filteredActions = allActions.filter(action => action.label.toLowerCase().includes(searchQuery.toLowerCase()));

    const handleActionClick = (actionFn) => {
        actionFn();
        setIsOpen(false);
    };

    const handleInputKeyDown = (e) => {
        if (filteredActions.length === 0) return;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % filteredActions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % filteredActions.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredActions[selectedIndex]) {
                handleActionClick(filteredActions[selectedIndex].action);
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden pointer-events-auto"
                        >
                            <div className="flex items-center px-4 py-3 border-b border-slate-100">
                                <Search className="w-5 h-5 text-slate-400 mr-3" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 text-lg"
                                    placeholder="Type a command or search..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setSelectedIndex(0);
                                    }}
                                    onKeyDown={handleInputKeyDown}
                                />
                                <div className="flex items-center space-x-1">
                                    <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-500 font-medium border border-slate-200">ESC</span>
                                    <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                                        <X className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-2 max-h-[60vh] overflow-y-auto">
                                {filteredActions.length > 0 ? (
                                    <div className="space-y-1">
                                        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                            Suggestions
                                        </div>
                                        {filteredActions.map((action, index) => (
                                            <button
                                                key={action.id}
                                                onClick={() => handleActionClick(action.action)}
                                                onMouseEnter={() => setSelectedIndex(index)}
                                                className={`w-full flex items-center px-3 py-3 rounded-xl transition-all group ${
                                                    index === selectedIndex 
                                                        ? 'bg-slate-100 text-slate-900 shadow-sm' 
                                                        : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                                                }`}
                                            >
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-white group-hover:shadow-sm border border-transparent group-hover:border-slate-200 transition-all mr-3">
                                                    {action.icon}
                                                </div>
                                                <span className="font-medium">{action.label}</span>
                                                <ArrowRight className="w-4 h-4 text-slate-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-14 text-center text-slate-500">
                                        No commands found for "{searchQuery}"
                                    </div>
                                )}
                            </div>
                            
                            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                                <div className="flex items-center space-x-4">
                                    <span className="flex items-center"><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-sans shadow-sm mr-1">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-sans shadow-sm mr-2">↓</kbd> to navigate</span>
                                    <span className="flex items-center"><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-sans shadow-sm mr-2">↵</kbd> to select</span>
                                </div>
                                <span>HealTrack Command Palette</span>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
