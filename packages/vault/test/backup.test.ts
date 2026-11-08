import { describe, expect, it } from 'vitest';
import { openBackup, openVault, sealBackup, type Snapshot, type VaultOptions } from '../src';

let n = 0;
const fresh = (): VaultOptions & { name: string } => {
  n += 1;
  let id = 0;
  return {
    name: `backup-test-${n}`,
    now: () => 1_772_500_000_000,
    newId: () => {
      id += 1;
      return `b${String(id).padStart(4, '0')}`;
    },
  };
};

// Few iterations keep the suite fast; the real default is far higher.
const FAST = { iterations: 1000 };

const snapshot = (): Snapshot => ({
  cards: [],
  bills: [],
  payments: [],
  settings: { leadDays: 4, reminderTime: '09:00', contentLevel: 'cards' },
});

describe('encrypted backup file', () => {
  it('round-trips with the right passphrase and hides the contents', async () => {
    const snap = snapshot();
    snap.cards.push({
      id: 'c1',
      name: 'Regalia',
      last4: '4821',
      tone: 'forest',
      dueDay: 8,
      createdAt: 1,
    });
    const file = await sealBackup(snap, 'correct horse battery', FAST);
    expect(file).not.toContain('Regalia');
    expect(file).not.toContain('4821');
    expect(JSON.parse(file)).toMatchObject({ app: 'creditq', format: 1 });
    expect(await openBackup(file, 'correct horse battery')).toEqual(snap);
  });

  it('fails with a clear message on a wrong passphrase', async () => {
    const file = await sealBackup(snapshot(), 'right-pass', FAST);
    await expect(openBackup(file, 'wrong-pass')).rejects.toThrow(/passphrase/i);
  });

  it('rejects files that are not CreditQ backups', async () => {
    await expect(openBackup('not json', 'x')).rejects.toThrow(/backup/i);
    await expect(openBackup(JSON.stringify({ app: 'other' }), 'x')).rejects.toThrow(/backup/i);
  });

  it('requires a passphrase of at least 8 characters to create a backup', async () => {
    await expect(sealBackup(snapshot(), 'short', FAST)).rejects.toThrow(/8/);
  });

  it('uses a fresh salt and nonce each time', async () => {
    const a = JSON.parse(await sealBackup(snapshot(), 'same-passphrase', FAST));
    const b = JSON.parse(await sealBackup(snapshot(), 'same-passphrase', FAST));
    expect(a.salt).not.toBe(b.salt);
    expect(a.n).not.toBe(b.n);
  });

  it('rejects a snapshot with an unexpected shape after decrypting', async () => {
    const file = await sealBackup({ nope: 1 } as unknown as Snapshot, 'long-enough-pass', FAST);
    await expect(openBackup(file, 'long-enough-pass')).rejects.toThrow(/backup/i);
  });
});

describe('vault export and import', () => {
  it('restores cards, bills, payments and settings into an empty vault', async () => {
    const source = await openVault(fresh());
    const { card, bill } = await source.addCard({
      name: 'Regalia',
      last4: '4821',
      bank: 'HDFC Bank',
      dueDate: '2026-12-08',
      statementDate: '2026-11-18',
    });
    await source.markPaid(bill.id, { paidOn: '2026-11-30', amountPaise: 123400 });
    await source.saveSettings({ leadDays: 3 });
    const snap = await source.exportSnapshot();
    expect(snap.cards).toHaveLength(1);
    expect(snap.bills).toHaveLength(2);
    expect(snap.payments).toHaveLength(1);

    const target = await openVault(fresh());
    await target.importSnapshot(snap);
    expect(await target.listCards()).toEqual([card]);
    expect(await target.listBills()).toEqual(await source.listBills());
    expect(await target.listPayments()).toEqual(await source.listPayments());
    expect((await target.getSettings()).leadDays).toBe(3);
    source.close();
    target.close();
  });

  it('replaces what was there before', async () => {
    const target = await openVault(fresh());
    await target.addCard({ name: 'Old', last4: '1111', dueDate: '2026-12-08' });
    await target.importSnapshot(snapshot());
    expect(await target.listCards()).toEqual([]);
    expect(await target.listBills()).toEqual([]);
    target.close();
  });

  it('leaves existing data alone when the snapshot is invalid', async () => {
    const target = await openVault(fresh());
    await target.addCard({ name: 'Keep', last4: '2222', dueDate: '2026-12-08' });
    const bad = { ...snapshot(), bills: [{ id: 'x' }] } as unknown as Snapshot;
    await expect(target.importSnapshot(bad)).rejects.toThrow(/backup/i);
    expect(await target.listCards()).toHaveLength(1);
    target.close();
  });
});
