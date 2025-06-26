import { useEffect, useRef, useState } from 'react';
import MediaBox from './MediaBox';
import LiveVideoComponent from './LiveVideoComponent';
import MediaControls from './MediaControls';
import AiPanel from './AiPanel';
import FullScreenDebateLayout from './FullScreenDebateLayout';
import ToolsBar from './ToolsBar';
import CountdownTimer from './CountdownTimer';

interface VideoDebatePageProps {
  userPreferences: any;
}

export default function VideoDebatePage({ userPreferences }: VideoDebatePageProps) {
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
  const [_showTimerBar, _setShowTimerBar] = useState(false);
  const setShowTimerBar = (v: boolean) => {
    console.log('setShowTimerBar called with:', v, 'at', new Error().stack);
    _setShowTimerBar(v);
  };
  const showTimerBar = _showTimerBar;
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const sendersRef = useRef<{ audio?: RTCRtpSender; video?: RTCRtpSender }>({});

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setUserStream(stream);
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }
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

  useEffect(() => {
    if (isWaiting && !isMatched) {
      if (waitingTimer) clearTimeout(waitingTimer);
      const timer = setTimeout(() => {
        setShowTimeoutModal(true);
      }, 30000);
      setWaitingTimer(timer);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWaiting, isMatched]);

  useEffect(() => {
    if (isMatched) {
      setIsWaiting(false);
      setShowTimeoutModal(false);
      if (waitingTimer) clearTimeout(waitingTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMatched]);

  const handleToggleMic = async () => {
    if (!micEnabled) {
      // Re-enable mic
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioTrack = audioStream.getAudioTracks()[0];
        let newStream;
        if (userStream) {
          newStream = new MediaStream([...userStream.getVideoTracks(), audioTrack]);
        } else {
          newStream = new MediaStream([audioTrack]);
        }
        setUserStream(newStream);
        if (userVideoRef.current) userVideoRef.current.srcObject = newStream;
        // WebRTC: add track
        if (peerConnectionRef.current) {
          sendersRef.current.audio = peerConnectionRef.current.addTrack(audioTrack, newStream);
        }
      } catch (err) {
        console.error('Could not re-enable microphone:', err);
      }
    } else {
      // Disable mic
      if (userStream) {
        userStream.getAudioTracks().forEach(track => track.stop());
        const videoTracks = userStream.getVideoTracks();
        const newStream = new MediaStream(videoTracks);
        setUserStream(videoTracks.length > 0 ? newStream : null);
        if (userVideoRef.current) userVideoRef.current.srcObject = videoTracks.length > 0 ? newStream : null;
        // WebRTC: remove track
        if (peerConnectionRef.current && sendersRef.current.audio) {
          peerConnectionRef.current.removeTrack(sendersRef.current.audio);
          sendersRef.current.audio = undefined;
        }
      }
    }
    setMicEnabled(!micEnabled);
  };

  const handleToggleCam = async () => {
    if (!camEnabled) {
      // Re-enable camera
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = videoStream.getVideoTracks()[0];
        let newStream;
        if (userStream) {
          newStream = new MediaStream([videoTrack, ...userStream.getAudioTracks()]);
        } else {
          newStream = new MediaStream([videoTrack]);
        }
        setUserStream(newStream);
        if (userVideoRef.current) userVideoRef.current.srcObject = newStream;
        // WebRTC: add track
        if (peerConnectionRef.current) {
          sendersRef.current.video = peerConnectionRef.current.addTrack(videoTrack, newStream);
        }
      } catch (err) {
        console.error('Could not re-enable camera:', err);
      }
    } else {
      // Disable camera
      if (userStream) {
        userStream.getVideoTracks().forEach(track => track.stop());
        const audioTracks = userStream.getAudioTracks();
        const newStream = new MediaStream(audioTracks);
        setUserStream(audioTracks.length > 0 ? newStream : null);
        if (userVideoRef.current) userVideoRef.current.srcObject = audioTracks.length > 0 ? newStream : null;
        // WebRTC: remove track
        if (peerConnectionRef.current && sendersRef.current.video) {
          peerConnectionRef.current.removeTrack(sendersRef.current.video);
          sendersRef.current.video = undefined;
        }
      }
    }
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

  const profileImg = '/profile-placeholder.png';

  // Media space content
  const mediaContent = (
    <div className="flex flex-col items-center justify-center h-full min-h-0 min-w-0 gap-6 px-2 md:px-8 bg-white" style={{height: '100vh', width: '40vw', maxWidth: '100vw', marginTop: '-2rem'}}>
      <MediaBox
        isSpeaking={isSpeaking}
        onMouseEnter={() => setShowVideoOverlay(true)}
        onMouseLeave={() => setShowVideoOverlay(false)}
      >
        <LiveVideoComponent stream={userStream} isSpeaking={isSpeaking} ref={userVideoRef} />
        {showVideoOverlay && (
          <div className="absolute top-4 left-4 flex items-center space-x-2 z-10">
            <img
              src={profileImg}
              alt="Profile"
              className="w-10 h-10 rounded-full border-2 border-white shadow"
            />
          </div>
        )}
        {showVideoOverlay && (
          <MediaControls
            micEnabled={micEnabled}
            camEnabled={camEnabled}
            onToggleMic={handleToggleMic}
            onToggleCam={handleToggleCam}
            onEndCall={handleEndCall}
            showCameraToggle={true}
          />
        )}
        {/* End Call Modal */}
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
      </MediaBox>
      <MediaBox isSpeaking={false}>
        {isMatched ? (
          <LiveVideoComponent stream={null} isSpeaking={false} ref={partnerVideoRef} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-100 rounded-2xl">
            <span className="text-lg font-medium text-gray-500">
              Waiting for a partner...
            </span>
          </div>
        )}
      </MediaBox>
    </div>
  );

  // AI panel content
  const aiPanelContent = <AiPanel />;

  return (
    <>
      <CountdownTimer
        showBar={showTimerBar}
        onStopBar={() => setShowTimerBar(false)}
        onTimerSet={() => setShowTimerBar(true)}
      />
      <div style={{ paddingTop: showTimerBar ? 72 : 0 }}>
        <FullScreenDebateLayout mediaContent={mediaContent} aiPanelContent={aiPanelContent} />
        <ToolsBar showTimerBar={showTimerBar} setShowTimerBar={setShowTimerBar} />
      </div>
    </>
  );
} 