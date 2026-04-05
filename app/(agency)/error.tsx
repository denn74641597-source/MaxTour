'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

/**
 * Agency panel uchun error boundary — agentlik sahifalarida xato bo'lganda ko'rsatiladi.
 * Xatoni admin botga yuboradi va foydalanuvchiga qayta urinish imkonini beradi.
 */
export default function AgencyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: `agency:${window.location.pathname}`,
        message: error.message || 'Unknown agency panel error',
        stack: error.stack,
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center gap-4">
      <AlertTriangle className="h-12 w-12 text-orange-500" />
      <div>
        <h2 className="text-lg font-bold">Agentlik panelida xatolik</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Kutilmagan xatolik yuz berdi. Iltimos, qayta urinib ko&apos;ring.
        </p>
      </div>
      <Button size="sm" onClick={reset}>
        Qayta urinish
      </Button>
    </div>
  );
}
