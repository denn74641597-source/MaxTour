'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center gap-4">
      <AlertTriangle className="h-12 w-12 text-tertiary" />
      <div>
        <h2 className="text-lg font-bold">{t.errors.somethingWrong}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t.errors.somethingWrongHint}
        </p>
      </div>
      <Button onClick={reset} size="sm">
        {t.errors.tryAgain}
      </Button>
    </div>
  );
}
