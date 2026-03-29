'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ImageUploader } from '@/components/shared/image-uploader';
import { agencyProfileSchema, type AgencyProfileData } from '@/lib/validators';
import {
  Loader2,
  Pencil,
  MapPin,
  Phone,
  MessageCircle,
  Globe,
  Instagram,
  Building2,
  Clock,
  ShieldCheck,
  X,
  ExternalLink,
  FileText,
  Upload,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { upsertAgencyProfileAction, getMyAgencyAction } from '@/features/agencies/actions';
import { uploadPdfAction } from '@/features/upload/actions';
import Image from 'next/image';
import { placeholderImage, slugify } from '@/lib/utils';
import { VerifiedBadge } from '@/components/shared/verified-badge';
import type { Agency } from '@/types';

type PageMode = 'form' | 'view';

interface AgencyProfileContentProps {
  initialAgency: Agency | null;
}

export function AgencyProfileContent({ initialAgency }: AgencyProfileContentProps) {
  const [logoUrl, setLogoUrl] = useState(initialAgency?.logo_url ?? '');
  const [certificatePdfUrl, setCertificatePdfUrl] = useState(initialAgency?.certificate_pdf_url ?? '');
  const [licensePdfUrl, setLicensePdfUrl] = useState(initialAgency?.license_pdf_url ?? '');
  const [mode, setMode] = useState<PageMode>(initialAgency ? 'view' : 'form');
  const [agency, setAgency] = useState<Agency | null>(initialAgency);
  const { t } = useTranslation();

  const defaultFormValues = agency
    ? {
        name: agency.name,
        description: agency.description ?? '',
        phone: agency.phone ?? '',
        telegram_username: agency.telegram_username ?? '',
        instagram_url: agency.instagram_url ?? '',
        website_url: agency.website_url ?? '',
        address: agency.address ?? '',
        city: agency.city ?? '',
        country: agency.country ?? 'Uzbekistan',
        google_maps_url: agency.google_maps_url ?? '',
        inn: agency.inn ?? '',
        responsible_person: agency.responsible_person ?? '',
      }
    : { country: 'Uzbekistan' };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AgencyProfileData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(agencyProfileSchema) as any,
    defaultValues: defaultFormValues,
  });

  async function reloadAgency() {
    const data = await getMyAgencyAction();
    if (data) {
      setAgency(data as Agency);
      setLogoUrl(data.logo_url ?? '');
      setCertificatePdfUrl(data.certificate_pdf_url ?? '');
      setLicensePdfUrl(data.license_pdf_url ?? '');
      reset({
        name: data.name,
        description: data.description ?? '',
        phone: data.phone ?? '',
        telegram_username: data.telegram_username ?? '',
        instagram_url: data.instagram_url ?? '',
        website_url: data.website_url ?? '',
        address: data.address ?? '',
        city: data.city ?? '',
        country: data.country ?? 'Uzbekistan',
        google_maps_url: data.google_maps_url ?? '',
        inn: data.inn ?? '',
        responsible_person: data.responsible_person ?? '',
      });
      setMode('view');
    } else {
      setMode('form');
    }
  }

  function handleEdit() {
    if (agency) {
      reset({
        name: agency.name,
        description: agency.description ?? '',
        phone: agency.phone ?? '',
        telegram_username: agency.telegram_username ?? '',
        instagram_url: agency.instagram_url ?? '',
        website_url: agency.website_url ?? '',
        address: agency.address ?? '',
        city: agency.city ?? '',
        country: agency.country ?? 'Uzbekistan',
        google_maps_url: agency.google_maps_url ?? '',
        inn: agency.inn ?? '',
        responsible_person: agency.responsible_person ?? '',
      });
      setLogoUrl(agency.logo_url ?? '');
      setCertificatePdfUrl(agency.certificate_pdf_url ?? '');
      setLicensePdfUrl(agency.license_pdf_url ?? '');
    }
    setMode('form');
  }

  async function onSubmit(data: AgencyProfileData) {
    const autoSlug = slugify(data.name) || agency?.slug || `agency-${Date.now()}`;
    const result = await upsertAgencyProfileAction({
      name: data.name,
      slug: autoSlug,
      logo_url: logoUrl || null,
      description: data.description || null,
      phone: data.phone || null,
      telegram_username: data.telegram_username || null,
      instagram_url: data.instagram_url || null,
      website_url: data.website_url || null,
      address: data.address || null,
      city: data.city || null,
      country: data.country || 'Uzbekistan',
      google_maps_url: data.google_maps_url || null,
      inn: data.inn || null,
      responsible_person: data.responsible_person || null,
      license_pdf_url: licensePdfUrl || null,
      certificate_pdf_url: certificatePdfUrl || null,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t.agencyProfileForm.profileSaved);
      await reloadAgency();
    }
  }

  /* в”Ђв”Ђв”Ђ Profile View в”Ђв”Ђв”Ђ */
  if (mode === 'view' && agency) {
    const telegramLink = agency.telegram_username
      ? `https://t.me/${agency.telegram_username.replace('@', '')}`
      : null;

    const createdDate = new Date(agency.created_at).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <div className="space-y-5">
        {/* Header Card */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 to-transparent" />
          <div className="relative p-6 flex flex-col items-center text-center">
            {/* Edit Button */}
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-card/80 backdrop-blur"
              onClick={handleEdit}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            {/* Logo */}
            <div className="relative h-24 w-24 rounded-full overflow-hidden ring-4 ring-card shadow-lg bg-card mb-4">
              <Image
                src={agency.logo_url || placeholderImage(200, 200, agency.name[0])}
                alt={agency.name}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>

            {/* Name + Verified */}
            <div className="flex items-center gap-1.5 mb-1">
              <h1 className="text-xl font-bold">{agency.name}</h1>
              {agency.is_verified && (
                <VerifiedBadge className="h-5 w-5" />
              )}
            </div>

            {/* Location */}
            {(agency.city || agency.address) && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {[agency.address, agency.city, agency.country].filter(Boolean).join(', ')}
              </p>
            )}

            {/* Status Badges */}
            <div className="flex items-center gap-2 mt-3">
              {agency.is_approved ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t.agencyView.approved}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-tertiary/15 text-tertiary text-xs font-medium rounded-full">
                  <Clock className="h-3.5 w-3.5" />
                  {t.agencyView.pendingApproval}
                </span>
              )}
              {agency.is_verified && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  <VerifiedBadge size="sm" className="text-blue-700 h-3.5 w-3.5" />
                  {t.agencyView.verified}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {agency.description && (
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                {t.agencyView.aboutUs}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {agency.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Contact Info */}
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              {t.agencyProfileForm.contactInfo}
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {agency.phone && (
                <a
                  href={`tel:${agency.phone}`}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <Phone className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground">{t.agencyProfileForm.phone}</p>
                    <p className="text-xs font-medium truncate">{agency.phone}</p>
                  </div>
                </a>
              )}
              {agency.telegram_username && (
                <a
                  href={telegramLink!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground">{t.agencyProfileForm.telegram}</p>
                    <p className="text-xs font-medium truncate">{agency.telegram_username}</p>
                  </div>
                </a>
              )}
              {agency.instagram_url && (
                <a
                  href={agency.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                    <Instagram className="h-3.5 w-3.5 text-pink-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground">Instagram</p>
                    <p className="text-xs font-medium truncate">{agency.instagram_url.replace('https://instagram.com/', '@')}</p>
                  </div>
                </a>
              )}
              {agency.website_url && (
                <a
                  href={agency.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    <Globe className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground">{t.agencyProfileForm.website}</p>
                    <p className="text-xs font-medium truncate">{agency.website_url.replace(/^https?:\/\//, '')}</p>
                  </div>
                </a>
              )}
              {!agency.phone && !agency.telegram_username && !agency.instagram_url && !agency.website_url && (
                <p className="text-sm text-muted-foreground py-2 col-span-2">{t.agencyView.noContactInfo}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        {(agency.address || agency.city) && (
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                {t.agencyProfileForm.location}
              </h3>
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-surface-container-low">
                <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  {agency.address && <p className="text-sm font-medium">{agency.address}</p>}
                  <p className="text-sm text-muted-foreground">
                    {[agency.city, agency.country].filter(Boolean).join(', ')}
                  </p>
                </div>
                {agency.google_maps_url && (
                  <a
                    href={agency.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-blue-600" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legal Info */}
        {(agency.inn || agency.responsible_person || agency.certificate_pdf_url || agency.license_pdf_url) && (
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                {t.agencyProfileForm.legalInfo}
              </h3>
              <div className="space-y-2.5">
                {agency.inn && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-low">
                    <span className="text-xs text-muted-foreground w-20 shrink-0">{t.agencyProfileForm.inn}</span>
                    <span className="text-sm font-medium">{agency.inn}</span>
                  </div>
                )}
                {agency.responsible_person && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-low">
                    <span className="text-xs text-muted-foreground w-20 shrink-0">{t.agencyProfileForm.responsiblePerson}</span>
                    <span className="text-sm font-medium">{agency.responsible_person}</span>
                  </div>
                )}
                {agency.certificate_pdf_url && (
                  <a
                    href={agency.certificate_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-container-low hover:bg-muted transition-colors"
                  >
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">{t.agencyProfileForm.uploadGuvohnoma}</span>
                    <ExternalLink className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
                  </a>
                )}
                {agency.license_pdf_url && (
                  <a
                    href={agency.license_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-container-low hover:bg-muted transition-colors"
                  >
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">{t.agencyProfileForm.uploadLitsenziya}</span>
                    <ExternalLink className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Meta Info */}
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{t.agencyView.memberSince}: {createdDate}</span>
            </div>
          </CardContent>
        </Card>

        {/* Edit Button */}
        <Button onClick={handleEdit} className="w-full" variant="outline">
          <Pencil className="h-4 w-4 mr-2" />
          {t.agencyView.editProfile}
        </Button>
      </div>
    );
  }

  /* в”Ђв”Ђв”Ђ Form Mode в”Ђв”Ђв”Ђ */
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">
            {agency ? t.agencyView.editProfile : t.agencyProfileForm.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {agency ? t.agencyView.editSubtitle : t.agencyView.fillFormHint}
          </p>
        </div>
        {agency && (
          <Button variant="ghost" size="icon" onClick={() => setMode('view')}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Logo */}
        <Card>
          <CardContent className="p-4">
            <Label className="mb-2 block">{t.agencyProfileForm.companyLogo}</Label>
            <ImageUploader
              value={logoUrl}
              onChange={setLogoUrl}
              label={t.agencyProfileForm.uploadLogo}
              folder="logos"
            />
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold text-sm">{t.agencyProfileForm.basicInfo}</h2>

            <div className="space-y-2">
              <Label htmlFor="name">{t.agencyProfileForm.companyName} *</Label>
              <Input id="name" placeholder={t.agencyProfileForm.companyNamePlaceholder} {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t.agencyProfileForm.description}</Label>
              <Textarea id="description" placeholder={t.agencyProfileForm.descriptionPlaceholder} rows={4} {...register('description')} />
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold text-sm">{t.agencyProfileForm.contactInfo}</h2>

            <div className="space-y-2">
              <Label htmlFor="phone">{t.agencyProfileForm.phone}</Label>
              <Input id="phone" type="tel" placeholder="+998 90 123 45 67" {...register('phone')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram_username">{t.agencyProfileForm.telegram}</Label>
              <Input id="telegram_username" placeholder="@username" {...register('telegram_username')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram_url">{t.agencyProfileForm.instagramUrl}</Label>
              <Input id="instagram_url" placeholder="https://instagram.com/..." {...register('instagram_url')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url">{t.agencyProfileForm.website}</Label>
              <Input id="website_url" placeholder="https://..." {...register('website_url')} />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold text-sm">{t.agencyProfileForm.location}</h2>

            <div className="space-y-2">
              <Label htmlFor="address">{t.agencyProfileForm.address}</Label>
              <Input id="address" placeholder={t.agencyProfileForm.addressPlaceholder} {...register('address')} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">{t.agencyProfileForm.city}</Label>
                <Input id="city" placeholder={t.agencyProfileForm.cityPlaceholder} {...register('city')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">{t.agencyProfileForm.country}</Label>
                <Input id="country" {...register('country')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="google_maps_url">{t.agencyProfileForm.googleMapsUrl}</Label>
              <Input id="google_maps_url" placeholder={t.agencyProfileForm.googleMapsUrlPlaceholder} {...register('google_maps_url')} />
            </div>
          </CardContent>
        </Card>

        {/* Legal Info */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold text-sm">{t.agencyProfileForm.legalInfo}</h2>

            <div className="space-y-2">
              <Label htmlFor="inn">{t.agencyProfileForm.inn}</Label>
              <Input id="inn" placeholder={t.agencyProfileForm.innPlaceholder} {...register('inn')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsible_person">{t.agencyProfileForm.responsiblePerson}</Label>
              <Input id="responsible_person" placeholder={t.agencyProfileForm.responsiblePersonPlaceholder} {...register('responsible_person')} />
            </div>

            {/* Guvohnoma (Certificate) PDF */}
            <div className="space-y-2">
              <Label>{t.agencyProfileForm.uploadGuvohnoma}</Label>
              {certificatePdfUrl ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-container-low">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <a href={certificatePdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate flex-1">
                    {t.agencyProfileForm.uploadGuvohnoma}
                  </a>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCertificatePdfUrl('')}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">PDF</span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const fd = new FormData();
                      fd.append('file', file);
                      fd.append('folder', 'certificates');
                      const res = await uploadPdfAction(fd);
                      if (res.url) setCertificatePdfUrl(res.url);
                      else toast.error(res.error || 'Upload failed');
                    }}
                  />
                </label>
              )}
            </div>

            {/* Litsenziya (License) PDF */}
            <div className="space-y-2">
              <Label>{t.agencyProfileForm.uploadLitsenziya}</Label>
              {licensePdfUrl ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-container-low">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <a href={licensePdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate flex-1">
                    {t.agencyProfileForm.uploadLitsenziya}
                  </a>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setLicensePdfUrl('')}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">PDF</span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const fd = new FormData();
                      fd.append('file', file);
                      fd.append('folder', 'licenses');
                      const res = await uploadPdfAction(fd);
                      if (res.url) setLicensePdfUrl(res.url);
                      else toast.error(res.error || 'Upload failed');
                    }}
                  />
                </label>
              )}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {t.agencyProfileForm.saveProfile}
        </Button>
      </form>
    </div>
  );
}
