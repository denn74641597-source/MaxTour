'use client';

import Image from 'next/image';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { useTranslation } from '@/lib/i18n';
import { Users, Building2 } from 'lucide-react';
import { placeholderImage } from '@/lib/utils';

interface FollowedAgency {
  id: string;
  created_at: string;
  agency: { id: string; name: string; slug: string; logo_url: string | null; description: string | null }[] | null;
}

interface SubscriptionContentProps {
  followedAgencies: FollowedAgency[];
}

export function SubscriptionContent({ followedAgencies }: SubscriptionContentProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{t.subscriptionPage.title}</h1>
        <p className="text-sm text-muted-foreground">
          {t.subscriptionPage.subtitle}
        </p>
      </div>

      {/* Count */}
      <div className="bg-primary/5 rounded-2xl p-4 flex items-center gap-3 border border-primary/10">
        <div className="bg-primary/10 rounded-full p-2.5">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{followedAgencies.length}</p>
          <p className="text-xs text-muted-foreground">{t.subscriptionPage.totalFollowing}</p>
        </div>
      </div>

      {followedAgencies.length > 0 ? (
        <div className="bg-surface rounded-[1.5rem] shadow-ambient overflow-hidden divide-y divide-muted">
          {followedAgencies.map((f) => {
            const agency = Array.isArray(f.agency) ? f.agency[0] : f.agency;
            if (!agency) return null;
            const logo = agency.logo_url || placeholderImage(80, 80, agency.name);
            const date = new Date(f.created_at).toLocaleDateString();

            return (
              <Link
                key={f.id}
                href={`/agencies/${agency.slug}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted shrink-0">
                  {agency.logo_url ? (
                    <Image src={logo} alt={agency.name} fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary/60" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{agency.name}</p>
                  {agency.description && (
                    <p className="text-xs text-muted-foreground truncate">{agency.description}</p>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground shrink-0">{date}</p>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Users className="h-12 w-12 text-muted-foreground/50 mb-4" />}
          title={t.subscriptionPage.noFollowing}
          description={t.subscriptionPage.noFollowingHint}
        />
      )}
    </div>
  );
}
