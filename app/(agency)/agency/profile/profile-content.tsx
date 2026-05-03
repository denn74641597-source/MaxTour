'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Building2,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  ShieldCheck,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/shared/empty-state';
import { ImageUploader } from '@/components/shared/image-uploader';
import { StatusBadge } from '@/components/shared/status-badge';
import { GlowCard } from '@/components/pioneerui/glow-card';
import { GlassCard } from '@/components/pioneerui/glass-card';
import { useTranslation } from '@/lib/i18n';
import { formatDate, slugify } from '@/lib/utils';
import { getMyAgencyAction, upsertAgencyProfileAction } from '@/features/agencies/actions';
import { uploadPdfAction } from '@/features/upload/actions';
import { SecuritySection } from './security-section';
import type { Agency } from '@/types';

type PageMode = 'view' | 'form';

interface AgencyOwnerSummary {
  full_name: string | null;
  phone: string | null;
  email: string | null;
  telegram_username: string | null;
  avatar_url: string | null;
}

interface AgencyPlanSummary {
  planName: string;
  maxTours: number;
  currentTours: number;
  canCreate: boolean;
}

interface AgencyProfileSummary {
  maxCoinBalance: number;
  followersCount: number;
  owner: AgencyOwnerSummary | null;
  latestVerification:
    | {
        status: 'pending' | 'approved' | 'rejected';
        created_at: string;
        admin_note: string | null;
      }
    | null;
  planSummary: AgencyPlanSummary | null;
}

interface AgencyProfileContentProps {
  initialAgency: Agency | null;
  summary: AgencyProfileSummary | null;
}

interface ProfileFormState {
  name: string;
  slug: string;
  description: string;
  phone: string;
  telegram_username: string;
  instagram_url: string;
  website_url: string;
  address: string;
  city: string;
  country: string;
  google_maps_url: string;
  inn: string;
  responsible_person: string;
}

const DEFAULT_COUNTRY = "O'zbekiston";

function getFormFromAgency(agency: Agency | null): ProfileFormState {
  if (!agency) {
    return {
      name: '',
      slug: '',
      description: '',
      phone: '',
      telegram_username: '',
      instagram_url: '',
      website_url: '',
      address: '',
      city: '',
      country: DEFAULT_COUNTRY,
      google_maps_url: '',
      inn: '',
      responsible_person: '',
    };
  }

  return {
    name: agency.name ?? '',
    slug: agency.slug ?? '',
    description: agency.description ?? '',
    phone: agency.phone ?? '',
    telegram_username: agency.telegram_username ?? '',
    instagram_url: agency.instagram_url ?? '',
    website_url: agency.website_url ?? '',
    address: agency.address ?? '',
    city: agency.city ?? '',
    country: agency.country ?? DEFAULT_COUNTRY,
    google_maps_url: agency.google_maps_url ?? '',
    inn: agency.inn ?? '',
    responsible_person: agency.responsible_person ?? '',
  };
}

function normalizeOptional(value: string) {
  const next = value.trim();
  return next.length > 0 ? next : null;
}

export function AgencyProfileContent({ initialAgency, summary }: AgencyProfileContentProps) {
  const { t } = useTranslation();
  const [agency, setAgency] = useState<Agency | null>(initialAgency);
  const [mode, setMode] = useState<PageMode>(initialAgency ? 'view' : 'form');
  const [form, setForm] = useState<ProfileFormState>(getFormFromAgency(initialAgency));
  const [logoUrl, setLogoUrl] = useState(initialAgency?.logo_url ?? '');
  const [certificatePdfUrl, setCertificatePdfUrl] = useState(initialAgency?.certificate_pdf_url ?? '');
  const [licensePdfUrl, setLicensePdfUrl] = useState(initialAgency?.license_pdf_url ?? '');
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const localSummary = useMemo(() => {
    return summary ?? {
      maxCoinBalance: 0,
      followersCount: 0,
      owner: null,
      latestVerification: null,
      planSummary: null,
    };
  }, [summary]);

  async function reloadAgency() {
    const data = await getMyAgencyAction();
    if (data) {
      const next = data as Agency;
      setAgency(next);
      setForm(getFormFromAgency(next));
      setLogoUrl(next.logo_url ?? '');
      setCertificatePdfUrl(next.certificate_pdf_url ?? '');
      setLicensePdfUrl(next.license_pdf_url ?? '');
      setMode('view');
      return;
    }

    setAgency(null);
    setForm(getFormFromAgency(null));
    setLogoUrl('');
    setCertificatePdfUrl('');
    setLicensePdfUrl('');
    setMode('form');
  }

  function updateField<K extends keyof ProfileFormState>(field: K, value: ProfileFormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleEdit() {
    setForm(getFormFromAgency(agency));
    setLogoUrl(agency?.logo_url ?? '');
    setCertificatePdfUrl(agency?.certificate_pdf_url ?? '');
    setLicensePdfUrl(agency?.license_pdf_url ?? '');
    setActionError(null);
    setMode('form');
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
        if (field === 'certificate_pdf_url') setCertificatePdfUrl(res.url);
        if (field === 'license_pdf_url') setLicensePdfUrl(res.url);
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActionError(null);

    if (!form.name.trim()) {
      toast.error(t.agencyProfileForm.companyNameRequired);
      return;
    }

    setSaving(true);
    try {
      const autoSlug =
        slugify(form.slug || form.name) || agency?.slug || `agency-${Date.now()}`;

      const result = await upsertAgencyProfileAction({
        name: form.name.trim(),
        slug: autoSlug,
        logo_url: normalizeOptional(logoUrl),
        description: normalizeOptional(form.description),
        phone: normalizeOptional(form.phone),
        telegram_username: normalizeOptional(form.telegram_username),
        instagram_url: normalizeOptional(form.instagram_url),
        website_url: normalizeOptional(form.website_url),
        address: normalizeOptional(form.address),
        city: normalizeOptional(form.city),
        country: form.country.trim() || DEFAULT_COUNTRY,
        google_maps_url: normalizeOptional(form.google_maps_url),
        inn: normalizeOptional(form.inn),
        responsible_person: normalizeOptional(form.responsible_person),
        license_pdf_url: normalizeOptional(licensePdfUrl),
        certificate_pdf_url: normalizeOptional(certificatePdfUrl),
      });

      if (result.error) {
        setActionError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success(t.agencyProfileForm.profileSaved);
      await reloadAgency();
    } catch {
      setActionError(t.errors.somethingWrongHint);
      toast.error(t.errors.somethingWrong);
    } finally {
      setSaving(false);
    }
  }

  function PdfUploadField({
    label,
    field,
    value,
    onRemove,
  }: {
    label: string;
    field: 'certificate_pdf_url' | 'license_pdf_url';
    value: string;
    onRemove: () => void;
  }) {
    const isUploading = uploadingField === field;
    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        {value ? (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
            <FileText className="h-4 w-4 shrink-0 text-sky-700" />
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="flex-1 truncate text-xs text-sky-700 hover:underline"
            >
              {label}
            </a>
            <button
              type="button"
              onClick={onRemove}
              className="rounded-full p-1 text-slate-500 hover:bg-rose-100 hover:text-rose-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center transition-colors hover:border-sky-500">
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
                <span className="text-xs text-slate-600">{t.common.loading}</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 text-slate-500" />
                <span className="text-xs font-medium text-slate-700">{label}</span>
                <span className="text-[11px] text-slate-500">{t.verification.pdfHint}</span>
              </>
            )}
            <input
              type="file"
              accept=".pdf,application/pdf"
              disabled={isUploading}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handlePdfUpload(field, file);
                event.target.value = '';
              }}
            />
          </label>
        )}
      </div>
    );
  }

  const telegramLink = agency?.telegram_username
    ? `https://t.me/${agency.telegram_username.replace('@', '')}`
    : null;

  if (mode === 'view' && agency) {
    return (
      <div className="space-y-5">
        <GlowCard className="rounded-[30px]">
          <section className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(120deg,#0d4f71,#0f6b93,#0f839f)] px-6 pb-6 pt-5 text-white shadow-[0_28px_56px_-30px_rgba(15,23,42,0.8)]">
            <div className="absolute -right-12 -top-14 h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="absolute -left-12 bottom-0 h-36 w-36 rounded-full bg-blue-300/15 blur-3xl" />
            <div className="relative space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/45 bg-white/15">
                    {agency.logo_url ? (
                      <Image
                        src={agency.logo_url}
                        alt={agency.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-bold">
                        {agency.name?.charAt(0)?.toUpperCase() ?? 'A'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h1 className="truncate text-2xl font-bold">{agency.name}</h1>
                    <p className="mt-1 truncate text-sm text-sky-100">
                      {agency.description?.trim() || t.agencyView.noDescription}
                    </p>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/90 text-slate-900 hover:bg-white"
                  onClick={handleEdit}
                >
                  <Pencil className="mr-1.5 h-4 w-4" />
                  {t.agencyView.editProfile}
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <GlassCard className="rounded-2xl border-white/40 bg-white/18">
                  <div className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-white/75">
                      {t.agency.verificationStatusLabel}
                    </p>
                    <div className="mt-2">
                      <StatusBadge
                        status={
                          localSummary.latestVerification?.status ??
                          (agency.is_verified ? 'approved' : 'pending')
                        }
                        label={
                          localSummary.latestVerification
                            ? undefined
                            : agency.is_verified
                              ? t.verification.approved
                              : t.agency.verificationNotSubmitted
                        }
                        className="bg-white/90 text-slate-900"
                      />
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="rounded-2xl border-white/40 bg-white/18">
                  <div className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-white/75">
                      {t.agency.maxCoinBalance}
                    </p>
                    <p className="mt-2 text-2xl font-bold">
                      {localSummary.maxCoinBalance.toLocaleString()} MC
                    </p>
                  </div>
                </GlassCard>

                <GlassCard className="rounded-2xl border-white/40 bg-white/18">
                  <div className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-white/75">
                      {t.agencyView.followers}
                    </p>
                    <p className="mt-2 text-2xl font-bold">
                      {localSummary.followersCount.toLocaleString()}
                    </p>
                  </div>
                </GlassCard>

                <GlassCard className="rounded-2xl border-white/40 bg-white/18">
                  <div className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-white/75">
                      {t.subscriptionPage.currentPlan}
                    </p>
                    <p className="mt-2 truncate text-lg font-bold">
                      {localSummary.planSummary?.planName ?? t.agencyView.planNotAvailable}
                    </p>
                  </div>
                </GlassCard>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link href="/agency/verification">
                  <Button size="sm" variant="secondary" className="bg-white/15 text-white hover:bg-white/25">
                    {t.verification.title}
                  </Button>
                </Link>
                <Link href="/agency/advertising">
                  <Button size="sm" variant="secondary" className="bg-white/15 text-white hover:bg-white/25">
                    {t.nav.advertising}
                  </Button>
                </Link>
                <Link href="/agency/subscription">
                  <Button size="sm" variant="secondary" className="bg-white/15 text-white hover:bg-white/25">
                    {t.nav.subscription}
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </GlowCard>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="market-subtle-border rounded-2xl border-none bg-white/95 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.62)]">
            <CardContent className="space-y-4 p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Phone className="h-4 w-4 text-sky-700" />
                {t.agencyProfileForm.contactInfo}
              </h2>
              <div className="space-y-2 text-sm">
                {agency.phone ? (
                  <a href={`tel:${agency.phone}`} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5">
                    <Phone className="h-4 w-4 text-emerald-600" />
                    <span>{agency.phone}</span>
                  </a>
                ) : null}
                {agency.telegram_username && telegramLink ? (
                  <a
                    href={telegramLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5"
                  >
                    <MessageCircle className="h-4 w-4 text-sky-700" />
                    <span>{agency.telegram_username}</span>
                  </a>
                ) : null}
                {agency.instagram_url ? (
                  <a
                    href={agency.instagram_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5"
                  >
                    <Globe className="h-4 w-4 text-pink-600" />
                    <span className="truncate">{agency.instagram_url}</span>
                  </a>
                ) : null}
                {agency.website_url ? (
                  <a
                    href={agency.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5"
                  >
                    <Globe className="h-4 w-4 text-indigo-600" />
                    <span className="truncate">{agency.website_url}</span>
                    <ExternalLink className="ml-auto h-3.5 w-3.5 text-slate-400" />
                  </a>
                ) : null}
                {!agency.phone &&
                !agency.telegram_username &&
                !agency.instagram_url &&
                !agency.website_url ? (
                  <p className="text-sm text-slate-500">{t.agencyView.noContactInfo}</p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="market-subtle-border rounded-2xl border-none bg-white/95 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.62)]">
            <CardContent className="space-y-4 p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <MapPin className="h-4 w-4 text-sky-700" />
                {t.agencyProfileForm.location}
              </h2>
              {(agency.address || agency.city || agency.country) ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p className="font-semibold text-slate-900">{agency.address ?? '—'}</p>
                  <p className="mt-1 text-slate-600">
                    {[agency.city, agency.country].filter(Boolean).join(', ') || '—'}
                  </p>
                  {agency.google_maps_url ? (
                    <a
                      href={agency.google_maps_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-sky-700 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {t.agencyProfileForm.googleMapsUrl}
                    </a>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-slate-500">{t.empty.noItems}</p>
              )}
            </CardContent>
          </Card>

          <Card className="market-subtle-border rounded-2xl border-none bg-white/95 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.62)]">
            <CardContent className="space-y-4 p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <UserRound className="h-4 w-4 text-sky-700" />
                {t.agencyView.ownerManager}
              </h2>
              <div className="space-y-2 text-sm">
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <p className="text-xs text-slate-500">{t.agencyProfileForm.responsiblePerson}</p>
                  <p className="font-medium text-slate-900">{agency.responsible_person ?? '—'}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <p className="text-xs text-slate-500">{t.auth.fullName}</p>
                  <p className="font-medium text-slate-900">{localSummary.owner?.full_name ?? '—'}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <p className="text-xs text-slate-500">{t.auth.email}</p>
                  <p className="font-medium text-slate-900">{localSummary.owner?.email ?? '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="market-subtle-border rounded-2xl border-none bg-white/95 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.62)]">
            <CardContent className="space-y-4 p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-sky-700" />
                {t.verification.title}
              </h2>
              <div className="space-y-2 text-sm">
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <p className="text-xs text-slate-500">{t.agency.verificationStatusLabel}</p>
                  <div className="mt-1">
                    <StatusBadge
                      status={localSummary.latestVerification?.status ?? (agency.is_verified ? 'approved' : 'pending')}
                      label={
                        localSummary.latestVerification
                          ? undefined
                          : agency.is_verified
                            ? t.verification.approved
                            : t.agency.verificationNotSubmitted
                      }
                    />
                  </div>
                </div>
                {localSummary.latestVerification ? (
                  <div className="rounded-lg bg-slate-50 p-2.5">
                    <p className="text-xs text-slate-500">{t.agency.verificationLastRequestLabel}</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {formatDate(localSummary.latestVerification.created_at)}
                    </p>
                    {localSummary.latestVerification.admin_note ? (
                      <p className="mt-2 text-xs text-rose-700">
                        {t.verification.adminNote}: {localSummary.latestVerification.admin_note}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        {(agency.inn || agency.responsible_person || agency.certificate_pdf_url || agency.license_pdf_url) && (
          <Card className="market-subtle-border rounded-2xl border-none bg-white/95 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.62)]">
            <CardContent className="space-y-4 p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <FileText className="h-4 w-4 text-sky-700" />
                {t.agencyProfileForm.legalInfo}
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{t.agencyProfileForm.inn}</p>
                  <p className="mt-1 font-medium text-slate-900">{agency.inn ?? '—'}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{t.agencyProfileForm.responsiblePerson}</p>
                  <p className="mt-1 font-medium text-slate-900">{agency.responsible_person ?? '—'}</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {agency.certificate_pdf_url ? (
                  <a
                    href={agency.certificate_pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm hover:border-slate-300"
                  >
                    <FileText className="h-4 w-4 text-sky-700" />
                    <span className="truncate">{t.agencyProfileForm.uploadGuvohnoma}</span>
                  </a>
                ) : null}
                {agency.license_pdf_url ? (
                  <a
                    href={agency.license_pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm hover:border-slate-300"
                  >
                    <FileText className="h-4 w-4 text-sky-700" />
                    <span className="truncate">{t.agencyProfileForm.uploadLitsenziya}</span>
                  </a>
                ) : null}
              </div>
            </CardContent>
          </Card>
        )}

        <SecuritySection />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-semibold text-rose-700">{t.errors.somethingWrong}</p>
            <p className="text-sm text-rose-600">{actionError}</p>
            <Button size="sm" variant="outline" onClick={() => setActionError(null)}>
              {t.common.close}
            </Button>
          </CardContent>
        </Card>
      )}

      {!agency && (
        <Card className="market-subtle-border rounded-2xl border-none bg-white/95 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.62)]">
          <CardContent className="p-6">
            <EmptyState
              icon={<Building2 className="mb-3 h-10 w-10 text-muted-foreground/50" />}
              title={t.agency.noAgencyFound}
              description={t.agencyView.fillFormHint}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">
            {agency ? t.agencyView.editProfile : t.agencyProfileForm.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {agency ? t.agencyView.editSubtitle : t.agencyView.fillFormHint}
          </p>
        </div>
        {agency ? (
          <Button variant="outline" size="sm" onClick={() => setMode('view')}>
            <X className="mr-1 h-4 w-4" />
            {t.common.cancel}
          </Button>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Card className="market-subtle-border rounded-2xl border-none bg-white/95 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.62)]">
          <CardContent className="space-y-3 p-5">
            <Label>{t.agencyProfileForm.companyLogo}</Label>
            <ImageUploader
              value={logoUrl}
              onChange={setLogoUrl}
              label={t.agencyProfileForm.uploadLogo}
              folder="logos"
            />
          </CardContent>
        </Card>

        <Card className="market-subtle-border rounded-2xl border-none bg-white/95 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.62)]">
          <CardContent className="space-y-4 p-5">
            <h2 className="text-base font-bold text-slate-900">{t.agencyProfileForm.basicInfo}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t.agencyProfileForm.companyName} *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder={t.agencyProfileForm.companyNamePlaceholder}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t.agencyProfileForm.urlSlug}</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => updateField('slug', e.target.value)}
                  placeholder={t.agencyProfileForm.urlSlugPlaceholder}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t.agencyProfileForm.description}</Label>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder={t.agencyProfileForm.descriptionPlaceholder}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="market-subtle-border rounded-2xl border-none bg-white/95 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.62)]">
          <CardContent className="space-y-4 p-5">
            <h2 className="text-base font-bold text-slate-900">{t.agencyProfileForm.contactInfo}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t.agencyProfileForm.phone}</Label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+998 90 123 45 67"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t.agencyProfileForm.telegram}</Label>
                <Input
                  value={form.telegram_username}
                  onChange={(e) => updateField('telegram_username', e.target.value)}
                  placeholder="@username"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t.agencyProfileForm.instagramUrl}</Label>
                <Input
                  value={form.instagram_url}
                  onChange={(e) => updateField('instagram_url', e.target.value)}
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t.agencyProfileForm.website}</Label>
                <Input
                  value={form.website_url}
                  onChange={(e) => updateField('website_url', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="market-subtle-border rounded-2xl border-none bg-white/95 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.62)]">
          <CardContent className="space-y-4 p-5">
            <h2 className="text-base font-bold text-slate-900">{t.agencyProfileForm.location}</h2>
            <div className="space-y-1.5">
              <Label>{t.agencyProfileForm.address}</Label>
              <Input
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder={t.agencyProfileForm.addressPlaceholder}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t.agencyProfileForm.city}</Label>
                <Input
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder={t.agencyProfileForm.cityPlaceholder}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t.agencyProfileForm.country}</Label>
                <Input
                  value={form.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  placeholder={DEFAULT_COUNTRY}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t.agencyProfileForm.googleMapsUrl}</Label>
              <Input
                value={form.google_maps_url}
                onChange={(e) => updateField('google_maps_url', e.target.value)}
                placeholder={t.agencyProfileForm.googleMapsUrlPlaceholder}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="market-subtle-border rounded-2xl border-none bg-white/95 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.62)]">
          <CardContent className="space-y-4 p-5">
            <h2 className="text-base font-bold text-slate-900">{t.agencyProfileForm.legalInfo}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t.agencyProfileForm.inn}</Label>
                <Input
                  value={form.inn}
                  onChange={(e) => updateField('inn', e.target.value)}
                  placeholder={t.agencyProfileForm.innPlaceholder}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t.agencyProfileForm.responsiblePerson}</Label>
                <Input
                  value={form.responsible_person}
                  onChange={(e) => updateField('responsible_person', e.target.value)}
                  placeholder={t.agencyProfileForm.responsiblePersonPlaceholder}
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <PdfUploadField
                label={t.agencyProfileForm.uploadGuvohnoma}
                field="certificate_pdf_url"
                value={certificatePdfUrl}
                onRemove={() => setCertificatePdfUrl('')}
              />
              <PdfUploadField
                label={t.agencyProfileForm.uploadLitsenziya}
                field="license_pdf_url"
                value={licensePdfUrl}
                onRemove={() => setLicensePdfUrl('')}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t.common.loading}
            </>
          ) : (
            t.agencyProfileForm.saveProfile
          )}
        </Button>
      </form>

      <SecuritySection />
    </div>
  );
}
