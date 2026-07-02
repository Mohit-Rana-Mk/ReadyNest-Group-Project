export const MOCK_PENDING_CLINICS = [
    { id: 101, name: 'Metro Healthcare Delhi', license_number: 'LIC-DL-8899', address: 'Block C, Connaught Place', city: 'New Delhi', postal_code: '110001', created_at: '2026-07-01T10:00:00Z' },
    { id: 102, name: 'St. Jude Children Hospital', license_number: 'LIC-MH-1122', address: '45 Hill Road, Bandra', city: 'Mumbai', postal_code: '400050', created_at: '2026-06-30T15:30:00Z' },
    { id: 103, name: 'Valley View Family Clinic', license_number: 'LIC-KA-7766', address: '8th Main, Indiranagar', city: 'Bengaluru', postal_code: '560038', created_at: '2026-06-29T08:15:00Z' }
];

export const MOCK_OUTBREAKS = [
    { id: 1, name: 'Metro Delhi Connaught Place', latitude: 28.6304, longitude: 77.2177, diagnosis: 'Dengue Fever', count: 14, risk: 'High' },
    { id: 2, name: 'St. Jude Bandra', latitude: 19.0544, longitude: 72.8294, diagnosis: 'Influenza A', count: 8, risk: 'Medium' },
    { id: 3, name: 'Indiranagar Family Clinic', latitude: 12.9716, longitude: 77.5946, diagnosis: 'Acute Gastroenteritis', count: 5, risk: 'Low' }
];

export const MOCK_DISEASE_TRENDS = [
    { label: 'Dengue Fever', count: 24, change: '+12% this week' },
    { label: 'Influenza A', count: 18, change: '+4% this week' },
    { label: 'Acute Gastroenteritis', count: 12, change: '-2% this week' },
    { label: 'Hypertension Crisis', count: 8, change: 'Stable' }
];

export const MOCK_AI_HEALTH = {
    triageRiskRatios: { Low: 48, Medium: 32, High: 15 },
    preventiveRecsSent: 142
};

export const MOCK_ECOSYSTEM_KPIS = {
    kpis: {
        totalPatients: 1084,
        totalClinics: 28,
        totalAppointments: 412
    },
    reviews: [
        { id: 1, name: 'HealTrack Central Hospital', rating: 4.8, review_count: 52 },
        { id: 2, name: 'Indiranagar Family Clinic', rating: 4.2, review_count: 14 },
        { id: 3, name: 'St. Jude Bandra', rating: 3.5, review_count: 8 },
        { id: 4, name: 'Valley View Clinic', rating: 2.1, review_count: 4 }
    ]
};
