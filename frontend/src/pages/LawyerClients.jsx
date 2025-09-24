import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLawyerClients } from '../services/api';

export default function LawyerClients() {
  const [clients, setClients] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchClients() {
      try {
        const clientsData = await getLawyerClients();
        setClients(clientsData);
      } catch (err) {
        // Handle error
      }
    }
    fetchClients();
  }, []);

  const handleContactClient = (clientId) => {
    navigate(`/lawyer/messages?client=${clientId}`);
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <>
      <h1 className="text-3xl font-extrabold text-blue-900 mb-6">Clients</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.length === 0 ? (
          <div className="col-span-3 text-blue-700">No clients found.</div>
        ) : (
          clients.map(client => (
            <div key={client.id} className={`rounded-xl p-6 border shadow ${client.status === 'completed' ? 'bg-green-50 border-green-200' : client.status === 'pending' ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${client.status === 'completed' ? 'bg-green-600' : client.status === 'pending' ? 'bg-purple-600' : 'bg-blue-600'}`}>{getInitials(client.name)}</div>
                <div>
                  <h3 className={`font-bold ${client.status === 'completed' ? 'text-green-900' : client.status === 'pending' ? 'text-purple-900' : 'text-blue-900'}`}>{client.name}</h3>
                  <p className={`${client.status === 'completed' ? 'text-green-600' : client.status === 'pending' ? 'text-purple-600' : 'text-blue-600'} text-sm`}>{client.casesCount} {client.status === 'completed' ? 'Completed Case' : client.status === 'pending' ? 'Pending Case' : 'Active Cases'}</p>
                </div>
              </div>
              <p className={`${client.status === 'completed' ? 'text-green-700' : client.status === 'pending' ? 'text-purple-700' : 'text-blue-700'} text-sm mb-4`}>{client.specialization}</p>
              <button 
                className={`${client.status === 'completed' ? 'bg-green-600 hover:bg-green-700' : client.status === 'pending' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-lg text-sm w-full`}
                onClick={() => handleContactClient(client.id)}
              >
                Contact Client
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}