'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { capture, routePattern } from '@/lib/analytics';

// Counts a visit as the pattern of its route. Renders nothing, and does nothing
// until NEXT_PUBLIC_POSTHOG_KEY is set (lib/analytics.ts).
export function AnalyticsPageView() {
  const pathname = usePathname();
  useEffect(() => {
    capture({ name: 'page_view', props: { route: routePattern(pathname) } });
  }, [pathname]);
  return null;
}
