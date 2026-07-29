'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid'

interface UserResult {
  uid: string
  name: string
  email: string
  country: string
  profilePicture: string
}

function AvatarImg({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false)
  if (src && !failed) {
    return <img src={src} alt={name} className="w-full h-full object-cover" onError={() => setFailed(true)} />
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-xs font-semibold select-none">
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  )
}

export default function UserSearch({ className = '' }: { className?: string }) {
  const { user } = useAuth()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = async (q: string) => {
    if (!q.trim() || !user) { setResults([]); setOpen(false); return }
    setLoading(true); setError('')
    try {
      const token = await user.getIdToken()
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/search?q=${encodeURIComponent(q.trim())}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Search failed')
        setResults([])
      } else {
        setResults(data.users || [])
        setOpen(true)
      }
    } catch (err) {
      setError('Could not reach the server')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!q.trim()) { setResults([]); setOpen(false); return }
    timerRef.current = setTimeout(() => search(q), 350)
  }

  const handleSelect = (uid: string) => {
    setOpen(false)
    setQuery('')
    setResults([])
    router.push(`/profile/${uid}`)
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search users..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {error && (
            <div className="px-4 py-3 text-sm text-red-500">{error}</div>
          )}
          {!error && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-400">No users found</div>
          )}
          {results.map(u => (
            <button
              key={u.uid}
              onClick={() => handleSelect(u.uid)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition text-left"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                <AvatarImg src={u.profilePicture} name={u.name} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{u.name || '(no name)'}</p>
                {u.country && <p className="text-xs text-gray-400 truncate">{u.country}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
