import React, { useEffect, useState } from 'react';
import { getClientCases, uploadDocumentWithFile, getClientDocuments, downloadDocument } from '../services/api';

export default function ClientDocuments() {
  const [documents, setDocuments] = useState([]);
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    document_type: 'case_file',
    description: '',
    is_confidential: false,
    file: null
  });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [casesData, docsData] = await Promise.all([
          getClientCases().catch(err => { console.error('Cases error:', err); return []; }),
          getClientDocuments().catch(err => { 
            console.error('Documents error:', err); 
            // Fallback to extracting from cases
            return [];
          })
        ]);

        const casesArray = Array.isArray(casesData) ? casesData : [];
        setCases(casesArray);

        let allDocuments = [];
        
        // If we got documents directly from API
        if (Array.isArray(docsData) && docsData.length > 0) {
          allDocuments = docsData.map(doc => ({
            ...doc,
            case_title: doc.case?.title || 'Unknown Case',
            case_number: doc.case?.case_number || 'N/A'
          }));
        } else {
          // Fallback: extract from cases
          casesArray.forEach(caseItem => {
            if (caseItem.documents && Array.isArray(caseItem.documents)) {
              allDocuments.push(...caseItem.documents.map(doc => ({
                ...doc,
                case_title: caseItem.title,
                case_number: caseItem.case_number,
                case_id: caseItem.id
              })));
            }
          });
        }

        // Sort by creation date (newest first)
        allDocuments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setDocuments(allDocuments);

        if (casesArray.length > 0 && selectedCase === 'all') {
          setSelectedCase(casesArray[0].id);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setDocuments([]);
        setCases([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter documents based on selections and search
  const filteredDocuments = documents.filter(doc => {
    const caseMatch = selectedCase === 'all' || doc.case_id === selectedCase;
    const typeMatch = selectedType === 'all' || doc.document_type === selectedType;
    const searchMatch = !searchTerm || 
      doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.case_title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return caseMatch && typeMatch && searchMatch;
  });

  const handleDownload = async (doc) => {
    try {
      if (doc.file_path || doc.id) {
        // Use the document download endpoint
        const downloadUrl = doc.file_path || `http://localhost:5000/document/download/${doc.id}`;
        window.open(downloadUrl, '_blank');
      } else {
        alert('Download link not available for this document.');
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Download failed. Please try again.');
    }
  };

  const handlePreview = (doc) => {
    // For now, show document details in alert
    // In a real app, this would open a preview modal or PDF viewer
    const details = `
Document: ${doc.title}
Type: ${getDocumentTypeLabel(doc.document_type)}
Case: ${doc.case_title}
Uploaded: ${doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}
Description: ${doc.description || 'No description'}
${doc.is_confidential ? '🔒 CONFIDENTIAL DOCUMENT' : ''}
    `;
    alert(details);
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
    if (!uploadData.file) {
      alert('Please choose a file to upload');
      return;
    }

    const caseId = selectedCase === 'all' ? (cases[0]?.id || '') : selectedCase;
    if (!caseId) {
      alert('Please select a case first');
      return;
    }

    setUploading(true);
    try {
      await uploadDocumentWithFile({
        case_id: caseId,
        file: uploadData.file,
        title: uploadData.title || `Document ${new Date().toLocaleDateString()}`,
        document_type: uploadData.document_type,
        description: uploadData.description,
        is_confidential: uploadData.is_confidential
      });

      // Refresh documents
      const [casesData, docsData] = await Promise.all([
        getClientCases(),
        getClientDocuments().catch(() => []) // Silently fail if endpoint doesn't exist
      ]);

      let allDocuments = [];
      if (Array.isArray(docsData) && docsData.length > 0) {
        allDocuments = docsData;
      } else {
        // Fallback to cases extraction
        casesData.forEach(caseItem => {
          if (caseItem.documents && Array.isArray(caseItem.documents)) {
            allDocuments.push(...caseItem.documents.map(doc => ({
              ...doc,
              case_title: caseItem.title,
              case_number: caseItem.case_number,
              case_id: caseItem.id
            })));
          }
        });
      }

      allDocuments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setDocuments(allDocuments);
      
      // Reset form
      setUploadData({
        title: '',
        document_type: 'case_file',
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

  const getDocumentTypeIcon = (type) => {
    const icons = {
      contract: '📝',
      case_file: '📁',
      evidence: '🔍',
      correspondence: '✉️',
      legal_document: '⚖️',
      brief: '📋',
      motion: '📄',
      other: '📎'
    };
    return icons[type] || '📄';
  };

  const getDocumentTypeLabel = (type) => {
    const labels = {
      contract: 'Contract',
      case_file: 'Case File',
      evidence: 'Evidence',
      correspondence: 'Correspondence',
      legal_document: 'Legal Document',
      brief: 'Legal Brief',
      motion: 'Motion',
      other: 'Other Document'
    };
    return labels[type] || type;
  };

  const getFileType = (filename) => {
    if (!filename) return 'file';
    const ext = filename.split('.').pop()?.toLowerCase();
    const types = {
      pdf: 'PDF',
      doc: 'Word',
      docx: 'Word',
      txt: 'Text',
      jpg: 'Image',
      jpeg: 'Image',
      png: 'Image',
      zip: 'Archive'
    };
    return types[ext] || 'File';
  };

  const getFileSize = (size) => {
    if (!size) return 'Unknown';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Calculate document statistics
  const documentStats = {
    total: documents.length,
    byType: documents.reduce((acc, doc) => {
      acc[doc.document_type] = (acc[doc.document_type] || 0) + 1;
      return acc;
    }, {}),
    confidential: documents.filter(doc => doc.is_confidential).length,
    recent: documents.filter(doc => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(doc.created_at) > weekAgo;
    }).length
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-extrabold text-blue-900 mb-6">Documents</h1>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-900">Loading your documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-900 mb-2">Documents</h1>
          <p className="text-blue-700">
            Manage all your legal documents and case files in one secure place
          </p>
        </div>
        <button 
          className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setShowUploadModal(true)}
          disabled={cases.length === 0}
        >
          <span>📤</span>
          Upload Document
        </button>
      </div>

      {/* Statistics */}
      {documents.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{documentStats.total}</div>
            <div className="text-sm text-blue-900 font-medium">Total Documents</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-700">{documentStats.recent}</div>
            <div className="text-sm text-green-900 font-medium">Recent (7 days)</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <div className="text-2xl font-bold text-purple-700">{documentStats.confidential}</div>
            <div className="text-sm text-purple-900 font-medium">Confidential</div>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
            <div className="text-2xl font-bold text-orange-700">{cases.length}</div>
            <div className="text-sm text-orange-900 font-medium">Active Cases</div>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl p-6 border border-blue-200 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Search */}
          <div className="flex-1 w-full">
            <label className="block font-semibold text-blue-900 mb-2">Search Documents</label>
            <input
              type="text"
              placeholder="Search by title, description, or case..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-blue-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 w-full">
            <div>
              <label className="block font-semibold text-blue-900 mb-2">Filter by Case</label>
              <select 
                value={selectedCase} 
                onChange={(e) => setSelectedCase(e.target.value)}
                className="w-full border border-blue-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Cases</option>
                {cases.map(caseItem => (
                  <option key={caseItem.id} value={caseItem.id}>
                    {caseItem.title} - {caseItem.case_number}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block font-semibold text-blue-900 mb-2">Filter by Type</label>
              <select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full border border-blue-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="contract">Contracts</option>
                <option value="case_file">Case Files</option>
                <option value="evidence">Evidence</option>
                <option value="correspondence">Correspondence</option>
                <option value="legal_document">Legal Documents</option>
                <option value="brief">Legal Briefs</option>
                <option value="motion">Motions</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-end gap-2">
            <label className="block font-semibold text-blue-900 mb-2">View</label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-600'
                }`}
              >
                🏠 Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'
                }`}
              >
                📋 List
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(selectedCase !== 'all' || selectedType !== 'all' || searchTerm) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedCase !== 'all' && (
              <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                Case: {cases.find(c => c.id === selectedCase)?.title}
                <button onClick={() => setSelectedCase('all')}>×</button>
              </span>
            )}
            {selectedType !== 'all' && (
              <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                Type: {getDocumentTypeLabel(selectedType)}
                <button onClick={() => setSelectedType('all')}>×</button>
              </span>
            )}
            {searchTerm && (
              <span className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                Search: "{searchTerm}"
                <button onClick={() => setSearchTerm('')}>×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Documents Display */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-blue-200">
          <div className="text-6xl mb-4">📂</div>
          <h3 className="text-2xl font-bold text-blue-900 mb-3">
            {documents.length === 0 ? 'No Documents Yet' : 'No Documents Found'}
          </h3>
          <p className="text-blue-700 mb-6 max-w-md mx-auto">
            {documents.length === 0 
              ? "You haven't uploaded any documents yet. Get started by uploading your first document to keep all your legal files organized."
              : "No documents match your current filters. Try adjusting your search criteria or clearing some filters."
            }
          </p>
          {cases.length === 0 ? (
            <p className="text-orange-600">You need to have at least one case to upload documents.</p>
          ) : (
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all duration-200"
              onClick={() => setShowUploadModal(true)}
            >
              Upload Your First Document
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group">
              {/* Document Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-3xl">{getDocumentTypeIcon(doc.document_type)}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {doc.title || 'Untitled Document'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {getDocumentTypeLabel(doc.document_type)}
                    </p>
                  </div>
                </div>
                {doc.is_confidential && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">
                    🔒 Confidential
                  </span>
                )}
              </div>

              {/* Document Description */}
              {doc.description && (
                <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                  {doc.description}
                </p>
              )}

              {/* Document Details */}
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex justify-between">
                  <span>Case:</span>
                  <span className="text-gray-900 font-medium truncate ml-2" title={doc.case_title}>
                    {doc.case_title || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Uploaded:</span>
                  <span className="text-gray-900 font-medium">
                    {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>File Type:</span>
                  <span className="text-gray-900 font-medium">
                    {getFileType(doc.file_path || doc.filename)}
                  </span>
                </div>
                {doc.file_size && (
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span className="text-gray-900 font-medium">
                      {getFileSize(doc.file_size)}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                  onClick={() => handleDownload(doc)}
                >
                  <span>⬇️</span>
                  Download
                </button>
                <button
                  className="bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                  onClick={() => handlePreview(doc)}
                >
                  <span>👁️</span>
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-50">
                  <th className="px-6 py-4 text-left text-blue-900 font-semibold">Document</th>
                  <th className="px-6 py-4 text-left text-blue-900 font-semibold">Case</th>
                  <th className="px-6 py-4 text-left text-blue-900 font-semibold">Type</th>
                  <th className="px-6 py-4 text-left text-blue-900 font-semibold">Uploaded</th>
                  <th className="px-6 py-4 text-left text-blue-900 font-semibold">Size</th>
                  <th className="px-6 py-4 text-left text-blue-900 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDocuments.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getDocumentTypeIcon(doc.document_type)}</span>
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {doc.title || 'Untitled Document'}
                            {doc.is_confidential && (
                              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                                🔒
                              </span>
                            )}
                          </div>
                          {doc.description && (
                            <div className="text-sm text-gray-600 line-clamp-1 max-w-md">
                              {doc.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{doc.case_title || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getDocumentTypeLabel(doc.document_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {getFileSize(doc.file_size)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          onClick={() => handleDownload(doc)}
                        >
                          Download
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                          onClick={() => handlePreview(doc)}
                        >
                          Preview
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results Count */}
      {filteredDocuments.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-600">
          Showing {filteredDocuments.length} of {documents.length} documents
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-blue-900">Upload Document</h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-blue-900 mb-2">Document Title *</label>
                <input
                  type="text"
                  name="title"
                  value={uploadData.title}
                  onChange={handleUploadChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter document title"
                  required
                />
              </div>
              
              <div>
                <label className="block font-semibold text-blue-900 mb-2">Document Type *</label>
                <select
                  name="document_type"
                  value={uploadData.document_type}
                  onChange={handleUploadChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="case_file">Case File</option>
                  <option value="contract">Contract</option>
                  <option value="evidence">Evidence</option>
                  <option value="correspondence">Correspondence</option>
                  <option value="legal_document">Legal Document</option>
                  <option value="brief">Legal Brief</option>
                  <option value="motion">Motion</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block font-semibold text-blue-900 mb-2">Description</label>
                <textarea
                  name="description"
                  value={uploadData.description}
                  onChange={handleUploadChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Describe the document content..."
                />
              </div>
              
              <div>
                <label className="block font-semibold text-blue-900 mb-2">File *</label>
                <input
                  type="file"
                  name="file"
                  onChange={handleUploadChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
                  required
                />
                <p className="text-sm text-gray-600 mt-1">
                  Supported formats: PDF, Word, Images, Text files (Max: 10MB)
                </p>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_confidential"
                  checked={uploadData.is_confidential}
                  onChange={handleUploadChange}
                  className="mr-3 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label className="font-medium text-gray-900">Mark as Confidential Document</label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-semibold flex items-center justify-center gap-2"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <span>📤</span>
                      Upload Document
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-xl hover:bg-gray-600 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}