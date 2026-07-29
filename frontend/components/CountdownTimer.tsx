'use client'

import { useState, useEffect, useRef } from 'react'
import { XMarkIcon, PlayIcon, PauseIcon, ArrowPathIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/solid'

export interface TimerState {
  myTime: number
  partnerTime: number
  isMyTurn: boolean
  paused: boolean
  total: number
  mode: 'setup' | 'running'
}

interface CountdownTimerProps {
  showBar: boolean
  onStopBar: () => void
  onTimerSet: () => void
  // Debate page passes incoming sync from partner
  syncedState?: TimerState | null
  // Debate page listens to this and emits to socket
  onStateChange?: (state: TimerState) => void
}

const PRESETS = [
  { label: '1 min', seconds: 60 },
  { label: '2 min', seconds: 120 },
  { label: '3 min', seconds: 180 },
  { label: '5 min', seconds: 300 },
]

const DEFAULT: TimerState = {
  myTime: 180, partnerTime: 180, isMyTurn: true,
  paused: false, total: 180, mode: 'setup'
}

export default function CountdownTimer({
  showBar, onStopBar, onTimerSet,
  syncedState, onStateChange
}: CountdownTimerProps) {
  const [state, setState] = useState<TimerState>(DEFAULT)
  const [customInput, setCustomInput] = useState('')
  const [customError, setCustomError] = useState('')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Apply state from partner (via debate page socket)
  useEffect(() => {
    if (!syncedState) return
    setState(syncedState)
  }, [syncedState])

  // Local tick
  useEffect(() => {
    clearInterval(intervalRef.current!)
    if (state.mode !== 'running' || state.paused) return
    intervalRef.current = setInterval(() => {
      setState(prev => {
        if (prev.mode !== 'running' || prev.paused) return prev
        const key = prev.isMyTurn ? 'myTime' : 'partnerTime'
        const cur = prev[key]
        if (cur <= 1) {
          const next = { ...prev, [key]: 0, paused: true }
          onStateChange?.(next)
          return next
        }
        return { ...prev, [key]: cur - 1 }
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [state.mode, state.paused, state.isMyTurn])

  const apply = (next: TimerState) => {
    setState(next)
    onStateChange?.(next)
  }

  const start = (seconds: number) => {
    apply({ myTime: seconds, partnerTime: seconds, isMyTurn: true, paused: false, total: seconds, mode: 'running' })
    onTimerSet()
  }

  const handleCustom = () => {
    const val = customInput.trim()
    if (!val) return
    let seconds = 0
    if (val.includes(':')) {
      const [m, s] = val.split(':').map(Number)
      if (isNaN(m) || isNaN(s) || s >= 60) { setCustomError('Use m:ss e.g. 1:30'); return }
      seconds = m * 60 + s
    } else {
      const n = Number(val)
      if (isNaN(n) || n <= 0) { setCustomError('Enter minutes e.g. 4'); return }
      seconds = Math.round(n * 60)
    }
    if (seconds > 3600) { setCustomError('Max 60 min'); return }
    setCustomError(''); start(seconds)
  }

  const handlePause = () => apply({ ...state, paused: !state.paused })
  const handlePass = () => apply({ ...state, isMyTurn: !state.isMyTurn, paused: false })
  const handleReset = () => apply({ ...state, myTime: state.total, partnerTime: state.total, isMyTurn: true, paused: false })
  const handleClose = () => { apply(DEFAULT); onStopBar() }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  const myLow = state.myTime <= 30 && state.myTime > 0
  const partnerLow = state.partnerTime <= 30 && state.partnerTime > 0
  const myDone = state.myTime === 0
  const partnerDone = state.partnerTime === 0

  if (!showBar) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      {state.mode === 'setup' ? (
        <div className="flex flex-col items-center py-3 px-5 gap-2 relative">
          <span className="text-xs font-medium text-gray-500">Set time per player</span>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {PRESETS.map(p => (
              <button key={p.seconds} onClick={() => { setCustomInput(''); setCustomError(''); start(p.seconds) }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-600 transition-colors">
                {p.label}
              </button>
            ))}
            <div className="flex items-center gap-1.5">
              <input type="text" value={customInput}
                onChange={e => { setCustomInput(e.target.value); setCustomError('') }}
                onKeyDown={e => e.key === 'Enter' && handleCustom()}
                placeholder="custom (e.g. 4 or 1:30)"
                className="w-36 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all"/>
              <button onClick={handleCustom}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-900 hover:bg-gray-700 text-white transition-colors">
                Start
              </button>
            </div>
            {customError && <span className="text-xs text-red-500">{customError}</span>}
          </div>
          <button onClick={handleClose} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-4 h-4"/>
          </button>
        </div>
      ) : (
        <div>
          <div className="flex h-0.5">
            <div className="w-1/2 bg-gray-100 flex justify-end">
              <div className={`h-full transition-all duration-1000 ease-linear ${myDone ? 'bg-red-400' : myLow ? 'bg-orange-400' : 'bg-gray-900'}`}
                style={{ width: `${(state.myTime / state.total) * 100}%` }}/>
            </div>
            <div className="w-1/2 bg-gray-100">
              <div className={`h-full transition-all duration-1000 ease-linear ${partnerDone ? 'bg-red-400' : partnerLow ? 'bg-orange-400' : 'bg-gray-900'}`}
                style={{ width: `${(state.partnerTime / state.total) * 100}%` }}/>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 px-5 py-2 relative">
            <div className={`flex items-center gap-1.5 transition-opacity duration-200 ${state.isMyTurn ? 'opacity-100' : 'opacity-40'}`}>
              {state.isMyTurn && !state.paused && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>}
              <span className={`text-sm font-mono font-semibold tabular-nums ${myDone ? 'text-red-500' : myLow ? 'text-orange-500' : 'text-gray-900'}`}>
                {fmt(state.myTime)}
              </span>
              <span className="text-xs text-gray-400">you</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={handlePause}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                {state.paused ? <PlayIcon className="w-3 h-3"/> : <PauseIcon className="w-3 h-3"/>}
              </button>
              <button onClick={handlePass} title="Pass turn"
                className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-900 hover:bg-gray-700 text-white transition-colors">
                <ArrowsRightLeftIcon className="w-3 h-3"/>
              </button>
              <button onClick={handleReset}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                <ArrowPathIcon className="w-3 h-3"/>
              </button>
            </div>
            <div className={`flex items-center gap-1.5 transition-opacity duration-200 ${!state.isMyTurn ? 'opacity-100' : 'opacity-40'}`}>
              <span className="text-xs text-gray-400">partner</span>
              <span className={`text-sm font-mono font-semibold tabular-nums ${partnerDone ? 'text-red-500' : partnerLow ? 'text-orange-500' : 'text-gray-900'}`}>
                {fmt(state.partnerTime)}
              </span>
              {!state.isMyTurn && !state.paused && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>}
            </div>
            <button onClick={handleClose} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-4 h-4"/>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
