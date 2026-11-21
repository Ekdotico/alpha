import type { PostHogConfig } from 'posthog-js';
import type { WaitlistResult } from '@/lib/waitlist';

// Counts only. Two events, no person, nothing stored in the browser.
//
// A closed list is the only way to capture: `capture` takes one of the two
// events below and nothing else, and every field of an event is a member of a
// closed set. No field holds text a reader, an address or a page wrote.
//
// Off until the variable is set: without NEXT_PUBLIC_POSTHOG_KEY every function
// here returns at once and posthog-js is never fetched. The browser talks only
// to this site's own /ingest path (app/ingest, lib/analytics-proxy.ts), which
// forwards to PostHog's EU cloud.

/** The route patterns a visit can name. A path that is none of them is `other`. */
export const ROUTES = ['/', '/privacy', '/confirmed', 'other'] as const;
export type Route = (typeof ROUTES)[number];

/**
 * How a waitlist submission ended. `already` is in the list because the baseline
 * names it, and nothing sends it: the reply never says whether an address was
 * already on the list (lib/waitlist.ts), so the browser cannot know.
 */
export const OUTCOMES = ['ok', 'already', 'invalid', 'rate_limited', 'error'] as const;
export type Outcome = (typeof OUTCOMES)[number];

export type AnalyticsEvent =
  | { name: 'page_view'; props: { route: Route } }
  | { name: 'waitlist_submit'; props: { outcome: Outcome } };

type EventName = AnalyticsEvent['name'];

/** The one property each event may carry, and the values it may take. */
const SCHEMA: { [N in EventName]: { key: string; values: readonly string[]; fallback: string } } = {
  page_view: { key: 'route', values: ROUTES, fallback: 'other' },
  waitlist_submit: { key: 'outcome', values: OUTCOMES, fallback: 'error' },
};

// What posthog-js needs on every event to be accepted, and nothing more. Every
// other property, `$current_url`, `$pathname`, `$referrer`, `$title`, `$set`,
// `$set_once` and the `$initial_*` family included, is dropped by `scrub`.
const SYSTEM_PROPERTIES: readonly string[] = [
  'token',
  'distinct_id',
  '$lib',
  '$lib_version',
  '$process_person_profile',
  '$geoip_disable',
];

const isEventName = (name: unknown): name is EventName =>
  typeof name === 'string' && Object.hasOwn(SCHEMA, name);

/** A visit's path as the pattern it matches, never the path itself. */
export function routePattern(pathname: string): Route {
  const path = pathname.split(/[?#]/)[0] ?? '';
  const trimmed = path.length > 1 ? path.replace(/\/+$/, '') : path;
  return (ROUTES as readonly string[]).includes(trimmed) && trimmed !== 'other' ? (trimmed as Route) : 'other';
}

/** The outcome of a submission, from what the form is told and nothing it typed. */
export function outcomeOf(result: WaitlistResult): Outcome {
  if (result.status === 'ok') return 'ok';
  if (result.status === 'invalid') return 'invalid';
  return result.limited === true ? 'rate_limited' : 'error';
}

/**
 * The hook PostHog calls with each event before it is sent. An event that is not
 * on the list is dropped; one that is keeps its one schema property, if that
 * holds a member of the closed set, and the system properties.
 */
export function scrub<
  T extends { event: string; uuid?: string; timestamp?: Date; properties?: Record<string, unknown> },
>(event: T | null): T | null {
  if (!event || !isEventName(event.event)) return null;
  const { key, values, fallback } = SCHEMA[event.event];
  const given = event.properties ?? {};
  const properties: Record<string, unknown> = {};
  for (const name of SYSTEM_PROPERTIES) if (name in given) properties[name] = given[name];
  const value = given[key];
  properties[key] = typeof value === 'string' && values.includes(value) ? value : fallback;
  properties.$geoip_disable = true;
  // Built from named fields, not spread from the event: a top-level `$set` or
  // `$set_once`, which sit beside `properties`, cannot pass.
  const scrubbed: { event: string; uuid?: string; timestamp?: Date; properties: Record<string, unknown> } = {
    event: event.event,
    properties,
  };
  if (event.uuid !== undefined) scrubbed.uuid = event.uuid;
  if (event.timestamp !== undefined) scrubbed.timestamp = event.timestamp;
  return scrubbed as unknown as T;
}

/** The key, or null when analytics is off. Read where Next inlines it. */
function projectKey(): string | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  return typeof key === 'string' && key.trim() !== '' ? key.trim() : null;
}

/**
 * Every option written out, so a change of the SDK's defaults changes nothing
 * here. No cookie and no localStorage (`memory`), no person, no autocapture, no
 * recording, no survey, no flags, and the site's own origin as the host.
 */
export function buildConfig(): Partial<PostHogConfig> {
  return {
    api_host: '/ingest',
    ui_host: 'https://eu.posthog.com',
    defaults: '2026-08-30',
    persistence: 'memory',
    person_profiles: 'never',
    autocapture: false,
    capture_dead_clicks: false,
    capture_heatmaps: false,
    rageclick: false,
    capture_exceptions: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_performance: false,
    disable_session_recording: true,
    disable_surveys: true,
    advanced_disable_flags: true,
    save_referrer: false,
    // No script from anywhere: the toolbar, which a URL fragment can start, and
    // every extension are fetched as external dependencies.
    disable_external_dependency_loading: true,
    before_send: (event) => scrub(event),
  };
}

type Client = typeof import('posthog-js').default;
let loading: Promise<Client | null> | undefined;

function afterLoad(run: () => void): void {
  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run, { once: true });
}

/** posthog-js, fetched once after the page has loaded; null when off or failed. */
function load(): Promise<Client | null> {
  loading ??= new Promise<Client | null>((resolve) => {
    const key = projectKey();
    if (key === null || typeof window === 'undefined') return resolve(null);
    afterLoad(() => {
      import('posthog-js')
        .then(({ default: posthog }) => {
          posthog.init(key, buildConfig());
          resolve(posthog);
        })
        .catch(() => resolve(null));
    });
  });
  return loading;
}

/** Sends one event. Never throws, and never waits for anything the page needs. */
export function capture(event: AnalyticsEvent): void {
  if (projectKey() === null) return;
  void load().then((client) => {
    try {
      client?.capture(event.name, event.props);
    } catch {
      // Analytics must never break a page.
    }
  });
}
