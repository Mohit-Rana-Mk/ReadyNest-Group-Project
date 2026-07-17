import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import {
  FlaskConical, Lock, Mail, Eye, EyeOff, LogIn,
  Pill, Package, ClipboardList, BarChart3, ArrowLeft
} from 'lucide-react';

export default function PharmacyLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axiosClient.post('/auth/login', { email, password });
      if (res.data.success) {
        const user = res.data.data.user;
        if (user.role !== 'Medicine') {
          setError('Access denied. This portal is for pharmacy staff only.');
          return;
        }
        login(user, res.data.data.token);
        navigate('/medicine');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: ClipboardList, title: 'Prescription Queue', desc: 'View and process doctor-sent prescriptions in real time.' },
    { icon: Package, title: 'Inventory Management', desc: 'Track stock levels, expiry alerts, and supplier details.' },
    { icon: Pill, title: 'Billing & Dispensing', desc: 'Generate bills with Cash or Razorpay online payment.' },
    { icon: BarChart3, title: 'Reports & Audit', desc: 'Full transaction history, audit trail and analytics.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] flex flex-col lg:flex-row overflow-hidden">

      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-14 relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-20 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center">
              <FlaskConical className="w-6 h-6 text-violet-300" />
            </div>
            <div>
              <h1 className="text-white font-black text-lg tracking-tight leading-none">HealTrack</h1>
              <span className="text-violet-400 text-[9px] font-extrabold tracking-widest uppercase">Pharmacy Suite</span>
            </div>
          </div>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight">
              Your complete<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-indigo-300">
                pharmacy command center.
              </span>
            </h2>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-sm font-medium">
              Streamline dispensing, manage inventory, and track every transaction from a single intelligent platform.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/8 transition"
              >
                <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center mb-2.5">
                  <Icon className="w-4 h-4 text-violet-300" />
                </div>
                <h4 className="text-white text-[11px] font-extrabold uppercase tracking-wider">{title}</h4>
                <p className="text-slate-500 text-[10px] font-medium mt-1 leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-slate-600 text-[10px] font-medium">
          © {new Date().getFullYear()} HealTrack AI · Pharmacy Portal v2.0
        </p>
      </div>

      {/* Right Login Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[420px]">

          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-violet-300" />
            </div>
            <div>
              <h1 className="text-white font-black text-base tracking-tight leading-none">HealTrack</h1>
              <span className="text-violet-400 text-[8px] font-extrabold tracking-widest uppercase">Pharmacy Suite</span>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
            <div className="mb-7">
              <h2 className="text-2xl font-black text-white tracking-tight">Pharmacy Sign In</h2>
              <p className="text-slate-400 text-xs font-medium mt-1.5">
                Restricted to authorized pharmacy staff accounts only.
              </p>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="pharmacy@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-semibold placeholder-slate-600 outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-semibold placeholder-slate-600 outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-lg shadow-violet-900/40"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Access Pharmacy Portal
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-transparent px-3 text-[10px] font-bold tracking-wider text-slate-600 uppercase">
                  Not a pharmacy account?
                </span>
              </div>
            </div>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 w-full py-3 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-white/20 transition text-xs font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to HealTrack Login
            </Link>
          </div>

          {/* Credential hint (dev only) */}
          <p className="text-center text-slate-700 text-[10px] font-medium mt-4">
            Accounts created by the Super Admin · Contact your administrator for access
          </p>
        </div>
      </div>
    </div>
  );
}
