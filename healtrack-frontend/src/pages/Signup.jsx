import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Building, Heart, Brain, Activity, FlaskConical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { auth } from '../api/firebase';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export default function Signup() {
    const { t } = useTranslation();
    const [signupType, setSignupType] = useState('patient'); // 'patient' | 'clinic' | 'pharmacy'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    // Patient Fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
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

    const validateEmailFormat = (em) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(em);
    };

    const validatePasswordStrength = (pass) => {
        if (pass.length < 6) return false;
        const hasUppercase = /[A-Z]/.test(pass);
        const hasLowercase = /[a-z]/.test(pass);
        const hasNumber = /[0-9]/.test(pass);
        const hasSpecial = /[^A-Za-z0-9]/.test(pass);
        return hasUppercase && hasLowercase && hasNumber && hasSpecial;
    };

    const validatePhoneFormat = (code, num) => {
        const cleanNum = num.replace(/\D/g, '');
        if (code === '+91' || code === '+1' || code === '+44') {
            return cleanNum.length === 10;
        }
        if (code === '+61' || code === '+971' || code === '+966') {
            return cleanNum.length === 9;
        }
        return cleanNum.length >= 7 && cleanNum.length <= 15;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        // Validate Email
        if (email && !validateEmailFormat(email)) {
            setError('Invalid email address format.');
            setLoading(false);
            return;
        }

        // Validate Password
        if (!validatePasswordStrength(password)) {
            setError('Password must consist of at least 6 characters, containing 1 uppercase letter, 1 lowercase letter, 1 special character, and 1 numeric value.');
            setLoading(false);
            return;
        }

        // Validate Phone format
        if (!validatePhoneFormat(countryCode, phone)) {
            const expectedLen = ['+91', '+1', '+44'].includes(countryCode) ? '10' : '9';
            setError(`Phone number must consist of exactly ${expectedLen} digits for country code ${countryCode}.`);
            setLoading(false);
            return;
        }

        const combinedPhone = `${countryCode}${phone.replace(/\D/g, '')}`;

        if (signupType === 'patient') {
            const today = new Date();
            const birthDate = new Date(dob);
            if (birthDate > today) {
                setError('Date of birth cannot be a future date.');
                setLoading(false);
                return;
            }
        }

        try {
            if (signupType === 'clinic') {
                const payload = {
                    clinic_name: clinicName,
                    license_number: license,
                    address,
                    city,
                    admin_name: name,
                    admin_email: email,
                    admin_phone: combinedPhone,
                    password
                };
                const res = await axiosClient.post('/auth/register-clinic', payload);
                if (res.data.success) {
                    setSuccessMessage(res.data.message);
                }
            } else if (signupType === 'pharmacy') {
                const payload = {
                    name,
                    email,
                    phone: combinedPhone,
                    password
                };
                const res = await axiosClient.post('/auth/register-pharmacy', payload);
                if (res.data.success) {
                    login(res.data.data.user, res.data.data.token);
                    navigate('/medicine');
                }
            } else {
                let idToken;
                try {
                    const firebaseCredential = await createUserWithEmailAndPassword(auth, email, password);
                    idToken = await firebaseCredential.user.getIdToken();
                } catch (firebaseErr) {
                    console.error("Firebase signup failed:", firebaseErr);
                    setError(firebaseErr.message || 'Firebase registration failed');
                    setLoading(false);
                    return;
                }

                const payload = {
                    idToken,
                    additionalDetails: {
                        name,
                        phone: combinedPhone,
                        dob,
                        gender,
                        blood_group: bloodGroup
                    }
                };
                const res = await axiosClient.post('/auth/firebase-auth', payload);
                if (res.data.success) {
                    login(res.data.data.user, res.data.data.token);
                    navigate('/patient');
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to sign up');
        } finally {
            setLoading(false);
        }
    };


    const handleGoogleSignup = async () => {
        setError('');
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const idToken = await result.user.getIdToken();
            
            const payload = {
                idToken,
                additionalDetails: {
                    name: result.user.displayName || 'Google User',
                    phone: result.user.phoneNumber || ''
                }
            };
            const res = await axiosClient.post('/auth/firebase-auth', payload);
            if (res.data.success) {
                login(res.data.data.user, res.data.data.token);
                navigate('/patient');
            }
        } catch (err) {
            console.error("Google Sign-Up Error:", err);
            setError(err.response?.data?.message || err.message || 'Failed to sign up with Google');
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
                        <Card className="w-full max-w-[480px] p-8 sm:p-10 rounded-[32px] border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                            <div className="mb-6">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                                    Sign up
                                </h2>
                                <p className="mt-1 text-xs text-slate-400 leading-relaxed font-medium">
                                    Create a new patient account or register your healthcare clinic facility.
                                </p>
                            </div>

                             {/* Clinic / Patient / Pharmacy Switcher */}
                            <div className="flex bg-[#eef2f6] p-1 rounded-xl mb-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSignupType('patient')}
                                    className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-1 border-none ${signupType === 'patient' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600 bg-transparent'}`}
                                >
                                    <UserPlus className="w-3.5 h-3.5" /> Patient
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSignupType('clinic')}
                                    className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-1 border-none ${signupType === 'clinic' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600 bg-transparent'}`}
                                >
                                    <Building className="w-3.5 h-3.5" /> Clinic
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSignupType('pharmacy')}
                                    className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-1 border-none ${signupType === 'pharmacy' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600 bg-transparent'}`}
                                >
                                    <FlaskConical className="w-3.5 h-3.5" /> Pharmacy
                                </Button>
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
                                <>
                                    <form className="space-y-4" onSubmit={handleSubmit}>

                                    {signupType === 'clinic' && (
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
                                        <h3 className="text-xs font-extrabold text-slate-800 border-b pb-2 pt-2 uppercase tracking-wider">
                                            {signupType === 'clinic' ? 'Admin Account Details' : signupType === 'pharmacy' ? 'Pharmacy Details' : 'Personal Details'}
                                        </h3>
                                        
                                        <div>
                                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                                                {signupType === 'pharmacy' ? 'Pharmacy Name' : 'Full Name'}
                                            </label>
                                            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 bg-[#eef2f6] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700 placeholder-slate-400" placeholder={signupType === 'pharmacy' ? 'e.g. Apex Pharmacy' : 'John Doe'} />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                                                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-[#eef2f6] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700 placeholder-slate-400" placeholder="john@example.com" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Phone Number</label>
                                                <div className="flex gap-2">
                                                    <select
                                                        value={countryCode}
                                                        onChange={(e) => setCountryCode(e.target.value)}
                                                        className="px-3 py-3 bg-[#eef2f6] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700"
                                                    >
                                                        <option value="+91">🇮🇳 +91</option>
                                                        <option value="+1">🇺🇸 +1</option>
                                                        <option value="+44">🇬🇧 +44</option>
                                                        <option value="+61">🇦🇺 +61</option>
                                                        <option value="+971">🇦🇪 +971</option>
                                                        <option value="+966">🇸🇦 +966</option>
                                                    </select>
                                                    <input
                                                        type="tel"
                                                        required
                                                        value={phone}
                                                        onChange={(e) => setPhone(e.target.value)}
                                                        className="flex-1 px-4 py-3 bg-[#eef2f6] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700 placeholder-slate-400"
                                                        placeholder="98765 43210"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {signupType === 'patient' && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Date of Birth</label>
                                                    <input type="date" required value={dob} max={new Date().toISOString().split('T')[0]} onChange={(e) => setDob(e.target.value)} className="w-full px-4 py-3 bg-[#eef2f6] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700 placeholder-slate-400" />
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
                                            <p className="mt-1 text-[10px] text-slate-400 leading-relaxed font-medium">
                                                Must be at least 6 characters, containing 1 uppercase, 1 lowercase, 1 number, and 1 special character.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full flex justify-center items-center gap-2 py-3.5 bg-[#6366f1] hover:bg-[#5558e6] rounded-xl font-bold text-xs uppercase tracking-widest border-none"
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                    Loading...
                                                </>
                                            ) : (
                                                signupType === 'clinic' ? 'Register Clinic' : signupType === 'pharmacy' ? 'Register Pharmacy' : 'Create Account'
                                            )}
                                        </Button>
                                    </div>
                                </form>

                                 {signupType === 'patient' && (
                                    <>
                                        <div className="relative my-6">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-slate-200"></div>
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-white px-3 text-[10px] font-extrabold tracking-wider text-slate-400">Or continue with</span>
                                            </div>
                                        </div>

                                        <Button
                                            type="button"
                                            onClick={handleGoogleSignup}
                                            disabled={loading}
                                            variant="outline"
                                            className="w-full gap-2 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex justify-center items-center"
                                        >
                                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                                <path
                                                    fill="#EA4335"
                                                    d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.34 0-6.05-2.71-6.05-6.05s2.71-6.05 6.05-6.05c1.47 0 2.82.53 3.88 1.405l2.922-2.922C18.665 3.03 15.65 2 12.24 2 6.58 2 2 6.58 2 12.24s4.58 10.24 10.24 10.24c5.795 0 10.254-4.074 10.254-10.24 0-.695-.08-1.355-.22-1.955H12.24z"
                                                />
                                            </svg>
                                            Sign Up with Google
                                        </Button>
                                    </>
                                )}
                            </>)}



                            <div className="mt-8 text-center text-xs font-bold text-slate-400">
                                Already have an account?{' '}
                                <Link to="/login" className="text-indigo-600 hover:text-indigo-700 hover:underline">
                                    Sign In
                                </Link>
                            </div>
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    );
}
