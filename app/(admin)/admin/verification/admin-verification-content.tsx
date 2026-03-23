'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import {
  approveVerificationAction,
  rejectVerificationAction,
} from '@/features/verification/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Props {
  requests: any[];
}

export function AdminVerificationContent({ requests }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const processedRequests = requests.filter((r) => r.status !== 'pending');

  async function handleApprove(requestId: string, agencyId: string) {
    setProcessing(requestId);
    const result = await approveVerificationAction(requestId, agencyId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t.verification.approved);
    }
    setProcessing(null);
    router.refresh();
  }

  async function handleReject(requestId: string, agencyId: string) {
    setProcessing(requestId);
    const note = rejectNotes[requestId] || '';
    const result = await rejectVerificationAction(requestId, agencyId, note);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t.verification.rejected);
    }
    setProcessing(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          {t.verification.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {pendingRequests.length} pending
        </p>
      </div>

      {/* Pending */}
      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          {pendingRequests.map((req) => (
            <Card key={req.id} className="border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <h3 className="font-semibold text-sm truncate">
                        {req.agency?.name ?? 'Unknown'}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(req.created_at)}
                    </p>
                  </div>
                  <a
                    href={req.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
                  >
                    PDF <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <Input
                  placeholder={t.verification.adminNote}
                  value={rejectNotes[req.id] || ''}
                  onChange={(e) =>
                    setRejectNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                  }
                  className="h-8 text-xs"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    disabled={processing === req.id}
                    onClick={() => handleApprove(req.id, req.agency_id)}
                  >
                    <Check className="h-3 w-3 mr-1" /> {t.verification.approved}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs"
                    disabled={processing === req.id}
                    onClick={() => handleReject(req.id, req.agency_id)}
                  >
                    <X className="h-3 w-3 mr-1" /> {t.verification.rejected}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Processed history */}
      {processedRequests.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground mt-4">History</h3>
          {processedRequests.map((req) => (
            <Card key={req.id} className="opacity-70">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {req.status === 'approved' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                  )}
                  <span className="text-xs font-medium truncate">
                    {req.agency?.name ?? 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs capitalize">{req.status}</span>
                  <a
                    href={req.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {requests.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground text-sm">
            No verification requests yet
          </CardContent>
        </Card>
      )}
    </div>
  );
}
