'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { UserPlusIcon, FlagIcon, ArrowLeftIcon } from '@heroicons/react/24/solid'

function AvatarImg({ src, name, className = '' }: { src: string; name: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (src && !failed) {
    return <img src={src} alt={name} className={`w-full h-full object-cover ${className}`} onError={() => setFailed(true)} />
  }
  return (
    <div className={`w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 font-semibold select-none ${className}`}>
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  )
}

export default function PublicProfilePage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const uid = params?.uid as string

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [activeList, setActiveList] = useState<'none' | 'followers' | 'following'>('none')
  const [listUsers, setListUsers] = useState<{uid:string;name:string;profilePicture:string;country:string}[]>([])
  const [listLoading, setListLoading] = useState(false)

  useEffect(() => {
    if (!user || !uid) return
    if (uid === user.uid) { router.push('/profile'); return }
    const load = async () => {
      setLoading(true)
      try {
        const token = await user.getIdToken()
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${uid}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('User not found')
        const d = await res.json()
        if (d.success) {
          setProfile(d.user)
          setFollowing(d.user.isFollowedByMe || false)
        } else throw new Error(d.error || 'Failed to load')
      } catch (err: any) {
        setError(err.message || 'Could not load profile')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, uid])

  const handleFollow = async () => {
    if (!user || !uid) return
    setFollowLoading(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${uid}/follow`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      })
      const d = await res.json()
      if (d.success) {
        setFollowing(d.action === 'followed')
        setProfile((p: any) => p ? {
          ...p,
          followersCount: d.action === 'followed' ? p.followersCount + 1 : p.followersCount - 1
        } : p)
      }
    } catch {}
    setFollowLoading(false)
  }

  const handleReport = async (reason: string) => {
    if (!user || !uid) return
    try {
      const token = await user.getIdToken()
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${uid}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason })
      })
      setShowReport(false)
    } catch {}
  }

  // Check if this page was opened in a new tab (for debate context)
  const isNewTab = typeof window !== 'undefined' && window.opener !== null

  const fetchList = async (type: 'followers' | 'following') => {
    if (!user || !profile) return
    if (activeList === type) { setActiveList('none'); return }
    setActiveList(type); setListLoading(true); setListUsers([])
    try {
      const uids: string[] = type === 'followers' ? (profile.followers || []) : (profile.following || [])
      const token = await user.getIdToken()
      const results = await Promise.all(uids.map((u:string) =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${u}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
      ))
      setListUsers(results.filter(r => r.success).map((r:any) => ({ uid: r.user.uid, name: r.user.name || 'Unknown', profilePicture: r.user.profilePicture || '', country: r.user.country || '' })))
    } catch {} finally { setListLoading(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      {!isNewTab && <Navbar />}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-xl shadow-lg p-8 animate-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-gray-200" />
            <div className="space-y-2"><div className="h-6 bg-gray-200 rounded w-32" /><div className="h-4 bg-gray-200 rounded w-48" /></div>
          </div>
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50">
      {!isNewTab && <Navbar />}
      <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
        <p className="text-gray-500">{error}</p>
        <button onClick={() => router.back()} className="mt-4 text-primary-600 hover:underline text-sm">Go back</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {!isNewTab && <Navbar />}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {isNewTab && (
          <div className="mb-4 text-sm text-gray-400">Viewing profile during debate — your debate is still open in the other tab.</div>
        )}
        {!isNewTab && (
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
            <ArrowLeftIcon className="w-4 h-4" />Back
          </button>
        )}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex-shrink-0">
                <AvatarImg src={profile?.profilePicture || ''} name={profile?.name || '?'} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profile?.name || 'Unknown'}</h1>
                {profile?.age && <p className="text-gray-400 text-sm">{profile.age}</p>}
                {profile?.country && <p className="text-gray-400 text-sm">{profile.country}</p>}
                {profile?.languages?.length > 0 && (
                  <p className="text-gray-400 text-sm">{profile.languages.join(', ')}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-medium transition"
              >
                <UserPlusIcon className="w-4 h-4" />
                {following ? 'Following' : 'Follow'}
              </button>
              <button
                onClick={() => setShowReport(true)}
                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition"
              >
                <FlagIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mb-4 pb-4 border-b border-gray-100">
            <button onClick={() => fetchList('followers')}
              className={'text-center transition-colors ' + (activeList === 'followers' ? 'text-primary-600' : 'hover:text-primary-600')}>
              <p className="text-xl font-bold text-gray-900">{profile?.followersCount ?? 0}</p>
              <p className="text-sm text-gray-400">Followers</p>
            </button>
            <button onClick={() => fetchList('following')}
              className={'text-center transition-colors ' + (activeList === 'following' ? 'text-primary-600' : 'hover:text-primary-600')}>
              <p className="text-xl font-bold text-gray-900">{profile?.followingCount ?? 0}</p>
              <p className="text-sm text-gray-400">Following</p>
            </button>
          </div>

          {/* Followers / Following list */}
          {activeList !== 'none' && (
            <div className="mb-4 pb-4 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-600 mb-3 capitalize">{activeList}</h3>
              {listLoading && <p className="text-sm text-gray-400">Loading...</p>}
              {!listLoading && listUsers.length === 0 && <p className="text-sm text-gray-400">No {activeList} yet.</p>}
              <div className="space-y-3">
                {listUsers.map(u => (
                  <Link key={u.uid} href={'/profile/' + u.uid}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                      <AvatarImg src={u.profilePicture} name={u.name} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{u.name}</p>
                      {u.country && <p className="text-xs text-gray-400">{u.country}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {profile?.bio && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Bio</h3>
              <p className="text-gray-700">{profile.bio}</p>
            </div>
          )}
          {!profile?.bio && <p className="text-gray-400 italic text-sm">No bio yet.</p>}
        </div>
      </div>

      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-gray-100 mx-4">
            <h2 className="text-base font-semibold mb-4 text-gray-900">Report this user</h2>
            <div className="space-y-2 mb-4">
              {['Inappropriate behavior', 'Harassment', 'Spam', 'Other'].map(r => (
                <button key={r} onClick={() => handleReport(r)} className="w-full text-left px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm text-gray-700 transition">{r}</button>
              ))}
            </div>
            <button onClick={() => setShowReport(false)} className="w-full py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm transition">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
