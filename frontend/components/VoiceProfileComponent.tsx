import React from 'react';

interface VoiceProfileComponentProps {
  profileImage: string;
  isSpeaking?: boolean;
}

export default function VoiceProfileComponent({ profileImage, isSpeaking }: VoiceProfileComponentProps) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl relative overflow-hidden">
      {/* Blurred background based on profile picture */}
      <div 
        className="absolute inset-0 opacity-20 blur-sm"
        style={{
          backgroundImage: `url(${profileImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Profile picture centered */}
      <div className="relative z-10">
        <img
          src={profileImage}
          alt="Profile"
          className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
        />
      </div>
    </div>
  );
} 