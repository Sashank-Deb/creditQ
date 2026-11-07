/**
 * Edit-card form rules and the caution text shown before removing a card. Pure, so tested.
 */
import {
  formatRupees,
  validateBank,
  validateCardDetails,
  validateDueDate,
  validateStatementDate,
  type CivilDate,
} from '@creditq/core';

export interface CardForm {
  bank: string;
  name: string;
  last4: string;
  dueDate: string;
  statementDate: string;
}

export interface CleanCard {
  bank: string;
  name: string;
  last4: string;
  dueDate: CivilDate;
  statementDate: CivilDate | undefined;
}

type Errors = Partial<Record<keyof CardForm, string>>;

export const validateCardForm = (
  form: CardForm,
  today: CivilDate,
): { ok: true; value: CleanCard } | { ok: false; errors: Errors } => {
  const errors: Errors = {};
  const details = validateCardDetails({ name: form.name, last4: form.last4 });
  if (!details.ok) Object.assign(errors, details.errors);
  const bank = validateBank(form.bank);
  if (!bank.ok) Object.assign(errors, bank.errors);
  const due = validateDueDate(form.dueDate, today);
  if (!due.ok) Object.assign(errors, due.errors);
  // Older cards may have no statement date yet; once given, it must fit the due date.
  const hasStatement = form.statementDate.trim() !== '';
  if (hasStatement && due.ok) {
    const s = validateStatementDate(form.statementDate, due.value);
    if (!s.ok) Object.assign(errors, s.errors);
  }
  if (!details.ok || !bank.ok || !due.ok || Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    value: {
      ...details.value,
      bank: bank.value,
      dueDate: due.value,
      statementDate: hasStatement ? form.statementDate.trim() : undefined,
    },
  };
};

/** The caution popup text: exactly what removal deletes. */
export const removalWarning = (
  card: { name: string; last4: string },
  paymentAmounts: readonly (number | null)[],
): string => {
  const label = `${card.name} ••${card.last4}`;
  if (paymentAmounts.length === 0)
    return `This deletes ${label} and its bills. It cannot be undone.`;
  const logged = paymentAmounts.reduce<number>((sum, a) => sum + (a ?? 0), 0);
  const count = paymentAmounts.length;
  const spends = logged > 0 ? `, including ${formatRupees(logged)} logged in Spends` : '';
  return `This deletes ${label}, its bills and ${count} marked ${count === 1 ? 'payment' : 'payments'}${spends}. It cannot be undone.`;
};
