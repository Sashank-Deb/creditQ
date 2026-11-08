import { describe, expect, it } from 'vitest';
import { passphraseStrength } from '../src/lib/passphrase';

describe('passphraseStrength', () => {
  it('rates short and empty input as too short', () => {
    expect(passphraseStrength('').level).toBe(0);
    expect(passphraseStrength('abc12').level).toBe(0);
  });

  it('rates common or single-class passwords weak', () => {
    expect(passphraseStrength('password').level).toBe(1);
    expect(passphraseStrength('12345678').level).toBe(1);
    expect(passphraseStrength('aaaaaaaaaaaa').level).toBe(1);
  });

  it('rewards length and variety', () => {
    const fair = passphraseStrength('sunrise42').level;
    const good = passphraseStrength('Sunrise-Lake-42').level;
    const strong = passphraseStrength('correct horse battery staple 9!').level;
    expect(fair).toBeGreaterThanOrEqual(2);
    expect(good).toBeGreaterThanOrEqual(fair);
    expect(strong).toBe(4);
  });

  it('gives a label and a tip for every level', () => {
    ['', 'password', 'sunrise42', 'Sunrise-Lake-42', 'correct horse battery staple 9!'].forEach(
      (p) => {
        const r = passphraseStrength(p);
        expect(r.label.length).toBeGreaterThan(0);
        expect(r.tip.length).toBeGreaterThan(0);
      },
    );
  });
});
