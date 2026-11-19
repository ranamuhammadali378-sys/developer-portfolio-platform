import { Router, Response, NextFunction } from 'express';
import { requireAdmin, AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { db } from '../../config/firebase';
import { sendSuccess } from '../../utils/apiResponse';

const router = Router();

router.post(
  '/verify',
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const now = new Date().toISOString();
      await db.collection('users').doc(req.user!.uid).set(
        {
          email: req.user!.email,
          role: 'admin',
          lastLoginAt: now,
        },
        { merge: true }
      );
      return sendSuccess(res, { user: req.user }, 'Admin session verified');
    } catch (err) {
      next(err);
    }
  }
);

router.get('/me', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, { user: req.user }, 'Authenticated admin profile');
});

export default router;