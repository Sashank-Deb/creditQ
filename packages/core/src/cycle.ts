/**
 * Billing cycle helpers: issuer monograms (no logos: brand colour + short name, so no
 * trademark artwork ships), statement-date rules, and a calendar month grid.
 */
import { dayOfWeek, diffDays, isCivilDate, type CivilDate } from './civil-date';
import type { Result } from './card-input';

export interface Issuer {
  id: string;
  /** Display bank name ('' for banks we do not know). */
  bank: string;
  monogram: string;
  /** Badge background. */
  color: string;
  /** Badge text colour, chosen for at least 4.5:1 contrast on `color`. */
  ink: string;
}

// Approximate brand colours, darkened where needed so white text stays readable.
const ISSUERS: {
  id: string;
  bank: string;
  monogram: string;
  match: RegExp;
  color: string;
  ink: string;
}[] = [
  {
    id: 'hdfc',
    bank: 'HDFC Bank',
    monogram: 'HDFC',
    match: /\bhdfc\b/i,
    color: '#004C8F',
    ink: '#FFFFFF',
  },
  {
    id: 'icici',
    bank: 'ICICI Bank',
    monogram: 'ICICI',
    match: /\bicici\b/i,
    color: '#AE282E',
    ink: '#FFFFFF',
  },
  {
    id: 'sbi',
    bank: 'SBI Card',
    monogram: 'SBI',
    match: /\bsbi\b/i,
    color: '#0B4EA2',
    ink: '#FFFFFF',
  },
  {
    id: 'axis',
    bank: 'Axis Bank',
    monogram: 'AXIS',
    match: /\baxis\b/i,
    color: '#97144D',
    ink: '#FFFFFF',
  },
  {
    id: 'amex',
    bank: 'American Express',
    monogram: 'AMEX',
    match: /\b(amex|american express)\b/i,
    color: '#0061B6',
    ink: '#FFFFFF',
  },
  {
    id: 'kotak',
    bank: 'Kotak Mahindra Bank',
    monogram: 'KOTAK',
    match: /\bkotak\b/i,
    color: '#C4161C',
    ink: '#FFFFFF',
  },
  {
    id: 'idfc',
    bank: 'IDFC FIRST Bank',
    monogram: 'IDFC',
    match: /\bidfc\b/i,
    color: '#9C1D26',
    ink: '#FFFFFF',
  },
  {
    id: 'yes',
    bank: 'YES Bank',
    monogram: 'YES',
    match: /\byes\b/i,
    color: '#00518F',
    ink: '#FFFFFF',
  },
  {
    id: 'indusind',
    bank: 'IndusInd Bank',
    monogram: 'INDUS',
    match: /\bindusind\b/i,
    color: '#8B1C2E',
    ink: '#FFFFFF',
  },
  {
    id: 'rbl',
    bank: 'RBL Bank',
    monogram: 'RBL',
    match: /\brbl\b/i,
    color: '#21409A',
    ink: '#FFFFFF',
  },
  {
    id: 'au',
    bank: 'AU Small Finance Bank',
    monogram: 'AU',
    match: /\bau\b/i,
    color: '#6D2077',
    ink: '#FFFFFF',
  },
  {
    id: 'hsbc',
    bank: 'HSBC',
    monogram: 'HSBC',
    match: /\bhsbc\b/i,
    color: '#C4000F',
    ink: '#FFFFFF',
  },
  {
    id: 'sc',
    bank: 'Standard Chartered',
    monogram: 'SC',
    match: /\b(standard chartered|stanchart)\b/i,
    color: '#0067C5',
    ink: '#FFFFFF',
  },
  {
    id: 'federal',
    bank: 'Federal Bank',
    monogram: 'FED',
    match: /\bfederal\b/i,
    color: '#00539B',
    ink: '#FFFFFF',
  },
  {
    id: 'bob',
    bank: 'Bank of Baroda',
    monogram: 'BOB',
    match: /\b(bob|baroda)\b/i,
    color: '#F15A29',
    ink: '#2B1205',
  },
];

/** Bank names for the bank picker, in a sensible order. "Other" is added by the UI. */
export const listBanks = (): string[] => ISSUERS.map((i) => i.bank);

const MAX_BANK = 40;

/** The bank is chosen separately from the card name ("HSBC" + "Premier", not "HSBC Premier"). */
export const validateBank = (input: string): Result<string, 'bank'> => {
  const bank = input.trim().replace(/\s+/g, ' ');
  if (/(?:\d[ -]?){13,19}/.test(bank)) {
    return { ok: false, errors: { bank: 'Remove the card number from the bank name' } };
  }
  if (bank === '') return { ok: false, errors: { bank: 'Choose your bank' } };
  if (bank.length > MAX_BANK) {
    return { ok: false, errors: { bank: `Keep the bank name under ${MAX_BANK} characters` } };
  }
  return { ok: true, value: bank };
};

export const detectIssuer = (cardName: string): Issuer => {
  const known = ISSUERS.find((i) => i.match.test(cardName));
  if (known) {
    return {
      id: known.id,
      bank: known.bank,
      monogram: known.monogram,
      color: known.color,
      ink: known.ink,
    };
  }
  const initials = cardName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
  return { id: 'other', bank: '', monogram: initials || '•', color: '#3A4A42', ink: '#FFFFFF' };
};

/** The statement date asked first: the latest bill, so today or earlier, within 2 months. */
export const validateStatementPast = (
  input: string,
  today: CivilDate,
): Result<CivilDate, 'statementDate'> => {
  const d = input.trim();
  if (d === '') {
    return {
      ok: false,
      errors: { statementDate: 'Pick the statement date from your latest bill' },
    };
  }
  if (!isCivilDate(d)) return { ok: false, errors: { statementDate: 'Enter a real date' } };
  if (diffDays(d, today) > 0) {
    return {
      ok: false,
      errors: {
        statementDate: 'That bill is not generated yet. Use the date on your latest bill.',
      },
    };
  }
  if (diffDays(today, d) > 62) {
    return {
      ok: false,
      errors: { statementDate: 'That is over 2 months ago. Use the date on your latest bill.' },
    };
  }
  return { ok: true, value: d };
};

const MIN_GAP = 7;
const MAX_GAP = 45;

/** The statement (bill generation) date of the bill whose due date is `dueDate`. */
export const validateStatementDate = (
  input: string,
  dueDate: CivilDate,
): Result<CivilDate, 'statementDate'> => {
  const d = input.trim();
  if (d === '') {
    return {
      ok: false,
      errors: { statementDate: 'Pick the statement date from your latest bill' },
    };
  }
  if (!isCivilDate(d)) return { ok: false, errors: { statementDate: 'Enter a real date' } };
  const gap = diffDays(dueDate, d);
  if (gap <= 0) {
    return {
      ok: false,
      errors: { statementDate: 'The bill is generated before it is due. Check the dates.' },
    };
  }
  if (gap < MIN_GAP || gap > MAX_GAP) {
    return {
      ok: false,
      errors: {
        statementDate: 'Statement and due dates are usually 15 to 25 days apart. Check the dates.',
      },
    };
  }
  return { ok: true, value: d };
};

/** Monday-first weeks of a month ('YYYY-MM'), with null for days outside it. */
export const monthGrid = (month: string): (CivilDate | null)[][] => {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const lengths = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const days = lengths[m - 1] ?? 30;
  const first = `${month}-01`;
  const lead = (dayOfWeek(first) + 6) % 7; // Monday = 0
  const cells: (CivilDate | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
};
