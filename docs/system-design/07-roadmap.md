# 07 - Roadmap

Ordering principle (manager): **reminders are the product**. The grouped-payment-day engine and the reminder pipeline ship first (M1), with manual intake. PDF is a secondary plugin; Gmail is post-v1; deeplinks are a single minimal button. Estimates assume one developer; ASSUMPTION: M0 1 week, M1 4-5 weeks, M2 3 weeks, M3 3 weeks, M4 open-ended.

## M0 - Foundations (week 1)
Scope: monorepo (pnpm + Turborepo), TS strict, ESLint flat config + `airbnb-extended` spike + Prettier, Vitest/fast-check/Playwright skeletons, GitHub Actions CI, two Vercel projects (web, api), PWA shell (manifest, SW registration, offline page), `core` primitives (`Paise`, `CivilDate`, `Clock`, `BusinessCalendar` with weekend rule), `testkit`, catalog package with schema + sign/verify scripts and a seed catalog (issuers list, 2026-27 holidays), dependency-cruiser boundaries, CSP generation script.
Acceptance:
- CI green on a PR from scratch in < 10 min; lint rejects `Date.now()` in `core`.
- Catalog signed in CI, verified in a unit test with pinned public key; tampered file rejected.
- App installs as PWA on Android Chrome and loads offline.
- Lint decision confirmed or fallback adopted (documented).
Risks: airbnb-extended lagging the ESLint major (fallback FlatCompat); CSP hashing with Next static export is fiddly (fallback: allow `'unsafe-inline'` only for one build-time-hashed bootstrap).

## M1 - Reminders MVP (weeks 2-6) - the product
Scope:
1. Vault: Dexie schema, passphrase setup + recovery code, AES-GCM envelope, lock/unlock, backup export/import, migrations harness.
2. **2-step add-card flow** (step 1: issuer, last 4, optional nickname, optional colour/style; step 2: due date, or statement day + due-offset). No amount fields anywhere in intake. Projected bills from cycle, edit/delete.
3. **GroupingEngine** exactly per `03` (lead 5 default, 1-10 setting, per-card override, weekend/holiday earlier-rolling, window 7, cap, stability, explanations "why this day").
4. **ReminderScheduler**: plan, diff, escalation ladder (pay day, 2 days before, due day, overdue nudges), snooze, catch-up inbox, badges. Reminder text and `.ics` contain no amounts.
4b. **Mark as paid**: per bill or group; a small sheet with a numeric field and a Skip button; creates `Payment` (`amountPaise` nullable, `paidAt`, bill reference); notification-action variant records a null amount and offers "add amount?" afterwards.
5. Delivery layers L1-L3: `.ics` (VALARM, compact/full, update/cancel export, 90-day horizon), Google Calendar links, in-app banners, SW best-effort notifications with Snooze/Paid actions, permission UX, onboarding that leads with calendar export.
6. "Open my payment app" button: choose one preferred app once; the button only opens the app or issuer pay page (no clipboard, no amount).
7. Holiday catalog updates via signed API (offline-safe).
8. Settings: lead days, window, reminder times, content privacy level, quiet hours.
Acceptance:
- **Add-card flow takes exactly 2 steps** (e2e asserts: step 1 = issuer + last 4 [+ nickname, colour]; step 2 = due date or statement day + offset; no amount field exists on either) and ends with the first group/reminder visible.
- All six worked examples in `03` pass as golden tests; the 15 properties pass at 500 cases; Stryker >= 80% on grouping + reminders.
- E2E: add 3 cards (due 3rd, 5th, 7th) -> single group day per `03` Example 1 -> export ICS -> imports into Apple Calendar and Google Calendar (manual check) -> clock advance shows banner/notification -> snooze, mark paid (amount entered or skipped) suppress pending items -> ignoring produces the overdue ladder and stops at day 14.
- ICS byte-identical across runs; re-export after a change yields same UIDs, higher SEQUENCE.
- App unused for 30 days (simulated): "While you were away" inbox, one summary notification, correct overdue states.
- Reminder text, notification payloads and `.ics` contain no amount (privacy-invariant test).
- Network inspector test: zero requests containing user data; CSP clean.
- Lighthouse PWA installable; initial JS < 250 KB gz.
Risks: notification delivery unreliability (mitigated by calendar-first design; must be communicated in UX); Google Calendar ignoring VALARM (documented; instruct default-notification setup); iOS limits (honest copy); holiday data accuracy and state variance (user-selectable state, weekends-only fallback); user trust in the grouping day (explanations, pins, per-card overrides); wrong due-date entry by the user (confirm screen shows computed days).

## M2 - Spend dashboard and PDF intake plugin (weeks 7-9)
Scope: **spend dashboard from logged `Payment` amounts** (per-card and cumulative monthly; skipped payments counted but not summed; labelled "based on payments you logged"); then the optional PDF plugin, **the only place amounts may later be auto-filled** (with Gmail, post-v1): `StatementParser` registry + declarative rule engine; Web Worker + pdf.js pipeline (memory-only); parsers for 3-5 top issuers (ASSUMPTION: HDFC, ICICI, SBI Card, Axis, Amex, chosen by manager); password hints/templates; review-and-confirm screen; `Statement`/`SpendEntry`/`ImportRecord` persistence; categoriser; optional plugin-only `aggregateEntries` (calendar-month vs statement-cycle basis) for line-item detail; signed parser rule-pack updates.
Acceptance: golden synthetic fixtures per issuer incl. drift cases; aggregator invariants as properties; no PDF bytes in storage (test); import dedupe; dashboard totals equal the sum of logged payment amounts exactly (integer paise); with the PDF plugin on, line-item totals reconcile to statement "new charges" within paise.
Risks: issuer layout drift (rule packs + `LAYOUT_CHANGED` fallback to manual entry); scanned/image PDFs (unsupported, clear message); synthetic-only fixtures may miss real quirks (mitigate via user-submitted redacted layout reports, never statements); parsing legal/ToS (user's own documents, on device).

## M3 - Hardening and polish (weeks 10-12)
Scope: passkey (WebAuthn PRF) unlock slot; Argon2id option; hide-on-blur; accessibility pass (WCAG 2.2 AA); Hindi (hi) localisation; more issuers; deeplink catalog verification pass; optional Drive appDataFolder encrypted backup sync (design in `01`; non-sensitive scope); backup nudges; data-deletion/crypto-erase UX; privacy policy page; DPDP review with counsel; public beta; device matrix test of notifications.
Acceptance: external accessibility checklist passes; passkey and recovery flows tested; Drive sync round trip with conflict policy (last-write-wins by `updatedAt`) tested; store-free launch checklist complete.
Risks: PRF support variance; Drive sync conflicts; scope creep.

## M4 - Post-v1 options (unscheduled)
- Gmail statement intake plugin (token model, in-browser parsing). Blocked on Q2 (restricted-scope verification cost).
- Optional push relay (Q4), if the manager accepts the storage exception.
- Optional Google Calendar API write for true event updates/removal (needs `calendar.events` scope; check verification burden).
- TWA wrapper for Play Store; loans/utility bills via `Bill.kind`.

## Open questions for the manager

| # | Question | Default if unanswered |
|---|----------|------------------------|
| Q1 | Name is final (CreditQ). Remaining: domain / UID domain / PWA manifest strings. | Placeholder |
| Q2 | Gmail (post-v1): is funding Google's restricted-scope verification + CASA assessment acceptable, or do we stay in Testing mode (<=100 users) / drop Gmail in favour of PDF only? | Stay post-v1, Testing mode |
| Q3 | Which issuers get parsers first (M2)? Need volunteers with real statements to produce *redacted layout descriptions* (we never receive statements). | HDFC, ICICI, SBI Card, Axis, Amex |
| Q4 | Optional stateless push relay: accept a minimal opt-in exception that stores `{push endpoint, fire times}` (no financial data) to enable iOS/Android background push? Needs a free scheduler (Vercel Hobby cron is once/day; Workers cron + KV is finer). Technically it is not stateless. | Not built; calendar-first |
| Q5 | Weekend definition for reminder day: we use Sat+Sun (D3). OK, or follow RBI (1st/3rd/5th Saturdays working)? | Sat+Sun |
| Q6 | Monetisation intent? Vercel Hobby forbids commercial use; if monetising, approve the Cloudflare Pages migration (or paid Vercel Pro). | Non-commercial, stay on Hobby |
| Q7 | Default `leadDays = 5`, `groupWindowDays = 7`, `safetyBufferDays = 1`, posting lag 1 business day: confirm numbers (the 7-day window and lag are ours, ASSUMPTION). | As stated |
| Q8 | Is a per-card `leadDays` override plus per-card "exclude from grouping" the right amount of control? | Yes |
| Q9 | Deeplink catalog contents: URLs from the parallel research to be reconciled into `DeeplinksPayload`; who owns periodic verification? | Manager reconciles; community PRs |
| Q10 | UI library final choice (shadcn/ui vs OAT); design is agnostic via `packages/ui-contracts`. | shadcn/ui |
| Q11 | Open-source licence and whether the repo is public (affects free CI minutes and trust: auditable privacy claims). | Public, AGPL or MIT TBD |
| Q12 | Legal review of DPDP position and privacy policy before public launch. | Required before M3 beta |
| Q13 | Mark-as-paid from a notification cannot show the amount sheet: it records `amountPaise = null` and offers "add amount?" on next open. Acceptable? | Yes |
| Q14 | Languages beyond English/Hindi? | en, hi |
