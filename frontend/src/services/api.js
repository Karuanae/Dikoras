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
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        console.log('Authentication failed, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ===== CHAT ENDPOINTS =====
export async function getClientChats(params = {}) {
  const caseId = params.case_id || params.contact_id;
  if (!caseId) return [];
  
  try {
    const res = await axios.get(`/chat/api/messages/${caseId}`);
    return Array.isArray(res.data)
      ? res.data.map(msg => ({
          id: msg.id,
          sender: msg.is_current_user ? 'client' : 'lawyer',
          chat: msg.message,
          created_at: msg.created_at,
          sender_name: msg.sender_name,
          attachment_url: msg.attachment_url,
          attachment_name: msg.attachment_name
        }))
      : [];
  } catch (err) {
    console.error('Error fetching client chats:', err);
    if (err.response?.status === 401) {
      throw new Error('Authentication required');
    }
    throw err;
  }
}

export async function getLawyerChats(params = {}) {
  const caseId = params.case_id || params.contact_id;
  if (!caseId) return [];
  
  try {
    const res = await axios.get(`/chat/api/messages/${caseId}`);
    return Array.isArray(res.data)
      ? res.data.map(msg => ({
          id: msg.id,
          sender: msg.is_current_user ? 'lawyer' : 'client',
          chat: msg.message,
          created_at: msg.created_at,
          sender_name: msg.sender_name,
          attachment_url: msg.attachment_url,
          attachment_name: msg.attachment_name
        }))
      : [];
  } catch (err) {
    console.error('Error fetching lawyer chats:', err);
    if (err.response?.status === 401) {
      throw new Error('Authentication required');
    }
    throw err;
  }
}

export async function sendChatWithAttachment({ case_id, chat, file }) {
  if (!case_id || (!chat && !file)) throw new Error('Missing case_id or content');
  
  try {
    const formData = new FormData();
    if (chat) formData.append('message', chat);
    if (file) formData.append('file', file);
    
    const res = await axios.post(`/chat/${case_id}/send`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  } catch (err) {
    console.error('Error sending chat message:', err);
    if (err.response?.status === 401) {
      throw new Error('Authentication required');
    }
    throw err;
  }
}

export async function getUnreadChatsCount(caseId) {
  if (!caseId) return 0;
  try {
    const res = await axios.get(`/chat/api/messages/${caseId}`);
    if (!Array.isArray(res.data)) return 0;
    const userId = getUserFromStorage()?.id;
    return res.data.filter(msg => msg.sender_id !== userId && msg.is_read === false).length;
  } catch (err) {
    console.error('Error getting unread count:', err);
    return 0;
  }
}

export async function createDirectChatCase(data) {
  try {
    const res = await axios.post(`${LAWYER_BASE}/direct-chat-case`, data);
    return res.data;
  } catch (err) {
    console.error('Error creating direct chat case:', err);
    if (err.response?.status === 401) {
      throw new Error('Authentication required');
    }
    throw err;
  }
}

// ===== ADMIN ENDPOINTS =====
export async function getDashboardStats() {
  const res = await axios.get(`${ADMIN_BASE}/api/dashboard-stats`);
  return res.data;
}

export async function getAdminDashboard() {
  const res = await axios.get(`${ADMIN_BASE}/dashboard`);
  return res.data;
}

export async function addLegalService(serviceData) {
  try {
    const res = await axios.post(`${ADMIN_BASE}/legal-services`, serviceData);
    return res.data;
  } catch (err) {
    console.error('Error adding legal service:', err);
    throw err;
  }
}

export async function assignLawyersToCase(caseId, lawyerIds) {
  try {
    const res = await axios.post(`${ADMIN_BASE}/cases/${caseId}/assign-lawyers`, {
      lawyer_ids: lawyerIds
    });
    return res.data;
  } catch (err) {
    console.error('Error assigning lawyers to case:', err);
    throw err;
  }
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
  const res = await axios.get(`/user/?user_type=lawyer`);
  return res.data;
}

export async function getClients() {
  const res = await axios.get(`${ADMIN_BASE}/clients`);
  return res.data;
}

export async function getCases() {
  const res = await axios.get(`${ADMIN_BASE}/cases`);
  return res.data.cases || [];
}

// ===== USER ENDPOINTS =====
export async function registerUser(data) {
  const payload = {
    username: data.username || '',
    email: data.email || '',
    password: data.password || '',
    confirm_password: data.confirm_password || data.confirmPassword || '',
    first_name: data.first_name || data.firstName || '',
    last_name: data.last_name || data.lastName || '',
    user_type: data.user_type || data.role || 'client',
    phone: data.phone || '',
    address: data.address || '',
    years_of_experience: data.years_of_experience || data.yearsOfExperience || data.experience || '',
    education: data.education || '',
    hourly_rate: data.hourly_rate || data.hourlyRate || '',
    bio: data.bio || '',
    specializations: data.specializations || [],
  };
  const res = await axios.post(`/user/`, payload);
  return res.data;
}

export async function registerLawyer(data) {
  return registerUser({ ...data, role: 'lawyer' });
}

export async function updateUser(userId, data) {
  const res = await axios.patch(`/user/${userId}/`, data);
  return res.data;
}

export async function getUserById(userId) {
  const res = await axios.get(`/user/${userId}/`);
  return res.data;
}

// ===== AUTH ENDPOINTS =====
export async function loginUser(data) {
  const payload = {
    username: data.username || data.email,
    password: data.password,
  };
  const res = await axios.post(`/auth/login`, payload);
  
  if (res.data && res.data.access_token) {
    localStorage.setItem('access_token', res.data.access_token);
    localStorage.setItem('token', res.data.access_token);
  }
  
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
  const res = await axios.get(`/auth/current_user`);
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
  const response = await axios.delete(`/auth/logout`);
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

export async function createClientCase(data) {
  try {
    const res = await axios.post(`${CLIENT_BASE}/cases`, data);
    return res.data;
  } catch (err) {
    console.error('Error creating case:', err);
    throw err;
  }
}
export const createCase = createClientCase;

export async function getClientNotifications(params = {}) {
  try {
    const res = await axios.get(`${CLIENT_BASE}/notifications`, { params });
    return res.data;
  } catch (err) {
    if (err.response?.status === 404) {
      return [];
    }
    throw err;
  }
}

export async function markNotificationAsRead(notificationId) {
  try {
    const res = await axios.patch(`${CLIENT_BASE}/notifications/${notificationId}/read`);
    return res.data;
  } catch (err) {
    console.error('Error marking notification as read:', err);
    throw err;
  }
}

// ===== LAWYER ENDPOINTS =====
export async function getLawyerDashboard() {
  const res = await axios.get(`${LAWYER_BASE}/dashboard`);
  return res.data;
}

export async function getLawyerCases() {
  try {
    const res = await axios.get(`${LAWYER_BASE}/cases`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error('Error fetching lawyer cases:', err);
    return [];
  }
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

export async function getLawyerClients() {
  try {
    const res = await axios.get(`${LAWYER_BASE}/clients`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error('Error fetching lawyer clients:', err);
    return [];
  }
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

// Upload document with file (multipart/form-data)
export async function uploadDocumentWithFile({ case_id, file, title, document_type, description, is_confidential }) {
  if (!case_id || !file) throw new Error('Missing case_id or file');
  const formData = new FormData();
  formData.append('file', file);
  if (title) formData.append('title', title);
  if (document_type) formData.append('document_type', document_type);
  if (description) formData.append('description', description);
  if (is_confidential !== undefined) formData.append('is_confidential', is_confidential);
  const res = await axios.post(`/document/upload/${case_id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}

// Request invoice (for lawyer)
export async function requestInvoice({ case_id, amount, description, tax_amount, due_days }) {
  if (!case_id || !amount || !description) throw new Error('Missing required invoice fields');
  const res = await axios.post(`/invoice/`, {
    case_id,
    amount,
    description,
    tax_amount: tax_amount || 0,
    due_days: due_days || 30
  });
  return res.data;
}

// Export transactions as CSV (downloads file)
export async function exportTransactions() {
  const res = await axios.get(`/transaction/export`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'transactions.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// ===== ADMIN CHAT ENDPOINTS =====
export async function getAdminChatActivities() {
  try {
    const res = await axios.get(`${ADMIN_BASE}/chat-activities`);
    return res.data;
  } catch (err) {
    console.error('Error fetching admin chat activities:', err);
    throw err;
  }
}

export async function getAllChatsForAdmin() {
  try {
    const res = await axios.get(`${ADMIN_BASE}/all-chats`);
    return res.data;
  } catch (err) {
    console.error('Error fetching all chats:', err);
    throw err;
  }
}

// Helper function to get chat messages for a specific case (for admin)
export async function getChatMessagesForAdmin(caseId) {
  try {
    const res = await axios.get(`/chat/api/messages/${caseId}`);
    return res.data;
  } catch (err) {
    console.error(`Error fetching chats for case ${caseId}:`, err);
    throw err;
  }
}

// ===== DOCUMENT ENDPOINTS =====

// Get documents for a client
export async function getClientDocuments(params = {}) {
  try {
    const response = await axios.get('/document/', { params });
    return response.data;
  } catch (err) {
    console.error('Error fetching client documents:', err);
    throw err;
  }
}

// Get documents for a specific case
export async function getCaseDocuments(caseId) {
  try {
    const response = await axios.get('/document/', { params: { case_id: caseId } });
    return response.data;
  } catch (err) {
    console.error('Error fetching case documents:', err);
    throw err;
  }
}

// Download a document
export async function downloadDocument(documentId) {
  try {
    const response = await axios.get(`/document/download/${documentId}`, {
      responseType: 'blob' // Important for file downloads
    });
    
    // Create download link from blob
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Extract filename from response headers or use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = `document-${documentId}`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, filename };
  } catch (err) {
    console.error('Download error:', err);
    throw new Error('Failed to download document');
  }
}

// Upload document (enhanced version)
export async function uploadDocument(data) {
  try {
    const formData = new FormData();
    
    // Append file if provided
    if (data.file) {
      formData.append('file', data.file);
    }
    
    // Append other data as JSON
    const documentData = {
      title: data.title,
      document_type: data.document_type,
      description: data.description,
      is_confidential: data.is_confidential || false
    };
    
    formData.append('data', JSON.stringify(documentData));
    
    const response = await axios.post(`/document/upload/${data.case_id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (err) {
    console.error('Upload error:', err);
    throw err;
  }
}

// Get document details
export async function getDocument(documentId) {
  try {
    const response = await axios.get(`/document/${documentId}`);
    return response.data;
  } catch (err) {
    console.error('Error fetching document:', err);
    throw err;
  }
}


// ===== COMMON ENDPOINTS =====
export async function uploadFile(file, caseId = null) {
  const formData = new FormData();
  formData.append('file', file);
  if (caseId) formData.append('case_id', caseId);
  
  const res = await axios.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}

export async function getLegalServices() {
  try {
    const res = await axios.get('/legal-services');
    return res.data;
  } catch (err) {
    console.error('Error fetching legal services:', err);
    return [];
  }
}

export async function getCaseStatusOptions() {
  return [
    { value: 'open', label: 'Open' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];
}

export async function getPriorityOptions() {
  return [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];
}