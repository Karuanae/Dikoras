import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLawyerCases, getLawyerClients, getLawyerMessages } from '../services/api';

export default function LawyerDashboard() {
  const [activeCases, setActiveCases] = useState(0);
  const [clients, setClients] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchStats() {
      try {
        const casesData = await getLawyerCases();
        setActiveCases(casesData.filter(c => c.status === 'active').length);
        const clientsData = await getLawyerClients();
        setClients(clientsData.length);
        const messagesData = await getLawyerMessages();
        setUnreadMessages(messagesData.unreadCount || 0);
      } catch (err) {
        // Handle error
      }
    }
    fetchStats();
  }, []);

  const handleAddCase = () => {
    navigate('/lawyer/cases/new');
  };

  const handleManageClients = () => {
    navigate('/lawyer/clients');
  };

  const handleViewMessages = () => {
    navigate('/lawyer/messages');
  };

  const handleUploadDocument = () => {
    navigate('/lawyer/documents/upload');
  };

  const handleViewCases = () => {
    navigate('/lawyer/cases');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold text-blue-900 mb-2">Lawyer Dashboard</h1>
      <p className="text-lg text-blue-700 mb-6">Welcome to your dashboard. Here you can manage your cases, clients, and profile.</p>
      {/* ...existing code... */}
    </div>
  );
}