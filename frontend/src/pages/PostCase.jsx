import React, { useState } from 'react';
import { createCase } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

const CASE_TYPES = [
  'Civil',
  'Criminal',
  'Family',
  'Corporate',
  'Property',
  'Other'
];

const PostCase = () => {
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const clientId = location.state?.clientId || localStorage.getItem('clientId');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createCase({
        title: title || `${type} Case`,
        description,
        client_id: clientId,
        status: 'open',
        case_type: type
      });
      navigate('/client-dashboard');
    } catch (err) {
      setError(err.message || 'Failed to submit case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Post a New Case</h2>
      <form onSubmit={handleSubmit}>
        <label className="block mb-2 font-semibold">Type of Case</label>
        <select value={type} onChange={e => setType(e.target.value)} required className="w-full mb-4 p-2 border rounded">
          <option value="">Select type</option>
          {CASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <label className="block mb-2 font-semibold">Title</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Case Title" className="w-full mb-4 p-2 border rounded" />
        <label className="block mb-2 font-semibold">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="Describe the assistance you need..." className="w-full mb-4 p-2 border rounded" />
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
          {loading ? 'Submitting...' : 'Submit Case'}
        </button>
      </form>
    </div>
  );
};

export default PostCase;
