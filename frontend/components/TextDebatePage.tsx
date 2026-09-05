'use client'


import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/contexts/AuthContext'
import CountdownTimer, { TimerState } from './CountdownTimer'
import {
  MagnifyingGlassIcon, PaperAirplaneIcon, ArrowLeftIcon,
  ArrowRightOnRectangleIcon, FlagIcon, BookOpenIcon, ClockIcon, XMarkIcon
} from '@heroicons/react/24/solid'

interface TextDebatePageProps { userPreferences: any; matchedUid?: string }
interface Message {
  id: string
  sender: 'me' | 'partner'
  text: string
  timestamp: number
  replyTo?: { text: string; sender: 'me' | 'partner' }
}
function roomId(a: string, b: string) { return [a, b].sort().join('__') }

function AvatarImg({ src, name, className = '' }: { src: string; name: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (src && !failed) {
    return <img src={src} alt={name} className={`w-full h-full object-cover ${className}`} onError={() => setFailed(true)} />
  }
  return (
    <div className={`w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 font-semibold select-none text-sm ${className}`}>
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  )
}

export default function TextDebatePage({ userPreferences, matchedUid }: TextDebatePageProps) {
  const { user } = useAuth()
  const [partnerPresent, setPartnerPresent] = useState(false)
  const [partnerLeft, setPartnerLeft] = useState(false)
  const [showEnd, setShowEnd] = useState(false)
  const [msgs, setMsgs] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [partnerTyping, setPartnerTyping] = useState(false)
  const [partnerProfile, setPartnerProfile] = useState<any>(null)
  const [showReport, setShowReport] = useState(false)
  const [replyingTo, setReplyingTo] = useState<{ id: string; text: string; sender: 'me' | 'partner' } | null>(null)
  const [timerBar, setTimerBar] = useState(false)
  const [timerSyncedState, setTimerSyncedState] = useState<TimerState | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [factOpen, setFactOpen] = useState(false)
  const [factService, setFactService] = useState<'wikipedia' | 'perplexity' | 'wolfram'>('wikipedia')
  const [factQ, setFactQ] = useState('')
  const [factRes, setFactRes] = useState<any[]>([])
  const [factInstant, setFactInstant] = useState<{ text: string } | null>(null)
  const [factLoading, setFactLoading] = useState(false)

  const chatLogRef = useRef<HTMLDivElement>(null)
  const sock = useRef<Socket | null>(null)
  const typTimer = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (chatLogRef.current && !searchOpen) chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight
  }, [msgs, partnerTyping, searchOpen])

  useEffect(() => {
    const nav = document.querySelector('nav') as HTMLElement | null
    if (nav) nav.style.display = 'none'
    return () => { if (nav) nav.style.display = '' }
  }, [])

  useEffect(() => {
    if (!user || !matchedUid) return
    const fetch_ = async () => {
      try {
        const t = await user.getIdToken()
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${matchedUid}`, { headers: { Authorization: `Bearer ${t}` } })
        if (res.ok) { const d = await res.json(); setPartnerProfile(d.user) }
      } catch {}
    }
    fetch_()
  }, [user, matchedUid])

  useEffect(() => {
    if (!user) return
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', { transports: ['websocket'] })
    sock.current = socket
    const rid = matchedUid ? roomId(user.uid, matchedUid) : `${userPreferences?.category}-${userPreferences?.topic}`.toLowerCase().replace(/\s+/g, '-')
    socket.on('connect', () => socket.emit('join-debate', { uid: user.uid, roomId: rid, topic: userPreferences?.topic||'', category: userPreferences?.category||'', debateFormat: 'Text', preferences: userPreferences }))
    socket.on('partner-joined', () => { setPartnerPresent(true); setPartnerLeft(false) })
    socket.on('partner-already-present', () => { setPartnerPresent(true); setPartnerLeft(false) })
    socket.on('debate-message', (d: any) => setMsgs(p => [...p, { id: Math.random().toString(36), sender: 'partner', text: d.text, timestamp: d.timestamp, replyTo: d.replyTo }]))
    socket.on('partner-typing', (d: any) => setPartnerTyping(d.isTyping))
    socket.on('partner-left', () => { setPartnerPresent(false); setPartnerLeft(true) })
    socket.on('partner-disconnected', () => { setPartnerPresent(false); setPartnerLeft(true) })

    socket.on('timer-sync', (state: TimerState) => {
      setTimerSyncedState(state)
      if (state.mode === 'running') setTimerBar(true)
      else if (state.mode === 'setup') setTimerBar(false)
    })
    return () => { socket.emit('leave-debate'); socket.disconnect() }
  }, [user, matchedUid])

  const send = () => {
    if (!input.trim() || !sock.current) return
    const msg: Message = {
      id: Math.random().toString(36), sender: 'me', text: input, timestamp: Date.now(),
      replyTo: replyingTo ? { text: replyingTo.text, sender: replyingTo.sender } : undefined
    }
    sock.current.emit('debate-message', { text: input, timestamp: Date.now(), replyTo: msg.replyTo })
    sock.current.emit('typing-stop')
    setMsgs(p => [...p, msg])
    setInput(''); setReplyingTo(null); inputRef.current?.focus()
  }

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value); sock.current?.emit('typing-start')
    if (typTimer.current) clearTimeout(typTimer.current)
    typTimer.current = setTimeout(() => sock.current?.emit('typing-stop'), 1500)
  }

  const factSearch = async () => {
    if (!factQ.trim()) return
    if (factService === 'perplexity') { window.open(`https://www.perplexity.ai/search?q=${encodeURIComponent(factQ)}`, '_blank'); return }
    if (factService === 'wolfram') { window.open(`https://www.wolframalpha.com/input?i=${encodeURIComponent(factQ)}`, '_blank'); return }
    setFactLoading(true); setFactRes([]); setFactInstant(null)
    try {
      const r = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(factQ)}&format=json&origin=*`)
      const d = await r.json(); setFactRes(d.query?.search || [])
    } catch {}
    setFactLoading(false)
  }

const report = async (reason: string) => {
    if (!user || !matchedUid) return
    try { const t = await user.getIdToken(); await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${matchedUid}/report`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify({ reason }) }); setShowReport(false) } catch {}
  }

  const handleTimerStateChange = (state: TimerState) => { sock.current?.emit('timer-relay', state) }
  const partnerPic = partnerProfile?.profilePicture || ''
  const displayedMsgs = searchQuery.trim() ? msgs.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase())) : msgs

  return (
    <div className="fixed inset-0 bg-white flex flex-col" style={{ height: '100dvh' }}>
      <CountdownTimer showBar={timerBar} onStopBar={() => setTimerBar(false)} onTimerSet={() => setTimerBar(true)} syncedState={timerSyncedState} onStateChange={handleTimerStateChange}/>

      {/* Top bar */}
      <div className={`flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0 ${timerBar ? 'mt-[72px]' : ''}`}>
        {/* Partner — clicking opens profile in new tab */}
        <a href={`/profile/${matchedUid}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100">
              <AvatarImg src={partnerPic} name={partnerProfile?.name || 'P'} />
            </div>
            {partnerPresent && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />}
          </div>
          <p className="text-sm font-medium text-gray-800 leading-tight">
            {partnerProfile?.name || (partnerPresent ? 'Partner' : 'Waiting...')}
          </p>
        </a>

        <span className="text-sm font-medium text-gray-700 truncate max-w-[180px]">{userPreferences?.topic}</span>

        <div className="flex items-center gap-1">
          <button onClick={() => { setSearchOpen(s => !s); setFactOpen(false); setTimeout(() => searchInputRef.current?.focus(), 50) }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${searchOpen ? 'bg-gray-900 text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`} title="Search in chat">
            <MagnifyingGlassIcon className="w-4 h-4" />
          </button>
          <button onClick={() => { setFactOpen(f => !f); setSearchOpen(false) }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${factOpen ? 'bg-gray-900 text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`} title="Fact check">
            <BookOpenIcon className="w-4 h-4" />
          </button>
          <button onClick={() => setTimerBar(t => !t)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${timerBar ? 'bg-gray-900 text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`} title="Timer">
            <ClockIcon className="w-4 h-4" />
          </button>
          <button onClick={() => setShowReport(true)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-400 transition-colors" title="Report">
            <FlagIcon className="w-4 h-4" />
          </button>
          <button onClick={() => setShowEnd(true)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="flex items-center gap-2 px-5 py-2 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input ref={searchInputRef} className="flex-1 bg-transparent text-sm focus:outline-none placeholder-gray-400"
            placeholder="Search in conversation..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          {searchQuery && <span className="text-xs text-gray-400">{displayedMsgs.length} result{displayedMsgs.length !== 1 ? 's' : ''}</span>}
          <button onClick={() => { setSearchOpen(false); setSearchQuery('') }} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-4 h-4" /></button>
        </div>
      )}

      {/* Messages */}
      <div ref={chatLogRef} className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 space-y-3 min-h-0">
        {msgs.length === 0 && !partnerLeft && (
          <div className="text-center text-gray-300 text-sm mt-20 select-none">
            {partnerPresent ? 'Make your opening argument.' : 'Waiting for your partner to connect...'}
          </div>
        )}
        {partnerLeft && msgs.length === 0 && <div className="text-center text-gray-300 text-sm mt-20">Partner left before the debate started.</div>}
        {searchOpen && searchQuery && displayedMsgs.length === 0 && <div className="text-center text-gray-300 text-sm mt-20">No messages match "{searchQuery}"</div>}
        {displayedMsgs.map(m => (
          <div key={m.id} className={`flex items-end gap-2 ${m.sender === 'me' ? 'justify-end' : 'justify-start'} group`}>
            {m.sender === 'partner' && (
              <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                <AvatarImg src={partnerPic} name={partnerProfile?.name || 'P'} />
              </div>
            )}
            <div className="relative">
              {m.replyTo && (
                <div className={`mb-1 px-3 py-1.5 rounded-xl text-xs border-l-2 max-w-[280px] ${
                  m.sender === 'me' ? 'bg-gray-700 text-gray-300 border-gray-400 ml-auto' : 'bg-gray-200 text-gray-500 border-gray-400'
                }`}>
                  <span className="font-medium">
                    {m.sender === 'me'
                      ? (m.replyTo.sender === 'me' ? 'You' : (partnerProfile?.name || 'Partner'))
                      : (m.replyTo.sender === 'partner' ? 'You' : (partnerProfile?.name || 'Partner'))
                    }
                  </span>
                  <span className="ml-1 opacity-80">{m.replyTo.text.slice(0, 60)}{m.replyTo.text.length > 60 ? '…' : ''}</span>
                </div>
              )}
              <div className={`max-w-[280px] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.sender === 'me' ? 'bg-gray-900 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                {searchQuery.trim() ? (
                  <span dangerouslySetInnerHTML={{
                    __html: m.text.replace(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark class="bg-yellow-200 rounded px-0.5">$1</mark>')
                  }} />
                ) : m.text}
              </div>
              {/* Reply button — outside bubble to the right */}
              <button onClick={() => { setReplyingTo({ id: m.id, text: m.text, sender: m.sender }); inputRef.current?.focus() }}
                className="absolute right-0 translate-x-full bottom-1 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all opacity-0 group-hover:opacity-100 ml-1.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
              </button>
            </div>
          </div>
        ))}
        {partnerTyping && !searchOpen && (
          <div className="flex items-end gap-2 justify-start">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
              <AvatarImg src={partnerPic} name={partnerProfile?.name || 'P'} />
            </div>
            <div className="px-4 py-3 bg-gray-100 rounded-2xl rounded-bl-sm inline-flex gap-1">
              {[0,150,300].map(d => <span key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}/>)}
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      {!searchOpen && (
        <div className="border-t border-gray-100 flex-shrink-0">
          {replyingTo && (
            <div className="flex items-center gap-2 px-5 py-2 bg-gray-50 border-b border-gray-100">
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <div className="w-0.5 h-8 bg-gray-300 rounded-full flex-shrink-0"/>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500">{replyingTo.sender === 'me' ? 'You' : (partnerProfile?.name || 'Partner')}</p>
                  <p className="text-xs text-gray-400 truncate">{replyingTo.text.slice(0, 80)}{replyingTo.text.length > 80 ? '…' : ''}</p>
                </div>
              </div>
              <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                <XMarkIcon className="w-4 h-4"/>
              </button>
            </div>
          )}
          <div className="flex items-center gap-3 px-5 py-4">
            <input ref={inputRef}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-300 transition-all"
              placeholder={partnerPresent ? 'Type your argument...' : 'Waiting for partner...'}
              value={input} onChange={onInput} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              disabled={!partnerPresent} autoFocus/>
            <button onClick={send} disabled={!input.trim() || !partnerPresent}
              className="w-11 h-11 rounded-xl bg-gray-900 hover:bg-gray-700 disabled:bg-gray-100 disabled:text-gray-300 text-white flex items-center justify-center transition-colors flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Fact check floating panel */}
      {factOpen && (
        <div className="fixed bottom-6 right-6 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden z-40" style={{ maxHeight: '60vh' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <span className="text-sm font-medium text-gray-700">Fact check</span>
            <button onClick={() => setFactOpen(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-4 h-4"/></button>
          </div>
          <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex-shrink-0 space-y-2">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              {(['wikipedia', 'perplexity', 'wolfram'] as const).map(s => (
                <button key={s} onClick={() => setFactService(s)}
                  className={`flex-1 py-1 rounded-md text-xs font-medium transition-all capitalize ${factService === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {s === 'wolfram' ? 'Wolfram α' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                placeholder={factService === 'wikipedia' ? 'Search Wikipedia...' : factService === 'perplexity' ? 'Ask Perplexity...' : 'Ask Wolfram...'}
                value={factQ} onChange={e => setFactQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && factSearch()} autoFocus/>
              <button onClick={factSearch} className="px-3 py-2 rounded-lg bg-gray-900 hover:bg-gray-700 text-white text-xs font-medium flex-shrink-0">
                {factService === 'wikipedia' ? 'Search' : '↗ Open'}
              </button>
            </div>
          </div>
          <div className="overflow-y-auto px-4 py-2 space-y-2">
            {factInstant && <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl"><p className="text-xs text-gray-700 leading-relaxed">{factInstant.text}</p></div>}
            {factLoading && <div className="text-center text-gray-400 text-sm py-4">Searching...</div>}
            {!factLoading && factRes.length === 0 && factQ && factService === 'wikipedia' && <div className="text-center text-gray-400 text-sm py-4">No results</div>}
            {factRes.map((item: any) => (
              <div key={item.pageid} className="pb-2 border-b border-gray-100 last:border-0">
                <a href={`https://en.wikipedia.org/?curid=${item.pageid}`} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline text-sm">{item.title}</a>
                <div className="text-xs text-gray-400 mt-0.5 line-clamp-2" dangerouslySetInnerHTML={{__html: item.snippet}}/>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-gray-100 mx-4">
            <h2 className="text-base font-semibold mb-4 text-gray-900">Report this user</h2>
            <div className="space-y-2 mb-4">
              {['Inappropriate behavior','Harassment','Spam','Other'].map(r => (
                <button key={r} onClick={() => report(r)} className="w-full text-left px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm text-gray-700 transition">{r}</button>
              ))}
            </div>
            <button onClick={() => setShowReport(false)} className="w-full py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm transition">Cancel</button>
          </div>
        </div>
      )}

      {/* End modal */}
      {showEnd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl border border-gray-100 mx-4">
            <h2 className="text-lg font-semibold mb-2 text-gray-900">Leave debate?</h2>
            <p className="text-gray-400 text-sm mb-6">Your partner will be notified.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowEnd(false)} className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition">Stay</button>
              <button onClick={() => { sock.current?.emit('leave-debate'); window.location.href = '/' }} className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition">Leave</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}




