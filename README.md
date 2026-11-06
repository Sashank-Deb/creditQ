# CreditQ

Credit card bill reminders for India that group your bills into one pay day. All data stays on the device.

## Layout

| Path            | What                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core` | Pure TypeScript domain logic: civil dates, business calendar, grouped pay days, reminder dates, en-IN formatting. No DOM, no clock, no I/O. |
| `apps/web`      | Next.js 16 PWA (static export) with SCSS modules on the Sage & Clay theme.                                                                  |

## Commands

```bash
corepack pnpm install
corepack pnpm check          # lint (Airbnb flat config) + prettier + typecheck + tests
corepack pnpm --filter @creditq/web dev
```

## Engineering rules

- Test first. Core rules are pinned by the worked examples in `docs/system-design/03-grouping-algorithm.md` plus fast-check properties.
- Custom styles are SCSS; tokens are in `apps/web/src/styles/_tokens.scss` (sizes, type, motion, mixins) and `theme.css` (colours).
- `packages/core` must stay deterministic. Lint forbids `Date`, `Date.now`, `Math.random`, `Intl` and the DOM there.
- No amounts in reminders, calendar events or the Pay-day UI. An amount is only asked for in "Mark as paid", and it can be skipped.

## Status (M1, in progress)

- Done: grouping engine, reminder dates, Home screen with Mark as paid (amount sheet, Skip, Undo), using sample cards.
- Next: on-device encrypted vault (Dexie), the 2-step add-card flow, `.ics` export, service-worker notifications, Spends view.
