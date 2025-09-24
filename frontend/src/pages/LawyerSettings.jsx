import React, { useEffect, useState } from 'react';
import { getLawyerSettings, updateLawyerSettings } from '../services/api';

export default function LawyerSettings() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({ email: '', phone: '', emailNotifications: false, smsNotifications: false, marketingEmails: false });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const data = await getLawyerSettings();
        setSettings(data);
        setForm({
          email: data.email || '',
          phone: data.phone || '',
          emailNotifications: !!data.emailNotifications,
          smsNotifications: !!data.smsNotifications,
          marketingEmails: !!data.marketingEmails,
        });
      } catch (err) {
        // Handle error
      }
    }
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    try {
      await updateLawyerSettings(form);
      // Optionally show success message
    } catch (err) {
      // Handle error
    }
  };

  const handleCancel = () => {
    if (settings) {
      setForm({
        email: settings.email || '',
        phone: settings.phone || '',
        emailNotifications: !!settings.emailNotifications,
        smsNotifications: !!settings.smsNotifications,
        marketingEmails: !!settings.marketingEmails,
      });
    }
  };

  if (!settings) {
    return <div className="text-blue-700">Loading settings...</div>;
  }

  return (
    <>
      <h1 className="text-3xl font-extrabold text-blue-900 mb-6">Settings</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-bold text-blue-900 text-lg mb-4">Account Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-blue-700 text-sm font-medium mb-2">Email Address</label>
              <input 
                type="email" 
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-blue-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-blue-700 text-sm font-medium mb-2">Phone Number</label>
              <input 
                type="tel" 
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full border border-blue-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <h3 className="font-bold text-green-900 text-lg mb-4">Notification Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" name="emailNotifications" className="rounded text-blue-600" checked={form.emailNotifications} onChange={handleChange} />
              <span className="ml-2 text-blue-700">Email Notifications</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" name="smsNotifications" className="rounded text-blue-600" checked={form.smsNotifications} onChange={handleChange} />
              <span className="ml-2 text-blue-700">SMS Notifications</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" name="marketingEmails" className="rounded text-blue-600" checked={form.marketingEmails} onChange={handleChange} />
              <span className="ml-2 text-blue-700">Marketing Emails</span>
            </label>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 mr-4" onClick={handleSave}>
          Save Changes
        </button>
        <button className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </>
  );
}