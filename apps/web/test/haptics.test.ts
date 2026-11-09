import { describe, expect, it, vi } from 'vitest';
import { haptic, HAPTIC_PATTERNS, pulseCount } from '../src/lib/haptics';

describe('haptic', () => {
  it('vibrates with the pattern for the kind', () => {
    const vibrate = vi.fn(() => true);
    haptic('tab', { vibrate });
    expect(vibrate).toHaveBeenCalledWith(HAPTIC_PATTERNS.tab);
    haptic('success', { vibrate });
    expect(vibrate).toHaveBeenLastCalledWith(HAPTIC_PATTERNS.success);
  });

  it('does nothing where the device cannot vibrate (iPhone Safari, desktops)', () => {
    expect(() => haptic('tab', {})).not.toThrow();
    expect(() => haptic('tab', undefined)).not.toThrow();
  });

  it('never throws if the browser refuses', () => {
    const vibrate = vi.fn(() => {
      throw new Error('blocked');
    });
    expect(() => haptic('save', { vibrate })).not.toThrow();
  });

  it('keeps a tab switch lighter than a payment', () => {
    const total = (p: number | number[]) => (Array.isArray(p) ? p.reduce((a, b) => a + b, 0) : p);
    expect(total(HAPTIC_PATTERNS.tab)).toBeLessThan(total(HAPTIC_PATTERNS.success));
  });
});

describe('iPhone fallback (iOS has no vibrate)', () => {
  it('counts the pulses in a pattern', () => {
    expect(pulseCount(10)).toBe(1);
    expect(pulseCount([24, 40, 36])).toBe(2);
    expect(pulseCount([10, 20, 10, 20, 10])).toBe(3);
  });

  it('taps the hidden switch once per pulse when vibrate is missing', () => {
    vi.useFakeTimers();
    const tap = vi.fn();
    haptic('tab', {}, tap);
    expect(tap).toHaveBeenCalledTimes(1);
    haptic('success', {}, tap);
    vi.runAllTimers();
    expect(tap).toHaveBeenCalledTimes(1 + pulseCount(HAPTIC_PATTERNS.success));
    vi.useRealTimers();
  });

  it('prefers the real vibrate when it exists', () => {
    const vibrate = vi.fn(() => true);
    const tap = vi.fn();
    haptic('tab', { vibrate }, tap);
    expect(vibrate).toHaveBeenCalled();
    expect(tap).not.toHaveBeenCalled();
  });

  it('does nothing when there is neither vibrate nor a fallback', () => {
    expect(() => haptic('tab', {}, undefined)).not.toThrow();
  });
});
