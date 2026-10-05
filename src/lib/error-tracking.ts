import * as Sentry from '@sentry/angular';
import { AppConfig } from './app-config';

/**
 * Browser error tracking, shared by every app.
 *
 * ONE PLACE, not three. admin, pos and care each have their own project and
 * their own DSN, but the SDK options — and in particular the scrubbing below —
 * must not drift between them: a redaction rule that exists in two apps out of
 * three is a leak with extra steps.
 *
 * WHEN THIS RUNS, and the trade-off it carries. The DSN arrives in
 * `assets/appconfig.production.json`, which is fetched at boot, so the SDK
 * cannot be initialised before that request completes — errors thrown during
 * the first few hundred milliseconds of startup are not captured. The
 * alternative is baking a DSN into the bundle at build time, which would mean
 * one image per estate and give up the property that makes these images
 * portable. Runtime config wins; this is its cost, and it is worth stating
 * rather than discovering.
 */

/** Keys whose values are replaced wherever they appear, at any depth. */
const REDACT_KEYS = [
  'password', 'password_confirmation', 'current_password', 'new_password',
  'token', 'access_token', 'refresh_token', 'id_token', 'api_key', 'apikey',
  'secret', 'client_secret', 'authorization', 'cookie',
  'card', 'card_number', 'pan', 'cvv', 'cvc', 'iban', 'account_number'
];

/**
 * Patterns for the places a key name cannot help: a thrown message, a URL, a
 * breadcrumb. Deliberately the same shapes the API's `SentryScrubber` and
 * Alloy's log pipeline strip, so a credential meets the same rules whichever
 * direction it travels.
 */
const REDACT_PATTERNS: Array<[RegExp, string]> = [
  [/(bearer\s+)[A-Za-z0-9._\-]{8,}/gi, '$1[REDACTED]'],
  [/((?:password|passwd|secret|token|api[_-]?key)["']?\s*[:=]\s*["']?)[^\s"',;&)]{4,}/gi, '$1[REDACTED]'],
  [/eyJ[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}/g, '[REDACTED-JWT]'],
  // Credentials inside a URL.
  [/([a-z][a-z0-9+.\-]*:\/\/[^\s:/@]+):[^\s@/]+@/gi, '$1:[REDACTED]@']
];

function scrubString(text: string): string {
  return REDACT_PATTERNS.reduce((acc, [re, to]) => acc.replace(re, to), text);
}

function redactDeep(value: unknown, depth = 0): unknown {
  // Bounded, because an event can carry a cyclic or very deep object and a
  // logging concern must never be the thing that hangs the page.
  if (depth > 8) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((v) => redactDeep(v, depth + 1));
  }

  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};

    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      out[key] = REDACT_KEYS.includes(key.toLowerCase())
        ? '[REDACTED]'
        : redactDeep(inner, depth + 1);
    }

    return out;
  }

  return typeof value === 'string' ? scrubString(value) : value;
}

/**
 * Initialise error tracking, if a DSN was configured.
 *
 * Safe to call when there is no DSN — it returns without touching Sentry, so a
 * local checkout and an install without error tracking behave identically.
 */
export function initErrorTracking(appKey: string, release?: string): void {
  const { dsn, tracesSampleRate, environment } = AppConfig.sentry;

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: environment || 'production',
    // WHICH BUNDLE this is. Without it, "first seen in 2026.10.9" cannot be
    // answered and the per-app projects lose most of their value.
    release,
    // Off: GlitchTip's performance support is partial, and every transaction is
    // another event against a store that is not yet backed up.
    tracesSampleRate: tracesSampleRate ?? 0,
    // NO `sendDefaultPii` HERE. It is a SERVER-SDK option and does not exist on
    // BrowserOptions — the build rejects it, which is how this was found. The
    // browser SDK does not attach cookies or an IP address of its own, so there
    // is nothing for it to switch off; the client IP an event ends up carrying
    // is inferred SERVER-SIDE from the request, and suppressing that is
    // GlitchTip's decision to make, not this bundle's.
    // Which app this came from, for filtering within a project and for the rare
    // case where two apps share one.
    initialScope: { tags: { app: appKey || 'unknown' } },

    /**
     * LAST PASS BEFORE THE EVENT LEAVES THE BROWSER.
     *
     * A front-end event is less dangerous than a server one — there are no
     * local variables and no database rows in it — but it does carry the URL the
     * user was on, the breadcrumb trail of their clicks and XHRs, and whatever a
     * thrown message happened to interpolate. A token in a query string is the
     * realistic case.
     */
    beforeSend(event) {
      if (event.request?.url) {
        event.request.url = scrubString(event.request.url);
      }

      if (event.request?.headers) {
        event.request.headers = redactDeep(event.request.headers) as Record<string, string>;
      }

      if (event.request?.data) {
        event.request.data = redactDeep(event.request.data);
      }

      if (event.extra) {
        event.extra = redactDeep(event.extra) as Record<string, unknown>;
      }

      for (const value of event.exception?.values ?? []) {
        if (value.value) {
          value.value = scrubString(value.value);
        }
      }

      return event;
    },

    /**
     * The breadcrumb trail, scrubbed as it is recorded rather than at send time,
     * so a credential is never held in memory alongside the session.
     */
    beforeBreadcrumb(crumb) {
      if (crumb.message) {
        crumb.message = scrubString(crumb.message);
      }

      if (crumb.data) {
        crumb.data = redactDeep(crumb.data) as Record<string, unknown>;
      }

      return crumb;
    },

    /**
     * NOISE THAT IS NOT A BUG. Each of these is a browser or network condition
     * rather than a fault in this code, and together they are most of what an
     * unfiltered browser tracker collects — at which point nobody reads it,
     * which is the real failure mode.
     */
    ignoreErrors: [
      // A navigation or tab close during an in-flight request.
      'AbortError',
      'The user aborted a request',
      // Offline, captive portal, blocked by an extension.
      'Failed to fetch',
      'NetworkError',
      'Network request failed',
      'Load failed',
      // A new release removed the chunk this tab was still asking for. Real,
      // but it resolves on reload and is not a code defect.
      'ChunkLoadError',
      'Loading chunk',
      'Importing a module script failed',
      // Benign ResizeObserver churn, a long-standing browser quirk.
      'ResizeObserver loop',
      // Browser extensions throwing inside our page.
      'Non-Error promise rejection captured'
    ],

    // Errors whose stack lies entirely in an extension are not ours to fix.
    denyUrls: [/^chrome-extension:\/\//, /^moz-extension:\/\//, /^safari-extension:\/\//]
  });
}
