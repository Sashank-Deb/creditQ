import { describe, expect, it, vi } from 'vitest';
import { haptic, HAPTIC_PATTERNS } from '../src/lib/haptics';

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
