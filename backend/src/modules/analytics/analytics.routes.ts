import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { trackAnalyticsSchema } from '@portfolio/shared';
import { db, admin } from '../../config/firebase';
import { env } from '../../config/env';
import { requireAdmin } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validate.middleware';
import { sendSuccess } from '../../utils/apiResponse';

const router = Router();

// Public privacy-first page & project view tracking
router.post(
  '/track',
  validateBody(trackAnalyticsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { eventType, path, projectSlug } = req.body;
      const today = new Date().toISOString().slice(0, 10);

      // Daily rotating salted hash prevents cross-day tracking while deduplicating refreshes
      const visitorHash = crypto
        .createHash('sha256')
        .update(`${req.ip || 'anon'}-${today}-${env.ANALYTICS_SALT}`)
        .digest('hex')
        .slice(0, 20);

      const dedupId = `${today}_${eventType}_${projectSlug || 'home'}_${visitorHash}`;
      const eventRef = db.collection('analytics_events').doc(dedupId);
      const exists = await eventRef.get();

      if (!exists.exists) {
        await eventRef.set({
          eventType,
          path,
          projectSlug: projectSlug || null,
          date: today,
          createdAt: new Date().toISOString(),
        });

        if (eventType === 'page_view') {
          await db
            .collection('analytics_daily')
            .doc(today)
            .set(
              { date: today, visits: admin.firestore.FieldValue.increment(1) },
              { merge: true }
            );
        }

        if (eventType === 'project_view' && projectSlug) {
          const projSnap = await db
            .collection('projects')
            .where('slug', '==', projectSlug)
            .limit(1)
            .get();
          if (!projSnap.empty) {
            await projSnap.docs[0].ref.update({
              viewCount: admin.firestore.FieldValue.increment(1),
            });
          }
        }
      }

      return sendSuccess(res, { recorded: !exists.exists }, 'Analytics event processed');
    } catch (err) {
      next(err);
    }
  }
);

// Admin analytics overview
router.get('/overview', requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const dailySnap = await db
      .collection('analytics_daily')
      .orderBy('date', 'desc')
      .limit(30)
      .get();

    const dailyTraffic = dailySnap.docs
      .map((d) => ({
        date: d.data().date as string,
        visits: Number(d.data().visits || 0),
      }))
      .reverse();

    const visitsLast30Days = dailyTraffic.reduce((sum, d) => sum + d.visits, 0);
    const visitsLast7Days = dailyTraffic.slice(-7).reduce((sum, d) => sum + d.visits, 0);

    const projectsSnap = await db.collection('projects').get();
    const topProjects = projectsSnap.docs
      .map((d) => ({
        id: d.id,
        title: String(d.data().title || ''),
        slug: String(d.data().slug || ''),
        viewCount: Number(d.data().viewCount || 0),
        deletedAt: d.data().deletedAt,
      }))
      .filter((p) => !p.deletedAt)
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5)
      .map(({ id, title, slug, viewCount }) => ({ id, title, slug, viewCount }));

    return sendSuccess(
      res,
      {
        totalSiteVisits: visitsLast30Days,
        visitsLast7Days,
        visitsLast30Days,
        topProjects,
        dailyTraffic,
      },
      'Analytics overview retrieved'
    );
  } catch (err) {
    next(err);
  }
});

export default router;