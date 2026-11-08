export interface BankCard {
  id: string;
  bank?: string | undefined;
}

export interface BankSpend {
  bank: string;
  paise: number;
  cardCount: number;
  /** The cards that paid something, biggest first. */
  cards: { id: string; paise: number }[];
}

const OTHER = 'Other';

/** Adds up what was paid per bank for one month. `byCard` is paise keyed by card id. */
export const groupSpendByBank = (
  cards: readonly BankCard[],
  byCard: Readonly<Record<string, number>>,
): BankSpend[] => {
  const groups = new Map<string, BankSpend>();
  for (const card of cards) {
    const paise = byCard[card.id] ?? 0;
    if (paise > 0) {
      const name = card.bank?.trim() || OTHER;
      const key = name.toLowerCase();
      const row = groups.get(key) ?? { bank: name, paise: 0, cardCount: 0, cards: [] };
      groups.set(key, {
        ...row,
        paise: row.paise + paise,
        cardCount: row.cardCount + 1,
        cards: [...row.cards, { id: card.id, paise }].sort((a, b) => b.paise - a.paise),
      });
    }
  }
  return [...groups.values()].sort((a, b) => b.paise - a.paise || a.bank.localeCompare(b.bank));
};
