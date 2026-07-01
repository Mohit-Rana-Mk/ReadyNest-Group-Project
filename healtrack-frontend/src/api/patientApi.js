import axiosClient from './axiosClient';

const PATIENT_ID = 1; // Hardcoded for testing

export const fetchRecommendations = () =>
    axiosClient.get(`/patient/${PATIENT_ID}/recommendations`).then(res => res.data);

export const fetchClinics = (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.city) params.append('city', filters.city);
    if (filters.min_rating) params.append('min_rating', filters.min_rating);
    if (filters.service_id) params.append('service_id', filters.service_id);
    if (filters.lat) params.append('lat', filters.lat);
    if (filters.lng) params.append('lng', filters.lng);
    if (filters.radius) params.append('radius', filters.radius);
    
    return axiosClient.get(`/patient/clinics/nearby?${params.toString()}`).then(res => res.data);
};

export const fetchServices = () =>
    axiosClient.get(`/patient/services`).then(res => res.data);

export const postTriage = (userInput) =>
    axiosClient.post('/patient/triage', {
        patient_id: PATIENT_ID,
        user_input: userInput
    }).then(res => res.data);

export const fetchAppointments = () =>
    axiosClient.get(`/patient/appointments/family`).then(res => res.data);

export const fetchFamilyMembers = () =>
    axiosClient.get(`/patient/family`).then(res => res.data);

export const addFamilyMember = (data) =>
    axiosClient.post(`/patient/family`, data).then(res => res.data);

export const fetchClinicWaitTime = (clinicId) =>
    axiosClient.get(`/patient/clinics/${clinicId}/wait-time`).then(res => res.data);

export const fetchClinicDoctors = (clinicId) =>
    axiosClient.get(`/patient/clinics/${clinicId}/doctors`).then(res => res.data);

export const bookAppointment = (data) =>
    axiosClient.post('/patient/appointments', data).then(res => res.data);

export const cancelAppointment = (appointmentId) =>
    axiosClient.put(`/patient/appointments/${appointmentId}/cancel`).then(res => res.data);

export const rescheduleAppointment = (appointmentId, newDate) =>
    axiosClient.put(`/patient/appointments/${appointmentId}/reschedule`, { new_date: newDate }).then(res => res.data);

export const submitClinicReview = (data) =>
    axiosClient.post('/patient/reviews', data).then(res => res.data);
