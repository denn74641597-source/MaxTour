'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { leadFormSchema, type LeadFormData } from '@/lib/validators';
import { submitLead } from '@/features/leads/actions';
import { useTranslation } from '@/lib/i18n';
import { useProfile } from '@/hooks/use-profile';
import { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Users, User, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LeadFormProps {
  tourId: string;
  agencyId: string;
  onClose?: () => void;
}

export function LeadForm({ tourId, agencyId, onClose }: LeadFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const { t } = useTranslation();
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: { people_count: 1 },
  });

  // Auto-fill from profile when loaded
  useEffect(() => {
    if (profile) {
      if (profile.full_name) setValue('full_name', profile.full_name);
      if (profile.phone) setValue('phone', profile.phone);
      if (profile.telegram_username) setValue('telegram_username', profile.telegram_username);
    }
  }, [profile, setValue]);

  // If not logged in, redirect to login
  useEffect(() => {
    if (!profileLoading && !profile) {
      router.push('/profile');
    }
  }, [profileLoading, profile, router]);

  async function onSubmit(data: LeadFormData) {
    const result = await submitLead(tourId, agencyId, data);
    if (result.success) {
      setSubmitted(true);
    }
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center py-8 text-center gap-3">
        <div className="size-14 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h3 className="font-bold text-lg">{t.leadForm.submitted}</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {t.leadForm.submittedHint}
        </p>
        {onClose && (
          <Button variant="outline" className="mt-2" onClick={onClose}>
            {t.common.close}
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* People Count */}
      <div className="space-y-2">
        <Label htmlFor="people_count" className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-primary" />
          {t.leadForm.peopleCount} *
        </Label>
        <Input
          id="people_count"
          type="number"
          min={1}
          max={100}
          {...register('people_count', { valueAsNumber: true })}
        />
        {errors.people_count && (
          <p className="text-xs text-destructive">{errors.people_count.message}</p>
        )}
      </div>

      {/* Name (auto-filled) */}
      <div className="space-y-2">
        <Label htmlFor="full_name" className="flex items-center gap-1.5">
          <User className="h-4 w-4 text-primary" />
          {t.leadForm.fullName} *
        </Label>
        <Input id="full_name" placeholder={t.leadForm.fullNamePlaceholder} {...register('full_name')} />
        {errors.full_name && (
          <p className="text-xs text-destructive">{errors.full_name.message}</p>
        )}
      </div>

      {/* Phone (auto-filled) */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-1.5">
          <Phone className="h-4 w-4 text-primary" />
          {t.leadForm.phone} *
        </Label>
        <Input id="phone" type="tel" placeholder={t.leadForm.phonePlaceholder} {...register('phone')} />
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {t.leadForm.submit}
      </Button>
    </form>
  );
}
