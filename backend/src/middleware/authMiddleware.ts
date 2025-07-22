import { Request, Response, NextFunction } from 'express';
import admin from '../config/firebaseAdmin';

// Type augmentation for Express.Request
declare global {
  namespace Express {
    interface Request {
      user?: { uid: string };
    }
  }
}

// Export AuthenticatedRequest type
export interface AuthenticatedRequest extends Request {
  user?: { uid: string };
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Missing or invalid Authorization header' });
    return;
  }
  const idToken = authHeader.split(' ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = { uid: decodedToken.uid };
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
    return;
  }
} 