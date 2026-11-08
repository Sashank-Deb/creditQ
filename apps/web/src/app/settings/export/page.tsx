import type { Metadata } from 'next';
import ExportScreen from '@/features/backup/ExportScreen';

export const metadata: Metadata = { title: 'Export data · CreditQ' };

export default function Page() {
  return <ExportScreen />;
}
