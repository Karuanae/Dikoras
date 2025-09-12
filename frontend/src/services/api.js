
export async function getDashboardStats() {
  const res = await axios.get(`${API_BASE}/admin/api/dashboard-stats`);
  return res.data;
}

export async function getActivityLogs() {
  const res = await axios.get(`${API_BASE}/admin/activity-logs`);
  return res.data;
}
import axios from 'axios';

const API_BASE = '/api';

export async function activateLawyer(lawyerId) {
  return axios.post(`${API_BASE}/admin/lawyers/${lawyerId}/approve`);
}

export async function deactivateLawyer(lawyerId) {
  return axios.post(`${API_BASE}/admin/lawyers/${lawyerId}/reject`, { rejection_reason: 'No longer approved' });
}

export async function getLawyers() {
  const res = await axios.get(`${API_BASE}/admin/lawyers`);
  return res.data;
}

export async function getCases() {
  const res = await axios.get(`${API_BASE}/admin/cases`);
  return res.data;
}

export async function getClients() {
  const res = await axios.get(`${API_BASE}/admin/clients`);
  return res.data;
}

export async function getMessages(clientId) {
  const res = await axios.get(`${API_BASE}/admin/messages`, { params: { client_id: clientId } });
  return res.data;
}

export async function updateCase(caseId, data) {
  const res = await axios.put(`${API_BASE}/admin/cases/${caseId}`, data);
  return res.data;
}


