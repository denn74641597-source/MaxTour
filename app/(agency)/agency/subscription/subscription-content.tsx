'use client';

import Image from 'next/image';
import { EmptyState } from '@/components/shared/empty-state';
import { useTranslation } from '@/lib/i18n';
import { Users, User } from 'lucide-react';
import { placeholderImage } from '@/lib/utils';

interface Follower {
  id: string;
  created_at: string;
  profile: { id: string; full_name: string | null; avatar_url: string | null; telegram_username: string | null }[] | null;
}

interface SubscriptionContentProps {
  followers: Follower[];
}

export function SubscriptionContent({ followers }: SubscriptionContentProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{t.subscriptionPage.title}</h1>
        <p className="text-sm text-muted-foreground">
          {t.subscriptionPage.subtitle}
        </p>
      </div>

      {/* Followers count */}
      <div className="bg-primary/5 rounded-2xl p-4 flex items-center gap-3 border border-primary/10">
        <div className="bg-primary/10 rounded-full p-2.5">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{followers.length}</p>
          <p className="text-xs text-muted-foreground">{t.subscriptionPage.totalFollowers}</p>
        </div>
      </div>

      {followers.length > 0 ? (
        <div className="bg-surface rounded-[1.5rem] shadow-ambient overflow-hidden divide-y divide-muted">
          {followers.map((f) => {
            const profile = Array.isArray(f.profile) ? f.profile[0] : f.profile;
            const name = profile?.full_name || t.subscriptionPage.anonymousUser;
            const avatar = profile?.avatar_url || placeholderImage(80, 80, name);
            const date = new Date(f.created_at).toLocaleDateString();

            return (
              <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted shrink-0">
                  {profile?.avatar_url ? (
                    <Image src={avatar} alt={name} fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10">
                      <User className="h-5 w-5 text-primary/60" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{name}</p>
                  {profile?.telegram_username && (
                    <p className="text-xs text-muted-foreground truncate">@{profile.telegram_username.replace('@', '')}</p>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground shrink-0">{date}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Users className="h-12 w-12 text-muted-foreground/50 mb-4" />}
          title={t.subscriptionPage.noFollowers}
          description={t.subscriptionPage.noFollowersHint}
        />
      )}
    </div>
  );
}
