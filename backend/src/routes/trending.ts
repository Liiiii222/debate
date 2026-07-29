import express, { Request, Response } from 'express'
import axios from 'axios'
import { db } from '../config/firebaseAdmin'

const router = express.Router()

// GET /api/trending/news - Get trending topics from NewsAPI
router.get('/news', async (_req: Request, res: Response): Promise<void> => {
  try {
    const newsApiKey = process.env.NEWS_API_KEY
    if (!newsApiKey) {
      res.json({ success: true, topics: [], message: 'NewsAPI key not configured' })
      return
    }

    const response = await axios.get(`https://newsapi.org/v2/top-headlines`, {
      params: { country: 'us', apiKey: newsApiKey, pageSize: 20 }
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

    res.json({ success: true, topics })
  } catch (error) {
    console.error('Error fetching news trends:', error)
    res.json({ success: true, topics: [], message: 'Unable to fetch news trends' })
  }
})

// GET /api/trending/reddit - Get trending topics from Reddit
router.get('/reddit', async (_req: Request, res: Response): Promise<void> => {
  try {
    const response = await axios.get('https://www.reddit.com/r/all/hot.json', {
      params: { limit: 20 },
      headers: { 'User-Agent': 'DebateApp/1.0' }
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

    res.json({ success: true, topics })
  } catch (error) {
    console.error('Error fetching Reddit trends:', error)
    res.json({ success: true, topics: [], message: 'Unable to fetch Reddit trends' })
  }
})

// GET /api/trending/twitter - Placeholder (no API access configured)
router.get('/twitter', async (_req: Request, res: Response): Promise<void> => {
  res.json({ success: true, topics: [], message: 'Twitter API integration requires authentication' })
})

// GET /api/trending/google - Placeholder (no API access configured)
router.get('/google', async (_req: Request, res: Response): Promise<void> => {
  res.json({ success: true, topics: [], message: 'Google Trends API integration requires setup' })
})

// GET /api/trending/all - Combine external trends with our own trending topics
router.get('/all', async (req: Request, res: Response): Promise<void> => {
  try {
    const [newsResponse, redditResponse] = await Promise.allSettled([
      axios.get(`${req.protocol}://${req.get('host')}/api/trending/news`),
      axios.get(`${req.protocol}://${req.get('host')}/api/trending/reddit`)
    ])

    const allTopics: any[] = []

    if (newsResponse.status === 'fulfilled' && newsResponse.value.data.success) {
      allTopics.push(...newsResponse.value.data.topics)
    }
    if (redditResponse.status === 'fulfilled' && redditResponse.value.data.success) {
      allTopics.push(...redditResponse.value.data.topics)
    }

    // Also include trending topics already stored in our own database
    const dbSnap = await db.collection('topics').where('trending', '==', true).get()
    const dbTopics = dbSnap.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name,
        category: data.category,
        source: data.source,
        trending: data.trending,
        usageCount: data.usageCount
      }
    })

    allTopics.push(...dbTopics)

    res.json({ success: true, topics: allTopics.slice(0, 50) })
  } catch (error) {
    console.error('Error fetching all trending topics:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch trending topics' })
  }
})

// POST /api/trending/sync - Save current trending topics into our database
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
        const existingSnap = await db.collection('topics').get()
        const nameLower = (topic.name || '').toLowerCase()
        const existingDoc = existingSnap.docs.find(doc => (doc.data().name || '').toLowerCase() === nameLower)

        if (!existingDoc) {
          await db.collection('topics').add({
            name: topic.name,
            category: topic.category || 'General',
            source: topic.source,
            trending: true,
            usageCount: topic.usageCount || 0
          })
          syncResults.push({ name: topic.name, status: 'created' })
        } else {
          await existingDoc.ref.update({ trending: true })
          syncResults.push({ name: topic.name, status: 'updated' })
        }
      } catch (error: any) {
        syncResults.push({ name: topic.name, status: 'error', error: error?.message || 'Unknown error' })
      }
    }

    res.json({ success: true, message: 'Trending topics synced', results: syncResults })
  } catch (error) {
    console.error('Error syncing trending topics:', error)
    res.status(500).json({ success: false, error: 'Failed to sync trending topics' })
  }
})

export default router
