import { Injectable } from '@angular/core';
import { IErrorInfo, KeyFormats} from './index';

// The `cartesian` global is populated by the BE default-bundle on app boot
// (system-configuration blocks: `tenancy`, …). It's the FE side of the
// BE single-source-of-truth for header names.
declare const cartesian: any;

export type IInterceptorConfig = {
  error: {
    show: Boolean;
    presenter: 'message' | 'notify';
  };
  tenancy: {
    overwriteHeaderAttribute: Boolean;
    host: string | string[];
  };
  headers: { [key: string]: string };
};

export type ApiEndpoints = {
  login: string;
  authenticatedUser: string;
  [key: string]: string;
};

@Injectable({
  providedIn: 'root'
})
export class AppConfig {
  static remoteServiceBaseUrl = '';

  /**
   * Tenancy host header name. Single source = the BE config
   * (`tenancy.configuration.tenancy.header_attribute`), emitted to the FE as
   * `cartesian.tenancy.headerAttribute`. The literal here is only a pre-boot
   * fallback (the tenancy header is needed for the very first request, before
   * the default-bundle loads) and must match the BE default.
   */
  static get tenantHeaderAttribute(): string {
    return (typeof cartesian !== 'undefined' && cartesian?.tenancy?.headerAttribute)
      || 'X-Cartesian-Host';
  }

  /** Identifier for THIS Angular app — `'admin' | 'care' | 'pos' | 'talent'`.
   *  Read from each app's `assets/appconfig.json` and used by the widget
   *  registry (and any future per-app filtering) to know which surface is
   *  asking for data. Empty string disables filtering. */
  static appKey = '';

  static apiEndpoints: ApiEndpoints = {
    login: '/login',
    authenticatedUser: '/profile'
  };

  /**
   * Cloudflare Turnstile. Only the SITE key belongs here — it is public by
   * design and is rendered into the login form so the widget can identify
   * itself. The secret key authenticates the server's verification call and
   * must never reach a browser.
   *
   * Empty disables the widget, which is correct for an install that has not
   * configured Turnstile. Whether a token is *required* is the server's
   * decision (`user_management.captcha_on_login` /
   * `captcha_on_registration`), not this flag's — the client always sends one
   * when it can, because sending a token the server ignores costs nothing
   * while omitting one it wants is a locked door.
   */
  static captcha: { siteKey: string } = { siteKey: '' };

  /**
   * Error tracking (GlitchTip, over Sentry's protocol).
   *
   * The DSN IS PUBLIC BY CONSTRUCTION — it ships inside this bundle, so every
   * visitor has it. That is Sentry's own model: a DSN can only SEND events, not
   * read them. It still points at a guarded hostname where exactly one path
   * (`POST /api/<id>/envelope/`) is reachable and everything else is refused,
   * because the alternative is an open door to the admin API next to it.
   *
   * ONE DSN PER APP, because each app is released on its own tag and has its own
   * project — a POS error in the admin issue list makes "did this release
   * regress" unanswerable for either.
   *
   * Empty disables the SDK entirely, which is right for local work and for any
   * install without error tracking: no DSN, no events, no failed attempts to
   * send them.
   */
  static sentry: { dsn: string; tracesSampleRate: number; environment: string } = {
    dsn: '',
    tracesSampleRate: 0,
    environment: ''
  };

  static appBaseUrl = '';

  static appBaseHref = ''; // returns angular's base-href parameter value if used during the publish

  static localeMappings = [];

  static interceptor: IInterceptorConfig = {
    error: {
      show: true,
      presenter: 'notify'
    },
    tenancy: {
      overwriteHeaderAttribute: false,
      host: ''
    },
    headers: {}
  };

  static readonly userManagement = {
    defaultAdminUserName: 'admin'
  };

  static readonly localization = {
    defaultLocalizationSourceName: '' // AppConfig
  };

  static readonly authorization = {
    encryptedAuthTokenName: '' // enc_auth_token
  };

  static defaultHttpSuccessCodes = <{ [key: string]: IErrorInfo }>{
    '100': { code: 100, message: 'Continue', details: '' },
    '101': { code: 101, message: 'Switching Protocols', details: '' },
    '102': { code: 102, message: 'Processing', details: '' },
    '200': { code: 200, message: 'OK', details: '' },
    '201': { code: 201, message: 'Created', details: '' },
    '202': { code: 202, message: 'Accepted', details: '' },
    '203': { code: 203, message: 'Non-Authoritative Information', details: '' },
    '204': { code: 204, message: 'No Content', details: '' },
    '205': { code: 205, message: 'Reset Content', details: '' },
    '206': { code: 206, message: 'Partial Content', details: '' },
    '207': { code: 207, message: 'Multi-status', details: '' },
    '208': { code: 208, message: 'Already Reported', details: '' },
    '300': { code: 300, message: 'Multiple Choices', details: '' },
    '301': { code: 301, message: 'Moved Permanently', details: '' },
    '302': { code: 302, message: 'Found', details: '' },
    '303': { code: 303, message: 'See Other', details: '' },
    '304': { code: 304, message: 'Not Modified', details: '' },
    '305': { code: 305, message: 'Use Proxy', details: '' },
    '306': { code: 306, message: 'Switch Proxy', details: '' },
    '307': { code: 307, message: 'Temporary Redirect', details: '' }
  };

  static defaultHttpErrorCodes = {
    '400': { code: 400, message: 'Bad Request', details: '' },
    '401': { code: 401, message: 'Unauthorized', details: '' },
    '402': { code: 402, message: 'Payment Required', details: '' },
    '403': { code: 403, message: 'Forbidden', details: '' },
    '404': { code: 404, message: 'Not Found', details: '' },
    '405': { code: 405, message: 'Method Not Allowed', details: '' },
    '406': { code: 406, message: 'Not Acceptable', details: '' },
    '407': { code: 407, message: 'Proxy Authentication Required', details: '' },
    '408': { code: 408, message: 'Request Time-out', details: '' },
    '409': { code: 409, message: 'Conflict', details: '' },
    '410': { code: 410, message: 'Gone', details: '' },
    '411': { code: 411, message: 'Length Required', details: '' },
    '412': { code: 412, message: 'Precondition Failed', details: '' },
    '413': { code: 413, message: 'Request Entity Too Large', details: '' },
    '414': { code: 414, message: 'Request-URI Too Large', details: '' },
    '415': { code: 415, message: 'Unsupported Media Type', details: '' },
    '416': { code: 416, message: 'Requested range not satisfiable', details: '' },
    '417': { code: 417, message: 'Expectation Failed', details: '' },
    '418': { code: 418, message: "I'm a teapot", details: '' },
    '422': { code: 422, message: 'Unprocessable Entity', details: '' },
    '423': { code: 423, message: 'Locked', details: '' },
    '424': { code: 424, message: 'Failed Dependency', details: '' },
    '425': { code: 425, message: 'Unordered Collection', details: '' },
    '426': { code: 426, message: 'Upgrade Required', details: '' },
    '428': { code: 428, message: 'Precondition Required', details: '' },
    '429': { code: 429, message: 'Too Many Requests', details: '' },
    '431': { code: 431, message: 'Request Header Fields Too Large', details: '' },
    '451': { code: 451, message: 'Unavailable For Legal Reasons', details: '' },
    '500': { code: 500, message: 'Internal Server Error', details: '' },
    '501': { code: 501, message: 'Not Implemented', details: '' },
    '502': { code: 502, message: 'Bad Gateway', details: '' },
    '503': { code: 503, message: 'Service Unavailable', details: '' },
    '504': { code: 504, message: 'Gateway Time-out', details: '' },
    '505': { code: 505, message: 'HTTP Version not supported', details: '' },
    '506': { code: 506, message: 'Variant Also Negotiates', details: '' },
    '507': { code: 507, message: 'Insufficient Storage', details: '' },
    '508': { code: 508, message: 'Loop Detected', details: '' },
    '511': { code: 511, message: 'Network Authentication Required', details: '' }
  };

  static keysFormatAPI: KeyFormats;

  static keysFormatAPP: KeyFormats;
}
