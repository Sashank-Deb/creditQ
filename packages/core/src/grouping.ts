/**
 * Grouped pay days (design doc 03). Pure, deterministic, amount-free.
 *
 * Rule: remind `leadDays` before the group's earliest due date, rolled EARLIER off
 * weekends/holidays, never later than each bill's safety cap, never before its
 * statement is available. Bills whose due dates sit within `groupWindowDays` share a day.
 */
import type { BusinessCalendar } from './calendar';
import { addDays, compareDates, diffDays, maxDate, minDate, type CivilDate } from './civil-date';

export type BillStatus = 'projected' | 'open' | 'paid' | 'overdue' | 'void';

export interface BillInput {
  id: string;
  cardId: string;
  dueDate: CivilDate;
  status: BillStatus;
  /** Statement date; the bill cannot be paid meaningfully before it. */
  availableFrom?: CivilDate;
  /** Per-card override of `config.leadDays`. */
  leadDays?: number;
  postingLagBusinessDays?: number;
  excludeFromGrouping?: boolean;
  pinnedPayDay?: CivilDate;
}

export interface PlanConfig {
  leadDays: number;
  groupWindowDays: number;
  safetyBufferDays: number;
  postingLagBusinessDays: number;
  horizonDays: number;
}

export const DEFAULT_PLAN_CONFIG: PlanConfig = {
  leadDays: 5,
  groupWindowDays: 7,
  safetyBufferDays: 1,
  postingLagBusinessDays: 1,
  horizonDays: 60,
};

export type Risk = 'ok' | 'tight' | 'late';

export interface PlannedGroup {
  key: string;
  payDay: CivilDate;
  billIds: string[];
  earliestDue: CivilDate;
  latestDue: CivilDate;
  /** Latest day the whole group can still be paid safely (min of member caps). */
  lastSafeDay: CivilDate;
  /** Earliest day every member's statement is available. */
  earliestOkDay: CivilDate;
  risk: Risk;
}

export type SkipReason = 'paid' | 'void' | 'overdue' | 'beyond-horizon';

export interface PlanWarning {
  code: 'PIN_AFTER_SAFE_DAY';
  billId: string;
}

export interface PlanInput {
  today: CivilDate;
  bills: readonly BillInput[];
  calendar: BusinessCalendar;
  config?: Partial<PlanConfig>;
  previous?: readonly PlannedGroup[];
}

export interface PlanOutput {
  groups: PlannedGroup[];
  skipped: { billId: string; reason: SkipReason }[];
  warnings: PlanWarning[];
}

interface Derived {
  bill: BillInput;
  eff: CivilDate;
  hi: CivilDate;
  lo: CivilDate;
}

// Manual entry without a statement day: assume a 30-day window (design doc 03, section 5).
const DEFAULT_AVAILABILITY_DAYS = 30;

const byId = (a: { id: string }, b: { id: string }): number => compareDates(a.id, b.id);

export const planPayDays = (input: PlanInput): PlanOutput => {
  const config = { ...DEFAULT_PLAN_CONFIG, ...input.config };
  const { calendar: cal, today } = input;
  const horizon = addDays(today, config.horizonDays);
  const earliestAllowed = cal.isPayDay(today) ? today : cal.nextPayDay(today);

  const skipped: PlanOutput['skipped'] = [];
  const warnings: PlanWarning[] = [];
  const active: Derived[] = [];

  for (const bill of [...input.bills].sort(byId)) {
    if (bill.status === 'paid' || bill.status === 'void' || bill.status === 'overdue') {
      skipped.push({ billId: bill.id, reason: bill.status });
    } else if (compareDates(bill.dueDate, horizon) > 0) {
      skipped.push({ billId: bill.id, reason: 'beyond-horizon' });
    } else {
      const lead = bill.leadDays ?? config.leadDays;
      const lag = bill.postingLagBusinessDays ?? config.postingLagBusinessDays;
      const t = cal.rollEarlier(addDays(bill.dueDate, -lead));
      const hi = cal.subBusinessDays(
        cal.prevBusinessDayOrSame(addDays(bill.dueDate, -config.safetyBufferDays)),
        lag,
      );
      const lo = bill.availableFrom ?? addDays(bill.dueDate, -DEFAULT_AVAILABILITY_DAYS);
      active.push({ bill, eff: minDate(t, hi), hi, lo });
    }
  }
  // Keep skipped in input order so callers can map reasons back predictably.
  const inputOrder = new Map(input.bills.map((b, i) => [b.id, i]));
  skipped.sort((a, b) => (inputOrder.get(a.billId) ?? 0) - (inputOrder.get(b.billId) ?? 0));

  const riskFor = (payDay: CivilDate, lastSafeDay: CivilDate): Risk => {
    if (compareDates(payDay, lastSafeDay) > 0) return 'late';
    return cal.businessDaysBetween(payDay, lastSafeDay) < 2 ? 'tight' : 'ok';
  };

  const makeGroup = (payDay: CivilDate, members: Derived[], forcedRisk?: Risk): PlannedGroup => {
    const sorted = [...members].sort(
      (a, b) => compareDates(a.bill.dueDate, b.bill.dueDate) || byId(a.bill, b.bill),
    );
    const lastSafeDay = sorted.map((m) => m.hi).reduce(minDate);
    const anchor = sorted[0];
    if (!anchor) throw new Error('A group needs at least one member');
    return {
      key: `grp_${anchor.bill.id}`,
      payDay,
      billIds: sorted.map((m) => m.bill.id),
      earliestDue: anchor.bill.dueDate,
      latestDue: sorted.map((m) => m.bill.dueDate).reduce(maxDate),
      lastSafeDay,
      earliestOkDay: sorted.map((m) => m.lo).reduce(maxDate),
      risk: forcedRisk ?? riskFor(payDay, lastSafeDay),
    };
  };

  const groups: PlannedGroup[] = [];

  // Pinned and excluded bills are planned on their own.
  const queue: Derived[] = [];
  for (const d of active) {
    if (d.bill.pinnedPayDay) {
      const late = compareDates(d.bill.pinnedPayDay, d.hi) > 0;
      if (late) warnings.push({ code: 'PIN_AFTER_SAFE_DAY', billId: d.bill.id });
      groups.push(makeGroup(d.bill.pinnedPayDay, [d], late ? 'late' : undefined));
    } else {
      queue.push(d);
    }
  }

  const candidateDay = (anchor: Derived): CivilDate => {
    const p = [anchor.eff, earliestAllowed, anchor.lo].reduce(maxDate);
    return cal.isPayDay(p) ? p : cal.nextPayDay(p);
  };

  queue.sort(
    (a, b) =>
      compareDates(a.eff, b.eff) ||
      compareDates(a.bill.dueDate, b.bill.dueDate) ||
      byId(a.bill, b.bill),
  );
  let remaining = [...queue];
  while (remaining.length > 0) {
    const [anchor, ...rest] = remaining as [Derived, ...Derived[]];
    const payDay = candidateDay(anchor);
    const members = [anchor];
    const leftOver: Derived[] = [];
    let dueMin = anchor.bill.dueDate;
    let dueMax = anchor.bill.dueDate;
    for (const j of rest) {
      const newMin = minDate(dueMin, j.bill.dueDate);
      const newMax = maxDate(dueMax, j.bill.dueDate);
      const fits =
        !anchor.bill.excludeFromGrouping &&
        !j.bill.excludeFromGrouping &&
        compareDates(j.lo, payDay) <= 0 &&
        compareDates(payDay, j.hi) <= 0 &&
        diffDays(newMax, newMin) <= config.groupWindowDays;
      if (fits) {
        members.push(j);
        dueMin = newMin;
        dueMax = newMax;
      } else {
        leftOver.push(j);
      }
    }
    groups.push(makeGroup(payDay, members));
    remaining = leftOver;
  }

  // Stability (design doc 03, section 6): keep an earlier, still-feasible previous pay day
  // so a reminder never moves later just because another bill in the group was paid.
  const derivedById = new Map(active.map((d) => [d.bill.id, d]));
  const stable = groups.map((g) => {
    const prev = input.previous?.find(
      (p) => p.billIds.some((id) => g.billIds.includes(id)) && compareDates(p.payDay, g.payDay) < 0,
    );
    const members = g.billIds.map((id) => derivedById.get(id) as Derived);
    if (!prev || members.some((m) => m.bill.pinnedPayDay)) return g;
    const feasible =
      compareDates(prev.payDay, earliestAllowed) >= 0 &&
      cal.isPayDay(prev.payDay) &&
      members.every(
        (m) => compareDates(m.lo, prev.payDay) <= 0 && compareDates(prev.payDay, m.hi) <= 0,
      );
    return feasible ? makeGroup(prev.payDay, members) : g;
  });

  stable.sort((a, b) => compareDates(a.payDay, b.payDay) || compareDates(a.key, b.key));
  return { groups: stable, skipped, warnings };
};
