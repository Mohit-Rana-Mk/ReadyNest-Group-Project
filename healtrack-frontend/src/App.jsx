// Wraps AppRouter in AuthProvider
import React from 'react';
import AppRouter from './routes/AppRouter';
import { AuthProvider } from './context/AuthContext';
import './index.css'; // Assuming Tailwind base

import { ToastContainer } from './components/ui/Toast';

function App() {
    return (
        <AuthProvider>
            <AppRouter />
            <ToastContainer />
        </AuthProvider>
    );
}

export default App;
