import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerChildren = {
    visible: { transition: { staggerChildren: 0.1 } }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
  };

  const slideIn = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.7 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 mt-16 overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl overflow-hidden border border-blue-100 mx-4 sm:mx-6 lg:mx-auto max-w-7xl mt-6">
        <div className="w-full">
          <div className="relative z-10 pb-8 bg-gradient-to-r from-blue-900 to-blue-800 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32 px-4 sm:px-6 md:px-8">
            <svg
              className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-blue-800 transform translate-x-1/2"
              fill="currentColor"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polygon points="50,0 100,0 50,100 0,100" />
            </svg>

            <motion.div 
              className="pt-10 mx-auto max-w-7xl px-2 sm:pt-12 sm:px-6 md:pt-16 lg:pt-20 lg:px-8 xl:pt-28"
              initial="hidden"
              animate="visible"
              variants={staggerChildren}
            >
              <motion.div className="text-center lg:text-left" variants={fadeIn}>
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                  <span className="block">Find the Right Legal</span>
                  <motion.span 
                    className="block text-blue-300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                  >
                    Help You Need
                  </motion.span>
                </h1>
                <motion.p 
                  className="mt-3 text-base text-blue-200 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0"
                  variants={fadeIn}
                >
                  Dikoras connects you with qualified legal professionals across all U.S. states. Submit your case details and receive quality responses from matched lawyers.
                </motion.p>
                <motion.div 
                  className="mt-5 sm:mt-8 flex flex-col sm:flex-row sm:justify-center lg:justify-start gap-3"
                  variants={fadeIn}
                >
                  <div className="rounded-md shadow">
                    <Link
                      to="/register"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 transition-all duration-300 transform hover:-translate-y-1"
                    >
                      Get Started
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0">
                    <Link
                      to="/how-it-works"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10 transition-all duration-300 transform hover:-translate-y-1"
                    >
                      How It Works
                    </Link>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
        <div className="w-full lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <motion.img
            className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full rounded-b-2xl lg:rounded-none"
            src="https://images.unsplash.com/photo-1589391886645-d51941baf7fb?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
            alt="Legal professionals discussing"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          />
        </div>
      </div>

      {/* Stats Section */}
      <motion.div 
        className="py-12 bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg border border-blue-100 mx-4 sm:mx-6 lg:mx-auto max-w-7xl mt-12"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <dt className="text-4xl font-extrabold text-blue-600">2000+</dt>
              <dd className="mt-1 text-sm font-medium text-gray-500">Qualified Lawyers</dd>
            </motion.div>
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <dt className="text-4xl font-extrabold text-blue-600">50</dt>
              <dd className="mt-1 text-sm font-medium text-gray-500">U.S. States Covered</dd>
            </motion.div>
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <dt className="text-4xl font-extrabold text-blue-600">98%</dt>
              <dd className="mt-1 text-sm font-medium text-gray-500">Client Satisfaction</dd>
            </motion.div>
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <dt className="text-4xl font-extrabold text-blue-600">24/7</dt>
              <dd className="mt-1 text-sm font-medium text-gray-500">Support Available</dd>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* How It Works Section */}
      <motion.div 
        className="py-12 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-blue-100 mx-4 sm:mx-6 lg:mx-auto max-w-7xl mt-12"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center" variants={fadeIn}>
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Process</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              How Dikoras Works
            </p>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              Simple steps to connect with the right legal professional for your needs
            </p>
          </motion.div>

          <motion.div 
            className="mt-12"
            variants={staggerChildren}
          >
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {/* Step 1 */}
              <motion.div 
                className="pt-6"
                variants={scaleIn}
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flow-root bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl px-6 pb-8 shadow-lg border border-blue-200 h-full">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-500 to-blue-400 rounded-xl shadow-xl">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-bold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent tracking-tight drop-shadow-lg">Submit Your Case</h3>
                    <p className="mt-5 text-base text-blue-700">
                      Describe your legal issue and provide relevant details through our secure platform.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Step 2 */}
              <motion.div 
                className="pt-6"
                variants={scaleIn}
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
              >
                <div className="flow-root bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl px-6 pb-8 shadow-lg border border-blue-200 h-full">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-500 to-blue-400 rounded-xl shadow-xl">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-bold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent tracking-tight drop-shadow-lg">Get Matched</h3>
                    <p className="mt-5 text-base text-blue-700">
                      Our algorithm connects you with qualified lawyers specializing in your specific legal needs.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Step 3 */}
              <motion.div 
                className="pt-6"
                variants={scaleIn}
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
              >
                <div className="flow-root bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl px-6 pb-8 shadow-lg border border-blue-200 h-full">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-500 to-blue-400 rounded-xl shadow-xl">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-bold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent tracking-tight drop-shadow-lg">Receive Responses</h3>
                    <p className="mt-5 text-base text-blue-700">
                      Review proposals, credentials, and fees from multiple qualified attorneys.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Step 4 */}
              <motion.div 
                className="pt-6"
                variants={scaleIn}
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
              >
                <div className="flow-root bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl px-6 pb-8 shadow-lg border border-blue-200 h-full">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-500 to-blue-400 rounded-xl shadow-xl">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.668-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-bold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent tracking-tight drop-shadow-lg">Secure Collaboration</h3>
                    <p className="mt-5 text-base text-blue-700">
                      Work with your chosen lawyer through our secure platform with built-in billing and communication tools.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Testimonials Section */}
      <motion.div 
        className="py-16 bg-gradient-to-r from-blue-800 to-blue-900 text-white rounded-2xl shadow-xl mx-4 sm:mx-6 lg:mx-auto max-w-7xl mt-12"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-blue-300 tracking-wide uppercase">Testimonials</h2>
            <p className="mt-2 text-3xl font-extrabold sm:text-4xl">
              What Our Clients Say
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            <motion.div 
              className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-blue-700"
              variants={scaleIn}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-bold">JD</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold">John Doe</h4>
                  <p className="text-blue-200">Business Client</p>
                </div>
              </div>
              <p className="text-blue-100">
                "Dikoras connected me with exactly the right corporate lawyer for my startup. The process was seamless and saved me weeks of research."
              </p>
            </motion.div>

            <motion.div 
              className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-blue-700"
              variants={scaleIn}
              whileHover={{ y: -5 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-bold">SM</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold">Sarah Miller</h4>
                  <p className="text-blue-200">Family Law Client</p>
                </div>
              </div>
              <p className="text-blue-100">
                "I was able to compare multiple family lawyers and their approaches to my case. Found someone who truly understood my situation."
              </p>
            </motion.div>

            <motion.div 
              className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-blue-700"
              variants={scaleIn}
              whileHover={{ y: -5 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-bold">RJ</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold">Robert Johnson</h4>
                  <p className="text-blue-200">Real Estate Client</p>
                </div>
              </div>
              <p className="text-blue-100">
                "The platform made it easy to handle a complex real estate transaction remotely. The document sharing and e-signature features were invaluable."
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Services Section */}
      <motion.div 
        className="py-12 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-blue-100 mx-4 sm:mx-6 lg:mx-auto max-w-7xl mt-12"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center" variants={fadeIn}>
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Legal Areas</h2>
            <p className="mt-2 text-3xl font-extrabold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent sm:text-4xl drop-shadow-lg">
              Our Legal Services
            </p>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              Comprehensive legal support across all practice areas
            </p>
          </motion.div>

          <motion.div 
            className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerChildren}
          >
            {/* Service 1 */}
            <motion.div 
              className="bg-gradient-to-br from-blue-100 to-blue-200 overflow-hidden shadow-xl rounded-xl border border-blue-200"
              variants={scaleIn}
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)" }}
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-xl p-3 shadow-lg">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v4m14 0h2m-2 0h-2m2-0H9m2 0v-4a1 1 0 00-1-1h-1a1 1 0 00-1 1v4h4v-2a1 1 0 011-1h2a1 1 0 011 1v2h4z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Business Law
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-lg font-semibold text-gray-900">
                          Contracts, Incorporation, Compliance
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <Link to="#" className="font-medium text-blue-600 hover:text-blue-500 transition-all duration-200 hover:underline">
                    View details
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Service 2 */}
            <motion.div 
              className="bg-gradient-to-br from-blue-100 to-blue-200 overflow-hidden shadow-xl rounded-xl border border-blue-200"
              variants={scaleIn}
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)" }}
              transition={{ delay: 0.1 }}
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-xl p-3 shadow-lg">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Family Law
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-lg font-semibold text-gray-900">
                          Divorce, Custody, Adoption
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <Link to="#" className="font-medium text-blue-600 hover:text-blue-500 transition-all duration-200 hover:underline">
                    View details
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Service 3 */}
            <motion.div 
              className="bg-gradient-to-br from-blue-100 to-blue-200 overflow-hidden shadow-xl rounded-xl border border-blue-200"
              variants={scaleIn}
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)" }}
              transition={{ delay: 0.2 }}
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-xl p-3 shadow-lg">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Criminal Defense
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-lg font-semibold text-gray-900">
                          DUI, Theft, Assault, Drug Crimes
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <Link to="#" className="font-medium text-blue-600 hover:text-blue-500 transition-all duration-200 hover:underline">
                    View details
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Service 4 */}
            <motion.div 
              className="bg-gradient-to-br from-blue-100 to-blue-200 overflow-hidden shadow-xl rounded-xl border border-blue-200"
              variants={scaleIn}
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)" }}
              transition={{ delay: 0.3 }}
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-xl p-3 shadow-lg">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Real Estate
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-lg font-semibold text-gray-900">
                          Transactions, Disputes, Landlord-Tenant
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <Link to="#" className="font-medium text-blue-600 hover:text-blue-500 transition-all duration-200 hover:underline">
                    View details
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Service 5 */}
            <motion.div 
              className="bg-gradient-to-br from-blue-100 to-blue-200 overflow-hidden shadow-xl rounded-xl border border-blue-200"
              variants={scaleIn}
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)" }}
              transition={{ delay: 0.4 }}
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-xl p-3 shadow-lg">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Immigration
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-lg font-semibold text-gray-900">
                          Visas, Green Cards, Citizenship
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <Link to="#" className="font-medium text-blue-600 hover:text-blue-500 transition-all duration-200 hover:underline">
                    View details
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Service 6 */}
            <motion.div 
              className="bg-gradient-to-br from-blue-100 to-blue-200 overflow-hidden shadow-xl rounded-xl border border-blue-200"
              variants={scaleIn}
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)" }}
              transition={{ delay: 0.5 }}
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-xl p-3 shadow-lg">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Personal Injury
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-lg font-semibold text-gray-900">
                          Accidents, Medical Malpractice, Workers Comp
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <Link to="#" className="font-medium text-blue-600 hover:text-blue-500 transition-all duration-200 hover:underline">
                    View details
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div 
        className="bg-gradient-to-r from-blue-700 to-blue-800 backdrop-blur-lg rounded-2xl shadow-xl border border-blue-100 mx-4 sm:mx-6 lg:mx-auto max-w-7xl mt-12"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
      >
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <motion.h2 
            className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
            variants={slideIn}
          >
            <span className="block">Ready to find legal help?</span>
            <span className="block text-blue-200">Create an account today.</span>
          </motion.h2>
          <motion.div 
            className="mt-8 flex lg:mt-0 lg:flex-shrink-0"
            variants={fadeIn}
          >
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-semibold rounded-xl text-blue-600 bg-white hover:bg-blue-50 shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                Get started
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link
                to="/how-it-works"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-semibold rounded-xl text-white bg-blue-900 hover:bg-blue-800 shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                Learn more
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;