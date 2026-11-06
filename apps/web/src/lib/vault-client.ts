'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { openVault, type Bill, type Card, type Payment, type Vault } from '@creditq/vault';
import { todayInIndia } from './today';

let opening: Promise<Vault> | null = null;

/** One vault per tab. Also asks the browser not to evict our storage. */
export const getVault = (): Promise<Vault> => {
  if (!opening) {
    opening = openVault();
    navigator.storage?.persist?.().catch(() => undefined);
  }
  return opening;
};

export interface VaultData {
  cards: Card[];
  bills: Bill[];
  payments: Payment[];
}

// Tiny change feed so every screen re-reads after a write in this tab.
const listeners = new Set<() => void>();
let version = 0;
export const notifyVaultChanged = (): void => {
  version += 1;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Decrypted vault contents, or `undefined` while loading. */
export const useVaultData = (): { data: VaultData | undefined; error: Error | undefined } => {
  const v = useSyncExternalStore(
    subscribe,
    () => version,
    () => 0,
  );
  const [state, setState] = useState<{ v: number; data?: VaultData; error?: Error }>({ v: -1 });

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const vault = await getVault();
        const [cards, bills, payments] = await Promise.all([
          vault.listCards(),
          vault.listBills(),
          vault.listPayments(),
        ]);
        if (live) setState({ v, data: { cards, bills, payments } });
      } catch (e) {
        if (live) setState({ v, error: e as Error });
      }
    })();
    return () => {
      live = false;
    };
  }, [v]);

  return { data: state.data, error: state.error };
};

const noSubscribe = () => () => {};
/** India's date on the client; null during the static prerender. */
export const useTodayInIndia = (): string | null =>
  useSyncExternalStore(noSubscribe, todayInIndia, () => null);

/** Runs a vault write, then refreshes every screen. */
export const useVaultAction = () =>
  useCallback(async <T>(fn: (vault: Vault) => Promise<T>): Promise<T> => {
    const result = await fn(await getVault());
    notifyVaultChanged();
    return result;
  }, []);
