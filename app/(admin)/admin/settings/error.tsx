'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminSettingsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6">
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-rose-500" />
        <h2 className="mt-4 text-lg font-semibold text-rose-900">
          Settings panel failed to load
        </h2>
        <p className="mt-2 text-sm text-rose-800">
          Retry loading the admin settings snapshot. If this continues, verify admin-safe
          server configuration.
        </p>
        <Button className="mt-4" onClick={reset}>
          Retry
        </Button>
      </div>
    </div>
  );
}
