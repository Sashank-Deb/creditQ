/** Payment history helpers. Pure, so they are unit-tested without a browser. */

export interface TxnPayment {
  id: string;
  cardId: string;
  /** 'YYYY-MM-DD'. */
  paidOn: string;
  /** Integer paise, or null when the user skipped the amount. */
  amountPaise: number | null;
  createdAt: number;
}

export interface Transaction extends TxnPayment {
  /** Only the latest payment of a card can be taken back (see the vault). */
  canRevert: boolean;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Newest payment first, with a flag for the ones that can be reverted. */
export const listTransactions = (payments: readonly TxnPayment[]): Transaction[] => {
  const latest = new Map<string, TxnPayment>();
  for (const p of payments) {
    const current = latest.get(p.cardId);
    if (
      !current ||
      p.createdAt > current.createdAt ||
      (p.createdAt === current.createdAt && p.id > current.id)
    ) {
      latest.set(p.cardId, p);
    }
  }
  return [...payments]
    .sort((a, b) => b.paidOn.localeCompare(a.paidOn) || b.createdAt - a.createdAt)
    .map((p) => ({ ...p, canRevert: latest.get(p.cardId)?.id === p.id }));
};

export interface MonthRow {
  /** 'YYYY-MM'. */
  month: string;
  label: string;
  /** A month without a payment counts as unpaid. */
  status: 'paid' | 'unpaid';
  payments: { id: string; paidOn: string; amountPaise: number | null }[];
}

const nextMonth = (m: string): string => {
  const year = Number(m.slice(0, 4));
  const month = Number(m.slice(5, 7));
  return month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`;
};

/** One row per month from the first month to today's, newest first, for a single card. */
export const monthlyHistory = (input: {
  startMonth: string;
  today: string;
  payments: readonly TxnPayment[];
}): MonthRow[] => {
  const byMonth = new Map<string, MonthRow['payments']>();
  for (const p of [...input.payments].sort(
    (a, b) => a.paidOn.localeCompare(b.paidOn) || a.createdAt - b.createdAt,
  )) {
    const month = p.paidOn.slice(0, 7);
    byMonth.set(month, [
      ...(byMonth.get(month) ?? []),
      { id: p.id, paidOn: p.paidOn, amountPaise: p.amountPaise },
    ]);
  }
  const last = input.today.slice(0, 7);
  const first = [input.startMonth, ...byMonth.keys()].sort()[0] ?? input.startMonth;
  const rows: MonthRow[] = [];
  for (let m = first; m <= last; m = nextMonth(m)) {
    const payments = byMonth.get(m) ?? [];
    rows.push({
      month: m,
      label: `${MONTHS[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`,
      status: payments.length > 0 ? 'paid' : 'unpaid',
      payments,
    });
  }
  return rows.reverse();
};
