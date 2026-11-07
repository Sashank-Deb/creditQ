# 01 - UX strategy v2 ("CreditQ", placeholder name)

Supersedes `design/01-ux-strategy.md`. Direction B is chosen. Open `review.html` for every screen. Personas, jobs to be done, tone and the accessibility baseline from v1 still apply (v1 section 2, 3, 10, 11), with the changes below.

## 1. Principles

Reminders are the product. The app tells the user one thing at a time: what is due, when to pay, and opens their payment app. **The user never has to enter or look at an amount.** Hick's Law: one primary action per screen, at most 3 top-level destinations, at most 5 options per group, one question per step, advanced items behind one "Customise".

## 2. Reminder model (unchanged)

| Concept | Rule |
|---|---|
| Group | Cards whose due dates fall within 7 days of the earliest due date (decision pending). |
| Pay day | 5 days before the earliest due date, 9:00 am; stepper 1-10 days in Settings; weekend or holiday moves it earlier to the previous working day. |
| Follow-ups | 2 days before and on the due day, only if unpaid. Max 3 notifications per group; none after the due date (in-app banner only). |
| Snooze | In 1 hour, this evening 7:00 pm, tomorrow 9:00 am (default). Never past the due date. |
| Closing | Mark as paid, per card. |

Mockup example: today Fri 28 Feb (Pay day in 3 days). Cards due Sat 8 Mar, Mon 10 Mar, Wed 12 Mar. Pay day Mon 3 Mar. Follow-ups Thu 6 Mar and Sat 8 Mar.

## 3. Amounts: where they live now

| Where | Rule |
|---|---|
| Add card | Never asked (2 steps: which card, due date). |
| Home, notifications, calendar events | Never shown. Dates and card names only (calendar: not even names by default). |
| Mark as paid | The only place an amount is asked: sheet "How much did you pay?" - numeric field, optional chips, Skip. Skip still marks the card paid. |
| Chips | Total due / Minimum due / Other appear only if the user saved those values under the card's Customise. Otherwise the sheet is just the field and Skip. |
| Spends | Built only from logged paid amounts; skipped payments are not counted (and the screen says so). Empty until the first logged payment. |
| Card detail | Shows "Last paid" (from the log) when there is one. |

## 4. Open <app>

One outline button on the focus tile and on Card detail: "Open Google Pay" (user's own app). It only opens the app: no clipboard copy, no toast, no prefill promise. App chosen once on first tap (5 apps + "something else") or in Settings. If it cannot open, a plain toast: "Couldn't open Google Pay. Open it yourself, then come back and tap Mark as paid."

## 5. Information architecture

```
Home (empty on first run)
  Top: calendar icon | Due soon (count) / Spends | settings icon        <- 3 destinations
  Due soon: soft banner, stacked card tiles (tile 1 in focus), under-tile pills
    Mark as paid -> amount sheet -> next tile in focus
    Open <app> -> (first use: choose app)
    Remind me later -> snooze sheet
    Bottom strip: ALL (n), card thumbnails -> Card detail, "+" -> Add card
  Spends: All cards | Each card
Add card: 1 Which card -> 2 Due date -> Done + reminders
Card detail: Open app / Mark as paid / Customise
Settings: privacy panel, Pay day stepper, Payment app, calendar, Customise
```

## 6. Flows

**First run (about 40 s).** Empty Home with one button -> "Which card is it?" (name, last 4, bank chips; about 15 s) -> "When is it due?" (date prefilled; about 8 s) -> Done: shows Pay day and a sample notification, primary "Turn on reminders" (permission asked here), or "Add to my calendar instead" (about 10 s). Home shows the tile. Further cards: about 25 s each.

**Pay day.** 9:00 am notification "Pay day: 3 card bills" -> Home with tile 1 in focus -> Open Google Pay (first time: pick app) -> pay in the app -> back, Mark as paid -> "How much did you pay?" (chip or Skip) -> tile 2 becomes the focus -> ... -> "All done. Next Pay day: Mon 31 Mar."

**Early payer.** Before Pay day the same Home shows "Pay day in 3 days"; the user can pay and mark paid early; reminders for paid cards stop.

**Spends.** Tap Spends in the top control; toggle All cards / Each card; nothing else to do.

## 7. Edge states

| State | Behaviour |
|---|---|
| Bill not generated yet | Not a state any more because no amount is needed: the due date alone drives reminders. If the bank's due date changes the user edits it in Customise. |
| Already paid outside the app | Mark as paid from Home or Card detail; Skip the amount. |
| Missed it | home-missed: warning banner, "1 day late" flag on the tile, pill "Overdue since Sat 8 Mar". Neutral copy. |
| All paid | home-done: tiles show Paid, banner "All done. Next Pay day: Mon 31 Mar." |
| Offline | Everything works; only opening the payment app can fail. |
| Notifications blocked / unsupported | After the Done step: "Reminders are off. Add to calendar instead?" Calendar export is the guaranteed channel. |
| App won't open | Plain toast, see section 4. |
| Spends empty | "Log what you paid when you tap Mark as paid and your spends show up here." |
| Skipped amounts | Spends footnote counts them ("1 skipped in Jan"). |
| Statement-parse failure | Not applicable (no import). |

## 8. Choice-count table

| Screen | Primary | Secondary / quiet | Options | Decisions | Check |
|---|---|---|---|---|---|
| Empty Home | Add your first card | settings icon | - | 2 | ok |
| Home (countdown / payday / missed) | Mark as paid (tile 1 only) | Open app; 2 read-only under-tile pills | - | 3 | ok |
| Home all paid | none | read-only | - | 0 | ok |
| Top control + strip (chrome) | - | Due soon, Spends, settings (3 destinations) + calendar icon; ALL + 3 thumbs + "+" | - | switcher is a selector, not a destination | ok |
| Paid sheet | Save and mark paid | Skip | up to 3 chips | 1 field + 3 chips + 2 = 6, one question | ok (3 <= 5) |
| Paid sheet, no saved values | Save and mark paid | Skip | - | 3 | ok |
| Snooze | - | Cancel | 3 times | 4 | ok |
| Choose app | - | something else | 5 apps | 6 (one group of 5), shown once | ok |
| Add 1/2 | Next | Cancel | 5 chips + 2 fields | one question | ok |
| Add 2/2 | Save card | Back | date field | 3 | ok |
| Add done | Turn on reminders | Add to calendar, Not now | - | 3 | ok |
| Notification | - | Remind me later, Open | - | 2 | ok |
| Calendar event | Add to calendar | Include card names | - | 2 | ok |
| Card detail | Mark as paid | Open app, Customise | - | 3 | ok |
| Spends | - | All / Each toggle | 2 | 2 | ok |
| Settings | - | stepper, Payment app, Calendar, Customise, "What's stored" | - | 5, no lists | ok |

Per-screen detail (choices, hidden, defaulted) is in `README.md` and under each screen in `review.html`.

## 9. Card tile design rules

- Tile = issuer-style name, chip graphic, last 4, cardholder, "Due on 8 Mar". No third-party logos, no network marks; patterns and gradients are invented.
- One gradient per card from a small vetted set (min white-text contrast about 5:1 including pattern overlays). User recolouring offers only vetted swatches.
- Only the focus tile shows buttons. The pill under each tile carries the Pay day countdown ("Pay day in 3 days", "Pay day is today", "Overdue since Sat 8 Mar", "Paid 3 Mar").
- Home never shows rupee amounts.

## 10. Accessibility and tone

Unchanged from v1: AA contrast, 44 px targets (switcher thumbnails and pills have 44 px hit areas), focus rings, status chips with text, reduced motion, `en-IN` formatting via `Intl.NumberFormat("en-IN")` with lakh grouping for the Spends screen and the paid sheet (for example ₹3,89,275), plain calm copy with no scolding. Tiles carry an `aria-label` with card name; the strip is a `nav` with labelled thumbnails.

## 11. Risks to confirm

- Scheduled notifications from an on-device PWA are unreliable (iOS needs installation); calendar export is the guaranteed channel. A push relay with no amounts would bend "all data stays on device".
- Opening payment apps uses URL schemes and Android intents: best effort, we only promise to open.
- Holiday list must be bundled and updated yearly.
- Mark as paid is user-asserted.
