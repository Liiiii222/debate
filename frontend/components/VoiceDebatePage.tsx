import { useEffect, useRef, useState } from 'react';
import MediaBox from './MediaBox';
import VoiceProfileComponent from './VoiceProfileComponent';
import MediaControls from './MediaControls';
import AiPanel from './AiPanel';
import FullScreenDebateLayout from './FullScreenDebateLayout';
import ToolsBar from './ToolsBar';
import CountdownTimer from './CountdownTimer';

interface VoiceDebatePageProps {
  userPreferences: any;
}

export default function VoiceDebatePage({ userPreferences }: VoiceDebatePageProps) {
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
  const [showVideoOverlay, setShowVideoOverlay] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [showTimerBar, setShowTimerBar] = useState(false);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const sendersRef = useRef<{ audio?: RTCRtpSender }>({});

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: false, audio: true })
      .then(stream => {
        setUserStream(stream);
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
        console.error('Could not access microphone:', err);
      });
    return () => {
      userStream?.getTracks().forEach(track => track.stop());
      if (audioContextRef.current) audioContextRef.current.close();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        const newStream = new MediaStream([audioTrack]);
        setUserStream(newStream);
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
        setUserStream(null);
        // WebRTC: remove track
        if (peerConnectionRef.current && sendersRef.current.audio) {
          peerConnectionRef.current.removeTrack(sendersRef.current.audio);
          sendersRef.current.audio = undefined;
        }
      }
    }
    setMicEnabled(!micEnabled);
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
        <VoiceProfileComponent profileImage={profileImg} isSpeaking={isSpeaking} />
        {showVideoOverlay && (
          <MediaControls
            micEnabled={micEnabled}
            onToggleMic={handleToggleMic}
            onEndCall={handleEndCall}
            showCameraToggle={false}
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
          <VoiceProfileComponent profileImage="/partner-placeholder.png" isSpeaking={false} />
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