import { describe, expect, expectTypeOf, it } from 'vitest';
import { type AnalyticsEvent, buildConfig, outcomeOf, routePattern, scrub } from './analytics';

const SENTINEL = 'SENTINEL-reader@example.org-turnstile-0xABC';

describe('what an event can hold', () => {
  it('names a route by pattern, whatever path or query it is given', () => {
    expect(routePattern('/privacy')).toBe('/privacy');
    expect(routePattern('/privacy/')).toBe('/privacy');
    expect(routePattern('/')).toBe('/');
    expect(routePattern(`/privacy?email=${SENTINEL}#${SENTINEL}`)).toBe('/privacy');
    expect(routePattern(`/${SENTINEL}`)).toBe('other');
    expect(routePattern('other')).toBe('other');
  });

  // Rule 15a: text the reader, a page or a form wrote reaches no event.
  it('puts no input text into any event, however it is offered', () => {
    const offered = {
      event: 'waitlist_submit',
      properties: {
        outcome: SENTINEL,
        email: SENTINEL,
        'cf-turnstile-response': SENTINEL,
        $current_url: `https://alpha.ekdoti.co/?email=${SENTINEL}`,
        $title: SENTINEL,
        $set: { email: SENTINEL },
      },
    };
    const sent = scrub(offered);
    expect(JSON.stringify(sent)).not.toContain('SENTINEL');
    expect(sent?.properties).toMatchObject({ outcome: 'error' });
  });

  // Rule 24: the outcome comes from the status alone, never the message or the address.
  it('gives the outcome of a submission without the address or the message', () => {
    expect(outcomeOf({ status: 'ok' })).toBe('ok');
    expect(outcomeOf({ status: 'invalid', message: SENTINEL })).toBe('invalid');
    expect(outcomeOf({ status: 'refused', message: SENTINEL, limited: true })).toBe('rate_limited');
    expect(outcomeOf({ status: 'refused', message: SENTINEL })).toBe('error');
    for (const result of [{ status: 'invalid', message: SENTINEL }, { status: 'refused', message: SENTINEL }] as const) {
      expect(outcomeOf(result)).not.toContain('SENTINEL');
    }
  });
});

// Rule 15b: the hook PostHog calls before it sends.
describe('scrub', () => {
  it('drops an event that is not on the list', () => {
    expect(scrub({ event: '$pageview', properties: {} })).toBeNull();
    expect(scrub({ event: '$autocapture', properties: {} })).toBeNull();
    expect(scrub({ event: 'toString', properties: {} })).toBeNull();
    expect(scrub(null)).toBeNull();
  });

  it('drops a property that is not in the schema, and always disables GeoIP', () => {
    const sent = scrub({
      event: 'page_view',
      properties: {
        route: '/privacy',
        token: 'phc_test',
        distinct_id: 'x',
        $current_url: 'https://alpha.ekdoti.co/privacy',
        $pathname: '/privacy',
        $referrer: 'https://example.org/',
        $set_once: { a: 1 },
        $initial_referrer: 'x',
        extra: 'x',
      },
    });
    expect(sent?.properties).toEqual({
      route: '/privacy',
      token: 'phc_test',
      distinct_id: 'x',
      $geoip_disable: true,
    });
  });

  // A3: `$set` and `$set_once` sit beside `properties`, not inside it.
  it('drops a top-level $set and $set_once, and keeps only the event, its id and its time', () => {
    const when = new Date(0);
    const sent = scrub({
      event: 'waitlist_submit',
      uuid: 'u-1',
      timestamp: when,
      properties: { outcome: 'ok' },
      $set: { email: SENTINEL },
      $set_once: { email: SENTINEL },
      extra: SENTINEL,
    } as Parameters<typeof scrub>[0]);
    expect(Object.keys(sent ?? {}).sort()).toEqual(['event', 'properties', 'timestamp', 'uuid']);
    expect(sent).toMatchObject({ uuid: 'u-1', timestamp: when });
    expect(JSON.stringify(sent)).not.toContain('SENTINEL');
  });

  it('keeps nothing in the browser, and nothing about a person or a page', () => {
    expect(buildConfig()).toMatchObject({
      persistence: 'memory',
      person_profiles: 'never',
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      disable_surveys: true,
      advanced_disable_flags: true,
      disable_external_dependency_loading: true,
      api_host: '/ingest',
    });
  });
});

// Rule 15c: no event has a property that is an open string.
describe('the event list', () => {
  it('is two events, each with one closed property', () => {
    expectTypeOf<AnalyticsEvent['name']>().toEqualTypeOf<'page_view' | 'waitlist_submit'>();
    expectTypeOf<Extract<AnalyticsEvent, { name: 'page_view' }>['props']['route']>().not.toEqualTypeOf<string>();
    expectTypeOf<Extract<AnalyticsEvent, { name: 'waitlist_submit' }>['props']['outcome']>().not.toEqualTypeOf<string>();
    // @ts-expect-error free text is not a route
    const bad: AnalyticsEvent = { name: 'page_view', props: { route: 'free text' } };
    expect(bad).toBeDefined();
  });
});
