// Maps /admin, /doctor, /patient, /reception to portals
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AdminDashboard from '../portals/admin/AdminDashboard';
import DoctorWorkstation from '../portals/doctor/DoctorWorkstation';
import PatientApp from '../portals/patient/PatientApp';
import ReceptionDesk from '../portals/reception/ReceptionDesk';
import ProtectedRoute from './ProtectedRoute';

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public / Landing Route (Placeholder) */}
                <Route path="/" element={<div className="p-4">Welcome to HealTrack AI. Navigate to a portal route.</div>} />

                {/* Admin Portal Routes */}
                <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route index element={<AdminDashboard />} />
                </Route>

                {/* Doctor Portal Routes */}
                <Route path="/doctor" element={<ProtectedRoute allowedRoles={['doctor']} />}>
                    <Route index element={<DoctorWorkstation />} />
                </Route>

                {/* Patient Portal Routes */}
                <Route path="/patient" element={<ProtectedRoute allowedRoles={['patient']} />}>
                    <Route index element={<PatientApp />} />
                </Route>

                {/* Reception Portal Routes */}
                <Route path="/reception" element={<ProtectedRoute allowedRoles={['reception']} />}>
                    <Route index element={<ReceptionDesk />} />
                </Route>
                
                {/* Fallback */}
                <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
