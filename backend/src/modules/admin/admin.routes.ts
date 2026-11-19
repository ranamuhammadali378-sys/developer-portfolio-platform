import { Router, Response, NextFunction } from 'express';
import { db } from '../../config/firebase';
import { requireAdmin, AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { logAdminActivity } from '../../utils/audit.helper';
import { triggerFrontendRevalidation } from '../../utils/revalidate.helper';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';

const router = Router();

const BACKUP_COLLECTIONS = [
  'profile',
  'projects',
  'skills',
  'education',
  'certifications',
  'experience',
  'resume',
  'social_links',
  'site_settings',
];

// GET /api/v1/admin/activity-logs
router.get(
  '/activity-logs',
  requireAdmin,
  async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const snap = await db
        .collection('activity_logs')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();
      const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return sendSuccess(res, logs, 'Admin activity logs retrieved');
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/admin/backup/export
router.get(
  '/backup/export',
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const snapshotData: Record<string, Record<string, unknown>> = {};

      for (const colName of BACKUP_COLLECTIONS) {
        const snap = await db.collection(colName).get();
        snapshotData[colName] = {};
        snap.docs.forEach((doc) => {
          snapshotData[colName][doc.id] = doc.data();
        });
      }

      await logAdminActivity({
        actorEmail: req.user!.email,
        action: 'CREATE',
        resourceType: 'backup',
        resourceId: 'snapshot',
        summary: 'Exported full portfolio JSON backup snapshot',
      });

      return sendSuccess(
        res,
        {
          exportedAt: new Date().toISOString(),
          version: '1.0',
          collections: snapshotData,
        },
        'Full database backup exported'
      );
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/admin/backup/restore
router.post(
  '/backup/restore',
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const collections = req.body?.collections as
        | Record<string, Record<string, Record<string, unknown>>>
        | undefined;

      if (!collections || typeof collections !== 'object') {
        throw new AppError('Invalid backup JSON format: missing collections object', 400, 'INVALID_BACKUP');
      }

      let restoredDocs = 0;
      for (const colName of BACKUP_COLLECTIONS) {
        const docsMap = collections[colName];
        if (!docsMap || typeof docsMap !== 'object') continue;

        const batch = db.batch();
        for (const [docId, docData] of Object.entries(docsMap)) {
          const ref = db.collection(colName).doc(docId);
          batch.set(ref, docData, { merge: true });
          restoredDocs++;
        }
        await batch.commit();
      }

      await logAdminActivity({
        actorEmail: req.user!.email,
        action: 'BACKUP_RESTORE',
        resourceType: 'backup',
        resourceId: 'snapshot',
        summary: `Restored ${restoredDocs} documents from JSON backup snapshot`,
      });
      await triggerFrontendRevalidation(['/']);

      return sendSuccess(
        res,
        { restoredDocuments: restoredDocs },
        'Database snapshot restored successfully'
      );
    } catch (err) {
      next(err);
    }
  }
);

export default router;