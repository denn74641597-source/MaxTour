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
import { SecuritySection } from './security-section';
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
        address: agency.address ?? '',
        city: agency.city ?? '',
        country: agency.country ?? 'O\'zbekiston',
        google_maps_url: agency.google_maps_url ?? '',
        inn: agency.inn ?? '',
        responsible_person: agency.responsible_person ?? '',
      }
    : { country: 'O\'zbekiston' };

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
        address: data.address ?? '',
        city: data.city ?? '',
        country: data.country ?? 'O\'zbekiston',
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
        address: agency.address ?? '',
        city: agency.city ?? '',
        country: agency.country ?? 'O\'zbekiston',
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
      website_url: null,
      address: data.address || null,
      city: data.city || null,
      country: data.country || 'O\'zbekiston',
      google_maps_url: data.google_maps_url || null,
      inn: data.inn || null,
      responsible_person: data.responsible_person || null,
      license_pdf_url: licensePdfUrl || null,
      certificate_pdf_url: certificatePdfUrl || null,
    });
    if (result.error) {
      toast.error('Tizimda xatolik');
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
      <div className="space-y-3">
        {/* Header Card - Compact */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 to-transparent" />
          <div className="relative p-4 flex items-center gap-4">
            {/* Logo */}
            <div className="relative h-16 w-16 rounded-full overflow-hidden ring-2 ring-card shadow-md bg-card shrink-0">
              <Image
                src={agency.logo_url || placeholderImage(200, 200, agency.name[0])}
                alt={agency.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-bold truncate">{agency.name}</h1>
                {agency.is_verified && <VerifiedBadge className="h-4 w-4 shrink-0" />}
              </div>
              {(agency.city || agency.address) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{[agency.address, agency.city, agency.country].filter(Boolean).join(', ')}</span>
                </p>
              )}
              <div className="flex items-center gap-1.5 mt-2">
                {agency.is_approved ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded-full">
                    <ShieldCheck className="h-3 w-3" />
                    {t.agencyView.approved}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-tertiary/15 text-tertiary text-[10px] font-medium rounded-full">
                    <Clock className="h-3 w-3" />
                    {t.agencyView.pendingApproval}
                  </span>
                )}
                {agency.is_verified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded-full">
                    {t.agencyView.verified}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full bg-card/80 backdrop-blur shrink-0"
              onClick={handleEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Description */}
        {agency.description && (
          <div className="bg-surface rounded-xl p-3">
            <h3 className="font-semibold text-xs mb-1 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              {t.agencyView.aboutUs}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {agency.description}
            </p>
          </div>
        )}

        {/* Contact + Location - Combined compact */}
        <div className="bg-surface rounded-xl p-3 space-y-2">
          <h3 className="font-semibold text-xs flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-primary" />
            {t.agencyProfileForm.contactInfo}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {agency.phone && (
              <a href={`tel:${agency.phone}`} className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low hover:bg-muted transition-colors">
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <Phone className="h-3 w-3 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] text-muted-foreground">{t.agencyProfileForm.phone}</p>
                  <p className="text-[11px] font-medium truncate">{agency.phone}</p>
                </div>
              </a>
            )}
            {agency.telegram_username && (
              <a href={telegramLink!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low hover:bg-muted transition-colors">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-3 w-3 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] text-muted-foreground">{t.agencyProfileForm.telegram}</p>
                  <p className="text-[11px] font-medium truncate">{agency.telegram_username}</p>
                </div>
              </a>
            )}
            {agency.instagram_url && (
              <a href={agency.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low hover:bg-muted transition-colors">
                <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                  <Instagram className="h-3 w-3 text-pink-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] text-muted-foreground">Instagram</p>
                  <p className="text-[11px] font-medium truncate">{agency.instagram_url.replace('https://instagram.com/', '@')}</p>
                </div>
              </a>
            )}
            {!agency.phone && !agency.telegram_username && !agency.instagram_url && (
              <p className="text-xs text-muted-foreground py-1 col-span-2">{t.agencyView.noContactInfo}</p>
            )}
          </div>
        </div>

        {/* Location - Compact */}
        {(agency.address || agency.city) && (
          <div className="bg-surface rounded-xl p-3">
            <h3 className="font-semibold text-xs mb-2 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {t.agencyProfileForm.location}
            </h3>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low">
              <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <MapPin className="h-3 w-3 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                {agency.address && <p className="text-[11px] font-medium truncate">{agency.address}</p>}
                <p className="text-[11px] text-muted-foreground truncate">
                  {[agency.city, agency.country].filter(Boolean).join(', ')}
                </p>
              </div>
              {agency.google_maps_url && (
                <a href={agency.google_maps_url} target="_blank" rel="noopener noreferrer" className="shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors">
                  <ExternalLink className="h-3 w-3 text-blue-600" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Legal Info - Compact */}
        {(agency.inn || agency.responsible_person || agency.certificate_pdf_url || agency.license_pdf_url) && (
          <div className="bg-surface rounded-xl p-3">
            <h3 className="font-semibold text-xs mb-2 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              {t.agencyProfileForm.legalInfo}
            </h3>
            <div className="space-y-1.5">
              {agency.inn && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low">
                  <span className="text-[10px] text-muted-foreground w-16 shrink-0">{t.agencyProfileForm.inn}</span>
                  <span className="text-[11px] font-medium">{agency.inn}</span>
                </div>
              )}
              {agency.responsible_person && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low">
                  <span className="text-[10px] text-muted-foreground w-16 shrink-0">{t.agencyProfileForm.responsiblePerson}</span>
                  <span className="text-[11px] font-medium">{agency.responsible_person}</span>
                </div>
              )}
              <div className="flex gap-2">
                {agency.certificate_pdf_url && (
                  <a href={agency.certificate_pdf_url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center gap-1.5 p-2 rounded-lg bg-surface-container-low hover:bg-muted transition-colors">
                    <FileText className="h-3 w-3 text-primary shrink-0" />
                    <span className="text-[10px] font-medium truncate">{t.agencyProfileForm.uploadGuvohnoma}</span>
                  </a>
                )}
                {agency.license_pdf_url && (
                  <a href={agency.license_pdf_url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center gap-1.5 p-2 rounded-lg bg-surface-container-low hover:bg-muted transition-colors">
                    <FileText className="h-3 w-3 text-primary shrink-0" />
                    <span className="text-[10px] font-medium truncate">{t.agencyProfileForm.uploadLitsenziya}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Security Section */}
        <SecuritySection />

        {/* Meta + Edit */}
        <div className="flex items-center justify-between bg-surface rounded-xl p-3">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{t.agencyView.memberSince}: {createdDate}</span>
          </div>
          <Button onClick={handleEdit} size="sm" variant="outline" className="h-7 text-xs">
            <Pencil className="h-3 w-3 mr-1" />
            {t.agencyView.editProfile}
          </Button>
        </div>
      </div>
    );
  }

  /* в”Ђв”Ђв”Ђ Form Mode в”Ђв”Ђв”Ђ */
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">
            {agency ? t.agencyView.editProfile : t.agencyProfileForm.title}
          </h1>
          <p className="text-xs text-muted-foreground">
            {agency ? t.agencyView.editSubtitle : t.agencyView.fillFormHint}
          </p>
        </div>
        {agency && (
          <Button variant="ghost" size="icon" onClick={() => setMode('view')}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <Label htmlFor="description">{t.agencyProfileForm.description} *</Label>
              <Textarea id="description" placeholder={t.agencyProfileForm.descriptionPlaceholder} rows={4} {...register('description')} />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold text-sm">{t.agencyProfileForm.contactInfo}</h2>

            <div className="space-y-2">
              <Label htmlFor="phone">{t.agencyProfileForm.phone} *</Label>
              <Input id="phone" type="tel" placeholder="+998 90 123 45 67" {...register('phone')} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram_username">{t.agencyProfileForm.telegram} *</Label>
              <Input id="telegram_username" placeholder="@username" {...register('telegram_username')} />
              {errors.telegram_username && <p className="text-xs text-destructive">{errors.telegram_username.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram_url">{t.agencyProfileForm.instagramUrl}</Label>
              <Input id="instagram_url" placeholder="https://instagram.com/..." {...register('instagram_url')} />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold text-sm">{t.agencyProfileForm.location}</h2>

            <div className="space-y-2">
              <Label htmlFor="address">{t.agencyProfileForm.address} *</Label>
              <Input id="address" placeholder={t.agencyProfileForm.addressPlaceholder} {...register('address')} />
              {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">{t.agencyProfileForm.city} *</Label>
                <Input id="city" placeholder={t.agencyProfileForm.cityPlaceholder} {...register('city')} />
                {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">{t.agencyProfileForm.country} *</Label>
                <Input id="country" placeholder="O'zbekiston" {...register('country')} />
                {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="google_maps_url">Xarita havolasi</Label>
              <Input id="google_maps_url" placeholder={t.agencyProfileForm.googleMapsUrlPlaceholder} {...register('google_maps_url')} />
            </div>
          </CardContent>
        </Card>

        {/* Legal Info */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold text-sm">{t.agencyProfileForm.legalInfo}</h2>

            <div className="space-y-2">
              <Label htmlFor="inn">{t.agencyProfileForm.inn} *</Label>
              <Input id="inn" placeholder={t.agencyProfileForm.innPlaceholder} {...register('inn')} />
              {errors.inn && <p className="text-xs text-destructive">{errors.inn.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsible_person">{t.agencyProfileForm.responsiblePerson} *</Label>
              <Input id="responsible_person" placeholder={t.agencyProfileForm.responsiblePersonPlaceholder} {...register('responsible_person')} />
              {errors.responsible_person && <p className="text-xs text-destructive">{errors.responsible_person.message}</p>}
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
                      else toast.error('Tizimda xatolik');
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
                      else toast.error('Tizimda xatolik');
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

      {/* Security Section (always visible below form) */}
      <SecuritySection />
    </div>
  );
}
