import React, { useState } from "react";
import { addLegalService } from '../services/api';
import AdminLayout from '../components/AdminLayout';

const AdminAddServices = () => {
  const [form, setForm] = useState({
    // Basic service info
    name: "",
    description: "",
    icon: "",
    is_active: true,
    
    // Enhanced fields for legal services structure
    category: "",
    sub_category: "",
    service_type: "",
    pricing_model: "",
    estimated_duration: "",
    complexity_level: "medium",
    
    // Service details
    key_services: [""],
    target_audience: "",
    deliverables: [""],
    jurisdiction: "US",
    
    // Pricing information
    flat_fee: "",
    hourly_rate: "",
    subscription_price: "",
    is_free_tier_available: false,
    
    // Metadata
    tags: [],
    related_services: [],
    requires_consultation: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newKeyService, setNewKeyService] = useState("");
  const [newDeliverable, setNewDeliverable] = useState("");

  // Predefined categories based on your documentation
  const categories = [
    "Legal Research",
    "Legal Documents & Review", 
    "General Legal Advice",
    "Dispute Resolution Services",
    "Business & Commercial Contracts",
    "Alternative & On-Demand Legal Services",
    "Litigation Support & Court Procedures",
    "Self-Service Legal Tools"
  ];

  const serviceTypes = [
    "Research", "Document Drafting", "Document Review", "Legal Advice", 
    "Dispute Resolution", "Contract Services", "Automated Tools", "Support Services"
  ];

  const pricingModels = [
    "Flat Fee", "Hourly", "Subscription", "Unbundled", "Free", "Hybrid"
  ];

  const complexityLevels = [
    "low", "medium", "high", "expert"
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleArrayChange = (field, index, value) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addToArray = (field, value) => {
    if (value.trim() === "") return;
    setForm(prev => ({
      ...prev,
      [field]: [...prev[field], value.trim()]
    }));
  };

  const removeFromArray = (field, index) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const payload = {
        name: form.name,
        description: form.description,
        icon: form.icon,
        is_active: form.is_active,
        category: form.category,
        sub_category: form.sub_category,
        service_type: form.service_type,
        pricing_model: form.pricing_model,
        estimated_duration: form.estimated_duration,
        complexity_level: form.complexity_level,
        key_services: form.key_services.filter(service => service.trim() !== ""),
        target_audience: form.target_audience,
        deliverables: form.deliverables.filter(deliverable => deliverable.trim() !== ""),
        jurisdiction: form.jurisdiction,
        flat_fee: form.flat_fee ? parseFloat(form.flat_fee) : null,
        hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
        subscription_price: form.subscription_price ? parseFloat(form.subscription_price) : null,
        is_free_tier_available: form.is_free_tier_available,
        tags: form.tags,
        related_services: form.related_services,
        requires_consultation: form.requires_consultation,
      };
      const res = await addLegalService(payload);
      if (!res.success && !res.id) throw new Error("Failed to add service");
      setSuccess("Legal service added successfully!");
      setForm({
        name: "",
        description: "",
        icon: "",
        is_active: true,
        category: "",
        sub_category: "",
        service_type: "",
        pricing_model: "",
        estimated_duration: "",
        complexity_level: "medium",
        key_services: [""],
        target_audience: "",
        deliverables: [""],
        jurisdiction: "US",
        flat_fee: "",
        hourly_rate: "",
        subscription_price: "",
        is_free_tier_available: false,
        tags: [],
        related_services: [],
        requires_consultation: false,
      });
    } catch (err) {
      setError(err.message || "Error adding legal service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto mt-10 bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Add Legal Service</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Service Name *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                  placeholder="e.g., Legal Research, Contract Drafting"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Category *</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Service Type *</label>
                <select
                  name="service_type"
                  value={form.service_type}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Select Type</option>
                  {serviceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Pricing Model *</label>
                <select
                  name="pricing_model"
                  value={form.pricing_model}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Select Pricing Model</option>
                  {pricingModels.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block font-medium mb-1">Description *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                rows="3"
                required
                placeholder="Detailed description of the legal service..."
              />
            </div>
          </div>
          {/* Service Details Section */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Service Details</h3>
            <div className="mb-4">
              <label className="block font-medium mb-1">Key Services</label>
              {form.key_services.map((service, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={service}
                    onChange={(e) => handleArrayChange('key_services', index, e.target.value)}
                    className="flex-1 border rounded px-3 py-2"
                    placeholder="e.g., Case law research, Contract review"
                  />
                  <button
                    type="button"
                    onClick={() => removeFromArray('key_services', index)}
                    className="bg-red-500 text-white px-3 rounded"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newKeyService}
                  onChange={(e) => setNewKeyService(e.target.value)}
                  className="flex-1 border rounded px-3 py-2"
                  placeholder="Add new key service"
                />
                <button
                  type="button"
                  onClick={() => {
                    addToArray('key_services', newKeyService);
                    setNewKeyService("");
                  }}
                  className="bg-green-500 text-white px-3 rounded"
                >
                  Add
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Complexity Level</label>
                <select
                  name="complexity_level"
                  value={form.complexity_level}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                >
                  {complexityLevels.map(level => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Estimated Duration</label>
                <input
                  type="text"
                  name="estimated_duration"
                  value={form.estimated_duration}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., 2-3 days, 1 week"
                />
              </div>
            </div>
          </div>
          {/* Pricing Information Section */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Pricing Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium mb-1">Hourly Rate ($)</label>
                <input
                  type="number"
                  name="hourly_rate"
                  value={form.hourly_rate}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                name="is_free_tier_available"
                checked={form.is_free_tier_available}
                onChange={handleChange}
                className="mr-2"
              />
              <label className="font-medium">Free tier available</label>
            </div>
          </div>
          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Additional Information</h3>
            <div className="mb-4">
              <label className="block font-medium mb-1">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.tags.map((tag, index) => (
                  <span key={index} className="bg-gray-200 px-2 py-1 rounded flex items-center">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeFromArray('tags', index)}
                      className="ml-2 text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="flex-1 border rounded px-3 py-2"
                  placeholder="Add tag (press Enter)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('tags', newTag);
                      setNewTag("");
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    addToArray('tags', newTag);
                    setNewTag("");
                  }}
                  className="bg-blue-500 text-white px-3 rounded"
                >
                  Add
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="requires_consultation"
                checked={form.requires_consultation}
                onChange={handleChange}
                className="mr-2"
              />
              <label className="font-medium">Requires initial consultation</label>
            </div>
          </div>
          {/* Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="font-medium">Active Service</label>
          </div>
          {error && <div className="text-red-600 bg-red-50 p-3 rounded">{error}</div>}
          {success && <div className="text-green-600 bg-green-50 p-3 rounded">{success}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
            disabled={loading}
          >
            {loading ? "Adding Legal Service..." : "Add Legal Service"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminAddServices;