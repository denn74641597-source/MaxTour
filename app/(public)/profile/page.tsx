'use client';

import { useProfile } from '@/hooks';
import { AuthScreen } from './auth-screen';
import { UserProfileView } from './user-profile-view';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in → show auth/registration screen
  if (!profile) {
    return <AuthScreen />;
  }

  // Logged in → show profile view based on role
  return <UserProfileView profile={profile} />;
}
