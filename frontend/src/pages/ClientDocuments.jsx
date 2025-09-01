import React from 'react';

export default function ClientDocuments() {
  return (
    <>
      <h1 className="text-3xl font-extrabold text-blue-900 mb-6">Documents</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document Categories */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-bold text-blue-900 text-lg mb-4">Contract Documents</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-white rounded">
              <span className="text-blue-700">Employment_Contract.pdf</span>
              <button className="text-blue-600 hover:text-blue-800">Download</button>
            </div>
            <div className="flex justify-between items-center p-2 bg-white rounded">
              <span className="text-blue-700">NDA_Agreement.docx</span>
              <button className="text-blue-600 hover:text-blue-800">Download</button>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <h3 className="font-bold text-green-900 text-lg mb-4">Case Files</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-white rounded">
              <span className="text-green-700">Case_Summary.pdf</span>
              <button className="text-green-600 hover:text-green-800">Download</button>
            </div>
            <div className="flex justify-between items-center p-2 bg-white rounded">
              <span className="text-green-700">Evidence_Folder.zip</span>
              <button className="text-green-600 hover:text-green-800">Download</button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200">
          Upload Document
        </button>
      </div>
    </>
  );
}