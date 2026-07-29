import express, { Request, Response } from 'express'
import { db } from '../config/firebaseAdmin'
import { validateTopic } from '../middleware/validation'
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware'

const router = express.Router()

// Must match the same threshold used for categories
const DELETE_PROTECTION_THRESHOLD = 10

type TopicDoc = {
  name: string
  category: string
  source: 'default' | 'user' | 'external'
  trending: boolean
  usageCount: number
  createdBy?: string
}

function formatTopic(id: string, data: TopicDoc) {
  return {
    id,
    name: data.name,
    category: data.category,
    source: data.source,
    trending: data.trending,
    usageCount: data.usageCount,
    createdBy: data.createdBy || null
  }
}

// GET /api/topics?category=... - Get topics by category
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.query

    if (!category || typeof category !== 'string') {
      res.status(400).json({ success: false, error: 'Category parameter is required' })
      return
    }

    const snap = await db.collection('topics').where('category', '==', category).get()
    const topics = snap.docs.map(doc => formatTopic(doc.id, doc.data() as TopicDoc))
    res.json({ success: true, topics })
  } catch (error) {
    console.error('Error fetching topics:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch topics' })
  }
})

// GET /api/topics/default?category=... - Get default topics by category
router.get('/default', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.query

    if (!category || typeof category !== 'string') {
      res.status(400).json({ success: false, error: 'Category parameter is required' })
      return
    }

    const snap = await db.collection('topics')
      .where('category', '==', category)
      .where('source', '==', 'default')
      .get()
    const topics = snap.docs.map(doc => formatTopic(doc.id, doc.data() as TopicDoc))
    res.json({ success: true, topics })
  } catch (error) {
    console.error('Error fetching default topics:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch default topics' })
  }
})

// GET /api/topics/popular?category=... - Get user-driven popular topics by category
router.get('/popular', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.query

    if (!category || typeof category !== 'string') {
      res.status(400).json({ success: false, error: 'Category parameter is required' })
      return
    }

    const snap = await db.collection('topics')
      .where('category', '==', category)
      .where('source', '==', 'user')
      .orderBy('usageCount', 'desc')
      .limit(20)
      .get()
    const topics = snap.docs.map(doc => formatTopic(doc.id, doc.data() as TopicDoc))
    res.json({ success: true, topics })
  } catch (error) {
    console.error('Error fetching popular topics:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch popular topics' })
  }
})

// GET /api/topics/trending - Get trending topics (across all categories)
router.get('/trending', async (_req: Request, res: Response): Promise<void> => {
  try {
    const snap = await db.collection('topics').where('trending', '==', true).get()
    const topics = snap.docs.map(doc => formatTopic(doc.id, doc.data() as TopicDoc))
    res.json({ success: true, topics })
  } catch (error) {
    console.error('Error fetching trending topics:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch trending topics' })
  }
})

// POST /api/topics - Create a new topic (requires login, tracks who made it)
router.post('/', authMiddleware, validateTopic, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.uid) {
      res.status(401).json({ success: false, error: 'User not authenticated' })
      return
    }
    const { name, category } = req.body

    const existingSnap = await db.collection('topics').where('category', '==', category).get()
    const nameLower = name.toLowerCase()
    const alreadyExists = existingSnap.docs.some(doc => (doc.data().name || '').toLowerCase() === nameLower)

    if (alreadyExists) {
      res.status(400).json({ success: false, error: 'Topic already exists in this category' })
      return
    }

    const newTopic: TopicDoc = {
      name,
      category,
      source: 'user',
      trending: false,
      usageCount: 0,
      createdBy: req.user.uid
    }

    const docRef = await db.collection('topics').add(newTopic)

    res.status(201).json({ success: true, topic: formatTopic(docRef.id, newTopic) })
  } catch (error) {
    console.error('Error creating topic:', error)
    res.status(500).json({ success: false, error: 'Failed to create topic' })
  }
})

// PUT /api/topics/:id/usage - Increment topic usage
router.put('/:id/usage', async (req: Request, res: Response): Promise<void> => {
  try {
    const docRef = db.collection('topics').doc(req.params.id)
    const doc = await docRef.get()

    if (!doc.exists) {
      res.status(404).json({ success: false, error: 'Topic not found' })
      return
    }

    const data = doc.data() as TopicDoc
    await docRef.update({ usageCount: (data.usageCount || 0) + 1 })

    res.json({ success: true, message: 'Usage count updated' })
  } catch (error) {
    console.error('Error updating topic usage:', error)
    res.status(500).json({ success: false, error: 'Failed to update usage count' })
  }
})

// DELETE /api/topics/:id - Delete a user-added topic
// Only the original creator can delete it, and only while below the usage threshold.
// Default topics can never be deleted.
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.uid) {
      res.status(401).json({ success: false, error: 'User not authenticated' })
      return
    }

    const docRef = db.collection('topics').doc(req.params.id)
    const doc = await docRef.get()

    if (!doc.exists) {
      res.status(404).json({ success: false, error: 'Topic not found' })
      return
    }

    const data = doc.data() as TopicDoc

    if (data.source === 'default') {
      res.status(403).json({ success: false, error: 'Default topics cannot be deleted' })
      return
    }

    if (data.createdBy !== req.user.uid) {
      res.status(403).json({ success: false, error: 'Only the creator can delete this topic' })
      return
    }

    if ((data.usageCount || 0) >= DELETE_PROTECTION_THRESHOLD) {
      res.status(403).json({
        success: false,
        error: 'This topic is being used by too many people to delete. You can report it instead.'
      })
      return
    }

    await docRef.delete()
    res.json({ success: true, message: 'Topic deleted' })
  } catch (error) {
    console.error('Error deleting topic:', error)
    res.status(500).json({ success: false, error: 'Failed to delete topic' })
  }
})

// POST /api/topics/:id/report - Report a topic for review
router.post('/:id/report', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.uid) {
      res.status(401).json({ success: false, error: 'User not authenticated' })
      return
    }

    const docRef = db.collection('topics').doc(req.params.id)
    const doc = await docRef.get()

    if (!doc.exists) {
      res.status(404).json({ success: false, error: 'Topic not found' })
      return
    }

    const { reason } = req.body

    await db.collection('topicReports').add({
      topicId: req.params.id,
      topicName: (doc.data() as TopicDoc).name,
      reportedBy: req.user.uid,
      reason: reason || 'No reason provided',
      createdAt: new Date()
    })

    res.json({ success: true, message: 'Topic reported for review' })
  } catch (error) {
    console.error('Error reporting topic:', error)
    res.status(500).json({ success: false, error: 'Failed to report topic' })
  }
})

export default router
