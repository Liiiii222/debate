'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/contexts/AuthContext'
import RematchOfferPopup from './RematchOfferPopup'
import CountdownTimer, { TimerState } from './CountdownTimer'
import {
  MicrophoneIcon, ChatBubbleLeftRightIcon, BookOpenIcon,
  ClockIcon, PhoneXMarkIcon, XMarkIcon, PaperAirplaneIcon, FlagIcon
} from '@heroicons/react/24/solid'

interface VoiceDebatePageProps { userPreferences: any; matchedUid?: string }
interface Message { id: string; sender: 'me' | 'partner'; text: string; timestamp: number }

const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] }
const EASE = 'cubic-bezier(0.4,0,0.2,1)'
const DUR = '380ms'
function roomId(a: string, b: string) { return [a, b].sort().join('__') }

function AvatarImg({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false)
  if (src && !failed) return <img src={src} alt={name} className="w-full h-full object-cover" onError={() => setFailed(true)} />
  return <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-2xl font-semibold select-none">{name?.charAt(0).toUpperCase() || '?'}</div>
}

export default function VoiceDebatePage({ userPreferences, matchedUid }: VoiceDebatePageProps) {
  const { user } = useAuth()
  const [partnerPresent, setPartnerPresent] = useState(false)
  const [partnerLeft, setPartnerLeft] = useState(false)
  const [showEnd, setShowEnd] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [mic, setMic] = useState(true)
  const [speaking, setSpeaking] = useState(false)
  const [partnerSpeaking, setPartnerSpeaking] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [factOpen, setFactOpen] = useState(false)
  const [msgs, setMsgs] = useState<Message[]>([])
  const [chatIn, setChatIn] = useState('')
  const [partnerTyping, setPartnerTyping] = useState(false)
  const [timerBar, setTimerBar] = useState(false)
  const [rematchOffer, setRematchOffer] = useState<any>(null)
  const [timerSyncedState, setTimerSyncedState] = useState<TimerState | null>(null)
  const [factService, setFactService] = useState<'wikipedia'|'perplexity'|'wolfram'>('wikipedia')
  const [factQ, setFactQ] = useState('')
  const [factRes, setFactRes] = useState<any[]>([])
  const [factLoading, setFactLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const [partnerProfile, setPartnerProfile] = useState<any>(null)
  const [myProfile, setMyProfile] = useState<any>(null)
  const [following, setFollowing] = useState(false)

  const sock = useRef<Socket|null>(null)
  const pc = useRef<RTCPeerConnection|null>(null)
  const stream = useRef<MediaStream|null>(null)
  const partnerAudio = useRef<HTMLAudioElement|null>(null)
  const actx = useRef<AudioContext|null>(null)
  const raf = useRef<number|null>(null)
  const chatLog = useRef<HTMLDivElement>(null)
  const typTimer = useRef<NodeJS.Timeout|null>(null)

  useEffect(() => { if (!chatOpen && msgs.at(-1)?.sender === 'partner') setUnread(u=>u+1) }, [msgs])
  useEffect(() => { if (chatOpen) setUnread(0) }, [chatOpen])
  useEffect(() => { if (chatLog.current) chatLog.current.scrollTop = chatLog.current.scrollHeight }, [msgs, partnerTyping])
  useEffect(() => { const n = document.querySelector('nav') as HTMLElement|null; if(n)n.style.display='none'; return()=>{if(n)n.style.display=''} }, [])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const t = await user.getIdToken()
        const [meRes, pRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/me`, { headers: { Authorization: `Bearer ${t}` } }),
          matchedUid ? fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${matchedUid}`, { headers: { Authorization: `Bearer ${t}` } }) : Promise.resolve(null)
        ])
        if (meRes.ok) { const d = await meRes.json(); setMyProfile(d.user) }
        if (pRes?.ok) { const d = await pRes.json(); setPartnerProfile(d.user); setFollowing(d.user?.isFollowedByMe || false) }
      } catch {}
    }
    load()
  }, [user, matchedUid])

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then(s => {
      stream.current = s
      const ctx = new (window.AudioContext||(window as any).webkitAudioContext)()
      actx.current = ctx
      const src = ctx.createMediaStreamSource(s), an = ctx.createAnalyser()
      an.fftSize = 2048; src.connect(an)
      const arr = new Uint8Array(an.fftSize)
      const tick = () => {
        an.getByteTimeDomainData(arr); let sum = 0
        for (let i=0;i<arr.length;i++){const v=(arr[i]-128)/128;sum+=v*v}
        const sp = Math.sqrt(sum/arr.length) > 0.04
        setSpeaking(prev => { if(prev!==sp&&sock.current) sock.current.emit(sp?'typing-start':'typing-stop'); return sp })
        raf.current = requestAnimationFrame(tick)
      }; tick()
    }).catch(e => console.error('mic:', e))
    return () => { stream.current?.getTracks().forEach(t=>t.stop()); actx.current?.close(); if(raf.current)cancelAnimationFrame(raf.current) }
  }, [])

  useEffect(() => {
    if (!user) return
    const socket = io(process.env.NEXT_PUBLIC_API_URL||'http://localhost:3001',{transports:['websocket']})
    sock.current = socket
    const rid = matchedUid ? roomId(user.uid,matchedUid) : `${userPreferences?.category}-${userPreferences?.topic}`.toLowerCase().replace(/\s+/g,'-')

    const mkPC = () => {
      const p = new RTCPeerConnection(ICE); pc.current = p
      const s = stream.current; if(s) s.getAudioTracks().forEach(t=>p.addTrack(t,s))
      p.ontrack = e => { if(partnerAudio.current) partnerAudio.current.srcObject = e.streams[0] }
      p.onicecandidate = e => { if(e.candidate) socket.emit('webrtc-ice-candidate',{candidate:e.candidate}) }
      return p
    }

    socket.on('connect', () => socket.emit('join-debate',{uid:user.uid,roomId:rid,topic:userPreferences?.topic||'',category:userPreferences?.category||'',debateFormat:'Voice',preferences:userPreferences}))
    socket.on('partner-joined', async () => {
      setPartnerPresent(true); setPartnerLeft(false)
      await new Promise(r=>setTimeout(r,500))
      const p=mkPC(); const o=await p.createOffer(); await p.setLocalDescription(o)
      socket.emit('webrtc-offer',{offer:o})
    })
    socket.on('partner-already-present', () => { setPartnerPresent(true); setPartnerLeft(false) })
    socket.on('webrtc-offer', async ({offer}:any) => {
      setPartnerPresent(true); const p=mkPC()
      await p.setRemoteDescription(new RTCSessionDescription(offer))
      const a=await p.createAnswer(); await p.setLocalDescription(a)
      socket.emit('webrtc-answer',{answer:a})
    })
    socket.on('webrtc-answer', async ({answer}:any) => { await pc.current?.setRemoteDescription(new RTCSessionDescription(answer)) })
    socket.on('webrtc-ice-candidate', async ({candidate}:any) => { try { await pc.current?.addIceCandidate(new RTCIceCandidate(candidate)) } catch {} })
    socket.on('partner-typing', (d:any) => setPartnerSpeaking(d.isTyping))
    socket.on('debate-message', (d:any) => setMsgs(p=>[...p,{id:Math.random().toString(36),sender:'partner',text:d.text,timestamp:d.timestamp}]))
    socket.on('partner-left', () => { setPartnerPresent(false);setPartnerLeft(true);pc.current?.close() })
    socket.on('partner-disconnected', () => { setPartnerPresent(false);setPartnerLeft(true);pc.current?.close() })
    socket.on('quick-match-offer', (data: any) => {
      setRematchOffer(data)
    })

    socket.on('rematch-confirmed', (data: any) => {
      // Reload with new partner — navigate to same format with new uid
      window.location.href = window.location.href
    })

    socket.on('rematch-declined', () => {
      // Offer was declined, continue normal search
      setRematchOffer(null)
    })

    socket.on('timer-sync', (state:TimerState) => { setTimerSyncedState(state); if(state.mode==='running')setTimerBar(true); else if(state.mode==='setup')setTimerBar(false) })

    return () => {
      socket.emit('leave-debate'); socket.disconnect(); pc.current?.close()
      if(partnerAudio.current) partnerAudio.current.srcObject = null
    }
  }, [user, matchedUid])

  const send = () => {
    if (!chatIn.trim()||!sock.current) return
    sock.current.emit('debate-message',{text:chatIn,timestamp:Date.now()})
    sock.current.emit('typing-stop')
    setMsgs(p=>[...p,{id:Math.random().toString(36),sender:'me',text:chatIn,timestamp:Date.now()}])
    setChatIn('')
  }
  const onInput = (e:React.ChangeEvent<HTMLInputElement>) => {
    setChatIn(e.target.value); sock.current?.emit('typing-start')
    if(typTimer.current) clearTimeout(typTimer.current)
    typTimer.current = setTimeout(()=>sock.current?.emit('typing-stop'),1500)
  }
  const factSearch = async () => {
    if (!factQ.trim()) return
    if (factService==='perplexity') { window.open(`https://www.perplexity.ai/search?q=${encodeURIComponent(factQ)}`,'_blank'); return }
    if (factService==='wolfram') { window.open(`https://www.wolframalpha.com/input?i=${encodeURIComponent(factQ)}`,'_blank'); return }
    setFactLoading(true); setFactRes([])
    try {
      const r = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(factQ)}&format=json&origin=*`)
      const d = await r.json(); setFactRes(d.query?.search||[])
    } catch {}
    setFactLoading(false)
  }
  const handleReport = async (reason:string) => {
    if (!user||!matchedUid) return
    try { const t=await user.getIdToken(); await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${matchedUid}/report`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${t}`},body:JSON.stringify({reason})}); setShowReport(false) } catch {}
  }
  const handleRematchAccept = (offer: RematchOffer) => {
    setRematchOffer(null)
    sock.current?.emit('join-match-room', { uid: user?.uid, roomId: offer.matchRoomId })
    setTimeout(() => {
      sock.current?.emit('rematch-response', { accept: true, offeredUid: offer.offeredUid, matchRoomId: offer.matchRoomId, debateFormats: userPreferences?.debateFormats || ['Voice'] })
    }, 300)
  })
  }

  const handleRematchDecline = (offer: RematchOffer) => {
    setRematchOffer(null)
    sock.current?.emit('rematch-response', { accept: false, offeredUid: offer.offeredUid, matchRoomId: offer.matchRoomId, debateFormats: [] })
  }

  const handleTimerStateChange = (state:TimerState) => { sock.current?.emit('timer-relay',state) }

  const boxStyle = (stacked:boolean):React.CSSProperties => ({
    width: stacked?'100%':'calc(50% - 4px)',
    height: stacked?'calc(50% - 4px)':'100%',
    transition: `width ${DUR} ${EASE}, height ${DUR} ${EASE}`,
    flexShrink:0, position:'relative', borderRadius:'1rem', overflow:'hidden',
    backgroundColor:'#ffffff', border:'2px solid',
  })
  const btn = (active:boolean, danger=false) => `relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 ${danger?'bg-red-500 hover:bg-red-600 text-white':active?'bg-gray-900 text-white':'bg-white border border-gray-200 text-gray-500 hover:border-gray-300 shadow-sm'}`
  const partnerPic = partnerProfile?.profilePicture || ''
  const myPic = myProfile?.profilePicture || ''

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col" style={{height:'100dvh'}}>
      <audio ref={partnerAudio} autoPlay playsInline style={{display:'none'}}/>
      <CountdownTimer showBar={timerBar} onStopBar={()=>setTimerBar(false)} onTimerSet={()=>setTimerBar(true)} syncedState={timerSyncedState} onStateChange={handleTimerStateChange}/>
      <div className="flex-1 flex overflow-hidden min-h-0" style={{paddingTop:timerBar?72:0}}>
        <div className="flex flex-wrap gap-2 p-4 min-h-0" style={{width:chatOpen?'50%':'100%',height:'100%',transition:`width ${DUR} ${EASE}`}}>
          {/* Partner box */}
          <div style={{...boxStyle(chatOpen),borderColor:partnerSpeaking?'#60a5fa':'#e5e7eb'}}>
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 relative">
              <a href={`/profile/${matchedUid}`} target="_blank" rel="noopener noreferrer"
                className={`relative w-20 h-20 rounded-full overflow-hidden border-2 hover:opacity-90 transition-opacity cursor-pointer block flex-shrink-0 ${partnerSpeaking?'border-blue-400 ring-4 ring-blue-400/30':'border-gray-200'}`}>
                <AvatarImg src={partnerPic} name={partnerProfile?.name||'P'}/>
                {partnerPresent&&<span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"/>}
              </a>
              <span className="text-sm font-medium text-gray-600">{partnerProfile?.name||(partnerLeft?'Partner left':partnerPresent?'Partner':'Waiting...')}</span>
              <div className={`flex gap-1 transition-opacity duration-200 ${partnerSpeaking?'opacity-100':'opacity-0'}`}>
                {[0,150,300].map(d=><span key={d} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}/>)}
              </div>
              {partnerPresent&&(
                <button onClick={()=>setShowReport(true)} className="absolute bottom-3 flex items-center gap-1 text-xs text-gray-300 hover:text-red-400 transition-colors">
                  <FlagIcon className="w-3 h-3"/>Report
                </button>
              )}
            </div>
          </div>
          {/* Your box */}
          <div style={{...boxStyle(chatOpen),borderColor:speaking?'#60a5fa':'#e5e7eb'}}>
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <div className={`w-20 h-20 rounded-full overflow-hidden border-2 transition-all duration-200 ${speaking?'border-blue-400 ring-4 ring-blue-400/30':'border-gray-200'}`}>
                <AvatarImg src={myPic} name={user?.displayName||'You'}/>
              </div>
              <span className="text-sm font-medium text-gray-600">You</span>
              <div className={`flex gap-1 transition-opacity duration-200 ${speaking?'opacity-100':'opacity-0'}`}>
                {[0,150,300].map(d=><span key={d} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}/>)}
              </div>
            </div>
          </div>
        </div>
        {/* Chat panel */}
        <div className="flex flex-col bg-white border-l border-gray-200 overflow-hidden flex-shrink-0"
          style={{width:chatOpen?'50%':'0%',opacity:chatOpen?1:0,transition:`width ${DUR} ${EASE}, opacity 200ms ease`}}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${partnerPresent?'bg-green-400':'bg-gray-300'}`}/>
              <span className="text-sm text-gray-500">{partnerPresent?'Partner is here':'Waiting...'}</span>
            </div>
            <button onClick={()=>setChatOpen(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-4 h-4"/></button>
          </div>
          <div className="px-4 py-1.5 border-b border-gray-100 flex-shrink-0">
            <span className="text-xs text-gray-400">{userPreferences?.topic} · {userPreferences?.category}</span>
          </div>
          <div ref={chatLog} className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50 min-h-0">
            {msgs.length===0&&<div className="text-center text-gray-300 text-xs mt-8">No messages yet</div>}
            {msgs.map(m=>(
              <div key={m.id} className={`flex ${m.sender==='me'?'justify-end':'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${m.sender==='me'?'bg-gray-900 text-white rounded-br-sm':'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'}`}>{m.text}</div>
              </div>
            ))}
            {partnerTyping&&<div className="flex justify-start"><div className="px-3 py-2.5 bg-white border border-gray-200 rounded-2xl rounded-bl-sm inline-flex gap-1">{[0,150,300].map(d=><span key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}/>)}</div></div>}
          </div>
          <div className="flex gap-2 px-4 py-3 border-t border-gray-100 flex-shrink-0">
            <input className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all" placeholder="Type a message..." value={chatIn} onChange={onInput} onKeyDown={e=>e.key==='Enter'&&send()} autoFocus={chatOpen}/>
            <button onClick={send} disabled={!chatIn.trim()} className="w-9 h-9 rounded-xl bg-gray-900 hover:bg-gray-700 disabled:bg-gray-100 disabled:text-gray-300 text-white flex items-center justify-center flex-shrink-0"><PaperAirplaneIcon className="w-4 h-4"/></button>
          </div>
        </div>
      </div>
      {/* Controls */}
      <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${partnerPresent?'bg-green-400':'bg-gray-300'}`}/>
          <span className="text-xs text-gray-400">{partnerPresent?'Connected':partnerLeft?'Partner left':'Waiting...'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>{stream.current?.getAudioTracks().forEach(t=>{t.enabled=!mic});setMic(m=>!m)}} className={btn(!mic)} title={mic?'Mute':'Unmute'}>
              <div className="relative w-4 h-4">
                <MicrophoneIcon className="w-4 h-4"/>
                {!mic && <svg className="absolute inset-0 w-4 h-4 text-current" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="3" x2="21" y2="21"/></svg>}
              </div>
            </button>
          <button onClick={()=>{setChatOpen(c=>!c);setFactOpen(false)}} className={btn(chatOpen)}>
            <ChatBubbleLeftRightIcon className="w-4 h-4"/>
            {unread>0&&!chatOpen&&<span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center">{unread}</span>}
          </button>
          <button onClick={()=>setFactOpen(f=>!f)} className={btn(factOpen)}><BookOpenIcon className="w-4 h-4"/></button>
          <button onClick={()=>setTimerBar(t=>!t)} className={btn(timerBar)}><ClockIcon className="w-4 h-4"/></button>
          <button onClick={()=>setShowEnd(true)} className={`${btn(false,true)} ml-1`}><PhoneXMarkIcon className="w-4 h-4"/></button>
        </div>
        <span className="text-xs text-gray-400 truncate max-w-[150px]">{userPreferences?.topic}</span>
      </div>
      {/* Fact check */}
      {factOpen&&(
        <div className="fixed bottom-20 right-6 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden z-40" style={{maxHeight:'60vh'}}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <span className="text-sm font-medium text-gray-700">Fact check</span>
            <button onClick={()=>setFactOpen(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-4 h-4"/></button>
          </div>
          <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex-shrink-0 space-y-2">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              {(['wikipedia','perplexity','wolfram'] as const).map(s=>(
                <button key={s} onClick={()=>setFactService(s)}
                  className={`flex-1 py-1 rounded-md text-xs font-medium transition-all capitalize ${factService===s?'bg-white text-gray-900 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>
                  {s==='wolfram'?'Wolfram α':s.charAt(0).toUpperCase()+s.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                placeholder={factService==='wikipedia'?'Search Wikipedia...':factService==='perplexity'?'Ask Perplexity...':'Ask Wolfram...'}
                value={factQ} onChange={e=>setFactQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&factSearch()} autoFocus/>
              <button onClick={factSearch} className="px-3 py-2 rounded-lg bg-gray-900 hover:bg-gray-700 text-white text-xs font-medium flex-shrink-0">
                {factService==='wikipedia'?'Search':'↗ Open'}
              </button>
            </div>
          </div>
          <div className="overflow-y-auto px-4 py-2 space-y-2">
            {factLoading&&<div className="text-center text-gray-400 text-sm py-4">Searching...</div>}
            {!factLoading&&factRes.length===0&&factQ&&factService==='wikipedia'&&<div className="text-center text-gray-400 text-sm py-4">No results</div>}
            {factRes.map((item:any)=>(
              <div key={item.pageid} className="pb-2 border-b border-gray-100 last:border-0">
                <a href={`https://en.wikipedia.org/?curid=${item.pageid}`} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline text-sm">{item.title}</a>
                <div className="text-xs text-gray-400 mt-0.5 line-clamp-2" dangerouslySetInnerHTML={{__html:item.snippet}}/>
              </div>
            ))}
          </div>
        </div>
      )}
      {showReport&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-gray-100 mx-4">
            <h2 className="text-base font-semibold mb-4 text-gray-900">Report this user</h2>
            <div className="space-y-2 mb-4">
              {['Inappropriate behavior','Harassment','Spam','Other'].map(r=>(
                <button key={r} onClick={()=>handleReport(r)} className="w-full text-left px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm text-gray-700 transition">{r}</button>
              ))}
            </div>
            <button onClick={()=>setShowReport(false)} className="w-full py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm transition">Cancel</button>
          </div>
        </div>
      )}
      {rematchOffer && (
        <RematchOfferPopup
          offer={rematchOffer}
          onAccept={handleRematchAccept}
          onDecline={handleRematchDecline}
        />
      )}

      {showEnd&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl border border-gray-100 mx-4">
            <h2 className="text-lg font-semibold mb-2 text-gray-900">End debate?</h2>
            <p className="text-gray-400 text-sm mb-6">Your partner will be notified.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={()=>setShowEnd(false)} className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition">Stay</button>
              <button onClick={()=>{sock.current?.emit('leave-debate');window.location.href='/'}} className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition">Leave</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

