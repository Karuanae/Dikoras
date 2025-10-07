import React, { useState } from "react";
import { addLegalService } from '../services/api';

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

  const addToArray = (field, value, setNewValue) => {
    if (value.trim() === "") return;
    setForm(prev => ({
      ...prev,
      [field]: [...prev[field], value.trim()]
    }));
    if (setNewValue) setNewValue("");
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
      // Validate required fields
      if (!form.name.trim() || !form.description.trim() || !form.category || !form.service_type || !form.pricing_model) {
        throw new Error("Please fill in all required fields");
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        icon: form.icon.trim() || "default-icon",
        is_active: form.is_active,
        category: form.category,
        sub_category: form.sub_category || "",
        service_type: form.service_type,
        pricing_model: form.pricing_model,
        estimated_duration: form.estimated_duration || "",
        complexity_level: form.complexity_level,
        key_services: form.key_services.filter(service => service.trim() !== ""),
        target_audience: form.target_audience || "",
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

      console.log('Submitting legal service:', payload);
      
      const result = await addLegalService(payload);
      console.log('Service creation result:', result);
      
      if (result.id || result.success) {
        setSuccess("Legal service added successfully!");
        // Reset form
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
        setNewTag("");
        setNewKeyService("");
        setNewDeliverable("");
      } else {
        throw new Error(result.message || "Failed to add service");
      }
    } catch (err) {
      console.error('Error adding legal service:', err);
      setError(err.message || "Error adding legal service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-900">Add Legal Service</h2>
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-700">{success}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-900">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-2 text-gray-700">Service Name *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="e.g., Legal Research, Contract Drafting"
                />
              </div>
              <div>
                <label className="block font-medium mb-2 text-gray-700">Category *</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-2 text-gray-700">Service Type *</label>
                <select
                  name="service_type"
                  value={form.service_type}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Type</option>
                  {serviceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-2 text-gray-700">Pricing Model *</label>
                <select
                  name="pricing_model"
                  value={form.pricing_model}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block font-medium mb-2 text-gray-700">Description *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                required
                placeholder="Detailed description of the legal service..."
              />
            </div>
          </div>

          {/* Service Details Section */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-900">Service Details</h3>
            
            {/* Key Services */}
            <div className="mb-4">
              <label className="block font-medium mb-2 text-gray-700">Key Services</label>
              {form.key_services.map((service, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={service}
                    onChange={(e) => handleArrayChange('key_services', index, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Case law research, Contract review"
                  />
                  <button
                    type="button"
                    onClick={() => removeFromArray('key_services', index)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 rounded-lg transition-colors"
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
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add new key service"
                />
                <button
                  type="button"
                  onClick={() => addToArray('key_services', newKeyService, setNewKeyService)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-2 text-gray-700">Complexity Level</label>
                <select
                  name="complexity_level"
                  value={form.complexity_level}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {complexityLevels.map(level => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-2 text-gray-700">Estimated Duration</label>
                <input
                  type="text"
                  name="estimated_duration"
                  value={form.estimated_duration}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2-3 days, 1 week"
                />
              </div>
            </div>
          </div>

          {/* Pricing Information Section */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-900">Pricing Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium mb-2 text-gray-700">Hourly Rate ($)</label>
                <input
                  type="number"
                  name="hourly_rate"
                  value={form.hourly_rate}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block font-medium mb-2 text-gray-700">Flat Fee ($)</label>
                <input
                  type="number"
                  name="flat_fee"
                  value={form.flat_fee}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block font-medium mb-2 text-gray-700">Subscription Price ($)</label>
                <input
                  type="number"
                  name="subscription_price"
                  value={form.subscription_price}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                name="is_free_tier_available"
                checked={form.is_free_tier_available}
                onChange={handleChange}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="font-medium text-gray-700">Free tier available</label>
            </div>
          </div>

          {/* Additional Information */}
          <div className="pb-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-900">Additional Information</h3>
            
            {/* Tags */}
            <div className="mb-4">
              <label className="block font-medium mb-2 text-gray-700">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.tags.map((tag, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeFromArray('tags', index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
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
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add tag (press Enter)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('tags', newTag, setNewTag);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => addToArray('tags', newTag, setNewTag)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded-lg transition-colors"
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
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="font-medium text-gray-700">Requires initial consultation</label>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="font-medium text-gray-700">Active Service</label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Adding Legal Service...
              </div>
            ) : (
              "Add Legal Service"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminAddServices;