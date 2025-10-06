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

// Utility to get user role from localStorage
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
  const role = getUserRole();
  const socketRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Check authentication before any API calls
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (!token || !user || !isAuthenticated()) {
        console.log('No authentication found, redirecting to login');
        setAuthError(true);
        navigate('/login');
        return false;
      }
      
      // Verify user data is valid
      try {
        const userData = JSON.parse(user);
        if (!userData.role || !userData.id) {
          console.log('Invalid user data, redirecting to login');
          setAuthError(true);
          navigate('/login');
          return false;
        }
        return true;
      } catch (error) {
        console.log('Error parsing user data, redirecting to login');
        setAuthError(true);
        navigate('/login');
        return false;
      }
    };

    if (!checkAuth()) {
      return;
    }
  }, [navigate]);

  // Check if we came from clients page with client info
  useEffect(() => {
    if (location.state?.fromClientsPage && location.state?.clientId) {
      setDirectClientChat({
        clientId: location.state.clientId,
        clientName: location.state.clientName || 'Client'
      });
      // Clear the location state to avoid retaining it on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Socket.io setup with better error handling
  useEffect(() => {
    if (!isAuthenticated()) return;

    try {
      socketRef.current = io('http://localhost:5000', {
        transports: ['websocket', 'polling'],
        auth: {
          token: localStorage.getItem('access_token') || localStorage.getItem('token')
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

      socketRef.current.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

    } catch (error) {
      console.error('Error setting up socket:', error);
      setConnectionError(true);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Load cases and handle direct client chats
  useEffect(() => {
    async function fetchCasesAndSetup() {
      if (!isAuthenticated()) return;

      try {
        setAuthError(false);
        setConnectionError(false);
        
        let data = [];
        if (role === 'client') {
          data = await getClientCases();
        } else if (role === 'lawyer') {
          data = await getLawyerCases();
        }
        
        setCases(Array.isArray(data) ? data : []);

        // If we have a direct client chat, find or create a case for it
        if (directClientChat && role === 'lawyer') {
          await setupDirectClientChat(data);
        } else if (Array.isArray(data) && data.length > 0) {
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
        if (err.response?.status === 401 || err.message === 'Authentication required') {
          setAuthError(true);
          console.log('Authentication error in chat, redirecting...');
          navigate('/login');
          return;
        }
        setCases([]);
        setSelectedCase(null);
        setUnreadCounts({});
      }
    }

    async function setupDirectClientChat(existingCases) {
      // Try to find an existing case with this client
      const existingCase = existingCases.find(c => 
        c.client_id === directClientChat.clientId || 
        c.clientId === directClientChat.clientId
      );

      if (existingCase) {
        setSelectedCase(existingCase);
      } else {
        // Create a direct chat case
        try {
          const newCase = await createDirectChatCase({
            client_id: directClientChat.clientId,
            title: `Direct Chat with ${directClientChat.clientName}`,
            legal_service: 'Direct Consultation',
            priority: 'medium'
          });
          setSelectedCase(newCase);
          setCases(prev => [...prev, newCase]);
        } catch (error) {
          console.error('Failed to create direct chat case:', error);
          alert('Could not start direct chat. Please try again.');
        }
      }
    }

    fetchCasesAndSetup();
  }, [role, directClientChat, navigate]);

  // Load chats when case changes and setup socket
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
        if (err.response?.status === 401 || err.message === 'Authentication required') {
          setAuthError(true);
          navigate('/login');
          return;
        }
        setChats([]);
      } finally {
        setLoading(false);
      }
    }

    fetchChats();

    // Socket room management
    if (socketRef.current && selectedCase && isAuthenticated()) {
      const roomName = `case_${selectedCase.id}`;
      socketRef.current.emit('join', { room: roomName });

 // In the socket message handler:
const messageHandler = (msg) => {
  if (msg.case_id === selectedCase.id) {
    setChats(prev => [...prev, {
      id: msg.id,
      sender: msg.sender_id === getUserFromStorage()?.id ? role : (role === 'client' ? 'lawyer' : 'client'),
      chat: msg.message,
      created_at: msg.created_at,
      sender_name: msg.sender_name,
      attachment: msg.attachment,  // Use correct field name
      is_read: msg.is_read
    }]);
  }
};

      // Listen for typing indicators
      const typingHandler = (data) => {
        if (selectedCase && data.room === `case_${selectedCase.id}` && data.user !== role) {
          setIsTyping(true);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1500);
        }
      };

      socketRef.current.on('new_chat_message', messageHandler);
      socketRef.current.on('typing', typingHandler);

      return () => {
        socketRef.current.off('new_chat_message', messageHandler);
        socketRef.current.off('typing', typingHandler);
      };
    }
  }, [selectedCase, role, navigate]);

  // Send chat message
  const handleSendChat = async () => {
    if ((!chatInput.trim() && !fileInput) || !selectedCase || !isAuthenticated()) return;
    
    try {
      // Use the existing sendChatWithAttachment function
      await sendChatWithAttachment({ 
        case_id: selectedCase.id, 
        chat: chatInput, 
        file: fileInput 
      });

      // Emit socket event for real-time update
      if (socketRef.current) {
        const user = getUserFromStorage();
        socketRef.current.emit('new_chat_message', {
          case_id: selectedCase.id,
          sender_id: user.id,
          sender_name: user.firstName + ' ' + user.lastName,
          message: chatInput,
          created_at: new Date().toISOString(),
          attachment_url: null, // You might want to handle this
          attachment_name: fileInput?.name
        });
      }

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
      
      // Clear file input
      const fileInputElement = document.querySelector('input[type="file"]');
      if (fileInputElement) fileInputElement.value = '';
      
    } catch (err) {
      console.error('Error sending chat:', err);
      if (err.response?.status === 401 || err.message === 'Authentication required') {
        setAuthError(true);
        navigate('/login');
        return;
      }
      alert('Failed to send message. Please try again.');
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (socketRef.current && selectedCase) {
      socketRef.current.emit('typing', { 
        room: `case_${selectedCase.id}`, 
        user: role 
      });
    }
  };

  const getChatTitle = () => {
    if (directClientChat) {
      return `Chat with ${directClientChat.clientName}`;
    }
    return selectedCase ? `Conversation: ${selectedCase.title}` : 'Select a case';
  };

  if (authError) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to access the chat.</p>
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
    <>
      <h1 className="text-3xl font-extrabold text-blue-900 mb-6">Chats</h1>
      
      {connectionError && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>Real-time chat connection issues. Messages may not update in real-time.</p>
        </div>
      )}
      
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
                  className={`p-3 bg-white rounded-lg cursor-pointer hover:bg-blue-100 ${
                    selectedCase?.id === caseItem.id ? 'border-2 border-blue-600' : ''
                  }`}
                  onClick={() => {
                    setSelectedCase(caseItem);
                    setDirectClientChat(null);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-blue-900">{caseItem.title}</p>
                      <p className="text-sm text-blue-600">Case #: {caseItem.case_number}</p>
                      <p className="text-sm text-blue-600">
                        {caseItem.client_name || `Client: ${caseItem.client_id}`}
                      </p>
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
            {getChatTitle()}
          </h3>
          
          {/* Chat Messages */}
          <div className="h-64 overflow-y-auto space-y-4 mb-4 p-2 border border-gray-200 rounded-lg">
            {loading ? (
              <div className="text-blue-700">Loading chats...</div>
            ) : chats.length === 0 ? (
              <div className="text-blue-700 text-center py-8">
                {selectedCase ? 'No messages yet. Start the conversation!' : 'Select a case to view messages'}
              </div>
            ) : (
              <>

{chats.map((chat, idx) => (
  <div key={chat.id || idx} className={`flex ${chat.sender === role ? 'justify-end' : 'justify-start'}`}>
    <div className={`${
      chat.sender === role ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-900'
    } rounded-lg p-3 max-w-xs`}>
      <div className="font-semibold text-sm mb-1">
        {chat.sender_name || (chat.sender === role ? 'You' : chat.sender)}
      </div>
      <p className="break-words">{chat.chat}</p>
      {chat.attachment && (
        <a 
          href={chat.attachment} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="block text-xs text-blue-700 underline mt-2"
        >
          📎 Download attachment
        </a>
      )}
      <div className="text-xs text-gray-500 mt-1">
        {new Date(chat.created_at).toLocaleString()}
      </div>
    </div>
  </div>
))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-yellow-100 text-yellow-900 rounded-lg p-2 max-w-xs text-xs font-semibold">
                      {directClientChat ? directClientChat.clientName : 'Other user'} is typing...
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Chat Input */}
          <div className="flex space-x-2 items-center">
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-1 border border-blue-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              disabled={!selectedCase}
            />
            <input
              type="file"
              className="border border-blue-200 rounded-lg px-2 py-1"
              onChange={(e) => setFileInput(e.target.files[0])}
              disabled={!selectedCase}
            />
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
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