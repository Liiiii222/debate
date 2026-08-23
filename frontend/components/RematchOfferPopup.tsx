'use client'

import { useEffect, useState } from 'react'

interface RematchOffer {
  offeredUid: string
  name: string
  profilePicture: string
  topic: string
  category: string
  debateFormat: string
  matchScore: number
}

interface Props {
  offer: RematchOffer
  onAccept: (offeredUid: string) => void
  onDecline: (offeredUid: string) => void
}

const TIMEOUT = 15

function AvatarImg({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false)
  if (src && !failed) return <img src={src} alt={name} className="w-full h-full object-cover" onError={() => setFailed(true)} />
  return <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 font-bold text-xl">{name?.charAt(0).toUpperCase() || '?'}</div>
}

export default function RematchOfferPopup({ offer, onAccept, onDecline }: Props) {
  const [seconds, setSeconds] = useState(TIMEOUT)

  useEffect(() => {
    if (seconds <= 0) { onDecline(offer.offeredUid); return }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds])

  const progress = (seconds / TIMEOUT) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-primary-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-500">New partner available</span>
            <span className="ml-auto text-sm text-gray-400 tabular-nums">{seconds}s</span>
          </div>

          {/* Partner info */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-gray-200">
              <AvatarImg src={offer.profilePicture} name={offer.name} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-base truncate">{offer.name}</p>
              <p className="text-sm text-gray-500 truncate">wants to debate with you</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">{offer.matchScore}% match</span>
                <span className="text-xs text-gray-400">{offer.debateFormat}</span>
              </div>
            </div>
          </div>

          {/* Topic */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5">
            <p className="text-xs text-gray-400 mb-0.5">{offer.category}</p>
            <p className="text-sm font-medium text-gray-800 leading-snug">{offer.topic}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => onDecline(offer.offeredUid)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={() => onAccept(offer.offeredUid)}
              className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
            >
              Join debate →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
