// Boilerplate: Axios instance with JWT auth interceptor
import axios from 'axios';

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api',
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
