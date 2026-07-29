import express, { Request, Response } from 'express'
import { db } from '../config/firebaseAdmin'
import { validateCategory } from '../middleware/validation'
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware'

const router = express.Router()

// Once a user-added category is used by this many people, it's considered
// "community property" - the creator can no longer delete it, only report it.
const DELETE_PROTECTION_THRESHOLD = 10

type CategoryDoc = {
  name: string
  source: 'default' | 'user' | 'external'
  trending: boolean
  usageCount: number
  createdBy?: string
}

function formatCategory(id: string, data: CategoryDoc) {
  return {
    id,
    name: data.name,
    source: data.source,
    trending: data.trending,
    usageCount: data.usageCount,
    createdBy: data.createdBy || null
  }
}

// GET /api/categories - Get all categories
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const snap = await db.collection('categories').get()
    const categories = snap.docs.map(doc => formatCategory(doc.id, doc.data() as CategoryDoc))
    res.json({ success: true, categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch categories' })
  }
})

// GET /api/categories/default - Get default categories only
router.get('/default', async (_req: Request, res: Response): Promise<void> => {
  try {
    const snap = await db.collection('categories').where('source', '==', 'default').get()
    const categories = snap.docs.map(doc => formatCategory(doc.id, doc.data() as CategoryDoc))
    res.json({ success: true, categories })
  } catch (error) {
    console.error('Error fetching default categories:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch default categories' })
  }
})

// GET /api/categories/popular - Get user-driven popular categories only
router.get('/popular', async (_req: Request, res: Response): Promise<void> => {
  try {
    const snap = await db.collection('categories')
      .where('source', '==', 'user')
      .orderBy('usageCount', 'desc')
      .limit(20)
      .get()
    const categories = snap.docs.map(doc => formatCategory(doc.id, doc.data() as CategoryDoc))
    res.json({ success: true, categories })
  } catch (error) {
    console.error('Error fetching popular categories:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch popular categories' })
  }
})

// GET /api/categories/trending - Get trending categories
router.get('/trending', async (_req: Request, res: Response): Promise<void> => {
  try {
    const snap = await db.collection('categories').where('trending', '==', true).get()
    const categories = snap.docs.map(doc => formatCategory(doc.id, doc.data() as CategoryDoc))
    res.json({ success: true, categories })
  } catch (error) {
    console.error('Error fetching trending categories:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch trending categories' })
  }
})

// POST /api/categories - Create a new category (requires login, tracks who made it)
router.post('/', authMiddleware, validateCategory, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.uid) {
      res.status(401).json({ success: false, error: 'User not authenticated' })
      return
    }
    const { name } = req.body

    const existingSnap = await db.collection('categories').get()
    const nameLower = name.toLowerCase()
    const alreadyExists = existingSnap.docs.some(doc => (doc.data().name || '').toLowerCase() === nameLower)

    if (alreadyExists) {
      res.status(400).json({ success: false, error: 'Category already exists' })
      return
    }

    const newCategory: CategoryDoc = {
      name,
      source: 'user',
      trending: false,
      usageCount: 0,
      createdBy: req.user.uid
    }

    const docRef = await db.collection('categories').add(newCategory)

    res.status(201).json({ success: true, category: formatCategory(docRef.id, newCategory) })
  } catch (error) {
    console.error('Error creating category:', error)
    res.status(500).json({ success: false, error: 'Failed to create category' })
  }
})

// PUT /api/categories/:id/usage - Increment category usage
router.put('/:id/usage', async (req: Request, res: Response): Promise<void> => {
  try {
    const docRef = db.collection('categories').doc(req.params.id)
    const doc = await docRef.get()

    if (!doc.exists) {
      res.status(404).json({ success: false, error: 'Category not found' })
      return
    }

    const data = doc.data() as CategoryDoc
    await docRef.update({ usageCount: (data.usageCount || 0) + 1 })

    res.json({ success: true, message: 'Usage count updated' })
  } catch (error) {
    console.error('Error updating category usage:', error)
    res.status(500).json({ success: false, error: 'Failed to update usage count' })
  }
})

// DELETE /api/categories/:id - Delete a user-added category
// Only the original creator can delete it, and only while it's still
// below the usage threshold. Default categories can never be deleted.
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.uid) {
      res.status(401).json({ success: false, error: 'User not authenticated' })
      return
    }

    const docRef = db.collection('categories').doc(req.params.id)
    const doc = await docRef.get()

    if (!doc.exists) {
      res.status(404).json({ success: false, error: 'Category not found' })
      return
    }

    const data = doc.data() as CategoryDoc

    if (data.source === 'default') {
      res.status(403).json({ success: false, error: 'Default categories cannot be deleted' })
      return
    }

    if (data.createdBy !== req.user.uid) {
      res.status(403).json({ success: false, error: 'Only the creator can delete this category' })
      return
    }

    if ((data.usageCount || 0) >= DELETE_PROTECTION_THRESHOLD) {
      res.status(403).json({
        success: false,
        error: 'This category is being used by too many people to delete. You can report it instead.'
      })
      return
    }

    await docRef.delete()
    res.json({ success: true, message: 'Category deleted' })
  } catch (error) {
    console.error('Error deleting category:', error)
    res.status(500).json({ success: false, error: 'Failed to delete category' })
  }
})

// POST /api/categories/:id/report - Report a category for review
router.post('/:id/report', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.uid) {
      res.status(401).json({ success: false, error: 'User not authenticated' })
      return
    }

    const docRef = db.collection('categories').doc(req.params.id)
    const doc = await docRef.get()

    if (!doc.exists) {
      res.status(404).json({ success: false, error: 'Category not found' })
      return
    }

    const { reason } = req.body

    await db.collection('categoryReports').add({
      categoryId: req.params.id,
      categoryName: (doc.data() as CategoryDoc).name,
      reportedBy: req.user.uid,
      reason: reason || 'No reason provided',
      createdAt: new Date()
    })

    res.json({ success: true, message: 'Category reported for review' })
  } catch (error) {
    console.error('Error reporting category:', error)
    res.status(500).json({ success: false, error: 'Failed to report category' })
  }
})

export default router
