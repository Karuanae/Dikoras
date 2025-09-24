import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getLawyers } from '../services/api';
import { Search, Filter, MapPin, Star, Clock, Award, GraduationCap, Briefcase, Phone, Mail, Calendar, DollarSign } from 'lucide-react';

const Footer = () => (
  <footer className="bg-gray-900 text-white py-8">
    <div className="max-w-6xl mx-auto px-4 text-center">
      <p>&copy; 2025 Dikoras Legal Services. All rights reserved.</p>
    </div>
  </footer>
);

// ...existing code...

const categories = ['All', 'Business', 'Immigration', 'IP', 'Family', 'Real Estate', 'Criminal', 'Tax', 'Employment', 'Estate', 'Personal Injury'];
const sortOptions = ['Name (A-Z)', 'Name (Z-A)', 'Rating (High to Low)', 'Rating (Low to High)', 'Experience (High to Low)', 'Experience (Low to High)', 'Hourly Rate (Low to High)', 'Hourly Rate (High to Low)'];
const experienceOptions = ['All', '5+ years', '10+ years', '15+ years', '20+ years'];

const LawyersDirectory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedExperience, setSelectedExperience] = useState('All');
  const [sortBy, setSortBy] = useState('Rating (High to Low)');
  const [showFilters, setShowFilters] = useState(false);
  const [lawyers, setLawyers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchLawyers() {
      try {
        const data = await getLawyers();
        setLawyers(data);
      } catch (err) {
        // Handle error (show notification, etc.)
      }
    }
    fetchLawyers();
  }, []);

  const handleContactLawyer = (lawyer) => {
    // Store the selected lawyer in localStorage
    localStorage.setItem('selectedLawyer', JSON.stringify(lawyer));
    // Redirect to login page
    navigate('/login', { 
      state: { 
        redirectTo: '/client/dashboard',
        lawyer: lawyer.name
      } 
    });
  };

  const filteredAndSortedLawyers = useMemo(() => {
    let filtered = lawyers.filter(lawyer => {
      const matchesSearch = lawyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lawyer.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lawyer.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || lawyer.categories.includes(selectedCategory);
      
      let matchesExperience = true;
      if (selectedExperience !== 'All') {
        const expYears = parseInt(lawyer.experience);
        const requiredYears = parseInt(selectedExperience);
        matchesExperience = expYears >= requiredYears;
      }
      
      return matchesSearch && matchesCategory && matchesExperience;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'Name (A-Z)':
          return a.name.localeCompare(b.name);
        case 'Name (Z-A)':
          return b.name.localeCompare(a.name);
        case 'Rating (High to Low)':
          return b.rating - a.rating;
        case 'Rating (Low to High)':
          return a.rating - b.rating;
        case 'Experience (High to Low)':
          return parseInt(b.experience) - parseInt(a.experience);
        case 'Experience (Low to High)':
          return parseInt(a.experience) - parseInt(b.experience);
        case 'Hourly Rate (Low to High)':
          return parseInt(a.hourlyRate.replace('$', '')) - parseInt(b.hourlyRate.replace('$', ''));
        case 'Hourly Rate (High to Low)':
          return parseInt(b.hourlyRate.replace('$', '')) - parseInt(a.hourlyRate.replace('$', ''));
        default:
          return 0;
      }
    });
  }, [searchTerm, selectedCategory, selectedExperience, sortBy]);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key={fullStars} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }
    
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={fullStars + i + 1} className="h-4 w-4 text-yellow-400" />);
    }
    
    return stars;
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-200 via-blue-100 to-blue-300 py-12 px-4 mt-16 backdrop-blur-lg">
        {/* Header Section */}
        <div className="max-w-6xl mx-auto text-center mb-12">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-blue-100 p-8 mb-8">
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent mb-4 drop-shadow-lg">
              OUR LEGAL EXPERTS
            </h1>
            <p className="max-w-3xl mx-auto text-lg text-gray-700 leading-relaxed">
              Connect with experienced attorneys who specialize in your area of need. All our lawyers are vetted, licensed professionals ready to assist you.
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
                  placeholder="Search lawyers by name, specialty..."
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Specialty</label>
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

                  {/* Experience Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Experience</label>
                    <select
                      value={selectedExperience}
                      onChange={(e) => setSelectedExperience(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {experienceOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
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
                {(searchTerm || selectedCategory !== 'All' || selectedExperience !== 'All') && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {searchTerm && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1">
                        Search: "{searchTerm}"
                        <button onClick={() => setSearchTerm('')} className="ml-1 text-blue-600 hover:text-blue-800">×</button>
                      </span>
                    )}
                    {selectedCategory !== 'All' && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center gap-1">
                        Specialty: {selectedCategory}
                        <button onClick={() => setSelectedCategory('All')} className="ml-1 text-purple-600 hover:text-purple-800">×</button>
                      </span>
                    )}
                    {selectedExperience !== 'All' && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-1">
                        Experience: {selectedExperience}
                        <button onClick={() => setSelectedExperience('All')} className="ml-1 text-green-600 hover:text-green-800">×</button>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Results Count */}
          <p className="text-gray-600 mb-6">
            Showing {filteredAndSortedLawyers.length} of {lawyers.length} legal experts
          </p>
        </div>

        {/* Lawyers Grid */}
        <div className="max-w-6xl mx-auto">
          {filteredAndSortedLawyers.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-blue-100 p-8">
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No lawyers found</h3>
                <p className="text-gray-500">Try adjusting your search terms or filters</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedLawyers.map((lawyer) => (
                <div
                  key={lawyer.id}
                  className="group bg-white/90 backdrop-blur-lg rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 flex flex-col"
                >
                  {/* Lawyer Header with Image and Basic Info */}
                  <div className="flex items-start mb-4">
                    <img
                      src={lawyer.profilePic}
                      alt={lawyer.name}
                      className="w-16 h-16 rounded-full object-cover shadow-md"
                    />
                    <div className="ml-4 flex-1">
                      <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
                        {lawyer.name}
                      </h3>
                      <p className="text-blue-600 font-medium">{lawyer.title}</p>
                      
                      {/* Rating and Reviews */}
                      <div className="flex items-center mt-1">
                        <div className="flex items-center">
                          {renderStars(lawyer.rating)}
                          <span className="ml-1 text-sm font-semibold text-gray-700">{lawyer.rating}</span>
                        </div>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-sm text-gray-500">{lawyer.reviews} reviews</span>
                      </div>
                    </div>
                  </div>

                  {/* Location and Experience */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-1 text-blue-600" />
                      <span>{lawyer.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Briefcase className="h-4 w-4 mr-1 text-blue-600" />
                      <span>{lawyer.experience} experience</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 mb-4 flex-grow leading-relaxed">
                    {lawyer.description}
                  </p>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {lawyer.categories.map((category, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full"
                      >
                        {category}
                      </span>
                    ))}
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                      <span className="font-medium">{lawyer.hourlyRate}/hour</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-2 text-blue-600" />
                      <span>{lawyer.availability}</span>
                    </div>
                    <div className="flex items-center text-gray-600 col-span-2">
                      <GraduationCap className="h-4 w-4 mr-2 text-purple-600" />
                      <span className="truncate">{lawyer.education}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-auto">
                    <button 
                      onClick={() => handleContactLawyer(lawyer)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
                    >
                      Contact Lawyer
                    </button>
                    <button className="px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                      <Phone className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Why Choose Our Lawyers Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-blue-100 p-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 bg-clip-text text-transparent mb-6 text-center">
              Why Work With Our Legal Experts?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Vetted Professionals</h4>
                  <p className="text-gray-600">Every lawyer is thoroughly screened and verified for credentials and experience.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Transparent Pricing</h4>
                  <p className="text-gray-600">Clear hourly rates with no hidden fees or unexpected charges.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Quick Response</h4>
                  <p className="text-gray-600">Most attorneys respond within 24 hours for urgent legal matters.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Specialized Expertise</h4>
                  <p className="text-gray-600">Find lawyers who specialize specifically in your area of need.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lawyer Registration CTA */}
        <div className="max-w-3xl mx-auto mt-12 text-center">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Are you a lawyer?
            </h3>
            <p className="text-indigo-100 mb-6 text-lg">
              Join our network of legal professionals and connect with clients seeking your expertise.
            </p>
            <Link
              to="/register-lawyer"
              className="inline-block px-8 py-3 bg-white text-indigo-600 font-bold rounded-xl shadow-lg hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
            >
              Join as a Lawyer
            </Link>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-3xl mx-auto mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Need Help Finding the Right Lawyer?
            </h3>
            <p className="text-blue-100 mb-6 text-lg">
              Our legal matching service can connect you with the perfect attorney for your specific needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/login')}
                className="px-8 py-3 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
              >
                Match Me With a Lawyer
              </button>
              <button 
                onClick={() => navigate('/contact')}
                className="px-8 py-3 bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:bg-blue-800 transition-all duration-300 transform hover:scale-105 border-2 border-blue-400"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LawyersDirectory;