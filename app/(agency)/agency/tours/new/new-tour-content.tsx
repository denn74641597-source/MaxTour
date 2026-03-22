'use client';

import { TourForm } from '../tour-form';
import { useTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import type { TourLimitInfo } from '@/features/agencies/queries';

interface NewTourContentProps {
  tourLimit: TourLimitInfo;
}

export function NewTourContent({ tourLimit }: NewTourContentProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">{t.agencyTours.createNewTour}</h1>
          <p className="text-xs text-muted-foreground">
            {t.agencyTours.createNewTourHint}
          </p>
        </div>
      </div>

      {/* Tour Limit Info */}
      <div className={`mb-5 p-3 rounded-xl border text-sm ${tourLimit.canCreate ? 'bg-surface-container-low border-muted' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            {t.agencyTours.tourLimitLabel}: <strong>{tourLimit.currentTours}/{tourLimit.maxTours}</strong>
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {tourLimit.planName}
          </span>
        </div>
        {!tourLimit.canCreate && (
          <div className="flex items-center gap-2 mt-2 text-red-600">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="text-xs">{t.agencyTours.tourLimitReached}</span>
          </div>
        )}
      </div>

      {tourLimit.canCreate ? (
        <TourForm tourLimit={tourLimit} />
      ) : (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-tertiary mx-auto mb-3" />
          <h2 className="text-lg font-bold text-foreground mb-2">{t.agencyTours.tourLimitReachedTitle}</h2>
          <p className="text-sm text-muted-foreground">{t.agencyTours.tourLimitReachedHint}</p>
        </div>
      )}
    </div>
  );
}
