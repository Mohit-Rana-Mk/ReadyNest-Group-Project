import axiosClient from './axiosClient';

// A. Patient Payment APIs
export const createPaymentOrder = async (payload) => {
    const response = await axiosClient.post('/payments/create-order', payload);
    return response.data;
};

export const verifyPaymentSignature = async (payload) => {
    const response = await axiosClient.post('/payments/verify', payload);
    return response.data;
};

export const fetchPatientPayments = async () => {
    const response = await axiosClient.get('/payments/history');
    return response.data;
};

export const fetchPaymentDetails = async (paymentId) => {
    const response = await axiosClient.get(`/payments/details/${paymentId}`);
    return response.data;
};

export const submitRefundRequest = async (payload) => {
    const response = await axiosClient.post('/payments/refund-request', payload);
    return response.data;
};

// B. Clinic Admin APIs
export const fetchClinicFinancials = async (clinicId) => {
    const response = await axiosClient.get('/payments/clinic/financials', {
        params: clinicId ? { clinic_id: clinicId } : {}
    });
    return response.data;
};

export const fetchClinicBankDetails = async (clinicId) => {
    const response = await axiosClient.get('/payments/clinic/bank-details', {
        params: clinicId ? { clinic_id: clinicId } : {}
    });
    return response.data;
};

export const updateClinicBankDetails = async (payload) => {
    const response = await axiosClient.post('/payments/clinic/bank-details', payload);
    return response.data;
};

// C. Super Admin APIs
export const fetchAdminOverview = async () => {
    const response = await axiosClient.get('/payments/admin/overview');
    return response.data;
};

export const fetchAllPayments = async (params = {}) => {
    const response = await axiosClient.get('/payments/admin/payments', { params });
    return response.data;
};

export const fetchClinicsSettlementSummary = async () => {
    const response = await axiosClient.get('/payments/admin/clinics-settlement-summary');
    return response.data;
};

export const recordAdminSettlement = async (payload) => {
    const response = await axiosClient.post('/payments/admin/settlements', payload);
    return response.data;
};

export const fetchPendingBankAccounts = async () => {
    const response = await axiosClient.get('/payments/admin/bank-details/pending');
    return response.data;
};

export const approveBankDetails = async (id, status) => {
    const response = await axiosClient.put(`/payments/admin/bank-details/${id}/approve`, { status });
    return response.data;
};

export const fetchRefundRequests = async () => {
    const response = await axiosClient.get('/payments/admin/refunds');
    return response.data;
};

export const processRefundRequest = async (id, status) => {
    const response = await axiosClient.post(`/payments/admin/refunds/${id}/process`, { status });
    return response.data;
};
