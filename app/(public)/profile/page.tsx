'use client';

import { useProfile } from '@/hooks';
import { AuthScreen } from './auth-screen';
import { UserProfileView } from './user-profile-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2, Mail, ShieldAlert } from 'lucide-react';

export default function ProfilePage() {
  const {
    profile,
    loading,
    pendingDeletion,
    acknowledgePendingDeletion,
    sessionExpired,
    error,
  } = useProfile();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (pendingDeletion) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Card className="market-subtle-border rounded-3xl border-none shadow-[0_28px_54px_-36px_rgba(15,23,42,0.55)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Account deletion request is in review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm text-muted-foreground">
            <p>
              Your account has an active deletion request. Access stays blocked
              until an administrator reviews it.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a href="mailto:support@maxtour.uz?subject=Account%20Recovery%20Request">
                <Button className="gap-2">
                  <Mail className="h-4 w-4" />
                  Contact support
                </Button>
              </a>
              <Button variant="outline" onClick={acknowledgePendingDeletion}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        {sessionExpired && (
          <div className="mx-auto max-w-4xl px-4 pt-4">
            <Card className="rounded-2xl border-amber-200 bg-amber-50/80">
              <CardContent className="flex items-start gap-3 p-4 text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-sm">
                  Your session expired. Please sign in again to access your
                  profile.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        {error && (
          <div className="mx-auto max-w-4xl px-4">
            <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
              <CardContent className="p-4 text-sm text-destructive">
                {error}
              </CardContent>
            </Card>
          </div>
        )}
        <AuthScreen />
      </div>
    );
  }

  return <UserProfileView profile={profile} />;
}
