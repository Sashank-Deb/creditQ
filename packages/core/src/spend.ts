/**
 * Spends (design doc 02, SpendAggregator): built only from amounts the user logged when
 * marking a bill paid. A skipped amount is counted as skipped, never as zero spend.
 */
import type { CivilDate } from './civil-date';

export interface SpendPayment {
  cardId: string;
  paidOn: CivilDate;
  amountPaise: number | null;
}

export interface SpendMonth {
  /** 'YYYY-MM' */
  key: string;
  label: string;
  totalPaise: number;
  byCard: Record<string, number>;
  loggedCount: number;
  skippedCount: number;
}

export interface SpendSummary {
  months: SpendMonth[];
  loggedCount: number;
  skippedCount: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const monthKeys = (endMonth: string, count: number): string[] => {
  const endY = Number(endMonth.slice(0, 4));
  const endM = Number(endMonth.slice(5, 7));
  return Array.from({ length: count }, (_, i) => {
    const offset = endY * 12 + (endM - 1) - (count - 1 - i);
    return `${Math.floor(offset / 12)}-${String((offset % 12) + 1).padStart(2, '0')}`;
  });
};

export const aggregateSpend = (
  payments: readonly SpendPayment[],
  options: { endMonth: string; months: number },
): SpendSummary => {
  const months: SpendMonth[] = monthKeys(options.endMonth, options.months).map((key) => ({
    key,
    label: MONTHS[Number(key.slice(5, 7)) - 1] ?? '',
    totalPaise: 0,
    byCard: {},
    loggedCount: 0,
    skippedCount: 0,
  }));
  const byKey = new Map(months.map((m) => [m.key, m]));
  let loggedCount = 0;
  let skippedCount = 0;

  for (const p of payments) {
    const month = byKey.get(p.paidOn.slice(0, 7));
    if (month) {
      if (p.amountPaise === null) {
        month.skippedCount += 1;
        skippedCount += 1;
      } else {
        month.totalPaise += p.amountPaise;
        month.byCard[p.cardId] = (month.byCard[p.cardId] ?? 0) + p.amountPaise;
        month.loggedCount += 1;
        loggedCount += 1;
      }
    }
  }
  return { months, loggedCount, skippedCount };
};
