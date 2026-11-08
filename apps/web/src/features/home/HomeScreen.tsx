'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatClock, formatRupees } from '@creditq/core';
import Confetti from '@/components/Confetti';
import MoreMenu from '@/components/MoreMenu';
import SegmentedControl from '@/components/SegmentedControl';
import CardTile, { cardTileStyles as tileStyles } from '@/components/CardTile';
import { useTodayInIndia, useVaultAction, useVaultData } from '@/lib/vault-client';
import SpendsView from '@/features/spends/SpendsView';
import { currentBills } from './current-bills';
import MiniCalendar from './MiniCalendar';
import CardDeck from './CardDeck';
import ReminderTimeline from './ReminderTimeline';
import { buildHomeView } from './home-view';
import styles from './HomeScreen.module.scss';

interface Snack {
  text: string;
  undoPaymentId?: string;
}

const SNACK_MS = 4000;

export default function HomeScreen() {
  const today = useTodayInIndia();
  const { data, error } = useVaultData();
  const act = useVaultAction();
  const [tab, setTab] = useState<'due' | 'spends'>('due');
  const [sheetFor, setSheetFor] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [snack, setSnack] = useState<Snack | null>(null);
  const [celebrate, setCelebrate] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (sheetFor && !d.open) d.showModal();
    if (!sheetFor && d.open) d.close();
  }, [sheetFor]);

  useEffect(() => {
    if (celebrate === 0) return undefined;
    const c = setTimeout(() => setCelebrate(0), 1800);
    return () => clearTimeout(c);
  }, [celebrate]);

  useEffect(() => {
    if (!snack) return undefined;
    const t = setTimeout(() => setSnack(null), SNACK_MS);
    return () => clearTimeout(t);
  }, [snack]);

  const current = useMemo(
    () => (today && data ? currentBills(data.cards, data.bills, data.payments, today) : null),
    [today, data],
  );
  const view = useMemo(
    () =>
      today && current
        ? buildHomeView({
            today,
            cards: current.cards,
            paidCardIds: current.paidCardIds,
            leadDays: data?.settings.leadDays ?? 5,
            reminderTime: formatClock(data?.settings.reminderTime ?? '09:00'),
          })
        : null,
    [today, current, data],
  );

  if (error) {
    return (
      <main className={styles.screen}>
        <p className={styles.banner} role="alert">
          Your cards could not be opened on this device. Try reloading the page.
        </p>
      </main>
    );
  }
  if (!view || !current || !today) return <main className={styles.screen} aria-busy="true" />;

  const sheetCard = current.cards.find((c) => c.id === sheetFor);
  const rupees = Number(amount.replace(/[^\d.]/g, ''));

  const markPaid = async (logAmount: boolean) => {
    if (!sheetCard) return;
    const amountPaise = logAmount && rupees > 0 ? Math.round(rupees * 100) : null;
    setSheetFor(null);
    setAmount('');
    const { payment } = await act((v) =>
      v.markPaid(sheetCard.billId, { amountPaise, paidOn: today }),
    );
    const logged = amountPaise ? ` · ${formatRupees(amountPaise)} logged` : '';
    setSnack({ text: `Marked paid${logged}`, undoPaymentId: payment.id });
    setCelebrate((n) => n + 1);
  };

  const undo = async () => {
    const id = snack?.undoPaymentId;
    setSnack(null);
    if (id) await act((v) => v.undoPayment(id));
  };

  return (
    <main className={styles.screen}>
      <header className={styles.topBar}>
        <SegmentedControl
          label="View"
          value={tab}
          onChange={setTab}
          options={[
            {
              value: 'due',
              label: (
                <>
                  Due soon
                  {view.dueSoonCount > 0 && (
                    <span className={styles.badge}>{view.dueSoonCount}</span>
                  )}
                </>
              ),
            },
            { value: 'spends', label: 'Spends' },
          ]}
        />
        <Link href="/add" className={styles.iconButton} aria-label="Add a card">
          +
        </Link>
        <MoreMenu />
      </header>

      {tab === 'spends' && data && (
        <SpendsView today={today} cards={data.cards} payments={data.payments} />
      )}
      {tab === 'due' && view.isEmpty && (
        <section className={styles.empty}>
          <h1 className={styles.title}>Never miss a card bill</h1>
          <p className={styles.lead}>
            Add a card with 2 quick questions. We remind you 5 days before it is due. You never need
            to type an amount.
          </p>
          <Link href="/add" className={styles.btnPrimary}>
            Add your first card
          </Link>
        </section>
      )}
      {tab === 'due' && !view.isEmpty && (
        <>
          <div className={styles.overview}>
            <MiniCalendar calendar={view.calendar} />
            <ReminderTimeline
              items={view.timeline}
              time={formatClock(data?.settings.reminderTime ?? '09:00')}
            />
            <p className={styles.srOnly} role="status">
              {view.banner}
            </p>
          </div>
          <ol className={styles.stack}>
            {view.tiles.map((t) => (
              <li key={t.cardId}>
                <CardTile
                  name={t.name}
                  last4={t.last4}
                  tone={t.tone}
                  pattern={t.pattern}
                  dueLabel={t.dueLabel}
                  issuer={t.issuer}
                  focus={t.isFocus}
                  editHref={`/card?id=${encodeURIComponent(t.cardId)}`}
                  actions={
                    t.isFocus ? (
                      <button
                        type="button"
                        className={tileStyles.btnOnTile}
                        onClick={() => setSheetFor(t.cardId)}
                      >
                        Mark as paid
                      </button>
                    ) : null
                  }
                />
                {t.pill && (
                  <span className={styles.pill}>
                    <span className={styles.dot} aria-hidden="true" />
                    {t.pill}
                  </span>
                )}
              </li>
            ))}
          </ol>
          {view.tiles.length === 0 && <p className={styles.quiet}>Nothing to pay this week.</p>}
          <CardDeck title="Recently added" cards={view.decks.recent} />
          <CardDeck title="Paid this cycle" cards={view.decks.paid} />
          <CardDeck title="Bill generated" cards={view.decks.generated} />
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

      {celebrate > 0 && <Confetti key={celebrate} />}

      {snack && (
        <div className={styles.snack} role="status">
          <span>{snack.text}</span>
          {snack.undoPaymentId && (
            <button type="button" className={styles.snackAction} onClick={undo}>
              Undo
            </button>
          )}
        </div>
      )}
    </main>
  );
}
