import axios from 'axios';

// Set base URL for your backend
axios.defaults.baseURL = 'http://localhost:5000';

// API base paths for different roles
const ADMIN_BASE = '/admin';
const USER_BASE = '/user';
const CLIENT_BASE = '/client';
const LAWYER_BASE = '/lawyer';
const AUTH_BASE = '/auth';

// Attach JWT token to requests
axios.interceptors.request.use(
  (config) => {
    // Check both 'token' and 'access_token' for compatibility
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== ADMIN ENDPOINTS =====
export async function getDashboardStats() {
  const res = await axios.get(`${ADMIN_BASE}/api/dashboard-stats`);
  return res.data;
}

export async function getAdminDashboard() {
  const res = await axios.get(`${ADMIN_BASE}/dashboard`);
  return res.data;
}

export async function getActivityLogs() {
  const res = await axios.get(`${ADMIN_BASE}/activity-logs`);
  return res.data;
}

export async function activateLawyer(lawyerId) {
  return axios.post(`${ADMIN_BASE}/lawyers/${lawyerId}/approve`);
}

export async function deactivateLawyer(lawyerId) {
  return axios.post(`${ADMIN_BASE}/lawyers/${lawyerId}/reject`, { rejection_reason: 'No longer approved' });
}

export async function getLawyers() {
  const res = await axios.get(`${ADMIN_BASE}/lawyers`);
  return res.data;
}

export async function getClients() {
  const res = await axios.get(`${ADMIN_BASE}/clients`);
  return res.data;
}

export async function getCases() {
  const res = await axios.get(`${ADMIN_BASE}/cases`);
  return res.data;
}

// ===== USER ENDPOINTS =====
export async function registerUser(data) {
  // Map frontend fields to backend
  const payload = {
    username: data.email.split('@')[0],
    email: data.email,
    password: data.password,
    confirm_password: data.confirmPassword,
    first_name: data.firstName,
    last_name: data.lastName,
    user_type: data.role || 'client',
    phone: data.phone,
    address: data.address,
    years_of_experience: data.yearsOfExperience,
    education: data.education,
    hourly_rate: data.hourlyRate,
    bio: data.bio,
    specializations: data.specializations || [],
  };
  const res = await axios.post(`/user/`, payload); // Add trailing slash to avoid CORS redirect
  return res.data;
}

export async function registerLawyer(data) {
  return registerUser({ ...data, role: 'lawyer' });
}

export async function updateUser(userId, data) {
  const res = await axios.patch(`/user/${userId}/`, data); // Add trailing slash to avoid CORS redirect
  return res.data;
}

export async function getUserById(userId) {
  const res = await axios.get(`/user/${userId}/`); // Add trailing slash to avoid CORS redirect
  return res.data;
}

// ===== AUTH ENDPOINTS =====
export async function loginUser(data) {
  const payload = {
    username: data.email || data.username,
    password: data.password,
  };
  const res = await axios.post(`/auth/login`, payload); // Corrected to match backend blueprint
  
  // Store token consistently
  if (res.data && res.data.access_token) {
    localStorage.setItem('access_token', res.data.access_token);
    localStorage.setItem('token', res.data.access_token); // For backward compatibility
  }
  
  // Map backend fields to frontend expectations
  if (res.data && res.data.user) {
    const user = res.data.user;
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.user_type,
      status: user.approval_status,
    };
    localStorage.setItem('user', JSON.stringify(userData));
    return {
      token: res.data.access_token,
      user: userData,
    };
  }
  return res.data;
}

export async function fetchCurrentUser() {
  const res = await axios.get(`/auth/current_user`); // Corrected to match backend blueprint
  if (res.data) {
    const user = res.data;
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.user_type,
      status: user.approval_status,
    };
  }
  return res.data;
}

export async function logoutUser() {
  const response = await axios.delete(`/auth/logout`); // Corrected to match backend blueprint
  // Clear local storage
  localStorage.removeItem('token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  return response;
}

// ===== CLIENT ENDPOINTS =====
export async function getClientDashboard() {
  const res = await axios.get(`${CLIENT_BASE}/dashboard`);
  return res.data;
}

export async function getClientProfile() {
  const res = await axios.get(`${CLIENT_BASE}/profile`);
  return res.data;
}

export async function updateClientProfile(data) {
  const res = await axios.patch(`${CLIENT_BASE}/profile`, data);
  return res.data;
}

export async function getClientCases(params = {}) {
  const res = await axios.get(`${CLIENT_BASE}/cases`, { params });
  return res.data;
}

export async function getClientCaseDetail(caseId) {
  const res = await axios.get(`${CLIENT_BASE}/cases/${caseId}`);
  return res.data;
}

export async function getClientLawyerRequests() {
  const res = await axios.get(`${CLIENT_BASE}/lawyer-requests`);
  return res.data;
}

export async function acceptLawyerRequest(requestId) {
  return axios.post(`${CLIENT_BASE}/lawyer-requests/${requestId}/accept`);
}

export async function rejectLawyerRequest(requestId) {
  return axios.post(`${CLIENT_BASE}/lawyer-requests/${requestId}/reject`);
}

export async function getClientStats() {
  const res = await axios.get(`${CLIENT_BASE}/stats`);
  return res.data;
}

// ===== LAWYER ENDPOINTS =====
export async function getLawyerDashboard() {
  const res = await axios.get(`${LAWYER_BASE}/dashboard`);
  return res.data;
}

export async function getLawyerProfile() {
  const res = await axios.get(`${LAWYER_BASE}/profile`);
  return res.data;
}

export async function updateLawyerProfile(data) {
  const res = await axios.put(`${LAWYER_BASE}/profile`, data);
  return res.data;
}

export async function getLawyerCases(params = {}) {
  const res = await axios.get(`${LAWYER_BASE}/cases`, { params });
  return res.data;
}

export async function getLawyerCaseDetail(caseId) {
  const res = await axios.get(`${LAWYER_BASE}/cases/${caseId}`);
  return res.data;
}

export async function getAvailableCases(params = {}) {
  const res = await axios.get(`${LAWYER_BASE}/available-cases`, { params });
  return res.data;
}

export async function requestCase(caseId, data) {
  return axios.post(`${LAWYER_BASE}/cases/${caseId}/request`, data);
}

export async function getLawyerRequests(params = {}) {
  const res = await axios.get(`${LAWYER_BASE}/my-requests`, { params });
  return res.data;
}

export async function updateCaseStatus(caseId, status) {
  return axios.put(`${LAWYER_BASE}/cases/${caseId}/status`, { status });
}

export async function getLawyerInvoices(params = {}) {
  const res = await axios.get(`${LAWYER_BASE}/invoices`, { params });
  return res.data;
}

export async function createLawyerInvoice(data) {
  return axios.post(`${LAWYER_BASE}/invoices`, data);
}

export async function sendInvoice(invoiceId) {
  return axios.post(`${LAWYER_BASE}/invoices/${invoiceId}/send`);
}

export async function getLawyerTransactions(params = {}) {
  const res = await axios.get(`${LAWYER_BASE}/transactions`, { params });
  return res.data;
}

export async function getLawyerDocuments(params = {}) {
  const res = await axios.get(`${LAWYER_BASE}/documents`, { params });
  return res.data;
}

export async function getLawyerNotifications(params = {}) {
  const res = await axios.get(`${LAWYER_BASE}/notifications`, { params });
  return res.data;
}

export async function getLawyerStats() {
  const res = await axios.get(`${LAWYER_BASE}/stats`);
  return res.data;
}

// ===== MISSING FUNCTIONS (from your error list) =====

// Client functions that were missing
export async function getMessages(params = {}) {
  // This might need a backend endpoint - using client messages for now
  const res = await axios.get(`${CLIENT_BASE}/messages`, { params });
  return res.data;
}

export async function updateCase(caseId, data) {
  // This might need a backend endpoint
  const res = await axios.patch(`${CLIENT_BASE}/cases/${caseId}`, data);
  return res.data;
}

export async function getClientContacts() {
  // This might need a backend endpoint
  const res = await axios.get(`${CLIENT_BASE}/contacts`);
  return res.data;
}

export async function getClientMessages(params = {}) {
  const res = await axios.get(`${CLIENT_BASE}/messages`, { params });
  return res.data;
}

export async function sendClientMessage(data) {
  return axios.post(`${CLIENT_BASE}/messages`, data);
}

export async function getClientTransactionSummary() {
  const res = await axios.get(`${CLIENT_BASE}/transaction-summary`);
  return res.data;
}

export async function getClientTransactions(params = {}) {
  const res = await axios.get(`${CLIENT_BASE}/transactions`, { params });
  return res.data;
}

// Lawyer functions that were missing
export async function getLawyerClients() {
  const res = await axios.get(`${LAWYER_BASE}/clients`);
  return res.data;
}

export async function getLawyerMessages(params = {}) {
  const res = await axios.get(`${LAWYER_BASE}/messages`, { params });
  return res.data;
}

export async function sendLawyerMessage(data) {
  return axios.post(`${LAWYER_BASE}/messages`, data);
}

export async function getLawyerSettings() {
  // Alias for lawyer profile
  return getLawyerProfile();
}

export async function updateLawyerSettings(data) {
  // Alias for lawyer profile update
  return updateLawyerProfile(data);
}

// ===== EXISTING FUNCTIONS (keeping them for compatibility) =====

// Case endpoints
export async function getCaseById(caseId) {
  return axios.get(`/case/${caseId}`).then(res => res.data);
}

export async function getAllCases(params = {}) {
  return axios.get(`/case/`, { params }).then(res => res.data);
}

export async function createCase(data) {
  return axios.post(`/case/`, data).then(res => res.data);
}

export async function updateCaseById(caseId, data) {
  return axios.patch(`/case/${caseId}`, data).then(res => res.data);
}

export async function deleteCase(caseId) {
  return axios.delete(`/case/${caseId}`).then(res => res.data);
}

// Document endpoints
export async function getDocuments(params = {}) {
  return axios.get(`/document/`, { params }).then(res => res.data);
}

export async function getDocumentById(documentId) {
  return axios.get(`/document/${documentId}`).then(res => res.data);
}

export async function uploadDocument(data) {
  return axios.post(`/document/`, data).then(res => res.data);
}

export async function updateDocument(documentId, data) {
  return axios.patch(`/document/${documentId}`, data).then(res => res.data);
}

export async function deleteDocument(documentId) {
  return axios.delete(`/document/${documentId}`).then(res => res.data);
}

// Invoice endpoints
export async function getInvoices(params = {}) {
  return axios.get(`/invoice/`, { params }).then(res => res.data);
}

export async function getInvoiceById(invoiceId) {
  return axios.get(`/invoice/${invoiceId}`).then(res => res.data);
}

export async function createInvoice(data) {
  return axios.post(`/invoice/`, data).then(res => res.data);
}

export async function updateInvoice(invoiceId, data) {
  return axios.patch(`/invoice/${invoiceId}`, data).then(res => res.data);
}

export async function deleteInvoice(invoiceId) {
  return axios.delete(`/invoice/${invoiceId}`).then(res => res.data);
}

// Notification endpoints
export async function getNotifications(params = {}) {
  return axios.get(`/notification/`, { params }).then(res => res.data);
}

export async function markNotificationRead(notificationId) {
  return axios.patch(`/notification/${notificationId}/read`).then(res => res.data);
}

// Transaction endpoints
export async function getTransactions(params = {}) {
  return axios.get(`/transaction/`, { params }).then(res => res.data);
}

export async function getTransactionById(transactionId) {
  return axios.get(`/transaction/${transactionId}`).then(res => res.data);
}

export async function createTransaction(data) {
  return axios.post(`/transaction/`, data).then(res => res.data);
}

export async function updateTransaction(transactionId, data) {
  return axios.patch(`/transaction/${transactionId}`, data).then(res => res.data);
}

export async function deleteTransaction(transactionId) {
  return axios.delete(`/transaction/${transactionId}`).then(res => res.data);
}

// Chat endpoints for unified Chat.jsx
export async function getClientChats(params = {}) {
  // e.g. /client/chats?contact_id=xxx
  return axios.get(`/client/chats`, { params }).then(res => res.data);
}

export async function getLawyerChats(params = {}) {
  // e.g. /lawyer/chats?contact_id=xxx
  return axios.get(`/lawyer/chats`, { params }).then(res => res.data);
}

export async function sendClientChat(data) {
  // e.g. /client/chats (POST)
  return axios.post(`/client/chats`, data).then(res => res.data);
}

export async function sendLawyerChat(data) {
  // e.g. /lawyer/chats (POST)
  return axios.post(`/lawyer/chats`, data).then(res => res.data);
}

// Legal Service endpoints
export async function getLegalServices(params = {}) {
  return axios.get(`/admin/legal-services`, { params }).then(res => res.data);
}

export async function createLegalService(data) {
  return axios.post(`/admin/legal-services`, data).then(res => res.data);
}

export async function updateLegalService(serviceId, data) {
  return axios.put(`/admin/legal-services/${serviceId}`, data).then(res => res.data);
}

// Notification for lawyer/client
export async function getUserNotifications(params = {}) {
  return axios.get(`/notification/`, { params }).then(res => res.data);
}

// Activity log (admin)
export async function getAdminActivityLogs(params = {}) {
  return axios.get(`/admin/activity-logs`, { params }).then(res => res.data);
}

// ===== UTILITY FUNCTIONS =====
export const getAuthToken = () => {
  return localStorage.getItem('access_token') || localStorage.getItem('token');
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

export const getUserFromStorage = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const clearUserData = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};