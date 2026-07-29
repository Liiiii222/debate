'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'

interface Category {
  id: string
  name: string
  source: 'default' | 'user' | 'external'
  trending?: boolean
  usageCount?: number
  createdBy?: string | null
}

interface CategorySelectionProps {
  onCategorySelect: (category: string) => void
  onBack: () => void
}

// Must match DELETE_PROTECTION_THRESHOLD in backend/src/routes/categories.ts
const DELETE_PROTECTION_THRESHOLD = 10

function usageLabel(count: number | undefined) {
  const n = count || 0
  return `Used in ${n} debate${n === 1 ? '' : 's'}`
}

// Small "..." menu shown on each user-added category card
function CategoryMenu({
  category,
  isOwner,
  onDelete,
  onReport
}: {
  category: Category
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

  const canDelete = isOwner && (category.usageCount || 0) < DELETE_PROTECTION_THRESHOLD

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
              Delete category
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

export default function CategorySelection({ onCategorySelect, onBack }: CategorySelectionProps) {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [addError, setAddError] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`)
      const data = await response.json()
      if (response.ok && data.success) {
        setCategories(data.categories)
      } else {
        setLoadError(data.error || 'Failed to load categories')
        setCategories([])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setLoadError('Could not reach the server. Please try again.')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return
    if (!user) {
      setAddError('You need to be logged in to add a category.')
      return
    }
    setAddError('')

    try {
      const token = await user.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCategory.trim() }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setCategories(prev => [...prev, data.category])
        setNewCategory('')
        setShowAddForm(false)
      } else {
        setAddError(data.error || 'Failed to add category')
      }
    } catch (error) {
      console.error('Error adding category:', error)
      setAddError('Could not reach the server. Please try again.')
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!user) return
    try {
      const token = await user.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setCategories(prev => prev.filter(c => c.id !== categoryId))
      } else {
        alert(data.error || 'Failed to delete category.')
      }
    } catch (err) {
      alert('Failed to delete category.')
    }
  }

  const handleReportCategory = async (categoryId: string, reason: 'inappropriate' | 'gibberish') => {
    if (!user) return
    try {
      const token = await user.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${categoryId}/report`, {
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

  // Real backend source values: 'default' | 'user' | 'external'
  const trendingCategories = categories.filter(cat => cat.trending)
  const defaultCategories = categories.filter(cat => cat.source === 'default' && !cat.trending)
  const userCategories = categories.filter(cat => cat.source === 'user')

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
          <p className="mt-4 text-gray-600">Loading categories...</p>
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
        <h1 className="text-3xl font-bold text-gray-900">Choose a Category</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
        >
          Add New Category
        </button>
      </div>

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8"
        >
          <h3 className="text-lg font-semibold mb-4">Add New Category</h3>
          <div className="flex gap-4">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter category name..."
              className="input-field flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <button onClick={handleAddCategory} className="btn-primary">
              Add
            </button>
          </div>
          {addError && <p className="text-sm text-red-600 mt-2">{addError}</p>}
        </motion.div>
      )}

      {loadError && (
        <div className="text-center py-4 mb-4 text-sm text-red-600">{loadError}</div>
      )}

      {/* Genuinely trending categories (only ones the backend actually flagged as trending) */}
      {trendingCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold mb-4 text-primary-600">
            🔥 Trending Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingCategories.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onCategorySelect(category.name)}
                className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
              >
                <h3 className="font-semibold text-lg">{category.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{usageLabel(category.usageCount)}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Default (built-in) categories */}
      {defaultCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            📋 Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {defaultCategories.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onCategorySelect(category.name)}
                className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
              >
                <h3 className="font-semibold text-lg">{category.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{usageLabel(category.usageCount)}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* User Added Categories */}
      {userCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            💡 User Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userCategories.map((category) => (
              <motion.div key={category.id} className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onCategorySelect(category.name)}
                  className="card hover:shadow-lg transition-shadow cursor-pointer text-left w-full"
                >
                  <h3 className="font-semibold text-lg pr-6">{category.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{usageLabel(category.usageCount)}</p>
                </motion.button>
                {user && (
                  <CategoryMenu
                    category={category}
                    isOwner={category.createdBy === user.uid}
                    onDelete={() => handleDeleteCategory(category.id)}
                    onReport={(reason) => handleReportCategory(category.id, reason)}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {!loadError && categories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No categories available. Add one above!</p>
        </div>
      )}
    </div>
  )
}
