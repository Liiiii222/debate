'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface Category {
  id: string
  name: string
  source: 'external' | 'user' | 'popular'
  trending?: boolean
}

interface CategorySelectionProps {
  onCategorySelect: (category: string) => void
  onBack: () => void
}

export default function CategorySelection({ onCategorySelect, onBack }: CategorySelectionProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newCategory, setNewCategory] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
      } else {
        // Fallback to default categories if API is not available
        setCategories([
          { id: '1', name: 'Politics', source: 'popular', trending: true },
          { id: '2', name: 'Technology', source: 'popular', trending: true },
          { id: '3', name: 'Environment', source: 'popular', trending: true },
          { id: '4', name: 'Healthcare', source: 'popular' },
          { id: '5', name: 'Education', source: 'popular' },
          { id: '6', name: 'Economy', source: 'popular' },
          { id: '7', name: 'Social Issues', source: 'popular' },
          { id: '8', name: 'Science', source: 'popular' },
        ])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Fallback to default categories
      setCategories([
        { id: '1', name: 'Politics', source: 'popular', trending: true },
        { id: '2', name: 'Technology', source: 'popular', trending: true },
        { id: '3', name: 'Environment', source: 'popular', trending: true },
        { id: '4', name: 'Healthcare', source: 'popular' },
        { id: '5', name: 'Education', source: 'popular' },
        { id: '6', name: 'Economy', source: 'popular' },
        { id: '7', name: 'Social Issues', source: 'popular' },
        { id: '8', name: 'Science', source: 'popular' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCategory }),
      })

      if (response.ok) {
        const data = await response.json()
        setCategories(prev => [...prev, data.category])
        setNewCategory('')
        setShowAddForm(false)
      }
    } catch (error) {
      console.error('Error adding category:', error)
      // Add locally if API fails
      const newCat: Category = {
        id: Date.now().toString(),
        name: newCategory,
        source: 'user'
      }
      setCategories(prev => [...prev, newCat])
      setNewCategory('')
      setShowAddForm(false)
    }
  }

  const trendingCategories = categories.filter(cat => cat.trending)
  const popularCategories = categories.filter(cat => cat.source === 'popular' && !cat.trending)
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
        </motion.div>
      )}

      {/* Trending Categories from External APIs */}
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
                <p className="text-sm text-gray-500 mt-1">Trending now</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Popular Categories */}
      {popularCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            📈 Popular Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularCategories.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onCategorySelect(category.name)}
                className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
              >
                <h3 className="font-semibold text-lg">{category.name}</h3>
                <p className="text-sm text-gray-500 mt-1">Frequently debated</p>
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
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onCategorySelect(category.name)}
                className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
              >
                <h3 className="font-semibold text-lg">{category.name}</h3>
                <p className="text-sm text-gray-500 mt-1">User created</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {categories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No categories available. Add one above!</p>
        </div>
      )}
    </div>
  )
} 