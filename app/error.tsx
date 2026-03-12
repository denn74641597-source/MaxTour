'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center gap-4">
      <AlertTriangle className="h-12 w-12 text-amber-500" />
      <div>
        <h2 className="text-lg font-bold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mt-1">
          An unexpected error occurred. Please try again.
        </p>
      </div>
      <Button onClick={reset} size="sm">
        Try Again
      </Button>
    </div>
  );
}
