import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const PageTimeoutSettings = () => {
  const [pageTimeout, setPageTimeout] = useState(null);
  const [formData, setFormData] = useState({ page_time: '', cofrom_time: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Fetch current timeout setting
  useEffect(() => {
    const fetchTimeout = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/page-timeouts`);
        const latest = res.data[0]; // Assuming latest is first
        setPageTimeout(latest);
        setFormData({
          page_time: latest?.page_time || '',
          cofrom_time: latest?.cofrom_time || ''
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching timeout:', err);
        setLoading(false);
      }
    };
    fetchTimeout();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit form to update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pageTimeout) return;
    try {
      await axios.put(`${API_URL}/api/page-timeouts/${pageTimeout.id}`, formData);
      setMessage('Timeout updated successfully.');
    } catch (err) {
      console.error('Update failed:', err);
      setMessage('Failed to update timeout.');
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="max-w-xl mx-auto p-4 bg-white shadow rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Page Timeout Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-gray-600">Page Time (seconds)</label>
          <input
            type="number"
            name="page_time"
            value={formData.page_time}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-gray-600">Confirm  Time (seconds)</label>
          <input
            type="number"
            name="cofrom_time"
            value={formData.cofrom_time}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Update Timeout
        </button>
        {message && <p className="text-green-600 mt-2">{message}</p>}
      </form>
    </div>
  );
};

export default PageTimeoutSettings;
