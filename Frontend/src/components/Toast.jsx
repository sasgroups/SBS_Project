// components/Toast.jsx
import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';

const Toast = ({ type = 'info', title = '', message = '', duration = 4000, onClose, action }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Set up progress bar animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - (100 / (duration / 50));
      });
    }, 50);

    // Auto-close after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 300);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  const handleAction = () => {
    if (action && action.onClick) {
      action.onClick();
    }
    handleClose();
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
      style={{
        top: '1rem',
        right: '1rem',
        minWidth: '350px',
        maxWidth: '450px',
      }}
    >
      <div
        className={`rounded-lg border shadow-lg overflow-hidden ${colors[type] || colors.info}`}
      >
        {/* Progress Bar */}
        <div className="h-1 w-full bg-gray-200">
          <div 
            className={`h-full transition-all duration-50 ${
              type === 'success' ? 'bg-green-500' :
              type === 'error' ? 'bg-red-500' :
              type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 ${iconColors[type] || iconColors.info}`}>
                {icons[type] || icons.info}
              </div>
              <div className="flex-1">
                {title && (
                  <h4 className="font-semibold text-sm mb-1">{title}</h4>
                )}
                <p className="text-sm">{message}</p>
                
                {/* Action Button */}
                {action && (
                  <div className="mt-3">
                    <button
                      onClick={handleAction}
                      className={`px-3 py-1.5 rounded text-sm font-medium ${
                        type === 'warning' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                        type === 'error' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                        type === 'success' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                        'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {action.label || 'Confirm'}
                    </button>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;