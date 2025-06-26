import express, { Request, Response } from 'express'
import Category from '../models/Category'
import { validateCategory } from '../middleware/validation'

const router = express.Router()

// GET /api/categories - Get all categories
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const [trendingCategories, popularCategories, userCategories, defaultCategories] = await Promise.all([
      Category.getTrending(),
      Category.getPopular(),
      Category.getUserCategories(),
      Category.getDefault()
    ])

    const categories = [
      ...trendingCategories,
      ...popularCategories,
      ...userCategories,
      ...defaultCategories
    ]

    res.json({
      success: true,
      categories: categories.map(cat => ({
        id: cat._id,
        name: cat.name,
        source: cat.source,
        trending: cat.trending,
        usageCount: cat.usageCount
      }))
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    })
  }
})

// GET /api/categories/default - Get default categories only
router.get('/default', async (req: Request, res: Response): Promise<void> => {
  try {
    const defaultCategories = await Category.getDefault()
    
    res.json({
      success: true,
      categories: defaultCategories.map(cat => ({
        id: cat._id,
        name: cat.name,
        source: cat.source,
        trending: cat.trending,
        usageCount: cat.usageCount
      }))
    })
  } catch (error) {
    console.error('Error fetching default categories:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch default categories'
    })
  }
})

// GET /api/categories/popular - Get user-driven popular categories only
router.get('/popular', async (req: Request, res: Response): Promise<void> => {
  try {
    const popularCategories = await Category.getUserPopular()
    
    res.json({
      success: true,
      categories: popularCategories.map(cat => ({
        id: cat._id,
        name: cat.name,
        source: cat.source,
        trending: cat.trending,
        usageCount: cat.usageCount
      }))
    })
  } catch (error) {
    console.error('Error fetching popular categories:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular categories'
    })
  }
})

// POST /api/categories - Create a new category
router.post('/', validateCategory, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body

    // Check if category already exists
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } })
    if (existingCategory) {
      res.status(400).json({
        success: false,
        error: 'Category already exists'
      })
      return
    }

    const category = new Category({
      name,
      source: 'user',
      trending: false,
      usageCount: 0
    })

    await category.save()

    res.status(201).json({
      success: true,
      category: {
        id: category._id,
        name: category.name,
        source: category.source,
        trending: category.trending,
        usageCount: category.usageCount
      }
    })
  } catch (error) {
    console.error('Error creating category:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create category'
    })
  }
})

// PUT /api/categories/:id/usage - Increment category usage
router.put('/:id/usage', async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Category not found'
      })
      return
    }

    category.incrementUsage()
    await category.save()

    res.json({
      success: true,
      message: 'Usage count updated'
    })
  } catch (error) {
    console.error('Error updating category usage:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update usage count'
    })
  }
})

// GET /api/categories/trending - Get trending categories
router.get('/trending', async (req: Request, res: Response): Promise<void> => {
  try {
    const trendingCategories = await Category.getTrending()
    
    res.json({
      success: true,
      categories: trendingCategories.map(cat => ({
        id: cat._id,
        name: cat.name,
        source: cat.source,
        trending: cat.trending,
        usageCount: cat.usageCount
      }))
    })
  } catch (error) {
    console.error('Error fetching trending categories:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending categories'
    })
  }
})

export default router 