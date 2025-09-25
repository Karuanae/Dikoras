import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Building2, Users, Shield, Home, Clock, Briefcase, FileText, Scale, Heart, DollarSign, Globe, Car, Gavel, Award, AlertTriangle, TreePine, Zap, UserCheck, Landmark } from 'lucide-react';

const Footer = () => (
  <footer className="bg-gray-900 text-white py-8">
    <div className="max-w-6xl mx-auto px-4 text-center">
      <p>&copy; 2025 Dikoras Legal Services. All rights reserved.</p>
    </div>
  </footer>
);

// Removed services array

const categories = ['All', 'Business', 'Family', 'Employment', 'Immigration', 'Litigation', 'Real Estate', 'Personal Injury', 'IP', 'Tax', 'Estate', 'Review', 'Environmental', 'Energy'];
const sortOptions = ['Name (A-Z)', 'Name (Z-A)', 'Price (Low to High)', 'Price (High to Low)', 'Delivery Time'];

import { useEffect } from 'react';
import { getLegalServices } from '../services/api';

const LegalServices = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Name (A-Z)');
  const [showFilters, setShowFilters] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchServices() {
      setLoading(true);
      try {
        const data = await getLegalServices();
        setServices(Array.isArray(data) ? data : []);
      } catch (err) {
        setServices([]);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

  const handleGetStarted = (service) => {
    localStorage.setItem('selectedService', JSON.stringify(service));
    navigate('/login', {
      state: {
        redirectTo: '/client/dashboard',
        service: service.title
      }
    });
  };

  const filteredAndSortedServices = useMemo(() => {
    let filtered = services.filter(service => {
      const title = typeof service.title === 'string' ? service.title : '';
      const description = typeof service.description === 'string' ? service.description : '';
      const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'Name (A-Z)':
          return a.title.localeCompare(b.title);
        case 'Name (Z-A)':
          return b.title.localeCompare(a.title);
        case 'Price (Low to High)':
          const priceA = a.pricing.match(/\$(\d+)/)?.[1] || '0';
          const priceB = b.pricing.match(/\$(\d+)/)?.[1] || '0';
          return parseInt(priceA) - parseInt(priceB);
        case 'Price (High to Low)':
          const priceA2 = a.pricing.match(/\$(\d+)/)?.[1] || '0';
          const priceB2 = b.pricing.match(/\$(\d+)/)?.[1] || '0';
          return parseInt(priceB2) - parseInt(priceA2);
        case 'Delivery Time':
          return a.deliveryTime.localeCompare(b.deliveryTime);
        default:
          return 0;
      }
    });
  }, [services, searchTerm, selectedCategory, sortBy]);

  return (
    <>
<div className="min-h-screen bg-gradient-to-br from-blue-200 via-blue-100 to-blue-300 py-12 px-4 mt-16 backdrop-blur-lg">        {/* Header Section */}
        <div className="max-w-6xl mx-auto text-center mb-12">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-blue-100 p-8 mb-8">
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent mb-4 drop-shadow-lg">
               LEGAL SERVICES
            </h1>
            <p className="max-w-3xl mx-auto text-lg text-gray-700 leading-relaxed">
              Dikoras provides end-to-end legal solutions across all major practice areas. From business formation to complex litigation, 
              our network of expert attorneys delivers results with transparency and excellence.
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-lg border border-blue-100 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search legal services..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Filter className="h-5 w-5" />
                Filters
              </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {sortOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Active Filters Display */}
                {(searchTerm || selectedCategory !== 'All') && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {searchTerm && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1">
                        Search: "{searchTerm}"
                        <button onClick={() => setSearchTerm('')} className="ml-1 text-blue-600 hover:text-blue-800">×</button>
                      </span>
                    )}
                    {selectedCategory !== 'All' && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center gap-1">
                        Category: {selectedCategory}
                        <button onClick={() => setSelectedCategory('All')} className="ml-1 text-purple-600 hover:text-purple-800">×</button>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Results Count */}
          <p className="text-gray-600 mb-6">
            Showing {filteredAndSortedServices.length} of {services.length} services
          </p>
        </div>

        {/* Services Grid */}
        <div className="max-w-6xl mx-auto">
          {filteredAndSortedServices.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-blue-100 p-8">
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No services found</h3>
                <p className="text-gray-500">Try adjusting your search terms or filters</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedServices.map((service, index) => (
                <div
                  key={index}
                  className="group bg-white/90 backdrop-blur-lg rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 flex flex-col"
                >
                  <div className="flex items-center mb-4">
                    <span className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg group-hover:from-blue-700 group-hover:to-indigo-700 transition-all duration-300">
                      {service.icon}
                    </span>
                    <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                      {service.category}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3 group-hover:from-blue-700 group-hover:to-indigo-600 transition-all duration-300">
                    {service.title}
                  </h3>

                  <p className="text-gray-700 mb-4 flex-grow leading-relaxed">
                    {service.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                      <span className="font-medium">{service.pricing}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2 text-blue-600" />
                      <span>{service.deliveryTime}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleGetStarted(service)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Get Started
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Why Choose Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-blue-100 p-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 bg-clip-text text-transparent mb-6 text-center">
              Why Choose Dikoras Legal Services?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Verified Experts</h4>
                  <p className="text-gray-600">Licensed attorneys with proven expertise in your specific area of need.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Transparent Pricing</h4>
                  <p className="text-gray-600">Clear, upfront pricing with no hidden fees or surprise charges.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Secure Platform</h4>
                  <p className="text-gray-600">Bank-level security for all communications, documents, and billing.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Fast Turnaround</h4>
                  <p className="text-gray-600">Efficient service delivery with clear timelines and regular updates.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-3xl mx-auto mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Get Expert Legal Help?
            </h3>
            <p className="text-blue-100 mb-6 text-lg">
              Connect with qualified attorneys who understand your needs. Get started with a free consultation today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/login')}
                className="px-8 py-3 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
              >
                Free Consultation
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="px-8 py-3 bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:bg-blue-800 transition-all duration-300 transform hover:scale-105 border-2 border-blue-400"
              >
                View Pricing
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LegalServices;