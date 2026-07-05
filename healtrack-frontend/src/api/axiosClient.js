// Boilerplate: Axios instance with JWT auth interceptor
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://healtrack-backend-7h3o.onrender.com/api';
export const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

const axiosClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor to attach JWT
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token'); // Simplistic token retrieval
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

export default axiosClient;
