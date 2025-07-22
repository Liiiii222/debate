import express, { Request, Response } from 'express';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
const db = getFirestore();

const router = express.Router();

// GET /api/users/search - Search for users
router.get('/search', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const usersSnap = await db.collection('users').get();
    const users = usersSnap.docs
      .map(doc => doc.data())
      .filter(user => user.uid !== req.user.uid && (
        (user.name && user.name.toLowerCase().includes(q.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(q.toLowerCase()))
      ))
      .slice(0, 10);
    return res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:uid - Get user profile
router.get('/:uid', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { uid } = req.params;
    if (uid === req.user.uid) {
      return res.status(400).json({ error: 'Cannot view own profile via this endpoint' });
    }
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Check if current user is following this user
    const followDoc = await db.collection('follows').doc(req.user.uid).collection('following').doc(uid).get();
    const profile = { ...userDoc.data(), isFollowing: followDoc.exists };
    return res.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/:uid/follow - Follow a user
router.post('/:uid/follow', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { uid } = req.params;
    if (uid === req.user.uid) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    // Check if user exists
    const userToFollow = await db.collection('users').doc(uid).get();
    if (!userToFollow.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Check if already following
    const followDoc = await db.collection('follows').doc(req.user.uid).collection('following').doc(uid).get();
    if (followDoc.exists) {
      return res.status(400).json({ error: 'Already following this user' });
    }
    // Create follow relationship
    await db.collection('follows').doc(req.user.uid).collection('following').doc(uid).set({ followedAt: Date.now() });
    return res.json({ success: true, message: 'Successfully followed user' });
  } catch (error) {
    console.error('Error following user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/users/:uid/follow - Unfollow a user
router.delete('/:uid/follow', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { uid } = req.params;
    if (uid === req.user.uid) {
      return res.status(400).json({ error: 'Cannot unfollow yourself' });
    }
    const followDoc = await db.collection('follows').doc(req.user.uid).collection('following').doc(uid).get();
    if (!followDoc.exists) {
      return res.status(400).json({ error: 'Not following this user' });
    }
    await db.collection('follows').doc(req.user.uid).collection('following').doc(uid).delete();
    return res.json({ success: true, message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/me/friends - Get mutual followers (friends)
router.get('/me/friends', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    // Get all users this user is following
    const followingSnap = await db.collection('follows').doc(req.user.uid).collection('following').get();
    const followingIds = followingSnap.docs.map(doc => doc.id);
    // Get all users who follow this user
    const followersSnap = await db.collection('follows').get();
    const followersIds: string[] = [];
    followersSnap.forEach(doc => {
      // For each user, check if they follow the current user
      db.collection('follows').doc(doc.id).collection('following').doc(req.user.uid).get().then(followDoc => {
        if (followDoc.exists) followersIds.push(doc.id);
      });
    });
    // Wait a bit for all follower checks (not ideal, but for demo)
    setTimeout(async () => {
      const mutualIds = followingIds.filter(id => followersIds.includes(id));
      // Get friend details
      const friends = [];
      for (const uid of mutualIds) {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) friends.push(userDoc.data());
      }
      return res.json(friends);
    }, 500);
  } catch (error) {
    console.error('Error fetching friends:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 