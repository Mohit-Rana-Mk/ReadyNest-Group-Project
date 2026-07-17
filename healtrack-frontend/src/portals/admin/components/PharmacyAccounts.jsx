import React, { useState, useEffect } from 'react';
import axiosClient from '../../../api/axiosClient';
import {
  FlaskConical, Plus, Trash2, RefreshCw, ShieldCheck, ShieldOff,
  Eye, EyeOff, X, Loader2, CheckCircle2, AlertCircle, User, Mail, Phone, Lock
} from 'lucide-react';

export default function PharmacyAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [newPass, setNewPass] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/admin/pharmacy-accounts');
      setAccounts(res.data.data || []);
    } catch {
      showToast('Failed to load pharmacy accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axiosClient.post('/admin/pharmacy-accounts', form);
      showToast('Pharmacy account created successfully!');
      setShowForm(false);
      setForm({ name: '', email: '', phone: '', password: '' });
      fetchAccounts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create account', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (acc) => {
    const newStatus = acc.status === 'Active' ? 'Suspended' : 'Active';
    try {
      await axiosClient.post(`/admin/pharmacy-accounts/${acc.id}/status`, { status: newStatus });
      showToast(`Account ${newStatus === 'Active' ? 'activated' : 'suspended'}.`);
      fetchAccounts();
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (acc) => {
    if (!window.confirm(`Delete pharmacy account "${acc.name}"? This cannot be undone.`)) return;
    try {
      await axiosClient.delete(`/admin/pharmacy-accounts/${acc.id}`);
      showToast('Account deleted.');
      fetchAccounts();
    } catch {
      showToast('Failed to delete account', 'error');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axiosClient.post(`/admin/pharmacy-accounts/${resetTarget.id}/reset-password`, { newPassword: newPass });
      showToast('Password reset successfully!');
      setResetTarget(null);
      setNewPass('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset password', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-bold transition-all ${
          toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">Pharmacy Accounts</h2>
            <p className="text-xs text-slate-400 font-medium">Standalone pharmacy portals — not tied to any clinic</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow-violet-200/60"
        >
          <Plus className="w-4 h-4" />
          New Pharmacy Account
        </button>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 relative animate-fadeIn">
            <button onClick={() => setShowForm(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Create Pharmacy Account</h3>
                <p className="text-[10px] text-slate-400 font-semibold">This account is independent of any clinic</p>
              </div>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              {[
                { icon: User, label: 'Full Name', key: 'name', type: 'text', placeholder: 'e.g. City Pharmacy' },
                { icon: Mail, label: 'Email Address', key: 'email', type: 'email', placeholder: 'pharmacy@example.com' },
                { icon: Phone, label: 'Phone Number', key: 'phone', type: 'text', placeholder: '+91XXXXXXXXXX' },
                { icon: Lock, label: 'Password', key: 'password', type: 'password', placeholder: 'Min 6 characters' },
              ].map(({ icon: Icon, label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">{label}</label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type={type}
                      value={form[key]}
                      onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-300 outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                </div>
              ))}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {submitting ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-7 relative animate-fadeIn">
            <button onClick={() => { setResetTarget(null); setNewPass(''); }} className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black text-slate-800 mb-1">Reset Password</h3>
            <p className="text-xs text-slate-400 font-medium mb-5">For: <span className="text-slate-600 font-bold">{resetTarget.name}</span></p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type={showPass ? 'text' : 'password'}
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-300 outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {submitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Accounts Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-violet-500" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-400 mb-4">
              <FlaskConical className="w-7 h-7" />
            </div>
            <p className="text-sm font-black text-slate-700">No Pharmacy Accounts Yet</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Click "New Pharmacy Account" to create one.</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Name', 'Email', 'Phone', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {accounts.map(acc => (
                <tr key={acc.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-4 font-bold text-slate-800">{acc.name}</td>
                  <td className="px-5 py-4 text-slate-500">{acc.email}</td>
                  <td className="px-5 py-4 text-slate-500">{acc.phone}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${
                      acc.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-600'
                    }`}>
                      {acc.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-400">
                    {new Date(acc.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleStatus(acc)}
                        title={acc.status === 'Active' ? 'Suspend' : 'Activate'}
                        className={`p-1.5 rounded-lg transition ${
                          acc.status === 'Active'
                            ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {acc.status === 'Active' ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => setResetTarget(acc)}
                        title="Reset Password"
                        className="p-1.5 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(acc)}
                        title="Delete Account"
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
