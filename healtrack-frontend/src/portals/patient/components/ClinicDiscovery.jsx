import { toast } from '../../../components/ui/Toast';
import React, { useState, useEffect } from 'react';
import { MapPin, Clock, ChevronRight, Building2, Star, Search, Filter, Navigation } from 'lucide-react';
import { fetchClinics, fetchFamilyMembers, addFamilyMember, bookAppointment, submitClinicReview, fetchClinicWaitTime } from '../../../api/patientApi';
import { createPaymentOrder, verifyPaymentSignature } from '../../../api/paymentApi';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { CustomDropdown } from '../../../components/ui/CustomDropdown';

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
        department_id: '',
        consultation_type: 'In-Person',
        payment_method: 'Online'
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
                    console.warn('Geolocation failed, using mock fallback location', error);
                    setFilters(prev => ({
                        ...prev,
                        lat: "28.6139",
                        lng: "77.2090",
                        radius: '10'
                    }));
                    toast.error('Unable to retrieve real location due to browser restrictions. Using default mock location (New Delhi) for demonstration.');
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
            setIsAddingNewPatient(family.length === 0);
            
            const { fetchClinicDoctors } = await import('../../../api/patientApi');
            const doctors = await fetchClinicDoctors(clinic.id);
            setClinicDoctors(doctors);

            setBookingData(prev => ({ 
                ...prev, 
                patient_id: family.length > 0 ? family[0].id : '',
                doctor_id: doctors.length > 0 ? doctors[0].id : '',
                department_id: '',
                consultation_type: 'In-Person',
                payment_method: 'Online'
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

            const pMethod = bookingData.consultation_type === 'Teleconsultation' ? 'Online' : bookingData.payment_method;

            // Create Order
            const orderData = await createPaymentOrder({
                clinic_id: selectedClinic.id,
                doctor_id: bookingData.doctor_id,
                patient_id: finalPatientId,
                appointment_date: bookingData.appointment_date,
                consultation_type: bookingData.consultation_type,
                payment_method: pMethod
            });

            if (!orderData) {
                toast.error('Failed to create payment order.');
                return;
            }

            if (pMethod === 'Counter') {
                setBookingSuccess(true);
                setTimeout(() => {
                    setIsBookingModalOpen(false);
                }, 2000);
                return;
            }

            // Load Razorpay script dynamically
            const rzpLoaded = await new Promise((resolve) => {
                if (window.Razorpay) {
                    resolve(true);
                    return;
                }
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.onload = () => resolve(true);
                script.onerror = () => resolve(false);
                document.body.appendChild(script);
            });

            if (!rzpLoaded) {
                toast.error('Failed to load payment gateway. Please check your internet connection.');
                return;
            }

            if (!orderData.orderId) {
                toast.error('Failed to create payment order.');
                return;
            }

            // Trigger Razorpay Checkout
            const selectedDoctor = clinicDoctors.find(d => d.id === bookingData.doctor_id);
            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'HealTrack',
                description: `Consultation with Dr. ${selectedDoctor ? selectedDoctor.name : 'Doctor'}`,
                order_id: orderData.orderId,
                handler: async function (response) {
                    try {
                        const verifyRes = await verifyPaymentSignature({
                            appointment_id: orderData.appointmentId,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        if (verifyRes.success) {
                            setBookingSuccess(true);
                            setTimeout(() => {
                                setIsBookingModalOpen(false);
                            }, 2000);
                        } else {
                            toast.error('Signature verification failed.');
                        }
                    } catch (err) {
                        console.error('Verify error:', err);
                        toast.error('Verification error: ' + (err.response?.data?.message || err.message));
                    }
                },
                prefill: {
                    name: familyMembers.find(f => f.id === finalPatientId)?.name || '',
                },
                theme: {
                    color: '#6366f1'
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                toast.error('Payment failed: ' + response.error.description);
            });
            rzp.open();

        } catch (error) {
            console.error('Error booking:', error);
            toast.error('Error creating booking/order: ' + (error.response?.data?.message || error.message));
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
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-end gap-3">
                <div className="flex-1 flex gap-2">
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
                            <CustomDropdown 
                                value={filters.radius} 
                                onChange={(val) => handleFilterChange({ target: { name: 'radius', value: val } })}
                                className="w-full h-8 text-indigo-600 bg-indigo-50 border border-indigo-100"
                                options={[
                                    { value: "5", label: "Within 5 km" },
                                    { value: "10", label: "Within 10 km" },
                                    { value: "20", label: "Within 20 km" },
                                    { value: "50", label: "Within 50 km" }
                                ]}
                            />
                        </div>
                    )}
                </div>
                <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] text-gray-500 font-medium">City</label>
                        <CustomDropdown 
                            value={filters.city} 
                            onChange={(val) => handleFilterChange({ target: { name: 'city', value: val } })}
                            className={`w-full h-8 bg-gray-50 border border-gray-200 ${!!filters.lat ? 'opacity-50 pointer-events-none' : ''}`}
                            options={[
                                { value: "", label: "All Cities" },
                                ...availableCities.map(c => ({ value: c.city, label: c.city }))
                            ]}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 font-medium">Min Rating</label>
                        <CustomDropdown 
                            value={filters.min_rating} 
                            onChange={(val) => handleFilterChange({ target: { name: 'min_rating', value: val } })}
                            className="w-full h-8 bg-gray-50 border border-gray-200"
                            options={[
                                { value: "", label: "Any Rating" },
                                { value: "4", label: "4+ Stars" },
                                { value: "4.5", label: "4.5+ Stars" }
                            ]}
                        />
                    </div>
                </div>
                <div className="flex-1">
                    <label className="text-[10px] text-gray-500 font-medium">Department</label>
                    <CustomDropdown 
                        value={filters.service_id} 
                        onChange={(val) => handleFilterChange({ target: { name: 'service_id', value: val } })}
                        className="w-full h-8 bg-gray-50 border border-gray-200"
                        options={[
                            { value: "", label: "All Departments" },
                            ...allServices.map(s => ({ value: s.id.toString(), label: s.name }))
                        ]}
                    />
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
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
                            <CustomDropdown 
                                value={isAddingNewPatient ? 'new' : bookingData.patient_id}
                                onChange={(val) => {
                                    if (val === 'new') {
                                        setIsAddingNewPatient(true);
                                    } else {
                                        setIsAddingNewPatient(false);
                                        setBookingData({...bookingData, patient_id: val});
                                    }
                                }}
                                className="w-full h-10 border border-gray-300"
                                options={[
                                    ...familyMembers.map(p => ({ value: p.id.toString(), label: p.name })),
                                    { value: 'new', label: '+ Add New Family Member' }
                                ]}
                            />
                            
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
                                    <CustomDropdown 
                                        value={newPatientData.gender}
                                        onChange={(val) => setNewPatientData({...newPatientData, gender: val})}
                                        className="w-full h-8 border border-gray-200"
                                        options={[
                                            { value: "Male", label: "Male" },
                                            { value: "Female", label: "Female" },
                                            { value: "Other", label: "Other" }
                                        ]}
                                    />
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                            <CustomDropdown 
                                value={bookingData.department_id}
                                onChange={(val) => setBookingData({...bookingData, department_id: val, doctor_id: ''})}
                                className="w-full h-10 border border-gray-300"
                                options={[
                                    { value: "", label: "Any Department" },
                                    ...Array.from(new Set(clinicDoctors.map(d => d.department_id)))
                                        .filter(id => id)
                                        .map(depId => {
                                            const depName = clinicDoctors.find(d => d.department_id === depId)?.department;
                                            return { value: depId.toString(), label: depName };
                                        })
                                ]}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                            <CustomDropdown 
                                value={bookingData.doctor_id}
                                onChange={(val) => setBookingData({...bookingData, doctor_id: val})}
                                className="w-full h-10 border border-gray-300"
                                options={[
                                    { value: "", label: "Select a Doctor" },
                                    ...clinicDoctors
                                        .filter(d => !bookingData.department_id || d.department_id?.toString() === bookingData.department_id?.toString())
                                        .map(doc => ({
                                            value: doc.id.toString(), 
                                            label: `Dr. ${doc.name} ${doc.department ? `(${doc.department})` : ''} - ₹${doc.consultation_fee || 500}`
                                        }))
                                ]}
                            />
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Type</label>
                            <div className="flex space-x-4">
                                <label className="flex items-center space-x-2">
                                    <input 
                                        type="radio" 
                                        name="consultation_type" 
                                        value="In-Person" 
                                        checked={bookingData.consultation_type === 'In-Person'}
                                        onChange={(e) => setBookingData({
                                            ...bookingData, 
                                            consultation_type: e.target.value
                                        })}
                                        className="text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700 font-medium">In-Person</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input 
                                        type="radio" 
                                        name="consultation_type" 
                                        value="Teleconsultation" 
                                        checked={bookingData.consultation_type === 'Teleconsultation'}
                                        onChange={(e) => setBookingData({
                                            ...bookingData, 
                                            consultation_type: e.target.value,
                                            payment_method: 'Online'
                                        })}
                                        className="text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700 font-medium">Teleconsultation</span>
                                </label>
                            </div>
                        </div>

                        {bookingData.consultation_type === 'In-Person' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Option</label>
                                <div className="flex space-x-4">
                                    <label className="flex items-center space-x-2">
                                        <input 
                                            type="radio" 
                                            name="payment_method" 
                                            value="Online" 
                                            checked={bookingData.payment_method === 'Online'}
                                            onChange={(e) => setBookingData({...bookingData, payment_method: e.target.value})}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700 font-medium">Pay Online (Razorpay)</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input 
                                            type="radio" 
                                            name="payment_method" 
                                            value="Counter" 
                                            checked={bookingData.payment_method === 'Counter'}
                                            onChange={(e) => setBookingData({...bookingData, payment_method: e.target.value})}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700 font-semibold text-indigo-600">Pay at Counter</span>
                                    </label>
                                </div>
                            </div>
                        )}
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
                        <CustomDropdown 
                            value={reviewData.rating}
                            onChange={(val) => setReviewData({...reviewData, rating: val})}
                            className="w-full h-10 border border-gray-300"
                            options={[
                                { value: "5", label: "⭐⭐⭐⭐⭐ (5) Excellent" },
                                { value: "4", label: "⭐⭐⭐⭐ (4) Good" },
                                { value: "3", label: "⭐⭐⭐ (3) Average" },
                                { value: "2", label: "⭐⭐ (2) Poor" },
                                { value: "1", label: "⭐ (1) Terrible" }
                            ]}
                        />
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
