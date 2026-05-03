'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  /** 'hero' = large white (home page), 'compact' = smaller slate bg (catalog) */
  variant?: 'hero' | 'compact';
}

export function SearchBar({
  placeholder,
  className,
  variant = 'hero',
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get('q') ?? '');
  const { t } = useTranslation();

  const displayPlaceholder = placeholder ?? t.home.searchPlaceholder;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim()) {
      router.push(`/tours?q=${encodeURIComponent(value.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={className} role="search" aria-label="Tour qidirish">
      <div
        className={cn(
          'group relative flex items-center transition-all',
          variant === 'hero'
            ? 'market-subtle-border market-glass rounded-2xl bg-white/82 shadow-[0_24px_42px_-30px_rgba(15,23,42,0.55)] focus-within:ring-2 focus-within:ring-primary/20'
            : 'market-subtle-border rounded-xl bg-white/90 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.45)]',
        )}
      >
        <div className={cn(
          'absolute inset-y-0 left-3 flex items-center pointer-events-none',
          variant === 'hero' && 'left-5'
        )}>
          <Search className={cn(
            'text-muted-foreground group-focus-within:text-primary transition-colors',
            variant === 'hero' ? 'h-5 w-5' : 'h-4 w-4'
          )} />
        </div>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={displayPlaceholder}
          className={cn(
            'w-full border-none bg-transparent focus:ring-0 placeholder:text-muted-foreground text-foreground transition-all outline-none',
            variant === 'hero'
              ? 'h-14 pl-13 pr-14 text-[15px] font-medium'
              : 'h-11 py-2.5 pl-10 pr-4 text-sm font-medium'
          )}
          type="text"
          aria-label={displayPlaceholder}
        />
        {variant === 'hero' && (
          <button
            type="button"
            onClick={() => router.push('/tours')}
            className="absolute right-4 inset-y-0 flex items-center"
          >
            <SlidersHorizontal className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" aria-hidden="true" />
          </button>
        )}
      </div>
    </form>
  );
}
