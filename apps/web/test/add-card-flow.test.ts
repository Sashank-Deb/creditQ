import { describe, expect, it } from 'vitest';
import {
  addCardReducer,
  initialAddCard,
  reminderPreview,
} from '../src/features/add-card/add-card-flow';

const today = '2026-02-26';
const run = (...actions: Parameters<typeof addCardReducer>[1][]) =>
  actions.reduce(addCardReducer, initialAddCard(today));

describe('add-card flow (3 steps, one question each)', () => {
  it('starts on step 1 with nothing filled', () => {
    expect(initialAddCard(today)).toMatchObject({
      step: 1,
      bank: '',
      name: '',
      last4: '',
      dueDate: '',
      statementDate: '',
      tone: null,
      pattern: 'diamonds',
    });
  });

  it('keeps bank and card name as two separate fields', () => {
    const s = run(
      { type: 'pickBank', bank: 'HSBC' },
      { type: 'set', field: 'name', value: 'Premier' },
    );
    expect(s).toMatchObject({ bank: 'HSBC', name: 'Premier', otherBank: false });
  });

  it('"Other" lets the user type their own bank', () => {
    const s = run(
      { type: 'pickBank', bank: 'Other' },
      { type: 'set', field: 'bank', value: 'Jupiter' },
    );
    expect(s).toMatchObject({ otherBank: true, bank: 'Jupiter' });
    expect(run({ type: 'pickBank', bank: 'Other' }).bank).toBe('');
  });

  it('lets the user choose a colour and a pattern, or leave both automatic', () => {
    const s = run({ type: 'setTone', tone: 'burgundy' }, { type: 'setPattern', pattern: 'rings' });
    expect(s).toMatchObject({ tone: 'burgundy', pattern: 'rings' });
  });

  it('blocks step 1 until bank, name and digits are valid, with inline errors', () => {
    const s = run({ type: 'set', field: 'name', value: 'Flipkart' }, { type: 'next' });
    expect(s.step).toBe(1);
    expect(s.errors).toEqual({
      bank: 'Choose your bank',
      last4: 'Enter the last 4 digits',
    });
  });

  it('clears a field error as soon as the user edits that field', () => {
    const s = run({ type: 'next' }, { type: 'set', field: 'last4', value: '9' });
    expect(s.errors.last4).toBeUndefined();
    expect(s.errors.name).toBe('Enter a name for this card');
    expect(run({ type: 'next' }, { type: 'pickBank', bank: 'HSBC' }).errors.bank).toBeUndefined();
  });

  it('keeps only digits in last 4 and caps at 4 characters', () => {
    expect(run({ type: 'set', field: 'last4', value: '90a33x7' }).last4).toBe('9033');
  });

  it('asks the due date on step 2, then the statement date on step 3, before saving', () => {
    const s1 = run(
      { type: 'pickBank', bank: 'Axis Bank' },
      { type: 'set', field: 'name', value: 'Flipkart' },
      { type: 'set', field: 'last4', value: '9033' },
      { type: 'next' },
    );
    expect(s1.step).toBe(2);
    const pastDue = addCardReducer(
      addCardReducer(s1, { type: 'set', field: 'dueDate', value: '2026-02-20' }),
      { type: 'next' },
    );
    expect(pastDue).toMatchObject({
      step: 2,
      errors: { dueDate: 'That date has passed. Enter your next due date.' },
    });
    const s2 = addCardReducer(
      addCardReducer(s1, { type: 'set', field: 'dueDate', value: '2026-03-10' }),
      { type: 'next' },
    );
    expect(s2.step).toBe(3);
    const badStatement = addCardReducer(
      addCardReducer(s2, { type: 'set', field: 'statementDate', value: '2026-03-12' }),
      { type: 'next' },
    );
    expect(badStatement).toMatchObject({
      step: 3,
      errors: { statementDate: 'The bill is generated before it is due. Check the dates.' },
    });
    const ok = addCardReducer(
      addCardReducer(s2, { type: 'set', field: 'statementDate', value: '2026-02-18' }),
      { type: 'next' },
    );
    expect(ok).toMatchObject({ step: 'saving', errors: {} });
  });

  it('back from step 3 returns to step 2 with the dates kept', () => {
    const s = run(
      { type: 'pickBank', bank: 'SBI Card' },
      { type: 'set', field: 'name', value: 'Cashback' },
      { type: 'set', field: 'last4', value: '1207' },
      { type: 'next' },
      { type: 'set', field: 'dueDate', value: '2026-03-10' },
      { type: 'next' },
      { type: 'back' },
    );
    expect(s).toMatchObject({ step: 2, dueDate: '2026-03-10' });
  });

  it('back from step 2 keeps what was typed', () => {
    const s = run(
      { type: 'pickBank', bank: 'SBI Card' },
      { type: 'set', field: 'name', value: 'Cashback' },
      { type: 'set', field: 'last4', value: '1207' },
      { type: 'next' },
      { type: 'back' },
    );
    expect(s).toMatchObject({ step: 1, bank: 'SBI Card', name: 'Cashback', last4: '1207' });
  });
});

describe('reminderPreview', () => {
  it('explains the grouped pay day without any amount', () => {
    const p = reminderPreview(today, ['2026-03-08', '2026-03-10', '2026-03-12'], '9:00 am');
    expect(p).toEqual({
      headline: 'Pay day: Tue, 3 Mar',
      detail:
        '5 days before your earliest due date. One reminder for all 3 cards, then a nudge 2 days before and on the due day if unpaid.',
      notification: 'Pay day: 3 card bills. Due 8, 10 and 12 Mar. Tap to open.',
    });
  });

  it('reads naturally for a single card', () => {
    const p = reminderPreview(today, ['2026-03-10'], '9:00 am');
    expect(p.headline).toBe('Pay day: Thu, 5 Mar');
    expect(p.notification).toBe('Pay day: 1 card bill. Due 10 Mar. Tap to open.');
  });
});
