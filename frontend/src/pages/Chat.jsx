import React, { useEffect, useState } from 'react';
import {
  getClientContacts,
  getLawyerClients,
  getClientChats,
  getLawyerChats,
  sendClientChat,
  sendLawyerChat
} from '../services/api';

// Utility to get user role from localStorage
function getUserRole() {
  const user = localStorage.getItem('user');
  if (!user) return null;
  try {
    return JSON.parse(user).role;
  } catch {
    return null;
  }
}

export default function Chat() {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [chats, setChats] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const role = getUserRole();

  // Load contacts based on role
  useEffect(() => {
    async function fetchContacts() {
      try {
        if (role === 'client') {
          const data = await getClientContacts();
          setContacts(Array.isArray(data) ? data : []);
          if (Array.isArray(data) && data.length > 0) setSelectedContact(data[0]);
        } else if (role === 'lawyer') {
          const data = await getLawyerClients();
          setContacts(Array.isArray(data) ? data : []);
          if (Array.isArray(data) && data.length > 0) setSelectedContact(data[0]);
        }
      } catch (err) {
        setContacts([]);
        setSelectedContact(null);
        alert('Unable to load contacts. Chat functionality may not be available.');
      }
    }
    fetchContacts();
  }, [role]);

  // Load chats when contact changes
  useEffect(() => {
    async function fetchChats() {
      if (!selectedContact) return;
      setLoading(true);
      try {
        let data = [];
        if (role === 'client') {
          data = await getClientChats({ contact_id: selectedContact.id });
        } else if (role === 'lawyer') {
          data = await getLawyerChats({ contact_id: selectedContact.id });
        }
        setChats(Array.isArray(data) ? data : []);
      } catch (err) {
        setChats([]);
        alert('Unable to load chats. Chat functionality may not be available.');
      } finally {
        setLoading(false);
      }
    }
    fetchChats();
  }, [selectedContact, role]);

  // Send chat
  const handleSendChat = async () => {
    if (!chatInput.trim() || !selectedContact) return;
    try {
      if (role === 'client') {
        await sendClientChat({ contact_id: selectedContact.id, chat: chatInput });
        const data = await getClientChats({ contact_id: selectedContact.id });
        setChats(Array.isArray(data) ? data : []);
      } else if (role === 'lawyer') {
        await sendLawyerChat({ contact_id: selectedContact.id, chat: chatInput });
        const data = await getLawyerChats({ contact_id: selectedContact.id });
        setChats(Array.isArray(data) ? data : []);
      }
      setChatInput('');
    } catch (err) {
      alert('Unable to send chat. Chat functionality may not be available.');
    }
  };

  return (
    <>
      <h1 className="text-3xl font-extrabold text-blue-900 mb-6">Chats</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contacts List */}
        <div className="lg:col-span-1 bg-blue-50 rounded-xl p-4 border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-4">Contacts</h3>
          <div className="space-y-2">
            {contacts.length === 0 ? (
              <div className="text-blue-700">No contacts found.</div>
            ) : (
              contacts.map(contact => (
                <div
                  key={contact.id}
                  className={`p-3 bg-white rounded-lg cursor-pointer hover:bg-blue-100 ${selectedContact?.id === contact.id ? 'border-2 border-blue-600' : ''}`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {contact.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-blue-900">{contact.name}</p>
                      <p className="text-sm text-blue-600">{contact.specialty || contact.caseTitle || ''}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2 bg-white rounded-xl p-4 border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-4">
            {selectedContact ? `Conversation with ${selectedContact.name}` : 'Select a contact'}
          </h3>
          <div className="h-64 overflow-y-auto space-y-4 mb-4">
            {loading ? (
              <div className="text-blue-700">Loading chats...</div>
            ) : chats.length === 0 ? (
              <div className="text-blue-700">No chats found.</div>
            ) : (
              chats.map((chat, idx) => (
                <div key={idx} className={`flex ${chat.sender === role ? 'justify-end' : 'justify-start'}`}>
                  <div className={`${chat.sender === role ? 'bg-green-100 text-green-900' : 'bg-blue-100 text-blue-900'} rounded-lg p-3 max-w-xs`}>
                    <p>{chat.chat}</p>
                    <span className={`text-xs ${chat.sender === role ? 'text-green-600' : 'text-blue-600'}`}>{chat.time || chat.created_at}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Chat Input */}
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Type your chat..."
              className="flex-1 border border-blue-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSendChat(); }}
              disabled={!selectedContact}
            />
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              onClick={handleSendChat}
              disabled={!selectedContact || !chatInput.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
