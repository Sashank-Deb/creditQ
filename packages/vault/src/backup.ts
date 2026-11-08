/**
 * Encrypted backup file. The device key never leaves the device, so a backup is sealed
 * with a key derived from a passphrase the user chooses: PBKDF2-SHA-256 into AES-256-GCM.
 * The file is JSON; only the KDF parameters and nonce are readable, the data is ciphertext.
 */
import type { Bill, Card, Payment, ReminderSettings } from './vault';

export interface Snapshot {
  cards: Card[];
  bills: Bill[];
  payments: Payment[];
  settings: ReminderSettings;
}

export interface BackupFile {
  app: 'creditq';
  format: 1;
  kdf: 'PBKDF2-SHA-256';
  iterations: number;
  salt: string;
  n: string;
  c: string;
}

export const MIN_PASSPHRASE = 8;
export const DEFAULT_ITERATIONS = 600_000;

const NOT_A_BACKUP = 'This is not a CreditQ backup file.';
const enc = new TextEncoder();
const dec = new TextDecoder();

const toB64 = (bytes: Uint8Array): string => {
  let s = '';
  bytes.forEach((b) => {
    s += String.fromCharCode(b);
  });
  return btoa(s);
};

const fromB64 = (s: string): Uint8Array<ArrayBuffer> => {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
};

const deriveKey = async (
  passphrase: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<CryptoKey> => {
  const base = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
};

const AAD = enc.encode('creditq/backup/v1');

export const sealBackup = async (
  snapshot: Snapshot,
  passphrase: string,
  options: { iterations?: number } = {},
): Promise<string> => {
  if (passphrase.length < MIN_PASSPHRASE) {
    throw new Error(`Use a passphrase of at least ${MIN_PASSPHRASE} characters.`);
  }
  const iterations = options.iterations ?? DEFAULT_ITERATIONS;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, iterations);
  const c = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce, additionalData: AAD },
    key,
    enc.encode(JSON.stringify(snapshot)),
  );
  const file: BackupFile = {
    app: 'creditq',
    format: 1,
    kdf: 'PBKDF2-SHA-256',
    iterations,
    salt: toB64(salt),
    n: toB64(nonce),
    c: toB64(new Uint8Array(c)),
  };
  return JSON.stringify(file);
};

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isString = (v: unknown): v is string => typeof v === 'string';

/** Shape check only: enough to stop junk reaching the vault, not a full schema. */
export const isSnapshot = (v: unknown): v is Snapshot => {
  if (!isObject(v)) return false;
  const { cards, bills, payments, settings } = v;
  return (
    Array.isArray(cards) &&
    cards.every((c) => isObject(c) && isString(c.id) && isString(c.name) && isString(c.last4)) &&
    Array.isArray(bills) &&
    bills.every(
      (b) => isObject(b) && isString(b.id) && isString(b.cardId) && isString(b.dueDate),
    ) &&
    Array.isArray(payments) &&
    payments.every((p) => isObject(p) && isString(p.id) && isString(p.billId)) &&
    isObject(settings)
  );
};

export const openBackup = async (text: string, passphrase: string): Promise<Snapshot> => {
  let file: unknown;
  try {
    file = JSON.parse(text);
  } catch {
    throw new Error(NOT_A_BACKUP);
  }
  if (
    !isObject(file) ||
    file.app !== 'creditq' ||
    file.format !== 1 ||
    !isString(file.salt) ||
    !isString(file.n) ||
    !isString(file.c) ||
    typeof file.iterations !== 'number' ||
    file.iterations < 1 ||
    file.iterations > 10_000_000
  ) {
    throw new Error(NOT_A_BACKUP);
  }
  let plain: ArrayBuffer;
  try {
    const key = await deriveKey(passphrase, fromB64(file.salt), file.iterations);
    plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromB64(file.n), additionalData: AAD },
      key,
      fromB64(file.c),
    );
  } catch {
    throw new Error('Wrong passphrase, or the file was changed.');
  }
  const snapshot: unknown = JSON.parse(dec.decode(plain));
  if (!isSnapshot(snapshot)) throw new Error(NOT_A_BACKUP);
  return snapshot;
};
