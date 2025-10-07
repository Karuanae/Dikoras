import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getDashboardStats, 
  getLawyers, 
  getCases, 
  getClients, 
  activateLawyer, 
  deactivateLawyer, 
  assignLawyersToCase,
  getAdminChatActivities,
  getChatMessagesForAdmin,
  getUserFromStorage
} from '../services/api';

export default function AdminDashboard() {
  const [pendingLawyers, setPendingLawyers] = useState([]);
  const [recentContacts, setRecentContacts] = useState([]);
  const [newCases, setNewCases] = useState([]);
  const [stats, setStats] = useState({
    totalLawyers: 0,
    totalClients: 0,
    activeCases: 0,
    pendingApprovals: 0,
    unassignedCases: 0,
    revenue: 0
  });
  const [selectedCase, setSelectedCase] = useState(null);
  const [assignLawyerIds, setAssignLawyerIds] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [lawyerOptions, setLawyerOptions] = useState([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const navigate = useNavigate();

  // Fetch data from API
  const fetchData = async () => {
    try {
      console.log('🔄 Fetching admin dashboard data...');
      
      // Get dashboard stats
      const statsData = await getDashboardStats();
      console.log('📊 Stats data:', statsData);
      
      // Map backend response to frontend structure
      if (statsData.user_stats) {
        // New structure from /admin/dashboard
        setStats({
          totalLawyers: statsData.user_stats?.total_lawyers || 0,
          totalClients: statsData.user_stats?.total_clients || 0,
          activeCases: statsData.case_stats?.active_cases || 0,
          pendingApprovals: statsData.user_stats?.pending_lawyers || 0,
          unassignedCases: statsData.case_stats?.open_cases || 0,
          revenue: statsData.financial_stats?.total_revenue || 0
        });
      } else {
        // Legacy structure from /admin/api/dashboard-stats
        setStats({
          totalLawyers: statsData.totalLawyers || 0,
          totalClients: statsData.totalClients || 0,
          activeCases: statsData.activeCases || 0,
          pendingApprovals: statsData.pendingApprovals || 0,
          unassignedCases: statsData.unassignedCases || 0,
          revenue: statsData.revenue || 0
        });
      }
      
      // Get lawyers data
      const lawyersResponse = await getLawyers();
      console.log('👥 Lawyers data:', lawyersResponse);
      
      let lawyersData = [];
      if (lawyersResponse.lawyers) {
        lawyersData = lawyersResponse.lawyers;
      } else if (Array.isArray(lawyersResponse)) {
        lawyersData = lawyersResponse;
      }
      
      const pending = lawyersData.filter(l => l.approval_status === 'pending');
      setPendingLawyers(pending);
      setLawyerOptions(lawyersData.filter(l => l.approval_status === 'approved'));
      
      // Get cases data
      const casesResponse = await getCases();
      console.log('📁 Cases data:', casesResponse);
      
      let casesData = [];
      if (casesResponse.cases) {
        casesData = casesResponse.cases;
      } else if (Array.isArray(casesResponse)) {
        casesData = casesResponse;
      }
      
      // Filter for unassigned cases
      const unassignedCases = casesData.filter(c => 
        !c.lawyer || c.status === 'open' || c.lawyer_id === null
      );
      setNewCases(unassignedCases);
      
    } catch (err) {
      console.error('❌ Error fetching admin data:', err);
      console.error('Error details:', err.response?.data);
      alert('Failed to load dashboard data. Check console for details.');
    }
  };

  // Fetch chat activities
  const fetchRecentContacts = async () => {
    setIsLoadingContacts(true);
    try {
      console.log('📞 Fetching recent chat activities...');
      
      // Try the dedicated admin endpoint
      try {
        const contacts = await getAdminChatActivities();
        if (contacts && contacts.length > 0) {
          setRecentContacts(contacts);
          return;
        }
      } catch (err) {
        console.log('Admin chat activities endpoint not available, using fallback:', err.message);
      }
      
      // Fallback: Get chat data from cases
      await fetchChatActivitiesFallback();
    } catch (err) {
      console.error('Error fetching chat activities:', err);
      setRecentContacts([]);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  // Fallback method to gather chat data
  const fetchChatActivitiesFallback = async () => {
    try {
      const casesResponse = await getCases();
      const casesData = casesResponse.cases || casesResponse || [];
      
      const contacts = [];
      const processedCases = new Set();
      
      for (const caseItem of casesData.slice(0, 20)) {
        if (processedCases.has(caseItem.id)) continue;
        
        try {
          const chatMessages = await getChatMessagesForAdmin(caseItem.id);
          
          if (chatMessages && chatMessages.length > 0) {
            const recentMessage = chatMessages[chatMessages.length - 1];
            
            const clientName = caseItem.client?.name || 
                              caseItem.client?.full_name || 
                              `Client ${caseItem.client_id}`;
            
            const lawyerName = caseItem.lawyer?.name || 
                              caseItem.lawyer?.full_name || 
                              (caseItem.lawyer_id ? `Lawyer ${caseItem.lawyer_id}` : 'Unassigned');
            
            contacts.push({
              id: `${caseItem.id}-${recentMessage.id}`,
              caseId: caseItem.id,
              caseTitle: caseItem.title,
              caseNumber: caseItem.case_number,
              clientId: caseItem.client_id,
              clientName: clientName,
              lawyerId: caseItem.lawyer_id,
              lawyerName: lawyerName,
              lastMessage: recentMessage.message || 'No message content',
              lastMessageType: recentMessage.sender_id === caseItem.client_id ? 'Client' : 'Lawyer',
              senderName: recentMessage.sender_name,
              date: recentMessage.created_at,
              messageCount: chatMessages.length,
              hasUnread: chatMessages.some(msg => !msg.is_read && msg.sender_id !== getUserFromStorage()?.id),
              status: caseItem.status
            });
          } else {
            // Case with no messages
            contacts.push({
              id: `case-${caseItem.id}`,
              caseId: caseItem.id,
              caseTitle: caseItem.title,
              caseNumber: caseItem.case_number,
              clientName: caseItem.client?.name || `Client ${caseItem.client_id}`,
              lawyerName: caseItem.lawyer?.name || (caseItem.lawyer_id ? `Lawyer ${caseItem.lawyer_id}` : 'Unassigned'),
              lastMessage: 'No messages yet',
              lastMessageType: 'None',
              date: caseItem.created_at,
              messageCount: 0,
              hasUnread: false,
              status: caseItem.status
            });
          }
          
          processedCases.add(caseItem.id);
        } catch (err) {
          console.log(`No chat access for case ${caseItem.id}:`, err.message);
        }
      }
      
      contacts.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentContacts(contacts.slice(0, 15));
      
    } catch (err) {
      console.error('Error in fallback chat fetch:', err);
      setRecentContacts([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'contacts') {
      fetchRecentContacts();
    }
  }, [activeTab]);

  const handleApprove = async (id) => {
    try {
      console.log('✅ Approving lawyer:', id);
      await activateLawyer(id);
      await fetchData();
      alert('Lawyer approved successfully!');
    } catch (err) {
      console.error('Error approving lawyer:', err);
      alert(`Failed to approve lawyer: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDisapprove = async (id) => {
    try {
      console.log('❌ Disapproving lawyer:', id);
      await deactivateLawyer(id);
      await fetchData();
      alert('Lawyer disapproved successfully!');
    } catch (err) {
      console.error('Error disapproving lawyer:', err);
      alert(`Failed to disapprove lawyer: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleAssignLawyer = async () => {
    if (selectedCase && assignLawyerIds.length > 0) {
      try {
        console.log('🔧 Assigning case:', selectedCase.id, 'to lawyers:', assignLawyerIds);
        
        const result = await assignLawyersToCase(selectedCase.id, assignLawyerIds);
        
        console.log('📦 Assignment result:', result);
        
        if (result.success) {
          setNewCases(newCases.filter(c => c.id !== selectedCase.id));
          setStats(prev => ({...prev, unassignedCases: prev.unassignedCases - 1}));
          setSelectedCase(null);
          setAssignLawyerIds([]);
          
          const assignedNames = result.assigned_lawyers?.map(l => l.name) || ['Selected lawyers'];
          alert(`✅ Success! ${result.message}\n\nAssigned to: ${assignedNames.join(', ')}`);
          
          setTimeout(() => {
            fetchData();
          }, 1000);
        } else {
          alert(`Assignment failed: ${result.errors?.join(', ') || 'Unknown error'}`);
        }
      } catch (err) {
        console.error('💥 Assignment error:', err);
        const errorMsg = err.response?.data?.error || err.message || 'Unknown error occurred';
        alert(`Assignment failed: ${errorMsg}`);
      }
    }
  };

  const handleViewChatDetails = (contact) => {
    const modalContent = `
Case: ${contact.caseTitle} (${contact.caseNumber})
Client: ${contact.clientName}
Lawyer: ${contact.lawyerName}
Status: ${contact.status}
Last Activity: ${new Date(contact.date).toLocaleString()}
Total Messages: ${contact.messageCount}
Last Message: "${contact.lastMessage}"
Sent by: ${contact.senderName || contact.lastMessageType}
${contact.hasUnread ? '📬 Has unread messages' : '📭 All messages read'}
    `;
    
    alert(modalContent);
  };

  const handleOpenCaseDetails = (caseId) => {
    navigate(`/admin/cases/${caseId}`);
  };

  const getLawyerDisplayName = (lawyer) => {
    if (lawyer.full_name) return lawyer.full_name;
    if (lawyer.first_name && lawyer.last_name) return `${lawyer.first_name} ${lawyer.last_name}`;
    return lawyer.username || `Lawyer ${lawyer.id}`;
  };

  const getLawyerSpecializations = (lawyer) => {
    if (Array.isArray(lawyer.specializations)) {
      return lawyer.specializations.join(', ');
    }
    if (typeof lawyer.specializations === 'string') {
      return lawyer.specializations;
    }
    return 'Not specified';
  };

  const getCaseClientName = (caseItem) => {
    if (caseItem.client?.name) return caseItem.client.name;
    if (caseItem.client?.full_name) return caseItem.client.full_name;
    if (caseItem.client_name) return caseItem.client_name;
    return 'Unknown Client';
  };

  const getCaseServiceName = (caseItem) => {
    if (caseItem.legal_service?.name) return caseItem.legal_service.name;
    if (caseItem.service_type) return caseItem.service_type;
    return 'Unknown Service';
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
            </div>
          </>
        )}

        {/* Lawyer Approvals Tab */}
        {activeTab === 'lawyers' && (
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">Pending Lawyer Approvals ({pendingLawyers.length})</h2>
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
                        <td className="p-3 font-medium">{getLawyerDisplayName(lawyer)}</td>
                        <td className="p-3">{getLawyerSpecializations(lawyer)}</td>
                        <td className="p-3">{lawyer.email}</td>
                        <td className="p-3">
                          {lawyer.created_at ? new Date(lawyer.created_at).toLocaleDateString() : 'N/A'}
                        </td>
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
            <h2 className="text-xl font-semibold text-blue-900 mb-4">Unassigned Cases ({newCases.length})</h2>
            {newCases.length === 0 ? (
              <p className="text-blue-700">No unassigned cases at this time.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="p-3 text-left text-blue-900">Case Title</th>
                      <th className="p-3 text-left text-blue-900">Client</th>
                      <th className="p-3 text-left text-blue-900">Type</th>
                      <th className="p-3 text-left text-blue-900">Description</th>
                      <th className="p-3 text-left text-blue-900">Status</th>
                      <th className="p-3 text-left text-blue-900">Submitted</th>
                      <th className="p-3 text-left text-blue-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newCases.map(caseItem => (
                      <tr key={caseItem.id} className="border-b border-gray-100">
                        <td className="p-3 font-medium">{caseItem.title}</td>
                        <td className="p-3">{getCaseClientName(caseItem)}</td>
                        <td className="p-3">{getCaseServiceName(caseItem)}</td>
                        <td className="p-3 max-w-xs truncate">{caseItem.description}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            caseItem.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                            caseItem.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {caseItem.status || 'open'}
                          </span>
                        </td>
                        <td className="p-3">
                          {caseItem.created_at ? new Date(caseItem.created_at).toLocaleString() : 'N/A'}
                        </td>
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
                <h3 className="font-semibold text-blue-900 mb-2">
                  Assign Lawyer to: {selectedCase.title}
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  Client: {getCaseClientName(selectedCase)} | 
                  Service: {getCaseServiceName(selectedCase)}
                </p>
                <div className="flex items-center space-x-2">
                  <select 
                    multiple
                    value={assignLawyerIds}
                    onChange={e => {
                      const options = Array.from(e.target.selectedOptions, opt => opt.value);
                      setAssignLawyerIds(options);
                    }}
                    className="p-2 border border-gray-300 rounded"
                    style={{ minWidth: '250px', height: '120px' }}
                  >
                    {lawyerOptions.map(lawyer => (
                      <option key={lawyer.id} value={lawyer.id}>
                        {getLawyerDisplayName(lawyer)} - {getLawyerSpecializations(lawyer)}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-col space-y-2">
                    <button 
                      className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded disabled:bg-gray-400"
                      onClick={handleAssignLawyer}
                      disabled={assignLawyerIds.length === 0}
                    >
                      Assign ({assignLawyerIds.length})
                    </button>
                    <button 
                      className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded"
                      onClick={() => {
                        setSelectedCase(null);
                        setAssignLawyerIds([]);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                {assignLawyerIds.length === 0 && (
                  <div className="text-red-500 mt-2 text-sm">
                    Please select at least one lawyer to assign (Ctrl+Click for multiple)
                  </div>
                )}
                {assignLawyerIds.length > 0 && (
                  <div className="text-green-600 mt-2 text-sm">
                    Selected {assignLawyerIds.length} lawyer(s) for assignment
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Client-Lawyer Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-blue-900">Client-Lawyer Communications</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Monitor recent chat activities between clients and lawyers
                </p>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={fetchRecentContacts}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded text-sm flex items-center"
                  disabled={isLoadingContacts}
                >
                  {isLoadingContacts ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Refreshing...
                    </>
                  ) : (
                    '🔄 Refresh'
                  )}
                </button>
              </div>
            </div>
            
            {isLoadingContacts ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-blue-700 mt-4">Loading chat activities...</p>
                <p className="text-sm text-gray-600 mt-2">This may take a moment as we gather all communication data.</p>
              </div>
            ) : recentContacts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">💬</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Chat Activities Found</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  This could mean:
                </p>
                <ul className="text-sm text-gray-600 max-w-md mx-auto text-left space-y-1 mb-6">
                  <li>• No cases have been created yet</li>
                  <li>• Clients and lawyers haven't started chatting</li>
                  <li>• There might be permission issues accessing chat data</li>
                </ul>
                <button 
                  onClick={fetchRecentContacts}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-700">{recentContacts.length}</div>
                    <div className="text-sm text-blue-900">Active Conversations</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {recentContacts.filter(c => c.messageCount > 0).length}
                    </div>
                    <div className="text-sm text-green-900">With Messages</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-700">
                      {recentContacts.filter(c => c.hasUnread).length}
                    </div>
                    <div className="text-sm text-yellow-900">Unread Messages</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-700">
                      {new Set(recentContacts.map(c => c.lawyerId)).size - 1}
                    </div>
                    <div className="text-sm text-purple-900">Active Lawyers</div>
                  </div>
                </div>

                {/* Contacts Table */}
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-4 text-left text-gray-700 font-semibold">Case & Participants</th>
                        <th className="p-4 text-left text-gray-700 font-semibold">Last Message</th>
                        <th className="p-4 text-left text-gray-700 font-semibold">Activity</th>
                        <th className="p-4 text-left text-gray-700 font-semibold">Status</th>
                        <th className="p-4 text-left text-gray-700 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {recentContacts.map(contact => (
                        <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-start space-x-3">
                              <div className={`w-3 h-3 rounded-full mt-2 ${
                                contact.hasUnread ? 'bg-red-400' : 'bg-gray-300'
                              }`}></div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-semibold text-gray-900 truncate">
                                    {contact.caseTitle}
                                  </h4>
                                  {contact.hasUnread && (
                                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                                      New
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div className="flex items-center">
                                    <span className="w-20 font-medium">Client:</span>
                                    <span className="text-gray-900">{contact.clientName}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="w-20 font-medium">Lawyer:</span>
                                    <span className={`${
                                      contact.lawyerName === 'Unassigned' ? 'text-orange-600' : 'text-gray-900'
                                    }`}>
                                      {contact.lawyerName}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Case: {contact.caseNumber}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="max-w-xs">
                              <p className="text-sm text-gray-800 line-clamp-2 mb-1">
                                {contact.lastMessage}
                              </p>
                              <div className="flex items-center text-xs text-gray-500">
                                <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                                  contact.lastMessageType === 'Client' ? 'bg-blue-400' : 
                                  contact.lastMessageType === 'Lawyer' ? 'bg-green-400' : 'bg-gray-400'
                                }`}></span>
                                {contact.lastMessageType} • {contact.senderName}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-gray-900">
                                {new Date(contact.date).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(contact.date).toLocaleTimeString()}
                              </div>
                              <div className="text-xs">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {contact.messageCount} messages
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              contact.status === 'active' ? 'bg-green-100 text-green-800' :
                              contact.status === 'resolved' ? 'bg-blue-100 text-blue-800' :
                              contact.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {contact.status || 'unknown'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewChatDetails(contact)}
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm px-3 py-1 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                              >
                                View Chat
                              </button>
                              <button
                                onClick={() => handleOpenCaseDetails(contact.caseId)}
                                className="text-gray-600 hover:text-gray-800 font-medium text-sm px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                              >
                                Case Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
                  <div>
                    Showing {recentContacts.length} recent conversations
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <span>Unread messages</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                      <span>All read</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}