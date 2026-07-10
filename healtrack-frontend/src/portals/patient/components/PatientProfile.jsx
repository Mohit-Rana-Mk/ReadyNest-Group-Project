import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Lock, Shield, Activity, Camera, Check, AlertCircle, Save, Loader2 } from 'lucide-react';
import { fetchProfile, updateProfile, changePassword, uploadProfileImage } from '../../../api/patientApi';
import { Button } from '../../../components/ui/Button';

export default function PatientProfile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Profile fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [phoneNum, setPhoneNum] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState('Prefer Not to Say');
    const [bloodGroup, setBloodGroup] = useState('');
    const [emergencyContact, setEmergencyContact] = useState('');

    // Password fields
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

    const prefixes = ['+91', '+1', '+44', '+61', '+971', '+966'];

    const loadProfile = async () => {
        try {
            setLoading(true);
            const res = await fetchProfile();
            if (res.success && res.data) {
                const data = res.data;
                setProfile(data);
                setName(data.name || '');
                setEmail(data.email || '');
                setGender(data.gender || 'Prefer Not to Say');
                setBloodGroup(data.blood_group || '');
                setEmergencyContact(data.emergency_contact || '');
                
                // Format DOB for date input
                if (data.date_of_birth) {
                    const d = new Date(data.date_of_birth);
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    setDob(`${yyyy}-${mm}-${dd}`);
                } else {
                    setDob('');
                }

                // Split phone
                const phoneStr = data.phone || '';
                let matchedPrefix = '+91';
                let numberPart = '';
                for (const prefix of prefixes) {
                    if (phoneStr.startsWith(prefix)) {
                        matchedPrefix = prefix;
                        numberPart = phoneStr.slice(prefix.length);
                        break;
                    }
                }
                if (!numberPart) {
                    if (phoneStr.startsWith('+')) {
                        matchedPrefix = phoneStr.slice(0, 4);
                        numberPart = phoneStr.slice(4);
                    } else {
                        numberPart = phoneStr;
                    }
                }
                setCountryCode(matchedPrefix);
                setPhoneNum(numberPart.replace(/\D/g, ''));
            }
        } catch (err) {
            console.error('Failed to load profile:', err);
            setMessage({ type: 'error', text: 'Failed to load profile details.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    // Password validation flags
    const passLength = newPassword.length >= 6;
    const passUpper = /[A-Z]/.test(newPassword);
    const passLower = /[a-z]/.test(newPassword);
    const passNum = /[0-9]/.test(newPassword);
    const passSpecial = /[^A-Za-z0-9]/.test(newPassword);
    const passMatches = newPassword && newPassword === confirmPassword;

    const validatePhoneFormat = (code, num) => {
        const clean = num.replace(/\D/g, '');
        if (['+91', '+1', '+44'].includes(code)) {
            return clean.length === 10;
        }
        if (['+61', '+971', '+966'].includes(code)) {
            return clean.length === 9;
        }
        return clean.length >= 7 && clean.length <= 15;
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (!name.trim()) {
            setMessage({ type: 'error', text: 'Name is required.' });
            return;
        }

        // Email validation if not Google auth
        if (profile?.auth_provider !== 'google' && email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                setMessage({ type: 'error', text: 'Invalid email address format.' });
                return;
            }
        }

        // Phone validation
        if (!validatePhoneFormat(countryCode, phoneNum)) {
            const expected = ['+91', '+1', '+44'].includes(countryCode) ? '10' : '9';
            setMessage({ 
                type: 'error', 
                text: `Phone number must consist of exactly ${expected} digits for country code ${countryCode}.` 
            });
            return;
        }

        // DOB validation (not future date)
        if (dob) {
            const birthDate = new Date(dob);
            const today = new Date();
            if (birthDate > today) {
                setMessage({ type: 'error', text: 'Date of birth cannot be a future date.' });
                return;
            }
        }

        try {
            setSaving(true);
            const combinedPhone = `${countryCode}${phoneNum.replace(/\D/g, '')}`;
            const res = await updateProfile({
                name,
                email: profile?.auth_provider === 'google' ? profile.email : email,
                phone: combinedPhone,
                date_of_birth: dob || null,
                gender,
                blood_group: bloodGroup || null,
                emergency_contact: emergencyContact || null
            });

            if (res.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully.' });
                loadProfile();
            } else {
                setMessage({ type: 'error', text: res.message || 'Failed to update profile.' });
            }
        } catch (err) {
            console.error('Update profile error:', err);
            setMessage({ 
                type: 'error', 
                text: err.response?.data?.message || 'Error occurred while updating profile.' 
            });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordMessage({ type: '', text: '' });

        if (!currentPassword || !newPassword) {
            setPasswordMessage({ type: 'error', text: 'Please fill in all password fields.' });
            return;
        }

        if (!passLength || !passUpper || !passLower || !passNum || !passSpecial) {
            setPasswordMessage({ type: 'error', text: 'New password does not meet the complexity requirements.' });
            return;
        }

        if (!passMatches) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }

        try {
            setPasswordSaving(true);
            const res = await changePassword({
                currentPassword,
                newPassword
            });

            if (res.success) {
                setPasswordMessage({ type: 'success', text: 'Password changed successfully.' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setPasswordMessage({ type: 'error', text: res.message || 'Failed to change password.' });
            }
        } catch (err) {
            console.error('Change password error:', err);
            setPasswordMessage({ 
                type: 'error', 
                text: err.response?.data?.message || 'Error occurred while updating password.' 
            });
        } finally {
            setPasswordSaving(false);
        }
    };

    const compressImage = (file, maxWidth, maxHeight, quality) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        },
                        'image/jpeg',
                        quality
                    );
                };
            };
        });
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            setMessage({ type: '', text: '' });

            // Compress the image to a lightweight 400x400 JPEG at 70% quality
            const compressedFile = await compressImage(file, 400, 400, 0.7);

            const formData = new FormData();
            formData.append('profile_image', compressedFile);

            const res = await uploadProfileImage(formData);
            if (res.success) {
                setMessage({ type: 'success', text: 'Profile picture updated successfully.' });
                loadProfile();
            } else {
                setMessage({ type: 'error', text: res.message || 'Failed to upload image.' });
            }
        } catch (err) {
            console.error('Photo upload error:', err);
            setMessage({ type: 'error', text: 'Failed to upload profile picture.' });
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 size={32} className="text-indigo-500 animate-spin" />
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-4">Loading Profile...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            {/* Top Banner & User Details Card */}
            <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-3xl p-6 md:p-8 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
                
                {/* Photo Picker */}
                <div className="relative group shrink-0">
                    <div className="w-28 h-28 rounded-full border-4 border-slate-700 overflow-hidden bg-slate-800 flex items-center justify-center relative shadow-inner">
                        {profile?.profile_image ? (
                            <img src={profile.profile_image} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-3xl font-black text-[#38bdf8]">
                                {name ? name.charAt(0).toUpperCase() : 'PT'}
                            </span>
                        )}
                        
                        {uploading && (
                            <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                            </div>
                        )}
                    </div>
                    
                    <label className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-[#7F3DEC] hover:bg-[#6c2ed2] text-white flex items-center justify-center cursor-pointer shadow-md transition-all group-hover:scale-105">
                        <Camera size={14} />
                        <input type="file" onChange={handlePhotoChange} className="hidden" accept="image/*" disabled={uploading} />
                    </label>
                </div>

                <div className="flex-1 text-center md:text-left space-y-2.5">
                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                        <h2 className="text-white text-xl md:text-2xl font-black tracking-tight">{profile?.name}</h2>
                        <span className="inline-block bg-[#1e293b] text-slate-400 border border-slate-700/60 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider self-center">
                            MRN: {profile?.mrn}
                        </span>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-semibold text-slate-300">
                        <span className="flex items-center gap-1.5"><Mail size={14} className="text-indigo-400" /> {profile?.email || 'No email specified'}</span>
                        <span className="flex items-center gap-1.5"><Phone size={14} className="text-indigo-400" /> {profile?.phone}</span>
                    </div>

                    {profile?.auth_provider === 'google' && (
                        <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-extrabold px-3 py-1.5 rounded-xl uppercase tracking-wider">
                            <Shield size={12} />
                            Signed in with Google
                        </div>
                    )}
                </div>
            </div>

            {/* Notifications / Feedback */}
            {message.text && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 border animate-in fade-in duration-200 ${
                    message.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                        : 'bg-rose-50 text-rose-800 border-rose-100'
                }`}>
                    {message.type === 'success' ? <Check size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-rose-600" />}
                    <p className="text-xs font-bold tracking-tight">{message.text}</p>
                </div>
            )}

            {/* Split Form View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: General Profile Form (7 cols) */}
                <form onSubmit={handleUpdateProfile} className="lg:col-span-7 bg-white border border-slate-100/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                        <User className="text-indigo-500 w-5 h-5" />
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Profile Information</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Name */}
                        <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your full name" 
                                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input 
                                    type="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email" 
                                    className={`w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm ${
                                        profile?.auth_provider === 'google' ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''
                                    }`}
                                    disabled={profile?.auth_provider === 'google'}
                                    required
                                />
                            </div>
                            {profile?.auth_provider === 'google' && (
                                <p className="text-[10px] text-emerald-600 font-bold tracking-tight">Your email is managed by your Google login profile.</p>
                            )}
                        </div>

                        {/* Phone Code & Number */}
                        <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                            <div className="flex gap-2">
                                <div className="w-28 relative">
                                    <select
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-3 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer"
                                    >
                                        <option value="+91">🇮🇳 +91</option>
                                        <option value="+1">🇺🇸 +1</option>
                                        <option value="+44">🇬🇧 +44</option>
                                        <option value="+61">🇦🇺 +61</option>
                                        <option value="+971">🇦🇪 +971</option>
                                        <option value="+966">🇸🇦 +966</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-500"></div>
                                </div>
                                <div className="flex-1 relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input 
                                        type="tel" 
                                        value={phoneNum} 
                                        onChange={(e) => setPhoneNum(e.target.value)}
                                        placeholder="Phone number" 
                                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Date of Birth */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date of Birth</label>
                            <div className="relative">
                                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input 
                                    type="date" 
                                    value={dob} 
                                    onChange={(e) => setDob(e.target.value)}
                                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Gender */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender</label>
                            <div className="relative">
                                <select 
                                    value={gender} 
                                    onChange={(e) => setGender(e.target.value)}
                                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-3.5 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer"
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                    <option value="Prefer Not to Say">Prefer Not to Say</option>
                                </select>
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-500"></div>
                            </div>
                        </div>

                        {/* Blood Group */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Blood Group</label>
                            <div className="relative">
                                <select 
                                    value={bloodGroup} 
                                    onChange={(e) => setBloodGroup(e.target.value)}
                                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-3.5 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer"
                                >
                                    <option value="">Select Blood Group</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-500"></div>
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emergency Contact Name</label>
                            <div className="relative">
                                <Activity className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input 
                                    type="text" 
                                    value={emergencyContact} 
                                    onChange={(e) => setEmergencyContact(e.target.value)}
                                    placeholder="Name of contact" 
                                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button 
                            type="submit" 
                            disabled={saving} 
                            className="bg-[#7F3DEC] hover:bg-[#6c2ed2] text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            Save Changes
                        </Button>
                    </div>
                </form>

                {/* Right Side: Security / Password Settings (5 cols) */}
                <div className="lg:col-span-5 space-y-8">
                    {/* Password reset card */}
                    <div className="bg-white border border-slate-100/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                            <Lock className="text-indigo-500 w-5 h-5" />
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Change Password</h3>
                        </div>

                        {profile?.auth_provider === 'google' ? (
                            <div className="bg-[#FFF5F5] border border-[#FFE3E3] rounded-2xl p-5 text-center space-y-2">
                                <Shield className="w-8 h-8 text-rose-500 mx-auto" />
                                <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Managed by Google</p>
                                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                                    Since you authenticate via Google Sign-In, your credentials are secured by Google. Password management is handled in your Google account settings.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                {passwordMessage.text && (
                                    <div className={`p-3 rounded-2xl flex items-center gap-2 border text-[11px] font-bold ${
                                        passwordMessage.type === 'success' 
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                                            : 'bg-rose-50 text-rose-800 border-rose-100'
                                    }`}>
                                        {passwordMessage.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                                        {passwordMessage.text}
                                    </div>
                                )}

                                {/* Current Password */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <input 
                                            type="password" 
                                            value={currentPassword} 
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="••••••••" 
                                            className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* New Password */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <input 
                                            type="password" 
                                            value={newPassword} 
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••" 
                                            className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirm New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <input 
                                            type="password" 
                                            value={confirmPassword} 
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••" 
                                            className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password requirements tracker */}
                                {newPassword && (
                                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Password Strength Checklist</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                            <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                                                {passLength ? <Check size={12} className="text-emerald-500" /> : <div className="w-2.5 h-2.5 rounded-full border border-slate-300" />}
                                                <span className={passLength ? "text-emerald-600 font-bold" : "text-slate-500"}>At least 6 chars</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                                                {passUpper ? <Check size={12} className="text-emerald-500" /> : <div className="w-2.5 h-2.5 rounded-full border border-slate-300" />}
                                                <span className={passUpper ? "text-emerald-600 font-bold" : "text-slate-500"}>Uppercase (A-Z)</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                                                {passLower ? <Check size={12} className="text-emerald-500" /> : <div className="w-2.5 h-2.5 rounded-full border border-slate-300" />}
                                                <span className={passLower ? "text-emerald-600 font-bold" : "text-slate-500"}>Lowercase (a-z)</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                                                {passNum ? <Check size={12} className="text-emerald-500" /> : <div className="w-2.5 h-2.5 rounded-full border border-slate-300" />}
                                                <span className={passNum ? "text-emerald-600 font-bold" : "text-slate-500"}>Number (0-9)</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                                                {passSpecial ? <Check size={12} className="text-emerald-500" /> : <div className="w-2.5 h-2.5 rounded-full border border-slate-300" />}
                                                <span className={passSpecial ? "text-emerald-600 font-bold" : "text-slate-500"}>Special char</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                                                {passMatches ? <Check size={12} className="text-emerald-500" /> : <div className="w-2.5 h-2.5 rounded-full border border-slate-300" />}
                                                <span className={passMatches ? "text-emerald-600 font-bold" : "text-slate-500"}>Passwords match</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <Button 
                                        type="submit" 
                                        disabled={passwordSaving || !passLength || !passUpper || !passLower || !passNum || !passSpecial || !passMatches} 
                                        className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider py-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        {passwordSaving ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                                        Update Password
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
