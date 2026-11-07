import type { Metadata } from 'next';
import CardScreen from '@/features/card/CardScreen';

export const metadata: Metadata = { title: 'Card · CreditQ' };

export default function Page() {
  return <CardScreen />;
}
