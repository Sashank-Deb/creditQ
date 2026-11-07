import type { Metadata } from 'next';
import SettingsScreen from '@/features/settings/SettingsScreen';

export const metadata: Metadata = { title: 'Settings · CreditQ' };

export default function Page() {
  return <SettingsScreen />;
}
