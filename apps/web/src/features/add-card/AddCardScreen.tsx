'use client';

import Link from 'next/link';
import { useReducer, useState } from 'react';
import { formatShortDate } from '@creditq/core';
import { TILE_TONES, type TileTone } from '@creditq/vault';
import BackButton from '@/components/BackButton';
import CardTile from '@/components/CardTile';
import { useTodayInIndia, useVaultAction, useVaultData } from '@/lib/vault-client';
import {
  addCardReducer,
  initialAddCard,
  QUICK_ISSUERS,
  reminderPreview,
  type AddCardState,
} from './add-card-flow';
import styles from './AddCardScreen.module.scss';

function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (!message) return null;
  return (
    <p id={id} className={styles.error} role="alert">
      {message}
    </p>
  );
}

function Flow({ today, onAgain }: { today: string; onAgain: () => void }) {
  const [state, dispatch] = useReducer(addCardReducer, today, initialAddCard);
  const [savedName, setSavedName] = useState<string | null>(null);
  const { data } = useVaultData();
  const act = useVaultAction();

  const nextTone: TileTone = TILE_TONES[(data?.cards.length ?? 0) % TILE_TONES.length] ?? 'forest';
  const dueLabel = state.dueDate ? `Due ${formatShortDate(state.dueDate)}` : 'Due date next';

  const submit = async (s: AddCardState) => {
    const next = addCardReducer(s, { type: 'next' });
    dispatch({ type: 'next' });
    if (next.step !== 'saving') return;
    try {
      await act((v) =>
        v.addCard({
          name: next.name,
          last4: next.last4,
          dueDate: next.dueDate,
          statementDate: next.statementDate,
        }),
      );
      setSavedName(next.name);
    } catch (e) {
      dispatch({ type: 'failed', message: (e as Error).message });
    }
  };

  if (savedName) {
    // Include the card just saved even if the vault re-read has not landed yet.
    const openDues = new Set(
      (data?.bills ?? []).filter((b) => b.status === 'open').map((b) => b.dueDate),
    );
    openDues.add(state.dueDate);
    const preview = reminderPreview(today, [...openDues], '9:00 am');
    return (
      <main className={styles.screen}>
        <div className={styles.doneIcon} aria-hidden="true">
          ✓
        </div>
        <h1 className={styles.title}>{savedName} is set</h1>
        <p className={styles.lead}>
          <strong>{preview.headline}.</strong> {preview.detail}
        </p>
        <section className={styles.preview} aria-label="How the reminder looks">
          <span className={styles.overline}>CreditQ · 9:00 am</span>
          <span className={styles.previewText}>{preview.notification}</span>
        </section>
        <div className={styles.dock}>
          <Link href="/settings" className={styles.btnPrimary}>
            Set up reminders
          </Link>
          <Link href="/" className={styles.btnText}>
            Done
          </Link>
          <button type="button" className={styles.btnText} onClick={onAgain}>
            Add another card
          </button>
        </div>
      </main>
    );
  }

  const step1 = state.step === 1;
  const stepNumber = state.step === 'saving' ? 3 : state.step;
  return (
    <main className={styles.screen}>
      <header className={styles.topBar}>
        {step1 ? (
          <BackButton href="/" label="Cancel" />
        ) : (
          <BackButton onClick={() => dispatch({ type: 'back' })} />
        )}
        <div
          className={styles.progress}
          role="progressbar"
          aria-label="Add card progress"
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={stepNumber}
        >
          <span style={{ width: `${(stepNumber / 3) * 100}%` }} />
        </div>
      </header>

      <CardTile name={state.name.trim()} last4={state.last4} tone={nextTone} dueLabel={dueLabel} />

      <form
        className={styles.form}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit(state);
        }}
      >
        {step1 ? (
          <>
            <h1 className={styles.title}>Which card is it?</h1>
            <label className={styles.label} htmlFor="card-name">
              Card name
            </label>
            <input
              id="card-name"
              className={styles.input}
              value={state.name}
              placeholder="Axis Flipkart"
              autoComplete="off"
              aria-invalid={Boolean(state.errors.name)}
              aria-describedby="card-name-error"
              onChange={(e) => dispatch({ type: 'set', field: 'name', value: e.target.value })}
            />
            <FieldError id="card-name-error" message={state.errors.name} />
            <div className={styles.chips} role="group" aria-label="Quick start">
              {QUICK_ISSUERS.map((issuer) => (
                <button
                  key={issuer}
                  type="button"
                  className={styles.chip}
                  onClick={() => dispatch({ type: 'pickIssuer', issuer })}
                >
                  {issuer}
                </button>
              ))}
            </div>
            <label className={styles.label} htmlFor="card-last4">
              Last 4 digits
            </label>
            <input
              id="card-last4"
              className={`${styles.input} ${styles.last4}`}
              value={state.last4}
              inputMode="numeric"
              autoComplete="off"
              placeholder="9033"
              aria-invalid={Boolean(state.errors.last4)}
              aria-describedby="card-last4-hint card-last4-error"
              onChange={(e) => dispatch({ type: 'set', field: 'last4', value: e.target.value })}
            />
            <p id="card-last4-hint" className={styles.hint}>
              Only the last 4. We never ask for your full card number.
            </p>
            <FieldError id="card-last4-error" message={state.errors.last4} />
            <p className={styles.soon}>Import from statement (coming soon)</p>
          </>
        ) : null}
        {state.step === 2 && (
          <>
            <h1 className={styles.title}>When is it due?</h1>
            <label className={styles.label} htmlFor="card-due">
              Payment due date (on your latest bill)
            </label>
            <input
              id="card-due"
              type="date"
              className={styles.input}
              value={state.dueDate}
              min={today}
              aria-invalid={Boolean(state.errors.dueDate)}
              aria-describedby="card-due-hint card-due-error"
              onChange={(e) => dispatch({ type: 'set', field: 'dueDate', value: e.target.value })}
            />
            <p id="card-due-hint" className={styles.hint}>
              Repeats every month. We never ask for the amount; you only log it after you pay.
            </p>
            <FieldError id="card-due-error" message={state.errors.dueDate} />
          </>
        )}
        {(state.step === 3 || state.step === 'saving') && (
          <>
            <h1 className={styles.title}>When was this bill generated?</h1>
            <label className={styles.label} htmlFor="card-statement">
              Statement date (on the same bill)
            </label>
            <input
              id="card-statement"
              type="date"
              className={styles.input}
              value={state.statementDate}
              max={state.dueDate}
              aria-invalid={Boolean(state.errors.statementDate)}
              aria-describedby="card-statement-hint card-statement-error"
              onChange={(e) =>
                dispatch({ type: 'set', field: 'statementDate', value: e.target.value })
              }
            />
            <p id="card-statement-hint" className={styles.hint}>
              Your monthly cycle starts here. After you pay, the card waits in the paid deck and
              comes back as due on this date next month.
            </p>
            <FieldError id="card-statement-error" message={state.errors.statementDate} />
          </>
        )}
        <div className={styles.dock}>
          <button type="submit" className={styles.btnPrimary} disabled={state.step === 'saving'}>
            {state.step === 1 || state.step === 2 ? 'Next' : 'Save card'}
          </button>
        </div>
      </form>
    </main>
  );
}

export default function AddCardScreen() {
  const today = useTodayInIndia();
  const [run, setRun] = useState(0);
  if (!today) return <main className={styles.screen} aria-busy="true" />;
  // A new key remounts the flow with a fresh, empty form.
  return <Flow key={run} today={today} onAgain={() => setRun((n) => n + 1)} />;
}
