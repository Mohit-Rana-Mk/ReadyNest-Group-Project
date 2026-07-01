export const MOCK_APPOINTMENTS = [
    {
        appointment_id: 1,
        appointment_date: new Date().toISOString().split('T')[0] + ' 10:00:00',
        status: 'Scheduled',
        booking_source: 'App',
        pre_remarks: 'Patient reports mild dizziness upon standing for the last 3 days. Occasional headaches.',
        post_remarks: '',
        patient_id: 8492,
        patient_name: 'Eleanor Vance',
        patient_email: 'eleanor.vance@example.com',
        patient_phone: '+1-555-8492',
        date_of_birth: '1954-04-12', // 72 years old in 2026
        gender: 'Female',
        blood_group: 'O Negative',
        allergies: 'Penicillin',
        risk_level: 'HIGH RISK',
        weight_kg: 68.2,
        height_cm: 162.0,
        systolic_bp: 142,
        diastolic_bp: 90,
        blood_sugar_mgdl: 105,
        pulse_rate: 88,
        spo2: 97
    },
    {
        appointment_id: 2,
        appointment_date: new Date().toISOString().split('T')[0] + ' 11:30:00',
        status: 'Checked-In',
        booking_source: 'Walk-in',
        pre_remarks: 'Slight muscle fatigue and joint pain.',
        post_remarks: '',
        patient_id: 3012,
        patient_name: 'Marcus Brody',
        patient_email: 'marcus.brody@example.com',
        patient_phone: '+1-555-3012',
        date_of_birth: '1962-08-25',
        gender: 'Male',
        blood_group: 'AB Positive',
        allergies: 'None',
        risk_level: 'MEDIUM RISK',
        weight_kg: 84.0,
        height_cm: 178.0,
        systolic_bp: 135,
        diastolic_bp: 85,
        blood_sugar_mgdl: 110,
        pulse_rate: 80,
        spo2: 98
    },
    {
        appointment_id: 3,
        appointment_date: new Date().toISOString().split('T')[0] + ' 13:15:00',
        status: 'Scheduled',
        booking_source: 'App',
        pre_remarks: 'Mild dry cough and throat irritation. No fever.',
        post_remarks: '',
        patient_id: 5291,
        patient_name: 'Arthur Dent',
        patient_email: 'arthur.dent@example.com',
        patient_phone: '+1-555-5291',
        date_of_birth: '1984-06-15',
        gender: 'Male',
        blood_group: 'A Positive',
        allergies: 'None',
        risk_level: 'LOW RISK',
        weight_kg: 74.5,
        height_cm: 180.0,
        systolic_bp: 118,
        diastolic_bp: 76,
        blood_sugar_mgdl: 92,
        pulse_rate: 70,
        spo2: 99
    },
    {
        appointment_id: 4,
        appointment_date: new Date().toISOString().split('T')[0] + ' 14:30:00',
        status: 'Checked-In',
        booking_source: 'Walk-in',
        pre_remarks: 'Reports recurrent migraine headaches. Efficacy review for sumatriptan.',
        post_remarks: '',
        patient_id: 1045,
        patient_name: 'Sasha Grey',
        patient_email: 'sasha@example.com',
        patient_phone: '+1-555-1045',
        date_of_birth: '1990-03-14',
        gender: 'Female',
        blood_group: 'B Negative',
        allergies: 'Strawberries',
        risk_level: 'MEDIUM RISK',
        weight_kg: 58.0,
        height_cm: 165.0,
        systolic_bp: 122,
        diastolic_bp: 78,
        blood_sugar_mgdl: 88,
        pulse_rate: 74,
        spo2: 98
    },
    {
        appointment_id: 5,
        appointment_date: new Date().toISOString().split('T')[0] + ' 16:00:00',
        status: 'Scheduled',
        booking_source: 'Portal',
        pre_remarks: 'General medical physical for employment verification.',
        post_remarks: '',
        patient_id: 7083,
        patient_name: 'Clara Oswald',
        patient_email: 'clara@example.com',
        patient_phone: '+1-555-7083',
        date_of_birth: '1998-11-23',
        gender: 'Female',
        blood_group: 'AB Negative',
        allergies: 'Sulfa Drugs',
        risk_level: 'LOW RISK',
        weight_kg: 52.3,
        height_cm: 158.0,
        systolic_bp: 110,
        diastolic_bp: 70,
        blood_sugar_mgdl: 84,
        pulse_rate: 68,
        spo2: 99
    },
    {
        appointment_id: 6,
        appointment_date: new Date().toISOString().split('T')[0] + ' 17:15:00',
        status: 'Scheduled',
        booking_source: 'Walk-in',
        pre_remarks: 'Experiencing shortness of breath on exertion. History of ischemic heart disease.',
        post_remarks: '',
        patient_id: 9940,
        patient_name: 'Albus Dumbledore',
        patient_email: 'albus@example.com',
        patient_phone: '+1-555-9940',
        date_of_birth: '1941-08-18',
        gender: 'Male',
        blood_group: 'O Positive',
        allergies: 'None',
        risk_level: 'HIGH RISK',
        weight_kg: 78.0,
        height_cm: 185.0,
        systolic_bp: 150,
        diastolic_bp: 95,
        blood_sugar_mgdl: 125,
        pulse_rate: 92,
        spo2: 94
    }
];

export const MOCK_HISTORY = {
    8492: {
        vitalsHistory: [
            { id: 1, systolic_bp: 142, diastolic_bp: 90, pulse_rate: 88, blood_sugar_mgdl: 105, recorded_at: '2026-07-01T10:00:00.000Z' },
            { id: 2, systolic_bp: 140, diastolic_bp: 88, pulse_rate: 82, blood_sugar_mgdl: 102, recorded_at: '2026-05-15T09:30:00.000Z' }
        ],
        prescriptions: [
            {
                prescription_id: 201,
                diagnosis: 'Cardiology Consult',
                appointment_date: '2023-10-12T10:00:00.000Z',
                post_remarks: 'Echocardiogram normal. Slight ventricular wall thickening. Advised low salt diet.',
                doctor_name: 'Dr. Hayes',
                items: [
                    { medicine_name: 'Lisinopril', dosage: '10mg', frequency: 'Once Daily', duration: '30 Days', instructions: 'Take in the morning.' }
                ]
            },
            {
                prescription_id: 202,
                diagnosis: 'General Physical',
                appointment_date: '2023-08-05T10:00:00.000Z',
                post_remarks: 'Routine annual checkup. Vitals within normal ranges. Complained of mild joint pain.',
                doctor_name: 'Dr. Hayes',
                items: [
                    { medicine_name: 'Ibuprofen 400mg', dosage: 'As needed', frequency: 'Twice daily', duration: '5 days', instructions: 'Take after meals.' }
                ]
            },
            {
                prescription_id: 203,
                diagnosis: 'Orthopedic Surgery',
                appointment_date: '2022-11-14T10:00:00.000Z',
                post_remarks: 'Left knee arthroscopy completed. Recommended physiotherapy thrice a week.',
                doctor_name: 'Dr. Carter',
                items: []
            }
        ]
    },
    3012: {
        vitalsHistory: [
            { id: 3, systolic_bp: 135, diastolic_bp: 85, pulse_rate: 80, blood_sugar_mgdl: 110, recorded_at: '2026-07-01T11:30:00.000Z' }
        ],
        prescriptions: []
    },
    5291: {
        vitalsHistory: [
            { id: 4, systolic_bp: 118, diastolic_bp: 76, pulse_rate: 70, blood_sugar_mgdl: 92, recorded_at: '2026-07-01T13:15:00.000Z' }
        ],
        prescriptions: [
            {
                prescription_id: 204,
                diagnosis: 'Seasonal Cough',
                appointment_date: '2025-12-05T14:00:00.000Z',
                post_remarks: 'Prescribed cough linctus and throat lozenges.',
                doctor_name: 'Dr. Carter',
                items: [
                    { medicine_name: 'Cough Syrup', dosage: '10ml', frequency: 'Thrice Daily', duration: '5 Days', instructions: 'Take after food.' }
                ]
            }
        ]
    },
    1045: {
        vitalsHistory: [
            { id: 5, systolic_bp: 122, diastolic_bp: 78, pulse_rate: 74, blood_sugar_mgdl: 88, recorded_at: '2026-07-01T14:30:00.000Z' }
        ],
        prescriptions: [
            {
                prescription_id: 205,
                diagnosis: 'Classic Migraine',
                appointment_date: '2026-04-12T11:00:00.000Z',
                post_remarks: 'Migraines triggered by lack of sleep. Recommended tracking food/sleep triggers.',
                doctor_name: 'Dr. Hayes',
                items: [
                    { medicine_name: 'Sumatriptan 50mg', dosage: '1 tablet', frequency: 'As needed at onset', duration: '10 tablets', instructions: 'Do not exceed 2 tabs in 24 hours.' }
                ]
            }
        ]
    },
    7083: {
        vitalsHistory: [],
        prescriptions: []
    },
    9940: {
        vitalsHistory: [
            { id: 6, systolic_bp: 150, diastolic_bp: 95, pulse_rate: 92, blood_sugar_mgdl: 125, recorded_at: '2026-07-01T17:15:00.000Z' },
            { id: 7, systolic_bp: 148, diastolic_bp: 92, pulse_rate: 88, blood_sugar_mgdl: 120, recorded_at: '2026-02-10T10:00:00.000Z' }
        ],
        prescriptions: [
            {
                prescription_id: 206,
                diagnosis: 'Ischemic Heart Disease',
                appointment_date: '2026-02-10T10:00:00.000Z',
                post_remarks: 'Slight angina noted. Adjusted nitrates dose. Instructed to limit strenuous activity.',
                doctor_name: 'Dr. Hayes',
                items: [
                    { medicine_name: 'Aspirin 75mg', dosage: '1 tablet', frequency: 'Once Daily', duration: '90 Days', instructions: 'Take with lunch.' },
                    { medicine_name: 'Atorvastatin 20mg', dosage: '1 tablet', frequency: 'Once Daily', duration: '90 Days', instructions: 'Take at bed time.' }
                ]
            }
        ]
    }
};
