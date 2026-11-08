# 02 - API Contracts, Module Contracts, Server Threat Model

## Part A. Stateless backend (`apps/api`)

### A.1 Properties

- Next.js route handlers, **GET (and HEAD/OPTIONS) only**, `export const dynamic = 'force-static'`: output is prerendered at build time. No database, no env secrets at runtime, no request body parsing, no cookies, no auth. The catalog is _signed in CI_, so the server holds no signing key.
- Base path `/api/v1`. Breaking changes -> `/api/v2`, with v1 kept alive for N=12 months (old installed PWAs).
- CORS: `Access-Control-Allow-Origin: <web origin>` (plus `http://localhost:3000` in preview builds). No credentials.

### A.2 Endpoints (OpenAPI 3.1, abridged)

```yaml
openapi: 3.1.0
info:
  {
    title: CreditQ Catalog API,
    version: 1.0.0,
    description: Anonymous,
    read-only,
    signed catalog. Stores nothing.,
  }
servers: [{ url: https://api.creditq.example/api/v1 }] # ASSUMPTION: final host is *.vercel.app until a domain exists
paths:
  /health:
    get:
      {
        operationId: health,
        responses:
          {
            '200':
              {
                description: ok,
                content: { application/json: { schema: { $ref: '#/components/schemas/Health' } } },
              },
          },
      }
  /catalog/manifest:
    get:
      operationId: getManifest
      summary: Pointer to current catalog files (short TTL). Signed.
      responses:
        '200':
          {
            description: ok,
            headers:
              { ETag: { schema: { type:string } }, Cache-Control: { schema: { type:string } } },
            content:
              {
                application/json:
                  { schema: { $ref: '#/components/schemas/SignedEnvelope_Manifest' } },
              },
          }
        '304': { description: not modified }
  /catalog/v/{version}/issuers.json:
    get:
      {
        operationId: getIssuers,
        parameters: [{ $ref: '#/components/parameters/Version' }],
        responses:
          {
            '200':
              {
                description: immutable,
                content:
                  {
                    application/json:
                      { schema: { $ref: '#/components/schemas/SignedEnvelope_Issuers' } },
                  },
              },
            '404': { $ref: '#/components/responses/Problem' },
          },
      }
  /catalog/v/{version}/deeplinks.json:
    get:
      {
        operationId: getDeeplinks,
        parameters: [{ $ref: '#/components/parameters/Version' }],
        responses:
          {
            '200':
              {
                description: immutable,
                content:
                  {
                    application/json:
                      { schema: { $ref: '#/components/schemas/SignedEnvelope_Deeplinks' } },
                  },
              },
          },
      }
  /catalog/v/{version}/holidays/{year}.json:
    get:
      {
        operationId: getHolidays,
        parameters:
          [
            { $ref: '#/components/parameters/Version' },
            {
              name: year,
              in: path,
              required: true,
              schema: { type: integer, minimum: 2024, maximum: 2100 },
            },
          ],
        responses:
          {
            '200':
              {
                description: immutable,
                content:
                  {
                    application/json:
                      { schema: { $ref: '#/components/schemas/SignedEnvelope_Holidays' } },
                  },
              },
          },
      }
  /catalog/v/{version}/parser-rules/{issuerId}.json:
    get:
      {
        operationId: getParserRules,
        parameters:
          [
            { $ref: '#/components/parameters/Version' },
            {
              name: issuerId,
              in: path,
              required: true,
              schema: { type: string, pattern: '^[a-z0-9_]{2,32}$' },
            },
          ],
        responses:
          {
            '200':
              {
                description: immutable,
                content:
                  {
                    application/json:
                      { schema: { $ref: '#/components/schemas/SignedEnvelope_ParserRules' } },
                  },
              },
          },
      }
  /keys:
    get:
      {
        operationId: getKeys,
        summary: Public signing keys incl. rotation/revocation (also bundled in app; this lets a stale app learn of rotations - still must chain to a bundled root),
        responses: { '200': { description: ok } },
      }
components:
  parameters:
    Version: {
        name: version,
        in: path,
        required: true,
        schema: { type: string, pattern: '^\d{4}\.\d{2}\.\d{2}\.\d+$' },
      } # e.g. 2026.11.06.1
  responses:
    Problem:
      {
        description: RFC 9457 problem,
        content: { application/problem+json: { schema: { $ref: '#/components/schemas/Problem' } } },
      }
  schemas:
    Health:
      {
        type: object,
        required: [status, catalogVersion],
        properties:
          {
            status: { enum: [ok] },
            catalogVersion: { type: string },
            apiVersion: { type: string },
          },
      }
    Problem:
      type: object
      required: [type, title, status]
      properties:
        {
          type: { type: string, format: uri-reference },
          title: { type: string },
          status: { type: integer },
          code: { type: string },
          detail: { type: string },
        }
```

### A.3 Payload schemas (zod-equivalent TS; source of truth in `packages/catalog/src/schema.ts`)

```ts
// ---- signed envelope (all files) ----
export interface SignedEnvelope<T> {
  schema: 'creditq.catalog/1'; // envelope format
  kind: 'manifest' | 'issuers' | 'deeplinks' | 'holidays' | 'parserRules';
  catalogVersion: string; // '2026.11.06.1'
  issuedAt: string; // ISO instant
  expiresAt: string; // client treats as stale (still usable, banner) after this; hard cap 400 days for holidays
  payload: T;
  sig: { kid: string; alg: 'Ed25519'; value: string /* base64url over JCS(payload-with-header) */ };
}
// Signature input = RFC 8785 JCS canonical JSON of { schema, kind, catalogVersion, issuedAt, expiresAt, payload }.

export interface Manifest {
  files: Array<{
    kind: SignedEnvelope<unknown>['kind'];
    path: string;
    sha256: string;
    bytes: number;
    key?: string; /* issuerId or year */
  }>;
  minAppVersion: string; // app older than this shows "please update"
  parserCodeVersion: string; // newest built-in parser plugin set the rules assume
}

export interface IssuersPayload {
  issuers: IssuerEntry[];
  networks: Array<{ id: Network; name: string }>;
}
export interface IssuerEntry {
  id: IssuerId; // 'hdfc', 'icici', 'sbicard', 'axis', 'amex', 'idfcfirst', 'kotak', 'indusind', 'yes', 'au', 'rbl', 'onecard', ...
  displayName: string;
  aliases: string[]; // for card-name search
  statementSenders: Array<{ domain: string; fromPatterns?: string[]; subjectPatterns?: string[] }>; // POST-V1 (Gmail plugin): builds the Gmail query client-side
  pdf: {
    passwordHint: { text: string; template?: string }; // e.g. 'First 4 letters of name in CAPS + DDMM of birth' -> template '{NAME4U}{DDMM}'; resolved ONLY on device
    typicallyEncrypted: boolean;
  };
  parser: {
    parserId: string;
    builtInVersion: string;
    rulesFile?: string;
    status: 'stable' | 'beta' | 'unsupported';
  };
  cycleHints?: { dueOffsetDays?: number; typicalStatementDays?: number[] };
  payment: {
    postingLagBusinessDays: Partial<Record<PayMethod, number>>; // best known; user-overridable
    onHolidayRule: 'next_working_day_ok' | 'unknown' | 'pay_before'; // default 'unknown' => treated as 'pay_before'
    payPageUrl?: string; // https issuer bill-pay page, used by the 'Open my payment app' fallback
    issuerApp: { androidPackage?: string; iosScheme?: string; storeUrl?: string };
  };
  logo?: { svgPath: string }; // optional inline vector, no remote images
}

// Deliberately minimal (manager scope: one 'Open my payment app' button, no prefill promised).
export interface DeeplinksPayload {
  apps: DeeplinkApp[];
}
export interface DeeplinkApp {
  app: PayApp; // 'gpay' | 'cred' | 'amazonpay' | 'phonepe' | 'paytm' | 'issuer'
  displayName: string;
  android?: { url: string; kind: 'app_scheme' | 'android_intent' | 'https' }; // plain launch/home URL, NO placeholders
  ios?: { url: string; kind: 'app_scheme' | 'universal_link' | 'https' };
  webFallbackUrl?: string; // https only
  confidence: 'verified' | 'community' | 'unverified';
  verifiedOn?: string; // ISO date of last human verification
}
// Issuer pay pages live on IssuerEntry.payment.payPageUrl (https). Templates with {amount} placeholders are NOT part of v1;
// if later added they go behind a new optional field without breaking the schema.

export interface HolidaysPayload {
  year: number;
  source: string; // e.g. 'RBI holiday calendar'
  national: Array<{ date: string; name: string; closed: 'all_banks' | 'most_banks' }>;
  states: Record<string /* IN-MH */, Array<{ date: string; name: string }>>;
  weekendRule: { saturdays: 'second_fourth_closed' | 'all_closed' | 'none'; sundays: 'closed' }; // RBI: 2nd & 4th Saturdays closed
  neftImpsUpi24x7: true; // rails are 24x7; lag is about issuer crediting, not rails
}

export interface ParserRulesPayload {
  issuerId: IssuerId;
  rulesVersion: string;
  appliesToParserVersion: string; // semver range against built-in plugin; mismatch -> ignore rules
  rules: DeclarativeRuleSet; // see 02 Part B.1; data only, no code
  syntheticTestVectors: Array<{ id: string; textDocSha256: string }>; // for CI parity only
}
```

### A.4 Versioning

- `catalogVersion` = `YYYY.MM.DD.n`, monotonically increasing; client refuses to roll back (stores highest seen; replay protection) except via a signed `reset` marker.
- URL for payload files embeds the version => **immutable**; only `/catalog/manifest` and `/keys` are mutable pointers.
- Compatibility: envelope `schema` major must match; unknown fields ignored (zod `.passthrough()` on read, strict on build).

### A.5 Caching and ETag strategy

| Resource             | Cache-Control                                                                | Validator                                                                                      |
| -------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `/catalog/manifest`  | `public, max-age=3600, stale-while-revalidate=86400, stale-if-error=2592000` | strong `ETag` = SHA-256 of body (generated at build, emitted by `vercel.json` headers / route) |
| `/catalog/v/{ver}/*` | `public, max-age=31536000, immutable`                                        | ETag also set                                                                                  |
| `/keys`              | `public, max-age=86400, stale-while-revalidate=604800`                       | ETag                                                                                           |
| `/health`            | `no-store`                                                                   | none                                                                                           |

Client: check manifest at most once per 24 h when opened (and by periodic sync where available), `If-None-Match`; fetch only files whose `sha256` differ; verify signature **and** sha256 **and** `catalogVersion` monotonicity; store in `catalogCache`; everything works offline with the last good copy or the copy bundled in the app build. The service worker uses stale-while-revalidate for manifest, cache-first for versioned files.

### A.6 Error model

RFC 9457 `application/problem+json`. Codes (closed set): `NOT_FOUND`, `VERSION_GONE` (pruned old version), `UNSUPPORTED_METHOD`, `RATE_LIMITED`, `INTERNAL`. Client-side errors (never from the server): `SIG_INVALID`, `SIG_KEY_UNKNOWN`, `SIG_KEY_REVOKED`, `SCHEMA_INVALID`, `ROLLBACK_REJECTED`, `EXPIRED_STALE`, `HASH_MISMATCH`, `OFFLINE`. Every client error falls back to last-good catalog; the UI shows a non-blocking "catalog not updated" state.

### A.7 Signature verification (client)

1. Fetch manifest; parse; look up `sig.kid` in bundled `trustedKeys` (array; each has `notBefore/notAfter/revoked`).
2. Canonicalise (JCS) the signed header+payload; verify Ed25519 via `crypto.subtle.verify('Ed25519')`, fallback `@noble/ed25519` when unsupported.
3. Check `expiresAt`, version monotonicity, `minAppVersion`.
4. For each referenced file: verify its own signature **and** its sha256 listed in the (signed) manifest.
   Key rotation: new key ships in an app release first (overlap window), then catalog switches `kid`. Compromise: release an app update revoking the kid; catalogs signed by the old key are rejected. Honest limit: until the user updates the app, a stolen signing key could serve malicious _data_ (never code). Blast radius is limited by P4 (data-only; schema validated; deeplink templates restricted to an allowed-scheme allowlist in the app: `https`, `upi`, and a compiled-in list of app schemes; `javascript:`/`data:` are impossible by construction).

### A.8 Rate limiting on the free tier

Because responses are static and CDN-cached, there is no origin compute to protect. Controls: (1) responses are served from Vercel's CDN cache (static, no function invocations; ASSUMPTION: Hobby limits of roughly 100 GB/month transfer and 1M invocations are never approached because the payloads are ~150 KB gz and cached/immutable); (2) a Vercel Firewall custom rate-limit rule of ~60 req/min/IP returning 429 problem+json (ASSUMPTION: available on Hobby; if not, rely on platform DDoS protection); (3) client self-throttle: manifest at most once per 24 h, jittered +-2 h, exponential backoff on failures; (4) immutable URLs mean repeat downloads are browser-cache hits. All handlers are `force-static`, so they consume no function quota.

### A.9 Server threat model: what could the server ever learn?

| Observable                                  | Detail                                                                                                                                                                                              | Mitigation                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IP, User-Agent, timestamp of anonymous GETs | Standard CDN logs held by the host (Vercel), not by us; we have no log drain                                                                                                                        | No cookies/IDs/query params; same request for every user; manifest is jittered; no per-user URL; privacy policy states this                                                                                                                                                                                           |
| Approx. install base / version mix          | From manifest fetches                                                                                                                                                                               | Acceptable; no identifiers                                                                                                                                                                                                                                                                                            |
| Which issuers a user cares about            | **Not leaked**: client downloads the whole issuer catalog and parser rules for all issuers? No - rules are per-issuer files                                                                         | DECISION: fetch `parser-rules/{issuerId}.json` only for issuers the user has cards for would leak card issuers to the server (IP + issuer). So the client fetches **all** rule files in the manifest (small, ~2-5 KB each, ~30 issuers => <150 KB gz) and caches; or bundles them. Per-issuer lazy fetch is forbidden |
| User financial data                         | Impossible: no endpoint accepts input; no POST; CSP forbids other connect targets for the main origin                                                                                               | Architecture                                                                                                                                                                                                                                                                                                          |
| Gmail/Drive tokens                          | (Post-v1 / later.) Never sent to our API; browser talks to Google directly                                                                                                                          | CSP `connect-src` allowlist; separate route for Google scripts                                                                                                                                                                                                                                                        |
| Push subscriptions                          | None in v1. An OPTIONAL stateless push relay is an open question (07 Q4), not a requirement; if ever built, it would learn an endpoint URL plus fire times only, never amounts/cards, and is opt-in | See 04 section 9                                                                                                                                                                                                                                                                                                      |

A compromised developer account/CDN could serve a malicious web-app bundle (the real systemic risk for any web app). Mitigations in `05`: reproducible builds, subresource integrity for same-origin scripts via CSP hashes, signed release tags, open-source repo so users/auditors can compare the deployed bundle hash (published in the repo release notes) with the build. Honest: a PWA cannot fully prevent this.

---

## Part B. Internal module contracts (`packages/core`)

All modules are pure and synchronous unless noted; time and holidays are injected.

### B.0 Shared utilities

```ts
export interface Clock {
  now(): EpochMs;
}

export interface BusinessCalendar {
  isBusinessDay(d: CivilDate): boolean; // not Sunday, not RBI 2nd/4th Saturday (or all Saturdays per config), not holiday
  isHoliday(d: CivilDate): boolean;
  prevBusinessDayOrSame(d: CivilDate): CivilDate;
  nextBusinessDayOrSame(d: CivilDate): CivilDate;
  addBusinessDays(d: CivilDate, n: number): CivilDate; // n may be negative
  catalogVersion: string;
}
export function makeBusinessCalendar(
  h: HolidaysPayload[],
  opts: { state?: string; saturdayRule?: 'rbi' | 'all_closed' | 'none' },
): BusinessCalendar;

export type Result<T, E> = { ok: true; value: T; warnings?: Warning[] } | { ok: false; error: E };
export interface Warning {
  code: string;
  message: string;
  params?: Record<string, string | number>;
}
```

`makeBusinessCalendar` must degrade gracefully: if a year is missing from the catalog, fall back to weekend-only + RBI Saturday rule and emit warning `HOLIDAYS_MISSING_YEAR`.

### B.1 StatementParser plugin interface (OPTIONAL intake plugin; PDF = M2, Gmail = post-v1)

Primary intake is the 2-step manual flow (`ManualCardEntry -> Card + first Bill`, no parser involved, no amounts). Parser plugins (PDF/Gmail) are the only place amounts may later be auto-filled, into `Statement` and `Bill.pluginAmounts`. Parsers are optional plugins behind an `IntakePlugin` registry; the app is fully functional with none installed, and the core reminder pipeline never imports them.

```ts
// Primary intake is a 2-step flow. NO amounts are collected (manager decision).
export interface ManualCardEntryStep1 {
  issuerId: IssuerId;
  last4: string;
  network?: Network;
  nickname?: string;
  style?: Card['style'];
}
export type ManualCardEntryStep2 =
  | { mode: 'due_date'; dueDate: CivilDate } // creates the first Bill with confidence 'manual'
  | { mode: 'cycle'; statementDay: number; dueOffsetDays: number }; // creates projected Bills
export interface ManualCardEntry extends ManualCardEntryStep1 {
  when: ManualCardEntryStep2;
}
/** The only user-entered amount in the whole app: the optional 'Mark as paid' sheet. */
export interface MarkPaidInput {
  billIds: BillId[];
  amountPaise: Paise | null /* Skip => null */;
  paidAt: EpochMs;
  method?: PayMethod;
}
export interface IntakePlugin {
  id: 'manual' | 'pdf' | 'gmail';
  enabled(): boolean;
} // only 'manual' is mandatory
```

Pipeline: `File bytes -> (Worker: pdf.js, password handling) -> TextDocument -> StatementParser.parse -> ParsedStatement -> review UI -> vault`.
`core` never touches pdf.js; it receives a `TextDocument` (so parsers are pure and testable from JSON fixtures).

```ts
export interface TextItem {
  str: string;
  x: number;
  y: number;
  w: number;
  h: number;
  font?: string;
}
export interface TextPage {
  pageNo: number;
  width: number;
  height: number;
  items: TextItem[];
  lines: string[] /* items grouped into reading-order lines, pre-computed */;
}
export interface TextDocument {
  pages: TextPage[];
  meta: {
    source: 'pdf' | 'email_html' | 'email_text';
    receivedDate?: CivilDate;
    subject?: string;
    fromDomain?: string;
  };
}

export type ParseErrorCode =
  | 'NOT_THIS_ISSUER'
  | 'LAYOUT_CHANGED'
  | 'FIELD_MISSING'
  | 'AMOUNT_UNPARSEABLE'
  | 'DATE_UNPARSEABLE'
  | 'PASSWORD_REQUIRED'
  | 'PASSWORD_WRONG'
  | 'SCANNED_IMAGE_ONLY'
  | 'UNSUPPORTED_VERSION'
  | 'MULTI_CARD_AMBIGUOUS';

export interface ParsedLine {
  txnDate: CivilDate;
  postedDate?: CivilDate;
  description: string;
  amount: Paise; /* debit +, credit - */
  kind: SpendEntry['kind'];
  foreign?: { currency: string; minor: number };
  confidence: number;
  sourceLine?: number;
}
export interface ParsedStatement {
  issuerId: IssuerId;
  cardLast4?: string; // from masked PAN like XXXX XXXX XXXX 1234; PAN digits other than last4 are DISCARDED in the parser
  periodStart?: CivilDate;
  periodEnd?: CivilDate;
  statementDate: CivilDate;
  dueDate: CivilDate;
  totalDue: Paise;
  minDue: Paise;
  previousBalance?: Paise;
  paymentsReceived?: Paise;
  newCharges?: Paise;
  creditLimit?: Paise;
  rewardPoints?: number;
  lines: ParsedLine[];
  fieldConfidence: Record<'statementDate' | 'dueDate' | 'totalDue' | 'minDue', number>; // 0..1
  checks: {
    sumOfLinesMatchesNewCharges?: boolean;
    dueAfterStatement: boolean;
    minLEtotal: boolean;
  };
}

export interface StatementParser {
  readonly id: string; // 'hdfc.credit.v1'
  readonly issuerId: IssuerId;
  readonly version: string; // semver of the plugin code
  /** Cheap, side-effect-free: does this look like my issuer's statement? 0..1 */
  sniff(doc: TextDocument): number;
  parse(
    doc: TextDocument,
    ctx: ParseContext,
  ): Result<ParsedStatement, { code: ParseErrorCode; detail?: string }>;
}
export interface ParseContext {
  rules?: DeclarativeRuleSet; // optional remote rule pack (data only)
  today: CivilDate; // to resolve 2-digit years and sanity-check dates
  locale: 'en-IN';
}
export interface ParserRegistry {
  register(p: StatementParser): void;
  detect(doc: TextDocument): Array<{ parser: StatementParser; score: number }>; // sorted desc
}

/** Data-only extraction rules, interpreted by a built-in engine. No eval, no functions. */
export interface DeclarativeRuleSet {
  anchors: Array<{
    field:
      | 'statementDate'
      | 'dueDate'
      | 'totalDue'
      | 'minDue'
      | 'cardLast4'
      | 'periodStart'
      | 'periodEnd';
    labelRegex: string;
    valueRegex: string;
    scope: 'sameLine' | 'nextLine' | 'rightOf';
    page?: number;
    format?: 'date:DD/MM/YYYY' | 'date:DD Mon YYYY' | 'date:DD-Mon-YY' | 'inr';
  }>;
  table?: {
    startRegex: string;
    endRegex: string;
    columns: Array<{
      name: 'date' | 'description' | 'amount' | 'crdr';
      xMin?: number;
      xMax?: number;
      regex?: string;
    }>;
  };
  redactions: string[]; // regexes applied to description (PAN-like by default, always on)
}
```

Safety: regexes from remote rule packs are compiled with a length cap and run under a per-parse time budget (the worker is killed after 5 s) to mitigate ReDoS; rule packs are signed (A.7). Per-issuer plugins have a _golden synthetic fixture suite_ (`06`).

### B.2 GroupingEngine (algorithm in `03`)

```ts
/** The engine depends ONLY on due dates (plus availableFrom, lag, lead, calendar). It never sees amounts. */
export interface GroupingInput {
  today: CivilDate;
  bills: GroupableBill[];
  config: GroupingConfig;
  calendar: BusinessCalendar;
  previous?: PaymentGroup[]; // for stability / pinned groups
}
export interface GroupableBill {
  billId: BillId;
  cardId: CardId;
  dueDate: CivilDate;
  availableFrom: CivilDate; // earliest sensible pay day (statement date); never earlier than this
  status: BillStatus;
  confidence: Bill['confidence'];
  payMethod: PayMethod;
  excluded: boolean; // user opted this card out of grouping (gets its own reminders)
  leadDays?: number; // per-card override
  pinnedPayDay?: CivilDate;
  postingLagBusinessDays?: number; // per-bill override (issuer-specific)
}
export interface GroupingConfig {
  leadDays: number;
  groupWindowDays: number;
  safetyBufferDays: number;
  allowWeekendPayDay: boolean;
  postingLag: Record<PayMethod, number>;
  relyOnHolidayRollover: boolean;
  horizonDays: number;
  minGroupSize: number; // default 2; singleton groups still produced, flagged as 'single'
}
export interface GroupingOutput {
  groups: PlannedGroup[];
  skipped: Array<{ billId: BillId; reason: 'paid' | 'void' | 'beyond_horizon' | 'excluded' }>;
}
export interface PlannedGroup {
  key: string; // stable: hash(sorted billIds)
  payDay: CivilDate;
  lastSafeDay: CivilDate;
  earliestOkDay: CivilDate;
  billIds: BillId[];
  riskLevel: 'ok' | 'tight' | 'late';
  explanation: GroupExplanation;
}
export interface GroupingEngine {
  plan(input: GroupingInput): GroupingOutput;
}
```

Contract: `plan` is a pure, deterministic function; same input => byte-identical output; input order irrelevant.

### B.3 ReminderScheduler

```ts
export interface ReminderInput {
  groups: PlannedGroup[];
  bills: Bill[];
  cards: Card[];
  settings: Settings['reminders'];
  calendar: BusinessCalendar;
  now: EpochMs;
  window: { from: CivilDate; to: CivilDate };
  previousPlan?: ReminderPlan;
}
export interface ReminderScheduler {
  plan(input: ReminderInput): ReminderPlan; // pure; idempotent; items sorted by (fireAt, itemId)
  diff(
    prev: ReminderPlan | undefined,
    next: ReminderPlan,
  ): { add: ReminderItem[]; remove: string[]; keep: string[] }; // by itemId
  toIcs(plan: ReminderPlan, ctx: IcsContext): string; // RFC 5545, deterministic
  toCalendarLinks(
    plan: ReminderPlan,
    ctx: IcsContext,
  ): Array<{ itemId: string; googleUrl: string }>;
  toNotificationPayloads(plan: ReminderPlan, ctx: NotificationContext): NotificationPayload[];
  catchUp(
    plan: ReminderPlan,
    lastRunAt: EpochMs,
    now: EpochMs,
  ): { missed: ReminderItem[]; due: ReminderItem[]; upcoming: ReminderItem[] };
  /** State transitions are pure functions returning the new plan; persistence is the caller's job. */
  snooze(
    plan: ReminderPlan,
    itemId: string,
    minutes: number,
    now: EpochMs,
    opts: { maxSnoozes: number; hardStopAt: EpochMs /* never past the bill's due-day 23:00 */ },
  ): ReminderPlan;
  markPaid(plan: ReminderPlan, billIds: BillId[], now: EpochMs): ReminderPlan; // sets pending items for these bills to 'suppressed_paid'; amount is irrelevant to scheduling
  escalate(
    plan: ReminderPlan,
    bills: Bill[],
    now: EpochMs,
    cfg: Settings['reminders']['escalation'],
  ): ReminderPlan; // appends overdue_nudge items for unpaid past-due bills
}
export interface IcsContext {
  prodId: string;
  calendarName: string;
  uidDomain: string;
  alarmMinutesBefore: number[] /* VALARM offsets, default [0,720] */;
  contentLevel: ReminderItem['contentLevel'];
  dtstamp: EpochMs; /* = plan.createdAt, for determinism */
}
export interface NotificationContext {
  cardLabel(id: CardId): string;
  locale: 'en-IN' | 'hi-IN';
} // no amount formatter: reminder text never contains an amount
export interface NotificationPayload {
  tag: string;
  title: string;
  body: string;
  timestamp: EpochMs;
  data: { itemId: string; url: string };
  actions: Array<{ action: 'open' | 'snooze' | 'paid'; title: string }>;
  renotify: false;
  requireInteraction: boolean;
}
```

Details in `04`.

### B.4 DeeplinkResolver (deliberately tiny: the "Open my payment app" button)

Behaviour (manager decision): the user picks ONE preferred app once (`Settings.preferredPayApp`). Tapping the button **only opens** that app, or the issuer pay page when the preference is `issuer`. There is **no clipboard copy, no amount, no prefill, no multi-app sheet** (no amount exists to pass: amounts are not collected).

```ts
export interface OpenPayAppRequest {
  app: PayApp;
  issuerId: IssuerId;
  platform: 'android' | 'ios' | 'desktop';
}
export interface OpenPayAppPlan {
  primaryUrl: string; // app launch URL for the platform, or the issuer pay page (https)
  fallbackUrl?: string; // https web page used if the app does not open (~1.5 s timer + visibilitychange check)
  confidence: DeeplinkApp['confidence'];
}
export interface DeeplinkResolver {
  plan(req: OpenPayAppRequest, catalog: DeeplinksPayload, issuers: IssuersPayload): OpenPayAppPlan;
}
```

Rules: only allowlisted schemes (`https`, plus a compiled-in list of app schemes); opened on a user gesture; URLs contain no user data of any kind; the clipboard API is never called. Final catalog URLs come from the manager's parallel deeplink research.

### B.5 SpendAggregator (reads Payments: the dashboard reflects only what the user logged)

Input is `Payment[]` (from 'Mark as paid'). Payments with `amountPaise === null` (Skip) are counted but contribute no money. `SpendEntry[]` is an OPTIONAL extra input that exists only if a PDF/Gmail plugin imported line items; a manual-only install passes none.

```ts
export interface AggregateQuery {
  range: { from: CivilDate; to: CivilDate }; // inclusive, on Payment.paidOn
  cardIds?: CardId[];
  groupBy: Array<'card' | 'month'>; // category grouping only applies to plugin SpendEntry input
}
export interface AggregateRow {
  cardId?: CardId;
  month?: string; // 'YYYY-MM' of paidOn (IST)
  total: Paise; // sum of non-null amountPaise
  loggedCount: number; // payments with an amount
  skippedCount: number; // payments with amountPaise === null
}
export interface MonthlySummary {
  month: string;
  perCard: Array<{ cardId: CardId; total: Paise; loggedCount: number; skippedCount: number }>;
  cumulativeTotal: Paise;
  deltaVsPrevMonth: Paise | null;
}
export interface SpendAggregator {
  aggregate(payments: readonly Payment[], q: AggregateQuery): AggregateRow[];
  monthlySummaries(payments: readonly Payment[], months: string[]): MonthlySummary[];
  cumulativeSeries(
    payments: readonly Payment[],
    q: AggregateQuery,
  ): Array<{ date: CivilDate; cumulative: Paise }>;
  // PLUGIN-ONLY extension, absent unless an intake plugin is installed:
  aggregateEntries?(
    entries: readonly SpendEntry[],
    q: AggregateQuery & { basis: 'calendar_month' | 'statement_cycle' },
  ): AggregateRow[];
  categorise?(
    e: Pick<SpendEntry, 'description'>,
    rules: CategoryRule[],
  ): { categoryId?: CategoryId; merchant?: string };
}
export interface CategoryRule {
  id: string;
  categoryId: CategoryId;
  match: { contains?: string[]; regex?: string };
  merchant?: string;
}
```

Invariants: integer arithmetic only; order-independent; soft-deleted payments excluded; `sum(perCard.total) == cumulativeTotal`; a skipped payment never changes any total; UI labels the dashboard "Based on payments you logged" so partial logging is not mistaken for full spend.
