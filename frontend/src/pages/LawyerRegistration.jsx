import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerLawyer } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MapPin, Briefcase, Award, GraduationCap, Clock, DollarSign, Camera, User } from 'lucide-react';

const LawyerRegistration = () => {
  const [formData, setFormData] = useState({
    // Personal Information
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Professional Information
    hourlyRate: '',
    experience: '',
    education: '',
    bio: '',
    
    // Practice Details
    categories: [], // Will be mapped to specializations
    languages: [], // Always an array
    
    // Location and Description (FIXED: Added these missing fields)
    location: '',
    description: '',
    
    // Credentials
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    // Profile Image (not sent to backend)
    profileImage: null
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const specializations = [
    'Business', 'Corporate', 'Immigration', 'IP', 'Technology', 
    'Family', 'Real Estate', 'Criminal', 'Tax', 'Employment', 
    'Estate', 'Personal Injury'
  ];

  const languages = ['English', 'Spanish', 'French', 'Mandarin', 'Italian', 'Korean'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profileImage: file
      }));
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryChange = (category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleLanguageChange = (language) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // FIXED: Add client-side validation before submitting
    const requiredFields = ['username', 'firstName', 'lastName', 'email', 'password', 'confirmPassword'];
    const missingFields = requiredFields.filter(field => !formData[field]?.trim());
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    if (formData.categories.length === 0) {
      alert('Please select at least one specialization');
      return;
    }
    
    if (formData.languages.length === 0) {
      alert('Please select at least one language');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Map frontend fields to backend requirements
      const lawyerData = {
        username: formData.username?.trim() || '',
        email: formData.email?.trim() || '',
        password: formData.password || '',
        confirm_password: formData.confirmPassword || '',
        first_name: formData.firstName?.trim() || '',
        last_name: formData.lastName?.trim() || '',
        user_type: 'lawyer',
        phone: formData.phone?.trim() || '',
        address: formData.location?.trim() || '', // FIXED: Now properly maps to location field
        years_of_experience: formData.experience || '',
        education: formData.education?.trim() || '',
        hourly_rate: formData.hourlyRate || '',
        bio: formData.bio?.trim() || '',
        specializations: Array.isArray(formData.categories) ? formData.categories : [],
      };
      
      console.log('Sending data:', lawyerData); // Debug log
      
      // Call backend API to register lawyer
      const response = await registerLawyer(lawyerData);
      if ((response && response.status === 201) || (response && response.success)) {
        alert('Your application has been submitted for admin approval. You will be redirected to the Pending Approval page.');
        setTimeout(() => {
          navigate('/pending-approval', {
            state: {
              message: 'Your lawyer application is pending admin approval. You will be notified once verified.'
            }
          });
        }, 1500);
      } else {
        alert('There was an error submitting your application. Please try again.');
      }
    } catch (error) {
      console.error('Full error object:', error); // Enhanced error logging
      if (error.response && error.response.status === 201) {
        alert('Your application has been submitted for admin approval. You will be redirected to the Pending Approval page.');
        setTimeout(() => {
          navigate('/pending-approval', {
            state: {
              message: 'Your lawyer application is pending admin approval. You will be notified once verified.'
            }
          });
        }, 1500);
      } else if (error.response && error.response.data && error.response.data.error) {
        // Show backend error message
        alert(`Registration failed: ${error.response.data.error}`);
        console.error('Registration error:', error.response.data.error);
      } else {
        console.error('Registration error:', error);
        alert('There was an error submitting your application. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center pt-32 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="text-center mb-6">
            <Link to="/" className="inline-block">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                DIKORAS
              </span>
            </Link>
            <h2 className="mt-3 text-2xl font-semibold text-gray-800">Join Our Legal Network</h2>
            <p className="mt-1 text-sm text-gray-600">
              Complete your professional profile to start receiving clients
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Profile Image Upload */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Camera className="h-5 w-5 mr-2 text-blue-600" />
                Profile Photo
              </h3>
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Profile preview" 
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-md">
                      <User className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  <label 
                    htmlFor="profileImage" 
                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-blue-700 transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                    <input
                      id="profileImage"
                      name="profileImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Upload a professional headshot. Max file size: 5MB
                </p>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Award className="h-5 w-5 mr-2 text-blue-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                  <input
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First name *</label>
                  <input
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last name *</label>
                  <input
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
                Professional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($) *</label>
                  <input
                    name="hourlyRate"
                    type="number"
                    required
                    value={formData.hourlyRate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 350"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience *</label>
                  <input
                    name="experience"
                    type="number"
                    required
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Education *</label>
                  <input
                    name="education"
                    type="text"
                    required
                    value={formData.education}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Harvard Law School, J.D. 2008"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio *</label>
                  <textarea
                    name="bio"
                    required
                    value={formData.bio}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Short professional bio..."
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                Location
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <input
                  name="location"
                  type="text"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., New York, NY"
                />
              </div>
            </div>

            {/* Specializations */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <GraduationCap className="h-5 w-5 mr-2 text-blue-600" />
                Specializations & Languages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Areas of Practice *</label>
                  <div className="space-y-2">
                    {specializations.map(spec => (
                      <label key={spec} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.categories.includes(spec)}
                          onChange={() => handleCategoryChange(spec)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{spec}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Languages Spoken *</label>
                  <div className="space-y-2">
                    {languages.map(lang => (
                      <label key={lang} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.languages.includes(lang)}
                          onChange={() => handleLanguageChange(lang)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{lang}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Description */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Professional Description *</h3>
              <textarea
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your practice, expertise, and approach..."
              />
            </div>

            {/* Password */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Security</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <div className="relative">
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  name="agreeToTerms"
                  type="checkbox"
                  required
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label className="font-medium text-gray-700">
                  I agree to the{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-500">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-500">
                    Privacy Policy
                  </a>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-300"
            >
              {isSubmitting ? 'Submitting Application...' : 'Submit Application for Approval'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LawyerRegistration;