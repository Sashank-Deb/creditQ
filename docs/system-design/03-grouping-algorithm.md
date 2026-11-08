# 03 - Grouped Payment Day Algorithm

Module: `packages/core/src/grouping` (pure TS). Contract: `GroupingEngine` in `02-api-contracts.md` B.2. Config lives in `Settings.grouping` (`01`).

## 1. Semantics (manager-decided rule, then our precise reading of it)

**Rule.** The reminder day for a bill (or for a group of bills with due dates in the same window) is **`leadDays` before the group's earliest due date** (default **5**, user-configurable 1..10, overridable per card). If that computed day is a weekend or a bank holiday, move **earlier** to the previous working day. Bills whose due dates fall in the same window share that single day. Follow-ups: **2 days before** each bill's due date and **on the due day**, only if still unpaid.

Precise reading (decisions):

| #   | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Why                                                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| D1  | The reminder day _is_ the recommended payment day ("pay day"). One notification covers the whole group.                                                                                                                                                                                                                                                                                                                                                                       | Product promise: "remind once".                                                                                 |
| D2  | Day rolling is always **earlier**, never later (Sat/Sun and holidays -> previous working day; repeat until a working day).                                                                                                                                                                                                                                                                                                                                                    | Paying early costs nothing on the interest-free period; paying late costs money.                                |
| D3  | "Weekend" = Saturday and Sunday for the _reminder day_, even though RBI treats 1st/3rd/5th Saturdays as working. Holidays come from the signed catalog (national + optional state). Setting `allowWeekendPayDay` exists but defaults to false.                                                                                                                                                                                                                                | Predictable for users; conservative.                                                                            |
| D4  | **Window**: two bills share a group if the spread between the earliest and latest due date in the group is <= `groupWindowDays` (default **7**).                                                                                                                                                                                                                                                                                                                              | "Due in the first week" example.                                                                                |
| D5  | A **hard safety cap** `hi` guarantees the pay day is never so late that a posting lag could miss the due date, even if the user sets `leadDays` = 1: `hi = subBusinessDays(prevBusinessDayOrSame(due - safetyBufferDays), postingLag)`. Effective target `eff = min(rolledLeadDay, hi)`.                                                                                                                                                                                      | Lag awareness: UPI/NetBanking credit to the card account can take 1+ business days; weekends/holidays stall it. |
| D6  | Not before `availableFrom` (statement date) for that bill.                                                                                                                                                                                                                                                                                                                                                                                                                    | Paying before the statement is generated just changes the statement; the statement content is not final.        |
| D7  | We never rely on "due date on a holiday rolls to the next working day" (`relyOnHolidayRollover=false`) because issuer behaviour is not uniform.                                                                                                                                                                                                                                                                                                                               | P7: fail safe.                                                                                                  |
| D8  | **The engine depends only on due dates** (plus `availableFrom`, lead, lag, calendar). Amounts are not collected up front and never enter grouping, reminder text, or the Pay-day UI. Interest-free logic: paying anywhere in `[statementDate, dueDate]` is interest-equivalent for users who clear the bill, so earliness is free except for liquidity; the only price of earliness is cash-flow, bounded by `leadDays <= 10` and `groupWindowDays`. No cost model is needed. |

## 2. Definitions

For bill `i` (open, unpaid, not excluded; `status in {projected, open, overdue}`):

```
due_i        CivilDate           bill.dueDate
lead_i       = card.groupPrefs.leadDays ?? settings.grouping.leadDays        (1..10)
lag_i        = bill.postingLagBusinessDays ?? settings.postingLag[payMethod_i]   (business days)
lo_i         = bill.availableFrom                                              (statement date; for projected bills: projected statement date)
t_i          = rollEarlier(due_i - lead_i days)       // rollEarlier(d): while !isPayDay(d) d -= 1 day
hi_i         = subBusinessDays( prevBusinessDayOrSame(due_i - safetyBufferDays), lag_i )
eff_i        = min(t_i, hi_i)                          // both are working days => eff_i is a working day
isPayDay(d)  = isBusinessDay(d) && (allowWeekendPayDay || !isWeekend(d))
```

`isBusinessDay` (from `BusinessCalendar`): not Sunday, not holiday, and not an RBI non-working Saturday. `isPayDay` additionally excludes every Saturday (D3).

## 3. Algorithm

Input: open bills, `today`, config, calendar, optional previous groups. Output: `PlannedGroup[]`.

```text
function plan(input):
  B <- bills where status in {projected, open, overdue} and not excluded and due <= today + horizonDays
       (paid/void/excluded go to `skipped`)
  # pinned bills: bill.pinnedPayDay != null -> own group at that day (validated against hi; warn if > hi)
  compute t_i, hi_i, eff_i, lo_i for every i
  earliestAllowed <- today if isPayDay(today) else nextPayDay(today)       # cannot plan in the past

  U <- sort(B \ pinned, by (eff_i asc, due_i asc, billId asc))             # total order => deterministic
  groups <- []
  while U not empty:
    a <- U.first                                    # anchor: the bill that must be paid earliest
    P <- max(eff_a, earliestAllowed, lo_a)          # candidate group day
    P <- adjustDay(P)                               # if P was pushed by clamps, make sure it is a pay day (next pay day)
    members <- [a]; dueMin <- due_a; dueMax <- due_a
    for j in U[1..]:                                # already sorted by eff => eff_j >= eff_a
      if lo_j > P: continue                         # bill not available yet on day P (statement later)
      if P > hi_j: continue                         # P must not exceed the member's hard cap (only possible if P was clamped later)
      newMin <- min(dueMin, due_j); newMax <- max(dueMax, due_j)
      if newMax - newMin > groupWindowDays: continue
      members.add(j); dueMin <- newMin; dueMax <- newMax
    remove members from U
    risk <- if P > min(hi over members) then 'late' else if (min(hi) - P) < 2 working days then 'tight' else 'ok'
    groups.add(makeGroup(P, members, risk, explanation))
  apply stability(previous, groups)                 # section 6
  return groups sorted by payDay, then key
```

Notes on the loop:

- Because `U` is sorted by `eff`, every later bill has `eff_j >= eff_a`. Without clamping, `P = eff_a <= eff_j <= hi_j`, so the cap condition is automatically met and `P` is never later than any member's own preferred day. That is the invariant "**a bill is only ever paid on or before its own effective target**" (the group may pull a bill _earlier_, never later).
- If clamping moved `P` later than `eff_a` (the plan is late: today is already past the ideal day), `P > hi_j` is rechecked per member; members whose cap is exceeded are not "silently grouped", they form their own `late` group (their own `P` is also clamped to `earliestAllowed`, so the same day, flagged `late`). Net effect: late bills still get a reminder on the earliest allowed day, but with a late-risk flag and distinct copy.
- The loop is greedy over a total order. With no per-card overrides, `eff` is monotone non-decreasing in `due`, and the greedy partition equals the classic minimum-cardinality partition of sorted points into windows of width W (greedy is optimal for interval/window covering), so **the number of groups is minimal**. With overrides the result is still valid and deterministic but minimality is not guaranteed (documented trade-off).
- Within a group, `lastSafeDay = min(hi_j)` and `earliestOkDay = max(lo_j)` are stored for the UI ("you can also pay any time between X and Y").

### 3.1 Day helpers (all O(1) amortised with a precomputed per-year business-day index; loops are bounded by the longest holiday+weekend run, <= 8 days)

```text
rollEarlier(d):            while !isPayDay(d): d <- d - 1; return d
prevBusinessDayOrSame(d):  while !isBusinessDay(d): d <- d - 1; return d
nextPayDay(d):             d <- d + 1; while !isPayDay(d): d <- d + 1; return d
subBusinessDays(d, n):     repeat n times { d <- d - 1; while !isBusinessDay(d): d <- d - 1 }; return d
```

### 3.2 Follow-up and per-bill dates (consumed by the ReminderScheduler, see `04`)

For each bill `i` in a group (unpaid):

- `followup_i = rollEarlier(due_i - 2 days)`; dropped if `followup_i <= groupPayDay` (nothing new to say) or `< today`.
- `dueDay_i = due_i` (the actual due date, **not** rolled: it is the day the bill is due even if it is a Sunday; copy says "due today, pay now via UPI/net banking").
- Reminders on the same date for different bills are **coalesced** into one notification ("1 bill due today, 1 bill due in 2 days").

## 4. Worked examples (use as golden tests; config: leadDays 5, window 7, safety 1, lag 1 business day, Mon-Fri working days unless stated, no holidays)

Calendar anchor: 2026-12-01 is a Tuesday.

### Example 1: the canonical case (due Thu Dec 3, Sat Dec 5, Mon Dec 7)

| Bill | due            | `t` = rollEarlier(due-5)     | `hi`                                                         | `eff`      |
| ---- | -------------- | ---------------------------- | ------------------------------------------------------------ | ---------- |
| A    | Thu 2026-12-03 | Sat Nov 28 -> **Fri Nov 27** | Dec 3-1=Wed Dec 2 -> minus 1 BD = **Tue Dec 1**              | Fri Nov 27 |
| B    | Sat 2026-12-05 | Mon Nov 30                   | Dec 4 (Fri) -> minus 1 BD = **Thu Dec 3**                    | Mon Nov 30 |
| C    | Mon 2026-12-07 | Wed Dec 2                    | Dec 6 Sun -> prev BD Fri Dec 4 -> minus 1 BD = **Thu Dec 3** | Wed Dec 2  |

Anchor A, `P = Fri Nov 27`. B: due spread 3..5 Dec = 2 <= 7, `P <= hi_B`. C: spread 3..7 Dec = 4 <= 7, `P <= hi_C`. One group `{A,B,C}`, **payDay = Fri 2026-11-27** (it is a Friday here only because Nov 28 is a Saturday that rolled earlier; Friday is not a rule).
Reminders (unpaid only): Fri Nov 27 10:00 "pay 3 bills" -> Dec 1 (Tue) follow-up for A -> Dec 3 (Thu): follow-up for B coalesced with _due today_ for A -> Dec 4 (Fri) follow-up for C (Dec 5 is Saturday so it rolled earlier) -> Sat Dec 5 due-day for B -> Mon Dec 7 due-day for C.
Why not "Friday Dec 4"? It violates A's cap (`hi_A = Dec 1`), and five days before the earliest due date (Dec 3) is Nov 28, which rolls earlier to Nov 27.

### Example 2: holiday rolling (due Fri Jan 8 and Tue Jan 12, 2027)

`Jan 8 - 5 = Sun Jan 3` -> Sat Jan 2 (weekend, D3) -> Fri Jan 1. If the user's calendar lists **Jan 1 as a bank holiday** (illustrative; ASSUMPTION), roll again -> **Thu Dec 31, 2026**. Second bill: Jan 12 - 5 = Thu Jan 7 (`eff`), spread 4 days -> same group. Group payDay = **Thu 2026-12-31**. Month/year boundaries need no special handling (civil-date arithmetic).

### Example 3: two windows (due Dec 3 and Tue Dec 15)

Spread 12 > 7. Group 1: `{Dec 3}` payDay Nov 27; Group 2: `{Dec 15}`: `Dec 15 - 5 = Thu Dec 10` -> payDay Dec 10. Two reminders, no forced merge.

### Example 4: cap binds (card E due Mon Dec 7 with per-card `leadDays = 1`, joining Example 1)

`t_E = rollEarlier(Dec 6) = Fri Dec 4`, `hi_E = Thu Dec 3` -> `eff_E = Dec 3` (the safety cap beats the user's lead). Sorted after C. `P = Nov 27 <= hi_E`, spread Dec 3..7 = 4 -> **joins the group**; E's own follow-up Dec 4 and due-day Dec 7 still apply.

### Example 5: late entry (today = Mon Nov 30, bill A due Dec 3 just added)

`eff_A = Nov 27` is in the past -> `P = earliestAllowed = Mon Nov 30` (<= `hi_A = Dec 1`) -> risk `tight`, reminder fires today 10:00 (or immediately if past 10:00). Today = Wed Dec 2: `P = Dec 2 > hi_A (Dec 1)` -> risk `late`: copy "Pay today; a posting delay may make it land after the due date." (Rails like UPI are 24x7, the lag is on the issuer's credit side, so this is a warning, not an impossibility.)

### Example 6: marking paid (amount optional, irrelevant to planning)

Group `{A,B,C}` from Example 1. On Nov 27 the user taps **Mark as paid** for A and B (a small sheet asks for an amount; they enter ₹12,000 for A and tap Skip for B). Two `Payment` rows are created (`amountPaise = 1200000` and `null`), A and B become `paid`, and their pending follow-ups are suppressed. The group is re-planned with `{C}` only; by the stability rule C keeps payDay Nov 27 if still feasible (it is today), otherwise it moves to `C.eff = Wed Dec 2`. The planner never sees the amounts. There is no partial/min-paid state: a bill is paid or not.

## 5. Edge cases

| Case                                                        | Handling                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Month-end due days (30/31 in short months)                  | Card `dueDay` > days-in-month clamps to last day when projecting. Actual due dates entered by the user are used verbatim.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Due date on weekend/holiday                                 | `hi` accounts for it (`prevBusinessDayOrSame` before subtracting lag). Due-day reminder stays on the actual due date. Never rely on rollover (D7).                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Bill not generated yet                                      | Projected bill: `dueDate` derived from `cycle` (`statementDay + dueOffsetDays`, or `dueDay`), `confidence='projected'`. Included in grouping so the calendar has events, but copy is soft ("Your X bill is expected around the 5th; confirm the due date when your statement arrives"), and groups consisting solely of projected bills do not escalate (no follow-ups until the real bill is entered or the due date is 3 days away). When the user enters the real bill, the group is recomputed and replaces the projected one (same `key` semantics, calendar UID update). |
| `availableFrom` after computed `P`                          | Bill can't join that group; P clamps to `max(P, availableFrom)` for its own group; may flag `tight`/`late`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Statement date unknown (manual entry without statement day) | `lo = due - 30 days` (ASSUMPTION: max typical credit period 20-25 days plus slack).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Lead 10 with window 7                                       | Fine; independent parameters.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Excluded cards                                              | `groupPrefs.excludeFromGrouping`: own group of one, same lead/rolling rule.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Pinned pay day                                              | Respected, validated against `hi`; if `pinned > hi` -> warning `PIN_AFTER_SAFE_DAY` and group risk `late`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Overdue bills                                               | `status='overdue'` -> not grouped; handled by escalation ladder (`04`), not the planner.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| No autopay/NACH                                             | Not modelled anywhere (manager decision). Every bill is manual-pay.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Duplicate bills same card & cycle                           | Data layer prevents (unique `[cardId+dueDate]` check); engine tolerates and groups both.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Missing holiday year                                        | Calendar falls back to weekends only + warning `HOLIDAYS_MISSING_YEAR` surfaced in settings.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Clock/timezone                                              | Engine takes `today: CivilDate` (IST) from the injected `Clock`; device timezone changes cannot alter results.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Config change (leadDays)                                    | Triggers full re-plan; stability rule (section 6) applies.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

## 6. Stability (avoid "my reminder day keeps moving")

1. `inputsHash` per group = hash of (member bills' `due`, `lo`, `lead`, `lag`, `status`, pins, relevant config, calendar version). If a previous group has the same member set and hash, it is **kept verbatim**.
2. When a member is paid/removed or a new bill arrives, the group is recomputed, but **a previous `payDay` that is still feasible is retained** (feasible = `>= earliestAllowed`, `>= every lo`, `<= every hi`, `isPayDay`, window still holds) even if the fresh computation would give a later day. It never moves _later_ just because someone else paid. It may move _earlier_ only if a new/changed member requires it; the UI states why ("Moved to Nov 27 because card X was added").
3. A user-visible group whose day passed is closed (`status` becomes `paid` when all members are paid, `partially_paid` when some are, or `at_risk`) and not recomputed retroactively.

## 7. Complexity

n = open bills in horizon (<= ~30 realistically, <= 10 typical). Sorting O(n log n); grouping loop O(n^2) worst case as written, but it can be done in O(n) with a single pass maintaining the open group (since later bills are sorted by `eff`, the scan stops at the first bill failing the window/cap/lo condition ... except `lo` skips, so keep the O(n^2) form; n is tiny). Calendar helpers O(k) with k <= 8 steps. Whole plan runs in microseconds; safe to run on every write on the main thread.

## 8. Property-based test ideas (fast-check; `packages/testkit` arbitraries generate cards, bills, holidays, configs)

1. **Safety**: for every group and member `j`, `payDay <= hi_j` unless the group is flagged `late`.
2. **Working day**: `payDay` satisfies `isPayDay` (never a weekend/holiday), unless clamped to `earliestAllowed` (which itself is a pay day).
3. **Earlier-only rolling**: `payDay <= due_anchor - lead` whenever not clamped by `earliestAllowed`/`lo`; i.e., a rolled day is never later than the raw lead day.
4. **Never after own target**: for unclamped plans, `payDay <= eff_j` for each member.
5. **Not before availability**: `payDay >= lo_j` for all members unless flagged.
6. **Partition**: every non-skipped bill appears in exactly one group; skipped bills are exactly paid/void/excluded/beyond horizon.
7. **Window**: `max(due) - min(due) <= groupWindowDays` in every group.
8. **Minimality** (no overrides): group count equals the count from an independent brute-force/greedy oracle on sorted due dates.
9. **Permutation invariance**: shuffling the input bill order yields byte-identical output.
10. **Determinism / idempotence**: `plan(plan-inputs)` twice is identical; re-planning with `previous = output` returns the same groups.
11. **Monotonicity in lead**: increasing `leadDays` (all else fixed, no clamps) never makes any group's `payDay` later; adding a holiday on `payDay` moves it strictly earlier (and to a pay day).
12. **Timezone invariance**: result depends only on `today` civil date, never on `Date` or process TZ (run tests under `TZ=UTC`, `TZ=Asia/Kolkata`, `TZ=America/Los_Angeles`).
13. **Stability**: removing a paid member from a group never moves the remaining group's `payDay` later when the old day is feasible.
14. **Calendar properties**: `rollEarlier(d) <= d`; `rollEarlier` is idempotent; `subBusinessDays(addBusinessDays(d,n),n)` equals `d` when `d` is a business day.
15. **Fuzz boundaries**: leap years, Dec/Jan crossing, due dates on the 29th-31st, holiday chains of 4+ days.
    Plus the six worked examples above as table-driven golden tests.
