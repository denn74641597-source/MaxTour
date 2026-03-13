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
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { upsertAgencyProfileAction, getMyAgencyAction } from '@/features/agencies/actions';

export default function AgencyProfilePage() {
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AgencyProfileData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(agencyProfileSchema) as any,
    defaultValues: {
      country: 'Uzbekistan',
    },
  });

  useEffect(() => {
    getMyAgencyAction().then((agency) => {
      if (agency) {
        reset({
          name: agency.name,
          slug: agency.slug,
          description: agency.description ?? '',
          phone: agency.phone ?? '',
          telegram_username: agency.telegram_username ?? '',
          instagram_url: agency.instagram_url ?? '',
          website_url: agency.website_url ?? '',
          address: agency.address ?? '',
          city: agency.city ?? '',
          country: agency.country ?? 'Uzbekistan',
        });
        setLogoUrl(agency.logo_url ?? '');
      }
      setLoading(false);
    });
  }, [reset]);

  async function onSubmit(data: AgencyProfileData) {
    const result = await upsertAgencyProfileAction({
      name: data.name,
      slug: data.slug,
      logo_url: logoUrl || null,
      description: data.description || null,
      phone: data.phone || null,
      telegram_username: data.telegram_username || null,
      instagram_url: data.instagram_url || null,
      website_url: data.website_url || null,
      address: data.address || null,
      city: data.city || null,
      country: data.country || 'Uzbekistan',
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t.agencyProfileForm.profileSaved);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{t.agencyProfileForm.title}</h1>
        <p className="text-sm text-muted-foreground">{t.agencyProfileForm.subtitle}</p>
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
              <Label htmlFor="slug">{t.agencyProfileForm.urlSlug} *</Label>
              <Input id="slug" placeholder={t.agencyProfileForm.urlSlugPlaceholder} {...register('slug')} />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
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
