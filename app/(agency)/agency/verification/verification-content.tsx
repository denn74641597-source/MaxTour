'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { GlowCard } from '@/components/pioneerui/glow-card';
import { GlassCard } from '@/components/pioneerui/glass-card';
import { useTranslation } from '@/lib/i18n';
import { formatDate } from '@/lib/utils';
import { submitVerificationFormRequest } from '@/features/verification/actions';
import { uploadPdfAction } from '@/features/upload/actions';
import type { Agency, VerificationFormData, VerificationRequest } from '@/types';

interface VerificationContentProps {
  agency: Agency;
  requests: VerificationRequest[];
}

const REQUIRED_FIELDS: (keyof VerificationFormData)[] = [
  'company_name',
  'registered_name',
  'office_address',
  'work_phone',
  'work_email',
  'telegram_link',
  'inn',
];

function getFileName(url: string) {
  try {
    return decodeURIComponent(url.split('/').pop() || 'document.pdf');
  } catch {
    return 'document.pdf';
  }
}

export function VerificationContent({ agency, requests }: VerificationContentProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const latestRequest = requests[0] ?? null;
  const hasPending = latestRequest?.status === 'pending';
  const isApproved = latestRequest?.status === 'approved';
  const isRejected = latestRequest?.status === 'rejected';

  const [form, setForm] = useState<VerificationFormData>({
    company_name: agency.name || '',
    registered_name: '',
    country: "O'zbekiston",
    office_address: agency.address || '',
    work_phone: agency.phone || '',
    work_email: '',
    telegram_link: agency.telegram_username || '',
    instagram_url: agency.instagram_url || '',
    website_url: '',
    inn: agency.inn || '',
    registration_number: '',
    certificate_pdf_url: agency.certificate_pdf_url || '',
    license_pdf_url: agency.license_pdf_url || '',
  });

  const statusInfo = useMemo(() => {
    if (hasPending) {
      return {
        icon: <Clock className="h-5 w-5 text-amber-600" />,
        title: t.verification.pending,
        description: t.verification.pendingDescription,
        shell: 'border-amber-200 bg-amber-50 text-amber-900',
      };
    }

    if (isApproved) {
      return {
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
        title: t.verification.approved,
        description: t.verification.approvedDescription,
        shell: 'border-emerald-200 bg-emerald-50 text-emerald-900',
      };
    }

    if (isRejected) {
      return {
        icon: <XCircle className="h-5 w-5 text-rose-600" />,
        title: t.verification.rejected,
        description: t.verification.rejectedDescription,
        shell: 'border-rose-200 bg-rose-50 text-rose-900',
      };
    }

    return {
      icon: <ShieldCheck className="h-5 w-5 text-sky-600" />,
      title: t.agency.verificationNotSubmitted,
      description: t.verification.description,
      shell: 'border-sky-200 bg-sky-50 text-sky-900',
    };
  }, [
    hasPending,
    isApproved,
    isRejected,
    t.agency.verificationNotSubmitted,
    t.verification.approved,
    t.verification.approvedDescription,
    t.verification.description,
    t.verification.pending,
    t.verification.pendingDescription,
    t.verification.rejected,
    t.verification.rejectedDescription,
  ]);

  function updateField(field: keyof VerificationFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function isFormValid() {
    return REQUIRED_FIELDS.every((field) => form[field].trim().length > 0);
  }

  async function handlePdfUpload(field: 'certificate_pdf_url' | 'license_pdf_url', file: File) {
    setActionError(null);
    setUploadingField(field);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', field === 'certificate_pdf_url' ? 'certificates' : 'licenses');

      const res = await uploadPdfAction(fd);
      if (res.error) {
        setActionError(res.error);
        toast.error(res.error);
        return;
      }

      if (res.url) {
        updateField(field, res.url);
        return;
      }

      setActionError(t.errors.somethingWrongHint);
      toast.error(t.errors.somethingWrong);
    } catch {
      setActionError(t.errors.somethingWrongHint);
      toast.error(t.errors.somethingWrong);
    } finally {
      setUploadingField(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActionError(null);

    if (!isFormValid()) {
      toast.error(t.verification.allFieldsRequired);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitVerificationFormRequest(agency.id, form);
      if (result.error) {
        setActionError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success(t.verification.successMessage);
      router.refresh();
    } catch {
      setActionError(t.errors.somethingWrongHint);
      toast.error(t.errors.somethingWrong);
    } finally {
      setIsSubmitting(false);
    }
  }

  function PdfUploadField({
    field,
    label,
    value,
  }: {
    field: 'certificate_pdf_url' | 'license_pdf_url';
    label: string;
    value: string;
  }) {
    const isUploading = uploadingField === field;
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        {value ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-sky-100 p-2 text-sky-700">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-900">{getFileName(value)}</p>
                <a
                  href={value}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-sky-700 hover:underline"
                >
                  {t.common.viewDetails}
                </a>
              </div>
              <button
                type="button"
                onClick={() => updateField(field, '')}
                className="rounded-full p-1 text-slate-500 hover:bg-rose-100 hover:text-rose-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center transition-colors hover:border-sky-400">
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
                <span className="text-xs text-slate-600">{t.common.loading}</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 text-slate-500" />
                <span className="text-xs font-medium text-slate-700">
                  {t.verification.uploadCertificate}
                </span>
                <span className="text-[11px] text-slate-500">{t.verification.pdfHint}</span>
              </>
            )}
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              disabled={isUploading}
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) handlePdfUpload(field, selected);
                e.target.value = '';
              }}
            />
          </label>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <GlowCard className="rounded-[30px]">
        <section className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(130deg,#0f4f77,#0f7ea6,#1b8d8c)] px-6 pb-6 pt-5 text-white shadow-[0_28px_56px_-30px_rgba(15,23,42,0.8)]">
          <div className="absolute -right-12 -top-14 h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute -left-12 bottom-0 h-36 w-36 rounded-full bg-blue-300/15 blur-3xl" />
          <div className="relative">
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <ShieldCheck className="h-5 w-5" />
              {t.verification.title}
            </h1>
            <p className="mt-1 text-sm text-white/85">{t.verification.description}</p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <GlassCard className="rounded-2xl border-white/35 bg-white/18">
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-white/70">
                    {t.common.status}
                  </p>
                  <div className="mt-2">
                    <StatusBadge
                      status={latestRequest?.status ?? 'draft'}
                      label={latestRequest ? undefined : t.agency.verificationNotSubmitted}
                      className="bg-white/90 text-slate-900"
                    />
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="rounded-2xl border-white/35 bg-white/18">
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-white/70">
                    {t.verification.approvedBadge}
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {agency.is_approved ? t.verification.approvedBadgeYes : t.verification.approvedBadgeNo}
                  </p>
                </div>
              </GlassCard>

              <GlassCard className="rounded-2xl border-white/35 bg-white/18">
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-white/70">
                    {t.verification.verifiedBadge}
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {agency.is_verified ? t.verification.verifiedBadgeYes : t.verification.verifiedBadgeNo}
                  </p>
                </div>
              </GlassCard>
            </div>
          </div>
        </section>
      </GlowCard>

      {actionError && (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-semibold text-rose-700">{t.errors.somethingWrong}</p>
            <p className="text-sm text-rose-600">{actionError}</p>
            <Button size="sm" variant="outline" onClick={() => setActionError(null)}>
              {t.common.close}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
        <div className="space-y-4">
          <Card className={statusInfo.shell}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {statusInfo.icon}
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{statusInfo.title}</p>
                  <p className="text-xs opacity-90">{statusInfo.description}</p>
                  {latestRequest?.admin_note && (
                    <div className="mt-2 rounded-lg border border-rose-300 bg-white/65 p-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">
                        {t.verification.adminNote}
                      </p>
                      <p className="mt-1 text-xs">{latestRequest.admin_note}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="market-subtle-border rounded-2xl border-none bg-white/95 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.62)]">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-slate-900">{t.verification.latestRequestTitle}</h2>
                {latestRequest && <StatusBadge status={latestRequest.status} />}
              </div>

              {latestRequest ? (
                <div className="space-y-3 text-sm">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {t.verification.submittedAt}
                    </p>
                    <p className="mt-1 font-medium text-slate-800">{formatDate(latestRequest.created_at)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {t.verification.updatedAt}
                    </p>
                    <p className="mt-1 font-medium text-slate-800">{formatDate(latestRequest.updated_at)}</p>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<ShieldCheck className="mb-3 h-9 w-9 text-muted-foreground/50" />}
                  title={t.verification.noRequestYetTitle}
                  description={t.agency.verificationNotSubmitted}
                />
              )}
            </CardContent>
          </Card>

          <Card className="market-subtle-border rounded-2xl border-none bg-white/95 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.62)]">
            <CardContent className="space-y-3 p-5">
              <h3 className="text-base font-bold text-slate-900">{t.verification.historyTitle}</h3>
              {requests.length > 0 ? (
                <div className="space-y-2">
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <StatusBadge status={request.status} />
                      </div>
                      <p className="text-xs text-slate-500">{formatDate(request.created_at)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Clock className="mb-3 h-9 w-9 text-muted-foreground/50" />}
                  title={t.verification.historyEmptyTitle}
                  description={t.verification.historyEmptyHint}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {hasPending ? (
            <Card className="market-subtle-border rounded-2xl border-none bg-white/95 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.62)]">
              <CardContent className="p-6">
                <EmptyState
                  icon={<Clock className="mb-3 h-10 w-10 text-amber-500" />}
                  title={t.verification.formLockedTitle}
                  description={t.verification.formLockedHint}
                />
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="market-subtle-border rounded-2xl border-none bg-white/95 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.62)]">
                <CardContent className="space-y-4 p-5">
                  <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <Building2 className="h-4 w-4 text-sky-700" />
                    {t.verification.companyInfo}
                  </h2>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>{t.verification.companyName} *</Label>
                      <Input
                        value={form.company_name}
                        onChange={(e) => updateField('company_name', e.target.value)}
                        placeholder={t.verification.companyNamePlaceholder}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t.verification.registeredName} *</Label>
                      <Input
                        value={form.registered_name}
                        onChange={(e) => updateField('registered_name', e.target.value)}
                        placeholder={t.verification.registeredNamePlaceholder}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t.verification.country} *</Label>
                      <Input value="O'zbekiston" disabled className="bg-slate-100" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t.verification.officeAddress} *</Label>
                      <Input
                        value={form.office_address}
                        onChange={(e) => updateField('office_address', e.target.value)}
                        placeholder={t.verification.officeAddressPlaceholder}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t.verification.workPhone} *</Label>
                      <Input
                        type="tel"
                        value={form.work_phone}
                        onChange={(e) => updateField('work_phone', e.target.value)}
                        placeholder={t.verification.workPhonePlaceholder}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-slate-500" />
                          {t.verification.workEmail} *
                        </span>
                      </Label>
                      <Input
                        type="email"
                        value={form.work_email}
                        onChange={(e) => updateField('work_email', e.target.value)}
                        placeholder={t.verification.workEmailPlaceholder}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t.verification.telegramLink} *</Label>
                      <Input
                        value={form.telegram_link}
                        onChange={(e) => updateField('telegram_link', e.target.value)}
                        placeholder={t.verification.telegramLinkPlaceholder}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t.verification.instagramUrl}</Label>
                      <Input
                        value={form.instagram_url}
                        onChange={(e) => updateField('instagram_url', e.target.value)}
                        placeholder={t.verification.instagramUrlPlaceholder}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="market-subtle-border rounded-2xl border-none bg-white/95 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.62)]">
                <CardContent className="space-y-4 p-5">
                  <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <Phone className="h-4 w-4 text-sky-700" />
                    {t.verification.legalInfo}
                  </h2>

                  <div className="space-y-1.5">
                    <Label>{t.verification.inn} *</Label>
                    <Input
                      value={form.inn}
                      onChange={(e) => updateField('inn', e.target.value)}
                      placeholder={t.verification.innPlaceholder}
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <PdfUploadField
                      field="certificate_pdf_url"
                      label={`${t.verification.certificatePdf} *`}
                      value={form.certificate_pdf_url}
                    />
                    <PdfUploadField
                      field="license_pdf_url"
                      label={`${t.verification.licensePdf} *`}
                      value={form.license_pdf_url}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="market-subtle-border rounded-2xl border-none bg-white/95 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.62)]">
                <CardContent className="space-y-3 p-5">
                  <p className="text-xs text-slate-500">{t.verification.requiredFieldsHint}</p>
                  <Button type="submit" className="w-full" disabled={isSubmitting || !isFormValid()}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t.verification.submitting}
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        {t.verification.submit}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
