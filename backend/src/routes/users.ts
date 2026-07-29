import express, { Response } from 'express'
import { db } from '../config/firebaseAdmin'
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware'

const router = express.Router()

// GET /api/users/search?q=...
// Searches name, displayName, AND email so accounts are found regardless of which field signup used
router.get('/search', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { q } = req.query
    if (!q || typeof q !== 'string' || q.trim().length < 1) {
      res.status(400).json({ success: false, error: 'Query required' }); return
    }
    const snap = await db.collection('users').get()
    const query = q.toLowerCase().trim()
    const results = snap.docs
      .map(doc => ({ uid: doc.id, ...doc.data() }))
      .filter((u: any) => {
        if (u.uid === req.user?.uid) return false
        const name = (u.name || u.displayName || '').toLowerCase()
        const email = (u.email || '').toLowerCase()
        return name.includes(query) || email.includes(query)
      })
      .slice(0, 20)
      .map((u: any) => ({
        uid: u.uid,
        name: u.name || u.displayName || '',
        email: u.email || '',
        country: u.country || '',
        profilePicture: u.profilePicture || ''
      }))
    res.json({ success: true, users: results })
  } catch (err) {
    console.error('Search error:', err)
    res.status(500).json({ success: false, error: 'Search failed' })
  }
})

// GET /api/users/me/friends
router.get('/me/friends', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.uid) { res.status(401).json({ success: false, error: 'Not authenticated' }); return }
    await new Promise(r => setTimeout(r, 500))
    const myDoc = await db.collection('users').doc(req.user.uid).get()
    const myData = myDoc.data() || {}
    const following: string[] = myData.following || []
    const followers: string[] = myData.followers || []
    const mutualUids = following.filter(uid => followers.includes(uid))
    if (mutualUids.length === 0) { res.json({ success: true, friends: [] }); return }
    const friendDocs = await Promise.all(mutualUids.map(uid => db.collection('users').doc(uid).get()))
    const friends = friendDocs.filter(d => d.exists).map(d => {
      const data = d.data()!
      return {
        uid: d.id,
        name: data.name || data.displayName || '',
        country: data.country || '',
        languages: data.languages || [],
        profilePicture: data.profilePicture || '',
        age: data.age || null
      }
    })
    res.json({ success: true, friends })
  } catch (err) {
    console.error('Friends error:', err)
    res.status(500).json({ success: false, error: 'Failed to fetch friends' })
  }
})

// GET /api/users/:uid — public profile
router.get('/:uid', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { uid } = req.params
    const [userDoc, myDoc] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('users').doc(req.user!.uid).get()
    ])
    if (!userDoc.exists) { res.status(404).json({ success: false, error: 'User not found' }); return }
    const data = userDoc.data()!
    const myData = myDoc.data() || {}
    const myFollowing: string[] = myData.following || []
    const followers: string[] = data.followers || []
    const following: string[] = data.following || []
    res.json({
      success: true,
      user: {
        uid,
        name: data.name || data.displayName || '',
        country: data.country || '',
        languages: data.languages || [],
        profilePicture: data.profilePicture || '',
        age: data.age || null,
        bio: data.bio || '',
        followersCount: followers.length,
        followingCount: following.length,
        followers,
        following,
        isFollowedByMe: myFollowing.includes(uid),
      }
    })
  } catch (err) {
    console.error('Get user error:', err)
    res.status(500).json({ success: false, error: 'Failed to fetch user' })
  }
})

// POST /api/users/:uid/follow — toggle follow
router.post('/:uid/follow', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.uid) { res.status(401).json({ success: false, error: 'Not authenticated' }); return }
    const { uid } = req.params
    if (uid === req.user.uid) { res.status(400).json({ success: false, error: 'Cannot follow yourself' }); return }
    const [myDoc, theirDoc] = await Promise.all([
      db.collection('users').doc(req.user.uid).get(),
      db.collection('users').doc(uid).get()
    ])
    if (!theirDoc.exists) { res.status(404).json({ success: false, error: 'User not found' }); return }
    const myFollowing: string[] = myDoc.data()?.following || []
    const theirFollowers: string[] = theirDoc.data()?.followers || []
    const batch = db.batch()
    const myRef = db.collection('users').doc(req.user.uid)
    const theirRef = db.collection('users').doc(uid)
    if (myFollowing.includes(uid)) {
      batch.update(myRef, { following: myFollowing.filter(u => u !== uid) })
      batch.update(theirRef, { followers: theirFollowers.filter(u => u !== req.user!.uid) })
      await batch.commit()
      res.json({ success: true, action: 'unfollowed' })
    } else {
      batch.update(myRef, { following: [...myFollowing, uid] })
      batch.update(theirRef, { followers: [...theirFollowers, req.user.uid] })
      await batch.commit()
      res.json({ success: true, action: 'followed' })
    }
  } catch (err) {
    console.error('Follow error:', err)
    res.status(500).json({ success: false, error: 'Failed to follow/unfollow' })
  }
})

// POST /api/users/:uid/report
router.post('/:uid/report', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.uid) { res.status(401).json({ success: false, error: 'Not authenticated' }); return }
    const { uid } = req.params
    const { reason } = req.body
    await db.collection('userReports').add({
      reportedUid: uid,
      reportedBy: req.user.uid,
      reason: reason || 'No reason provided',
      createdAt: new Date()
    })
    res.json({ success: true, message: 'Report submitted' })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to report user' })
  }
})

export default router
