import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, MessageSquare, Send, CheckCircle2, ArrowLeft, Heart, Sparkles, AlertCircle, ThumbsUp, MessageCircle } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { Footer } from '../components/ui/Footer';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'General Experience',
  'UI / UX Design',
  'Speed & Performance',
  'Feature Suggestion',
  'Bug / Issue'
];

export default function Feedback() {
  const { user } = useAuth();
  
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState('General Experience');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [recentFeedbacks, setRecentFeedbacks] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, avgRating: 5.0 });

  const fetchFeedbacks = async () => {
    try {
      const res = await axiosClient.get('/feedback');
      if (res.data && res.data.success) {
        setRecentFeedbacks(res.data.data || []);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please provide a feedback message before submitting.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axiosClient.post('/feedback', {
        rating,
        category,
        name: name.trim(),
        email: email.trim(),
        message: message.trim()
      });

      if (res.data && res.data.success) {
        setSubmitted(true);
        fetchFeedbacks();
      } else {
        throw new Error(res.data.message || 'Failed to submit feedback.');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col justify-between antialiased">
      {/* TOP NAVIGATION HEADER */}
      <header className="bg-gradient-to-r from-[#0B132B] via-[#1C2541] to-[#0B132B] text-white border-b border-white/10 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            <div className="h-4 w-px bg-white/20 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="HealTrack Logo" className="w-7 h-7 object-contain rounded-lg" />
              <span className="font-extrabold text-white text-base tracking-tight">HealTrack <span className="text-cyan-400">Feedback</span></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/10 border border-white/15 rounded-full text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Your Voice Matters
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-5xl mx-auto px-6 py-10 w-full space-y-10 flex-1">
        
        {/* HERO TITLE SECTION */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-sm">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            We'd Love Your Feedback
          </h1>
          <p className="text-sm md:text-base text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
            Help us shape the future of HealTrack. Rate your experience and share your thoughts to improve healthcare workflows for everyone.
          </p>
        </div>

        {/* FEEDBACK FORM & COMMUNITY METRICS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* FEEDBACK FORM CARD (7 COLS) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200/80 relative">
            
            {submitted ? (
              <div className="py-12 text-center space-y-4 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Thank You for Your Feedback!</h3>
                <p className="text-xs md:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Your review has been successfully logged. Our engineering and design teams review every message to improve HealTrack.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setMessage('');
                    setRating(5);
                  }}
                  className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md border-none cursor-pointer"
                >
                  Submit Another Feedback
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {error && (
                  <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* 1. STAR RATING SELECTOR */}
                <div className="space-y-2 text-center pb-2 border-b border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Overall Experience Rating
                  </label>
                  <div className="flex items-center justify-center gap-2 py-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = (hoverRating || rating) >= star;
                      return (
                        <button
                          type="button"
                          key={star}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="p-1.5 focus:outline-none transition-transform hover:scale-125 border-none bg-transparent cursor-pointer"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              active
                                ? 'fill-amber-400 text-amber-400 drop-shadow-md'
                                : 'text-slate-300 fill-slate-100'
                            } transition-colors`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs font-extrabold text-amber-600 block">
                    {rating === 5 && '⭐⭐⭐⭐⭐ Outstanding!'}
                    {rating === 4 && '⭐⭐⭐⭐ Very Good'}
                    {rating === 3 && '⭐⭐⭐ Good / Average'}
                    {rating === 2 && '⭐⭐ Needs Improvement'}
                    {rating === 1 && '⭐ Disappointing'}
                  </span>
                </div>

                {/* 2. CATEGORY SELECTION PILLS */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Feedback Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => {
                      const isSelected = category === cat;
                      return (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => setCategory(cat)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. NAME & EMAIL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dr. Alex Vance"
                      className="w-full bg-[#f8f9fa] border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@clinic.com"
                      className="w-full bg-[#f8f9fa] border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition shadow-sm"
                    />
                  </div>
                </div>

                {/* 4. DETAILED MESSAGE */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Detailed Feedback & Suggestions <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you love, features you'd like to see, or issues you encountered..."
                    className="w-full bg-[#f8f9fa] border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition shadow-sm resize-none"
                    required
                  />
                </div>

                {/* SUBMIT BUTTON */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold uppercase tracking-wider py-4 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Submitting Feedback...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* COMMUNITY METRICS & RECENT REVIEWS (5 COLS) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* RATING METRIC CARD */}
            <div className="bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#0B132B] rounded-3xl p-6 text-white border border-white/10 shadow-xl space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block">
                Platform Satisfaction
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-white">{metrics.avgRating}</span>
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Based on <span className="font-bold text-white">{metrics.total}</span> user feedback submissions across clinic admins, doctors, pharmacy staff, and patients.
              </p>
            </div>

            {/* RECENT REVIEWS BOARD */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Recent User Feedback</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Community Board</span>
              </div>

              {recentFeedbacks.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No public reviews yet. Be the first to leave one!</p>
              ) : (
                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                  {recentFeedbacks.slice(0, 5).map((item) => (
                    <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{item.user_name || 'Anonymous'}</span>
                        <div className="flex text-amber-400">
                          {[...Array(item.rating || 5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed italic">
                        "{item.message}"
                      </p>
                      <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block">
                        {item.category}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
