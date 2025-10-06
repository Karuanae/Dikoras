import React, { useEffect, useState } from 'react';
import { getLawyerDocuments, uploadDocumentWithFile } from '../services/api';

export default function LawyerDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await getLawyerDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (document) => {
    try {
      // Since your backend serves files from /document/download/<document_id>
      const downloadUrl = `http://localhost:5000/document/download/${document.id}`;
      window.open(downloadUrl, '_blank');
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download document');
    }
  };

  const handleUpload = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt,.pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,.xls,.xlsx';
    
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file type
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const allowedExtensions = ['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xls', 'xlsx'];
      if (!allowedExtensions.includes(fileExtension)) {
        alert('File type not allowed. Please select a valid file type.');
        return;
      }

      const caseId = prompt('Enter Case ID for this document:');
      if (!caseId) return;

      const title = prompt('Enter document title:') || file.name;
      const documentType = prompt('Enter document type (contract, evidence, legal_document, etc.):') || 'legal_document';
      const description = prompt('Enter document description (optional):') || '';
      const isConfidential = confirm('Is this document confidential?');

      try {
        setUploading(true);
        await uploadDocumentWithFile({
          case_id: parseInt(caseId),
          file: file,
          title: title,
          document_type: documentType,
          description: description,
          is_confidential: isConfidential
        });
        
        alert('Document uploaded successfully!');
        // Refresh the documents list
        await fetchDocuments();
      } catch (err) {
        console.error('Upload error:', err);
        alert('Upload failed: ' + (err.response?.data?.error || err.message));
      } finally {
        setUploading(false);
      }
    };
    
    fileInput.click();
  };

  const getFileIcon = (documentType) => {
    switch (documentType?.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'contract':
        return '📑';
      case 'evidence':
        return '📸';
      case 'legal_document':
        return '⚖️';
      default:
        return '📎';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group documents by case
  const documentsByCase = documents.reduce((acc, doc) => {
    const caseTitle = doc.case_title || `Case #${doc.case_id}`;
    if (!acc[caseTitle]) {
      acc[caseTitle] = [];
    }
    acc[caseTitle].push(doc);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-extrabold text-blue-900 mb-6">Documents</h1>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-extrabold text-blue-900 mb-6">Documents</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-red-800 mb-2">Error Loading Documents</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            onClick={fetchDocuments}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-900 mb-2">Documents</h1>
          <p className="text-lg text-blue-700">Manage your case documents and files</p>
        </div>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2 mt-4 lg:mt-0 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Uploading...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Document
            </>
          )}
        </button>
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="bg-white rounded-xl p-8 border border-blue-200 text-center">
          <svg className="w-16 h-16 text-blue-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-xl font-semibold text-blue-900 mb-2">No Documents Found</h3>
          <p className="text-blue-700 mb-4">Get started by uploading your first document.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(documentsByCase).map(([caseTitle, caseDocs]) => (
            <div key={caseTitle} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-bold text-blue-900 text-xl mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {caseTitle}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {caseDocs.map(doc => (
                  <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getFileIcon(doc.document_type)}</span>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">{doc.title}</h4>
                          <p className="text-gray-500 text-xs capitalize">{doc.document_type?.replace('_', ' ')}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-xs text-gray-600 mb-3">
                      {doc.description && (
                        <div className="line-clamp-2">{doc.description}</div>
                      )}
                      <div>Uploaded: {formatDate(doc.created_at)}</div>
                      {doc.uploaded_by && (
                        <div>By: {doc.uploaded_by}</div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm transition-colors flex items-center justify-center gap-1"
                        onClick={() => handleDownload(doc)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                      {doc.is_confidential && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded flex items-center">
                          🔒 Confidential
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statistics */}
      {documents.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-900">{documents.length}</div>
            <div className="text-blue-700 text-sm">Total Documents</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-900">
              {documents.filter(d => d.document_type === 'contract').length}
            </div>
            <div className="text-green-700 text-sm">Contracts</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-900">
              {documents.filter(d => d.document_type === 'evidence').length}
            </div>
            <div className="text-purple-700 text-sm">Evidence Files</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-900">
              {documents.filter(d => d.is_confidential).length}
            </div>
            <div className="text-orange-700 text-sm">Confidential</div>
          </div>
        </div>
      )}
    </div>
  );
}