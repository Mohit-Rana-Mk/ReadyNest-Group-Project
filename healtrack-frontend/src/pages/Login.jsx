import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { LogIn, Heart, Brain, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { auth } from '../api/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export default function Login() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleGoogleSignIn = async () => {
        setError('');
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const idToken = await result.user.getIdToken();
            
            const res = await axiosClient.post('/auth/firebase-auth', { idToken });
            if (res.data.success) {
                login(res.data.data.user, res.data.data.token);
                
                switch (res.data.data.user.role) {
                    case 'SuperAdmin': navigate('/admin'); break;
                    case 'ClinicAdmin': navigate('/clinic'); break;
                    case 'Doctor': navigate('/doctor'); break;
                    case 'ClinicStaff': navigate('/reception'); break;
                    case 'Patient': navigate('/patient'); break;
                    default: navigate('/unauthorized');
                }
            }
        } catch (err) {
            console.error("Google Sign-In Error:", err);
            setError(err.response?.data?.message || err.message || 'Failed to sign in with Google');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const firebaseUserCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await firebaseUserCredential.user.getIdToken();
            const res = await axiosClient.post('/auth/firebase-auth', { idToken });
            if (res.data.success) {
                login(res.data.data.user, res.data.data.token);
                switch (res.data.data.user.role) {
                    case 'SuperAdmin': navigate('/admin'); break;
                    case 'ClinicAdmin': navigate('/clinic'); break;
                    case 'Doctor': navigate('/doctor'); break;
                    case 'ClinicStaff': navigate('/reception'); break;
                    case 'Patient': navigate('/patient'); break;
                    default: navigate('/unauthorized');
                }
                return;
            }
        } catch (firebaseErr) {
            console.log("Firebase login failed, trying fallback to custom auth:", firebaseErr.message);
        }

        try {
            const res = await axiosClient.post('/auth/login', { email, password });
            if (res.data.success) {
                login(res.data.data.user, res.data.data.token);
                
                // Route to appropriate portal
                switch (res.data.data.user.role) {
                    case 'SuperAdmin':
                        navigate('/admin');
                        break;
                    case 'ClinicAdmin':
                        navigate('/clinic');
                        break;
                    case 'Doctor':
                        navigate('/doctor');
                        break;
                    case 'ClinicStaff':
                        navigate('/reception');
                        break;
                    case 'Patient':
                        navigate('/patient');
                        break;
                    default:
                        navigate('/unauthorized');
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to login');
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
                        <Card className="w-full max-w-[440px] p-8 sm:p-10 rounded-[32px] border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                            <div className="mb-6">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                                    Sign in
                                </h2>
                                <p className="mt-1 text-xs text-slate-400 leading-relaxed font-medium">
                                    Welcome back! Enter your credentials to access your portal dashboard.
                                </p>
                            </div>

                            <form className="space-y-5" onSubmit={handleSubmit}>
                                {error && (
                                    <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl">
                                        <p className="text-xs font-bold text-rose-700">{error}</p>
                                    </div>
                                )}
                                
                                <div>
                                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-[#eef2f6] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700 placeholder-slate-400"
                                        placeholder="khina@gmail.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-[#eef2f6] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700 placeholder-slate-400"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full gap-2 py-3.5 bg-[#6366f1] hover:bg-[#5558e6] rounded-xl font-bold text-xs uppercase tracking-widest border-none"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                Loading...
                                            </>
                                        ) : (
                                            <>
                                                Sign In
                                                <LogIn className="w-4 h-4" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                            
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
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                variant="outline"
                                className="w-full gap-2 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex justify-center items-center"
                            >
                                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                    <path
                                        fill="#EA4335"
                                        d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.465 0-6.273-2.808-6.273-6.273s2.808-6.273 6.273-6.273c1.558 0 2.978.579 4.072 1.53l3.02-3.02C18.995 1.59 15.823 0 12.24 0 5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c6.82 0 12.24-5.42 12.24-12.24 0-.785-.098-1.57-.275-2.28H12.24z"
                                    />
                                </svg>
                                Sign In with Google
                            </Button>
                            
                            <div className="mt-8 text-center text-xs font-bold text-slate-400">
                                New to HealTrack?{' '}
                                <Link to="/signup" className="text-indigo-600 hover:text-indigo-700 hover:underline">
                                    Create an account
                                </Link>
                            </div>
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    );
}
