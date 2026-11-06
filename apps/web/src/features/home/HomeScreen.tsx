'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { formatRupees } from '@creditq/core';
import { todayInIndia } from '@/lib/today';
import { buildHomeView, type HomeTile } from './home-view';
import { sampleCards } from './sample-cards';
import styles from './HomeScreen.module.scss';

interface Snack {
  text: string;
  undoCardId?: string;
}

const SNACK_MS = 4000;

function Tile({ tile, onMarkPaid }: { tile: HomeTile; onMarkPaid: (id: string) => void }) {
  return (
    <article
      className={`${styles.tile} ${styles[`tone-${tile.tone}`]} ${tile.isPaid ? styles.paid : ''}`}
      aria-label={`${tile.name} ending ${tile.last4}, ${tile.dueLabel}`}
    >
      <div className={styles.tileTop}>
        <h2 className={styles.cardName}>{tile.name}</h2>
        <span className={styles.digits}>•••• {tile.last4}</span>
      </div>
      <div className={styles.chip} aria-hidden="true" />
      <div className={styles.holder}>{tile.holder}</div>
      <div className={tile.isFocus ? styles.dueFocus : styles.due}>
        {tile.isPaid ? 'Paid' : tile.dueLabel}
      </div>
      {tile.isFocus && (
        <div className={styles.tileActions}>
          <button type="button" className={styles.btnOutline}>
            Open Google Pay
          </button>
          <button
            type="button"
            className={styles.btnOnTile}
            onClick={() => onMarkPaid(tile.cardId)}
          >
            Mark as paid
          </button>
        </div>
      )}
    </article>
  );
}

// The clock is read on the client only (server snapshot is null), so the static export
// never bakes in a build date. The date string is stable within a day, as React requires.
const noSubscribe = () => () => {};
const useTodayInIndia = (): string | null =>
  useSyncExternalStore(noSubscribe, todayInIndia, () => null);

export default function HomeScreen() {
  const today = useTodayInIndia();
  const [paid, setPaid] = useState<string[]>([]);
  const [sheetFor, setSheetFor] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [snack, setSnack] = useState<Snack | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (sheetFor && !d.open) d.showModal();
    if (!sheetFor && d.open) d.close();
  }, [sheetFor]);

  useEffect(() => {
    if (!snack) return undefined;
    const t = setTimeout(() => setSnack(null), SNACK_MS);
    return () => clearTimeout(t);
  }, [snack]);

  const cards = useMemo(() => (today ? sampleCards(today) : []), [today]);
  const view = useMemo(
    () => (today ? buildHomeView({ today, cards, paidCardIds: paid }) : null),
    [today, cards, paid],
  );
  if (!view) return <main className={styles.screen} aria-busy="true" />;

  const sheetCard = cards.find((c) => c.id === sheetFor);
  const rupees = Number(amount.replace(/[^\d.]/g, ''));

  const markPaid = (logAmount: boolean) => {
    if (!sheetFor) return;
    const id = sheetFor;
    setPaid((p) => [...p, id]);
    setSheetFor(null);
    setAmount('');
    const logged =
      logAmount && rupees > 0 ? ` · ${formatRupees(Math.round(rupees * 100))} logged` : '';
    setSnack({ text: `Marked paid${logged}`, undoCardId: id });
  };

  const undo = () => {
    if (snack?.undoCardId) setPaid((p) => p.filter((x) => x !== snack.undoCardId));
    setSnack(null);
  };

  return (
    <main className={styles.screen}>
      <header className={styles.topBar}>
        <div className={styles.segment} role="tablist" aria-label="View">
          <button type="button" role="tab" aria-selected="true" className={styles.segOn}>
            Due soon <span className={styles.badge}>{view.dueSoonCount}</span>
          </button>
          <button type="button" role="tab" aria-selected="false" className={styles.segOff}>
            Spends
          </button>
        </div>
      </header>

      {view.isEmpty ? (
        <section className={styles.empty}>
          <h1 className={styles.title}>Never miss a card bill</h1>
          <p>Add a card with 2 quick questions. We remind you 5 days before it is due.</p>
        </section>
      ) : (
        <>
          <p className={styles.banner} role="status">
            {view.banner}
          </p>
          <ol className={styles.stack}>
            {view.tiles.map((t) => (
              <li key={t.cardId}>
                <Tile tile={t} onMarkPaid={setSheetFor} />
                <span className={styles.pill}>
                  <span className={styles.dot} aria-hidden="true" />
                  {t.pill}
                </span>
              </li>
            ))}
          </ol>
        </>
      )}

      <p className={styles.privacy}>Stays on this phone. No account, no cloud copy.</p>

      <dialog
        ref={dialogRef}
        className={styles.sheet}
        aria-labelledby="paid-title"
        onClose={() => setSheetFor(null)}
      >
        <form
          method="dialog"
          onSubmit={(e) => {
            e.preventDefault();
            markPaid(true);
          }}
        >
          <h2 id="paid-title" className={styles.sheetTitle}>
            How much did you pay?
          </h2>
          <p className={styles.sheetHint}>
            {sheetCard ? `${sheetCard.name} ••${sheetCard.last4}. ` : ''}Optional. It only feeds
            your Spends view and stays on this phone.
          </p>
          <label htmlFor="paid-amount" className={styles.amountField}>
            <span className={styles.srOnly}>Amount in rupees</span>
            <span aria-hidden="true">₹</span>
            <input
              id="paid-amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <div className={styles.dock}>
            <button type="submit" className={styles.btnPrimary}>
              Save and mark paid
            </button>
            <button type="button" className={styles.btnText} onClick={() => markPaid(false)}>
              Skip
            </button>
          </div>
        </form>
      </dialog>

      {snack && (
        <div className={styles.snack} role="status">
          <span>{snack.text}</span>
          {snack.undoCardId && (
            <button type="button" className={styles.snackAction} onClick={undo}>
              Undo
            </button>
          )}
        </div>
      )}
    </main>
  );
}
