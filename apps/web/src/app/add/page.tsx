import type { Metadata } from 'next';
import AddCardScreen from '@/features/add-card/AddCardScreen';

export const metadata: Metadata = { title: 'Add a card · CreditQ' };

export default function Page() {
  return <AddCardScreen />;
}
