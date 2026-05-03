'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CircleSlash,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  Globe2,
  ImageIcon,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  ShieldX,
  UserRound,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import type { AdminAgencyDetailPayload } from '@/features/admin/types';
import type { AdminVerificationRequest } from '@/features/verification/types';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import {
  formatDateTime,
  isImageUrl,
  safeHttpUrl,
  type VerificationDocumentItem,
  type VerificationWarningItem,
} from './verification-utils';

interface PreparedVerificationRequest {
  request: AdminVerificationRequest;
  documents: VerificationDocumentItem[];
  warnings: VerificationWarningItem[];
}

interface VerificationDetailSheetProps {
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  selected: PreparedVerificationRequest | null;
  detail?: AdminAgencyDetailPayload;
  detailLoading: boolean;
  detailError: string | null;
  onRetryDetail: () => void;
  onCopy: (value: string | null | undefined, label: string) => void;
  onApprove: () => void;
  onReject: () => void;
  canApprove: boolean;
  canReject: boolean;
  busy: boolean;
}

function statusTone(status: AdminVerificationRequest['status']) {
  if (status === 'pending') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === 'approved') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return 'border-rose-200 bg-rose-50 text-rose-700';
}

function statusLabel(status: AdminVerificationRequest['status']) {
  if (status === 'pending') return 'Pending';
  if (status === 'approved') return 'Approved';
  return 'Rejected';
}

export function VerificationDetailSheet({
  open,
  onOpenChange,
  selected,
  detail,
  detailLoading,
  detailError,
  onRetryDetail,
  onCopy,
  onApprove,
  onReject,
  canApprove,
  canReject,
  busy,
}: VerificationDetailSheetProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const request = selected?.request ?? null;
  const agency = request?.agency ?? null;
  const owner = agency?.owner ?? null;
  const documents = selected?.documents ?? [];
  const warnings = selected?.warnings ?? [];
  const verificationHistory = detail?.verificationRequests ?? [];
  const relatedTours = useMemo(() => {
    if (!request) return [];
    if (detail?.tours?.length) {
      return detail.tours.slice(0, 8).map((tour) => ({
        id: tour.id,
        title: tour.title,
        slug: tour.slug,
        status: tour.status,
        city: tour.city,
        country: tour.country,
        created_at: tour.created_at,
      }));
    }
    return request.recent_tours.slice(0, 8).map((tour) => ({
      id: tour.id,
      title: tour.title,
      slug: tour.slug,
      status: tour.status,
      city: tour.city,
      country: tour.country,
      created_at: tour.created_at,
    }));
  }, [detail?.tours, request]);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto border-l border-slate-200 bg-white p-0 sm:max-w-[920px]"
        >
          {!request ? (
            <div className="p-6 text-sm text-slate-500">Select a verification request to review details.</div>
          ) : (
            <>
              <SheetHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-5 text-slate-100">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <SheetTitle className="text-xl font-semibold text-white">
                      {agency?.name ?? 'Unknown agency'}
                    </SheetTitle>
                    <SheetDescription className="text-slate-300">
                      Verification review, document inspection, and risk moderation workflow.
                    </SheetDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn('border text-xs', statusTone(request.status))}>
                      {request.status === 'pending' ? <Clock3 className="h-3 w-3" /> : null}
                      {request.status === 'approved' ? <ShieldCheck className="h-3 w-3" /> : null}
                      {request.status === 'rejected' ? <ShieldX className="h-3 w-3" /> : null}
                      {statusLabel(request.status)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        'border text-xs',
                        agency?.is_verified
                          ? 'border-sky-200 bg-sky-50 text-sky-700'
                          : 'border-slate-300 bg-slate-100 text-slate-700'
                      )}
                    >
                      {agency?.is_verified ? 'Agency verified' : 'Agency not verified'}
                    </Badge>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-200">
                  <span className="rounded-full border border-slate-600 bg-slate-800/70 px-2 py-1">
                    Request ID: {request.id}
                  </span>
                  <button
                    type="button"
                    className="rounded-full border border-slate-600 bg-slate-800/70 px-2 py-1 hover:bg-slate-700"
                    onClick={() => onCopy(request.id, 'Request ID')}
                  >
                    Copy request ID
                  </button>
                  <span className="rounded-full border border-slate-600 bg-slate-800/70 px-2 py-1">
                    Submitted: {formatDate(request.created_at)}
                  </span>
                </div>
              </SheetHeader>

              <div className="space-y-5 p-5">
                {detailLoading ? (
                  <Card className="rounded-2xl border border-slate-200 py-4">
                    <CardContent className="text-sm text-slate-500">
                      Loading linked agency details...
                    </CardContent>
                  </Card>
                ) : null}

                {detailError ? (
                  <Card className="rounded-2xl border border-rose-200 bg-rose-50 py-4">
                    <CardContent className="flex items-center justify-between gap-3 px-4 text-sm text-rose-700">
                      <span>{detailError}</span>
                      <Button variant="outline" size="sm" onClick={onRetryDetail}>
                        Retry
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}

                <Tabs defaultValue="overview" className="space-y-4">
                  <TabsList variant="line" className="w-full justify-start overflow-x-auto">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="context">Context</TabsTrigger>
                    <TabsTrigger value="risk">Risk</TabsTrigger>
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <Card className="rounded-2xl border border-slate-200 py-4">
                      <CardContent className="grid gap-3 px-4 sm:grid-cols-2">
                        <InfoRow icon={<Building2 className="h-4 w-4" />} label="Agency" value={agency?.name ?? 'Not provided'} />
                        <InfoRow icon={<UserRound className="h-4 w-4" />} label="Manager" value={owner?.full_name ?? 'Not provided'} />
                        <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={owner?.email ?? request.form_data?.work_email ?? 'Not provided'} />
                        <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={agency?.phone ?? owner?.phone ?? request.form_data?.work_phone ?? 'Not provided'} />
                        <InfoRow icon={<MapPin className="h-4 w-4" />} label="Location" value={agency?.city ? `${agency.city}, ${agency.country ?? ''}` : agency?.country ?? 'Not provided'} />
                        <InfoRow icon={<Globe2 className="h-4 w-4" />} label="Website" value={agency?.website_url ?? request.form_data?.website_url ?? 'Not provided'} />
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-slate-200 py-4">
                      <CardContent className="space-y-2 px-4">
                        <p className="text-sm font-semibold text-slate-900">Legal and company details</p>
                        <KeyValue label="Company name" value={request.form_data?.company_name ?? 'Not provided'} />
                        <KeyValue label="Registered name" value={request.form_data?.registered_name ?? 'Not provided'} />
                        <KeyValue label="INN" value={request.form_data?.inn ?? agency?.inn ?? 'Not provided'} />
                        <KeyValue label="Registration number" value={request.form_data?.registration_number ?? 'Not provided'} />
                        <KeyValue label="Responsible person" value={agency?.responsible_person ?? 'Not provided'} />
                        <KeyValue label="Office address" value={request.form_data?.office_address ?? agency?.address ?? 'Not provided'} />
                        <KeyValue label="Admin note" value={request.admin_note ?? 'Not provided'} />
                        <KeyValue label="Created" value={formatDateTime(request.created_at)} />
                        <KeyValue label="Updated" value={formatDateTime(request.updated_at)} />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="documents" className="space-y-4">
                    <Card className="rounded-2xl border border-slate-200 py-4">
                      <CardContent className="space-y-3 px-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-900">Submitted documents</p>
                          <Badge variant="outline">{formatNumber(documents.length)} files</Badge>
                        </div>
                        {documents.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                            No document URLs available in current request and linked agency records.
                          </div>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {documents.map((doc) => (
                              <DocumentCard
                                key={doc.key}
                                document={doc}
                                onPreview={(url) => setPreviewUrl(url)}
                              />
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="context" className="space-y-4">
                    <Card className="rounded-2xl border border-slate-200 py-4">
                      <CardContent className="space-y-3 px-4">
                        <p className="text-sm font-semibold text-slate-900">Linked records and tours context</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <ActionTile
                            title="Agency record"
                            value={agency?.id ?? 'Not linked'}
                            actionLabel="Open agencies panel"
                            href="/admin/agencies"
                          />
                          <ActionTile
                            title="Owner profile record"
                            value={owner?.id ?? 'Not linked'}
                            actionLabel="Open users panel"
                            href="/admin/users"
                          />
                          <ActionTile
                            title="Total related tours"
                            value={String(request.related_tours_count)}
                            actionLabel="Open tours panel"
                            href="/admin/tours"
                          />
                          <ActionTile
                            title="Published tours"
                            value={String(request.related_published_tours_count)}
                            actionLabel="Open tours panel"
                            href="/admin/tours"
                          />
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-slate-900">Recent tours</p>
                          {relatedTours.length === 0 ? (
                            <p className="text-sm text-slate-500">No related tours found.</p>
                          ) : (
                            relatedTours.map((tour) => (
                              <div
                                key={tour.id}
                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-slate-900">{tour.title}</p>
                                  <p className="text-xs text-slate-500">
                                    {tour.city ? `${tour.city}, ${tour.country ?? ''}` : tour.country ?? 'Location not provided'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                                    {tour.status}
                                  </Badge>
                                  <Link
                                    href={`/admin/tours/${tour.id}`}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                                  >
                                    Open
                                    <ExternalLink className="h-3 w-3" />
                                  </Link>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-slate-900">Status history</p>
                          {verificationHistory.length === 0 ? (
                            <p className="text-sm text-slate-500">No additional verification history is available.</p>
                          ) : (
                            verificationHistory.slice(0, 8).map((item) => (
                              <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className={cn('border', statusTone(item.status))}>
                                    {item.status}
                                  </Badge>
                                  <span className="text-slate-500">{formatDateTime(item.created_at)}</span>
                                </div>
                                <p className="mt-1 text-slate-600">Admin note: {item.admin_note ?? 'Not provided'}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="risk" className="space-y-4">
                    <Card className="rounded-2xl border border-slate-200 py-4">
                      <CardContent className="space-y-3 px-4">
                        <p className="text-sm font-semibold text-slate-900">Verification quality and risk warnings</p>
                        {warnings.length === 0 ? (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                            No risk warnings detected from current available fields.
                          </div>
                        ) : (
                          warnings.map((warning) => (
                            <div
                              key={warning.key}
                              className={cn(
                                'flex items-start gap-2 rounded-xl border p-3 text-sm',
                                warning.severity === 'high'
                                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                                  : warning.severity === 'medium'
                                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                                  : 'border-sky-200 bg-sky-50 text-sky-700'
                              )}
                            >
                              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                              <div>
                                <p className="font-medium">{warning.label}</p>
                                <p className="text-xs uppercase tracking-wide">{warning.severity} severity</p>
                              </div>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="actions" className="space-y-4">
                    <Card className="rounded-2xl border border-slate-200 py-4">
                      <CardContent className="space-y-3 px-4">
                        <p className="text-sm font-semibold text-slate-900">Verification action center</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Button disabled={!canApprove || busy} onClick={onApprove}>
                            <CheckCircle2 className="h-4 w-4" />
                            Approve verification
                          </Button>
                          <Button variant="destructive" disabled={!canReject || busy} onClick={onReject}>
                            <XCircle className="h-4 w-4" />
                            Reject verification
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => onCopy(agency?.phone ?? owner?.email ?? request.form_data?.work_email, 'Primary contact')}
                          >
                            <Copy className="h-4 w-4" />
                            Copy contact
                          </Button>
                          <Button variant="ghost" disabled>
                            <CircleSlash className="h-4 w-4" />
                            Request info (not supported)
                          </Button>
                          <Button variant="ghost" disabled>
                            <CircleSlash className="h-4 w-4" />
                            Suspend verification (not supported)
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500">
                          Only existing mutation logic is enabled. Request-info and suspend flows are currently not implemented in schema/actions.
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog
        open={Boolean(previewUrl)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPreviewUrl(null);
        }}
      >
        <DialogContent className="max-w-4xl bg-black p-2">
          <DialogHeader>
            <DialogTitle className="sr-only">Document preview</DialogTitle>
          </DialogHeader>
          {previewUrl ? (
            isImageUrl(previewUrl) ? (
              <img
                src={previewUrl}
                alt="Document preview"
                className="h-[70vh] w-full rounded-xl object-contain"
              />
            ) : (
              <div className="flex h-[70vh] flex-col items-center justify-center gap-3 rounded-xl bg-slate-950 text-slate-200">
                <FileText className="h-8 w-8" />
                <p className="text-sm">Preview is not available for this file type.</p>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-slate-600 px-3 py-1.5 text-xs hover:bg-slate-800"
                >
                  Open file
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-500">
        {icon}
        {label}
      </div>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[190px_1fr] sm:items-start">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm text-slate-700">{value}</p>
    </div>
  );
}

function ActionTile({
  title,
  value,
  actionLabel,
  href,
}: {
  title: string;
  value: string;
  actionLabel: string;
  href: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 break-all text-sm font-semibold text-slate-900">{value}</p>
      <Link href={href} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
        {actionLabel}
        <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  );
}

function DocumentCard({
  document,
  onPreview,
}: {
  document: VerificationDocumentItem;
  onPreview: (url: string) => void;
}) {
  const [failed, setFailed] = useState(false);
  const previewUrl = safeHttpUrl(document.url);
  const isImage = previewUrl ? isImageUrl(previewUrl) : false;

  if (!previewUrl) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500">
        Document URL is invalid or unavailable.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-900">{document.label}</p>
          <p className="text-xs text-slate-500">Source: {document.source}</p>
        </div>
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
        >
          Open
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {isImage ? (
        <button
          type="button"
          onClick={() => onPreview(previewUrl)}
          className="group relative h-36 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
        >
          {failed ? (
            <div className="flex h-full items-center justify-center text-slate-500">
              <ImageIcon className="h-5 w-5" />
            </div>
          ) : (
            <img
              src={previewUrl}
              alt={document.label}
              onError={() => setFailed(true)}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onPreview(previewUrl)}
          className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600"
        >
          <FileText className="h-5 w-5" />
          <span className="text-xs">Preview file</span>
        </button>
      )}

      {!isImage ? (
        <p className="mt-2 line-clamp-2 text-xs text-slate-500">{previewUrl}</p>
      ) : null}
    </div>
  );
}
