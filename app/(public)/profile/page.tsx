'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/hooks';
import { AuthScreen } from './auth-screen';
import { UserProfileView } from './user-profile-view';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { profile, loading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile?.role === 'agency_manager') {
      router.replace('/agency');
    }
  }, [loading, profile, router]);

  if (loading || (profile?.role === 'agency_manager')) {
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
