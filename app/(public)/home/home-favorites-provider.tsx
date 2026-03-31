'use client';

import { createContext, useContext } from 'react';
import { useFavorites } from '@/hooks/use-favorites';

interface HomeFavoritesContextValue {
  isFavorite: (tourId: string) => boolean;
  toggleFavorite: (tourId: string) => void;
}

const HomeFavoritesContext = createContext<HomeFavoritesContextValue | null>(null);

export function useHomeFavorites() {
  const ctx = useContext(HomeFavoritesContext);
  if (!ctx) throw new Error('useHomeFavorites must be used within HomeFavoritesProvider');
  return ctx;
}

export function HomeFavoritesProvider({ children }: { children: React.ReactNode }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  return (
    <HomeFavoritesContext.Provider value={{ isFavorite, toggleFavorite }}>
      {children}
    </HomeFavoritesContext.Provider>
  );
}
