import { Request, Response, NextFunction, Router } from 'express';
import User from '../models/User';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user?: { uid: string };
}

// GET /api/user/me
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized: user missing' });
  }
  const { uid } = req.user;
  console.log('Decoded UID:', uid);
  const user = await User.findOne({ uid });
  console.log('Fetched user:', user);
  if (!user) {
    console.log('No profile found, returning 404');
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }
  const response = {
    success: true,
    user: {
      age: user.age ?? null,
      country: user.country ?? null,
      language: user.language ?? null
    }
  };
  console.log('GET /api/user/me response:', response);
  return res.status(200).json(response);
});

// PUT /api/user/me
router.put('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized: user missing' });
  }
  const { uid } = req.user;
  let user = await User.findOne({ uid });
  if (!user) {
    user = await User.create({ uid });
  }
  const { age, country, language } = req.body;
  if (age !== undefined) user.age = age;
  if (country !== undefined) user.country = country;
  if (language !== undefined) user.language = language;
  await user.save();
  return res.status(200).json({
    success: true,
    user: {
      age: user.age ?? null,
      country: user.country ?? null,
      language: user.language ?? null
    }
  });
});

export default router; 