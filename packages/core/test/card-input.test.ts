import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { nextMonthlyDueDate, validateCardDetails, validateDueDate } from '../src';

describe('validateCardDetails (add card, step 1)', () => {
  it('accepts a name and exactly four digits, trimming spaces', () => {
    expect(validateCardDetails({ name: '  HDFC Regalia ', last4: '4821' })).toEqual({
      ok: true,
      value: { name: 'HDFC Regalia', last4: '4821' },
    });
  });

  it('asks for a name', () => {
    expect(validateCardDetails({ name: '  ', last4: '4821' })).toEqual({
      ok: false,
      errors: { name: 'Enter a name for this card' },
    });
  });

  it('needs exactly the last 4 digits', () => {
    const r = validateCardDetails({ name: 'Axis', last4: '12a' });
    expect(r).toEqual({ ok: false, errors: { last4: 'Enter the last 4 digits' } });
  });

  it('refuses anything that looks like a full card number, anywhere', () => {
    const pan = '4111 1111 1111 1111';
    expect(validateCardDetails({ name: 'Axis', last4: pan })).toEqual({
      ok: false,
      errors: { last4: 'Only the last 4 digits. Never type your full card number.' },
    });
    expect(validateCardDetails({ name: `My card ${pan}`, last4: '1111' })).toEqual({
      ok: false,
      errors: { name: 'Remove the card number from the name' },
    });
  });

  it('limits the name length', () => {
    const r = validateCardDetails({ name: 'x'.repeat(41), last4: '1234' });
    expect(r.ok).toBe(false);
  });
});

describe('validateDueDate (add card, step 2)', () => {
  const today = '2026-03-03';

  it('accepts today and dates up to 62 days ahead', () => {
    expect(validateDueDate('2026-03-03', today)).toEqual({ ok: true, value: '2026-03-03' });
    expect(validateDueDate('2026-05-04', today)).toEqual({ ok: true, value: '2026-05-04' });
  });

  it('rejects past dates with a helpful message', () => {
    expect(validateDueDate('2026-03-02', today)).toEqual({
      ok: false,
      errors: { dueDate: 'That date has passed. Enter your next due date.' },
    });
  });

  it('rejects dates too far ahead and invalid input', () => {
    expect(validateDueDate('2026-05-05', today).ok).toBe(false);
    expect(validateDueDate('2026-02-30', today).ok).toBe(false);
    expect(validateDueDate('', today)).toEqual({
      ok: false,
      errors: { dueDate: 'Pick the due date from your latest bill' },
    });
  });
});

describe('nextMonthlyDueDate', () => {
  it('moves to the same day next month', () => {
    expect(nextMonthlyDueDate('2026-03-08')).toBe('2026-04-08');
    expect(nextMonthlyDueDate('2026-12-15')).toBe('2027-01-15');
  });

  it('clamps to the end of shorter months, keeping the preferred day', () => {
    expect(nextMonthlyDueDate('2026-01-31')).toBe('2026-02-28');
    expect(nextMonthlyDueDate('2026-02-28', 31)).toBe('2026-03-31');
    expect(nextMonthlyDueDate('2028-01-30')).toBe('2028-02-29');
  });

  it('always lands 28 to 31 days later (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 3000 }), fc.integer({ min: 1, max: 31 }), (n, day) => {
        const from = new Date(Date.UTC(2026, 0, 1) + n * 86400000).toISOString().slice(0, 10);
        const next = nextMonthlyDueDate(from, day);
        const gap = (Date.parse(next) - Date.parse(from)) / 86400000;
        expect(gap).toBeGreaterThan(0);
        expect(gap).toBeLessThanOrEqual(62);
      }),
    );
  });
});
