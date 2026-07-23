import React, { useState } from 'react';
import { X, LifeBuoy, Send, CheckCircle2, AlertCircle, Check } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { Button } from './Button';
import { CustomDropdown } from './CustomDropdown';

const CATEGORIES = [
  'Appointment Issue',
  'Payment & Refund',
  'Login Problem',
  'Doctor Portal',
  'Reception Portal',
  'Patient Records',
  'Bug Report',
  'Feature Request',
  'Technical Support',
  'Other'
];

const CATEGORY_OPTIONS = CATEGORIES.map(cat => ({ value: cat, label: cat }));

const PRIORITIES = [
  { id: 'Low', label: 'Low', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200' },
  { id: 'Medium', label: 'Medium', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200' },
  { id: 'High', label: 'High', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200' },
  { id: 'Urgent', label: 'Urgent', color: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200' }
];

export default function RaiseTicketModal({ isOpen, onClose, portalUsed = 'Portal Workstation' }) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Technical Support');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError('Please provide a subject and description for your ticket.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axiosClient.post('/support/tickets', {
        subject: subject.trim(),
        category,
        priority,
        description: description.trim(),
        portalUsed
      });

      if (res.data && res.data.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setSubject('');
          setDescription('');
          setPriority('Medium');
          setCategory('Technical Support');
          onClose();
        }, 1800);
      } else {
        throw new Error(res.data.message || 'Failed to submit ticket');
      }
    } catch (err) {
      console.error('Error submitting support ticket:', err);
      setError(err.response?.data?.message || 'Failed to submit ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition border-none bg-transparent cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <LifeBuoy className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Raise New Ticket</h3>
              <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-full text-[10px] font-bold tracking-wider uppercase">
                {portalUsed}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Submit your request to the Super Admin support desk for assistance.
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Ticket Submitted!</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Your support ticket has been received. Super Admin will review your request.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Subject <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your issue..."
                className="w-full bg-[#f8f9fa] border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition shadow-sm"
                required
              />
            </div>

            {/* Issue Category Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Issue Category <span className="text-rose-500">*</span>
              </label>
              <CustomDropdown
                options={CATEGORY_OPTIONS}
                value={category}
                onChange={setCategory}
                className="w-full bg-[#f8f9fa] border border-slate-200 rounded-2xl h-11 focus:border-indigo-500 focus:bg-white shadow-sm"
                renderOption={(option) => (
                  <div className="flex items-center justify-between py-0.5">
                    <span>{option.label}</span>
                    {category === option.value && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                )}
              />
            </div>

            {/* Priority Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Priority Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PRIORITIES.map((p) => {
                  const isSelected = priority === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setPriority(p.id)}
                      className={`py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                          : `${p.color}`
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detailed Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Detailed Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about what went wrong or what you need help with..."
                className="w-full bg-[#f8f9fa] border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition shadow-sm resize-none"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Submitting Ticket...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Ticket
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
