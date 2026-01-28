import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Save, AlertCircle, CheckCircle, Loader2, RefreshCw, Shield, Clock, Timer } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL;

const PageTimeoutSettings = () => {
  const [pageTimeout, setPageTimeout] = useState(null);
  const [formData, setFormData] = useState({ page_time: '', cofrom_time: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');

  // Fetch current timeout setting
  useEffect(() => {
    fetchTimeout();
  }, []);

  const fetchTimeout = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/page-timeouts`);
      const latest = res.data[0];
      setPageTimeout(latest);
      setFormData({
        page_time: latest?.page_time || '',
        cofrom_time: latest?.cofrom_time || ''
      });
      setIsDirty(false);
    } catch (err) {
      console.error('Error fetching timeout:', err);
      showMessage('Failed to load timeout settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show message with auto-dismiss
  const showMessage = (text, type, duration = 5000) => {
    setMessage({ text, type });
    if (duration > 0) {
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, duration);
    }
  };

  // Handle input changes with validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseInt(value);
    
    // Validate maximum value
    if (numValue > 7200) {
      showMessage('Timeout cannot exceed 2 hours (7200 seconds)', 'warning');
      return;
    }
    
    if (numValue < 0) {
      showMessage('Timeout cannot be negative', 'warning');
      return;
    }
    
    const newFormData = { 
      ...formData, 
      [name]: numValue >= 0 ? numValue : ''
    };
    
    setFormData(newFormData);
    
    // Auto-adjust confirm time if it exceeds page time
    if (name === 'page_time' && newFormData.cofrom_time > numValue) {
      setTimeout(() => {
        setFormData(prev => ({ ...prev, cofrom_time: numValue }));
      }, 100);
    }
    
    if (!isDirty) {
      setIsDirty(true);
    }
  };

  // Format seconds to readable time
  const formatTime = (seconds) => {
    if (seconds < 60) {
      return `${seconds} seconds`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 
        ? `${minutes}m ${remainingSeconds}s` 
        : `${minutes} minutes`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 
        ? `${hours}h ${minutes}m` 
        : `${hours} hour${hours > 1 ? 's' : ''}`;
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const { page_time, cofrom_time } = formData;
    
    if (!page_time || !cofrom_time) {
      showMessage('Please fill in all fields', 'warning');
      return false;
    }
    
    if (page_time < 30 || cofrom_time < 10) {
      showMessage('Minimum page timeout is 30 seconds, confirm timeout is 10 seconds', 'warning');
      return false;
    }
    
    if (cofrom_time > page_time) {
      showMessage('Confirm timeout must be less than page timeout', 'warning');
      return false;
    }
    
    if (page_time - cofrom_time < 10) {
      showMessage('Warning period should be at least 10 seconds before timeout', 'warning');
      return false;
    }
    
    return true;
  };

  // Submit form to update
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!pageTimeout || !validateForm()) return;
    
    try {
      setSaving(true);
      await axios.put(`${API_URL}/api/page-timeouts/${pageTimeout.id}`, formData);
      setIsDirty(false);
      showMessage('Timeout settings updated successfully!', 'success');
      
      // Refresh data
      await fetchTimeout();
    } catch (err) {
      console.error('Update failed:', err);
      showMessage(
        err.response?.data?.message || 'Failed to update timeout settings',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  // Reset form to original values
  const handleReset = () => {
    if (pageTimeout) {
      setFormData({
        page_time: pageTimeout.page_time || '',
        cofrom_time: pageTimeout.cofrom_time || ''
      });
      setIsDirty(false);
      showMessage('Changes discarded', 'info');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8">
        <div className="relative animate-pulse">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center">
            <Clock className="w-10 h-10 text-blue-500 animate-spin-slow" />
          </div>
        </div>
        <div className="mt-6 space-y-2 text-center">
          <p className="text-lg font-medium text-gray-700">Loading settings</p>
          <p className="text-sm text-gray-500">Fetching your current timeout configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with Stats */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Session Timeout Settings</h1>
                <p className="text-gray-500 mt-1">Configure automatic session expiration for security</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Settings Summary */}
        {pageTimeout && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Page Timeout</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatTime(pageTimeout.page_time)}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Session will automatically expire after this duration
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Timer className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Warning Period</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatTime(pageTimeout.cofrom_time)}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Users will be warned before session expires
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-all ${activeTab === 'edit'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              Edit Settings
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-all ${activeTab === 'preview'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              Preview
            </button>
          </div>
        </div>

        <div className="p-8">
          {activeTab === 'edit' ? (
            <form onSubmit={handleSubmit}>
              <div className="space-y-8">
                {/* Page Timeout Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Page Timeout</h3>
                      <p className="text-gray-600 mt-1">Set the maximum session duration</p>
                    </div>
                    <div className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                      Required
                    </div>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="range"
                      name="page_time"
                      min="30"
                      max="7200"
                      step="30"
                      value={formData.page_time || 0}
                      onChange={handleChange}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>30s</span>
                      <span>1 hour</span>
                      <span>2 hours</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        name="page_time"
                        value={formData.page_time}
                        onChange={handleChange}
                        min="30"
                        max="7200"
                        className="w-32 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Seconds"
                      />
                      <span className="text-gray-500">seconds</span>
                      <div className="ml-auto text-lg font-semibold text-gray-900">
                        {formatTime(formData.page_time)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Recommended: 15-30 minutes for security-sensitive applications
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 bg-white text-sm text-gray-500">Warning Settings</span>
                  </div>
                </div>

                {/* Confirm Timeout Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Warning Period</h3>
                      <p className="text-gray-600 mt-1">Notify users before session expires</p>
                    </div>
                    <div className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
                      Recommended
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="range"
                      name="cofrom_time"
                      min="10"
                      max={formData.page_time || 7200}
                      step="10"
                      value={formData.cofrom_time || 0}
                      onChange={handleChange}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>10s</span>
                      <span>{formatTime(Math.floor((formData.page_time || 7200) / 2))}</span>
                      <span>{formatTime(formData.page_time || 7200)}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        name="cofrom_time"
                        value={formData.cofrom_time}
                        onChange={handleChange}
                        min="10"
                        max={formData.page_time || 7200}
                        className="w-32 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Seconds"
                      />
                      <span className="text-gray-500">seconds</span>
                      <div className="ml-auto text-lg font-semibold text-gray-900">
                        {formatTime(formData.cofrom_time)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Users will be warned {formatTime(formData.cofrom_time)} before session expires
                    </p>
                  </div>
                </div>

                {/* Time Summary */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-3">Session Timeline</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Session starts</span>
                      <div className="w-32 h-2 bg-gray-300 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: '0%' }}></div>
                      </div>
                      <span className="text-sm font-medium">0s</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Warning appears</span>
                      <div className="w-32 h-2 bg-gray-300 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500" 
                          style={{ 
                            width: `${((formData.page_time - formData.cofrom_time) / formData.page_time) * 100 || 0}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {formatTime(formData.page_time - formData.cofrom_time)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Session expires</span>
                      <div className="w-32 h-2 bg-gray-300 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: '100%' }}></div>
                      </div>
                      <span className="text-sm font-medium">{formatTime(formData.page_time)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={!isDirty || saving}
                    className="flex items-center gap-2 px-6 py-3 text-gray-700 font-medium rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Discard Changes
                  </button>

                  <div className="flex items-center gap-4">
                    <span className={`text-sm ${isDirty ? 'text-amber-600' : 'text-gray-400'}`}>
                      {isDirty ? 'You have unsaved changes' : 'All changes saved'}
                    </span>
                    <button
                      type="submit"
                      disabled={!isDirty || saving}
                      className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview Experience</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                    <div>
                      <p className="font-medium text-gray-900">User Session</p>
                      <p className="text-sm text-gray-600">Active for {formatTime(formData.page_time - formData.cofrom_time)}</p>
                    </div>
                    <div className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      Active
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div>
                      <p className="font-medium text-gray-900">Warning Notification</p>
                      <p className="text-sm text-gray-600">
                        Appears {formatTime(formData.cofrom_time)} before timeout
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
                      Warning
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
                    <div>
                      <p className="font-medium text-gray-900">Session Expired</p>
                      <p className="text-sm text-gray-600">
                        Auto-logout after {formatTime(formData.page_time)} of inactivity
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                      Expired
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Message */}
        {message.text && (
          <div className={`px-8 py-4 border-t ${message.type === 'success'
            ? 'bg-green-50 border-green-200'
            : message.type === 'error'
              ? 'bg-red-50 border-red-200'
              : 'bg-blue-50 border-blue-200'
            }`}>
            <div className="flex items-center gap-3">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <p className={`font-medium ${message.type === 'success'
                ? 'text-green-800'
                : message.type === 'error'
                  ? 'text-red-800'
                  : 'text-blue-800'
                }`}>
                {message.text}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Help & Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-600" />
            Security Guidelines
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-sm text-gray-600">For sensitive data, use 15-30 minute timeouts</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-sm text-gray-600">Warning period should be 10-20% of total timeout</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-sm text-gray-600">Consider user workflow when setting timeouts</span>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            User Experience
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-sm text-gray-600">Warning gives users time to save work</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-sm text-gray-600">Too short: Frequent interruptions</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-sm text-gray-600">Too long: Security risks</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PageTimeoutSettings;

// Add custom animation to CSS or use inline style
const styles = `
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}
`;
// Add this to your global CSS or as a style tag