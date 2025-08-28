import React from 'react';

const Footer = () => (
  <footer className="backdrop-blur-lg bg-blue-900/80 shadow-2xl rounded-t-2xl border-t border-blue-200">
  <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
      <div className="xl:grid xl:grid-cols-3 xl:gap-8">
        <div className="xl:col-span-1">
          <div className="flex items-center">
            <span className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-blue-700 to-blue-400 bg-clip-text text-transparent drop-shadow-lg tracking-wide">DIKORAS</span>
          </div>
          <p className="mt-4 text-base text-blue-100">
            Connecting clients with qualified legal professionals across all U.S. states.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
          <div className="md:grid md:grid-cols-2 md:gap-8">
            <div>
              <h3 className="text-sm font-semibold text-blue-200 tracking-wider uppercase">
                For Clients
              </h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#" className="text-base text-blue-100 hover:text-blue-300 transition-all duration-200 hover:underline">
                    Find a Lawyer
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-blue-200 hover:text-white">
                    Post a Case
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-blue-200 hover:text-white">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-blue-200 hover:text-white">
                    Fees & Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div className="mt-12 md:mt-0">
              <h3 className="text-sm font-semibold text-blue-200 tracking-wider uppercase">
                For Lawyers
              </h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#" className="text-base text-blue-100 hover:text-blue-300 transition-all duration-200 hover:underline">
                    Join Dikoras
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-blue-200 hover:text-white">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-blue-200 hover:text-white">
                    Success Stories
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-blue-200 hover:text-white">
                    Resources
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="md:grid md:grid-cols-2 md:gap-8">
            <div>
              <h3 className="text-sm font-semibold text-blue-200 tracking-wider uppercase">
                Company
              </h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#" className="text-base text-blue-100 hover:text-blue-300 transition-all duration-200 hover:underline">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-blue-200 hover:text-white">
                    Team
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-blue-200 hover:text-white">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-blue-200 hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div className="mt-12 md:mt-0">
              <h3 className="text-sm font-semibold text-blue-200 tracking-wider uppercase">
                Legal
              </h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#" className="text-base text-blue-100 hover:text-blue-300 transition-all duration-200 hover:underline">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-blue-200 hover:text-white">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-blue-200 hover:text-white">
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-blue-200 hover:text-white">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-12 border-t border-blue-400 pt-8">
        <p className="text-base text-blue-100 xl:text-center">
          &copy; 2023 Dikoras, Inc. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
