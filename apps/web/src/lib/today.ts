import type { CivilDate } from '@creditq/core';

/** Today's civil date in India, whatever the device time zone. The only clock read in the app. */
export const todayInIndia = (now: Date = new Date()): CivilDate =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
