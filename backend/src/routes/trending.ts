import express, { Request, Response } from 'express'
import axios from 'axios'
import Category from '../models/Category'
import Topic from '../models/Topic'

const router = express.Router()

// GET /api/trending/news - Get trending topics from NewsAPI
router.get('/news', async (req: Request, res: Response): Promise<void> => {
  try {
    const newsApiKey = process.env.NEWS_API_KEY
    if (!newsApiKey) {
      res.json({
        success: true,
        topics: [],
        message: 'NewsAPI key not configured'
      })
      return
    }

    const response = await axios.get(`https://newsapi.org/v2/top-headlines`, {
      params: {
        country: 'us',
        apiKey: newsApiKey,
        pageSize: 20
      }
    })

    const topics = response.data.articles
      .slice(0, 10)
      .map((article: any, index: number) => ({
        id: `news-${index}`,
        name: article.title,
        category: 'News',
        source: 'external' as const,
        trending: true,
        usageCount: 0
      }))

    res.json({
      success: true,
      topics
    })
  } catch (error) {
    console.error('Error fetching news trends:', error)
    res.json({
      success: true,
      topics: [],
      message: 'Unable to fetch news trends'
    })
  }
})

// GET /api/trending/reddit - Get trending topics from Reddit
router.get('/reddit', async (req: Request, res: Response): Promise<void> => {
  try {
    const response = await axios.get('https://www.reddit.com/r/all/hot.json', {
      params: {
        limit: 20
      },
      headers: {
        'User-Agent': 'DebateApp/1.0'
      }
    })

    const topics = response.data.data.children
      .slice(0, 10)
      .map((post: any, index: number) => ({
        id: `reddit-${index}`,
        name: post.data.title,
        category: 'Social Media',
        source: 'external' as const,
        trending: true,
        usageCount: 0
      }))

    res.json({
      success: true,
      topics
    })
  } catch (error) {
    console.error('Error fetching Reddit trends:', error)
    res.json({
      success: true,
      topics: [],
      message: 'Unable to fetch Reddit trends'
    })
  }
})

// GET /api/trending/twitter - Get trending topics from Twitter (placeholder)
router.get('/twitter', async (req: Request, res: Response): Promise<void> => {
  try {
    // Note: Twitter API v2 requires authentication and approval
    // This is a placeholder implementation
    res.json({
      success: true,
      topics: [],
      message: 'Twitter API integration requires authentication'
    })
  } catch (error) {
    console.error('Error fetching Twitter trends:', error)
    res.json({
      success: true,
      topics: [],
      message: 'Unable to fetch Twitter trends'
    })
  }
})

// GET /api/trending/google - Get trending topics from Google Trends (placeholder)
router.get('/google', async (req: Request, res: Response): Promise<void> => {
  try {
    // Note: Google Trends API requires special setup
    // This is a placeholder implementation
    res.json({
      success: true,
      topics: [],
      message: 'Google Trends API integration requires setup'
    })
  } catch (error) {
    console.error('Error fetching Google trends:', error)
    res.json({
      success: true,
      topics: [],
      message: 'Unable to fetch Google trends'
    })
  }
})

// GET /api/trending/all - Get all trending topics from external sources
router.get('/all', async (req: Request, res: Response): Promise<void> => {
  try {
    const [newsResponse, redditResponse] = await Promise.allSettled([
      axios.get(`${req.protocol}://${req.get('host')}/api/trending/news`),
      axios.get(`${req.protocol}://${req.get('host')}/api/trending/reddit`)
    ])

    const allTopics = []

    if (newsResponse.status === 'fulfilled' && newsResponse.value.data.success) {
      allTopics.push(...newsResponse.value.data.topics)
    }

    if (redditResponse.status === 'fulfilled' && redditResponse.value.data.success) {
      allTopics.push(...redditResponse.value.data.topics)
    }

    // Also get trending topics from our database
    const dbTrendingTopics = await Topic.getTrending()
    const dbTopics = dbTrendingTopics.map(topic => ({
      id: (topic._id as any).toString(),
      name: topic.name,
      category: topic.category,
      source: topic.source,
      trending: topic.trending,
      usageCount: topic.usageCount
    }))

    allTopics.push(...dbTopics)

    res.json({
      success: true,
      topics: allTopics.slice(0, 50) // Limit to 50 topics
    })
  } catch (error) {
    console.error('Error fetching all trending topics:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending topics'
    })
  }
})

// POST /api/trending/sync - Sync trending topics to database
router.post('/sync', async (req: Request, res: Response): Promise<void> => {
  try {
    const response = await axios.get(`${req.protocol}://${req.get('host')}/api/trending/all`)
    
    if (!response.data.success) {
      throw new Error('Failed to fetch trending topics')
    }

    const topics = response.data.topics
    const syncResults = []

    for (const topic of topics) {
      try {
        // Check if topic already exists
        const existingTopic = await Topic.findOne({ 
          name: { $regex: new RegExp(`^${topic.name}$`, 'i') }
        })

        if (!existingTopic) {
          const newTopic = new Topic({
            name: topic.name,
            category: topic.category || 'General',
            source: topic.source,
            trending: topic.trending,
            usageCount: topic.usageCount || 0
          })

          await newTopic.save()
          syncResults.push({ name: topic.name, status: 'created' })
        } else {
          // Update existing topic to be trending
          existingTopic.trending = true
          await existingTopic.save()
          syncResults.push({ name: topic.name, status: 'updated' })
        }
      } catch (error: any) {
        syncResults.push({ 
          name: topic.name, 
          status: 'error', 
          error: error?.message || 'Unknown error' 
        })
      }
    }

    res.json({
      success: true,
      message: 'Trending topics synced',
      results: syncResults
    })
  } catch (error) {
    console.error('Error syncing trending topics:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to sync trending topics'
    })
  }
})

export default router 