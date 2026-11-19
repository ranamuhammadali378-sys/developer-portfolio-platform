import { Router, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { db } from '../../config/firebase';
import {
  requireAdmin,
  optionalAdmin,
  AuthenticatedRequest,
} from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validate.middleware';
import { logAdminActivity } from '../../utils/audit.helper';
import { triggerFrontendRevalidation } from '../../utils/revalidate.helper';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';

interface CrudConfig {
  collectionName: string;
  resourceLabel: string;
  createSchema: ZodSchema;
  updateSchema: ZodSchema;
  supportsSoftDelete?: boolean;
  supportsPublishStatus?: boolean;
  supportsVisibilityFlag?: boolean;
}

export function createCrudRouter(config: CrudConfig): Router {
  const router = Router();
  const col = () => db.collection(config.collectionName);

  // GET all
  router.get('/', optionalAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const isAdmin = req.user?.role === 'admin';
      const includeDeleted = isAdmin && req.query.includeDeleted === 'true';

      const snap = await col().orderBy('displayOrder', 'asc').get();
      let items: Array<Record<string, unknown>> = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Record<string, unknown>),
      }));

      if (config.supportsSoftDelete && !includeDeleted) {
        items = items.filter((item) => !item.deletedAt);
      }
      if (!isAdmin && config.supportsPublishStatus) {
        items = items.filter((item) => item.status === 'published');
      }
      if (!isAdmin && config.supportsVisibilityFlag) {
        items = items.filter((item) => item.isVisible !== false);
      }

      return sendSuccess(res, items, `${config.resourceLabel} list retrieved`);
    } catch (err) {
      next(err);
    }
  });

  // POST create
  router.post(
    '/',
    requireAdmin,
    validateBody(config.createSchema),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const now = new Date().toISOString();
        const payload = {
          ...req.body,
          ...(config.supportsSoftDelete ? { deletedAt: null } : {}),
          createdAt: now,
          updatedAt: now,
        };
        const ref = await col().add(payload);

        await logAdminActivity({
          actorEmail: req.user!.email,
          action: 'CREATE',
          resourceType: config.collectionName,
          resourceId: ref.id,
          summary: `Created ${config.resourceLabel}: ${req.body.title || req.body.name || req.body.role || req.body.platform || ref.id}`,
        });
        await triggerFrontendRevalidation(['/']);

        return sendSuccess(res, { id: ref.id, ...payload }, `${config.resourceLabel} created`, 201);
      } catch (err) {
        next(err);
      }
    }
  );

  // PUT update
  router.put(
    '/:id',
    requireAdmin,
    validateBody(config.updateSchema),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const itemId = String(req.params.id);
        const ref = col().doc(itemId);
        const snap = await ref.get();
        if (!snap.exists) {
          throw new AppError(`${config.resourceLabel} not found`, 404, 'NOT_FOUND');
        }

        const updates = { ...req.body, updatedAt: new Date().toISOString() };
        await ref.update(updates);

        await logAdminActivity({
          actorEmail: req.user!.email,
          action: 'UPDATE',
          resourceType: config.collectionName,
          resourceId: ref.id,
          summary: `Updated ${config.resourceLabel} (${ref.id})`,
        });
        await triggerFrontendRevalidation(['/']);

        const updated = await ref.get();
        return sendSuccess(res, { id: ref.id, ...updated.data() }, `${config.resourceLabel} updated`);
      } catch (err) {
        next(err);
      }
    }
  );

  // DELETE (soft or permanent)
  router.delete(
    '/:id',
    requireAdmin,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const itemId = String(req.params.id);
        const ref = col().doc(itemId);
        const snap = await ref.get();
        if (!snap.exists) {
          throw new AppError(`${config.resourceLabel} not found`, 404, 'NOT_FOUND');
        }

        const permanent = !config.supportsSoftDelete || req.query.permanent === 'true';

        if (permanent) {
          await ref.delete();
          await logAdminActivity({
            actorEmail: req.user!.email,
            action: 'PERMANENT_DELETE',
            resourceType: config.collectionName,
            resourceId: ref.id,
            summary: `Permanently deleted ${config.resourceLabel} (${ref.id})`,
          });
        } else {
          await ref.update({
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          await logAdminActivity({
            actorEmail: req.user!.email,
            action: 'SOFT_DELETE',
            resourceType: config.collectionName,
            resourceId: ref.id,
            summary: `Moved ${config.resourceLabel} (${ref.id}) to Trash`,
          });
        }

        await triggerFrontendRevalidation(['/']);
        return sendSuccess(
          res,
          { id: ref.id, permanent },
          permanent ? `${config.resourceLabel} deleted` : `${config.resourceLabel} moved to Trash`
        );
      } catch (err) {
        next(err);
      }
    }
  );

  // POST restore
  if (config.supportsSoftDelete) {
    router.post(
      '/:id/restore',
      requireAdmin,
      async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
          const itemId = String(req.params.id);
          const ref = col().doc(itemId);
          const snap = await ref.get();
          if (!snap.exists) {
            throw new AppError(`${config.resourceLabel} not found`, 404, 'NOT_FOUND');
          }

          await ref.update({ deletedAt: null, updatedAt: new Date().toISOString() });
          await logAdminActivity({
            actorEmail: req.user!.email,
            action: 'RESTORE',
            resourceType: config.collectionName,
            resourceId: ref.id,
            summary: `Restored ${config.resourceLabel} (${ref.id}) from Trash`,
          });
          await triggerFrontendRevalidation(['/']);

          return sendSuccess(res, { id: ref.id }, `${config.resourceLabel} restored`);
        } catch (err) {
          next(err);
        }
      }
    );
  }

  return router;
}