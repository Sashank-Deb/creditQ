import { describe, expect, it } from 'vitest';
import Dexie from 'dexie';
import { openVault, type VaultOptions } from '../src';

let n = 0;
const fresh = (extra: Partial<VaultOptions> = {}): VaultOptions => {
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
