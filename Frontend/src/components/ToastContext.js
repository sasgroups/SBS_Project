
// context/ToastContext.js
import React, { createContext, useContext } from 'react';

const ToastContext = createContext({
  showToast: () => {
    console.warn('ToastContext not implemented');
  }
});

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export default ToastContext;