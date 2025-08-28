import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const services = [
	{
		title: 'Business Law',
		description:
			'Contracts, Incorporation, Compliance, Mergers & Acquisitions, Intellectual Property.',
		icon: (
			<svg
				className="h-8 w-8 text-white"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
					d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m2-0H9m2 0v-4a1 1 0 00-1-1h-1a1 1 0 00-1 1v4h4v-2a1 1 0 011-1h2a1 1 0 011 1v2h4z"
				/>
			</svg>
		),
	},
	{
		title: 'Family Law',
		description:
			'Divorce, Custody, Adoption, Child Support, Domestic Violence.',
		icon: (
			<svg
				className="h-8 w-8 text-white"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
					d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
				/>
			</svg>
		),
	},
	{
		title: 'Criminal Defense',
		description:
			'DUI, Theft, Assault, Drug Crimes, White Collar Crimes.',
		icon: (
			<svg
				className="h-8 w-8 text-white"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
					d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
				/>
			</svg>
		),
	},
	{
		title: 'Real Estate',
		description:
			'Transactions, Disputes, Landlord-Tenant, Zoning, Foreclosure.',
		icon: (
			<svg
				className="h-8 w-8 text-white"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
					d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
				/>
			</svg>
		),
	},
	{
		title: 'Immigration',
		description:
			'Visas, Green Cards, Citizenship, Deportation Defense, Asylum.',
		icon: (
			<svg
				className="h-8 w-8 text-white"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
					d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		),
	},
	{
		title: 'Personal Injury',
		description:
			'Accidents, Medical Malpractice, Workers Comp, Product Liability.',
		icon: (
			<svg
				className="h-8 w-8 text-white"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
					d="M13 10V3L4 14h7v7l9-11h-7z"
				/>
			</svg>
		),
	},
];

const LegalServices = () => (
	<>
		<Navbar />
		<div className="min-h-screen bg-gradient-to-br from-blue-200 via-blue-100 to-blue-300 py-12 px-4 mt-16 backdrop-blur-lg">
			<div className="max-w-4xl mx-auto text-center bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-blue-100 p-8">
			<h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent mb-4 drop-shadow-lg">
					Our Legal Services
				</h1>
			<p className="max-w-2xl mx-auto text-lg text-blue-700 mb-8">
					Dikoras offers comprehensive legal support across all major practice
					areas. Whether you are a business owner, individual, or family, our
					network of lawyers is ready to help.
				</p>
			</div>
			<div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
				{services.map((service) => (
								<div
									key={service.title}
									className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-lg border border-blue-200 p-8 flex flex-col items-center"
								>
									<span className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-blue-500 to-blue-400 rounded-xl shadow-xl mb-4">
										{service.icon}
									</span>
									<h2 className="text-xl font-bold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent mb-2 drop-shadow-lg">
										{service.title}
									</h2>
									<p className="text-blue-700 text-center">
										{service.description}
									</p>
									<a
										href="#"
										className="mt-4 font-medium text-blue-600 hover:text-blue-500 transition-all duration-200 hover:underline"
									>
										View details
									</a>
								</div>
				))}
			</div>
					<div className="max-w-3xl mx-auto mt-12 text-center bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-blue-100 p-8">
						<h3 className="text-xl font-bold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent mb-2 drop-shadow-lg">
							Why Choose Dikoras?
						</h3>
						<ul className="list-disc list-inside text-blue-700 text-lg space-y-2">
							<li>Verified lawyers with expertise in your area of need.</li>
							<li>Transparent pricing and clear communication.</li>
							<li>Secure platform for collaboration and billing.</li>
							<li>Support for both individuals and businesses.</li>
						</ul>
					</div>
					<div className="max-w-2xl mx-auto mt-12 text-center bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-blue-100 p-8">
						<h3 className="text-lg font-semibold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent mb-2 drop-shadow-lg">
							Need legal help?
						</h3>
						<p className="text-blue-700 mb-4">
							Sign up and get matched with the right lawyer for your case.
						</p>
						<a
							href="/register"
							className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-400 text-white font-bold rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-500 transition-all duration-200"
						>
							Get Started
						</a>
					</div>
		</div>
		<Footer />
	</>
);

export default LegalServices;
