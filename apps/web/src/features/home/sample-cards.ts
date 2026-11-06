import { addDays, type CivilDate } from '@creditq/core';
import type { CardRecord } from './home-view';

/** Demo data until the encrypted on-device vault lands (roadmap M1). All fake. */
export const sampleCards = (today: CivilDate): CardRecord[] => [
  {
    id: 'hdfc',
    name: 'HDFC Regalia',
    last4: '4821',
    holder: 'Meera Iyer',
    dueDate: addDays(today, 9),
    tone: 'forest',
  },
  {
    id: 'axis',
    name: 'Axis Flipkart',
    last4: '9033',
    holder: 'Meera Iyer',
    dueDate: addDays(today, 11),
    tone: 'terracotta',
  },
  {
    id: 'sbi',
    name: 'SBI Cashback',
    last4: '1207',
    holder: 'Meera Iyer',
    dueDate: addDays(today, 13),
    tone: 'sand',
  },
];
