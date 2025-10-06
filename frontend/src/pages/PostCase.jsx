import React, { useState, useEffect } from 'react';
import { createClientCase } from '../services/api';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Legal services will be fetched from backend

const PostCase = () => {
  const [legalServices, setLegalServices] = useState([]);
  const [legalServiceId, setLegalServiceId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch available legal services for dropdown (public endpoint)
    async function fetchServices() {
      try {
        const res = await axios.get('http://localhost:5000/main/api/services');
        setLegalServices(Array.isArray(res.data) ? res.data : []);
        // Pre-select service from localStorage if present
        const selected = localStorage.getItem('selectedService');
        if (selected) {
          const selectedObj = JSON.parse(selected);
          // Try to match by id or title
          const found = res.data.find(s => s.id === selectedObj.id || s.title === selectedObj.title || s.name === selectedObj.title);
          if (found) setLegalServiceId(found.id);
        }
      } catch (err) {
        setLegalServices([]);
      }
    }
    fetchServices();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createClientCase({
        legal_service_id: legalServiceId,
        title,
        description,
        priority,
        budget: budget ? parseFloat(budget) : undefined,
        deadline: deadline || undefined
      });
      // Clear selectedService after posting
      localStorage.removeItem('selectedService');
      navigate('/client-dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to submit case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Post a New Case</h2>
      <form onSubmit={handleSubmit}>
        <label className="block mb-2 font-semibold">Legal Service</label>
        <select value={legalServiceId} onChange={e => setLegalServiceId(e.target.value)} required className="w-full mb-4 p-2 border rounded">
          <option value="">Select legal service</option>
          {legalServices.map(s => (
            <option key={s.id} value={s.id}>{s.title || s.name}</option>
          ))}
        </select>
        <label className="block mb-2 font-semibold">Title</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Case Title" className="w-full mb-4 p-2 border rounded" />
        <label className="block mb-2 font-semibold">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="Describe the assistance you need..." className="w-full mb-4 p-2 border rounded" />
        <label className="block mb-2 font-semibold">Priority</label>
        <select value={priority} onChange={e => setPriority(e.target.value)} required className="w-full mb-4 p-2 border rounded">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <label className="block mb-2 font-semibold">Budget (optional)</label>
        <input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="Budget" className="w-full mb-4 p-2 border rounded" />
        <label className="block mb-2 font-semibold">Deadline (optional)</label>
        <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full mb-4 p-2 border rounded" />
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
          {loading ? 'Submitting...' : 'Submit Case'}
        </button>
      </form>
    </div>
  );
};

export default PostCase;
