import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../../config/firebase';
import { requireAdmin, AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { uploadPdf } from '../../middlewares/upload.middleware';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../../utils/cloudinary.helper';
import { logAdminActivity } from '../../utils/audit.helper';
import { triggerFrontendRevalidation } from '../../utils/revalidate.helper';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';

const router = Router();
const resumeDoc = () => db.collection('resume').doc('active');

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const snap = await resumeDoc().get();
    if (!snap.exists) {
      return sendSuccess(res, null, 'No active resume uploaded yet');
    }
    return sendSuccess(res, snap.data(), 'Active resume retrieved');
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  requireAdmin,
  uploadPdf.single('resume'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError('PDF resume file is required', 400, 'FILE_REQUIRED');
      }

      const existing = await resumeDoc().get();
      const oldPath = existing.data()?.storagePath;

      const uploaded = await uploadBufferToCloudinary(req.file.buffer, 'resume', 'raw');
      if (oldPath) {
        await deleteFromCloudinary(oldPath, 'raw');
      }

      const payload = {
        fileName: req.file.originalname,
        fileUrl: uploaded.url,
        storagePath: uploaded.publicId,
        fileSizeBytes: uploaded.bytes,
        versionLabel: (req.body.versionLabel as string) || `v-${new Date().toISOString().slice(0, 10)}`,
        updatedAt: new Date().toISOString(),
      };

      await resumeDoc().set(payload);

      await logAdminActivity({
        actorEmail: req.user!.email,
        action: 'UPLOAD',
        resourceType: 'resume',
        resourceId: 'active',
        summary: `Uploaded updated CV (${payload.fileName})`,
      });
      await triggerFrontendRevalidation(['/']);

      return sendSuccess(res, payload, 'Resume uploaded successfully', 201);
    } catch (err) {
      next(err);
    }
  }
);

export default router;