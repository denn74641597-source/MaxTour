'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import { uploadCertificateAction, submitVerificationRequest } from '@/features/verification/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Upload,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Loader2,
} from 'lucide-react';
import type { Agency, VerificationRequest } from '@/types';

interface VerificationContentProps {
  agency: Agency;
  requests: VerificationRequest[];
}

export function VerificationContent({ agency, requests }: VerificationContentProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  const latestRequest = requests[0] ?? null;
  const hasPending = latestRequest?.status === 'pending';
  const isApproved = latestRequest?.status === 'approved';
  const isRejected = latestRequest?.status === 'rejected';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;
    if (!file || file.size === 0) return;

    setIsUploading(true);
    try {
      const uploadResult = await uploadCertificateAction(formData);
      if (uploadResult.error) {
        toast.error(uploadResult.error);
        return;
      }

      const result = await submitVerificationRequest(agency.id, uploadResult.url!);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(t.verification.successMessage);
      router.refresh();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          {t.verification.title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t.verification.description}</p>
      </div>

      {/* Current Status */}
      {hasPending && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-sm text-yellow-800 dark:text-yellow-200">
                  {t.verification.pending}
                </h3>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  {t.verification.pendingDescription}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isApproved && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-sm text-green-800 dark:text-green-200">
                  {t.verification.approved}
                </h3>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  {t.verification.approvedDescription}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isRejected && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-sm text-red-800 dark:text-red-200">
                  {t.verification.rejected}
                </h3>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  {t.verification.rejectedDescription}
                </p>
                {latestRequest.admin_note && (
                  <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/40 rounded text-xs text-red-800 dark:text-red-200">
                    <span className="font-medium">{t.verification.adminNote}:</span>{' '}
                    {latestRequest.admin_note}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Form — show when no pending request */}
      {!hasPending && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-1">
              {isRejected ? t.verification.resubmit : t.verification.uploadCertificate}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">{t.verification.uploadHint}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors">
                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">PDF</span>
                <input
                  type="file"
                  name="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  required
                  onChange={(e) => {
                    const label = e.target.closest('label');
                    const span = label?.querySelector('span');
                    if (span && e.target.files?.[0]) {
                      span.textContent = e.target.files[0].name;
                    }
                  }}
                />
              </label>
              <Button type="submit" className="w-full" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t.verification.submitting}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {t.verification.submit}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {requests.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            {t.verification.title}
          </h3>
          {requests.map((req) => (
            <Card key={req.id} className="opacity-80">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {req.status === 'pending' && <Clock className="h-4 w-4 text-yellow-500" />}
                  {req.status === 'approved' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {req.status === 'rejected' && <XCircle className="h-4 w-4 text-red-500" />}
                  <span className="text-xs capitalize">{req.status}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(req.created_at).toLocaleDateString()}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
