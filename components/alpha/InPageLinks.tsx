'use client';

import { usePathname } from 'next/navigation';
import { InPageLinkDirection } from '@ekdotico/domico/components';

/*
 * Points the arrow on each in-page link up or down, towards its target. A
 * client component for usePathname alone, as HeaderLogo is: the links are read
 * again after each client-side navigation.
 */
export function InPageLinks() {
  return <InPageLinkDirection rescanKey={usePathname()} />;
}
