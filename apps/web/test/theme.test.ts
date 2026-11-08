import { describe, expect, it } from 'vitest';
import { parseTheme, themeBootScript } from '../src/lib/theme';

describe('theme preference', () => {
  it('accepts the three known values and falls back to system', () => {
    expect(parseTheme('light')).toBe('light');
    expect(parseTheme('dark')).toBe('dark');
    expect(parseTheme('system')).toBe('system');
    expect(parseTheme('purple')).toBe('system');
    expect(parseTheme(null)).toBe('system');
  });

  it('boot script sets data-theme only for an explicit choice, and never throws', () => {
    expect(themeBootScript).toContain('creditq-theme');
    expect(themeBootScript).toContain('try');
  });
});
