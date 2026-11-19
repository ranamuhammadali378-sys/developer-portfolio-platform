import { Router, Response, NextFunction } from 'express';
import { createProjectSchema, updateProjectSchema, ProjectItem } from '@portfolio/shared';
import { db } from '../../config/firebase';
import {
  requireAdmin,
  optionalAdmin,
  AuthenticatedRequest,
} from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validate.middleware';
import { uploadImage } from '../../middlewares/upload.middleware';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../../utils/cloudinary.helper';
import { logAdminActivity } from '../../utils/audit.helper';
import { triggerFrontendRevalidation } from '../../utils/revalidate.helper';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';

const router = Router();
const projectsCol = () => db.collection('projects');

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let candidate = baseSlug || `project-${Date.now()}`;
  let counter = 1;
  while (true) {
    const snap = await projectsCol().where('slug', '==', candidate).limit(1).get();
    if (snap.empty || snap.docs[0].id === excludeId) {
      return candidate;
    }
    candidate = `${baseSlug}-${counter++}`;
  }
}

// GET /api/v1/projects
router.get('/', optionalAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const includeDeleted = isAdmin && req.query.includeDeleted === 'true';
    const category = req.query.category as string | undefined;
    const search = (req.query.search as string | undefined)?.toLowerCase().trim();
    const featuredOnly = req.query.featured === 'true';
    const statusFilter = req.query.status as string | undefined;
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));

    const snapshot = await projectsCol().orderBy('displayOrder', 'asc').get();
    let items: ProjectItem[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<ProjectItem, 'id'>),
    }));

    if (!includeDeleted) {
      items = items.filter((p) => !p.deletedAt);
    }

    if (!isAdmin) {
      items = items.filter((p) => p.status === 'published');
    } else if (statusFilter === 'draft' || statusFilter === 'published') {
      items = items.filter((p) => p.status === statusFilter);
    }

    if (category && category !== 'All') {
      items = items.filter((p) => p.category === category);
    }

    if (featuredOnly) {
      items = items.filter((p) => p.isFeatured);
    }

    if (search) {
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(search) ||
          p.summary.toLowerCase().includes(search) ||
          p.technologies.some((t) => t.toLowerCase().includes(search))
      );
    }

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paginated = items.slice((page - 1) * limit, page * limit);

    return sendSuccess(res, paginated, 'Projects retrieved', 200, {
      page,
      limit,
      total,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/projects/:slugOrId
router.get(
  '/:slugOrId',
  optionalAdmin,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const slugOrId = String(req.params.slugOrId);
      const isAdmin = req.user?.role === 'admin';

      let docSnap = await projectsCol().doc(slugOrId).get();
      if (!docSnap.exists) {
        const bySlug = await projectsCol().where('slug', '==', slugOrId).limit(1).get();
        if (!bySlug.empty) {
          docSnap = bySlug.docs[0];
        }
      }

      if (!docSnap.exists) {
        throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
      }

      const project = { id: docSnap.id, ...(docSnap.data() as Omit<ProjectItem, 'id'>) };

      if (!isAdmin && (project.deletedAt || project.status !== 'published')) {
        throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
      }

      return sendSuccess(res, project, 'Project retrieved');
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/projects
router.post(
  '/',
  requireAdmin,
  validateBody(createProjectSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const now = new Date().toISOString();
      const rawSlug = req.body.slug || slugify(req.body.title);
      const uniqueSlug = await ensureUniqueSlug(rawSlug);

      const newProject = {
        ...req.body,
        slug: uniqueSlug,
        githubUrl: req.body.githubUrl || null,
        liveUrl: req.body.liveUrl || null,
        thumbnailUrl: '',
        thumbnailStoragePath: '',
        screenshots: [],
        viewCount: 0,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await projectsCol().add(newProject);

      await logAdminActivity({
        actorEmail: req.user!.email,
        action: 'CREATE',
        resourceType: 'project',
        resourceId: docRef.id,
        summary: `Created project "${newProject.title}" (${newProject.status})`,
      });

      if (newProject.status === 'published') {
        await triggerFrontendRevalidation(['/', `/projects/${uniqueSlug}`]);
      }

      return sendSuccess(
        res,
        { id: docRef.id, ...newProject },
        'Project created successfully',
        201
      );
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/v1/projects/:id
router.put(
  '/:id',
  requireAdmin,
  validateBody(updateProjectSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const projectId = String(req.params.id);
      const docRef = projectsCol().doc(projectId);
      const snap = await docRef.get();
      if (!snap.exists) {
        throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
      }

      const existing = snap.data() as ProjectItem;
      const updates: Record<string, unknown> = {
        ...req.body,
        updatedAt: new Date().toISOString(),
      };

      if (req.body.slug) {
        updates.slug = await ensureUniqueSlug(slugify(req.body.slug), docRef.id);
      }
      if ('githubUrl' in req.body) updates.githubUrl = req.body.githubUrl || null;
      if ('liveUrl' in req.body) updates.liveUrl = req.body.liveUrl || null;

      await docRef.update(updates);

      const actionType =
        req.body.status && req.body.status !== existing.status
          ? req.body.status === 'published'
            ? 'PUBLISH'
            : 'UNPUBLISH'
          : 'UPDATE';

      await logAdminActivity({
        actorEmail: req.user!.email,
        action: actionType,
        resourceType: 'project',
        resourceId: docRef.id,
        summary: `${actionType === 'PUBLISH' ? 'Published' : actionType === 'UNPUBLISH' ? 'Unpublished' : 'Updated'} project "${existing.title}"`,
      });

      const finalSlug = (updates.slug as string) || existing.slug;
      await triggerFrontendRevalidation(['/', `/projects/${existing.slug}`, `/projects/${finalSlug}`]);

      const updatedSnap = await docRef.get();
      return sendSuccess(res, { id: docRef.id, ...updatedSnap.data() }, 'Project updated');
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/projects/:id/media?type=thumbnail|screenshot
router.post(
  '/:id/media',
  requireAdmin,
  uploadImage.single('image'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError('Image file is required', 400, 'FILE_REQUIRED');
      }

      const projectId = String(req.params.id);
      const docRef = projectsCol().doc(projectId);
      const snap = await docRef.get();
      if (!snap.exists) {
        throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
      }

      const project = snap.data() as ProjectItem;
      const mediaType = req.query.type === 'screenshot' ? 'screenshot' : 'thumbnail';
      const uploaded = await uploadBufferToCloudinary(
        req.file.buffer,
        `projects/${docRef.id}`,
        'image'
      );

      if (mediaType === 'thumbnail') {
        if (project.thumbnailStoragePath) {
          await deleteFromCloudinary(project.thumbnailStoragePath, 'image');
        }
        await docRef.update({
          thumbnailUrl: uploaded.url,
          thumbnailStoragePath: uploaded.publicId,
          updatedAt: new Date().toISOString(),
        });
      } else {
        const screenshots = Array.isArray(project.screenshots) ? [...project.screenshots] : [];
        screenshots.push({
          url: uploaded.url,
          path: uploaded.publicId,
          caption: (req.body.caption as string) || '',
        });
        await docRef.update({
          screenshots,
          updatedAt: new Date().toISOString(),
        });
      }

      await logAdminActivity({
        actorEmail: req.user!.email,
        action: 'UPLOAD',
        resourceType: 'project_media',
        resourceId: docRef.id,
        summary: `Uploaded ${mediaType} for project "${project.title}"`,
      });
      await triggerFrontendRevalidation(['/', `/projects/${project.slug}`]);

      const updated = await docRef.get();
      return sendSuccess(res, { id: docRef.id, ...updated.data() }, 'Project media uploaded');
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/v1/projects/:id/media (Remove a screenshot by path)
router.delete(
  '/:id/media',
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const storagePath = req.body?.path as string;
      if (!storagePath) {
        throw new AppError('Screenshot storage path is required', 400, 'PATH_REQUIRED');
      }

      const projectId = String(req.params.id);
      const docRef = projectsCol().doc(projectId);
      const snap = await docRef.get();
      if (!snap.exists) {
        throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
      }

      const project = snap.data() as ProjectItem;
      const filtered = (project.screenshots || []).filter((s) => s.path !== storagePath);
      await deleteFromCloudinary(storagePath, 'image');

      await docRef.update({
        screenshots: filtered,
        updatedAt: new Date().toISOString(),
      });

      await triggerFrontendRevalidation(['/', `/projects/${project.slug}`]);
      return sendSuccess(res, { screenshots: filtered }, 'Screenshot removed');
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/v1/projects/:id (Soft-delete by default; ?permanent=true for hard delete)
router.delete(
  '/:id',
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const projectId = String(req.params.id);
      const docRef = projectsCol().doc(projectId);
      const snap = await docRef.get();
      if (!snap.exists) {
        throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
      }

      const project = snap.data() as ProjectItem;
      const isPermanent = req.query.permanent === 'true';

      if (isPermanent) {
        if (project.thumbnailStoragePath) {
          await deleteFromCloudinary(project.thumbnailStoragePath, 'image');
        }
        for (const shot of project.screenshots || []) {
          await deleteFromCloudinary(shot.path, 'image');
        }
        await docRef.delete();

        await logAdminActivity({
          actorEmail: req.user!.email,
          action: 'PERMANENT_DELETE',
          resourceType: 'project',
          resourceId: docRef.id,
          summary: `Permanently deleted project "${project.title}"`,
        });
      } else {
        await docRef.update({
          deletedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        await logAdminActivity({
          actorEmail: req.user!.email,
          action: 'SOFT_DELETE',
          resourceType: 'project',
          resourceId: docRef.id,
          summary: `Moved project "${project.title}" to Trash`,
        });
      }

      await triggerFrontendRevalidation(['/', `/projects/${project.slug}`]);
      return sendSuccess(
        res,
        { id: docRef.id, permanent: isPermanent },
        isPermanent ? 'Project permanently deleted' : 'Project moved to Trash'
      );
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/projects/:id/restore (Recover soft-deleted project)
router.post(
  '/:id/restore',
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const projectId = String(req.params.id);
      const docRef = projectsCol().doc(projectId);
      const snap = await docRef.get();
      if (!snap.exists) {
        throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
      }

      const project = snap.data() as ProjectItem;
      await docRef.update({
        deletedAt: null,
        updatedAt: new Date().toISOString(),
      });

      await logAdminActivity({
        actorEmail: req.user!.email,
        action: 'RESTORE',
        resourceType: 'project',
        resourceId: docRef.id,
        summary: `Restored project "${project.title}" from Trash`,
      });
      await triggerFrontendRevalidation(['/', `/projects/${project.slug}`]);

      return sendSuccess(res, { id: docRef.id }, 'Project restored successfully');
    } catch (err) {
      next(err);
    }
  }
);

export default router;