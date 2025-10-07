import React, { useEffect, useState } from 'react';
import { getLawyerDocuments, uploadDocumentWithFile } from '../services/api';

export default function LawyerDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCase, setFilterCase] = useState('all');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await getLawyerDocuments();
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get unique cases and document types for filters
  const uniqueCases = [...new Set(documents.map(doc => doc.case_title || `Case #${doc.case_id}`))];
  const uniqueTypes = [...new Set(documents.map(doc => doc.document_type).filter(Boolean))];

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.case_title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || doc.document_type === filterType;
    const matchesCase = filterCase === 'all' || (doc.case_title || `Case #${doc.case_id}`) === filterCase;
    
    return matchesSearch && matchesType && matchesCase;
  });

  // Group filtered documents by case
  const documentsByCase = filteredDocuments.reduce((acc, doc) => {
    const caseTitle = doc.case_title || `Case #${doc.case_id}`;
    if (!acc[caseTitle]) {
      acc[caseTitle] = [];
    }
    acc[caseTitle].push(doc);
    return acc;
  }, {});

  const handleDownload = async (document) => {
    try {
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
      case 'pdf': return '📄';
      case 'contract': return '📑';
      case 'evidence': return '📸';
      case 'legal_document': return '⚖️';
      case 'brief': return '📋';
      case 'motion': return '📝';
      case 'pleading': return '📜';
      default: return '📎';
    }
  };

  const getTypeColor = (documentType) => {
    switch (documentType?.toLowerCase()) {
      case 'contract': return 'from-green-500 to-green-600';
      case 'evidence': return 'from-blue-500 to-blue-600';
      case 'legal_document': return 'from-purple-500 to-purple-600';
      case 'brief': return 'from-orange-500 to-orange-600';
      case 'motion': return 'from-pink-500 to-pink-600';
      case 'pleading': return 'from-indigo-500 to-indigo-600';
      default: return 'from-gray-500 to-gray-600';
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

  const getFileSize = (sizeInBytes) => {
    if (!sizeInBytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
    return Math.round(sizeInBytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-2xl w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl p-6 h-32"></div>
            ))}
          </div>
          <div className="bg-gray-100 rounded-2xl p-6 h-64"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-red-200/50 shadow-lg p-12 text-center">
          <div className="w-24 h-24 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h3 className="text-2xl font-bold text-red-800 mb-3">Error Loading Documents</h3>
          <p className="text-red-600 mb-8 max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchDocuments}
            className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div className="mb-6 lg:mb-0">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent mb-3">
            Document Library
          </h1>
          <p className="text-lg text-gray-600">
            Manage and organize all your legal documents
          </p>
        </div>
        
        <button 
          className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <span className="text-xl">📤</span>
              <span>Upload Document</span>
            </>
          )}
        </button>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <div className="text-2xl font-bold text-blue-600 mb-2">{documents.length}</div>
          <div className="text-sm font-semibold text-gray-700">Total Documents</div>
          <div className="text-xs text-gray-500">All files</div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <div className="text-2xl font-bold text-green-600 mb-2">
            {documents.filter(d => d.document_type === 'contract').length}
          </div>
          <div className="text-sm font-semibold text-gray-700">Contracts</div>
          <div className="text-xs text-gray-500">Legal agreements</div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <div className="text-2xl font-bold text-purple-600 mb-2">
            {documents.filter(d => d.document_type === 'evidence').length}
          </div>
          <div className="text-sm font-semibold text-gray-700">Evidence Files</div>
          <div className="text-xs text-gray-500">Case evidence</div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <div className="text-2xl font-bold text-orange-600 mb-2">
            {documents.filter(d => d.is_confidential).length}
          </div>
          <div className="text-sm font-semibold text-gray-700">Confidential</div>
          <div className="text-xs text-gray-500">Sensitive documents</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search documents by title, description, or case..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
          >
            <option value="all">All Types</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>

          {/* Case Filter */}
          <select
            value={filterCase}
            onChange={(e) => setFilterCase(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
          >
            <option value="all">All Cases</option>
            {uniqueCases.map(caseTitle => (
              <option key={caseTitle} value={caseTitle}>{caseTitle}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200/50 shadow-lg p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📁</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {searchTerm || filterType !== 'all' || filterCase !== 'all' ? 'No matching documents found' : 'No documents yet'}
          </h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {searchTerm || filterType !== 'all' || filterCase !== 'all' 
              ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
              : 'Start building your document library by uploading your first file. Organize case materials and legal documents efficiently.'
            }
          </p>
          <button
            onClick={handleUpload}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
          >
            Upload Your First Document
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(documentsByCase).map(([caseTitle, caseDocs]) => (
            <div key={caseTitle} className="bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200/50 shadow-lg overflow-hidden">
              {/* Case Header */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200/50 p-6">
                <h3 className="font-bold text-blue-900 text-xl flex items-center space-x-3">
                  <span>📂</span>
                  <span>{caseTitle}</span>
                  <span className="text-sm font-normal text-blue-600 bg-blue-200 px-3 py-1 rounded-full">
                    {caseDocs.length} documents
                  </span>
                </h3>
              </div>

              {/* Documents Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {caseDocs.map(doc => {
                    const typeColor = getTypeColor(doc.document_type);
                    
                    return (
                      <div 
                        key={doc.id}
                        className="group bg-white rounded-2xl border border-gray-200/70 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                      >
                        {/* Document Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${typeColor} flex items-center justify-center text-white text-lg`}>
                              {getFileIcon(doc.document_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-blue-700 transition-colors">
                                {doc.title}
                              </h4>
                              <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                                {doc.document_type?.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Document Details */}
                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          {doc.description && (
                            <div className="line-clamp-2 text-xs">{doc.description}</div>
                          )}
                          <div className="flex items-center space-x-1 text-xs">
                            <span>📅</span>
                            <span>{formatDate(doc.created_at)}</span>
                          </div>
                          {doc.file_size && (
                            <div className="flex items-center space-x-1 text-xs">
                              <span>💾</span>
                              <span>{getFileSize(doc.file_size)}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDownload(doc)}
                            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-3 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-1"
                          >
                            <span>⬇️</span>
                            <span>Download</span>
                          </button>
                          {doc.is_confidential && (
                            <span className="px-3 py-2 bg-red-100 text-red-800 text-xs font-semibold rounded-xl flex items-center space-x-1">
                              <span>🔒</span>
                              <span>Confidential</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results Count */}
      {filteredDocuments.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Showing {filteredDocuments.length} of {documents.length} documents
            {searchTerm && ` for "${searchTerm}"`}
            {filterType !== 'all' && ` in ${filterType}`}
            {filterCase !== 'all' && ` for ${filterCase}`}
          </p>
        </div>
      )}
    </div>
  );
}