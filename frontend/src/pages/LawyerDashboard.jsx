// Lawyer Dashboard Component
export function LawyerDashboard() {
  const [activeCases, setActiveCases] = useState(12);
  const [clients, setClients] = useState(8);
  const [unreadMessages, setUnreadMessages] = useState(5);
  const navigate = useNavigate();

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

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="bg-blue-50 rounded-xl shadow p-6 flex flex-col items-center">
          <span className="text-4xl font-bold text-blue-700 mb-2">{activeCases}</span>
          <span className="text-blue-900 font-semibold">Active Cases</span>
          <button 
            onClick={handleViewCases}
            className="mt-2 text-blue-600 text-sm hover:underline"
          >
            View All
          </button>
        </div>
        <div className="bg-blue-50 rounded-xl shadow p-6 flex flex-col items-center">
          <span className="text-4xl font-bold text-blue-700 mb-2">{clients}</span>
          <span className="text-blue-900 font-semibold">Clients</span>
          <button 
            onClick={handleManageClients}
            className="mt-2 text-blue-600 text-sm hover:underline"
          >
            Manage Clients
          </button>
        </div>
        <div className="bg-blue-50 rounded-xl shadow p-6 flex flex-col items-center">
          <span className="text-4xl font-bold text-blue-700 mb-2">{unreadMessages}</span>
          <span className="text-blue-900 font-semibold">Unread Messages</span>
          <button 
            onClick={handleViewMessages}
            className="mt-2 text-blue-600 text-sm hover:underline"
          >
            View Messages
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow">
          <img src="https://cdn-icons-png.flaticon.com/512/2921/2921222.png" alt="Add Case" className="w-16 h-16" />
          <div>
            <h2 className="font-bold text-blue-900 text-lg mb-1">Add New Case</h2>
            <p className="text-blue-700 text-sm">Start a new case for a client and manage all details securely.</p>
            <button 
              onClick={handleAddCase}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-3 rounded"
            >
              Add Case
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow">
          <img src="https://cdn-icons-png.flaticon.com/512/2921/2921223.png" alt="Message Client" className="w-16 h-16" />
          <div>
            <h2 className="font-bold text-blue-900 text-lg mb-1">Message a Client</h2>
            <p className="text-blue-700 text-sm">Send updates, share documents, and communicate securely with your clients.</p>
            <button 
              onClick={handleViewMessages}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-3 rounded"
            >
              View Messages
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow md:col-span-2">
          <img src="https://cdn-icons-png.flaticon.com/512/2921/2921224.png" alt="Upload Document" className="w-16 h-16" />
          <div>
            <h2 className="font-bold text-blue-900 text-lg mb-1">Upload Document</h2>
            <p className="text-blue-700 text-sm">Easily upload and manage case-related documents for your clients.</p>
            <button 
              onClick={handleUploadDocument}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-3 rounded"
            >
              Upload Documents
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-center space-x-4 mt-8">
        <button 
          onClick={handleAddCase}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
        >
          Add New Case
        </button>
        <button 
          onClick={handleManageClients}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
        >
          Manage Clients
        </button>
      </div>
    </div>
  );
}