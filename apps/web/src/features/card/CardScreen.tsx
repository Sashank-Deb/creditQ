'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useSyncExternalStore } from 'react';
import { detectIssuer, formatShortDate, listBanks } from '@creditq/core';
import type { Bill, Card, Payment, TilePattern, TileTone } from '@creditq/vault';
import BackButton from '@/components/BackButton';
import CardTile from '@/components/CardTile';
import TileStylePicker from '@/components/TileStylePicker';
import { useTodayInIndia, useVaultAction, useVaultData } from '@/lib/vault-client';
import { removalWarning, validateCardForm, type CardForm } from './card-form';
import styles from './CardScreen.module.scss';

const noSubscribe = () => () => {};
const readId = () => new URLSearchParams(window.location.search).get('id');

type Errors = Partial<Record<keyof CardForm, string>>;

function Editor({
  card,
  bill,
  payments,
  today,
}: {
  card: Card;
  bill: Bill | undefined;
  payments: Payment[];
  today: string;
}) {
  const router = useRouter();
  const act = useVaultAction();
  const confirmRef = useRef<HTMLDialogElement>(null);
  const banks = listBanks();
  const initialBank = card.bank ?? detectIssuer(card.name).bank;
  const [otherBank, setOtherBank] = useState(initialBank !== '' && !banks.includes(initialBank));
  const [tone, setTone] = useState<TileTone>(card.tone);
  const [pattern, setPattern] = useState<TilePattern>(card.pattern ?? 'diamonds');
  const [form, setForm] = useState<CardForm>({
    bank: initialBank,
    name: card.name,
    last4: card.last4,
    dueDate: bill?.dueDate ?? '',
    statementDate: bill?.statementDate ?? '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState(false);

  const set = (field: keyof CardForm, value: string) => {
    const clean = field === 'last4' ? value.replace(/\D/g, '').slice(0, 4) : value;
    setForm((f) => ({ ...f, [field]: clean }));
    setErrors(({ [field]: dropped, ...rest }) => rest);
    setSaved(false);
  };

  const save = async () => {
    const r = validateCardForm(form, today);
    if (!r.ok) {
      setErrors(r.errors);
      return;
    }
    try {
      const { statementDate, ...rest } = r.value;
      const input = { ...rest, tone, pattern };
      await act((v) => v.updateCard(card.id, statementDate ? { ...input, statementDate } : input));
      setSaved(true);
    } catch (e) {
      setErrors({ dueDate: (e as Error).message });
    }
  };

  const remove = async () => {
    confirmRef.current?.close();
    await act((v) => v.removeCard(card.id));
    router.push('/');
  };

  const field = (
    id: keyof CardForm,
    label: string,
    input: Record<string, unknown>,
    hint?: string,
  ) => (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={`edit-${id}`}>
        {label}
      </label>
      <input
        id={`edit-${id}`}
        className={styles.input}
        value={form[id]}
        data-empty={form[id] === ''}
        aria-invalid={Boolean(errors[id])}
        aria-describedby={`edit-${id}-msg`}
        onChange={(e) => set(id, e.target.value)}
        {...input}
      />
      <p id={`edit-${id}-msg`} className={errors[id] ? styles.error : styles.hint}>
        {errors[id] ?? hint}
      </p>
    </div>
  );

  return (
    <main className={styles.screen}>
      <header className={styles.topBar}>
        <BackButton href="/" />
      </header>

      <CardTile
        name={form.name.trim()}
        last4={form.last4}
        tone={tone}
        pattern={pattern}
        issuer={detectIssuer(form.bank || card.name)}
        dueLabel={form.dueDate ? `Due ${formatShortDate(form.dueDate)}` : 'Due date'}
      />

      <form
        className={styles.form}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <h1 className={styles.title}>Edit card</h1>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="edit-bank">
            Bank
          </label>
          <select
            id="edit-bank"
            className={styles.input}
            value={otherBank ? 'Other' : form.bank}
            aria-invalid={Boolean(errors.bank)}
            aria-describedby="edit-bank-msg"
            onChange={(e) => {
              if (e.target.value === 'Other') {
                setOtherBank(true);
                set('bank', '');
              } else {
                setOtherBank(false);
                set('bank', e.target.value);
              }
            }}
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
          {otherBank && (
            <input
              className={styles.input}
              value={form.bank}
              placeholder="Bank name"
              autoComplete="off"
              aria-label="Bank name"
              aria-invalid={Boolean(errors.bank)}
              aria-describedby="edit-bank-msg"
              onChange={(e) => set('bank', e.target.value)}
            />
          )}
          <p id="edit-bank-msg" className={errors.bank ? styles.error : styles.hint}>
            {errors.bank}
          </p>
        </div>
        {field('name', 'Card name', { autoComplete: 'off' }, 'The name of the card, not the bank.')}
        {field(
          'last4',
          'Last 4 digits',
          { inputMode: 'numeric', autoComplete: 'off' },
          'Only the last 4. We never ask for your full card number.',
        )}
        {field(
          'statementDate',
          'Statement date',
          { type: 'date', placeholder: 'Select statement date', max: form.dueDate || undefined },
          'When the bill is generated. The card comes back as due from this date each month.',
        )}
        {field(
          'dueDate',
          bill?.status === 'paid' ? 'Next due date' : 'Due date',
          { type: 'date', placeholder: 'Select due date', min: today },
          'Repeats every month on this day.',
        )}
        <div className={styles.field}>
          <p className={styles.label}>Card look</p>
          <TileStylePicker
            name="edit"
            tone={tone}
            pattern={pattern}
            autoTone={card.tone}
            onTone={(t) => {
              setTone(t ?? card.tone);
              setSaved(false);
            }}
            onPattern={(p) => {
              setPattern(p);
              setSaved(false);
            }}
          />
        </div>
        <div className={styles.dock}>
          {saved && (
            <p className={styles.saved} role="status">
              Saved
            </p>
          )}
          <button type="submit" className={styles.btnPrimary}>
            Save changes
          </button>
        </div>
      </form>

      <section className={styles.danger} aria-labelledby="remove-heading">
        <h2 id="remove-heading" className={styles.dangerTitle}>
          Remove this card
        </h2>
        <p className={styles.hint}>Stops its reminders and deletes its data from this device.</p>
        <button
          type="button"
          className={styles.btnDanger}
          onClick={() => confirmRef.current?.showModal()}
        >
          Remove card
        </button>
      </section>

      <dialog ref={confirmRef} className={styles.confirm} aria-labelledby="remove-confirm">
        <div className={styles.cautionIcon} aria-hidden="true">
          !
        </div>
        <h2 id="remove-confirm" className={styles.dangerTitle}>
          Remove {card.name}?
        </h2>
        <p className={styles.confirmText}>
          {removalWarning(
            card,
            payments.map((p) => p.amountPaise),
          )}{' '}
          Reminders already in your calendar stay there until you export again.
        </p>
        <div className={styles.confirmActions}>
          <button type="button" className={styles.btnDanger} onClick={remove}>
            Remove card
          </button>
          <button
            type="button"
            className={styles.btnText}
            onClick={() => confirmRef.current?.close()}
          >
            Keep card
          </button>
        </div>
      </dialog>
    </main>
  );
}

export default function CardScreen() {
  const id = useSyncExternalStore(noSubscribe, readId, () => null);
  const today = useTodayInIndia();
  const { data } = useVaultData();
  if (!data || !today) return <main className={styles.screen} aria-busy="true" />;

  const card = data.cards.find((c) => c.id === id);
  if (!card) {
    return (
      <main className={styles.screen}>
        <header className={styles.topBar}>
          <BackButton href="/" />
        </header>
        <p className={styles.hint}>This card is not on this device anymore.</p>
      </main>
    );
  }
  const bills = data.bills.filter((b) => b.cardId === card.id);
  const bill = bills.find((b) => b.status === 'open') ?? bills.at(-1);
  return (
    <Editor
      key={card.id}
      card={card}
      bill={bill}
      payments={data.payments.filter((p) => p.cardId === card.id)}
      today={today}
    />
  );
}
