'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useAdminI18n } from '@/features/admin/i18n';

/**
 * Admin panel uchun error boundary — admin sahifalarida xato bo'lganda ko'rsatiladi.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { tInline } = useAdminI18n();

  useEffect(() => {
    fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: `admin:${window.location.pathname}`,
        message: error.message || 'Unknown admin panel error',
        stack: error.stack,
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center gap-4">
      <AlertTriangle className="h-12 w-12 text-red-500" />
      <div>
        <h2 className="text-lg font-bold">{tInline('Admin panelda xatolik')}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {error.message ? tInline(error.message) : tInline('Kutilmagan xatolik yuz berdi.')}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {tInline('Digest')}: {error.digest}
          </p>
        )}
      </div>
      <Button size="sm" onClick={reset}>
        {tInline('Qayta urinish')}
      </Button>
    </div>
  );
}
