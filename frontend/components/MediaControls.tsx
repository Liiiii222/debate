import React from 'react';

interface MediaControlsProps {
  micEnabled: boolean;
  camEnabled?: boolean;
  onToggleMic: () => void;
  onToggleCam?: () => void;
  onEndCall: () => void;
  showCameraToggle?: boolean;
}

export default function MediaControls({ 
  micEnabled, 
  camEnabled = true, 
  onToggleMic, 
  onToggleCam, 
  onEndCall, 
  showCameraToggle = false 
}: MediaControlsProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-4 z-10">
      {/* Mic toggle */}
      <button
        onClick={onToggleMic}
        className={`bg-white rounded-full p-2 shadow hover:bg-gray-100 border ${micEnabled ? 'border-blue-400' : 'border-gray-300'}`}
        title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
      >
        <span className="material-icons" style={{fontSize: 16, color: micEnabled ? '#2563eb' : '#bdbdbd'}}>
          {micEnabled ? 'mic' : 'mic_off'}
        </span>
      </button>
      
      {/* Camera toggle - only show in VideoDebatePage */}
      {showCameraToggle && onToggleCam && (
        <button
          onClick={onToggleCam}
          className={`bg-white rounded-full p-2 shadow hover:bg-gray-100 border ${camEnabled ? 'border-blue-400' : 'border-gray-300'}`}
          title={camEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          <span className="material-icons" style={{fontSize: 16, color: camEnabled ? '#2563eb' : '#bdbdbd'}}>
            {camEnabled ? 'videocam' : 'videocam_off'}
          </span>
        </button>
      )}
      
      {/* End call */}
      <button
        onClick={onEndCall}
        className="bg-white hover:bg-gray-100 text-gray-600 rounded-full p-2 shadow border border-gray-300"
        title="End call"
      >
        <span className="material-icons" style={{fontSize: 16, color: '#e53935'}}>
          call_end
        </span>
      </button>
    </div>
  );
} 