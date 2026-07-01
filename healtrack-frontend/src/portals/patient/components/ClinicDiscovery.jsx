import React, { useState, useEffect } from 'react';
import { MapPin, Clock, ChevronRight, Building2, Star, Search, Filter, Navigation } from 'lucide-react';
import { fetchClinics, fetchFamilyMembers, addFamilyMember, bookAppointment, submitClinicReview, fetchClinicWaitTime } from '../../../api/patientApi';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

export default function ClinicDiscovery() {
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ city: '', min_rating: '', service_id: '', radius: '', lat: '', lng: '' });
    const [allServices, setAllServices] = useState([]);
    const [availableCities, setAvailableCities] = useState([]);

    
    // Booking State
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedClinic, setSelectedClinic] = useState(null);
    const [familyMembers, setFamilyMembers] = useState([]);
    const [bookingData, setBookingData] = useState({
        patient_id: '',
        appointment_date: '',
        doctor_id: '',
        department_id: ''
    });
    const [clinicDoctors, setClinicDoctors] = useState([]);
    
    // New Patient State
    const [isAddingNewPatient, setIsAddingNewPatient] = useState(false);
    const [newPatientData, setNewPatientData] = useState({ name: '', gender: 'Male' });
    
    const [waitTimeData, setWaitTimeData] = useState(null);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    // Review State
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewData, setReviewData] = useState({ rating: 5, review_text: '' });

    useEffect(() => {
        loadClinics();
    }, [filters]);

    useEffect(() => {
        const loadServicesAndCities = async () => {
            try {
                const { fetchServices } = await import('../../../api/patientApi');
                const [svcs, cRes] = await Promise.all([
                    fetchServices(),
                    import('../../../api/axiosClient').then(m => m.default.get('/patient/clinics/cities'))
                ]);
                setAllServices(svcs);
                setAvailableCities(cRes.data || []);
            } catch (err) { console.error(err); }
        };
        loadServicesAndCities();
    }, []);

    const loadClinics = async () => {
        setLoading(true);
        try {
            const data = await fetchClinics(filters);
            setClinics(data);
        } catch (error) {
            console.error('Error fetching clinics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleClearLocation = () => {
        setFilters(prev => ({ ...prev, lat: '', lng: '', radius: '' }));
    };

    const handleUseLocation = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFilters(prev => ({
                        ...prev,
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        radius: '10' // Default 10km
                    }));
                },
                (error) => {
                    console.error('Error getting location:', error);
                    alert('Unable to retrieve your location');
                }
            );
        }
    };

    const openBookingModal = async (clinic) => {
        setSelectedClinic(clinic);
        setBookingSuccess(false);
        setIsAddingNewPatient(false);
        setWaitTimeData(null);
        setIsBookingModalOpen(true);
        try {
            const family = await fetchFamilyMembers();
            setFamilyMembers(family);
            
            const { fetchClinicDoctors } = await import('../../../api/patientApi');
            const doctors = await fetchClinicDoctors(clinic.id);
            setClinicDoctors(doctors);

            setBookingData(prev => ({ 
                ...prev, 
                patient_id: family.length > 0 ? family[0].id : '',
                doctor_id: doctors.length > 0 ? doctors[0].id : '',
                department_id: ''
            }));
            
            const waitData = await fetchClinicWaitTime(clinic.id);
            setWaitTimeData(waitData);
            
            // Format to YYYY-MM-DDTHH:mm
            const suggested = new Date(waitData.suggested_time);
            const iso = new Date(suggested.getTime() - (suggested.getTimezoneOffset() * 60000)).toISOString().slice(0,16);
            setBookingData(prev => ({ ...prev, appointment_date: iso }));
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleBookAppointment = async (e) => {
        e.preventDefault();
        try {
            let finalPatientId = bookingData.patient_id;
            
            if (isAddingNewPatient) {
                const addRes = await addFamilyMember(newPatientData);
                const family = await fetchFamilyMembers();
                setFamilyMembers(family);
                finalPatientId = addRes.patient_id;
            }

            await bookAppointment({
                clinic_id: selectedClinic.id,
                doctor_id: bookingData.doctor_id,
                patient_id: finalPatientId,
                appointment_date: bookingData.appointment_date
            });
            setBookingSuccess(true);
            setTimeout(() => {
                setIsBookingModalOpen(false);
            }, 2000);
        } catch (error) {
            console.error('Error booking:', error);
        }
    };

    const openReviewModal = (clinic) => {
        setSelectedClinic(clinic);
        setReviewData({ rating: 5, review_text: '' });
        setIsReviewModalOpen(true);
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        try {
            // patient_id is mocked as 1 for MVP
            await submitClinicReview({
                clinic_id: selectedClinic.id,
                patient_id: 1,
                rating: reviewData.rating,
                review_text: reviewData.review_text
            });
            setIsReviewModalOpen(false);
            loadClinics(); // Refresh ratings
        } catch (error) {
            console.error('Error submitting review:', error);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="px-1 flex justify-between items-end">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Find Care Near You</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Verified clinics in your area</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
                <div className="flex gap-2">
                    <button
                        onClick={filters.lat ? handleClearLocation : handleUseLocation}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                            filters.lat 
                                ? 'text-red-600 bg-red-50 hover:bg-red-100 border-red-100' 
                                : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-100'
                        }`}
                    >
                        {filters.lat ? (
                            <>Clear Location</>
                        ) : (
                            <>
                                <Navigation size={14} />
                                Use My Location
                            </>
                        )}
                    </button>
                    {filters.lat && (
                        <div className="flex-1">
                            <select 
                                name="radius" 
                                value={filters.radius} 
                                onChange={handleFilterChange}
                                className="w-full text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg p-1.5 focus:outline-none"
                            >
                                <option value="5">Within 5 km</option>
                                <option value="10">Within 10 km</option>
                                <option value="20">Within 20 km</option>
                                <option value="50">Within 50 km</option>
                            </select>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] text-gray-500 font-medium">City</label>
                        <select 
                            name="city" 
                            value={filters.city} 
                            onChange={handleFilterChange}
                            className="w-full text-xs bg-gray-50 border border-gray-200 rounded p-1.5 focus:outline-none"
                            disabled={!!filters.lat}
                        >
                            <option value="">All Cities</option>
                            {availableCities.map(c => (
                                <option key={c.city} value={c.city}>{c.city}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 font-medium">Min Rating</label>
                        <select 
                            name="min_rating" 
                            value={filters.min_rating} 
                            onChange={handleFilterChange}
                            className="w-full text-xs bg-gray-50 border border-gray-200 rounded p-1.5 focus:outline-none"
                        >
                            <option value="">Any Rating</option>
                            <option value="4">4+ Stars</option>
                            <option value="4.5">4.5+ Stars</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="text-[10px] text-gray-500 font-medium">Department</label>
                    <select 
                        name="service_id" 
                        value={filters.service_id} 
                        onChange={handleFilterChange}
                        className="w-full text-xs bg-gray-50 border border-gray-200 rounded p-1.5 focus:outline-none"
                    >
                        <option value="">All Departments</option>
                        {allServices.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Clinic Cards */}
            {loading ? (
                <div className="flex justify-center py-10"><Clock className="animate-spin text-indigo-500" /></div>
            ) : clinics.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Building2 size={40} strokeWidth={1.2} />
                    <p className="mt-3 text-sm">No clinics found matching criteria.</p>
                </div>
            ) : (
                <div className="space-y-3 pb-6">
                    {clinics.map(clinic => (
                        <div
                            key={clinic.id}
                            className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-gray-900 truncate">{clinic.name}</h3>
                                        <span className="flex items-center text-[10px] font-bold text-amber-500 bg-amber-50 px-1.5 rounded">
                                            <Star size={10} className="mr-0.5 fill-current" />
                                            {Number(clinic.average_rating || 0).toFixed(1)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                                        <p className="text-xs text-gray-500 truncate">
                                            {clinic.address}{clinic.city ? `, ${clinic.city}` : ''}
                                        </p>
                                    </div>

                                    {(clinic.opening_time || clinic.closing_time) && (
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <Clock size={12} className="text-gray-400 flex-shrink-0" />
                                            <p className="text-xs text-gray-500">
                                                {clinic.opening_time || '09:00'} – {clinic.closing_time || '17:00'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 flex gap-2">
                                <button 
                                    onClick={() => openBookingModal(clinic)}
                                    className="flex-1 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
                                >
                                    Book Appointment
                                </button>
                                <button 
                                    onClick={() => openReviewModal(clinic)}
                                    className="px-3 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                                >
                                    Review
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Booking Modal */}
            <Modal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} title="Book Appointment">
                {bookingSuccess ? (
                    <div className="p-6 text-center text-emerald-600 font-bold">
                        <div className="text-4xl mb-4">🎉</div>
                        Appointment Booked Successfully!
                        <p className="text-xs text-emerald-700 mt-2 font-normal">A reminder will be sent 2 hours before the visit.</p>
                    </div>
                ) : (
                    <form onSubmit={handleBookAppointment} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Clinic</label>
                            <input type="text" disabled value={selectedClinic?.name} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient</label>
                            <select 
                                required
                                value={isAddingNewPatient ? 'new' : bookingData.patient_id}
                                onChange={(e) => {
                                    if (e.target.value === 'new') {
                                        setIsAddingNewPatient(true);
                                    } else {
                                        setIsAddingNewPatient(false);
                                        setBookingData({...bookingData, patient_id: e.target.value});
                                    }
                                }}
                                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {familyMembers.map(member => (
                                    <option key={member.id} value={member.id}>{member.name} ({member.gender})</option>
                                ))}
                                <option value="new">+ Add New Patient</option>
                            </select>
                            
                            {isAddingNewPatient && (
                                <div className="mt-2 p-3 bg-indigo-50 border border-indigo-100 rounded-lg space-y-2">
                                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">New Patient Details</p>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="Full Name" 
                                        value={newPatientData.name}
                                        onChange={(e) => setNewPatientData({...newPatientData, name: e.target.value})}
                                        className="w-full border border-gray-200 rounded p-1.5 text-xs" 
                                    />
                                    <select 
                                        value={newPatientData.gender}
                                        onChange={(e) => setNewPatientData({...newPatientData, gender: e.target.value})}
                                        className="w-full border border-gray-200 rounded p-1.5 text-xs"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                            <select 
                                value={bookingData.department_id}
                                onChange={(e) => setBookingData({...bookingData, department_id: e.target.value, doctor_id: ''})}
                                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Any Department</option>
                                {Array.from(new Set(clinicDoctors.map(d => d.department_id)))
                                    .filter(id => id)
                                    .map(depId => {
                                        const depName = clinicDoctors.find(d => d.department_id === depId)?.department;
                                        return <option key={depId} value={depId}>{depName}</option>;
                                    })}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                            <select 
                                required
                                value={bookingData.doctor_id}
                                onChange={(e) => setBookingData({...bookingData, doctor_id: e.target.value})}
                                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Select a Doctor</option>
                                {clinicDoctors
                                    .filter(d => !bookingData.department_id || d.department_id?.toString() === bookingData.department_id?.toString())
                                    .map(doc => (
                                        <option key={doc.id} value={doc.id}>Dr. {doc.name} {doc.department ? `(${doc.department})` : ''}</option>
                                    ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Time</label>
                            <div className="text-xs text-indigo-600 mb-2 font-medium">
                                {waitTimeData ? 
                                    `✨ Suggestion based on ${waitTimeData.pending_patients} pending patients (est. ${waitTimeData.estimated_wait_minutes} min wait)` : 
                                    '✨ Calculating best time...'}
                            </div>
                            <input 
                                type="datetime-local" 
                                required
                                value={bookingData.appointment_date}
                                onChange={(e) => setBookingData({...bookingData, appointment_date: e.target.value})}
                                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="pt-4 flex justify-end space-x-3 border-t border-gray-200">
                            <Button type="button" variant="outline" onClick={() => setIsBookingModalOpen(false)}>Cancel</Button>
                            <Button type="submit" variant="primary">Confirm Booking</Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Review Modal */}
            <Modal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title="Rate Clinic">
                <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                        <select 
                            required
                            value={reviewData.rating}
                            onChange={(e) => setReviewData({...reviewData, rating: e.target.value})}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="5">⭐⭐⭐⭐⭐ (5) Excellent</option>
                            <option value="4">⭐⭐⭐⭐ (4) Good</option>
                            <option value="3">⭐⭐⭐ (3) Average</option>
                            <option value="2">⭐⭐ (2) Poor</option>
                            <option value="1">⭐ (1) Terrible</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Review</label>
                        <textarea 
                            value={reviewData.review_text}
                            onChange={(e) => setReviewData({...reviewData, review_text: e.target.value})}
                            placeholder="Share your experience..."
                            className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500 h-24"
                        />
                    </div>
                    <div className="pt-4 flex justify-end space-x-3 border-t border-gray-200">
                        <Button type="button" variant="outline" onClick={() => setIsReviewModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="primary">Submit Review</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
