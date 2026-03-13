'use client';

import { useFavorites } from '@/hooks/use-favorites';
import { TourCard } from '@/components/shared/tour-card';
import { EmptyState } from '@/components/shared/empty-state';
import { TourListSkeleton } from '@/components/shared/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export default function FavoritesPage() {
  const { favorites, loading } = useFavorites();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="px-4 py-4">
        <h1 className="text-lg font-bold mb-4">{t.favorites.title}</h1>
        <TourListSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <h1 className="text-lg font-bold">{t.favorites.title}</h1>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {favorites.map((fav) =>
            fav.tour ? <TourCard key={fav.id} tour={fav.tour} /> : null
          )}
        </div>
      ) : (
        <EmptyState
          icon={<Heart className="h-12 w-12 text-muted-foreground/50 mb-4" />}
          title={t.favorites.empty}
          description={t.favorites.emptyHint}
          action={
            <Link href="/tours">
              <Button size="sm">{t.favorites.browseTours}</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
