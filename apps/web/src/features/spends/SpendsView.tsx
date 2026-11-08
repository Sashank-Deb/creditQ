'use client';

import { useMemo, useState } from 'react';
import { aggregateSpend, formatRupees } from '@creditq/core';
import type { Card, Payment } from '@creditq/vault';
import SegmentedControl from '@/components/SegmentedControl';
import { groupSpendByBank } from './group-by-bank';
import styles from './SpendsView.module.scss';

const FULL_MONTHS: Record<string, string> = {
  Jan: 'January',
  Feb: 'February',
  Mar: 'March',
  Apr: 'April',
  May: 'May',
  Jun: 'June',
  Jul: 'July',
  Aug: 'August',
  Sep: 'September',
  Oct: 'October',
  Nov: 'November',
  Dec: 'December',
};

// A card's bar is the flat base colour of its tile (the start of the tile's gradient).
const TONE_NUMBER: Record<string, number> = {
  forest: 1,
  terracotta: 2,
  sand: 3,
  olive: 4,
  slate: 5,
  burgundy: 6,
  black: 7,
};

interface SpendsViewProps {
  today: string;
  cards: readonly Card[];
  payments: readonly Payment[];
}

/** Spends: only amounts logged when marking bills paid. One hue, one axis, no legend. */
export default function SpendsView({ today, cards, payments }: SpendsViewProps) {
  const summary = useMemo(
    () => aggregateSpend(payments, { endMonth: today.slice(0, 7), months: 6 }),
    [payments, today],
  );
  const [selectedKey, setSelectedKey] = useState(today.slice(0, 7));
  const [split, setSplit] = useState<'all' | 'each'>('all');
  const [byBank, setByBank] = useState(false);

  const selected = summary.months.find((m) => m.key === selectedKey) ?? summary.months.at(-1);
  if (!selected) return null;
  const max = Math.max(...summary.months.map((m) => m.totalPaise), 1);
  const monthName = FULL_MONTHS[selected.label] ?? selected.label;

  if (summary.loggedCount === 0) {
    return (
      <section className={styles.empty} aria-labelledby="spends-empty">
        <h1 id="spends-empty" className={styles.emptyTitle}>
          No spends yet
        </h1>
        <p className={styles.note}>
          When you mark a bill paid, add the amount and it shows up here. Skipping is fine; we never
          guess.
          {summary.skippedCount > 0 &&
            ` ${summary.skippedCount} ${summary.skippedCount === 1 ? 'payment was' : 'payments were'} marked paid without an amount.`}
        </p>
      </section>
    );
  }

  const perCard = cards
    .map((c) => ({ card: c, paise: selected.byCard[c.id] ?? 0 }))
    .filter((r) => r.paise > 0)
    .sort((a, b) => b.paise - a.paise);
  const cardMax = Math.max(...perCard.map((r) => r.paise), 1);
  const perBank = groupSpendByBank(cards, selected.byCard);
  const cardById = new Map(cards.map((c) => [c.id, c]));

  return (
    <section className={styles.spends} aria-label="Spends">
      <div>
        <p className={styles.kicker}>Paid in {monthName}</p>
        <p className={styles.hero}>{formatRupees(selected.totalPaise)}</p>
        <p className={styles.note}>
          Based on {selected.loggedCount} {selected.loggedCount === 1 ? 'payment' : 'payments'} you
          logged
          {selected.skippedCount > 0 &&
            `. ${selected.skippedCount} marked paid without an amount are not counted`}
          .
        </p>
      </div>

      <SegmentedControl
        label="Split"
        value={split}
        onChange={setSplit}
        options={[
          { value: 'all', label: 'All cards' },
          { value: 'each', label: 'Each card' },
        ]}
      />

      {split === 'all' ? (
        <figure className={styles.chart} aria-label="Paid per month, last 6 months">
          <div className={styles.plot}>
            {summary.months.map((m) => (
              <button
                key={m.key}
                type="button"
                className={`${styles.col} ${m.key === selected.key ? styles.colOn : ''}`}
                aria-pressed={m.key === selected.key}
                aria-label={`${FULL_MONTHS[m.label] ?? m.label}: ${formatRupees(m.totalPaise)}`}
                onClick={() => setSelectedKey(m.key)}
              >
                <span className={styles.tip} aria-hidden="true">
                  {formatRupees(m.totalPaise)}
                </span>
                <span
                  className={styles.bar}
                  style={{
                    height: m.totalPaise > 0 ? `${Math.max(2, (m.totalPaise / max) * 100)}%` : 0,
                  }}
                />
                <span className={styles.label}>{m.label}</span>
              </button>
            ))}
          </div>
          <figcaption className={styles.note}>Tap a month to see it above.</figcaption>
        </figure>
      ) : (
        <>
          <div className={styles.filters}>
            <button
              type="button"
              className={styles.chip}
              aria-pressed={byBank}
              onClick={() => setByBank((v) => !v)}
            >
              Group by bank
            </button>
          </div>

          {byBank ? (
            <div className={styles.banks} aria-label={`Paid per bank in ${monthName}`}>
              {perBank.length === 0 && (
                <p className={styles.note}>Nothing logged for {monthName}.</p>
              )}
              {perBank.map(({ bank, paise, cardCount, cards: bankCards }) => (
                <section key={bank} className={styles.bank} aria-label={bank}>
                  <header className={styles.bankHead}>
                    <div className={styles.cardText}>
                      <h3 className={styles.bankName}>{bank}</h3>
                      <span className={styles.digits}>
                        {cardCount} {cardCount === 1 ? 'card' : 'cards'} · total
                      </span>
                    </div>
                    <span className={styles.cardAmount}>{formatRupees(paise)}</span>
                  </header>
                  <ul className={styles.cardList}>
                    {bankCards.map(({ id, paise: cardPaise }) => {
                      const card = cardById.get(id);
                      return card ? (
                        <li key={id} className={styles.cardRow}>
                          <div className={styles.cardText}>
                            <span className={styles.cardName}>{card.name}</span>
                            <span className={styles.digits}>•••• {card.last4}</span>
                          </div>
                          <span className={styles.cardAmount}>{formatRupees(cardPaise)}</span>
                          <span className={styles.track} aria-hidden="true">
                            <span
                              style={{
                                width: `${(cardPaise / paise) * 100}%`,
                                background: `var(--tile-${TONE_NUMBER[card.tone] ?? 1}-from)`,
                              }}
                            />
                          </span>
                        </li>
                      ) : null;
                    })}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <ul className={styles.cardList} aria-label={`Paid per card in ${monthName}`}>
              {perCard.length === 0 && (
                <li className={styles.note}>Nothing logged for {monthName}.</li>
              )}
              {perCard.map(({ card, paise }) => (
                <li key={card.id} className={styles.cardRow}>
                  <div className={styles.cardText}>
                    <span className={styles.cardName}>{card.name}</span>
                    <span className={styles.digits}>•••• {card.last4}</span>
                  </div>
                  <span className={styles.cardAmount}>{formatRupees(paise)}</span>
                  <span className={styles.track} aria-hidden="true">
                    <span
                      style={{
                        width: `${(paise / cardMax) * 100}%`,
                        background: `var(--tile-${TONE_NUMBER[card.tone] ?? 1}-from)`,
                      }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <table className={styles.srOnly}>
        <caption>Paid per month</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Paid</th>
          </tr>
        </thead>
        <tbody>
          {summary.months.map((m) => (
            <tr key={m.key}>
              <th scope="row">{FULL_MONTHS[m.label] ?? m.label}</th>
              <td>{formatRupees(m.totalPaise)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
