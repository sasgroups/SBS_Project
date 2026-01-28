import React from "react";
import { designTokens } from "../../styles/designTokens";

const LoadingOverlay = ({ loadingFlight }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl">
      <div 
        className="p-12 rounded-2xl max-w-md w-11/12 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${designTokens.glass.light}, rgba(255, 255, 255, 0.48))`,
          backdropFilter: designTokens.glass.blur,
          border: `1px solid ${designTokens.glass.border}`,
          boxShadow: `0 20px 40px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
        }}
      >
        <div className="absolute inset-0 -skew-y-12 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
            {loadingFlight.logo ? (
              <img 
                src={loadingFlight.logo} 
                alt={loadingFlight.name}
                className="h-24 w-auto relative"
              />
            ) : (
              <div className="p-6 rounded-2xl relative"
                style={{
                  background: `linear-gradient(135deg, ${designTokens.primary[500]}, ${designTokens.primary[700]})`,
                  boxShadow: `0 10px 30px ${designTokens.primary[500]}40`,
                }}
              >
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2" style={{ color: designTokens.neutral[900] }}>
              {loadingFlight.name}
            </h2>
            {loadingFlight.flight && (
              <p className="text-lg" style={{ color: designTokens.neutral[700] }}>
                Flight {loadingFlight.flight}
              </p>
            )}
            <p className="mt-2" style={{ color: designTokens.neutral[600] }}>
              Processing your baggage information...
            </p>
          </div>
          
          <div className="w-72 h-2 rounded-full overflow-hidden bg-gray-200/50">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 animate-progress"
              style={{
                animation: 'progress 1.5s ease-in-out infinite',
              }}
            />
          </div>
          
          <div className="flex items-center gap-3" style={{ color: designTokens.neutral[600] }}>
            <svg className="w-5 h-5 animate-spin" style={{ color: designTokens.primary[500] }} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium">Preparing your check-in experience</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;