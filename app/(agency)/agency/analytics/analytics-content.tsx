'use client';

import { EmptyState } from '@/components/shared/empty-state';
import { useTranslation } from '@/lib/i18n';
import { BarChart3, Heart, Phone, Send, Users } from 'lucide-react';

interface TourAnalyticsRow {
  tour: { id: string; title: string; slug: string; country: string; city: string | null };
  interests: number;
  calls: number;
  telegram: number;
}

interface AnalyticsContentProps {
  analytics: TourAnalyticsRow[];
  totalRequests: number;
}

export function AnalyticsContent({ analytics, totalRequests }: AnalyticsContentProps) {
  const { t } = useTranslation();

  const totals = analytics.reduce(
    (acc, row) => ({
      interests: acc.interests + row.interests,
      calls: acc.calls + row.calls,
      telegram: acc.telegram + row.telegram,
    }),
    { interests: 0, calls: 0, telegram: 0 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{t.analytics.title}</h1>
        <p className="text-sm text-muted-foreground">{t.analytics.subtitle}</p>
      </div>

      {analytics.length > 0 ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-sky-50 rounded-2xl p-4 text-center border border-sky-100">
              <Users className="h-5 w-5 text-sky-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-sky-600">{totalRequests}</p>
              <p className="text-[10px] text-sky-400 font-medium uppercase tracking-wider">{t.leadsPage.title}</p>
            </div>
            <div className="bg-pink-50 rounded-2xl p-4 text-center border border-pink-100">
              <Heart className="h-5 w-5 text-pink-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-pink-600">{totals.interests}</p>
              <p className="text-[10px] text-pink-400 font-medium uppercase tracking-wider">{t.analytics.interests}</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-4 text-center border border-emerald-100">
              <Phone className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-emerald-600">{totals.calls}</p>
              <p className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">{t.analytics.calls}</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-4 text-center border border-blue-100">
              <Send className="h-5 w-5 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-600">{totals.telegram}</p>
              <p className="text-[10px] text-blue-400 font-medium uppercase tracking-wider">{t.analytics.telegram}</p>
            </div>
          </div>

          {/* Per-tour table */}
          <div className="bg-surface rounded-[1.5rem] shadow-ambient overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-4 py-3 bg-surface-container-low text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>{t.analytics.tourName}</span>
              <span className="text-center w-12"><Heart className="h-3.5 w-3.5 text-pink-400 mx-auto" /></span>
              <span className="text-center w-12"><Phone className="h-3.5 w-3.5 text-emerald-400 mx-auto" /></span>
              <span className="text-center w-12"><Send className="h-3.5 w-3.5 text-blue-400 mx-auto" /></span>
            </div>
            {analytics.map((row) => (
              <div
                key={row.tour.id}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-4 py-3 border-b border-muted last:border-0 items-center"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{row.tour.title}</p>
                  <p className="text-xs text-muted-foreground">{row.tour.city ? `${row.tour.city}, ` : ''}{row.tour.country}</p>
                </div>
                <span className="text-center w-12 text-sm font-bold text-pink-500">{row.interests}</span>
                <span className="text-center w-12 text-sm font-bold text-emerald-500">{row.calls}</span>
                <span className="text-center w-12 text-sm font-bold text-blue-500">{row.telegram}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={<BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />}
          title={t.analytics.noData}
          description={t.analytics.noDataHint}
        />
      )}
    </div>
  );
}
