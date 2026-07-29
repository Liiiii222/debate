import express, { Response } from 'express'
import { db } from '../config/firebaseAdmin'
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware'

const router = express.Router()

// GET /api/user/me
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.uid) { res.status(401).json({ success: false, error: 'Not authenticated' }); return }
    const doc = await db.collection('users').doc(req.user.uid).get()
    if (!doc.exists) { res.status(404).json({ success: false, error: 'User not found' }); return }
    const data = doc.data()!
    res.json({
      success: true,
      user: {
        uid: req.user.uid,
        name: data.name || '',
        email: data.email || '',
        age: data.age || null,
        country: data.country || '',
        languages: data.languages || [],
        profilePicture: data.profilePicture || '',
        followersCount: data.followersCount || 0,
        followingCount: data.followingCount || 0,
      }
    })
  } catch (err) {
    console.error('GET /user/me error:', err)
    res.status(500).json({ success: false, error: 'Failed to fetch user info' })
  }
})

// PUT /api/user/me
router.put('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.uid) { res.status(401).json({ success: false, error: 'Not authenticated' }); return }
    const { age, country, languages, profilePicture } = req.body
    const update: Record<string, any> = { updatedAt: new Date() }
    if (age !== undefined) update.age = age
    if (country !== undefined) update.country = country
    if (languages !== undefined) update.languages = languages
    if (profilePicture !== undefined) update.profilePicture = profilePicture
    await db.collection('users').doc(req.user.uid).set(update, { merge: true })
    const doc = await db.collection('users').doc(req.user.uid).get()
    const data = doc.data()!
    res.json({
      success: true,
      user: {
        uid: req.user.uid,
        name: data.name || '',
        email: data.email || '',
        age: data.age || null,
        country: data.country || '',
        languages: data.languages || [],
        profilePicture: data.profilePicture || '',
      }
    })
  } catch (err) {
    console.error('PUT /user/me error:', err)
    res.status(500).json({ success: false, error: 'Failed to update user info' })
  }
})

export default router
