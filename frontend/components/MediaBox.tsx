import React from 'react';

interface MediaBoxProps {
  children: React.ReactNode;
  isSpeaking: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export default function MediaBox({ children, isSpeaking, onMouseEnter, onMouseLeave }: MediaBoxProps) {
  return (
    <div
      className="relative group flex-shrink-0"
      style={{ width: '32vw', height: '44vh', maxWidth: '100%', maxHeight: '48vh' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={`w-full h-full border-2 transition-all duration-200 ${isSpeaking ? 'border-blue-500' : 'border-[#ccc]'} rounded-2xl shadow-lg overflow-hidden`} style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
        {children}
      </div>
    </div>
  );
} 