// React Router wrapper to check AuthContext roles
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
    const { user } = useAuth();

    // Simplify check for scaffolding
    // If not logged in, go to login (mocked as '/')
    if (!user) {
        // Un-comment the line below for real auth, but for now we let it pass or redirect
        // return <Navigate to="/login" replace />; 
    }

    if (user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
}
