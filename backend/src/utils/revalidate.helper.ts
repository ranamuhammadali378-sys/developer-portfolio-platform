import { env } from '../config/env';
import { logger } from '../config/logger';

export async function triggerFrontendRevalidation(paths: string[] = ['/']): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    await fetch(`${env.FRONTEND_URL}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidation-secret': env.REVALIDATION_SECRET,
      },
      body: JSON.stringify({ paths }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
  } catch (error) {
    logger.debug({ err: error }, 'Frontend ISR revalidation skipped (frontend may be offline)');
  }
}