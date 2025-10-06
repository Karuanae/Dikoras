import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const steps = [
	{
		title: 'Submit Your Case',
		description:
			'Describe your legal issue and provide relevant details through our secure platform. The more information you provide, the better we can match you.',
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
		title: 'Get Matched',
		description:
			'Our algorithm connects you with qualified lawyers specializing in your specific legal needs. You’ll be matched with professionals who have relevant experience.',
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
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				/>
			</svg>
		),
	},
	{
		title: 'Receive Responses',
		description:
			'Review proposals, credentials, and fees from multiple qualified attorneys. Compare and choose the best fit for your case.',
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
					d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
				/>
			</svg>
		),
	},
	{
		title: 'Secure Collaboration',
		description:
			'Work with your chosen lawyer through our secure platform with built-in billing and communication tools. Track progress and communicate easily.',
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
					d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
				/>
			</svg>
		),
	},
];

const HowItWorks = () => (
	<>
		<Navbar />
		<div className="min-h-screen bg-gradient-to-br from-blue-200 via-blue-100 to-blue-300 py-12 px-4 mt-16 backdrop-blur-lg">
			<div className="max-w-4xl mx-auto text-center bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-blue-100 p-8">
			<h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent mb-4 drop-shadow-lg">
					How Dikoras Works
				</h1>
			<p className="max-w-2xl mx-auto text-lg text-blue-700 mb-8">
					Dikoras makes finding legal help simple, transparent, and secure.
					Here’s how you can connect with the right legal professional in just
					a few steps.
				</p>
			</div>
			<div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
				{steps.map((step, idx) => (
								<div
									key={step.title}
									className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-lg border border-blue-200 p-8 flex flex-col items-center"
								>
									<span className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-blue-500 to-blue-400 rounded-xl shadow-xl mb-4">
										{step.icon}
									</span>
									<h2 className="text-2xl font-bold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent mb-2 drop-shadow-lg">
										{`Step ${idx + 1}: ${step.title}`}
									</h2>
									<p className="text-blue-700">{step.description}</p>
								</div>
				))}
			</div>
					<div className="max-w-3xl mx-auto mt-12 text-center bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-blue-100 p-8">
						<h3 className="text-xl font-bold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent mb-2 drop-shadow-lg">
							Why Use Dikoras?
						</h3>
						<ul className="list-disc list-inside text-blue-700 text-lg space-y-2">
							<li>
								Access to a wide network of verified legal professionals across all
								U.S. states.
							</li>
							<li>
								Transparent process with clear communication and secure billing.
							</li>
							<li>
								Ability to compare multiple proposals and select the best lawyer for
								your needs.
							</li>
							<li>
								Support for a variety of legal areas including business, family,
								criminal, real estate, immigration, and personal injury law.
							</li>
						</ul>
					</div>
					<div className="max-w-2xl mx-auto mt-12 text-center bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-blue-100 p-8">
						<h3 className="text-lg font-semibold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent mb-2 drop-shadow-lg">
							Ready to get started?
						</h3>
						<p className="text-blue-700 mb-4">
							Sign up today and take the first step toward resolving your legal
							issue.
						</p>
						<a
							href="/register"
							className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-400 text-white font-bold rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-500 transition-all duration-200"
						>
							Create Account
						</a>
					</div>
		</div>
		<Footer />
	</>
);

export default HowItWorks;
