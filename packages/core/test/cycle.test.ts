import { describe, expect, it } from 'vitest';
import { detectIssuer, monthGrid, validateStatementDate } from '../src';

describe('detectIssuer (brand-style monogram, no logos)', () => {
  it('recognises common Indian issuers from the card name', () => {
    expect(detectIssuer('HDFC Regalia')).toMatchObject({ id: 'hdfc', monogram: 'HDFC' });
    expect(detectIssuer('icici amazon pay')).toMatchObject({ id: 'icici', monogram: 'ICICI' });
    expect(detectIssuer('SBI Cashback')).toMatchObject({ id: 'sbi', monogram: 'SBI' });
    expect(detectIssuer('Axis Flipkart')).toMatchObject({ id: 'axis', monogram: 'AXIS' });
    expect(detectIssuer('American Express Gold')).toMatchObject({ id: 'amex', monogram: 'AMEX' });
    expect(detectIssuer('Kotak 811')).toMatchObject({ id: 'kotak' });
  });

  it('does not match a bank name inside another word', () => {
    expect(detectIssuer('Subscription card').id).toBe('other');
  });

  it('falls back to initials for unknown issuers', () => {
    expect(detectIssuer('Tata Neu Infinity')).toMatchObject({ id: 'other', monogram: 'TN' });
    expect(detectIssuer('onecard')).toMatchObject({ id: 'other', monogram: 'O' });
  });

  it('gives each known issuer a brand colour with readable text', () => {
    const { color, ink } = detectIssuer('HDFC');
    expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    expect(ink).toMatch(/^#[0-9A-F]{6}$/i);
  });
});

describe('validateStatementDate (add card: when was the bill generated?)', () => {
  it('accepts a statement date before the due date, 7 to 45 days earlier', () => {
    expect(validateStatementDate('2026-11-02', '2026-11-20')).toEqual({
      ok: true,
      value: '2026-11-02',
    });
  });

  it('rejects a statement date on or after the due date', () => {
    expect(validateStatementDate('2026-11-20', '2026-11-20')).toEqual({
      ok: false,
      errors: { statementDate: 'The bill is generated before it is due. Check the dates.' },
    });
  });

  it('rejects implausible gaps', () => {
    expect(validateStatementDate('2026-11-17', '2026-11-20').ok).toBe(false);
    expect(validateStatementDate('2026-09-20', '2026-11-20').ok).toBe(false);
  });

  it('asks for a date when empty', () => {
    expect(validateStatementDate('', '2026-11-20')).toEqual({
      ok: false,
      errors: { statementDate: 'Pick the statement date from your latest bill' },
    });
  });
});

describe('monthGrid', () => {
  it('lays a month out in Monday-first weeks with blanks around it', () => {
    const weeks = monthGrid('2026-11');
    // 1 Nov 2026 is a Sunday, so the first week is six blanks then the 1st.
    expect(weeks[0]).toEqual([null, null, null, null, null, null, '2026-11-01']);
    expect(weeks.at(-1)?.at(0)).toBe('2026-11-30');
    expect(weeks.flat().filter(Boolean)).toHaveLength(30);
    weeks.forEach((w) => expect(w).toHaveLength(7));
  });
});
