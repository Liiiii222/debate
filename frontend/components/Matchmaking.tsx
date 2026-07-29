'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { io, Socket } from 'socket.io-client'
import { UserPreferences } from '@/app/page'
import { useAuth } from '@/contexts/AuthContext'

interface MatchmakingProps {
  userPreferences: UserPreferences
  onBack: () => void
  onStartDebate: (formats: string[], matchedUid: string) => void
}

interface Match {
  matchedUid: string
  matchedName: string
  matchScore: number
  ageRange: string
  country: string
  languages: string[]
  resolvedFormat: string
}

function makeRoomId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('__')
}

export default function Matchmaking({ userPreferences, onBack, onStartDebate }: MatchmakingProps) {
  const { user } = useAuth()
  const [phase, setPhase] = useState<'searching' | 'confirming' | 'waiting-other' | 'declined' | 'error' | 'fallback'>('searching')
  const [match, setMatch] = useState<Match | null>(null)
  const [searchTime, setSearchTime] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [partnerAccepted, setPartnerAccepted] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const [resolvedFormat, setResolvedFormat] = useState('')
  const socketRef = useRef<Socket | null>(null)
  const matchRef = useRef<Match | null>(null)

  // Keep ref in sync so Socket.IO listeners always see current match
  useEffect(() => { matchRef.current = match }, [match])

  const POLL_INTERVAL_MS = 4000
  const MAX_WAIT_MS = 60000

  // Connect to Socket.IO and register as searching
  useEffect(() => {
    if (!user) return

    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      transports: ['websocket']
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('register-searching', { uid: user.uid })
    })

    // Backend pushed a match to us (we were found by the other person's poll)
    socket.on('match-found', (data: Match) => {
      setMatch(data)
      setResolvedFormat(data.resolvedFormat || 'Text')
      setPhase('confirming')
      // Both join the pre-debate room so Accept/Decline can be coordinated
      const roomId = makeRoomId(user.uid, data.matchedUid)
      socket.emit('join-match-room', { uid: user.uid, roomId })
    })

    socket.on('partner-accepted', () => setPartnerAccepted(true))

    socket.on('both-accepted', () => {
      const currentMatch = matchRef.current
      if (currentMatch) {
        const fmt = currentMatch.resolvedFormat || resolvedFormat || 'Text'
        setResolvedFormat(fmt)
        onStartDebate([fmt], currentMatch.matchedUid)
      }
    })

    socket.on('match-declined', () => {
      setPhase('declined')
    })

    socket.on('partner-disconnected', () => {
      if (phase === 'confirming' || phase === 'waiting-other') {
        setPhase('declined')
      }
    })

    return () => {
      socket.emit('unregister-searching', { uid: user.uid })
      socket.disconnect()
      socketRef.current = null
    }
  }, [user, retryKey])

  // HTTP polling — finds the other person and triggers match-found on both sides
  useEffect(() => {
    if (phase !== 'searching') return
    let cancelled = false
    let pollTimer: NodeJS.Timeout
    const startedAt = Date.now()

    const attemptMatch = async () => {
      if (cancelled || !user) return

      try {
        const token = await user.getIdToken()
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/matchmaking`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(userPreferences),
        })

        const data = await response.json()
        if (cancelled) return

        if (!response.ok || !data.success) {
          setErrorMessage(data.error || `Something went wrong (${response.status})`)
          setPhase('error')
          return
        }

        if (data.match) {
          cancelled = true
          clearTimeout(pollTimer)
          const matchData: Match = {
            matchedUid: data.match.id,
            matchedName: data.match.name,
            matchScore: data.match.matchScore,
            ageRange: data.match.ageRange,
            country: data.match.country,
            languages: data.match.languages || [],
            resolvedFormat: data.match.resolvedFormat || 'Text'
          }
          setMatch(matchData)
          setPhase('confirming')
          // Join the pre-debate room for Accept/Decline coordination
          const roomId = makeRoomId(user.uid, data.match.id)
          socketRef.current?.emit('join-match-room', { uid: user.uid, roomId })
          return
        }

        if (Date.now() - startedAt >= MAX_WAIT_MS) {
          setPhase('fallback')
          return
        }

        if (!cancelled) pollTimer = setTimeout(attemptMatch, POLL_INTERVAL_MS)
      } catch (error) {
        if (cancelled) return
        setErrorMessage('Could not reach the server. Please try again.')
        setPhase('error')
      }
    }

    attemptMatch()
    return () => { cancelled = true; clearTimeout(pollTimer) }
  }, [phase, retryKey])

  // Search timer
  useEffect(() => {
    if (phase !== 'searching') return
    const interval = setInterval(() => setSearchTime(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [phase])

  const handleAccept = () => {
    if (!match || !user) return
    const roomId = makeRoomId(user.uid, match.matchedUid)
    socketRef.current?.emit('accept-match', { uid: user.uid, roomId, debateFormats: userPreferences.debateFormats })
    setPhase('waiting-other')
  }

  const handleDecline = () => {
    if (!match || !user) return
    const roomId = makeRoomId(user.uid, match.matchedUid)
    socketRef.current?.emit('decline-match', { uid: user.uid, roomId })
    // Go back to searching
    setMatch(null)
    setPartnerAccepted(false)
    setSearchTime(0)
    setRetryKey(k => k + 1)
    setPhase('searching')
  }

  const handleRetry = () => {
    setMatch(null)
    setPartnerAccepted(false)
    setErrorMessage('')
    setSearchTime(0)
    setRetryKey(k => k + 1)
    setPhase('searching')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (phase === 'error') {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="btn-secondary">← Back</button>
          <h1 className="text-3xl font-bold text-gray-900">Something went wrong</h1>
          <div></div>
        </div>
        <div className="card py-12">
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={handleRetry} className="btn-primary">Try again</button>
            <button onClick={onBack} className="btn-secondary">Change preferences</button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'searching') {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="btn-secondary">← Back</button>
          <h1 className="text-3xl font-bold text-gray-900">Finding a partner</h1>
          <div></div>
        </div>
        <div className="card py-12">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-primary-600 mx-auto mb-8"></div>
          <p className="text-gray-700 font-medium mb-1">
            Looking for someone to debate <span className="text-primary-600">{userPreferences.topic}</span>
          </p>
          <p className="text-sm text-gray-400 mb-6">in {userPreferences.category}</p>
          <div className="text-2xl font-mono text-gray-400 mb-8">{formatTime(searchTime)}</div>
          <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 underline">
            Cancel and go back
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'confirming' && match) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div></div>
          <h1 className="text-3xl font-bold text-gray-900">Partner found</h1>
          <div></div>
        </div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 mb-4 text-left">
              <p className="text-sm text-gray-500 mb-2">Your debate partner</p>
              <p className="text-xl font-semibold text-gray-900 mb-4">{match.matchedName}</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <span>Age: {match.ageRange}</span>
                <span>From: {match.country}</span>
                {match.languages?.length > 0 && (
                  <span className="col-span-2">Speaks: {match.languages.join(', ')}</span>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Compatibility</span>
                  <span className="font-medium text-primary-600">{match.matchScore}%</span>
                </div>
                <div className="mt-1 h-1.5 bg-gray-200 rounded-full">
                  <div className="h-1.5 bg-primary-500 rounded-full" style={{ width: `${match.matchScore}%` }} />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Debate format</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                    {match.resolvedFormat || resolvedFormat}
                  </span>
                </div>
              </div>
            </div>

            {partnerAccepted && (
              <p className="text-sm text-green-600 mb-4">Your partner already accepted — waiting for you!</p>
            )}

            <div className="flex gap-3 justify-center">
              <button onClick={handleDecline} className="btn-secondary flex-1">
                Decline
              </button>
              <button onClick={handleAccept} className="btn-primary flex-1">
                Accept
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  if (phase === 'waiting-other' && match) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-between mb-8">
          <div></div>
          <h1 className="text-3xl font-bold text-gray-900">Waiting for partner</h1>
          <div></div>
        </div>
        <div className="card py-12">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-primary-600 mx-auto mb-6"></div>
          <p className="text-gray-600 mb-2">You accepted — waiting for <strong>{match.matchedName}</strong> to accept too.</p>
          <p className="text-sm text-gray-400">The debate will start as soon as they confirm.</p>
          <button
            onClick={handleDecline}
            className="mt-8 text-sm text-gray-400 hover:text-gray-600 underline"
          >
            Cancel and find someone else
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'declined') {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="btn-secondary">← Back</button>
          <h1 className="text-3xl font-bold text-gray-900">Match declined</h1>
          <div></div>
        </div>
        <div className="card py-12">
          <p className="text-gray-600 mb-6">Your partner declined this debate. You can search again or go back.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={handleRetry} className="btn-primary">Search again</button>
            <button onClick={onBack} className="btn-secondary">Go back</button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'fallback') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="btn-secondary">← Back</button>
          <h1 className="text-3xl font-bold text-gray-900">No match yet</h1>
          <div></div>
        </div>
        <div className="card py-8">
          <p className="text-gray-600 text-center mb-8">
            Nobody matching your criteria is online right now.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full py-3 px-4 rounded-lg border-2 border-primary-600 text-primary-600 font-medium hover:bg-primary-50 transition-colors text-left flex items-center gap-3"
            >
              <span className="text-xl">⏳</span>
              <div>
                <p className="font-medium">Keep searching</p>
                <p className="text-sm text-gray-500">Search for another 60 seconds</p>
              </div>
            </button>
            <button
              onClick={onBack}
              className="w-full py-3 px-4 rounded-lg border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-left flex items-center gap-3"
            >
              <span className="text-xl">🔄</span>
              <div>
                <p className="font-medium">Adjust preferences</p>
                <p className="text-sm text-gray-500">Broaden your criteria to find more people</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
