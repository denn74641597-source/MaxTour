'use client';

import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { formatDate } from '@/lib/utils';
import { Phone, MessageCircle, Heart, UserCheck } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import type { TourInterest } from '@/types';

interface InterestsContentProps {
  interests: TourInterest[];
}

export function InterestsContent({ interests }: InterestsContentProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">{t.interestsPage.title}</h1>
        <p className="text-sm text-muted-foreground">{t.interestsPage.subtitle}</p>
      </div>

      {interests.length > 0 ? (
        <div className="space-y-3">
          {interests.map((interest) => {
            const profile = interest.profile as any;
            const tour = interest.tour as any;
            const name = profile?.full_name || interest.full_name || '—';
            const phone = profile?.phone || interest.phone;
            const telegram = profile?.telegram_username || interest.telegram_username;

            return (
              <Card key={interest.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {t.interestsPage.interestedIn}: <span className="font-medium text-primary">{tour?.title ?? 'Tour'}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(interest.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-pink-500 bg-pink-50 px-2 py-1 rounded-full">
                      <Heart className="h-3 w-3 fill-pink-500" />
                      {t.interestsPage.sourceFavorite}
                    </div>
                  </div>

                  {/* Contact Actions */}
                  <div className="flex gap-2">
                    {phone && (
                      <a
                        href={`tel:${phone}`}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl py-2.5 text-sm font-medium transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                        {phone}
                      </a>
                    )}
                    {telegram && (
                      <a
                        href={`https://t.me/${telegram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl py-2.5 text-sm font-medium transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Telegram
                      </a>
                    )}
                  </div>

                  {!phone && !telegram && (
                    <p className="text-xs text-muted-foreground italic">
                      Kontakt ma'lumotlari mavjud emas
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<UserCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />}
          title={t.interestsPage.noInterests}
          description={t.interestsPage.noInterestsHint}
        />
      )}
    </div>
  );
}
