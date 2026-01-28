import React from "react";

const ErrorAlert = ({ error, onClose }) => {
  return (
    <div className="mb-6 animate-fadeIn">
      <div className="relative overflow-hidden rounded-xl border border-red-500/30 bg-gradient-to-br from-red-900/20 via-red-900/10 to-transparent p-4">
        {/* Animated background pulse */}
        <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
        
        {/* Glow effect */}
        <div className="absolute -top-10 -left-10 w-20 h-20 bg-red-500/10 rounded-full blur-2xl"></div>
        
        <div className="relative flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-red-200">Scan Issue Detected</p>
              <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-300 rounded-full border border-red-500/30">
                Action Required
              </span>
            </div>
            <p className="text-sm text-red-300/90 mt-1">{error}</p>
          </div>
          
          <button
            onClick={onClose}
            className="ml-2 p-2 rounded-lg hover:bg-red-500/20 transition-all duration-200 group relative"
            aria-label="Close error message"
          >
            <div className="absolute inset-0 bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <svg className="w-4 h-4 text-red-300 group-hover:text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorAlert;