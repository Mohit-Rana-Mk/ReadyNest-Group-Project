import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Building, HeartPulse } from 'lucide-react';

export default function Signup() {
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
                    // Reset form or wait for user to click login
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
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center text-indigo-600 mb-4">
                    <HeartPulse className="w-12 h-12" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
                    Create an account
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                        <button
                            type="button"
                            onClick={() => setIsClinic(false)}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition flex items-center justify-center gap-2 ${!isClinic ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <UserPlus className="w-4 h-4" /> Patient
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsClinic(true)}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition flex items-center justify-center gap-2 ${isClinic ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Building className="w-4 h-4" /> Clinic
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}
                    
                    {successMessage && (
                        <div className="mb-4 bg-emerald-50 border-l-4 border-emerald-500 p-4">
                            <p className="text-sm text-emerald-700">{successMessage}</p>
                            <p className="text-xs text-emerald-600 mt-2">
                                <Link to="/login" className="font-medium underline">Return to Login</Link>
                            </p>
                        </div>
                    )}

                    {!successMessage && (
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            {isClinic && (
                                <>
                                    <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Clinic Details</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">Clinic Name</label>
                                        <input type="text" required value={clinicName} onChange={(e) => setClinicName(e.target.value)} className="mt-1 appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">License Number</label>
                                        <input type="text" required value={license} onChange={(e) => setLicense(e.target.value)} className="mt-1 appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">Address & City</label>
                                        <div className="flex gap-2 mt-1">
                                            <input type="text" placeholder="Address" required value={address} onChange={(e) => setAddress(e.target.value)} className="appearance-none block w-2/3 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                            <input type="text" placeholder="City" required value={city} onChange={(e) => setCity(e.target.value)} className="appearance-none block w-1/3 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                        </div>
                                    </div>
                                </>
                            )}

                            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 pt-2">{isClinic ? 'Admin Account Details' : 'Personal Details'}</h3>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Full Name</label>
                                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700">Email</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700">Phone</label>
                                    <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                </div>
                            </div>

                            {!isClinic && (
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-slate-700">Date of Birth</label>
                                        <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="mt-1 appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-slate-700">Gender</label>
                                        <select value={gender} onChange={(e) => setGender(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border shadow-sm bg-white">
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                            <option value="Prefer Not to Say">Prefer Not to Say</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700">Password</label>
                                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : (isClinic ? 'Register Clinic' : 'Create Patient Account')}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-slate-500">
                                    Already have an account?
                                </span>
                            </div>
                        </div>
                        <div className="mt-6">
                            <Link to="/login" className="w-full flex justify-center py-2 px-4 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100">
                                Sign in instead
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
