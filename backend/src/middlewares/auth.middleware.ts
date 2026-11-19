import { Request, Response, NextFunction } from 'express';
import { auth, db } from '../config/firebase';
import { AppError } from '../utils/AppError';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
  };
}

export async function requireAdmin(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError('Authentication token missing', 401, 'UNAUTHORIZED');
    }

    const idToken = header.split('Bearer ')[1];
    const decoded = await auth.verifyIdToken(idToken);

    let role = decoded.role as string | undefined;

    if (role !== 'admin') {
      const userDoc = await db.collection('users').doc(decoded.uid).get();
      if (userDoc.exists && userDoc.data()?.role === 'admin') {
        role = 'admin';
      }
    }

    if (role !== 'admin') {
      throw new AppError('Forbidden: Admin privileges required', 403, 'FORBIDDEN');
    }

    req.user = {
      uid: decoded.uid,
      email: decoded.email || 'admin@portfolio.local',
      role: 'admin',
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('Invalid or expired authentication token', 401, 'INVALID_TOKEN'));
  }
}

export async function optionalAdmin(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }
  try {
    const idToken = header.split('Bearer ')[1];
    const decoded = await auth.verifyIdToken(idToken);
    if (decoded.role === 'admin') {
      req.user = {
        uid: decoded.uid,
        email: decoded.email || 'admin@portfolio.local',
        role: 'admin',
      };
    }
  } catch {
    // Proceed as unauthenticated public viewer
  }
  next();
}