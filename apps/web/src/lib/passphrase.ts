export interface Strength {
  /** 0 too short, 1 weak, 2 fair, 3 good, 4 strong. */
  level: 0 | 1 | 2 | 3 | 4;
  label: string;
  tip: string;
}

const COMMON = [
  'password',
  'passw0rd',
  'qwerty',
  'letmein',
  'welcome',
  'iloveyou',
  'admin',
  'creditq',
];

const LABELS: Record<Strength['level'], string> = {
  0: 'Too short',
  1: 'Weak',
  2: 'Fair',
  3: 'Good',
  4: 'Strong',
};

const TIPS: Record<Strength['level'], string> = {
  0: 'Use at least 8 characters.',
  1: 'Easy to guess. Try a few unrelated words.',
  2: 'Add more length or a number or symbol.',
  3: 'A few more characters make it strong.',
  4: 'Hard to guess. Keep it somewhere safe.',
};

/** A quick, honest estimate: length, variety and obvious patterns. Not a guarantee. */
export const passphraseStrength = (pass: string): Strength => {
  const make = (level: Strength['level']): Strength => ({
    level,
    label: LABELS[level],
    tip: TIPS[level],
  });
  if (pass.length < 8) return make(0);
  const lower = pass.toLowerCase();
  if (COMMON.some((c) => lower.includes(c)) && pass.length < 14) return make(1);
  const unique = new Set(pass).size;
  if (unique <= 3) return make(1);
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pass)).length;
  if (classes === 1 && pass.length < 12) return make(1);

  let score = 0;
  if (pass.length >= 10) score += 1;
  if (pass.length >= 14) score += 1;
  if (pass.length >= 20) score += 1;
  if (classes >= 2) score += 1;
  if (classes >= 3) score += 1;
  if (unique < pass.length / 2) score -= 1;
  if (score >= 4) return make(4);
  if (score === 3) return make(3);
  return make(2);
};
