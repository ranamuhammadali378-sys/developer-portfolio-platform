import { db } from '../config/firebase';
import { logger } from '../config/logger';
import { ActivityLogItem } from '@portfolio/shared';

export async function logAdminActivity(params: {
  actorEmail: string;
  action: ActivityLogItem['action'];
  resourceType: string;
  resourceId: string;
  summary: string;
}): Promise<void> {
  try {
    await db.collection('activity_logs').add({
      ...params,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.warn({ err: error }, 'Failed to record admin activity log');
  }
}