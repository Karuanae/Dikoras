import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const sidebarLinks = [
  { name: 'Dashboard', path: '/client/dashboard' },
  { name: 'Messages', path: '/client/messages' },
  { name: 'Documents', path: '/client/documents' },
  { name: 'My Jobs', path: '/client/jobs' },
  { name: 'Invoices', path: '/client/invoices' },
  { name: 'Transactions', path: '/client/transactions' },
  { name: 'Call History', path: '/client/call-history' },
  { name: 'System Messages', path: '/client/system-messages' },
];

export default function ClientDashboard() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user came from service selection
    const service = localStorage.getItem('selectedService');
    if (service) {
      setSelectedService(JSON.parse(service));
      localStorage.removeItem('selectedService'); // Clear after reading
    }
  }, []);

  const handlePostJob = () => {
    if (selectedService) {
      // Navigate to job posting with pre-filled service
      navigate('/client/jobs/new', { 
        state: { preselectedService: selectedService } 
      });
    } else {
      // Regular job posting flow
      navigate('/client/jobs/new');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-blue-100 to-blue-300 backdrop-blur-lg">
      {/* Glassmorphic spacer below Navbar */}
      <div className="h-12 md:h-16 w-full max-w-7xl mx-auto rounded-b-2xl shadow-lg bg-white/60 border-b border-blue-100"></div>
      {/* Top Bar removed: now handled by Navbar for logged-in users */}
      <div className="flex max-w-7xl mx-auto pb-16 px-4 mt-4">
        {/* Sidebar */}
        <aside className="w-64 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-blue-100 p-6 mr-8 hidden md:block">
          <nav>
            <ul className="space-y-2">
              {sidebarLinks.map((link, idx) => (
                <li key={link.name}>
                  <NavLink to={link.path} className={({ isActive }) =>
                    `w-full block px-4 py-2 rounded-lg font-medium text-blue-900 hover:bg-blue-100 transition-all duration-150 ${isActive ? 'bg-blue-50 font-bold' : ''}`
                  }>
                    {link.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-blue-100 p-8">
            <h1 className="text-3xl font-extrabold text-blue-900 mb-2">Dashboard</h1>
            <p className="text-lg text-blue-700 mb-6">Welcome to Dikoras! Dikoras is the easiest solution for any client to get cost-effective and high quality legal services.</p>
            
            {selectedService && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-bold text-blue-800 mb-2">Continue with your selected service:</h3>
                <p className="text-blue-700">{selectedService.title}</p>
                <button 
                  onClick={handlePostJob}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Continue with {selectedService.title}
                </button>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Post a Job */}
              <div className="flex items-center space-x-4">
                <img src="https://cdn-icons-png.flaticon.com/512/2921/2921222.png" alt="Post a Job" className="w-16 h-16" />
                <div>
                  <h2 className="font-bold text-blue-900 text-lg mb-1">Post a Job</h2>
                  <p className="text-blue-700 text-sm">Get started by telling us about your legal needs. It only takes a minute and your information is strictly confidential.</p>
                </div>
              </div>
              {/* Get Proposals */}
              <div className="flex items-center space-x-4">
                <img src="https://cdn-icons-png.flaticon.com/512/2921/2921223.png" alt="Get Proposals" className="w-16 h-16" />
                <div>
                  <h2 className="font-bold text-blue-900 text-lg mb-1">Get Proposals</h2>
                  <p className="text-blue-700 text-sm">Our algorithm matches you with attorneys most qualified to handle your specific legal work. Review proposals and schedule free consultations.</p>
                </div>
              </div>
              {/* Hire your Lawyer */}
              <div className="flex items-center space-x-4 md:col-span-2">
                <img src="https://cdn-icons-png.flaticon.com/512/2921/2921224.png" alt="Hire your Lawyer" className="w-16 h-16" />
                <div>
                  <h2 className="font-bold text-blue-900 text-lg mb-1">Hire your Lawyer</h2>
                  <p className="text-blue-700 text-sm">When you're ready, instantly hire the attorney that's right for you.</p>
                </div>
              </div>
            </div>
            <div className="flex justify-center mt-8">
              <button 
                onClick={handlePostJob}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
              >
                Post a Job & Get Free Proposals
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}