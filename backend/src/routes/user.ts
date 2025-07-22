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

// GET /api/user/me - Get current user's profile
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(userDoc.data());
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/user/me - Update current user's profile
router.put('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const updateData = req.body;
    await db.collection('users').doc(req.user.uid).set(updateData, { merge: true });
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    return res.json(userDoc.data());
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
