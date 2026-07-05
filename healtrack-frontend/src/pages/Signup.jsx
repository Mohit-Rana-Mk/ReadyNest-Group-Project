import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Building, Heart, Brain, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Signup() {
    const { t } = useTranslation();
    const [isClinic, setIsClinic] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    // Patient Fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState('Prefer Not to Say');
    const [bloodGroup, setBloodGroup] = useState('');

    // Clinic Fields
    const [clinicName, setClinicName] = useState('');
    const [license, setLicense] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            if (isClinic) {
                const payload = {
                    clinic_name: clinicName,
                    license_number: license,
                    address,
                    city,
                    admin_name: name,
                    admin_email: email,
                    admin_phone: phone,
                    password
                };
                const res = await axiosClient.post('/auth/register-clinic', payload);
                if (res.data.success) {
                    setSuccessMessage(res.data.message);
                }
            } else {
                const payload = { name, email, phone, password, dob, gender, blood_group: bloodGroup };
                const res = await axiosClient.post('/auth/signup-patient', payload);
                if (res.data.success) {
                    login(res.data.data.user, res.data.data.token);
                    navigate('/patient');
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to sign up');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Accent Grid / Glow */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-[600px] h-[600px] bg-gradient-to-tr from-blue-500/5 to-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Language Switcher */}
            <div className="absolute top-6 right-6 z-20">
                <LanguageSwitcher />
            </div>

            <div className="max-w-6xl mx-auto w-full z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                    
                    {/* Left-Side: Brand Info Panel (6 columns) */}
                    <div className="hidden lg:flex lg:col-span-6 flex-col space-y-7 text-left">
                        {/* Logo header */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                                <Heart className="w-5.5 h-5.5 fill-white/20" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">
                                    HealTrack AI
                                </h1>
                                <p className="text-[9px] text-[#0ea5e9] font-extrabold tracking-widest uppercase">Healthcare Workspace</p>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-4xl font-extrabold text-slate-900 leading-[1.15] tracking-tight">
                                Predictive clinical workflows powered by machine learning.
                            </h2>
                            <p className="mt-4 text-[13px] text-slate-500 font-medium leading-relaxed max-w-lg">
                                Connect patients, doctors, and clinic operations onto a single intelligent platform designed for faster triage, automated scheduling, and outbreak prevention.
                            </p>
                        </div>

                        {/* Feature Cards Showcase */}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="bg-white border border-slate-100/80 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3">
                                    <Brain className="w-5 h-5" />
                                </div>
                                <h4 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">ML Triage Engine</h4>
                                <p className="text-[11px] text-slate-400 mt-1 leading-normal font-medium">Predictive disease matching based on patient symptoms.</p>
                            </div>
                            <div className="bg-white border border-slate-100/80 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-500 flex items-center justify-center mb-3">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <h4 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">AuraCare AI</h4>
                                <p className="text-[11px] text-slate-400 mt-1 leading-normal font-medium">Live analytics for no-shows, stock alerts, and disease spreads.</p>
                            </div>
                        </div>
                    </div>

                    {/* Right-Side: Form Card (6 columns) */}
                    <div className="lg:col-span-6 flex justify-center w-full">
                        <div className="w-full max-w-[480px] bg-white p-8 sm:p-10 rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                            <div className="mb-6">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                                    Sign up
                                </h2>
                                <p className="mt-1 text-xs text-slate-400 leading-relaxed font-medium">
                                    Create a new patient account or register your healthcare clinic facility.
                                </p>
                            </div>

                            {/* Clinic / Patient Switcher */}
                            <div className="flex bg-[#eef2f6] p-1 rounded-xl mb-6">
                                <button
                                    type="button"
                                    onClick={() => setIsClinic(false)}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-1.5 ${!isClinic ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <UserPlus className="w-4 h-4" /> Patient
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsClinic(true)}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-1.5 ${isClinic ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Building className="w-4 h-4" /> Clinic
                                </button>
                            </div>

                            {error && (
                                <div className="mb-4 bg-rose-50 border border-rose-100 p-3.5 rounded-xl">
                                    <p className="text-xs font-bold text-rose-700">{error}</p>
                                </div>
                            )}
                            
                            {successMessage && (
                                <div className="mb-4 bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                                    <p className="text-xs font-bold text-emerald-800">{successMessage}</p>
                                    <p className="text-xs text-emerald-600 mt-2">
                                        <Link to="/login" className="font-extrabold underline">Return to Login</Link>
                                    </p>
                                </div>
                            )}

                            {!successMessage && (
                                <form className="space-y-4" onSubmit={handleSubmit}>
                                    {isClinic && (
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-extrabold text-slate-800 border-b pb-2 uppercase tracking-wider">Clinic Details</h3>
                                            <div>
                                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Clinic Name</label>
                                                <input type="text" required value={clinicName} onChange={(e) => setClinicName(e.target.value)} className="w-full px-4 py-3 bg-[#eef2f6] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700 placeholder-slate-400" placeholder="e.g. City General Clinic" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">License Number</label>
                                                <input type="text" required value={license} onChange={(e) => setLicense(e.target.value)} className="w-full px-4 py-3 bg-[#eef2f6] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700 placeholder-slate-400" placeholder="e.g. LIC-98234-87" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Address & City</label>
                                                <div className="flex gap-2">
                                                    <input type="text" placeholder="Address" required value={address} onChange={(e) => setAddress(e.target.value)} className="w-2/3 px-4 py-3 bg-[#eef2f6] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700 placeholder-slate-400" />
                                                    <input type="text" placeholder="City" required value={city} onChange={(e) => setCity(e.target.value)} className="w-1/3 px-4 py-3 bg-[#eef2f6] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700 placeholder-slate-400" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <h3 className="text-xs font-extrabold text-slate-800 border-b pb-2 pt-2 uppercase tracking-wider">{isClinic ? 'Admin Account Details' : 'Personal Details'}</h3>
                                        
                                        <div>
                                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
                                            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 bg-[#eef2f6] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700 placeholder-slate-400" placeholder="John Doe" />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                                                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-[#eef2f6] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700 placeholder-slate-400" placeholder="john@example.com" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Phone Number</label>
                                                <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 bg-[#eef2f6] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700 placeholder-slate-400" placeholder="+1 (555) 000-0000" />
                                            </div>
                                        </div>

                                        {!isClinic && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Date of Birth</label>
                                                    <input type="date" required value={dob} onChange={(e) => setDob(e.target.value)} className="w-full px-4 py-3 bg-[#eef2f6] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700 placeholder-slate-400" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Gender</label>
                                                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-4 py-3 bg-[#eef2f6] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700 select-arrow bg-no-repeat">
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                        <option value="Prefer Not to Say">Prefer Not to Say</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
                                            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-[#eef2f6] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700 placeholder-slate-400" placeholder="••••••••" />
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full flex justify-center items-center gap-2 py-3.5 bg-[#6366f1] hover:bg-[#5558e6] rounded-xl font-bold text-white text-xs uppercase tracking-widest transition-all duration-200"
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                    Loading...
                                                </>
                                            ) : (
                                                isClinic ? 'Register Clinic' : 'Create Account'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}

                            <div className="mt-8 text-center text-xs font-bold text-slate-400">
                                Already have an account?{' '}
                                <Link to="/login" className="text-indigo-600 hover:text-indigo-700 hover:underline">
                                    Sign In
                                </Link>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
