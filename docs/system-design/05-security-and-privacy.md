# 05 - Security and Privacy

## 1. Assets and adversaries

| Asset                                                                                                   | Sensitivity                              | Where                                          |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------- |
| Card last4 + issuer + nickname, due dates, user-logged payment amounts (optional), plugin spend entries | High (financial profile)                 | Vault ciphertext on device                     |
| Due dates / counts (plaintext index)                                                                    | Low-medium                               | IndexedDB index columns                        |
| Notification text                                                                                       | Low by default (generic/card names only) | Outbox, device-key encrypted                   |
| Statement PDFs / emails (optional plugins)                                                              | Very high                                | Memory only, never persisted                   |
| Gmail access token (post-v1)                                                                            | Very high                                | Memory only, 1 h lifetime                      |
| Passphrase / DEK                                                                                        | Critical                                 | Memory only (DEK as non-extractable CryptoKey) |
| Signing key for catalog                                                                                 | Critical                                 | GitHub Actions encrypted secret                |

| Adversary                                           | In scope?                   | Notes                                                     |
| --------------------------------------------------- | --------------------------- | --------------------------------------------------------- |
| Curious/compromised **server or host**              | Yes                         | Holds no user data (02 A.9)                               |
| Network attacker                                    | Yes                         | HTTPS/HSTS; signed catalog; CSP                           |
| Someone with a **lost/stolen device**, vault locked | Yes                         | Encrypted at rest; outbox leaks only low-sensitivity text |
| Someone with a device, **vault unlocked**           | Partly                      | Auto-lock, hide amounts on blur                           |
| **XSS / supply-chain** in our bundle or deps        | Yes (primary residual risk) | CSP, minimal deps, lockfile, review, SRI-like hashes      |
| Malicious browser extension / malware on device     | No (documented)             | Can read DOM and memory                                   |
| Nation-state/legal compulsion on user               | No                          |                                                           |

## 2. Content Security Policy and headers (Vercel `headers`, generated at build; static export means no per-request nonces, so inline scripts are allowed by **hash**)

Main origin (all routes except `/connect/*`):

```
default-src 'self';
script-src 'self' 'sha256-<build-generated hashes>' 'wasm-unsafe-eval';   # wasm only if pdf.js features/Argon2 need it
worker-src 'self' blob:;                      # pdf worker, SW
style-src 'self' 'unsafe-inline';             # ASSUMPTION: needed by UI lib; replace with hashes if feasible
img-src 'self' data: blob:;
font-src 'self';
connect-src 'self' https://<api-origin>;      # catalog only
manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none';
require-trusted-types-for 'script';  trusted-types default;    # where the framework allows
upgrade-insecure-requests
```

Other headers: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`, `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`. The SW file is served `Cache-Control: no-cache`.

Isolated route `/connect/gmail` (post-v1) and `/connect/drive` (later): separate, relaxed CSP adding `script-src https://accounts.google.com/gsi/client`, `connect-src https://gmail.googleapis.com https://www.googleapis.com`, `frame-src https://accounts.google.com`. Google scripts therefore never load on pages that display the vault. The OAuth token passes to the vault pages via `BroadcastChannel`/in-memory handoff only.

No third-party analytics, ads, session replay, error reporters, fonts, or CDNs. Dependency policy: `pnpm audit` in CI, Renovate, `--frozen-lockfile`, no postinstall scripts (`pnpm` `ignore-scripts`/allowlist), license check, size budget.

## 3. Encryption (summary; full design in `01` section 6)

AES-256-GCM per record with AAD binding to table/id/version; DEK wrapped per unlock slot (passphrase via PBKDF2-SHA256 600k, optional passkey PRF, recovery code); non-extractable keys; auto-lock; backup under a separate key. Honest limits: XSS or a malicious extension defeats it; plaintext index columns (dates, counts) leak patterns; PBKDF2 is GPU-attackable if the passphrase is weak (hence strength gate; Argon2id later); browsers may evict storage; memory is not zeroised in JS.

## 4. Gmail scope minimisation (POST-V1 optional plugin)

- Token model via Google Identity Services (access token only, ~1 h, kept in memory; **no refresh token and therefore no client secret and no backend OAuth helper**). Silent re-auth when the Google session allows; otherwise re-consent. This is why the "OAuth helper" is _not_ needed.
- Scope: `https://www.googleapis.com/auth/gmail.readonly` is the smallest scope that returns bodies/attachments (`gmail.metadata` omits bodies and cannot search content; `gmail.readonly` is a **restricted** scope).
- Query narrowing on the client: `from:(domain list from catalog) newer_than:90d has:attachment OR subject:(statement)`; fetch only matching message ids, then only those messages; never list or read other mail; discard non-matching payloads immediately.
- **Verification/cost risk**: restricted scopes for a public app require Google OAuth verification plus an annual third-party security assessment (CASA), which is not $0. Until/unless that is funded, the app can only run in "Testing" mode (<= 100 manually listed test users, consent screen shows "unverified", refresh of consent every 7 days). This is a primary reason Gmail is post-v1. Alternatives that stay inside the zero-cost rule: user uploads `.eml`/PDF manually (the PDF plugin), or forwards nothing anywhere. See Q2.
- Drive `drive.appdata` (non-sensitive scope, no CASA) is the better optional channel for encrypted backup sync (later).

## 5. PDF handling (optional plugin, M2)

- Read via `File`/`<input>`/drag-drop into an `ArrayBuffer`; transfer (not copy) to the parser Worker; pdf.js runs with `isEvalSupported: false`, `disableFontFace`-style hardening, no network (`connect-src` forbids it anyway); password prompts happen in memory; passwords not logged or stored (unless user opts into remembering name/DOB pieces, stored encrypted).
- PDF/Gmail intake plugins are the **only** place bill amounts may later be auto-filled (`Bill.pluginAmounts`, `Statement`); manual intake never asks for them.
- Output is `TextDocument -> ParsedStatement` (no PAN field exists in the type; 13-19 digit runs are redacted before leaving the parser). Review screen requires user confirmation of due date/amounts before persisting (`userVerified`).
- Never persisted: file bytes, text layer, images. Worker is terminated after each import; buffers dropped; a 5 s CPU budget / size cap (e.g. 15 MB, 40 pages) mitigates malicious PDFs and ReDoS from rule packs.
- A keyed hash of the bytes is stored only to detect duplicates.

## 6. Secure deletion

- "Delete all data": close DB, `indexedDB.deleteDatabase`, `caches.delete` all, unregister SW, clear `localStorage/sessionStorage`, then verify empty. Because everything is ciphertext under a DEK, we first **destroy the keyring** (crypto-erase) so even undeleted blocks on disk are unreadable.
- Card/bill delete: soft delete 30 days then physical delete + overwrite not possible in IndexedDB; crypto-erase of whole vault is the only strong guarantee (documented honestly).
- Calendar events already exported are outside our control; UI lists this.
- Lock/logout drops keys and clears decrypted caches; `Clear-Site-Data` header is not used on normal routes.

## 7. Other controls

- Clipboard: never used. The "Open my payment app" button only opens the chosen app or issuer pay page; it carries no amount and writes nothing to the clipboard.
- Deeplinks: allowlisted schemes; no data in URLs; opened only on user gesture.
- Screens: `hideAmountsOnBlur`; no PII in page titles, URLs or history state; routes use ids that are random ULIDs.
- Updates: SW update flow prompts for reload; `minAppVersion` from the signed manifest forces upgrades for catalog changes.
- Reproducible builds and signed git tags; deployed bundle hash published in release notes.
- Secrets in repo: none (gitleaks in CI). Catalog signing key only in CI secret; rotation procedure in `02` A.7.
- Fixtures: synthetic only; CI check that no fixture contains Luhn-valid 13-19 digit numbers or real issuer account formats.

## 8. Privacy policy bullets (plain language)

1. All your card details and bills stay on your device, encrypted. We never receive them.
2. We run no accounts, no analytics, no ads, no trackers.
3. The app downloads a public list of banks, holidays and app links from our server; this request contains nothing about you (your IP is visible to our host like any website visit).
4. If you connect Gmail or Google Drive (optional, later), the data flows directly between your browser and Google. We cannot see it.
5. If you add reminders to your calendar, your calendar provider may store them; by default they contain card names and dates only; amounts are never collected for reminders.
6. If you forget your passphrase and have no recovery code or backup, your data cannot be recovered.
7. You can export or delete everything at any time in Settings.
8. We do not store full card numbers, CVV, expiry or PINs and the app never asks for them.

## 9. Compliance notes: India DPDP Act 2023 (not legal advice; ASSUMPTION: counsel to confirm)

- **Applicability**: the DPDP Act applies to digital personal data processed in India. A Data Fiduciary determines the purpose and means of processing. With strictly on-device processing, the developer never obtains the data; the better reading is that the app is a tool the user runs on their own data (also note the exemption for processing by an individual for personal/domestic purposes). The risk is regulatory interpretation of the app-as-processor; mitigation is architectural (no collection) and documentation.
- Where we _do_ touch data: standard web server logs at the host (IP), and Google flows (Google is a separate fiduciary; the user consents directly in Google's consent screen).
- Even if treated as a fiduciary, we follow the principles anyway: purpose limitation (reminders/summaries only), data minimisation (no PAN/CVV, last4 only), notice in plain English in-app at onboarding with a clear consent step before enabling optional features, easy withdrawal (disconnect Google, delete all data), accuracy (user edits), security safeguards (this document), breach notification (n/a: no data held; for the app bundle compromise we will publish a notice), grievance contact in the app and policy.
- Children: the app is for adults with credit cards; no verifiable-parental-consent flow needed; policy states 18+.
- Record keeping: this design doc and the open-source code serve as the technical record. Verify current status and phased commencement of the DPDP Rules (notified in 2025; ASSUMPTION that obligations phase in over 12-18 months) before launch.
- RBI/PCI: we do not store card data beyond last4, so PCI-DSS scope is out. We do not initiate payments, so RBI payment-aggregator rules do not apply. We do not provide financial advice; UI copy avoids product recommendations.
