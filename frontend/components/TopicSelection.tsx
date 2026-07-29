'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'

interface Topic {
  id: string
  name: string
  category: string
  source: 'default' | 'user' | 'external'
  trending?: boolean
  usageCount?: number
  createdBy?: string | null
}

interface TopicSelectionProps {
  category: string
  onTopicSelect: (topic: string) => void
  onBack: () => void
}

// Must match DELETE_PROTECTION_THRESHOLD in backend/src/routes/topics.ts
const DELETE_PROTECTION_THRESHOLD = 10

function usageLabel(count: number | undefined) {
  const n = count || 0
  return `Used in ${n} debate${n === 1 ? '' : 's'}`
}

// Small "..." menu shown on each user-added topic card
function TopicMenu({
  topic,
  isOwner,
  onDelete,
  onReport
}: {
  topic: Topic
  isOwner: boolean
  onDelete: () => void
  onReport: (reason: 'inappropriate' | 'gibberish') => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const canDelete = isOwner && (topic.usageCount || 0) < DELETE_PROTECTION_THRESHOLD

  return (
    <div ref={ref} className="absolute top-2 right-2">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        aria-label="More options"
      >
        ⋮
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 py-1">
          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete() }}
              className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Delete topic
            </button>
          )}
          {isOwner && !canDelete && (
            <div className="px-3 py-2 text-xs text-gray-400">
              Too many people use this to delete it
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onReport('inappropriate') }}
            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Report: inappropriate
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onReport('gibberish') }}
            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Report: gibberish
          </button>
        </div>
      )}
    </div>
  )
}

export default function TopicSelection({ category, onTopicSelect, onBack }: TopicSelectionProps) {
  const { user } = useAuth()
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [newTopic, setNewTopic] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [addError, setAddError] = useState('')

  useEffect(() => {
    fetchTopics()
  }, [category])

  const fetchTopics = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/topics?category=${encodeURIComponent(category)}`)
      const data = await response.json()
      if (response.ok && data.success) {
        setTopics(data.topics)
      } else {
        setLoadError(data.error || 'Failed to load topics')
        setTopics([])
      }
    } catch (error) {
      console.error('Error fetching topics:', error)
      setLoadError('Could not reach the server. Please try again.')
      setTopics([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddTopic = async () => {
    if (!newTopic.trim()) return
    if (!user) {
      setAddError('You need to be logged in to add a topic.')
      return
    }
    setAddError('')

    try {
      const token = await user.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newTopic.trim(), category }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setTopics(prev => [...prev, data.topic])
        setNewTopic('')
        setShowAddForm(false)
      } else {
        setAddError(data.error || 'Failed to add topic')
      }
    } catch (error) {
      console.error('Error adding topic:', error)
      setAddError('Could not reach the server. Please try again.')
    }
  }

  const handleDeleteTopic = async (topicId: string) => {
    if (!user) return
    try {
      const token = await user.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/topics/${topicId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setTopics(prev => prev.filter(t => t.id !== topicId))
      } else {
        alert(data.error || 'Failed to delete topic.')
      }
    } catch (err) {
      alert('Failed to delete topic.')
    }
  }

  const handleReportTopic = async (topicId: string, reason: 'inappropriate' | 'gibberish') => {
    if (!user) return
    try {
      const token = await user.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/topics/${topicId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      })
      const data = await response.json()
      if (response.ok && data.success) {
        alert('Report submitted. Thank you!')
      } else {
        alert(data.error || 'Failed to submit report.')
      }
    } catch (err) {
      alert('Failed to submit report.')
    }
  }

  const trendingTopics = topics.filter(topic => topic.trending)
  const defaultTopics = topics.filter(topic => topic.source === 'default' && !topic.trending)
  const userTopics = topics.filter(topic => topic.source === 'user')

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="btn-secondary">
            ← Back
          </button>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading topics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="btn-secondary">
          ← Back
        </button>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Choose a Topic</h1>
          <p className="text-lg text-gray-600 mt-2">Category: {category}</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
        >
          Add New Topic
        </button>
      </div>

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8"
        >
          <h3 className="text-lg font-semibold mb-4">Add New Topic</h3>
          <div className="flex gap-4">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Enter topic name..."
              className="input-field flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTopic()}
            />
            <button onClick={handleAddTopic} className="btn-primary">
              Add
            </button>
          </div>
          {addError && <p className="text-sm text-red-600 mt-2">{addError}</p>}
        </motion.div>
      )}

      {loadError && (
        <div className="text-center py-4 mb-4 text-sm text-red-600">{loadError}</div>
      )}

      {/* Genuinely trending topics (only ones the backend actually flagged as trending) */}
      {trendingTopics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold mb-4 text-primary-600">
            🔥 Trending Topics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trendingTopics.map((topic) => (
              <motion.button
                key={topic.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onTopicSelect(topic.name)}
                className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
              >
                <h3 className="font-semibold text-lg">{topic.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{usageLabel(topic.usageCount)}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Default (built-in) topics */}
      {defaultTopics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            📋 Topics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {defaultTopics.map((topic) => (
              <motion.button
                key={topic.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onTopicSelect(topic.name)}
                className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
              >
                <h3 className="font-semibold text-lg">{topic.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{usageLabel(topic.usageCount)}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* User Added Topics */}
      {userTopics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            💡 User Topics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userTopics.map((topic) => (
              <motion.div key={topic.id} className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onTopicSelect(topic.name)}
                  className="card hover:shadow-lg transition-shadow cursor-pointer text-left w-full"
                >
                  <h3 className="font-semibold text-lg pr-6">{topic.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{usageLabel(topic.usageCount)}</p>
                </motion.button>
                {user && (
                  <TopicMenu
                    topic={topic}
                    isOwner={topic.createdBy === user.uid}
                    onDelete={() => handleDeleteTopic(topic.id)}
                    onReport={(reason) => handleReportTopic(topic.id, reason)}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {!loadError && topics.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No topics available for this category. Add one above!</p>
        </div>
      )}
    </div>
  )
}
