'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SearchX } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center gap-4">
      <SearchX className="h-12 w-12 text-muted-foreground/50" />
      <div>
        <h2 className="text-lg font-bold">{t.errors.pageNotFound}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t.errors.pageNotFoundHint}
        </p>
      </div>
      <Link href="/">
        <Button size="sm">{t.errors.goHome}</Button>
      </Link>
    </div>
  );
}
