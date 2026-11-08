'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { addDays, createCalendar, formatShortDate, planPayDays } from '@creditq/core';
import styles from './playground.module.scss';

interface DemoCard {
  id: string;
  name: string;
  statement: string;
  due: string;
}

const TODAY = '2026-11-08';

const START: DemoCard[] = [
  { id: 'a', name: 'Travel card', statement: '2026-11-18', due: '2026-12-06' },
  { id: 'b', name: 'Shopping card', statement: '2026-11-20', due: '2026-12-08' },
  { id: 'c', name: 'Cashback card', statement: '2026-12-15', due: '2027-01-02' },
];

const calendar = createCalendar();

const SWATCH = [1, 2, 4, 5, 6, 3];
const swatch = (i: number): CSSProperties =>
  ({
    '--sw-from': `var(--tile-${SWATCH[i % SWATCH.length]}-from)`,
    '--sw-to': `var(--tile-${SWATCH[i % SWATCH.length]}-to)`,
  }) as CSSProperties;

export default function Playground() {
  const [lead, setLead] = useState(5);
  const [cards, setCards] = useState<DemoCard[]>(START);

  const groups = useMemo(() => {
    const valid = cards.filter((c) => c.due && c.statement && c.due > c.statement);
    const { groups: planned } = planPayDays({
      today: TODAY,
      calendar,
      config: { leadDays: lead },
      bills: valid.map((c) => ({
        id: c.id,
        cardId: c.id,
        dueDate: c.due,
        status: 'open' as const,
        availableFrom: c.statement,
      })),
    });
    const byId = new Map(cards.map((c) => [c.id, c]));
    return planned.map((g) => {
      const members = g.billIds.map((id) => byId.get(id)).filter((c): c is DemoCard => Boolean(c));
      const earliest = members.map((m) => m.due).sort()[0] ?? g.earliestDue;
      const raw = addDays(earliest, -lead);
      const why: string[] = [
        `Earliest due date ${formatShortDate(earliest)}, minus ${lead} days is ${formatShortDate(raw)}.`,
      ];
      if (g.payDay < raw) why.push('Moved earlier so it is not a weekend or bank holiday.');
      if (members.some((m) => m.statement === g.payDay))
        why.push('Never before the bill is generated.');
      if (members.length > 1)
        why.push('These cards are due within 7 days of each other, so they share one pay day.');
      return { payDay: g.payDay, members, why };
    });
  }, [cards, lead]);

  const update = (id: string, patch: Partial<DemoCard>) =>
    setCards((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  return (
    <div className={styles.root}>
      <div className={styles.controls}>
        <label className={styles.lead} htmlFor="lead">
          <span>
            Remind me <strong>{lead}</strong> days before the earliest due date
          </span>
          <input
            id="lead"
            type="range"
            min={1}
            max={10}
            value={lead}
            onChange={(e) => setLead(Number(e.target.value))}
          />
          <span className={styles.scale} aria-hidden="true">
            <span>1 day</span>
            <span>10 days</span>
          </span>
        </label>
        <p className={styles.today}>Pretend today is {formatShortDate(TODAY)} 2026.</p>

        {cards.map((c, i) => (
          <fieldset key={c.id} className={styles.card} style={swatch(i)}>
            <legend>{c.name}</legend>
            <label>
              Bill generated
              <input
                type="date"
                value={c.statement}
                onChange={(e) => update(c.id, { statement: e.target.value })}
              />
            </label>
            <label>
              Payment due
              <input
                type="date"
                value={c.due}
                onChange={(e) => update(c.id, { due: e.target.value })}
              />
            </label>
            {cards.length > 1 && (
              <button
                type="button"
                className={styles.remove}
                onClick={() => setCards((list) => list.filter((x) => x.id !== c.id))}
              >
                Remove
              </button>
            )}
          </fieldset>
        ))}
        {cards.length < 5 && (
          <button
            type="button"
            className={styles.add}
            onClick={() =>
              setCards((list) => [
                ...list,
                {
                  id: `n${list.length}${Date.now()}`,
                  name: `Card ${list.length + 1}`,
                  statement: '2026-11-22',
                  due: '2026-12-12',
                },
              ])
            }
          >
            Add a card
          </button>
        )}
      </div>

      <div className={styles.result} aria-live="polite">
        <h3>Your pay days</h3>
        {groups.length === 0 && <p>Pick a due date after the bill date for at least one card.</p>}
        {groups.map((g) => (
          <article key={g.payDay} className={styles.group}>
            <p className={styles.day}>
              <small>Pay day</small>
              <b>{formatShortDate(g.payDay)}</b>
            </p>
            <ul className={styles.members}>
              {g.members.map((m) => (
                <li key={m.id}>
                  {m.name} <span>due {formatShortDate(m.due)}</span>
                </li>
              ))}
            </ul>
            <ul className={styles.why}>
              {g.why.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
