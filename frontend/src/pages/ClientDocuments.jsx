import React, { useEffect, useState } from 'react';
import { getDocuments } from '../services/api';

export default function ClientDocuments() {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const docs = await getDocuments();
        setDocuments(docs);
      } catch (err) {
        // Handle error
      }
    }
    fetchDocuments();
  }, []);

  const handleDownload = (doc) => {
    // If backend provides a download endpoint, use it. Otherwise, show details.
    // window.open(`/client/documents/${doc.id}/download`, '_blank');
    alert('Download functionality not implemented.');
  };

  const handleUpload = () => {
    // TODO: Implement upload functionality or navigate to upload page
  };

  // Group documents by type (backend: document_type)
  const contractDocs = documents.filter(d => d.document_type === 'contract');
  const caseFiles = documents.filter(d => d.document_type === 'case');

  return (
    <>
      <h1 className="text-3xl font-extrabold text-blue-900 mb-6">Documents</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-bold text-blue-900 text-lg mb-4">Contract Documents</h3>
          <div className="space-y-2">
            {contractDocs.length === 0 ? (
              <div className="text-blue-700">No contract documents found.</div>
            ) : (
              contractDocs.map(doc => (
                <div key={doc.id} className="flex justify-between items-center p-2 bg-white rounded">
                  <span className="text-blue-700">{doc.title}</span>
                  <button className="text-blue-600 hover:text-blue-800" onClick={() => handleDownload(doc)}>Download</button>
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
                  <span className="text-green-700">{doc.title}</span>
                  <button className="text-green-600 hover:text-green-800" onClick={() => handleDownload(doc)}>Download</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="mt-8">
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200" onClick={handleUpload}>
          Upload Document
        </button>
      </div>
    </>
  );
}