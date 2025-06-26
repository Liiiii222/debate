'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface Topic {
  id: string
  name: string
  category: string
  source: 'external' | 'user' | 'popular'
  trending?: boolean
}

interface TopicSelectionProps {
  category: string
  onTopicSelect: (topic: string) => void
  onBack: () => void
}

export default function TopicSelection({ category, onTopicSelect, onBack }: TopicSelectionProps) {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [newTopic, setNewTopic] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchTopics()
  }, [category])

  const fetchTopics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/topics?category=${encodeURIComponent(category)}`)
      if (response.ok) {
        const data = await response.json()
        setTopics(data.topics)
      } else {
        // Fallback to default topics based on category
        const defaultTopics = getDefaultTopics(category)
        setTopics(defaultTopics)
      }
    } catch (error) {
      console.error('Error fetching topics:', error)
      // Fallback to default topics
      const defaultTopics = getDefaultTopics(category)
      setTopics(defaultTopics)
    } finally {
      setLoading(false)
    }
  }

  const getDefaultTopics = (category: string): Topic[] => {
    const topicMap: Record<string, Topic[]> = {
      'Politics': [
        { id: '1', name: 'Climate Change Policy', category, source: 'popular', trending: true },
        { id: '2', name: 'Universal Basic Income', category, source: 'popular', trending: true },
        { id: '3', name: 'Electoral Reform', category, source: 'popular' },
        { id: '4', name: 'Immigration Policy', category, source: 'popular' },
        { id: '5', name: 'Healthcare Reform', category, source: 'popular' },
      ],
      'Technology': [
        { id: '6', name: 'Artificial Intelligence Ethics', category, source: 'popular', trending: true },
        { id: '7', name: 'Social Media Regulation', category, source: 'popular', trending: true },
        { id: '8', name: 'Cryptocurrency Future', category, source: 'popular' },
        { id: '9', name: 'Privacy vs Security', category, source: 'popular' },
        { id: '10', name: 'Remote Work Culture', category, source: 'popular' },
      ],
      'Environment': [
        { id: '11', name: 'Renewable Energy Transition', category, source: 'popular', trending: true },
        { id: '12', name: 'Plastic Pollution', category, source: 'popular', trending: true },
        { id: '13', name: 'Carbon Tax Implementation', category, source: 'popular' },
        { id: '14', name: 'Sustainable Agriculture', category, source: 'popular' },
        { id: '15', name: 'Wildlife Conservation', category, source: 'popular' },
      ],
      'Healthcare': [
        { id: '16', name: 'Universal Healthcare', category, source: 'popular', trending: true },
        { id: '17', name: 'Mental Health Awareness', category, source: 'popular' },
        { id: '18', name: 'Vaccine Mandates', category, source: 'popular' },
        { id: '19', name: 'Alternative Medicine', category, source: 'popular' },
        { id: '20', name: 'Healthcare Costs', category, source: 'popular' },
      ],
      'Education': [
        { id: '21', name: 'Online vs Traditional Education', category, source: 'popular', trending: true },
        { id: '22', name: 'Student Loan Forgiveness', category, source: 'popular' },
        { id: '23', name: 'Standardized Testing', category, source: 'popular' },
        { id: '24', name: 'Critical Race Theory', category, source: 'popular' },
        { id: '25', name: 'School Choice', category, source: 'popular' },
      ],
      'Economy': [
        { id: '26', name: 'Minimum Wage Increase', category, source: 'popular', trending: true },
        { id: '27', name: 'Wealth Inequality', category, source: 'popular' },
        { id: '28', name: 'Free Trade vs Protectionism', category, source: 'popular' },
        { id: '29', name: 'Tax Reform', category, source: 'popular' },
        { id: '30', name: 'Economic Recovery', category, source: 'popular' },
      ],
      'Social Issues': [
        { id: '31', name: 'Gender Equality', category, source: 'popular', trending: true },
        { id: '32', name: 'Racial Justice', category, source: 'popular' },
        { id: '33', name: 'LGBTQ+ Rights', category, source: 'popular' },
        { id: '34', name: 'Gun Control', category, source: 'popular' },
        { id: '35', name: 'Religious Freedom', category, source: 'popular' },
      ],
      'Science': [
        { id: '36', name: 'Space Exploration Funding', category, source: 'popular', trending: true },
        { id: '37', name: 'Genetic Engineering', category, source: 'popular' },
        { id: '38', name: 'Animal Testing', category, source: 'popular' },
        { id: '39', name: 'Nuclear Energy', category, source: 'popular' },
        { id: '40', name: 'Scientific Funding', category, source: 'popular' },
      ],
    }

    return topicMap[category] || [
      { id: 'default', name: 'General Discussion', category, source: 'popular' }
    ]
  }

  const handleAddTopic = async () => {
    if (!newTopic.trim()) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newTopic, category }),
      })

      if (response.ok) {
        const data = await response.json()
        setTopics(prev => [...prev, data.topic])
        setNewTopic('')
        setShowAddForm(false)
      }
    } catch (error) {
      console.error('Error adding topic:', error)
      // Add locally if API fails
      const newTopicItem: Topic = {
        id: Date.now().toString(),
        name: newTopic,
        category,
        source: 'user'
      }
      setTopics(prev => [...prev, newTopicItem])
      setNewTopic('')
      setShowAddForm(false)
    }
  }

  const trendingTopics = topics.filter(topic => topic.trending)
  const popularTopics = topics.filter(topic => topic.source === 'popular' && !topic.trending)
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
        </motion.div>
      )}

      {/* Trending Topics from External APIs */}
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
                <p className="text-sm text-gray-500 mt-1">Trending now</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Popular Topics */}
      {popularTopics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            📈 Popular Topics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {popularTopics.map((topic) => (
              <motion.button
                key={topic.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onTopicSelect(topic.name)}
                className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
              >
                <h3 className="font-semibold text-lg">{topic.name}</h3>
                <p className="text-sm text-gray-500 mt-1">Frequently debated</p>
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
              <motion.button
                key={topic.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onTopicSelect(topic.name)}
                className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
              >
                <h3 className="font-semibold text-lg">{topic.name}</h3>
                <p className="text-sm text-gray-500 mt-1">User created</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {topics.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No topics available for this category. Add one above!</p>
        </div>
      )}
    </div>
  )
} 