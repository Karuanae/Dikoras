import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  getClientCases,
  getLawyerCases,
  getClientChats,
  getLawyerChats,
  sendChatWithAttachment,
  getUnreadChatsCount,
  createDirectChatCase,
  getUserFromStorage,
  isAuthenticated
} from '../services/api';

function getUserRole() {
  const user = getUserFromStorage();
  return user ? user.role : null;
}

export default function Chat() {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [chats, setChats] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [fileInput, setFileInput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [directClientChat, setDirectClientChat] = useState(null);
  const [authError, setAuthError] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  
  const typingTimeoutRef = useRef(null);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const role = getUserRole();
  const socketRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated()) {
      setAuthError(true);
      navigate('/login');
    }
  }, [navigate]);

  // Handle direct client chat from navigation
  useEffect(() => {
    if (location.state?.fromClientsPage && location.state?.clientId) {
      setDirectClientChat({
        clientId: location.state.clientId,
        clientName: location.state.clientName || 'Client'
      });
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Socket.io setup
  useEffect(() => {
    if (!isAuthenticated()) return;

    try {
      socketRef.current = io('http://localhost:5000', {
        transports: ['websocket', 'polling'],
        auth: {
          token: localStorage.getItem('access_token')
        }
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected');
        setConnectionError(false);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnectionError(true);
      });

      socketRef.current.on('typing', (data) => {
        if (selectedCase && data.room === `case_${selectedCase.id}` && data.user !== role) {
          setIsTyping(true);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1500);
        }
      });

    } catch (error) {
      console.error('Error setting up socket:', error);
      setConnectionError(true);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [selectedCase, role]);

  // Load cases
  useEffect(() => {
    async function fetchCases() {
      if (!isAuthenticated()) return;

      try {
        let data = [];
        if (role === 'client') {
          data = await getClientCases();
        } else if (role === 'lawyer') {
          data = await getLawyerCases();
        }
        
        setCases(Array.isArray(data) ? data : []);

        // Handle direct client chat
        if (directClientChat && role === 'lawyer') {
          await setupDirectClientChat(data);
        } else if (data.length > 0) {
          setSelectedCase(data[0]);
        }

        // Fetch unread counts
        const counts = {};
        for (const c of data) {
          counts[c.id] = await getUnreadChatsCount(c.id);
        }
        setUnreadCounts(counts);
      } catch (err) {
        console.error('Error loading cases:', err);
        if (err.response?.status === 401) {
          setAuthError(true);
          navigate('/login');
        }
      }
    }

    async function setupDirectClientChat(existingCases) {
      const existingCase = existingCases.find(c => 
        c.client_id === directClientChat.clientId
      );

      if (existingCase) {
        setSelectedCase(existingCase);
      } else {
        try {
          const newCase = await createDirectChatCase({
            client_id: directClientChat.clientId,
            title: `Direct Chat with ${directClientChat.clientName}`,
            legal_service: 'Direct Consultation'
          });
          setSelectedCase(newCase);
          setCases(prev => [...prev, newCase]);
        } catch (error) {
          console.error('Failed to create direct chat case:', error);
        }
      }
    }

    fetchCases();
  }, [role, directClientChat, navigate]);

  // Load chats when case changes
  useEffect(() => {
    async function fetchChats() {
      if (!selectedCase || !isAuthenticated()) return;
      
      setLoading(true);
      try {
        let data = [];
        if (role === 'client') {
          data = await getClientChats({ case_id: selectedCase.id });
        } else if (role === 'lawyer') {
          data = await getLawyerChats({ case_id: selectedCase.id });
        }
        setChats(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error loading chats:', err);
        if (err.response?.status === 401) {
          setAuthError(true);
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchChats();

    // Socket message handler
    if (socketRef.current && selectedCase) {
      const roomName = `case_${selectedCase.id}`;
      socketRef.current.emit('join', { room: roomName });

      const messageHandler = (msg) => {
        if (msg.case_id === selectedCase.id) {
          setChats(prev => [...prev, {
            id: msg.id,
            sender: msg.sender_id === getUserFromStorage()?.id ? role : (role === 'client' ? 'lawyer' : 'client'),
            chat: msg.message,
            created_at: msg.created_at,
            sender_name: msg.sender_name,
            attachment: msg.attachment
          }]);
        }
      };

      socketRef.current.on('new_chat_message', messageHandler);

      return () => {
        socketRef.current.off('new_chat_message', messageHandler);
      };
    }
  }, [selectedCase, role, navigate]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chats]);

  const handleSendChat = async () => {
    if ((!chatInput.trim() && !fileInput) || !selectedCase || !isAuthenticated()) return;
    
    try {
      await sendChatWithAttachment({ 
        case_id: selectedCase.id, 
        chat: chatInput, 
        file: fileInput 
      });

      // Refresh chats
      let data = [];
      if (role === 'client') {
        data = await getClientChats({ case_id: selectedCase.id });
      } else if (role === 'lawyer') {
        data = await getLawyerChats({ case_id: selectedCase.id });
      }
      setChats(Array.isArray(data) ? data : []);
      
      setChatInput('');
      setFileInput(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (err) {
      console.error('Error sending chat:', err);
      if (err.response?.status === 401) {
        setAuthError(true);
        navigate('/login');
      }
    }
  };

  const handleTyping = () => {
    if (socketRef.current && selectedCase) {
      socketRef.current.emit('typing', { 
        room: `case_${selectedCase.id}`, 
        user: role 
      });
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Required</h2>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Chats</h1>
        
        {connectionError && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            Real-time chat connection issues
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Cases Sidebar */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Your Cases</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {cases.map(caseItem => (
                <div
                  key={caseItem.id}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedCase?.id === caseItem.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => setSelectedCase(caseItem)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{caseItem.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">Case #{caseItem.case_number}</p>
                    </div>
                    {unreadCounts[caseItem.id] > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {unreadCounts[caseItem.id]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow border border-gray-200 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900">
                {selectedCase ? `Chat: ${selectedCase.title}` : 'Select a case to start chatting'}
              </h3>
            </div>

            {/* Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 p-4 overflow-y-auto space-y-4 max-h-96"
            >
              {loading ? (
                <div className="text-center text-gray-500">Loading messages...</div>
              ) : chats.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                chats.map((chat, idx) => (
                  <div key={chat.id || idx} className={`flex ${chat.sender === role ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md rounded-lg px-4 py-2 ${
                      chat.sender === role ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="text-sm font-medium mb-1">
                        {chat.sender_name || (chat.sender === role ? 'You' : chat.sender)}
                      </div>
                      <p className="text-sm">{chat.chat}</p>
                      {chat.attachment && (
                        <a 
                          href={chat.attachment} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs underline mt-1 block"
                        >
                          📎 Attachment
                        </a>
                      )}
                      <div className={`text-xs mt-1 ${chat.sender === role ? 'text-blue-200' : 'text-gray-500'}`}>
                        {formatTime(chat.created_at)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-600 rounded-lg px-4 py-2 text-sm">
                    Typing...
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            {selectedCase && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={chatInput}
                    onChange={(e) => {
                      setChatInput(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChat();
                      }
                    }}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => setFileInput(e.target.files[0])}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    📎
                  </button>
                  <button
                    onClick={handleSendChat}
                    disabled={!chatInput.trim() && !fileInput}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Send
                  </button>
                </div>
                {fileInput && (
                  <div className="text-sm text-gray-600 mt-2">
                    Selected: {fileInput.name}
                    <button 
                      onClick={() => setFileInput(null)}
                      className="ml-2 text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}