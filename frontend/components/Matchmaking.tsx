'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { UserPreferences } from '@/app/page'

interface MatchmakingProps {
  userPreferences: UserPreferences
  onBack: () => void
  onStartDebate: () => void
}

interface Match {
  id: string
  name: string
  ageRange: string
  country: string
  university?: string
  matchScore: number
}

export default function Matchmaking({ userPreferences, onBack, onStartDebate }: MatchmakingProps) {
  const [isSearching, setIsSearching] = useState(true)
  const [match, setMatch] = useState<Match | null>(null)
  const [searchTime, setSearchTime] = useState(0)
  const [showFallbackOptions, setShowFallbackOptions] = useState(false)

  useEffect(() => {
    startMatchmaking()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isSearching) {
      interval = setInterval(() => {
        setSearchTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isSearching])

  const startMatchmaking = async () => {
    try {
      // Simulate API call to find matches
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/matchmaking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userPreferences),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.match) {
          setMatch(data.match)
          setIsSearching(false)
        } else {
          // No match found, show fallback options after 10 seconds
          setTimeout(() => {
            setShowFallbackOptions(true)
            setIsSearching(false)
          }, 10000)
        }
      } else {
        // Simulate no match found after 10 seconds
        setTimeout(() => {
          setShowFallbackOptions(true)
          setIsSearching(false)
        }, 10000)
      }
    } catch (error) {
      console.error('Error during matchmaking:', error)
      // Simulate no match found after 10 seconds
      setTimeout(() => {
        setShowFallbackOptions(true)
        setIsSearching(false)
      }, 10000)
    }
  }

  const handleDebateAI = () => {
    // Redirect to AI debate interface
    window.location.href = '/ai-debate'
  }

  const handleWaitForMatch = () => {
    setIsSearching(true)
    setShowFallbackOptions(false)
    setSearchTime(0)
    startMatchmaking()
  }

  const handleInvitePartner = () => {
    // Simple alert for now - you can implement a proper invite flow later
    alert('Invite partner functionality will be implemented soon!')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isSearching) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="btn-secondary">
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Finding Your Match</h1>
          <div></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-6"></div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Searching for debate partners...
            </h2>
            <p className="text-gray-600 mb-6">
              Looking for someone who matches your preferences for {userPreferences.topic} in {userPreferences.category}
            </p>
            <div className="text-3xl font-mono text-primary-600">
              {formatTime(searchTime)}
            </div>
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Checking preferences...</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <span className="text-sm text-gray-600">Finding compatible partners...</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                <span className="text-sm text-gray-600">Evaluating match quality...</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  if (match) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="btn-secondary">
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Match Found!</h1>
          <div></div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card"
        >
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Great match found!
            </h2>
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Your Debate Partner</h3>
              <div className="space-y-2 text-left">
                <p><span className="font-medium">Name:</span> {match.name}</p>
                <p><span className="font-medium">Age Range:</span> {match.ageRange}</p>
                <p><span className="font-medium">Country:</span> {match.country}</p>
                {match.university && (
                  <p><span className="font-medium">University:</span> {match.university}</p>
                )}
                <p><span className="font-medium">Match Score:</span> {match.matchScore}%</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button className="btn-primary w-full" onClick={onStartDebate}>
                Start Debate Now
              </button>
              <button onClick={onBack} className="btn-secondary w-full">
                Find Different Partner
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  if (showFallbackOptions) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="btn-secondary">
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">No Match Found</h1>
          <div></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No perfect match found
            </h2>
            <p className="text-gray-600 mb-8">
              We couldn't find someone who matches all your preferences. Here are some alternatives:
            </p>
            
            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleInvitePartner}
                className="w-full p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all"
              >
                👥 Invite a Specific Partner
                <p className="text-sm opacity-90 mt-1">Invite someone by their username</p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDebateAI}
                className="w-full p-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all"
              >
                🤖 Debate an AI
                <p className="text-sm opacity-90 mt-1">Practice with our advanced AI debate partner</p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleWaitForMatch}
                className="w-full p-4 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-teal-600 transition-all"
              >
                ⏳ Wait for a Match
                <p className="text-sm opacity-90 mt-1">Keep searching for a human partner</p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onBack}
                className="w-full p-4 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-all"
              >
                🔄 Start Over
                <p className="text-sm opacity-90 mt-1">Choose different preferences</p>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return null
} 