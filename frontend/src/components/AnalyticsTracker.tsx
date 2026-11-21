'use client';

import { useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export function AnalyticsTracker({
  eventType = 'page_view',
  path = '/',
  projectSlug,
}: {
  eventType?: 'page_view' | 'project_view';
  path?: string;
  projectSlug?: string;
}) {
  useEffect(() => {
    apiFetch('/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ eventType, path, projectSlug }),
    }).catch(() => {});
  }, [eventType, path, projectSlug]);

  return null;
}