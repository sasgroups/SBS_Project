import React from "react";
import { designTokens } from "../../styles/designTokens";

const BackgroundElements = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div 
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full animate-float-slow"
        style={{
          background: `radial-gradient(circle, ${designTokens.primary[700]}20 0%, transparent 70%)`,
          animation: 'float 20s ease-in-out infinite',
        }}
      />
      <div 
        className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full animate-float-reverse"
        style={{
          background: `radial-gradient(circle, ${designTokens.primary[800]}15 0%, transparent 70%)`,
          animation: 'float 25s ease-in-out infinite reverse',
        }}
      />
      <div 
        className="absolute top-2/3 left-1/3 w-48 h-48 rounded-full animate-float-medium"
        style={{
          background: `radial-gradient(circle, ${designTokens.success[500]}10 0%, transparent 70%)`,
          animation: 'float 15s ease-in-out infinite',
        }}
      />
    </div>
  );
};

export default BackgroundElements;