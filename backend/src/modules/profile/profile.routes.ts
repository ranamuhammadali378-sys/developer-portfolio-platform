import { Router, Request, Response, NextFunction } from 'express';
import { updateProfileSchema } from '@portfolio/shared';
import { db } from '../../config/firebase';
import { requireAdmin, AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validate.middleware';
import { uploadImage } from '../../middlewares/upload.middleware';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../../utils/cloudinary.helper';
import { logAdminActivity } from '../../utils/audit.helper';
import { triggerFrontendRevalidation } from '../../utils/revalidate.helper';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';

const router = Router();
const profileDoc = () => db.collection('profile').doc('main');

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const snap = await profileDoc().get();
    if (!snap.exists) {
      throw new AppError('Profile has not been configured yet', 404, 'PROFILE_NOT_FOUND');
    }
    return sendSuccess(res, snap.data(), 'Profile retrieved');
  } catch (err) {
    next(err);
  }
});

router.put(
  '/',
  requireAdmin,
  validateBody(updateProfileSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const now = new Date().toISOString();
      const payload = { ...req.body, updatedAt: now };
      await profileDoc().set(payload, { merge: true });

      await logAdminActivity({
        actorEmail: req.user!.email,
        action: 'UPDATE',
        resourceType: 'profile',
        resourceId: 'main',
        summary: 'Updated public profile and bio information',
      });
      await triggerFrontendRevalidation(['/']);

      const updated = await profileDoc().get();
      return sendSuccess(res, updated.data(), 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/avatar',
  requireAdmin,
  uploadImage.single('avatar'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError('Avatar image file is required', 400, 'FILE_REQUIRED');
      }

      const existing = await profileDoc().get();
      const oldPath = existing.data()?.avatarStoragePath;

      const uploaded = await uploadBufferToCloudinary(req.file.buffer, 'avatars', 'image');
      if (oldPath) {
        await deleteFromCloudinary(oldPath, 'image');
      }

      const now = new Date().toISOString();
      await profileDoc().set(
        {
          avatarUrl: uploaded.url,
          avatarStoragePath: uploaded.publicId,
          updatedAt: now,
        },
        { merge: true }
      );

      await logAdminActivity({
        actorEmail: req.user!.email,
        action: 'UPLOAD',
        resourceType: 'profile_avatar',
        resourceId: 'main',
        summary: 'Uploaded new profile picture',
      });
      await triggerFrontendRevalidation(['/']);

      return sendSuccess(
        res,
        { avatarUrl: uploaded.url },
        'Profile picture uploaded successfully'
      );
    } catch (err) {
      next(err);
    }
  }
);

export default router;