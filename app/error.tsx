'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

/** Detect chunk / dynamic-import load failures (stale deploy cache) */
function isChunkLoadError(error: Error): boolean {
  const msg = (error?.message || '').toLowerCase();
  return (
    msg.includes('loading chunk') ||
    msg.includes('chunkloaderror') ||
    msg.includes('failed to fetch dynamically imported module')
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    // Auto-recover from stale chunk errors (once per session to avoid loops)
    if (isChunkLoadError(error)) {
      const key = 'mt_chunk_reload';
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
        return;
      }
    } else {
      // Clear flag so future chunk errors can still auto-recover
      sessionStorage.removeItem('mt_chunk_reload');
    }

    // Report error to admin bot
    fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: window.location.pathname,
        message: error.message || 'Unknown error',
        stack: error.stack,
      }),
    }).catch(() => {});
  }, [error]);

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
