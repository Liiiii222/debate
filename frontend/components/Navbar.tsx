'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { auth } from '@/firebase'
import { signOut } from 'firebase/auth'
import { useAuth } from '@/contexts/AuthContext'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, loading } = useAuth()
  // Modal state
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [infoForm, setInfoForm] = useState({ age: '', country: '', language: '' })
  const [infoLoading, setInfoLoading] = useState(false)
  const [infoError, setInfoError] = useState('')
  const [infoSuccess, setInfoSuccess] = useState('')

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Fetch user info for modal
  const fetchUserInfo = async () => {
    setInfoLoading(true)
    setInfoError('')
    try {
      const res = await fetch('/api/user/me', { headers: { 'x-session-id': user?.uid } })
      const data = await res.json()
      if (data.success) {
        setInfoForm({
          age: data.user.age ? String(data.user.age) : '',
          country: data.user.country || '',
          language: data.user.language || ''
        })
      } else {
        setInfoError(data.error || 'Failed to load info')
      }
    } catch (e) {
      setInfoError('Failed to load info')
    }
    setInfoLoading(false)
  }

  const openInfoModal = () => {
    setShowInfoModal(true)
    fetchUserInfo()
  }
  const closeInfoModal = () => {
    setShowInfoModal(false)
    setInfoError('')
    setInfoSuccess('')
  }
  const handleInfoChange = (e) => {
    setInfoForm({ ...infoForm, [e.target.name]: e.target.value })
  }
  const handleInfoSubmit = async (e) => {
    e.preventDefault()
    setInfoLoading(true)
    setInfoError('')
    setInfoSuccess('')
    try {
      const res = await fetch('/api/user/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': user?.uid
        },
        body: JSON.stringify({
          age: infoForm.age ? Number(infoForm.age) : undefined,
          country: infoForm.country || undefined,
          language: infoForm.language || undefined
        })
      })
      const data = await res.json()
      if (data.success) {
        setInfoSuccess('Information updated!')
        setTimeout(() => closeInfoModal(), 1000)
      } else {
        setInfoError(data.error || 'Failed to update info')
      }
    } catch (e) {
      setInfoError('Failed to update info')
    }
    setInfoLoading(false)
  }

  if (loading) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary-600">
                Debate
              </Link>
            </div>
            <div className="w-9 h-9 bg-gray-200 animate-pulse rounded-full"></div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-primary-600">
              Debate
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
              Home
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
              Contact
            </Link>
            {/* Search bar */}
            <input
              type="text"
              placeholder="Search for users..."
              className="ml-2 px-3 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-700 placeholder-gray-400 transition w-56"
              style={{ background: 'none', boxShadow: 'none' }}
            />
            {/* Auth/Profile section */}
            {user ? (
              <div className="flex items-center space-x-3 ml-4">
                <div className="relative group">
                  <div className="w-9 h-9 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-300 transition-colors">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'Profile'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-lg font-bold">
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                      </span>
                    )}
                  </div>
                  {/* Dropdown menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <div className="font-medium">{user.displayName || 'User'}</div>
                      <div className="text-gray-500">{user.email}</div>
                    </div>
                    {/* Your Information button */}
                    <button
                      onClick={openInfoModal}
                      className="block w-full text-left px-4 py-2 text-sm text-primary-700 hover:bg-gray-100 transition-colors font-medium"
                    >
                      Your Information
                    </button>
                    <Link
                      href="/profile"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 ml-4">
                <Link href="/login" className="text-gray-600 hover:text-primary-600 font-medium px-3 py-1 rounded transition">Log In</Link>
                <Link href="/signup" className="text-white bg-primary-600 hover:bg-primary-700 font-medium px-3 py-1 rounded transition">Sign Up</Link>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                Home
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
                Contact
              </Link>
              {/* Search bar for mobile */}
              <input
                type="text"
                placeholder="Search for users..."
                className="mt-2 px-3 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-700 placeholder-gray-400 transition w-full"
                style={{ background: 'none', boxShadow: 'none' }}
              />
              {/* Auth/Profile section for mobile */}
              {user ? (
                <div className="flex items-center space-x-3 mt-2">
                  <div className="w-9 h-9 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center overflow-hidden">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'Profile'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-lg font-bold">
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.displayName || 'User'}</span>
                    <Link href="/profile" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                      Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2 mt-2">
                  <Link href="/login" className="text-gray-600 hover:text-primary-600 font-medium px-3 py-1 rounded transition">Log In</Link>
                  <Link href="/signup" className="text-white bg-primary-600 hover:bg-primary-700 font-medium px-3 py-1 rounded transition">Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={closeInfoModal}>&times;</button>
            <h2 className="text-lg font-semibold mb-4">Edit Your Information</h2>
            <form onSubmit={handleInfoSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Age</label>
                <input type="number" name="age" min="0" max="120" value={infoForm.age} onChange={handleInfoChange} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <input type="text" name="country" value={infoForm.country} onChange={handleInfoChange} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Language</label>
                <input type="text" name="language" value={infoForm.language} onChange={handleInfoChange} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              {infoError && <div className="text-red-500 text-sm">{infoError}</div>}
              {infoSuccess && <div className="text-green-600 text-sm">{infoSuccess}</div>}
              <button type="submit" className="w-full bg-primary-600 text-white rounded-md py-2 font-medium hover:bg-primary-700 transition" disabled={infoLoading}>
                {infoLoading ? 'Saving...' : 'Save'}
              </button>
            </form>
          </div>
        </div>
      )}
    </nav>
  )
} 