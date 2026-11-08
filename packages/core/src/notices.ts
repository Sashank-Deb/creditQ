/**
 * Reminder delivery content (design doc 04): one notice per date, rendered once and then
 * projected into notifications, the in-app banner and the .ics calendar file.
 * Text templates have no amount placeholder, so no amount can ever leak into a reminder.
 */
import { compareDates, fromDayNumber, toDayNumber, type CivilDate } from './civil-date';
import { formatShortDate } from './format';
import type { ReminderEvent, ReminderKind } from './reminders';

/** `minimal` (default) keeps card names out of notifications and calendars that sync to clouds. */
export type ContentLevel = 'minimal' | 'cards';

export interface CardLabel {
  name: string;
  last4: string;
}

export interface Notice {
  itemId: string;
  date: CivilDate;
  /** India time, 'HH:MM'. */
  time: string;
  /** UTC epoch milliseconds. */
  fireAt: number;
  title: string;
  body: string;
  /** Notification tag: a newer notice for the same day replaces the older one. */
  tag: string;
  billIds: string[];
  kinds: ReminderKind[];
}

export interface NoticeOptions {
  dueDates: ReadonlyMap<string, CivilDate>;
  labels?: ReadonlyMap<string, CardLabel>;
  contentLevel?: ContentLevel;
  time?: string;
}

const MS_PER_DAY = 86_400_000;
const IST_OFFSET_MS = 19_800_000; // UTC+05:30, no daylight saving.

/** A civil date plus 'HH:MM' in India, as a UTC instant. */
export const istInstant = (date: CivilDate, time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return toDayNumber(date) * MS_PER_DAY + ((h ?? 0) * 60 + (m ?? 0)) * 60_000 - IST_OFFSET_MS;
};

const pad2 = (n: number) => String(n).padStart(2, '0');

/** 'YYYYMMDDTHHMMSSZ' for a UTC instant, without `Date`. */
export const formatUtcStamp = (ms: number): string => {
  const day = Math.floor(ms / MS_PER_DAY);
  const rest = Math.floor((ms - day * MS_PER_DAY) / 1000);
  const ymd = fromDayNumber(day).replaceAll('-', '');
  return `${ymd}T${pad2(Math.floor(rest / 3600))}${pad2(Math.floor((rest % 3600) / 60))}${pad2(rest % 60)}Z`;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const joinAnd = (items: string[]): string =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;

/** "8, 10 and 12 Mar" within one month, "28 Feb and 2 Mar" across months. */
export const formatDueList = (dates: readonly CivilDate[]): string => {
  const sorted = [...new Set(dates)].sort(compareDates);
  const month = (d: CivilDate) => MONTHS[Number(d.slice(5, 7)) - 1] ?? '';
  const day = (d: CivilDate) => String(Number(d.slice(8, 10)));
  const first = sorted[0] ?? '';
  return sorted.every((d) => d.slice(0, 7) === first.slice(0, 7))
    ? `${joinAnd(sorted.map(day))} ${month(first)}`
    : joinAnd(sorted.map((d) => `${day(d)} ${month(d)}`));
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// FNV-1a, twice with different seeds: a short, stable id without crypto or randomness.
/* eslint-disable no-bitwise -- hashing is bit arithmetic by definition */
const fnv = (text: string, seed: number): string => {
  let h = seed;
  for (let i = 0; i < text.length; i += 1) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
};
/* eslint-enable no-bitwise */
const stableId = (text: string) => fnv(text, 2166136261) + fnv(text, 33554467);

export const buildNotices = (
  events: readonly ReminderEvent[],
  options: NoticeOptions,
): Notice[] => {
  const time = options.time ?? '09:00';
  const level = options.contentLevel ?? 'minimal';
  const due = (id: string) => options.dueDates.get(id) ?? '';

  return events.map((event) => {
    const parts: string[] = [];
    const payDay = event.items.filter((i) => i.kind === 'pay-day').flatMap((i) => i.billIds);
    if (payDay.length > 0)
      parts.push(`Pay day: ${plural(payDay.length, 'card bill', 'card bills')}`);
    const dueToday = event.items.filter((i) => i.kind === 'due-today').flatMap((i) => i.billIds);
    if (dueToday.length > 0) parts.push(`${plural(dueToday.length, 'bill', 'bills')} due today`);
    const billIds = [...new Set(event.items.flatMap((i) => i.billIds))].sort(
      (a, b) => compareDates(due(a), due(b)) || a.localeCompare(b),
    );
    const names =
      level === 'cards' && options.labels
        ? `${billIds
            .map((id) => options.labels?.get(id))
            .filter((l): l is CardLabel => Boolean(l))
            .map((l) => `${l.name} ••${l.last4}`)
            .join(', ')}. `
        : '';
    const kinds = [...new Set(event.items.map((i) => i.kind))];
    return {
      itemId: stableId(`${event.date}|${time}|${kinds.join(',')}|${billIds.join(',')}`),
      date: event.date,
      time,
      fireAt: istInstant(event.date, time),
      title: parts.join(', '),
      body: `${names}Due ${formatDueList(billIds.map(due))}. Tap to open. Ignore if already paid.`,
      tag: `creditq-${event.date}`,
      billIds,
      kinds,
    };
  });
};

// ---------- .ics (RFC 5545) ----------

const escapeText = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

const utf8Length = (ch: string): number => {
  const c = ch.codePointAt(0) ?? 0;
  if (c < 0x80) return 1;
  if (c < 0x800) return 2;
  return c < 0x10000 ? 3 : 4;
};

/** Fold to 75 octets per line, never splitting a multi-byte character. */
const fold = (line: string): string[] => {
  const out: string[] = [];
  let current = '';
  let octets = 0;
  for (const ch of line) {
    const len = utf8Length(ch);
    const limit = out.length === 0 ? 75 : 74; // continuation lines start with a space
    if (octets + len > limit) {
      out.push(out.length === 0 ? current : ` ${current}`);
      current = '';
      octets = 0;
    }
    current += ch;
    octets += len;
  }
  out.push(out.length === 0 ? current : ` ${current}`);
  return out;
};

export interface IcsOptions {
  /** Plan creation time (not export time), so re-exports are stable. */
  dtstamp: number;
  uidDomain?: string;
  /** Alarm offsets in minutes before the reminder; default: at the reminder time. */
  alarmsMinutesBefore?: number[];
  calendarName?: string;
}

export const toIcs = (notices: readonly Notice[], options: IcsOptions): string => {
  const domain = options.uidDomain ?? 'creditq.invalid';
  const alarms = options.alarmsMinutesBefore ?? [0];
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CreditQ//reminders 1//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(options.calendarName ?? 'CreditQ reminders')}`,
  ];
  for (const n of notices) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${n.itemId}@${domain}`,
      `DTSTAMP:${formatUtcStamp(options.dtstamp)}`,
      `DTSTART:${formatUtcStamp(n.fireAt)}`,
      'DURATION:PT15M',
      `SUMMARY:${escapeText(n.title)}`,
      `DESCRIPTION:${escapeText(n.body)}`,
    );
    for (const minutes of alarms) {
      lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeText(n.title)}`,
        `TRIGGER:${minutes === 0 ? 'PT0S' : `-PT${minutes}M`}`,
        'END:VALARM',
      );
    }
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return `${lines.flatMap(fold).join('\r\n')}\r\n`;
};

/** One-tap Google Calendar link. Google applies the user's default notification. */
export const googleCalendarUrl = (n: Notice): string => {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: n.title,
    dates: `${formatUtcStamp(n.fireAt)}/${formatUtcStamp(n.fireAt + 15 * 60_000)}`,
    details: n.body,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// ---------- pay-day calendar file: full-day events, one per pay day ----------

export interface PayDayCard {
  name: string;
  last4: string;
  dueDate: CivilDate;
}

export interface PayDayEvent {
  date: CivilDate;
  cards: PayDayCard[];
}

export interface PayDayIcsOptions {
  dtstamp: number;
  /** India time 'HH:MM' for the alert on the day. */
  time?: string;
  uidDomain?: string;
  calendarName?: string;
}

const ymd = (d: CivilDate): string => d.replaceAll('-', '');

/**
 * Calendar file for pay days only. Each event is a full-day entry that lists the cards to pay
 * and their due dates, and rings at the reminder time. Due dates get no event of their own.
 */
export const toPayDayIcs = (events: readonly PayDayEvent[], options: PayDayIcsOptions): string => {
  const domain = options.uidDomain ?? 'creditq.invalid';
  const [h, m] = (options.time ?? '09:00').split(':').map(Number);
  const trigger = `PT${h ?? 9}H${m ? `${m}M` : ''}`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CreditQ//pay days 1//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(options.calendarName ?? 'CreditQ pay days')}`,
  ];
  for (const e of events) {
    const cards = [...e.cards].sort(
      (a, b) => compareDates(a.dueDate, b.dueDate) || a.name.localeCompare(b.name),
    );
    const title = `Pay day: ${plural(cards.length, 'credit card bill', 'credit card bills')}`;
    const body = [
      'Pay these card bills today:',
      ...cards.map((c) => `• ${c.name} ••${c.last4}, due ${formatShortDate(c.dueDate)}`),
      '',
      'Ignore any you have already paid.',
    ].join('\n');
    const id = stableId(
      `${e.date}|${cards.map((c) => `${c.name}${c.last4}${c.dueDate}`).join(',')}`,
    );
    lines.push(
      'BEGIN:VEVENT',
      `UID:${id}@${domain}`,
      `DTSTAMP:${formatUtcStamp(options.dtstamp)}`,
      `DTSTART;VALUE=DATE:${ymd(e.date)}`,
      `DTEND;VALUE=DATE:${ymd(fromDayNumber(toDayNumber(e.date) + 1))}`,
      `SUMMARY:${escapeText(title)}`,
      `DESCRIPTION:${escapeText(body)}`,
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(title)}`,
      `TRIGGER:${trigger}`,
      'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return `${lines.flatMap(fold).join('\r\n')}\r\n`;
};
