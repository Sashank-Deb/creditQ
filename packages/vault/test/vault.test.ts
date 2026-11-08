import { describe, expect, it } from 'vitest';
import Dexie from 'dexie';
import { openVault, type VaultOptions } from '../src';

let n = 0;
const fresh = (extra: Partial<VaultOptions> = {}): VaultOptions & { name: string } => {
  n += 1;
  let id = 0;
  return {
    name: `vault-test-${n}`,
    now: () => 1_772_500_000_000,
    newId: () => {
      id += 1;
      return `id${String(id).padStart(4, '0')}`;
    },
    ...extra,
  };
};

const rawRows = async (name: string, table: string): Promise<unknown[]> => {
  const db = new Dexie(name);
  await db.open();
  const rows = await db.table(table).toArray();
  db.close();
  return rows;
};

const newKey = () =>
  crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);

describe('vault: cards and bills', () => {
  it('adds a card with its first bill and reads them back', async () => {
    const vault = await openVault(fresh());
    const { card, bill } = await vault.addCard({
      name: 'HDFC Regalia',
      last4: '4821',
      dueDate: '2026-03-08',
    });
    expect(card).toMatchObject({ name: 'HDFC Regalia', last4: '4821', tone: 'forest', dueDay: 8 });
    expect(bill).toMatchObject({ cardId: card.id, dueDate: '2026-03-08', status: 'open' });
    expect(await vault.listCards()).toEqual([card]);
    expect(await vault.listBills()).toEqual([bill]);
    vault.close();
  });

  it('rotates tile tones per new card', async () => {
    const vault = await openVault(fresh());
    const tones = [];
    for (const [i, name] of ['A', 'B', 'C'].entries()) {
      // eslint-disable-next-line no-await-in-loop
      const { card } = await vault.addCard({ name, last4: `000${i}`, dueDate: '2026-03-08' });
      tones.push(card.tone);
    }
    expect(tones).toEqual(['forest', 'terracotta', 'sand']);
    vault.close();
  });

  it('validates input and never accepts a full card number', async () => {
    const vault = await openVault(fresh());
    await expect(
      vault.addCard({ name: 'Axis', last4: '4111111111111111', dueDate: '2026-03-08' }),
    ).rejects.toThrow(/last 4 digits/);
    vault.close();
  });
});

describe('vault: encryption at rest', () => {
  it('stores names, last 4 digits and amounts only as ciphertext', async () => {
    const opts = fresh();
    const vault = await openVault(opts);
    const { bill } = await vault.addCard({
      name: 'HDFC Regalia',
      last4: '4821',
      dueDate: '2026-03-08',
    });
    await vault.markPaid(bill.id, { amountPaise: 4238000, paidOn: '2026-03-03' });
    vault.close();

    const dump = JSON.stringify([
      ...(await rawRows(opts.name, 'cards')),
      ...(await rawRows(opts.name, 'bills')),
      ...(await rawRows(opts.name, 'payments')),
    ]);
    expect(dump).not.toContain('HDFC');
    expect(dump).not.toContain('4821');
    expect(dump).not.toContain('4238000');
    // Documented, accepted plaintext index columns: ids, card ids, dates and statuses.
    expect(dump).toContain('2026-03-08');
  });

  it('cannot be read with a different key', async () => {
    const opts = fresh({ key: await newKey() });
    const a = await openVault(opts);
    await a.addCard({ name: 'SBI', last4: '1207', dueDate: '2026-03-08' });
    a.close();
    const b = await openVault({ ...opts, key: await newKey() });
    await expect(b.listCards()).rejects.toThrow();
    b.close();
  });

  it('detects ciphertext moved between rows (AAD binds table and id)', async () => {
    const opts = fresh();
    const vault = await openVault(opts);
    const one = await vault.addCard({ name: 'One', last4: '1111', dueDate: '2026-03-08' });
    const two = await vault.addCard({ name: 'Two', last4: '2222', dueDate: '2026-03-09' });
    vault.close();

    const db = new Dexie(opts.name);
    await db.open();
    const rowOne = await db.table('cards').get(one.card.id);
    await db.table('cards').update(two.card.id, { n: rowOne.n, c: rowOne.c });
    db.close();

    const again = await openVault(opts);
    await expect(again.listCards()).rejects.toThrow();
    again.close();
  });

  it('keeps a device key across sessions when no key is passed', async () => {
    const opts = fresh();
    const first = await openVault(opts);
    await first.addCard({ name: 'Axis Flipkart', last4: '9033', dueDate: '2026-03-10' });
    first.close();
    const second = await openVault(opts);
    expect((await second.listCards()).map((c) => c.name)).toEqual(['Axis Flipkart']);
    second.close();
  });
});

describe('vault: mark as paid', () => {
  it('marks the bill paid, stores an optional amount, and opens next month', async () => {
    const vault = await openVault(fresh());
    const { bill } = await vault.addCard({ name: 'HDFC', last4: '4821', dueDate: '2026-01-31' });
    const { payment, nextBill } = await vault.markPaid(bill.id, {
      amountPaise: null,
      paidOn: '2026-01-27',
    });
    expect(payment).toMatchObject({ billId: bill.id, amountPaise: null, paidOn: '2026-01-27' });
    expect(nextBill).toMatchObject({ dueDate: '2026-02-28', status: 'open' });
    const bills = await vault.listBills();
    expect(bills.map((b) => [b.dueDate, b.status])).toEqual([
      ['2026-01-31', 'paid'],
      ['2026-02-28', 'open'],
    ]);
    vault.close();
  });

  it('undo restores the bill and removes the bill it opened', async () => {
    const vault = await openVault(fresh());
    const { bill } = await vault.addCard({ name: 'HDFC', last4: '4821', dueDate: '2026-03-08' });
    const { payment } = await vault.markPaid(bill.id, { amountPaise: 100, paidOn: '2026-03-03' });
    await vault.undoPayment(payment.id);
    expect((await vault.listBills()).map((b) => [b.dueDate, b.status])).toEqual([
      ['2026-03-08', 'open'],
    ]);
    expect(await vault.listPayments()).toEqual([]);
    vault.close();
  });

  it('refuses to pay a bill twice', async () => {
    const vault = await openVault(fresh());
    const { bill } = await vault.addCard({ name: 'HDFC', last4: '4821', dueDate: '2026-03-08' });
    await vault.markPaid(bill.id, { amountPaise: null, paidOn: '2026-03-03' });
    await expect(
      vault.markPaid(bill.id, { amountPaise: null, paidOn: '2026-03-03' }),
    ).rejects.toThrow(/already paid/);
    vault.close();
  });
});

describe('vault: delete everything', () => {
  it('removes all data and the device key', async () => {
    const opts = fresh();
    const vault = await openVault(opts);
    await vault.addCard({ name: 'HDFC', last4: '4821', dueDate: '2026-03-08' });
    await vault.deleteEverything();
    expect(await Dexie.exists(opts.name)).toBe(false);
  });
});

describe('vault: reminder settings', () => {
  it('has sensible defaults: 5 days before, 9:00 am, no card names', async () => {
    const vault = await openVault(fresh());
    expect(await vault.getSettings()).toEqual({
      leadDays: 5,
      reminderTime: '09:00',
      contentLevel: 'minimal',
    });
    vault.close();
  });

  it('saves changes and keeps them across sessions', async () => {
    const opts = fresh();
    const a = await openVault(opts);
    await a.saveSettings({ leadDays: 3, contentLevel: 'cards' });
    a.close();
    const b = await openVault(opts);
    expect(await b.getSettings()).toEqual({
      leadDays: 3,
      reminderTime: '09:00',
      contentLevel: 'cards',
    });
    b.close();
  });

  it('rejects lead days outside 1 to 10', async () => {
    const vault = await openVault(fresh());
    await expect(vault.saveSettings({ leadDays: 11 })).rejects.toThrow(/1 and 10/);
    vault.close();
  });
});

describe('vault: monthly cycle with statement dates', () => {
  it('stores the statement date on the bill and the statement day on the card', async () => {
    const vault = await openVault(fresh());
    const { card, bill } = await vault.addCard({
      name: 'HDFC Regalia',
      last4: '4821',
      statementDate: '2026-11-02',
      dueDate: '2026-11-20',
    });
    expect(card).toMatchObject({ statementDay: 2, dueDay: 20 });
    expect(bill).toMatchObject({ statementDate: '2026-11-02', dueDate: '2026-11-20' });
    vault.close();
  });

  it('rejects a statement date that does not fit the due date', async () => {
    const vault = await openVault(fresh());
    await expect(
      vault.addCard({
        name: 'HDFC',
        last4: '4821',
        statementDate: '2026-11-25',
        dueDate: '2026-11-20',
      }),
    ).rejects.toThrow(/before it is due/);
    vault.close();
  });

  it('opens next month with both dates rolled forward', async () => {
    const vault = await openVault(fresh());
    const { bill } = await vault.addCard({
      name: 'HDFC',
      last4: '4821',
      statementDate: '2026-12-31',
      dueDate: '2027-01-20',
    });
    const { nextBill } = await vault.markPaid(bill.id, { amountPaise: null, paidOn: '2027-01-15' });
    expect(nextBill).toMatchObject({ statementDate: '2027-01-31', dueDate: '2027-02-20' });
    vault.close();
  });

  it('still works for cards added before statement dates existed', async () => {
    const vault = await openVault(fresh());
    const { bill } = await vault.addCard({ name: 'Old', last4: '1111', dueDate: '2026-11-20' });
    const { nextBill } = await vault.markPaid(bill.id, { amountPaise: null, paidOn: '2026-11-15' });
    expect(nextBill.statementDate).toBeUndefined();
    expect(nextBill.dueDate).toBe('2026-12-20');
    vault.close();
  });
});

describe('vault: edit and remove a card', () => {
  it('edits the name, last 4 and the current bill dates', async () => {
    const vault = await openVault(fresh());
    const { card } = await vault.addCard({ name: 'HDFC', last4: '4821', dueDate: '2026-11-20' });
    const updated = await vault.updateCard(card.id, {
      name: 'HDFC Infinia',
      last4: '9999',
      statementDate: '2026-11-03',
      dueDate: '2026-11-21',
    });
    expect(updated).toMatchObject({
      name: 'HDFC Infinia',
      last4: '9999',
      statementDay: 3,
      dueDay: 21,
    });
    const [bill] = await vault.listBills();
    expect(bill).toMatchObject({
      statementDate: '2026-11-03',
      dueDate: '2026-11-21',
      status: 'open',
    });
    vault.close();
  });

  it('edits the upcoming bill when the current one is already paid', async () => {
    const vault = await openVault(fresh());
    const { bill } = await vault.addCard({ name: 'HDFC', last4: '4821', dueDate: '2026-11-20' });
    await vault.markPaid(bill.id, { amountPaise: 100, paidOn: '2026-11-15' });
    const cardId = (await vault.listCards())[0]!.id;
    await vault.updateCard(cardId, { name: 'HDFC', last4: '4821', dueDate: '2026-12-22' });
    const bills = await vault.listBills();
    expect(bills.map((b) => [b.dueDate, b.status])).toEqual([
      ['2026-11-20', 'paid'],
      ['2026-12-22', 'open'],
    ]);
    vault.close();
  });

  it('removes the card with its bills and logged payments', async () => {
    const vault = await openVault(fresh());
    const keep = await vault.addCard({ name: 'Keep', last4: '1111', dueDate: '2026-11-20' });
    const gone = await vault.addCard({ name: 'Gone', last4: '2222', dueDate: '2026-11-21' });
    await vault.markPaid(gone.bill.id, { amountPaise: 5000, paidOn: '2026-11-15' });
    await vault.removeCard(gone.card.id);
    expect((await vault.listCards()).map((c) => c.name)).toEqual(['Keep']);
    expect((await vault.listBills()).map((b) => b.cardId)).toEqual([keep.card.id]);
    expect(await vault.listPayments()).toEqual([]);
    vault.close();
  });
});

describe('vault: bank, colour and pattern are their own fields', () => {
  it('stores the bank separately from the card name', async () => {
    const vault = await openVault(fresh());
    const { card } = await vault.addCard({
      name: 'Premier',
      bank: 'HSBC',
      last4: '4821',
      dueDate: '2026-11-20',
    });
    expect(card).toMatchObject({ name: 'Premier', bank: 'HSBC' });
    vault.close();
  });

  it('uses the chosen colour and pattern, else rotates colours with the default pattern', async () => {
    const vault = await openVault(fresh());
    const chosen = await vault.addCard({
      name: 'A',
      last4: '1111',
      dueDate: '2026-11-20',
      tone: 'burgundy',
      pattern: 'dots',
    });
    expect(chosen.card).toMatchObject({ tone: 'burgundy', pattern: 'dots' });
    const auto = await vault.addCard({ name: 'B', last4: '2222', dueDate: '2026-11-21' });
    expect(auto.card).toMatchObject({ tone: 'terracotta', pattern: 'diamonds' });
    vault.close();
  });

  it('rejects an unknown colour or pattern', async () => {
    const vault = await openVault(fresh());
    await expect(
      vault.addCard({
        name: 'A',
        last4: '1111',
        dueDate: '2026-11-20',
        pattern: 'stripes' as never,
      }),
    ).rejects.toThrow(/pattern/i);
    vault.close();
  });

  it('edits bank, colour and pattern', async () => {
    const vault = await openVault(fresh());
    const { card } = await vault.addCard({ name: 'A', last4: '1111', dueDate: '2026-11-20' });
    const updated = await vault.updateCard(card.id, {
      name: 'A',
      bank: 'HSBC',
      last4: '1111',
      dueDate: '2026-11-20',
      tone: 'slate',
      pattern: 'lines',
    });
    expect(updated).toMatchObject({ bank: 'HSBC', tone: 'slate', pattern: 'lines' });
    expect((await vault.listCards())[0]).toMatchObject({
      bank: 'HSBC',
      tone: 'slate',
      pattern: 'lines',
    });
    vault.close();
  });
});

describe('vault: card colours and patterns', () => {
  it('offers burgundy and black, not deep teal, and six patterns', async () => {
    const { TILE_TONES, TILE_PATTERNS } = await import('../src');
    expect(TILE_TONES).toContain('burgundy');
    expect(TILE_TONES).toContain('black');
    expect(TILE_TONES).not.toContain('teal');
    expect(TILE_PATTERNS).toEqual(['diamonds', 'lines', 'dots', 'grid', 'rings', 'plain']);
  });

  it('accepts the new colours and patterns', async () => {
    const vault = await openVault(fresh());
    const { card } = await vault.addCard({
      name: 'A',
      last4: '1111',
      dueDate: '2026-11-20',
      tone: 'black',
      pattern: 'rings',
    });
    expect(card).toMatchObject({ tone: 'black', pattern: 'rings' });
    vault.close();
  });

  it('rotates through all seven colours', async () => {
    const vault = await openVault(fresh());
    const tones: string[] = [];
    for (const index of [1, 2, 3, 4, 5, 6, 7, 8]) {
      // eslint-disable-next-line no-await-in-loop
      const { card } = await vault.addCard({
        name: `C${index}`,
        last4: '1111',
        dueDate: '2026-11-20',
      });
      tones.push(card.tone);
    }
    expect(tones).toEqual([
      'forest',
      'terracotta',
      'sand',
      'olive',
      'slate',
      'burgundy',
      'black',
      'forest',
    ]);
    vault.close();
  });

  it('shows a card that was saved as deep teal in an existing colour instead of breaking', async () => {
    const opts = fresh();
    const first = await openVault(opts);
    const { card } = await first.addCard({ name: 'Old', last4: '1111', dueDate: '2026-11-20' });
    // Simulate a card written before deep teal was removed.
    const row = await first.db.cards.get(card.id);
    const raw = JSON.stringify({ ...card, tone: 'teal' });
    const { createAesGcmCodec } = await import('../src');
    const { db } = first;
    const key = (await db.meta.get('deviceKey'))!.value as CryptoKey;
    const sealed = await createAesGcmCodec(key).seal('cards', card.id, 1, JSON.parse(raw));
    await db.cards.put({ ...row!, ...sealed });
    first.close();

    const again = await openVault(opts);
    const [shown] = await again.listCards();
    expect(shown?.tone).toBe('forest');
    again.close();
  });
});
