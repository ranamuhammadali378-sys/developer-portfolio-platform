import { Router, Request, Response, NextFunction } from 'express';
import { updateSiteSettingsSchema } from '@portfolio/shared';
import { db } from '../../config/firebase';
import { requireAdmin, AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validate.middleware';
import { logAdminActivity } from '../../utils/audit.helper';
import { triggerFrontendRevalidation } from '../../utils/revalidate.helper';
import { sendSuccess } from '../../utils/apiResponse';

const router = Router();
const settingsDoc = () => db.collection('site_settings').doc('global');

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const snap = await settingsDoc().get();
    return sendSuccess(res, snap.data() || {}, 'Site settings retrieved');
  } catch (err) {
    next(err);
  }
});

router.put(
  '/',
  requireAdmin,
  validateBody(updateSiteSettingsSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const payload = { ...req.body, updatedAt: new Date().toISOString() };
      await settingsDoc().set(payload, { merge: true });

      await logAdminActivity({
        actorEmail: req.user!.email,
        action: 'UPDATE',
        resourceType: 'site_settings',
        resourceId: 'global',
        summary: 'Updated SEO metadata & section visibility settings',
      });
      await triggerFrontendRevalidation(['/']);

      return sendSuccess(res, payload, 'Site settings updated');
    } catch (err) {
      next(err);
    }
  }
);

export default router;