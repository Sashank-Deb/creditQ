# BillCalm research (as of 2026-11-06)

Legend: [V] verified from a fetched page; [S] seen only in secondary or third-party sources; [K] from my own knowledge, not verified this session; [?] could not verify. Many Indian issuer facts are only available from third-party blogs, so treat issuer tables as hypotheses to be confirmed with real statements (see Risks).

---

## 1. Data intake

### 1.1 Account Aggregator (RBI)

- Only a regulated entity (RBI, SEBI, IRDAI or PFRDA) can be an FIU. A small unregulated dev cannot be one directly [S: hyperverge.co/blog/best-account-aggregators/]. Being an AA itself needs an NBFC-AA licence, with Rs 2 crore net owned funds, and the AA cannot do other business [S: treelife.in/fintech/nbfc-account-aggregator-licence/].
- Per-fetch pricing of Rs 5-25 is a vendor-quoted figure [S]. Sahamati lists 176 FIPs live (June 2026) [S: sahamati.org.in/fip-aa-mapping], but I could not confirm that credit card statements are an activated account type for any card issuer [?]. AA also needs a server and a consent-manager flow, which conflicts with "data never leaves the device".
- **Verdict: not feasible for v1, and not zero-cost.** Revisit only via a licensed FIU partner if the product pivots.

### 1.2 Credit bureau APIs

- CIBIL, Experian, CRIF and Equifax are for regulated lenders or paid B2B partners. They expose tradelines and limits, not the statement date, due date or minimum due [K]. I did not fetch bureau pricing [?].
- **Verdict: skip.**

### 1.3 Gmail API (statement emails)

- Scopes [K, partly V]:
  - `gmail.readonly` is a restricted scope. Google's page confirms that restricted scopes need an assessment by Google-empanelled assessors, repeated at least every 12 months, when restricted data is stored or transmitted on servers [V: developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification].
  - The same page does not state any client-side-only exemption and states no cost [V].
  - `gmail.metadata` is also restricted [K]. It gives headers and labels only, with no body and no attachments, so it cannot yield amounts.
- CASA cost: official figures are not published. Reports range from about $540 (indie, scan plus 2 revalidations, Dec 2025 to Jan 2026) to $15-75k (vendor estimate) [S: indiehackers.com/product/mailnotes, truto.one/google.md].
- 100-user cap: Google confirms unverified apps showing the warning screen are limited to 100 new users in total [V: support.google.com/cloud/answer/7454865]. The "Testing" status has a 100 test-user list and, for non-basic scopes, refresh tokens that expire after 7 days [S: unipile.com/google-oauth-refresh-token/]. I could not verify the 7-day rule from a Google page.
- Client-side token flow: Google Identity Services' token model returns short-lived access tokens (about 1 hour) in the browser, with no refresh token and no server [K, not verified this session]. The user re-consents silently or interactively on expiry. This avoids the server, and the CASA trigger as written ("store or transmit on servers"), but it does NOT remove the need for restricted-scope app verification before going past 100 users. Whether Google waives the security assessment for a pure client-side app is [?]; the manager should email the Google OAuth verification team to get this in writing.
- Alternatives:
  1. User-forwarded or pasted statement email body or PDF: zero verification, works for everyone.
  2. Gmail search link (`mail.google.com/mail/u/0/#search/from:...`) opening the user's own inbox, then the user downloads the PDF and drops it in the app: zero API risk.
  3. Email-client "Share/Open in" to the PWA: Web Share Target accepts files on Android; iOS support is limited [K].
- **Verdict:** v1 ships with manual entry + PDF upload as the primary path. Gmail ships as "beta, up to 100 test users, client-side token only, re-consent weekly or hourly". Decide on verification once usage warrants it.

### 1.4 Statement PDF parsing in-browser

- pdf.js (Mozilla, Apache-2.0) runs fully in the browser, uses a web worker, and supports a password option on `getDocument({data, password})` [K]. Text-based PDFs only; scanned image PDFs would need OCR (tesseract.js, heavy) and are not recommended for v1.
- Approach: extract text items with coordinates, rebuild lines, run per-issuer regex plus a generic fallback (find date near "Due", amounts near "Total/Minimum"). Always show a confirmation screen with parsed values for the user to correct. Log parser version and issuer so mis-parses can be fixed.
- Password rule: the PDF password is a user-specific combo. Do not hardcode. Ask once for name (as on card), DOB and last-4 digits (stored encrypted on-device), then try the candidate formats below in order.

### 1.5 PDF password conventions (CONFLICTING, [S] only; no issuer page confirmed)

Sources found disagree for HDFC, SBI Card, Axis and Kotak [S: easemoney.in/*-credit-card-statement-password, airtel.in/blog, cleartax.in]. Candidate patterns to try automatically:

- A: first 4 letters of name (UPPER) + DDMM
- B: first 4 letters of name (lower) + DDMM
- C: first 4 letters of name + last 4 card digits
- D: last 4 card digits + DDMM
- E: DDMMYYYY (+ last 4)
- F: CRN + DOB (Kotak, one source)

### 1.6 Prioritised issuer table (top 12)

Sender domains are NOT confirmed; aggregators only gave customer-care addresses. Hints [K]: HDFC uses `hdfcbank.net` for statement mails (one forum thread agrees [S: techenclave.com/t/hdfcs-response-to-my-query/257917]). Collect a real From header for each issuer before shipping a matcher.

| #   | Issuer                              | Likely sender domain [K/S]              | Password candidates [S]                 | Field labels (to confirm on real PDFs)                                             |
| --- | ----------------------------------- | --------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------- |
| 1   | HDFC                                | hdfcbank.net / hdfcbank.com             | conflicting: A or C or D                | "Payment Due Date", "Total Dues", "Minimum Amount Due" [K]                         |
| 2   | ICICI                               | icicibank.com                           | B (lower name4 + DDMM), 2 sources agree | "Total Amount due", "Minimum Amount due", "Payment Due Date", "Statement Date" [K] |
| 3   | SBI Card                            | sbicard.com / sbico.in                  | A or E, or DDMMYYYY+last4 (conflict)    | "Total Amount Due", "Minimum Amount Due", "Payment Due Date" [K]                   |
| 4   | Axis                                | axisbank.com                            | conflicting: A or C                     | "Total Payment Due", "Minimum Payment Due", "Payment Due Date" [K]                 |
| 5   | Kotak                               | kotak.com                               | B (one source) or CRN+DOB               | "Total Amount Due", "Minimum Amount Due", "Due Date" [K]                           |
| 6   | American Express India              | americanexpress.com                     | [?] nothing found                       | "Payment Due Date", "Minimum Payment Due", "New Balance" [K]                       |
| 7   | IDFC First                          | idfcfirstbank.com                       | [?]                                     | [?]                                                                                |
| 8   | Yes Bank                            | yesbank.in                              | A (one source)                          | [?]                                                                                |
| 9   | IndusInd                            | indusind.com / indusind.bank.in         | [?]                                     | [?]                                                                                |
| 10  | RBL                                 | rblbank.com                             | [?]                                     | [?]                                                                                |
| 11  | AU Small Finance                    | aubank.in                               | [?]                                     | [?]                                                                                |
| 12  | Standard Chartered / HSBC / Federal | sc.com / hsbc.co.in / federalbank.co.in | [?]                                     | [?]                                                                                |

Only HDFC/ICICI/SBI/Axis/Kotak have any password data. Everything marked [?] was not found. Parser labels above are from memory [K]; none were verified against an actual statement. Recommend building the parser from 3-5 real sample statements per issuer (users or team members), starting with HDFC, ICICI, SBI, Axis.

### 1.7 Date and amount rules

- Statement-to-due gap: sources say typically 15-20 days (some say 18-25) [S: stablemoney.in/blog/credit-card-billing-cycle, cardtrail]. This is market practice. I did not find an RBI floor of 15 days [?]; do not use a fixed offset as truth, only as a validation sanity check (due date should fall 10-30 days after statement date).
- RBI Master Direction (2022) was amended effective 2024-03-07 to let cardholders change the billing cycle at least once; late-payment charges are computed from the statement's due date [S: businesstoday.in, moneylife.in; RBI PDF at website.rbi.org.in/documents/87730/39710850/1.+Circular+-++Amendment+to+MD.pdf not read].
- Minimum due formulas differ by issuer and change (HDFC revised from the June 2025 statement) [S: bankbazaar.com]. Always read it from the statement; never compute.

**Verdict:** Manual entry is the reliable core. PDF upload gives the best automation per effort. Gmail is a beta add-on. AA and bureaus are out.

---

## 2. Deeplinks to pay credit card bills

What is verified: the NPCI UPI linking spec defines `upi://pay?pa=<VPA>&pn=&am=&cu=INR`, with percent-encoding required [V-ish: labnol.org/files/linking.pdf, v1.6 draft 2017]. It is a payee-VPA payment (P2P/merchant).

What I could NOT verify (all [K]/[?]):

- Card bills are paid through BBPS (biller category "Credit Card") inside apps (GPay, PhonePe, Paytm, Amazon Pay, CRED, PayZapp). BBPS has no public deeplink that takes card number plus amount; I found none.
- Issuers do not publish a UPI VPA for card bill payment that I could find [?]. A UPI QR or VPA is usually not the card account.
- App scheme links (`tez://`, `phonepe://`, `paytmmp://`) open the app's home or pay screen; they cannot start a BBPS credit-card bill with prefilled card/amount [K, unverified].
- HDFC's PayZapp documents an in-app flow (Financial Services > Credit Card > issuer > card number > amount) with no deeplink [V: v.hdfcbank.com/payzapp/article/how-to-pay-credit-card-bill-using-upi.html].
- CRED / Amazon Pay universal links: no documented prefill API [?]. Opening the app only.
- Issuer web pay pages (HDFC, ICICI, SBI Card quick pay): exist [K] but I did not verify URLs, and they ask for card number/OTP on their page, with no prefill.

**Honest position:** prefilled one-tap card bill payment is not possible with public interfaces.

**Best-effort Pay button design:**

1. Tap "Pay": copy the due amount (and optionally the last 4 digits) to the clipboard, show a toast "Amount copied".
2. Open the user's preferred app: a generic `upi://pay` is NOT correct for card bills, so use the app's plain launch link (user picks GPay / PhonePe / Paytm / CRED / Amazon Pay once in settings). Use the verified scheme or universal link per app after testing on real devices.
3. Fallback: open the issuer's pay-now page in a new tab (URL stored per issuer, user-editable), then the issuer's netbanking.
4. After returning, ask "Did you pay?" and mark as paid (manual).
   Never store full card numbers; store only last 4.

**Verdict:** launcher plus clipboard plus mark-as-paid. Do not promise prefill.

---

## 3. Reminders without a server

- Notification Triggers: Chrome's page says development "has ended" because consistent cross-platform behaviour could not be guaranteed. Chrome-only, was an origin trial [V: developer.chrome.com/docs/web-platform/notification-triggers]. **Do not depend on it.**
- Periodic Background Sync: experimental, limited availability, Chrome requires an installed PWA and gates by site engagement; the interval is only a minimum and not guaranteed [V: MDN]. Not supported on iOS/Safari [K]. Use only as an opportunistic top-up.
- iOS web push: needs iOS/iPadOS 16.4+, installed to the Home Screen with a standalone manifest, permission requested on a user gesture, delivered via APNs [V: webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/]. But push needs a push server to send, which breaks "no server" unless a minimal, stateless sender holding no user data is accepted (decision for the manager).
- Calendar files: an `.ics` with VEVENT plus VALARM (RFC 5545 `BEGIN:VALARM / TRIGGER:-P3D / ACTION:DISPLAY`) is the most reliable serverless method on every platform [K]. Google Calendar template link `https://calendar.google.com/calendar/render?action=TEMPLATE&text=&dates=&details=` works but has no reliable reminder-offset parameter [K, unverified].

**Layered recommendation:** (1) .ics download / "Add to Calendar" per bill with alarms at due-3d and due-1d (primary, reliable). (2) In-app banner/badge on open. (3) Local notifications from the service worker when the app is open or on periodic sync where available (best effort). (4) Optional: web push via a minimal stateless relay only if the manager accepts a server.

**Verdict:** calendar-first. Tell users clearly that web-only reminders are best-effort.

---

## 4. Local-first storage

- IndexedDB via Dexie (MIT) is the standard choice [K]. Keep amounts as integer paise.
- Encryption: WebCrypto AES-GCM with a key derived by PBKDF2 (built in, use at least several hundred thousand iterations) or Argon2id via a WASM library (stronger, adds a dependency) [K]. Encrypt record payloads; keep index fields minimal, since encrypted fields cannot be queried. Offer "no passphrase" mode, with the data still local.
- WebAuthn PRF for passkey-derived keys: support is patchy. Chrome 147+/Firefox 148+/Safari 26.5 reported working with native passkeys, but password-manager extensions (1Password, Bitwarden) and security keys on Safari are unreliable [S: corbado.com/blog/passkeys-prf-webauthn, 1password.community thread, bugs.webkit.org/show_bug.cgi?id=311099]. Treat as an optional progressive enhancement only, with a passphrase fallback always.
- Persistence: call `navigator.storage.persist()` and show the result. Safari's 7-day cap on script-writable storage after no interaction applies to browser tabs; installed Home Screen apps are reported exempt [S: itnews.com.au, mjtsai.com; no official WebKit page retrieved]. iOS grants persist() inconsistently [S, anecdotal].
- Backup: encrypted JSON export/import (file download, share sheet) is the mandatory safety net. Optional sync via Google Drive `appDataFolder` (scope `drive.appdata`, sensitive not restricted [K]); upload the already-encrypted blob so Google never sees plaintext. Not verified this session.

**Verdict:** Dexie + AES-GCM (PBKDF2 or Argon2id) + persist() + encrypted export as v1. Drive appDataFolder sync and WebAuthn PRF as later options.

---

## 5. UI library: OAT vs shadcn/ui

OAT facts [V: github.com/knadh/oat, oat.ink/components]:

- Repo knadh/oat, MIT, 5.6k stars, 265 forks, 275 commits, no published releases shown; README warns it is sub-v1 with breaking changes expected (the search summary said so; the fetched page did not repeat it, so treat as [S]).
- About 7KB CSS + 2.9KB JS gzipped (site) or about 10KB (README). Zero dependencies, semantic HTML styled without classes, a few web components (`ot-*`: Dropdown, Tabs, TagInput, Upload).
- Components: accordion, alert, avatar, badge, breadcrumb, button, card, dialog, form elements, meter, pagination, progress, skeleton, sidebar, switch, table, tabs, tooltip, toast, grid. No chart or date picker listed.
- Accessibility: ARIA and keyboard claims for some components; no WCAG conformance or audit statement.
- Framework: no React/Vue wrappers documented; theming is CSS variables, with details not read.

shadcn/ui facts [V: ui.shadcn.com/docs/changelog]: actively developed in 2026 (monthly releases through October 2026), Base UI is now the default primitive with Radix and React Aria also supported, new Toast component, CLI v4, Charts section exists (Recharts-based [K]).

| Criterion                      | OAT                                               | shadcn/ui                                  |
| ------------------------------ | ------------------------------------------------- | ------------------------------------------ |
| Next.js App Router / React fit | no React API; web components need client wrappers | native, copy-in components                 |
| Charts                         | none                                              | Recharts-based chart components            |
| Date picker                    | none                                              | Calendar/DatePicker (react-day-picker) [K] |
| Forms (react-hook-form + zod)  | plain HTML only                                   | Form pattern documented [K]                |
| Dialogs/sheets/drawer          | dialog only (no sheet found)                      | Dialog, Sheet, Drawer (vaul) [K]           |
| Accessibility                  | partial claims, unaudited                         | built on audited headless primitives       |
| Size                           | tiny (~10KB)                                      | per-component, tree-shaken; Tailwind build |
| Maintenance                    | pre-v1, one maintainer, no releases               | large ecosystem, frequent releases         |
| Licence                        | MIT                                               | MIT                                        |

**Verdict: shadcn/ui wins** for dashboard charts, forms, sheets, and date pickers in a Next.js App Router PWA. OAT is attractive for tiny static pages but would force you to build charts, pickers and sheets yourself, with no React integration. Hybrid: none needed; optionally borrow OAT's "style semantic HTML" ideas for the marketing/landing page only. Use Base UI primitives (shadcn default) and Recharts; keep chart code lazy-loaded for PWA size.

---

## Risks and open questions for the manager

1. Issuer password formats and field labels are unverified (third-party blogs conflict); we need 3-5 real sample statements per top issuer.
2. Gmail: will Google require restricted-scope verification plus CASA even for a client-side-only token flow? Not answerable from public docs; ask Google or budget $540 to $75k+ per year (reported range) and treat Gmail as a capped beta (100 users).
3. Gmail "Testing" status refresh tokens reportedly last 7 days (unverified); client-side flow means re-consent often.
4. Issuer sender domains are unconfirmed; false matches could parse non-statement mail.
5. No public deeplink pays a card bill with prefilled card/amount; the Pay button is a launcher plus clipboard and users may feel it is underwhelming.
6. Reminders are best effort without a server: Notification Triggers is dead, Periodic Sync is Chrome-only and unguaranteed; .ics is the only dependable layer. Is a stateless push relay acceptable?
7. iOS storage eviction and persist() behaviour are only secondhand; mandate encrypted export reminders.
8. WebAuthn PRF is unreliable across password managers and Safari; passphrase must remain the default (and lost passphrase means lost data).
9. Parsers will break when issuers change templates (e.g. HDFC changed minimum due in 2025); budget ongoing maintenance and a user-correction fallback.
10. DPDP Act and Google API-services policy obligations for a Gmail-reading app (privacy policy, limited use disclosure) have not been researched; get legal review before public launch.
