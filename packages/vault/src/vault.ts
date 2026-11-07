/**
 * The on-device vault. Each row is { plaintext index columns, n, c }, where `c` is the
 * AES-GCM ciphertext of the full record. Index columns (ids, card ids, dates, statuses)
 * are the documented, accepted leakage; names, last 4 digits and amounts are ciphertext.
 *
 * Key: a non-extractable device key kept in IndexedDB (design doc 01, slot 4). Passphrase,
 * passkey and recovery-code slots wrap a data key in a later milestone; callers can
 * already inject their own key via `options.key`.
 */
import Dexie, { type Table } from 'dexie';
import { nextMonthlyDueDate, validateCardDetails, type CivilDate } from '@creditq/core';
import { createAesGcmCodec, generateDeviceKey, type Sealed } from './codec';

export const TILE_TONES = ['forest', 'terracotta', 'sand', 'olive', 'slate', 'teal'] as const;
export type TileTone = (typeof TILE_TONES)[number];

export interface Card {
  id: string;
  name: string;
  last4: string;
  tone: TileTone;
  /** Preferred due day of month, so a "31st" card returns to the 31st after February. */
  dueDay: number;
  createdAt: number;
}

export type BillState = 'open' | 'paid';

export interface Bill {
  id: string;
  cardId: string;
  dueDate: CivilDate;
  status: BillState;
  createdAt: number;
}

export interface Payment {
  id: string;
  billId: string;
  cardId: string;
  /** Optional: the user may skip it. Integer paise, never shown in reminders. */
  amountPaise: number | null;
  paidOn: CivilDate;
  /** The bill this payment opened for next month, removed again on undo. */
  nextBillId: string;
  createdAt: number;
}

export type ContentLevel = 'minimal' | 'cards';

export interface ReminderSettings {
  /** Days before the earliest due date (1 to 10). */
  leadDays: number;
  /** India time, 'HH:MM'. */
  reminderTime: string;
  /** Card names in notifications and calendar events: off by default (calendars sync to clouds). */
  contentLevel: ContentLevel;
}

export const DEFAULT_SETTINGS: ReminderSettings = {
  leadDays: 5,
  reminderTime: '09:00',
  contentLevel: 'minimal',
};

export interface NewCard {
  name: string;
  last4: string;
  dueDate: CivilDate;
}

export interface VaultOptions {
  name?: string;
  key?: CryptoKey;
  now?: () => number;
  newId?: () => string;
}

const PAYLOAD_V = 1;

type Row = Sealed & { id: string; v: number };
type CardRow = Row & { status: 'active' };
type BillRow = Row & { cardId: string; dueDate: string; status: BillState };
type PaymentRow = Row & { billId: string; cardId: string; paidOn: string };

class VaultDb extends Dexie {
  cards!: Table<CardRow, string>;

  bills!: Table<BillRow, string>;

  payments!: Table<PaymentRow, string>;

  meta!: Table<{ key: string; value: unknown }, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      cards: 'id, status',
      bills: 'id, cardId, dueDate, status, [cardId+dueDate]',
      payments: 'id, billId, cardId, paidOn',
      meta: 'key',
    });
  }
}

const loadDeviceKey = async (db: VaultDb): Promise<CryptoKey> => {
  const existing = await db.meta.get('deviceKey');
  if (existing) return existing.value as CryptoKey;
  const key = await generateDeviceKey();
  await db.meta.put({ key: 'deviceKey', value: key });
  return key;
};

export const openVault = async (options: VaultOptions = {}) => {
  const db = new VaultDb(options.name ?? 'creditq');
  await db.open();
  const codec = createAesGcmCodec(options.key ?? (await loadDeviceKey(db)));
  const now = options.now ?? (() => Date.now());
  const newId = options.newId ?? (() => crypto.randomUUID());

  const read = <T>(table: string, row: Row) => codec.open<T>(table, row.id, row.v, row);
  const seal = (table: string, id: string, record: unknown) =>
    codec.seal(table, id, PAYLOAD_V, record);

  const billRow = async (bill: Bill): Promise<BillRow> => ({
    id: bill.id,
    v: PAYLOAD_V,
    cardId: bill.cardId,
    dueDate: bill.dueDate,
    status: bill.status,
    ...(await seal('bills', bill.id, bill)),
  });

  const listCards = async (): Promise<Card[]> => {
    const cards = await Promise.all((await db.cards.toArray()).map((r) => read<Card>('cards', r)));
    return cards.sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  };

  const listBills = async (): Promise<Bill[]> => {
    const rows = await db.bills.orderBy('dueDate').toArray();
    return Promise.all(rows.map((r) => read<Bill>('bills', r)));
  };

  const listPayments = async (): Promise<Payment[]> => {
    const rows = await db.payments.orderBy('paidOn').toArray();
    return Promise.all(rows.map((r) => read<Payment>('payments', r)));
  };

  const getBill = async (id: string): Promise<Bill> => {
    const row = await db.bills.get(id);
    if (!row) throw new Error('Bill not found');
    return read<Bill>('bills', row);
  };

  const addCard = async (input: NewCard): Promise<{ card: Card; bill: Bill }> => {
    const checked = validateCardDetails(input);
    if (!checked.ok) throw new Error(Object.values(checked.errors).join(' '));
    const t = now();
    const count = await db.cards.count();
    const card: Card = {
      id: newId(),
      ...checked.value,
      tone: TILE_TONES[count % TILE_TONES.length] as TileTone,
      dueDay: Number(input.dueDate.slice(8, 10)),
      createdAt: t,
    };
    const bill: Bill = {
      id: newId(),
      cardId: card.id,
      dueDate: input.dueDate,
      status: 'open',
      createdAt: t,
    };
    // Encrypt first: WebCrypto promises must not run inside an IndexedDB transaction.
    const cardRow: CardRow = {
      id: card.id,
      v: PAYLOAD_V,
      status: 'active',
      ...(await seal('cards', card.id, card)),
    };
    const firstBill = await billRow(bill);
    await db.transaction('rw', db.cards, db.bills, async () => {
      await db.cards.add(cardRow);
      await db.bills.add(firstBill);
    });
    return { card, bill };
  };

  const markPaid = async (
    billId: string,
    input: { amountPaise: number | null; paidOn: CivilDate },
  ): Promise<{ payment: Payment; nextBill: Bill }> => {
    const bill = await getBill(billId);
    if (bill.status === 'paid') throw new Error('This bill is already paid');
    const card = await read<Card>('cards', (await db.cards.get(bill.cardId)) as CardRow);
    const t = now();
    const nextBill: Bill = {
      id: newId(),
      cardId: bill.cardId,
      dueDate: nextMonthlyDueDate(bill.dueDate, card.dueDay),
      status: 'open',
      createdAt: t,
    };
    const payment: Payment = {
      id: newId(),
      billId,
      cardId: bill.cardId,
      amountPaise: input.amountPaise,
      paidOn: input.paidOn,
      nextBillId: nextBill.id,
      createdAt: t,
    };
    const paidRow = await billRow({ ...bill, status: 'paid' });
    const nextRow = await billRow(nextBill);
    const paymentRow: PaymentRow = {
      id: payment.id,
      v: PAYLOAD_V,
      billId,
      cardId: bill.cardId,
      paidOn: payment.paidOn,
      ...(await seal('payments', payment.id, payment)),
    };
    await db.transaction('rw', db.bills, db.payments, async () => {
      await db.bills.put(paidRow);
      await db.bills.add(nextRow);
      await db.payments.add(paymentRow);
    });
    return { payment, nextBill };
  };

  const undoPayment = async (paymentId: string): Promise<void> => {
    const row = await db.payments.get(paymentId);
    if (!row) return;
    const payment = await read<Payment>('payments', row);
    const bill = await getBill(payment.billId);
    const reopened = await billRow({ ...bill, status: 'open' });
    await db.transaction('rw', db.bills, db.payments, async () => {
      await db.bills.put(reopened);
      await db.bills.delete(payment.nextBillId);
      await db.payments.delete(paymentId);
    });
  };

  // Settings are not sensitive (no names, digits or amounts), so they live in plain meta.
  const getSettings = async (): Promise<ReminderSettings> => {
    const row = await db.meta.get('settings');
    return { ...DEFAULT_SETTINGS, ...(row?.value as Partial<ReminderSettings> | undefined) };
  };

  const saveSettings = async (patch: Partial<ReminderSettings>): Promise<ReminderSettings> => {
    const next = { ...(await getSettings()), ...patch };
    if (!Number.isInteger(next.leadDays) || next.leadDays < 1 || next.leadDays > 10) {
      throw new Error('Lead days must be between 1 and 10');
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(next.reminderTime)) {
      throw new Error('Reminder time must be HH:MM');
    }
    await db.meta.put({ key: 'settings', value: next });
    return next;
  };

  return {
    /** Dexie instance, for live queries in the UI. */
    db,
    addCard,
    listCards,
    listBills,
    listPayments,
    markPaid,
    undoPayment,
    getSettings,
    saveSettings,
    /** Deletes the whole database, including the device key. */
    deleteEverything: async () => {
      db.close();
      await Dexie.delete(db.name);
    },
    close: () => db.close(),
  };
};

export type Vault = Awaited<ReturnType<typeof openVault>>;
