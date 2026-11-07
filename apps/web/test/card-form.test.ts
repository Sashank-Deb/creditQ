import { describe, expect, it } from 'vitest';
import { removalWarning, validateCardForm } from '../src/features/card/card-form';

const today = '2026-11-07';
const good = {
  name: 'HDFC Regalia',
  last4: '4821',
  dueDate: '2026-11-20',
  statementDate: '2026-11-02',
};

describe('validateCardForm (edit card)', () => {
  it('accepts a valid card and returns the cleaned values', () => {
    expect(validateCardForm({ ...good, name: ' HDFC  Regalia ' }, today)).toEqual({
      ok: true,
      value: good,
    });
  });

  it('collects every field error at once', () => {
    const r = validateCardForm(
      { name: '', last4: '12', dueDate: '2026-11-01', statementDate: '' },
      today,
    );
    expect(r).toEqual({
      ok: false,
      errors: {
        name: 'Enter a name for this card',
        last4: 'Enter the last 4 digits',
        dueDate: 'That date has passed. Enter your next due date.',
      },
    });
  });

  it('lets older cards keep an empty statement date', () => {
    const r = validateCardForm({ ...good, statementDate: '' }, today);
    expect(r).toEqual({ ok: true, value: { ...good, statementDate: undefined } });
  });

  it('checks the statement date against the due date', () => {
    const r = validateCardForm({ ...good, statementDate: '2026-11-25' }, today);
    expect(r.ok).toBe(false);
  });
});

describe('removalWarning', () => {
  it('says exactly what will be deleted, including logged spends', () => {
    expect(removalWarning({ name: 'HDFC Regalia', last4: '4821' }, [120000, null, 23300])).toBe(
      'This deletes HDFC Regalia ••4821, its bills and 3 marked payments, including ₹1,433 logged in Spends. It cannot be undone.',
    );
  });

  it('keeps it short when there is nothing logged', () => {
    expect(removalWarning({ name: 'SBI', last4: '1207' }, [])).toBe(
      'This deletes SBI ••1207 and its bills. It cannot be undone.',
    );
  });
});
