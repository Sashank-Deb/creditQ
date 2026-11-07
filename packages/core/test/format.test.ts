import { describe, expect, it } from 'vitest';
import { formatCountdown, formatRupees, formatShortDate } from '../src';

describe('content formatting (Base content rules, en-IN)', () => {
  it('formats dates as "Mon, 3 Mar"', () => {
    expect(formatShortDate('2026-03-03')).toBe('Tue, 3 Mar');
    expect(formatShortDate('2026-12-31')).toBe('Thu, 31 Dec');
  });

  it('describes how far away a pay day is', () => {
    expect(formatCountdown('2026-03-03', '2026-03-03')).toBe('today');
    expect(formatCountdown('2026-03-03', '2026-03-04')).toBe('tomorrow');
    expect(formatCountdown('2026-03-03', '2026-03-06')).toBe('in 3 days');
    expect(formatCountdown('2026-03-06', '2026-03-03')).toBe('3 days ago');
    expect(formatCountdown('2026-03-04', '2026-03-03')).toBe('yesterday');
  });

  it('formats paise as rupees with Indian digit grouping, no spelled-out values', () => {
    expect(formatRupees(4238000)).toBe('₹42,380');
    expect(formatRupees(1234567800)).toBe('₹1,23,45,678');
    expect(formatRupees(99)).toBe('₹0.99');
    expect(formatRupees(150050)).toBe('₹1,500.50');
    expect(formatRupees(0)).toBe('₹0');
  });
});

describe('formatClock', () => {
  it('writes India times the Base way: "9:00 am"', async () => {
    const { formatClock } = await import('../src');
    expect(formatClock('09:00')).toBe('9:00 am');
    expect(formatClock('19:30')).toBe('7:30 pm');
    expect(formatClock('00:05')).toBe('12:05 am');
    expect(formatClock('12:00')).toBe('12:00 pm');
  });
});
