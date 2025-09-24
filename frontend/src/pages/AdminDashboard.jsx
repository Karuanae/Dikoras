import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getLawyers, getCases, getClients, activateLawyer, deactivateLawyer } from '../services/api';

export default function AdminDashboard() {
  const [pendingLawyers, setPendingLawyers] = useState([]);
  const [recentContacts, setRecentContacts] = useState([]);
  const [newCases, setNewCases] = useState([]);
  const [stats, setStats] = useState({
    totalLawyers: 42,
    totalClients: 128,
    activeCases: 76,
    pendingApprovals: 5,
    unassignedCases: 8,
    revenue: 12560
  });
  const [selectedCase, setSelectedCase] = useState(null);
  const [assignLawyerId, setAssignLawyerId] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  // Fetch data from API
  useEffect(() => {
    async function fetchData() {
      try {
        const statsData = await getDashboardStats();
        setStats(statsData);
        const lawyersData = await getLawyers();
        setPendingLawyers(lawyersData.filter(l => l.status === 'pending'));
        setLawyerOptions(lawyersData);
        const casesData = await getCases();
        setNewCases(casesData.filter(c => c.status === 'new'));
        // If you have an API for recent contacts, fetch here. Otherwise, leave as empty array.
        // Example: const contactsData = await getRecentContacts(); setRecentContacts(contactsData);
        setRecentContacts([]); // TODO: Replace with API call if available
      } catch (err) {
        // Handle error (show notification, etc.)
      }
    }
    fetchData();
  }, []);

  const [lawyerOptions, setLawyerOptions] = useState([]);

  const handleApprove = async (id) => {
    try {
      await activateLawyer(id);
      setPendingLawyers(pendingLawyers.filter(lawyer => lawyer.id !== id));
      setStats({...stats, pendingApprovals: stats.pendingApprovals - 1});
    } catch (err) {
      // Handle error
    }
  };

  const handleDisapprove = async (id) => {
    try {
      await deactivateLawyer(id);
      setPendingLawyers(pendingLawyers.filter(lawyer => lawyer.id !== id));
      setStats({...stats, pendingApprovals: stats.pendingApprovals - 1});
    } catch (err) {
      // Handle error
    }
  };

  const handleAssignLawyer = async () => {
    if (selectedCase && assignLawyerId) {
      // TODO: Call API to assign lawyer to case
      setNewCases(newCases.filter(c => c.id !== selectedCase.id));
      setStats({...stats, unassignedCases: stats.unassignedCases - 1});
      setSelectedCase(null);
      setAssignLawyerId('');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold text-blue-900 mb-2">Admin Dashboard</h1>
      <p className="text-lg text-blue-700 mb-6">Welcome, Admin! Manage all users, cases, and platform activity from one place.</p>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
          <span className="text-2xl font-bold text-blue-700 mb-1">{stats.totalLawyers}</span>
          <span className="text-blue-900 text-sm font-semibold">Total Lawyers</span>
        </div>
        <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
          <span className="text-2xl font-bold text-blue-700 mb-1">{stats.totalClients}</span>
          <span className="text-blue-900 text-sm font-semibold">Total Clients</span>
        </div>
        <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
          <span className="text-2xl font-bold text-blue-700 mb-1">{stats.activeCases}</span>
          <span className="text-blue-900 text-sm font-semibold">Active Cases</span>
        </div>
        <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
          <span className="text-2xl font-bold text-blue-700 mb-1">{stats.pendingApprovals}</span>
          <span className="text-blue-900 text-sm font-semibold">Pending Approvals</span>
        </div>
        <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
          <span className="text-2xl font-bold text-blue-700 mb-1">{stats.unassignedCases}</span>
          <span className="text-blue-900 text-sm font-semibold">Unassigned Cases</span>
        </div>
        <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
          <span className="text-2xl font-bold text-blue-700 mb-1">${stats.revenue}</span>
          <span className="text-blue-900 text-sm font-semibold">Revenue</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button 
          className={`py-2 px-4 font-medium ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`py-2 px-4 font-medium ${activeTab === 'lawyers' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('lawyers')}
        >
          Lawyer Approvals
        </button>
        <button 
          className={`py-2 px-4 font-medium ${activeTab === 'cases' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('cases')}
        >
          Case Management
        </button>
        <button 
          className={`py-2 px-4 font-medium ${activeTab === 'contacts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('contacts')}
        >
          Client-Lawyer Contacts
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow">
            <img src="https://cdn-icons-png.flaticon.com/512/2921/2921222.png" alt="Manage Lawyers" className="w-16 h-16" />
            <div>
              <h2 className="font-bold text-blue-900 text-lg mb-1">Manage Lawyers</h2>
              <p className="text-blue-700 text-sm">Approve, disapprove, and view all lawyers. See status and details.</p>
              <button 
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-3 rounded"
                onClick={() => setActiveTab('lawyers')}
              >
                View Pending Approvals
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow">
            <img src="https://cdn-icons-png.flaticon.com/512/2921/2921223.png" alt="Manage Cases" className="w-16 h-16" />
            <div>
              <h2 className="font-bold text-blue-900 text-lg mb-1">Manage Cases</h2>
              <p className="text-blue-700 text-sm">Assign lawyers, view case details, and manage all submissions.</p>
              <button 
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-3 rounded"
                onClick={() => setActiveTab('cases')}
              >
                View New Cases
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow md:col-span-2">
            <img src="https://cdn-icons-png.flaticon.com/512/2921/2921224.png" alt="Monitor Contacts" className="w-16 h-16" />
            <div>
              <h2 className="font-bold text-blue-900 text-lg mb-1">Monitor Contacts</h2>
              <p className="text-blue-700 text-sm">See which clients contacted which lawyers and stay updated on all communications.</p>
              <button 
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-3 rounded"
                onClick={() => setActiveTab('contacts')}
              >
                View Recent Contacts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lawyer Approvals Tab */}
      {activeTab === 'lawyers' && (
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Pending Lawyer Approvals</h2>
          {pendingLawyers.length === 0 ? (
            <p className="text-blue-700">No pending approvals at this time.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="p-3 text-left text-blue-900">Name</th>
                    <th className="p-3 text-left text-blue-900">Specialization</th>
                    <th className="p-3 text-left text-blue-900">Email</th>
                    <th className="p-3 text-left text-blue-900">Registration Date</th>
                    <th className="p-3 text-left text-blue-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLawyers.map(lawyer => (
                    <tr key={lawyer.id} className="border-b border-gray-100">
                      <td className="p-3">{lawyer.name}</td>
                      <td className="p-3">{lawyer.specialization}</td>
                      <td className="p-3">{lawyer.email}</td>
                      <td className="p-3">{lawyer.registrationDate}</td>
                      <td className="p-3">
                        <button 
                          className="bg-green-500 hover:bg-green-600 text-white font-medium py-1 px-3 rounded mr-2"
                          onClick={() => handleApprove(lawyer.id)}
                        >
                          Approve
                        </button>
                        <button 
                          className="bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded"
                          onClick={() => handleDisapprove(lawyer.id)}
                        >
                          Disapprove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Case Management Tab */}
      {activeTab === 'cases' && (
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">New Case Submissions</h2>
          {newCases.length === 0 ? (
            <p className="text-blue-700">No new cases at this time.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="p-3 text-left text-blue-900">Case Title</th>
                    <th className="p-3 text-left text-blue-900">Client</th>
                    <th className="p-3 text-left text-blue-900">Type</th>
                    <th className="p-3 text-left text-blue-900">Description</th>
                    <th className="p-3 text-left text-blue-900">Submitted</th>
                    <th className="p-3 text-left text-blue-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {newCases.map(caseItem => (
                    <tr key={caseItem.id} className="border-b border-gray-100">
                      <td className="p-3 font-medium">{caseItem.title}</td>
                      <td className="p-3">{caseItem.client}</td>
                      <td className="p-3">{caseItem.type}</td>
                      <td className="p-3 max-w-xs truncate">{caseItem.description}</td>
                      <td className="p-3">{caseItem.submitted}</td>
                      <td className="p-3">
                        <button 
                          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-3 rounded"
                          onClick={() => setSelectedCase(caseItem)}
                        >
                          Assign Lawyer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {selectedCase && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Assign Lawyer to: {selectedCase.title}</h3>
              <div className="flex items-center space-x-2">
                <select 
                  value={assignLawyerId} 
                  onChange={e => setAssignLawyerId(e.target.value)}
                  className="p-2 border border-gray-300 rounded"
                >
                  <option value="">Select a lawyer</option>
                  {lawyerOptions.map(lawyer => (
                    <option key={lawyer.id} value={lawyer.id}>
                      {lawyer.name} ({lawyer.specialization})
                    </option>
                  ))}
                </select>
                <button 
                  className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded"
                  onClick={handleAssignLawyer}
                >
                  Assign
                </button>
                <button 
                  className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded"
                  onClick={() => setSelectedCase(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Client-Lawyer Contacts Tab */}
      {activeTab === 'contacts' && (
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Recent Client-Lawyer Contacts</h2>
          {recentContacts.length === 0 ? (
            <p className="text-blue-700">No recent contacts to display.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="p-3 text-left text-blue-900">Client</th>
                    <th className="p-3 text-left text-blue-900">Lawyer</th>
                    <th className="p-3 text-left text-blue-900">Case Type</th>
                    <th className="p-3 text-left text-blue-900">Date & Time</th>
                    <th className="p-3 text-left text-blue-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentContacts.map(contact => (
                    <tr key={contact.id} className="border-b border-gray-100">
                      <td className="p-3">{contact.clientName}</td>
                      <td className="p-3">{contact.lawyerName}</td>
                      <td className="p-3">{contact.caseType}</td>
                      <td className="p-3">{contact.date}</td>
                      <td className="p-3">
                        <button className="text-blue-600 hover:text-blue-800 font-medium">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats Footer */}
      <div className="bg-white rounded-xl shadow p-6 mt-8">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">Platform Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700">{stats.totalLawyers}</div>
            <div className="text-blue-900">Total Lawyers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700">{stats.totalClients}</div>
            <div className="text-blue-900">Total Clients</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700">{stats.activeCases}</div>
            <div className="text-blue-900">Active Cases</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700">${stats.revenue}</div>
            <div className="text-blue-900">Total Revenue</div>
          </div>
        </div>
      </div>
    </div>
  );
}