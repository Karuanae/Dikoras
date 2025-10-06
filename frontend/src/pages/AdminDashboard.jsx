import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getLawyers, getCases, getClients, activateLawyer, deactivateLawyer, assignLawyersToCase } from '../services/api';

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
  const [assignLawyerIds, setAssignLawyerIds] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  // Fetch data from API
// Fix the fetchData function - there's a syntax error
useEffect(() => {
  async function fetchData() {
    try {
      const statsData = await getDashboardStats();
      // Map backend keys to frontend keys
      setStats({
        totalLawyers: statsData.total_lawyers || statsData.totalLawyers || statsData.total_users || 0,
        totalClients: statsData.total_clients || statsData.totalClients || 0,
        activeCases: statsData.active_cases || statsData.activeCases || statsData.open_cases || 0,
        pendingApprovals: statsData.pending_lawyers || statsData.pendingApprovals || statsData.pending_lawyers || 0,
        unassignedCases: statsData.unassigned_cases || statsData.unassignedCases || 0,
        revenue: statsData.total_revenue || statsData.revenue || 0
      });
      
      const lawyersData = await getLawyers();
      setPendingLawyers(lawyersData.filter(l => l.approval_status === 'pending'));
      setLawyerOptions(lawyersData);
      
      const casesData = await getCases();
      setNewCases(casesData);
      setRecentContacts([]);
    } catch (err) {
      console.error('Error fetching data:', err);
      // Handle error properly
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
  if (selectedCase && assignLawyerIds.length > 0) {
    try {
      console.log('Assigning case:', selectedCase.id, 'to lawyers:', assignLawyerIds);
      
      const result = await assignLawyersToCase(selectedCase.id, assignLawyerIds);
      
      console.log('Assignment result:', result);
      
      if (result.success) {
        // Remove the case from the list
        setNewCases(newCases.filter(c => c.id !== selectedCase.id));
        setStats({...stats, unassignedCases: stats.unassignedCases - 1});
        setSelectedCase(null);
        setAssignLawyerIds([]);
        
        // Show detailed success message
        alert(`✅ Success! ${result.message}\n\nAssigned to: ${result.assigned_lawyers.map(l => l.name).join(', ')}\n\nCase should now appear in the lawyer's dashboard.`);
        
        // Optional: Refresh the cases list to verify it's gone
        setTimeout(() => {
          fetchData(); // Re-fetch data to ensure UI is updated
        }, 1000);
      } else {
        alert(`Assignment failed: ${result.errors?.join(', ') || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Assignment error:', err);
      const errorMsg = err.response?.data?.error || err.message;
      alert(`Assignment failed: ${errorMsg}\n\nCheck browser console for details.`);
    }
  }
};

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col py-8 px-4">
        <h2 className="text-2xl font-extrabold text-blue-900 mb-8 text-center">Admin</h2>
        <nav className="flex flex-col gap-2">
          <button
            className={`text-left px-4 py-2 rounded font-medium transition-colors ${activeTab === 'overview' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`text-left px-4 py-2 rounded font-medium transition-colors ${activeTab === 'lawyers' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab('lawyers')}
          >
            Lawyer Approvals
          </button>
          <button
            className={`text-left px-4 py-2 rounded font-medium transition-colors ${activeTab === 'cases' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab('cases')}
          >
            Case Management
          </button>
          <button
            className={`text-left px-4 py-2 rounded font-medium transition-colors ${activeTab === 'contacts' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab('contacts')}
          >
            Client-Lawyer Contacts
          </button>
          <button
            className={`text-left px-4 py-2 rounded font-medium transition-colors mt-4 border-t border-gray-200 ${window.location.pathname === '/admin/services/add' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
            onClick={() => navigate('/admin/services/add')}
          >
            + Add Legal Service
          </button>
        </nav>
      </aside>
      {/* Main Content */}
  <main className="flex-1 p-8">
        <h1 className="text-3xl font-extrabold text-blue-900 mb-2">Admin Dashboard</h1>
        <p className="text-lg text-blue-700 mb-6">Welcome, Admin! Manage all users, cases, and platform activity from one place.</p>

        {/* Main Tab Content */}
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
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
              {/* Add Legal Service Card */}
              <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow md:col-span-2">
                <img src="https://cdn-icons-png.flaticon.com/512/2921/2921225.png" alt="Add Legal Service" className="w-16 h-16" />
                <div>
                  <h2 className="font-bold text-blue-900 text-lg mb-1">Add Legal Service</h2>
                  <p className="text-blue-700 text-sm">Create a new legal service for clients to request.</p>
                  <button
                    className="mt-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-1 px-3 rounded"
                    onClick={() => navigate('/admin/services/add')}
                  >
                    Add Legal Service
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
          </>
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
                      <td className="p-3">{lawyer.first_name} {lawyer.last_name} ({lawyer.username})</td>
                      <td className="p-3">{Array.isArray(lawyer.specializations) ? lawyer.specializations.join(', ') : lawyer.specializations}</td>
                      <td className="p-3">{lawyer.email}</td>
                      <td className="p-3">{lawyer.created_at ? new Date(lawyer.created_at).toLocaleDateString() : ''}</td>
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
                      <td className="p-3">{caseItem.client ? caseItem.client.name : ''}</td>
                      <td className="p-3">{caseItem.legal_service ? caseItem.legal_service.name : ''}</td>
                      <td className="p-3 max-w-xs truncate">{caseItem.description}</td>
                      <td className="p-3">{caseItem.created_at ? new Date(caseItem.created_at).toLocaleString() : ''}</td>
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
                  multiple
                  value={assignLawyerIds}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, opt => opt.value);
                    setAssignLawyerIds(options);
                  }}
                  className="p-2 border border-gray-300 rounded"
                  style={{ minWidth: '200px', height: '120px' }}
                >
                  {lawyerOptions.map(lawyer => (
                    <option key={lawyer.id} value={lawyer.id}>
                      {(lawyer.name || (lawyer.first_name + ' ' + lawyer.last_name)) + ' (' + (lawyer.specialization || lawyer.specializations) + ')'}
                    </option>
                  ))}
                </select>
                <button 
                  className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded"
                  onClick={handleAssignLawyer}
                  disabled={assignLawyerIds.length === 0}
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
              {assignLawyerIds.length === 0 && (
                <div className="text-red-500 mt-2">Please select at least one lawyer to assign.</div>
              )}
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

     
        
        
          
        
      
      </main>
    </div>
  );
}