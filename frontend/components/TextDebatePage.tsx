import { useEffect, useRef, useState } from 'react';
import MediaBox from './MediaBox';
import AiPanel from './AiPanel';
import FullScreenDebateLayout from './FullScreenDebateLayout';
import { io, Socket } from 'socket.io-client';
import ToolsBar from './ToolsBar';

interface TextDebatePageProps {
  userPreferences: any;
}

interface Message {
  id: string;
  sender: 'me' | 'partner';
  text: string;
  timestamp: number;
}

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

export default function TextDebatePage({ userPreferences }: TextDebatePageProps) {
  const [isWaiting, setIsWaiting] = useState(false); // Assume matched for demo
  const [isMatched, setIsMatched] = useState(true); // Assume matched for demo
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [showEndCallModal, setShowEndCallModal] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const chatLogRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const partnerProfileImg = '/partner-placeholder.png';

  // Connect to socket.io server
  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    // Join debate room (roomName/sessionId should come from props or context)
    const roomName = userPreferences?.roomName || 'demo-room';
    const sessionId = userPreferences?.sessionId || 'demo-session';
    socket.emit('join-debate', { roomName, sessionId });

    // Listen for incoming messages
    socket.on('debate-message', (data: { sender: string; text: string; timestamp: number }) => {
      setMessages(msgs => [
        ...msgs,
        {
          id: Math.random().toString(36),
          sender: data.sender === sessionId ? 'me' : 'partner',
          text: data.text,
          timestamp: data.timestamp,
        },
      ]);
    });

    // Listen for partner join/leave (optional)
    socket.on('user-joined', () => setIsMatched(true));
    socket.on('user-left', () => setIsMatched(false));

    return () => {
      socket.disconnect();
    };
  }, [userPreferences]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !socketRef.current) return;
    const sessionId = userPreferences?.sessionId || 'demo-session';
    const roomName = userPreferences?.roomName || 'demo-room';
    const msg = {
      sender: sessionId,
      text: input,
      timestamp: Date.now(),
      roomName,
    };
    socketRef.current.emit('debate-message', msg);
    setMessages(msgs => [
      ...msgs,
      { id: Math.random().toString(36), sender: 'me', text: input, timestamp: Date.now() },
    ]);
    setInput('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleEndCall = () => setShowEndCallModal(true);
  const confirmEndCall = () => { window.location.href = '/'; };
  const cancelEndCall = () => setShowEndCallModal(false);

  const handleKeepWaiting = () => {
    setShowTimeoutModal(false);
    setIsWaiting(true);
    setIsMatched(false);
  };
  const handleDebateAI = () => { window.location.href = '/ai-debate'; };
  const handleInviteFriend = () => { window.location.href = '/invite-friend'; };
  const handleGoHome = () => { window.location.href = '/'; };

  // Media space content
  const mediaContent = (
    <div className="flex flex-col items-center justify-center min-h-0 min-w-0 gap-6 px-2 md:px-8 bg-white" style={{height: '100vh', width: '40vw', maxWidth: '100vw', margin: 0, padding: 0}}>
      <MediaBox isSpeaking={false}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white/80 flex-shrink-0">
            <div className="flex items-center gap-3">
              {isMatched ? (
                <img src={partnerProfileImg} alt="Partner" className="w-10 h-10 rounded-full border-2 border-white shadow" />
              ) : (
                <span className="text-gray-500 text-sm">Waiting for partner...</span>
              )}
            </div>
            <button onClick={handleEndCall} className="text-blue-600 hover:underline text-base font-medium focus:outline-none" style={{padding: 0, background: 'none', boxShadow: 'none', border: 'none'}}>
              Leave chat
            </button>
          </div>
          <div ref={chatLogRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-2 bg-neutral-100">
            {messages.length === 0 && (
              <div className="text-gray-400 text-center mt-8">No messages yet. Say hello!</div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow text-sm ${msg.sender === 'me' ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-200 bg-white/80 flex-shrink-0" style={{ minHeight: '72px' }}>
            <input
              className="flex-1 rounded-lg border px-3 py-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              disabled={!isMatched}
            />
            <button className="btn-primary px-4 py-2" onClick={handleSend} disabled={!input.trim() || !isMatched}>Send</button>
          </div>
        </div>
        {/* End Call Modal */}
        {showEndCallModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center border border-gray-200">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">End Debate?</h2>
              <p className="mb-6 text-gray-500">Are you sure you want to leave the chat?</p>
              <div className="flex space-x-4 justify-center">
                <button className="px-6 py-2 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-gray-700 font-medium transition" onClick={cancelEndCall}>Cancel</button>
                <button className="px-6 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition" onClick={confirmEndCall}>Leave Chat</button>
              </div>
            </div>
          </div>
        )}
      </MediaBox>
    </div>
  );

  // AI panel content
  const aiPanelContent = <AiPanel />;

  return (
    <>
      <FullScreenDebateLayout mediaContent={mediaContent} aiPanelContent={aiPanelContent} />
      <ToolsBar showTimerBar={false} setShowTimerBar={() => {}} showTimerButton={false} />
    </>
  );
} 