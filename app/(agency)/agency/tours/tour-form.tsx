'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUploader } from '@/components/shared/image-uploader';
import { tourSchema, type TourFormData } from '@/lib/validators';
import { slugify } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';

interface TourFormProps {
  initialData?: Partial<TourFormData> & { cover_image_url?: string | null };
  tourId?: string;
}

export function TourForm({ initialData, tourId }: TourFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [coverUrl, setCoverUrl] = useState(initialData?.cover_image_url ?? '');
  const [includedServices, setIncludedServices] = useState<string[]>(
    initialData?.included_services ?? []
  );
  const [excludedServices, setExcludedServices] = useState<string[]>(
    initialData?.excluded_services ?? []
  );
  const [newIncluded, setNewIncluded] = useState('');
  const [newExcluded, setNewExcluded] = useState('');

  const isEditing = !!tourId;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TourFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(tourSchema) as any,
    defaultValues: {
      currency: 'USD',
      meal_type: 'none',
      transport_type: 'flight',
      visa_required: false,
      status: 'draft',
      ...initialData,
    },
  });

  const title = watch('title');

  function autoSlug() {
    if (title) {
      setValue('slug', slugify(title));
    }
  }

  function addService(type: 'included' | 'excluded') {
    const value = type === 'included' ? newIncluded : newExcluded;
    if (!value.trim()) return;
    if (type === 'included') {
      setIncludedServices((prev) => [...prev, value.trim()]);
      setNewIncluded('');
    } else {
      setExcludedServices((prev) => [...prev, value.trim()]);
      setNewExcluded('');
    }
  }

  function removeService(type: 'included' | 'excluded', index: number) {
    if (type === 'included') {
      setIncludedServices((prev) => prev.filter((_, i) => i !== index));
    } else {
      setExcludedServices((prev) => prev.filter((_, i) => i !== index));
    }
  }

  async function onSubmit(data: TourFormData) {
    const supabase = createClient();

    // Get current user's agency
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Not authenticated');
      return;
    }

    const { data: agency } = await supabase
      .from('agencies')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!agency) {
      toast.error('Agency not found');
      return;
    }

    const payload = {
      title: data.title,
      slug: data.slug,
      cover_image_url: coverUrl || null,
      short_description: data.short_description || null,
      full_description: data.full_description || null,
      country: data.country,
      city: data.city || null,
      departure_date: data.departure_date || null,
      return_date: data.return_date || null,
      duration_days: data.duration_days ? Number(data.duration_days) : null,
      price: Number(data.price),
      currency: data.currency || 'USD',
      seats_total: data.seats_total ? Number(data.seats_total) : null,
      seats_left: data.seats_left ? Number(data.seats_left) : null,
      hotel_name: data.hotel_name || null,
      hotel_stars: data.hotel_stars ? Number(data.hotel_stars) : null,
      meal_type: data.meal_type || 'none',
      transport_type: data.transport_type || 'flight',
      visa_required: data.visa_required || false,
      included_services: includedServices,
      excluded_services: excludedServices,
      status: data.status || 'draft',
      agency_id: agency.id,
      updated_at: new Date().toISOString(),
    };

    if (isEditing && tourId) {
      const { error } = await supabase
        .from('tours')
        .update(payload)
        .eq('id', tourId);

      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(t.agencyTours.tourUpdated);
    } else {
      const { error } = await supabase
        .from('tours')
        .insert(payload);

      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(t.agencyTours.tourCreated);
    }

    router.push('/agency/tours');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Cover Image */}
      <Card>
        <CardContent className="p-4">
          <Label className="mb-2 block">{t.agencyTours.coverImage}</Label>
          <ImageUploader
            value={coverUrl}
            onChange={setCoverUrl}
            label={t.agencyTours.uploadCoverImage}
          />
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h2 className="font-semibold text-sm">{t.agencyTours.basicInfo}</h2>

          <div className="space-y-2">
            <Label htmlFor="title">{t.agencyTours.titleLabel} *</Label>
            <Input id="title" placeholder={t.agencyTours.titlePlaceholder} {...register('title')} onBlur={autoSlug} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">{t.agencyTours.urlSlug} *</Label>
            <Input id="slug" placeholder={t.agencyTours.urlSlugPlaceholder} {...register('slug')} />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="short_description">{t.agencyTours.shortDescription}</Label>
            <Textarea id="short_description" placeholder={t.agencyTours.shortDescriptionPlaceholder} rows={2} {...register('short_description')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_description">{t.agencyTours.fullDescription}</Label>
            <Textarea id="full_description" placeholder={t.agencyTours.fullDescriptionPlaceholder} rows={5} {...register('full_description')} />
          </div>
        </CardContent>
      </Card>

      {/* Destination */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h2 className="font-semibold text-sm">{t.agencyTours.destinationDates}</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="country">{t.agencyTours.country} *</Label>
              <Input id="country" placeholder={t.agencyTours.countryPlaceholder} {...register('country')} />
              {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">{t.agencyTours.city}</Label>
              <Input id="city" placeholder={t.agencyTours.cityPlaceholder} {...register('city')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="departure_date">{t.agencyTours.departureDate}</Label>
              <Input id="departure_date" type="date" {...register('departure_date')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="return_date">{t.agencyTours.returnDate}</Label>
              <Input id="return_date" type="date" {...register('return_date')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration_days">{t.agencyTours.durationDays}</Label>
            <Input id="duration_days" type="number" min={1} {...register('duration_days')} />
          </div>
        </CardContent>
      </Card>

      {/* Pricing & Seats */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h2 className="font-semibold text-sm">{t.agencyTours.pricingAvailability}</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="price">{t.agencyTours.price} *</Label>
              <Input id="price" type="number" min={0} step="0.01" placeholder="850" {...register('price')} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t.agencyTours.currency}</Label>
              <Select defaultValue="USD" onValueChange={(v) => setValue('currency', v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="UZS">UZS</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="seats_total">{t.agencyTours.totalSeats}</Label>
              <Input id="seats_total" type="number" min={1} {...register('seats_total')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seats_left">{t.agencyTours.seatsLeft}</Label>
              <Input id="seats_left" type="number" min={0} {...register('seats_left')} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accommodation & Transport */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h2 className="font-semibold text-sm">{t.agencyTours.accommodationTransport}</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="hotel_name">{t.agencyTours.hotelName}</Label>
              <Input id="hotel_name" placeholder={t.agencyTours.hotelNamePlaceholder} {...register('hotel_name')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hotel_stars">{t.agencyTours.stars}</Label>
              <Input id="hotel_stars" type="number" min={1} max={5} {...register('hotel_stars')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t.agencyTours.mealType}</Label>
              <Select defaultValue="none" onValueChange={(v) => setValue('meal_type', v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t.mealTypes.none}</SelectItem>
                  <SelectItem value="breakfast">{t.mealTypes.breakfast}</SelectItem>
                  <SelectItem value="half_board">{t.mealTypes.half_board}</SelectItem>
                  <SelectItem value="full_board">{t.mealTypes.full_board}</SelectItem>
                  <SelectItem value="all_inclusive">{t.mealTypes.all_inclusive}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.agencyTours.transport}</Label>
              <Select defaultValue="flight" onValueChange={(v) => setValue('transport_type', v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="flight">{t.transportTypes.flight}</SelectItem>
                  <SelectItem value="bus">{t.transportTypes.bus}</SelectItem>
                  <SelectItem value="train">{t.transportTypes.train}</SelectItem>
                  <SelectItem value="self">{t.transportTypes.self}</SelectItem>
                  <SelectItem value="mixed">{t.transportTypes.mixed}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="visa_required" {...register('visa_required')} className="h-4 w-4 rounded border" />
            <Label htmlFor="visa_required">{t.agencyTours.visaRequired}</Label>
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h2 className="font-semibold text-sm">{t.agencyTours.includedServices}</h2>
          <div className="space-y-2">
            {includedServices.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-emerald-500">✓</span>
                <span className="flex-1">{s}</span>
                <button type="button" onClick={() => removeService('included', i)} className="text-red-400 text-xs">{t.common.remove}</button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder={t.agencyTours.addIncludedService}
                value={newIncluded}
                onChange={(e) => setNewIncluded(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addService('included'); } }}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => addService('included')}>{t.common.add}</Button>
            </div>
          </div>

          <h2 className="font-semibold text-sm pt-2">{t.agencyTours.excludedServices}</h2>
          <div className="space-y-2">
            {excludedServices.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-red-400">✕</span>
                <span className="flex-1">{s}</span>
                <button type="button" onClick={() => removeService('excluded', i)} className="text-red-400 text-xs">{t.common.remove}</button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder={t.agencyTours.addExcludedService}
                value={newExcluded}
                onChange={(e) => setNewExcluded(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addService('excluded'); } }}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => addService('excluded')}>{t.common.add}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditing ? t.agencyTours.updateTour : t.agencyTours.saveAsDraft}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={isSubmitting}
          onClick={() => {
            setValue('status', 'pending');
            handleSubmit(onSubmit)();
          }}
        >
          {t.agencyTours.submitForReview}
        </Button>
      </div>
    </form>
  );
}
