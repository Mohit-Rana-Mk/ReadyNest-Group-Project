// Export constant URLs for backend routes
export const ENDPOINTS = {
    RECEPTION: {
        GET_QUEUE: '/reception/queue',
        REGISTER_WALKIN: '/reception/walk-in'
    },
    DOCTOR: {
        GET_APPOINTMENTS: '/doctor/appointments',
        GET_HISTORY: '/doctor/patient-history',
        COMPLETE_CONSULTATION: '/doctor/complete-consultation',
        SEND_REMINDER: '/doctor/send-reminder'
    },
    PATIENT: {
        GET_RECOMMENDATIONS: '/patient/recommendations',
        SUBMIT_TRIAGE: '/patient/triage'
    },
    ADMIN: {
        PENDING_CLINICS: '/admin/pending-clinics',
        OUTBREAK_STATS: '/admin/outbreak-stats'
    }
};
