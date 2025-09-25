import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  getClientContacts,
  getLawyerClients,
  getClientChats,
  getLawyerChats,
  sendClientChat,
  sendLawyerChat,
  getUnreadChatsCount,
  sendChatWithAttachment
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
  const [cases, setCases] = useState([]); // Use cases as chat context
  const [selectedCase, setSelectedCase] = useState(null);
  const [chats, setChats] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [fileInput, setFileInput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const role = getUserRole();
  const socketRef = useRef(null);

  // Socket.io setup
  useEffect(() => {
    // Connect socket only once
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:5000');
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Load cases based on role
  useEffect(() => {
    async function fetchCases() {
      try {
        let data = [];
        if (role === 'client') {
          data = await getClientCases();
        } else if (role === 'lawyer') {
          data = await getLawyerCases();
        }
        setCases(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) setSelectedCase(data[0]);
        // Fetch unread counts for each case
        const counts = {};
        for (const c of data) {
          counts[c.id] = await getUnreadChatsCount(c.id);
        }
        setUnreadCounts(counts);
      } catch (err) {
        setCases([]);
        setSelectedCase(null);
        setUnreadCounts({});
        alert('Unable to load cases. Chat functionality may not be available.');
      }
    }
    fetchCases();
  }, [role]);

  // Load chats when case changes and join socket room
  useEffect(() => {
    async function fetchChats() {
      if (!selectedCase) return;
      setLoading(true);
      try {
        let data = [];
        if (role === 'client') {
          data = await getClientChats({ case_id: selectedCase.id });
        } else if (role === 'lawyer') {
          data = await getLawyerChats({ case_id: selectedCase.id });
        }
        setChats(Array.isArray(data) ? data : []);
        // Mark all messages as read (read receipts)
        // Optionally, you can call a backend endpoint to mark as read here
      } catch (err) {
        setChats([]);
        alert('Unable to load chats. Chat functionality may not be available.');
      } finally {
        setLoading(false);
      }
    }
    fetchChats();

    // Join socket room for this case
    if (socketRef.current && selectedCase) {
      socketRef.current.emit('join', { room: `case_${selectedCase.id}` });
    }

    // Listen for new chat messages
    if (socketRef.current && selectedCase) {
      const handler = (msg) => {
        if (msg.case_id === selectedCase.id) {
          setChats(prev => [...prev, {
            sender: msg.sender_id === JSON.parse(localStorage.getItem('user'))?.id ? role : (role === 'client' ? 'lawyer' : 'client'),
            chat: msg.message,
            created_at: msg.created_at,
            sender_name: msg.sender_name,
          }]);
        }
      };
      socketRef.current.on('new_chat_message', handler);

      // Listen for typing events
      const typingHandler = (data) => {
        if (selectedCase && data.user !== role) {
          setIsTyping(true);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1500);
        }
      };
      socketRef.current.on('typing', typingHandler);

      return () => {
        socketRef.current.off('new_chat_message', handler);
        socketRef.current.off('typing', typingHandler);
      };
    }
  }, [selectedCase, role]);

  // Send chat
  const handleSendChat = async () => {
    if ((!chatInput.trim() && !fileInput) || !selectedCase) return;
    try {
      await sendChatWithAttachment({ case_id: selectedCase.id, chat: chatInput, file: fileInput });
      const data = await getClientChats({ case_id: selectedCase.id });
      setChats(Array.isArray(data) ? data : []);
      setChatInput('');
      setFileInput(null);
    } catch (err) {
      alert('Unable to send chat. Chat functionality may not be available.');
    }
  };

  return (
    <>
      <h1 className="text-3xl font-extrabold text-blue-900 mb-6">Chats</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className="lg:col-span-1 bg-blue-50 rounded-xl p-4 border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-4">Cases</h3>
          <div className="space-y-2">
            {cases.length === 0 ? (
              <div className="text-blue-700">No cases found.</div>
            ) : (
              cases.map(caseItem => (
                <div
                  key={caseItem.id}
                  className={`p-3 bg-white rounded-lg cursor-pointer hover:bg-blue-100 ${selectedCase?.id === caseItem.id ? 'border-2 border-blue-600' : ''}`}
                  onClick={() => setSelectedCase(caseItem)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-blue-900">{caseItem.title}</p>
                      <p className="text-sm text-blue-600">Case #: {caseItem.case_number}</p>
                      <p className="text-sm text-blue-600">Service: {caseItem.legal_service || ''}</p>
                    </div>
                    {unreadCounts[caseItem.id] > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {unreadCounts[caseItem.id]}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2 bg-white rounded-xl p-4 border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-4">
            {selectedCase ? `Conversation for case: ${selectedCase.title}` : 'Select a case'}
          </h3>
          <div className="h-64 overflow-y-auto space-y-4 mb-4">
            {loading ? (
              <div className="text-blue-700">Loading chats...</div>
            ) : chats.length === 0 ? (
              <div className="text-blue-700">No chats found.</div>
            ) : (
              <>
                {chats.map((chat, idx) => (
                  <div key={idx} className={`flex ${chat.sender === role ? 'justify-end' : 'justify-start'}`}>
                    <div className={`${chat.sender === role ? 'bg-green-100 text-green-900' : 'bg-blue-100 text-blue-900'} rounded-lg p-3 max-w-xs`}>
                      <p>{chat.chat}</p>
                      {chat.attachment_url && (
                        <a href={chat.attachment_url} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-700 underline mt-2">
                          {chat.attachment_name || 'Download attachment'}
                        </a>
                      )}
                      <span className={`text-xs ${chat.sender === role ? 'text-green-600' : 'text-blue-600'}`}>{chat.created_at}</span>
                      {chat.sender === role && (
                        <span className="text-xs ml-2 font-semibold">
                          {chat.is_read ? 'Seen' : 'Delivered'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-yellow-100 text-yellow-900 rounded-lg p-2 max-w-xs text-xs font-semibold">Other user is typing...</div>
                  </div>
                )}
              </>
            )}
          </div>
          {/* Chat Input */}
          <div className="flex space-x-2 items-center">
            <input
              type="text"
              placeholder="Type your chat..."
              className="flex-1 border border-blue-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={chatInput}
              onChange={e => {
                setChatInput(e.target.value);
                if (socketRef.current && selectedCase) {
                  socketRef.current.emit('typing', { room: `case_${selectedCase.id}`, user: role });
                }
              }}
              onKeyDown={e => { if (e.key === 'Enter') handleSendChat(); }}
              disabled={!selectedCase}
            />
            <input
              type="file"
              className="border border-blue-200 rounded-lg px-2 py-1"
              onChange={e => setFileInput(e.target.files[0])}
              disabled={!selectedCase}
            />
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              onClick={handleSendChat}
              disabled={!selectedCase || (!chatInput.trim() && !fileInput)}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
