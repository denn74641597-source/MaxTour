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
      <div className={cn(
        'relative group flex items-center transition-all',
        variant === 'hero'
          ? 'bg-surface rounded-[1.5rem] shadow-ambient ghost-border focus-within:ghost-border-focus'
          : 'bg-surface-container-low rounded-lg'
      )}>
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
              ? 'h-14 pl-13 pr-14 text-[15px]'
              : 'py-2.5 pl-10 pr-4 text-sm'
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
