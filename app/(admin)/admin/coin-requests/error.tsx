'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminPromotionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin Promotions/MaxCoin route error:', error);
  }, [error]);

  return (
    <div className="p-6">
      <Card className="border-rose-200 bg-rose-50/80">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2 text-rose-900">
            <AlertTriangle className="h-4 w-4" />
            Promotions / MaxCoin route failed
          </CardTitle>
          <CardDescription className="text-rose-700">
            {error.message || 'Unexpected route error'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={reset}>
            <RefreshCw className="mr-1 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
