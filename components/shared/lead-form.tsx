'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { leadFormSchema, type LeadFormData } from '@/lib/validators';
import { submitLead } from '@/features/leads/actions';
import { useTranslation } from '@/lib/i18n';
import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface LeadFormProps {
  tourId: string;
  agencyId: string;
}

export function LeadForm({ tourId, agencyId }: LeadFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
  });

  async function onSubmit(data: LeadFormData) {
    const result = await submitLead(tourId, agencyId, data);
    if (result.success) {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center py-8 text-center gap-3">
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        <h3 className="font-semibold text-lg">{t.leadForm.submitted}</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {t.leadForm.submittedHint}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">{t.leadForm.fullName} *</Label>
        <Input id="full_name" placeholder={t.leadForm.fullNamePlaceholder} {...register('full_name')} />
        {errors.full_name && (
          <p className="text-xs text-destructive">{errors.full_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">{t.leadForm.phone} *</Label>
        <Input id="phone" type="tel" placeholder={t.leadForm.phonePlaceholder} {...register('phone')} />
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="telegram_username">{t.leadForm.telegramUsername}</Label>
        <Input
          id="telegram_username"
          placeholder="@username"
          {...register('telegram_username')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">{t.leadForm.comment}</Label>
        <Textarea
          id="comment"
          placeholder={t.leadForm.commentPlaceholder}
          rows={3}
          {...register('comment')}
        />
        {errors.comment && (
          <p className="text-xs text-destructive">{errors.comment.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {t.leadForm.submit}
      </Button>
    </form>
  );
}
