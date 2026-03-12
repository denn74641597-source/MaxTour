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
import { useState } from 'react';
import { toast } from 'sonner';

export default function AgencyProfilePage() {
  const [logoUrl, setLogoUrl] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AgencyProfileData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(agencyProfileSchema) as any,
    defaultValues: {
      country: 'Uzbekistan',
    },
  });

  async function onSubmit(data: AgencyProfileData) {
    // In production, this would call a server action to upsert the agency profile
    console.log('Agency profile data:', { ...data, logo_url: logoUrl });
    toast.success('Profile saved successfully');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Agency Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your company information</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Logo */}
        <Card>
          <CardContent className="p-4">
            <Label className="mb-2 block">Company Logo</Label>
            <ImageUploader
              value={logoUrl}
              onChange={setLogoUrl}
              label="Upload logo"
            />
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold text-sm">Basic Information</h2>

            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input id="name" placeholder="Your travel agency name" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug *</Label>
              <Input id="slug" placeholder="your-agency-name" {...register('slug')} />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Tell customers about your agency..." rows={4} {...register('description')} />
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold text-sm">Contact Information</h2>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" placeholder="+998 90 123 45 67" {...register('phone')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram_username">Telegram</Label>
              <Input id="telegram_username" placeholder="@username" {...register('telegram_username')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram_url">Instagram URL</Label>
              <Input id="instagram_url" placeholder="https://instagram.com/..." {...register('instagram_url')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url">Website</Label>
              <Input id="website_url" placeholder="https://..." {...register('website_url')} />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold text-sm">Location</h2>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" placeholder="Street address" {...register('address')} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="Tashkent" {...register('city')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" {...register('country')} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Profile
        </Button>
      </form>
    </div>
  );
}
