// React Router wrapper to check AuthContext roles
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />; 
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        console.log("Unauthorized Access! User:", user, "Allowed Roles:", allowedRoles);
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
}
