import React, { useEffect, useState } from 'react';
import { getDocuments, getClientCases, uploadDocumentWithFile } from '../services/api';

export default function ClientDocuments() {
  const [documents, setDocuments] = useState([]);
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    document_type: 'contract',
    description: '',
    is_confidential: false,
    file: null
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [docs, casesData] = await Promise.all([
          getDocuments(),
          getClientCases()
        ]);
        setDocuments(docs);
        setCases(Array.isArray(casesData) ? casesData : []);
        if (casesData.length > 0) {
          setSelectedCase(casesData[0].id);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      }
    }
    fetchData();
  }, []);

  const handleDownload = async (doc) => {
    try {
      // Create a temporary download link
      const response = await fetch(`/document/download/${doc.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.title || doc.name || 'document';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Download failed. File may not be available.');
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Download failed. Please try again.');
    }
  };

  const handleUploadChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setUploadData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }));
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCase || !uploadData.file) {
      alert('Please select a case and choose a file');
      return;
    }

    setUploading(true);
    try {
      await uploadDocumentWithFile({
        case_id: selectedCase,
        file: uploadData.file,
        title: uploadData.title,
        document_type: uploadData.document_type,
        description: uploadData.description,
        is_confidential: uploadData.is_confidential
      });

      // Refresh documents
      const docs = await getDocuments();
      setDocuments(docs);
      
      // Reset form
      setUploadData({
        title: '',
        document_type: 'contract',
        description: '',
        is_confidential: false,
        file: null
      });
      setShowUploadModal(false);
      
      alert('Document uploaded successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  // Group documents by type
  const contractDocs = documents.filter(d => d.document_type === 'contract');
  const caseFiles = documents.filter(d => d.document_type === 'case');

  return (
    <>
      <h1 className="text-3xl font-extrabold text-blue-900 mb-6">Documents</h1>
      
      {/* Cases Selection */}
      {cases.length > 0 && (
        <div className="mb-6">
          <label className="block font-semibold text-blue-900 mb-2">Select Case:</label>
          <select 
            value={selectedCase} 
            onChange={(e) => setSelectedCase(e.target.value)}
            className="border border-blue-300 rounded-lg px-4 py-2 w-full md:w-auto"
          >
            {cases.map(caseItem => (
              <option key={caseItem.id} value={caseItem.id}>
                {caseItem.title} - {caseItem.case_number}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-bold text-blue-900 text-lg mb-4">Contract Documents</h3>
          <div className="space-y-2">
            {contractDocs.length === 0 ? (
              <div className="text-blue-700">No contract documents found.</div>
            ) : (
              contractDocs.map(doc => (
                <div key={doc.id} className="flex justify-between items-center p-2 bg-white rounded">
                  <span className="text-blue-700">{doc.title || doc.name}</span>
                  <button 
                    className="text-blue-600 hover:text-blue-800 font-medium"
                    onClick={() => handleDownload(doc)}
                  >
                    Download
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <h3 className="font-bold text-green-900 text-lg mb-4">Case Files</h3>
          <div className="space-y-2">
            {caseFiles.length === 0 ? (
              <div className="text-green-700">No case files found.</div>
            ) : (
              caseFiles.map(doc => (
                <div key={doc.id} className="flex justify-between items-center p-2 bg-white rounded">
                  <span className="text-green-700">{doc.title || doc.name}</span>
                  <button 
                    className="text-green-600 hover:text-green-800 font-medium"
                    onClick={() => handleDownload(doc)}
                  >
                    Download
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Upload Button */}
      <div className="mt-8">
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
          onClick={() => setShowUploadModal(true)}
          disabled={cases.length === 0}
        >
          {cases.length === 0 ? 'No Cases Available' : 'Upload Document'}
        </button>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-blue-900 mb-4">Upload Document</h3>
            
            <form onSubmit={handleUploadSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-1">Document Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={uploadData.title}
                    onChange={handleUploadChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block font-medium mb-1">Document Type *</label>
                  <select
                    name="document_type"
                    value={uploadData.document_type}
                    onChange={handleUploadChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  >
                    <option value="contract">Contract</option>
                    <option value="case">Case File</option>
                    <option value="evidence">Evidence</option>
                    <option value="correspondence">Correspondence</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block font-medium mb-1">Description</label>
                  <textarea
                    name="description"
                    value={uploadData.description}
                    onChange={handleUploadChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows="3"
                  />
                </div>
                
                <div>
                  <label className="block font-medium mb-1">File *</label>
                  <input
                    type="file"
                    name="file"
                    onChange={handleUploadChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                    required
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_confidential"
                    checked={uploadData.is_confidential}
                    onChange={handleUploadChange}
                    className="mr-2"
                  />
                  <label className="font-medium">Confidential Document</label>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}