import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/features/auth/helpers';
import { getNotificationPreferences } from '@/features/notifications/queries';
import { NotificationsContent } from './notifications-content';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/profile');
  const prefs = await getNotificationPreferences(profile.id);
  return <NotificationsContent initialPreferences={prefs} role={profile.role} />;
}
