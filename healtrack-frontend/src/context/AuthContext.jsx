// React Context for global user auth state & role
import React, { createContext, useState, useContext, useEffect } from 'react';
import i18n from 'i18next';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(
                    window.atob(base64).split('').map(function(c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join('')
                );
                const decoded = JSON.parse(jsonPayload);
                // Sync i18n with saved preference immediately
                if (decoded.language) {
                    i18n.changeLanguage(decoded.language);
                }
                return decoded;
            } catch (e) {
                console.error("Invalid token format in localStorage:", e);
                localStorage.removeItem('token');
                return null;
            }
        }
        return null;
    });

    useEffect(() => {
        // Kept for backward compatibility or future token refresh logic
    }, []);

    const login = (userData, token) => {
        setUser(userData);
        localStorage.setItem('token', token);
        if (userData.language) {
            i18n.changeLanguage(userData.language);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
    };

    const changeLanguage = async (newLang) => {
        try {
            await i18n.changeLanguage(newLang);
            if (user) {
                await axiosClient.put('/auth/language', { language: newLang });
                const updatedUser = { ...user, language: newLang };
                setUser(updatedUser);
                
                // Re-encode JWT mock-payload or update token storage if needed
                // For simplicity, we just update the in-memory user state and axios will continue using the active token
            }
        } catch (e) {
            console.error("Failed to sync language change with backend:", e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, changeLanguage }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
