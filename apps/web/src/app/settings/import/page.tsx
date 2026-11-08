import type { Metadata } from 'next';
import ImportScreen from '@/features/backup/ImportScreen';

export const metadata: Metadata = { title: 'Import data · CreditQ' };

export default function Page() {
  return <ImportScreen />;
}
