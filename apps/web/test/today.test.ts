import { describe, expect, it } from 'vitest';
import { todayInIndia } from '../src/lib/today';

describe('todayInIndia', () => {
  it('uses the India date even when it is still yesterday in UTC', () => {
    // 20:00 UTC on 2 Mar is 01:30 IST on 3 Mar.
    expect(todayInIndia(new Date('2026-03-02T20:00:00Z'))).toBe('2026-03-03');
    expect(todayInIndia(new Date('2026-03-02T10:00:00Z'))).toBe('2026-03-02');
  });
});
