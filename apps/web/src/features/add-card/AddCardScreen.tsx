'use client';

import Link from 'next/link';
import { useReducer, useState } from 'react';
import { detectIssuer, formatShortDate, lastDayOfMonth, listBanks } from '@creditq/core';
import { TILE_TONES, type TileTone } from '@creditq/vault';
import BackButton from '@/components/BackButton';
import CardTile from '@/components/CardTile';
import TileStylePicker from '@/components/TileStylePicker';
import { useTodayInIndia, useVaultAction, useVaultData } from '@/lib/vault-client';
import {
  addCardReducer,
  initialAddCard,
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

  const banks = listBanks();
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
          bank: next.bank,
          ...(next.tone ? { tone: next.tone } : {}),
          pattern: next.pattern,
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

      <CardTile
        name={state.name.trim()}
        last4={state.last4}
        tone={state.tone ?? nextTone}
        pattern={state.pattern}
        issuer={detectIssuer(state.bank || 'Bank')}
        dueLabel={dueLabel}
      />

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
            <label className={styles.label} htmlFor="card-bank">
              Bank
            </label>
            <select
              id="card-bank"
              className={styles.input}
              value={state.otherBank ? 'Other' : state.bank}
              aria-invalid={Boolean(state.errors.bank)}
              aria-describedby="card-bank-error"
              onChange={(e) => dispatch({ type: 'pickBank', bank: e.target.value })}
            >
              <option value="" disabled>
                Choose your bank
              </option>
              {banks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
              <option value="Other">Other</option>
            </select>
            {state.otherBank && (
              <input
                id="card-bank-other"
                className={styles.input}
                value={state.bank}
                placeholder="Bank name"
                autoComplete="off"
                aria-label="Bank name"
                aria-invalid={Boolean(state.errors.bank)}
                aria-describedby="card-bank-error"
                onChange={(e) => dispatch({ type: 'set', field: 'bank', value: e.target.value })}
              />
            )}
            <FieldError id="card-bank-error" message={state.errors.bank} />
            <label className={styles.label} htmlFor="card-nickname">
              Card name
            </label>
            <input
              id="card-nickname"
              name="nickname"
              className={styles.input}
              value={state.name}
              placeholder="Premier, Flipkart, Regalia..."
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="next"
              inputMode="text"
              aria-autocomplete="none"
              data-1p-ignore
              data-lpignore="true"
              data-bwignore="true"
              data-form-type="other"
              aria-invalid={Boolean(state.errors.name)}
              aria-describedby="card-nickname-hint card-nickname-error"
              onChange={(e) => dispatch({ type: 'set', field: 'name', value: e.target.value })}
            />
            <p id="card-nickname-hint" className={styles.hint}>
              The name of the card itself, not the bank.
            </p>
            <FieldError id="card-nickname-error" message={state.errors.name} />
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
            <details className={styles.customise}>
              <summary>Customise colour and pattern</summary>
              <TileStylePicker
                name="add"
                tone={state.tone}
                pattern={state.pattern}
                autoTone={nextTone}
                onTone={(tone) => dispatch({ type: 'setTone', tone })}
                onPattern={(pattern) => dispatch({ type: 'setPattern', pattern })}
              />
            </details>
            <p className={styles.soon}>Import from statement (coming soon)</p>
          </>
        ) : null}
        {state.step === 2 && (
          <>
            <h1 className={styles.title}>When is this bill generated?</h1>
            <label className={styles.label} htmlFor="card-statement">
              Statement date
            </label>
            <input
              id="card-statement"
              type="date"
              placeholder="Select statement date"
              data-empty={state.statementDate === ''}
              className={styles.input}
              value={state.statementDate}
              max={lastDayOfMonth(today)}
              aria-invalid={Boolean(state.errors.statementDate)}
              aria-describedby="card-statement-hint card-statement-error"
              onChange={(e) =>
                dispatch({ type: 'set', field: 'statementDate', value: e.target.value })
              }
            />
            <p id="card-statement-hint" className={styles.hint}>
              Your monthly cycle starts here. Bill not generated yet? Pick the date it will be
              generated this month. After you pay, the card waits in the paid deck and comes back as
              due on this date next month.
            </p>
            <FieldError id="card-statement-error" message={state.errors.statementDate} />
          </>
        )}
        {(state.step === 3 || state.step === 'saving') && (
          <>
            <h1 className={styles.title}>When is it due?</h1>
            <label className={styles.label} htmlFor="card-due">
              Payment due date (on the same bill)
            </label>
            <input
              id="card-due"
              type="date"
              placeholder="Select due date"
              data-empty={state.dueDate === ''}
              className={styles.input}
              value={state.dueDate}
              min={state.statementDate || today}
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
        <div className={`${styles.dock} ${styles.dockStatic}`}>
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
