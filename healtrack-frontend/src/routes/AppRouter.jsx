// Maps /admin, /doctor, /patient, /reception to portals
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import ClinicManagementPortal from '../portals/clinic-admin/ClinicManagementPortal';
import DoctorWorkstation from '../portals/doctor/DoctorWorkstation';
import PatientApp from '../portals/patient/PatientApp';
import ReceptionDesk from '../portals/reception/ReceptionDesk';
import AdminDashboard from '../portals/admin/AdminDashboard';
import MedicinePortal from '../portals/medicine/MedicinePortal';
import ProtectedRoute from './ProtectedRoute';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import PharmacyLogin from '../pages/PharmacyLogin';
import VideoConsultation from '../pages/VideoConsultation';
import CommandPalette from '../components/ui/CommandPalette';

export default function AppRouter() {
    return (
        <BrowserRouter>
            <CommandPalette />
            <Routes>
                {/* Public / Landing Route (Placeholder) */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/medicine/login" element={<PharmacyLogin />} />

                {/* Super Admin Workstation Routes */}
                <Route path="/admin" element={<ProtectedRoute allowedRoles={['SuperAdmin']} />}>
                    <Route index element={<AdminDashboard />} />
                </Route>

                {/* Clinic Admin Portal Routes */}
                <Route path="/clinic" element={<ProtectedRoute allowedRoles={['ClinicAdmin']} />}>
                    <Route index element={<ClinicManagementPortal />} />
                </Route>

                {/* Doctor Portal Routes */}
                <Route path="/doctor" element={<ProtectedRoute allowedRoles={['Doctor']} />}>
                    <Route index element={<DoctorWorkstation />} />
                </Route>

                {/* Patient Portal Routes */}
                <Route path="/patient" element={<ProtectedRoute allowedRoles={['Patient']} />}>
                    <Route index element={<PatientApp />} />
                </Route>

                {/* Reception Portal Routes */}
                <Route path="/reception" element={<ProtectedRoute allowedRoles={['ClinicStaff']} />}>
                    <Route index element={<ReceptionDesk />} />
                </Route>

                {/* Medicine Portal Routes */}
                <Route path="/medicine" element={<ProtectedRoute allowedRoles={['Medicine']} />}>
                    <Route index element={<MedicinePortal />} />
                </Route>
                
                {/* Video Consultation Route */}
                <Route path="/video/:roomId" element={<ProtectedRoute allowedRoles={['Doctor', 'Patient']} />}>
                    <Route index element={<VideoConsultation />} />
                </Route>

                {/* Fallback */}
                <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
