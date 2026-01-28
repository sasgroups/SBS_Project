// App.js
import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import AdPlayer from './pages/AdPlayerPage';
import HomePage from './pages/HomePage';
import BaggageCheckPage from './pages/BaggageCheckPage';
import Maintenance from './pages/MaintenancePage';
import LoginPage from './pages/LoginPage';
import Toast from './components/Toast';
import ToastContext from './components/ToastContext';

function App() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((toastData) => {
    const id = Date.now();
    const toast = {
      id,
      type: toastData.type || 'info',
      title: toastData.title || '',
      message: toastData.message || '',
      duration: toastData.duration || 4000,
      action: toastData.action, // Include action if provided
    };
    
    setToasts(prev => [...prev, toast]);
    
    // Auto-remove after duration (only if no action)
    if (!toastData.action) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Router>
        {/* Toast Container */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              type={toast.type}
              title={toast.title}
              message={toast.message}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
              action={toast.action}
            />
          ))}
        </div>

        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/ad_player" element={<AdPlayer />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/baggageCheckPage" element={<BaggageCheckPage />} />
          <Route path="/maintenance" element={<Maintenance />} />
        </Routes>
      </Router>
    </ToastContext.Provider>
  );
}

export default App;