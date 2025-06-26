import express, { Request, Response } from 'express'
import Topic from '../models/Topic'
import { validateTopic } from '../middleware/validation'

const router = express.Router()

// GET /api/topics - Get topics by category
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.query

    if (!category) {
      res.status(400).json({
        success: false,
        error: 'Category parameter is required'
      })
      return
    }

    const [trendingTopics, popularTopics, userTopics, defaultTopics] = await Promise.all([
      Topic.find({ category, trending: true }).sort({ usageCount: -1 }),
      Topic.getUserPopularByCategory(category as string),
      Topic.getUserTopicsByCategory(category as string),
      Topic.getDefaultByCategory(category as string)
    ])

    const topics = [
      ...trendingTopics,
      ...popularTopics,
      ...userTopics,
      ...defaultTopics
    ]

    res.json({
      success: true,
      topics: topics.map(topic => ({
        id: topic._id,
        name: topic.name,
        category: topic.category,
        source: topic.source,
        trending: topic.trending,
        usageCount: topic.usageCount
      }))
    })
  } catch (error) {
    console.error('Error fetching topics:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch topics'
    })
  }
})

// GET /api/topics/default - Get default topics by category
router.get('/default', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.query

    if (!category) {
      res.status(400).json({
        success: false,
        error: 'Category parameter is required'
      })
      return
    }

    const defaultTopics = await Topic.getDefaultByCategory(category as string)
    
    res.json({
      success: true,
      topics: defaultTopics.map(topic => ({
        id: topic._id,
        name: topic.name,
        category: topic.category,
        source: topic.source,
        trending: topic.trending,
        usageCount: topic.usageCount
      }))
    })
  } catch (error) {
    console.error('Error fetching default topics:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch default topics'
    })
  }
})

// GET /api/topics/popular - Get user-driven popular topics by category
router.get('/popular', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.query

    if (!category) {
      res.status(400).json({
        success: false,
        error: 'Category parameter is required'
      })
      return
    }

    const popularTopics = await Topic.getUserPopularByCategory(category as string)
    
    res.json({
      success: true,
      topics: popularTopics.map(topic => ({
        id: topic._id,
        name: topic.name,
        category: topic.category,
        source: topic.source,
        trending: topic.trending,
        usageCount: topic.usageCount
      }))
    })
  } catch (error) {
    console.error('Error fetching popular topics:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular topics'
    })
  }
})

// POST /api/topics - Create a new topic
router.post('/', validateTopic, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, category } = req.body

    // Check if topic already exists in this category
    const existingTopic = await Topic.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      category: { $regex: new RegExp(`^${category}$`, 'i') }
    })
    
    if (existingTopic) {
      res.status(400).json({
        success: false,
        error: 'Topic already exists in this category'
      })
      return
    }

    const topic = new Topic({
      name,
      category,
      source: 'user',
      trending: false,
      usageCount: 0
    })

    await topic.save()

    res.status(201).json({
      success: true,
      topic: {
        id: topic._id,
        name: topic.name,
        category: topic.category,
        source: topic.source,
        trending: topic.trending,
        usageCount: topic.usageCount
      }
    })
  } catch (error) {
    console.error('Error creating topic:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create topic'
    })
  }
})

// PUT /api/topics/:id/usage - Increment topic usage
router.put('/:id/usage', async (req: Request, res: Response): Promise<void> => {
  try {
    const topic = await Topic.findById(req.params.id)
    if (!topic) {
      res.status(404).json({
        success: false,
        error: 'Topic not found'
      })
      return
    }

    topic.incrementUsage()
    await topic.save()

    res.json({
      success: true,
      message: 'Usage count updated'
    })
  } catch (error) {
    console.error('Error updating topic usage:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update usage count'
    })
  }
})

// GET /api/topics/trending - Get trending topics
router.get('/trending', async (req: Request, res: Response): Promise<void> => {
  try {
    const trendingTopics = await Topic.getTrending()
    
    res.json({
      success: true,
      topics: trendingTopics.map(topic => ({
        id: topic._id,
        name: topic.name,
        category: topic.category,
        source: topic.source,
        trending: topic.trending,
        usageCount: topic.usageCount
      }))
    })
  } catch (error) {
    console.error('Error fetching trending topics:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending topics'
    })
  }
})

export default router 