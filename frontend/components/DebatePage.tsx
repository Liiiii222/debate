import { useEffect, useRef, useState } from 'react';

// Import Material Icons CDN in _document.js or index.html for production
// For this code, we use <span className="material-icons">icon_name</span>

interface VideoDebatePageProps {
  userPreferences: any;
}

export default function VideoDebatePage({ userPreferences }: VideoDebatePageProps) {
  // Hide the navbar/header when this component mounts
  useEffect(() => {
    const navbar = document.querySelector('nav');
    if (navbar) navbar.style.display = 'none';
    return () => {
      if (navbar) navbar.style.display = '';
    };
  }, []);

  const [userStream, setUserStream] = useState<MediaStream | null>(null);
  const [isWaiting, setIsWaiting] = useState(true);
  const [isMatched, setIsMatched] = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [showEndCallModal, setShowEndCallModal] = useState(false);
  const [waitingTimer, setWaitingTimer] = useState<NodeJS.Timeout | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [showVideoOverlay, setShowVideoOverlay] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const partnerVideoRef = useRef<HTMLVideoElement>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Start webcam and mic
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setUserStream(stream);
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }
        // Web Audio API for voice detection
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        audioAnalyserRef.current = analyser;
        const dataArray = new Uint8Array(analyser.fftSize);
        const checkVolume = () => {
          analyser.getByteTimeDomainData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const val = (dataArray[i] - 128) / 128;
            sum += val * val;
          }
          const rms = Math.sqrt(sum / dataArray.length);
          setIsSpeaking(rms > 0.04 && micEnabled);
          animationFrameRef.current = requestAnimationFrame(checkVolume);
        };
        checkVolume();
      })
      .catch(err => {
        console.error('Could not access webcam:', err);
      });
    return () => {
      userStream?.getTracks().forEach(track => track.stop());
      if (audioContextRef.current) audioContextRef.current.close();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userVideoRef.current && userStream) {
      userVideoRef.current.srcObject = userStream;
    }
  }, [userStream]);

  // Waiting room timeout logic (repeats every 30s if unmatched)
  useEffect(() => {
    if (isWaiting && !isMatched) {
      if (waitingTimer) clearTimeout(waitingTimer);
      const timer = setTimeout(() => {
        setShowTimeoutModal(true);
      }, 30000); // 30 seconds
      setWaitingTimer(timer);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWaiting, isMatched]);

  // Placeholder for WebSocket/WebRTC logic
  // useEffect(() => {
  //   // Listen for 'partner-matched' event
  //   // setIsMatched(true); setIsWaiting(false);
  // }, []);

  useEffect(() => {
    if (isMatched) {
      setIsWaiting(false);
      setShowTimeoutModal(false);
      if (waitingTimer) clearTimeout(waitingTimer);
      // TODO: Attach real partner stream to partnerVideoRef.current.srcObject
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMatched]);

  // Mic/camera controls
  const handleToggleMic = () => {
    if (!userStream) return;
    userStream.getAudioTracks().forEach(track => {
      track.enabled = !micEnabled;
    });
    setMicEnabled(!micEnabled);
  };
  const handleToggleCam = () => {
    if (!userStream) return;
    userStream.getVideoTracks().forEach(track => {
      track.enabled = !camEnabled;
    });
    setCamEnabled(!camEnabled);
  };
  const handleEndCall = () => {
    setShowEndCallModal(true);
  };
  const confirmEndCall = () => {
    window.location.href = '/';
  };
  const cancelEndCall = () => {
    setShowEndCallModal(false);
  };

  // Modal actions
  const handleKeepWaiting = () => {
    setShowTimeoutModal(false);
    setIsWaiting(true);
    setIsMatched(false);
  };
  const handleDebateAI = () => {
    window.location.href = '/ai-debate';
  };
  const handleInviteFriend = () => {
    window.location.href = '/invite-friend';
  };
  const handleGoHome = () => {
    window.location.href = '/';
  };

  // Placeholder profile image
  const profileImg = '/profile-placeholder.png'; // Replace with real user image

  return (
    <div className="w-screen h-screen min-h-0 min-w-0 bg-neutral-50 flex flex-col" style={{overflow: 'hidden'}}>
      {/* Main grid: left (videos) and right (AI panel) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[40vw_1fr] h-full min-h-0 min-w-0" style={{height: '100vh', width: '100vw'}}>
        {/* Video column */}
        <div className="flex flex-col items-center justify-center h-full min-h-0 min-w-0 gap-6 px-2 md:px-8 bg-white" style={{height: '100vh', width: '40vw', maxWidth: '100vw', marginTop: '-2rem'}}>
          {/* User video with hover overlay */}
          <div
            className="relative group flex-shrink-0"
            style={{ width: '32vw', height: '44vh', maxWidth: '100%', maxHeight: '48vh' }}
            onMouseEnter={() => setShowVideoOverlay(true)}
            onMouseLeave={() => setShowVideoOverlay(false)}
          >
            <video
              ref={userVideoRef}
              autoPlay
              playsInline
              muted
              className={`bg-black w-full h-full object-cover border-2 transition-all duration-200 ${isSpeaking ? 'border-blue-500' : 'border-[#ccc]'} rounded-2xl shadow-lg`}
              style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
            />
            {/* Profile icon top-left */}
            {showVideoOverlay && (
              <div className="absolute top-4 left-4 flex items-center space-x-2 z-10">
                <img
                  src={profileImg}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-white shadow"
                />
              </div>
            )}
            {/* Control buttons bottom center */}
            {showVideoOverlay && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-4 z-10">
                {/* Mic toggle */}
                <button
                  onClick={handleToggleMic}
                  className={`bg-white rounded-full p-2 shadow hover:bg-gray-100 border ${micEnabled ? 'border-blue-400' : 'border-gray-300'}`}
                  title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
                >
                  <span className="material-icons" style={{fontSize: 16, color: micEnabled ? '#2563eb' : '#bdbdbd'}}>
                    {micEnabled ? 'mic' : 'mic_off'}
                  </span>
                </button>
                {/* Camera toggle */}
                <button
                  onClick={handleToggleCam}
                  className={`bg-white rounded-full p-2 shadow hover:bg-gray-100 border ${camEnabled ? 'border-blue-400' : 'border-gray-300'}`}
                  title={camEnabled ? 'Turn off camera' : 'Turn on camera'}
                >
                  <span className="material-icons" style={{fontSize: 16, color: camEnabled ? '#2563eb' : '#bdbdbd'}}>
                    {camEnabled ? 'videocam' : 'videocam_off'}
                  </span>
                </button>
                {/* End call */}
                <button
                  onClick={handleEndCall}
                  className="bg-white hover:bg-gray-100 text-gray-600 rounded-full p-2 shadow border border-gray-300"
                  title="End call"
                >
                  <span className="material-icons" style={{fontSize: 16, color: '#e53935'}}>
                    call_end
                  </span>
                </button>
              </div>
            )}
          </div>
          {/* Partner video */}
          <div
            className="relative flex-shrink-0"
            style={{ width: '32vw', height: '44vh', maxWidth: '100%', maxHeight: '48vh' }}
          >
            {isMatched ? (
              <video
                ref={partnerVideoRef}
                autoPlay
                playsInline
                className="bg-black w-full h-full object-cover border-2 border-[#ccc] rounded-2xl shadow-lg"
                style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
              />
            ) : (
              <div className="rounded-2xl shadow-lg bg-neutral-100 w-full h-full flex items-center justify-center border-2 border-[#ccc] text-gray-500 text-lg object-cover relative"
                   style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-medium text-gray-500">
                  Waiting for a partner...
                </span>
              </div>
            )}
          </div>
        </div>
        {/* AI Assistant Panel with warning banner */}
        <div className="flex flex-col h-full min-h-0 min-w-0 bg-white border-l border-gray-200 rounded-l-2xl" style={{height: '100vh', width: '60vw', maxWidth: '100vw'}}>
          <div className="bg-neutral-100 text-gray-700 text-center py-2 px-4 font-medium border-b border-gray-200 rounded-tl-2xl">
            No swearing or hate speech allowed
          </div>
          <div className="flex-1 p-4 overflow-y-auto flex flex-col">
            <div className="flex-1 flex items-center justify-center text-gray-400">
              AI assistant coming soon...
            </div>
          </div>
        </div>
      </div>
      {/* Modal for timeout */}
      {showTimeoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">No partner found yet</h2>
            <p className="mb-6 text-gray-500">Would you like to keep waiting or try something else?</p>
            <div className="space-y-3">
              <button className="w-full py-2 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-gray-700 font-medium transition" onClick={handleKeepWaiting}>Keep waiting</button>
              <button className="w-full py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-gray-700 font-medium transition" onClick={handleDebateAI}>Debate AI instead</button>
              <button className="w-full py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-gray-700 font-medium transition" onClick={handleInviteFriend}>Invite a friend</button>
              <button className="w-full py-2 rounded-xl bg-white hover:bg-neutral-100 text-gray-500 font-medium border border-gray-200 transition" onClick={handleGoHome}>Go back to home</button>
            </div>
          </div>
        </div>
      )}
      {/* Modal for end call confirmation */}
      {showEndCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">End Debate?</h2>
            <p className="mb-6 text-gray-500">Are you sure you want to end the debate?</p>
            <div className="flex space-x-4 justify-center">
              <button className="px-6 py-2 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-gray-700 font-medium transition" onClick={cancelEndCall}>Cancel</button>
              <button className="px-6 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition" onClick={confirmEndCall}>End Call</button>
            </div>
          </div>
        </div>
      )}
      {/* Responsive stacking for mobile */}
      <style jsx global>{`
        html, body, #__next, #root, .DebatePage {
          height: 100vh !important;
          width: 100vw !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
      `}</style>
      <style jsx>{`
        @media (max-width: 767px) {
          .grid-cols-1.md\:grid-cols-\[40vw_1fr\] {
            grid-template-columns: 1fr !important;
          }
          .flex-col.items-center.justify-center.h-full {
            flex-direction: column !important;
            align-items: stretch !important;
            padding: 0 !important;
          }
          .relative.group.flex-shrink-0, .relative.flex-shrink-0 {
            width: 100vw !important;
            max-width: 100vw !important;
            height: 40vh !important;
            max-height: 220px !important;
            margin-bottom: 1.5rem !important;
          }
          .flex.flex-col.h-full.min-h-0.min-w-0.bg-white.border-l.border-gray-200.rounded-l-2xl {
            width: 100vw !important;
            min-width: 0 !important;
            height: auto !important;
            border-left: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
} 