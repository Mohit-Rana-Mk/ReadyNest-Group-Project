import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';
import { Footer } from '../components/ui/Footer';
import {
    Activity,
    Calendar,
    MessageSquare,
    BarChart3,
    CreditCard,
    FolderOpen,
    ShieldCheck,
    Zap,
    Brain,
    Cloud,
    Stethoscope,
    UserSquare2,
    User,
    ShieldAlert,
    ChevronDown,
    ArrowRight,
    Menu,
    X
} from 'lucide-react';

const GithubIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a5.5 5.5 0 0 0-1.5-3.8 5.4 5.4 0 0 0-.1-3.8s-1.2-.4-3.9 1.4a12.8 12.8 0 0 0-7 0C6.2 1.4 5 1.8 5 1.8a5.4 5.4 0 0 0-.1 3.8A5.5 5.5 0 0 0 3 9.4c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4"></path>
  </svg>
);

const COLORS = {
    primary: '#2563EB',
    secondary: '#3B82F6',
    accent: '#06B6D4',
    success: '#22C55E',
    background: '#F8FAFC',
    dark: '#0F172A'
};

export default function Landing() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
    const y2 = useTransform(scrollY, [0, 1000], [0, -200]);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fadeUpVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
            {/* NAVBAR */}
            <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="HealTrack" className="w-9 h-9 object-contain rounded-xl shadow-sm" />
                        <span className="text-xl font-extrabold tracking-tight text-slate-900">HealTrack</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
                        <a href="#features" className="hover:text-blue-600 transition">Features</a>
                        <a href="#how-it-works" className="hover:text-blue-600 transition">How It Works</a>
                        <a href="#ai" className="hover:text-blue-600 transition">AI Engine</a>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/login" className="text-slate-600 font-semibold hover:text-blue-600 transition">Log in</Link>
                        <Link to="/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-semibold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5">
                            Get Started
                        </Link>
                    </div>
                    <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </nav>

            {/* MOBILE MENU */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden"
                    >
                        <div className="flex flex-col gap-6 text-lg font-bold text-slate-800">
                            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
                            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
                            <a href="#ai" onClick={() => setMobileMenuOpen(false)}>AI Engine</a>
                            <Link to="/login" className="mt-4 py-3 bg-slate-100 rounded-xl text-center">Log In</Link>
                            <Link to="/signup" className="py-3 bg-blue-600 text-white rounded-xl text-center shadow-md">Get Started</Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HERO SECTION */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 right-0 w-3/4 h-[600px] bg-gradient-to-bl from-blue-100/60 to-cyan-50/40 rounded-bl-full -z-10 blur-3xl" />
                <div className="absolute top-40 -left-20 w-96 h-96 bg-blue-50/50 rounded-full -z-10 blur-3xl" />

                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                    <motion.div 
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="space-y-8"
                    >
                        <motion.div variants={fadeUpVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-bold text-xs tracking-wide uppercase border border-blue-100">
                            <Activity className="w-4 h-4" />
                            Trusted by Clinics
                        </motion.div>
                        <motion.variants variants={fadeUpVariants}>
                            <h1 className="text-4xl md:text-7xl font-extrabold text-[#0F172A] leading-tight tracking-tight">
                                Smarter Healthcare. <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                                    Better Patient Care.
                                </span>
                            </h1>
                        </motion.variants>
                        <motion.p variants={fadeUpVariants} className="text-lg md:text-xl text-slate-600 max-w-lg leading-relaxed">
                            AI-powered healthcare management platform for clinics, hospitals, doctors, and patients. Secure, fast, and remarkably easy to use.
                        </motion.p>
                        <motion.div variants={fadeUpVariants} className="flex flex-wrap items-center gap-4">
                            <Link to="/signup" className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-blue-500/20 transition-all transform hover:-translate-y-1 flex items-center gap-2">
                                Get Started <ArrowRight className="w-5 h-5" />
                            </Link>
                            <a href="#how-it-works" className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-8 py-4 rounded-full font-bold text-lg shadow-sm hover:shadow-md transition-all">
                                Book Demo
                            </a>
                        </motion.div>
                        <motion.div variants={fadeUpVariants} className="flex items-center gap-6 text-sm font-semibold text-slate-500 pt-4">
                            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-500" /> Secure</span>
                            <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500" /> Fast</span>
                            <span className="flex items-center gap-2"><Cloud className="w-4 h-4 text-blue-500" /> Cloud Based</span>
                        </motion.div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="relative lg:h-[600px] flex items-center justify-center"
                    >
                        {/* Abstract Hero Visual */}
                        <div className="relative w-full max-w-[280px] sm:max-w-[320px] md:max-w-md mx-auto aspect-square rounded-full bg-gradient-to-tr from-blue-100 to-cyan-50 shadow-inner overflow-visible">
                            {/* Floating Appointment Card */}
                            <motion.div 
                                style={{ y: y1 }}
                                className="absolute top-4 md:top-10 -left-4 md:-left-10 bg-white/90 backdrop-blur-xl p-3 md:p-4 rounded-2xl shadow-2xl border border-white/50 z-20 flex items-center gap-3 md:gap-4 scale-90 md:scale-100 origin-top-left"
                            >
                                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Appointment Confirmed</p>
                                    <p className="text-sm font-extrabold text-slate-800">Today, 10:30 AM</p>
                                    <p className="text-xs font-semibold text-slate-500">Dr. Rahul Sharma</p>
                                </div>
                            </motion.div>

                            {/* Floating AI Card */}
                            <motion.div 
                                style={{ y: y2 }}
                                className="absolute bottom-10 md:bottom-20 -right-4 md:-right-10 bg-[#0F172A]/90 backdrop-blur-xl p-3 md:p-4 rounded-2xl shadow-2xl border border-white/10 z-20 flex items-center gap-3 md:gap-4 scale-90 md:scale-100 origin-bottom-right"
                            >
                                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                                    <Brain className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-cyan-400 uppercase">AI Prediction</p>
                                    <p className="text-lg font-extrabold text-white">92% <span className="text-xs font-medium text-slate-400">Confidence</span></p>
                                </div>
                            </motion.div>
                            
                            {/* Floating Analytics Card */}
                            <motion.div 
                                animate={{ y: [0, -15, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                                className="absolute -bottom-4 md:-bottom-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-1/4 bg-white/90 backdrop-blur-xl p-3 md:p-4 rounded-2xl shadow-2xl border border-white/50 z-20 flex items-center gap-3 md:gap-4 scale-90 md:scale-100 origin-bottom"
                            >
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <UserSquare2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Today's Patients</p>
                                    <div className="flex items-end gap-2">
                                        <p className="text-xl font-extrabold text-slate-800 leading-none">48</p>
                                        <p className="text-xs font-bold text-green-500">+12%</p>
                                    </div>
                                </div>
                            </motion.div>

                            <img src="/logo.png" alt="HealTrack" className="absolute inset-0 m-auto w-1/2 h-1/2 object-contain drop-shadow-2xl opacity-90" />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* TRUSTED STATS */}
            <section className="py-10 bg-white border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-4 md:gap-8 md:divide-x divide-slate-100">
                        {[ 
                            { label: 'Lines of Code', value: 15000, suffix: '+' },
                            { label: 'Core Features', value: 25, suffix: '+' },
                            { label: 'Beta Testers', value: 10, suffix: '+' },
                            { label: 'Uptime', value: 99, suffix: '%' }
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <h3 className="text-3xl md:text-4xl font-extrabold text-[#2563EB]">
                                    <CountUp end={stat.value} decimals={stat.decimals || 0} duration={2.5} enableScrollSpy scrollSpyOnce />
                                    {stat.suffix}
                                </h3>
                                <p className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURES GRID */}
            <section id="features" className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Everything you need to run a modern clinic</h2>
                        <p className="text-slate-600 text-lg">Comprehensive tools designed for efficiency, built for care.</p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[ 
                            { icon: Brain, title: 'AI Disease Prediction', desc: 'Predict potential health risks instantly using our advanced machine learning models.', color: 'bg-cyan-50 text-cyan-600' },
                            { icon: Calendar, title: 'Smart Appointments', desc: 'Effortless scheduling with automated reminders and waitlist management.', color: 'bg-blue-50 text-blue-600' },
                            { icon: MessageSquare, title: 'Video Consultation', desc: 'Secure, high-quality telehealth integrated directly into your workflow.', color: 'bg-purple-50 text-purple-600' },
                            { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Real-time insights into clinic performance, revenue, and patient demographics.', color: 'bg-rose-50 text-rose-600' },
                            { icon: CreditCard, title: 'Digital Payments', desc: 'Seamless invoicing and integrated payment gateways for walk-in and online patients.', color: 'bg-green-50 text-green-600' },
                            { icon: FolderOpen, title: 'Electronic Medical Records', desc: 'Centralized, secure access to patient histories, labs, and digital prescriptions.', color: 'bg-amber-50 text-amber-600' }
                        ].map((feature, idx) => (
                            <motion.div 
                                key={idx}
                                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                                className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-slate-100 transition-shadow"
                            >
                                <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6`}>
                                    <feature.icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* DASHBOARD SHOWCASE (SWIPER) */}
            <section className="py-20 bg-slate-900 text-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Powerful Admin Dashboards</h2>
                    <p className="text-slate-400 text-lg">Monitor, manage, and optimize your entire clinic operation from one place.</p>
                </div>
                
                <div className="w-full max-w-6xl mx-auto px-4">
                    <Swiper
                        modules={[Autoplay, Pagination, EffectCoverflow]}
                        effect="coverflow"
                        grabCursor={true}
                        centeredSlides={true}
                        slidesPerView={'auto'}
                        coverflowEffect={{
                            rotate: 5,
                            stretch: 0,
                            depth: 100,
                            modifier: 2,
                            slideShadows: true,
                        }}
                        pagination={true}
                        autoplay={{ delay: 3000, disableOnInteraction: false }}
                        className="w-full py-10"
                    >
                        {[1,2,3].map((item) => (
                            <SwiperSlide key={item} className="max-w-4xl">
                                <div className="aspect-[16/9] bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl flex items-center justify-center overflow-hidden relative">
                                    {/* Placeholder for actual screenshots */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 opacity-80" />
                                    <div className="z-10 text-center">
                                        <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                        <p className="text-slate-400 font-bold tracking-widest uppercase">Dashboard View {item}</p>
                                        <p className="text-xs text-slate-500 mt-2">(Replace with actual screenshot)</p>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </section>

            {/* HOW IT WORKS (TIMELINE) */}
            <section id="how-it-works" className="py-24 px-6 bg-white">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">How HealTrack Works</h2>
                        <p className="text-slate-600 text-lg">A streamlined journey from registration to prescription.</p>
                    </div>

                    <div className="space-y-12 relative">
                        <div className="absolute left-[27px] md:left-1/2 top-0 bottom-0 w-1 bg-blue-100 -translate-x-1/2 rounded-full" />
                        
                        {[ 
                            { step: 1, title: 'Register Clinic', desc: 'Sign up and configure your clinic settings, timings, and departments.' },
                            { step: 2, title: 'Add Doctors', desc: 'Onboard your medical staff and set their availability schedules.' },
                            { step: 3, title: 'Book Appointment', desc: 'Patients book slots via the mobile-friendly web app seamlessly.' },
                            { step: 4, title: 'Consultation', desc: 'In-person or secure video consultation with access to full EMR.' },
                            { step: 5, title: 'Digital Prescription', desc: 'Generate and send PDF prescriptions and pharmacy bills instantly.' }
                        ].map((item, idx) => (
                            <motion.div 
                                key={idx}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-100px" }}
                                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: idx * 0.1 } } }}
                                className={`relative flex flex-col md:flex-row gap-8 md:gap-16 items-start md:items-center ${idx % 2 === 0 ? 'md:flex-row-reverse text-left md:text-right' : 'text-left'}`}
                            >
                                <div className="flex-1 w-full" />
                                <div className="absolute left-0 md:left-1/2 -translate-x-1/2 w-14 h-14 bg-blue-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-black text-xl z-10">
                                    {item.step}
                                </div>
                                <div className="flex-1 w-full pl-20 md:pl-0">
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <h3 className="text-xl font-extrabold text-slate-900 mb-2">{item.title}</h3>
                                        <p className="text-slate-600">{item.desc}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* AI FEATURES */}
            <section id="ai" className="py-24 px-6 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs uppercase mb-6">
                                <Brain className="w-4 h-4" /> HealTrack AI
                            </div>
                            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
                                Next-generation <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">clinical intelligence.</span>
                            </h2>
                            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                                Empower your doctors with an AI assistant that analyzes symptoms, predicts risks, and provides smart triage recommendations before the patient even walks in.
                            </p>
                            <ul className="space-y-4">
                                {['Disease Prediction Models', 'Real-time Risk Assessment', 'Smart Triage Recommendations', 'Clinical Analytics Data'].map((li, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-300 font-semibold">
                                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        {li}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            {/* Glowing Card Effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-3xl blur-3xl opacity-20 animate-pulse" />
                            <div className="bg-[#1E293B] border border-slate-700 p-8 rounded-3xl shadow-2xl relative z-10">
                                <div className="flex items-center justify-between mb-8 border-b border-slate-700 pb-4">
                                    <h3 className="font-bold text-slate-300 flex items-center gap-2"><Activity className="w-5 h-5 text-cyan-400" /> Triage Analysis</h3>
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded">High Confidence</span>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-bold mb-2">Primary Suspect</p>
                                        <p className="text-2xl font-black text-white">Viral Pharyngitis</p>
                                        <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                                            <motion.div initial={{ width: 0 }} whileInView={{ width: '88%' }} viewport={{ once: true }} transition={{ duration: 1.5, ease: 'easeOut' }} className="h-full bg-cyan-500 rounded-full" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-800 p-4 rounded-xl">
                                            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Severity</p>
                                            <p className="text-lg font-black text-yellow-400">Moderate</p>
                                        </div>
                                        <div className="bg-slate-800 p-4 rounded-xl">
                                            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Contagion</p>
                                            <p className="text-lg font-black text-rose-400">High Risk</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* USER ROLES */}
            <section className="py-24 px-6 bg-[#F8FAFC]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Designed for everyone</h2>
                        <p className="text-slate-600 text-lg">Dedicated portals optimized for every role in the healthcare ecosystem.</p>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[ 
                            { icon: Stethoscope, title: 'Doctors', desc: 'Manage queues, view EMRs, and prescribe digitally.' },
                            { icon: User, title: 'Receptionists', desc: 'Handle walk-ins, billing, and appointment scheduling.' },
                            { icon: UserSquare2, title: 'Patients', desc: 'Book appointments, access records, and use AI triage.' },
                            { icon: ShieldAlert, title: 'Super Admins', desc: 'Oversee clinic networks, analytics, and billing setups.' }
                        ].map((role, idx) => (
                            <motion.div 
                                key={idx}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center cursor-pointer"
                            >
                                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6 text-blue-600">
                                    <role.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{role.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{role.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>


            {/* CTA SECTION */}
            <section className="py-24 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-600 z-0"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-800 z-0"></div>
                <div className="max-w-4xl mx-auto text-center text-white relative z-10">
                    <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Ready to modernize your healthcare?</h2>
                    <p className="text-blue-100 text-xl mb-10 max-w-2xl mx-auto">
                        Join hundreds of clinics already using HealTrack to streamline their operations and deliver better patient experiences.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/signup" className="w-full sm:w-auto bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
                            Start for Free
                        </Link>
                        <a href="mailto:contact@healtrack.com" className="w-full sm:w-auto bg-blue-700/50 hover:bg-blue-700 border border-blue-500 text-white px-8 py-4 rounded-full font-bold text-lg transition-all">
                            Contact Sales
                        </a>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <div className="bg-[#090D16] border-t border-slate-800/80 text-slate-400">
                <Footer />
            </div>
        </div>
    );
}
