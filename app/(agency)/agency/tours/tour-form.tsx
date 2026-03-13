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
import { MultiImageUploader } from '@/components/shared/multi-image-uploader';
import { tourSchema, type TourFormData } from '@/lib/validators';
import { slugify } from '@/lib/utils';
import { Loader2, MapPin, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';

interface TourFormProps {
  initialData?: Partial<TourFormData> & {
    cover_image_url?: string | null;
    hotel_images?: string[];
    destinations?: string[];
    airline?: string | null;
    extra_charges?: { name: string; amount: number }[];
  };
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

  // New fields state
  const [destinations, setDestinations] = useState<string[]>(
    initialData?.destinations ?? []
  );
  const [newDestination, setNewDestination] = useState('');
  const [hotelImages, setHotelImages] = useState<string[]>(
    initialData?.hotel_images ?? []
  );
  const [extraCharges, setExtraCharges] = useState<{ name: string; amount: number }[]>(
    initialData?.extra_charges ?? []
  );
  const [newChargeName, setNewChargeName] = useState('');
  const [newChargeAmount, setNewChargeAmount] = useState('');

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

  function addDestination() {
    if (!newDestination.trim() || destinations.length >= 3) return;
    setDestinations((prev) => [...prev, newDestination.trim()]);
    setNewDestination('');
  }

  function removeDestination(index: number) {
    setDestinations((prev) => prev.filter((_, i) => i !== index));
  }

  function addExtraCharge() {
    if (!newChargeName.trim() || !newChargeAmount) return;
    setExtraCharges((prev) => [
      ...prev,
      { name: newChargeName.trim(), amount: Number(newChargeAmount) },
    ]);
    setNewChargeName('');
    setNewChargeAmount('');
  }

  function removeExtraCharge(index: number) {
    setExtraCharges((prev) => prev.filter((_, i) => i !== index));
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
      hotel_booking_url: data.hotel_booking_url || null,
      hotel_images: hotelImages,
      destinations: destinations,
      airline: data.airline || null,
      extra_charges: extraCharges,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        <CardContent className="p-4 space-y-3">
          <h2 className="font-semibold text-sm">{t.agencyTours.basicInfo}</h2>

          <div className="space-y-1.5">
            <Label htmlFor="title">{t.agencyTours.titleLabel} *</Label>
            <Input id="title" placeholder={t.agencyTours.titlePlaceholder} {...register('title')} onBlur={autoSlug} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">{t.agencyTours.urlSlug} *</Label>
            <Input id="slug" placeholder={t.agencyTours.urlSlugPlaceholder} {...register('slug')} />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="short_description">{t.agencyTours.shortDescription}</Label>
            <Textarea id="short_description" placeholder={t.agencyTours.shortDescriptionPlaceholder} rows={2} {...register('short_description')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="full_description">{t.agencyTours.fullDescription}</Label>
            <Textarea id="full_description" placeholder={t.agencyTours.fullDescriptionPlaceholder} rows={4} {...register('full_description')} />
          </div>
        </CardContent>
      </Card>

      {/* Destination & Route */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-semibold text-sm">{t.agencyTours.destinationDates}</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="country">{t.agencyTours.country} *</Label>
              <Input id="country" placeholder={t.agencyTours.countryPlaceholder} {...register('country')} />
              {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">{t.agencyTours.city}</Label>
              <Input id="city" placeholder={t.agencyTours.cityPlaceholder} {...register('city')} />
            </div>
          </div>

          {/* Multi-city destinations */}
          <div className="space-y-2">
            <Label>{t.agencyTours.destinations}</Label>
            <p className="text-xs text-muted-foreground">{t.agencyTours.destinationsHint}</p>
            {destinations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {destinations.map((dest, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1.5 text-sm font-medium"
                  >
                    <MapPin className="h-3 w-3" />
                    <span>{dest}</span>
                    <button
                      type="button"
                      onClick={() => removeDestination(i)}
                      className="ml-0.5 hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {destinations.length < 3 && (
              <div className="flex gap-2">
                <Input
                  placeholder={t.agencyTours.destinationPlaceholder}
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDestination(); } }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addDestination}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="departure_date">{t.agencyTours.departureDate}</Label>
              <Input id="departure_date" type="date" {...register('departure_date')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="return_date">{t.agencyTours.returnDate}</Label>
              <Input id="return_date" type="date" {...register('return_date')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="duration_days">{t.agencyTours.durationDays}</Label>
            <Input id="duration_days" type="number" min={1} {...register('duration_days')} />
          </div>
        </CardContent>
      </Card>

      {/* Pricing & Seats */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-semibold text-sm">{t.agencyTours.pricingAvailability}</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">{t.agencyTours.price} *</Label>
              <Input id="price" type="number" min={0} step="0.01" placeholder="850" {...register('price')} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{t.agencyTours.currency}</Label>
              <Select defaultValue={initialData?.currency || 'USD'} onValueChange={(v) => setValue('currency', v as 'USD' | 'UZS' | 'EUR')}>
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
            <div className="space-y-1.5">
              <Label htmlFor="seats_total">{t.agencyTours.totalSeats}</Label>
              <Input id="seats_total" type="number" min={1} {...register('seats_total')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seats_left">{t.agencyTours.seatsLeft}</Label>
              <Input id="seats_left" type="number" min={0} {...register('seats_left')} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extra Charges (optional) */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-semibold text-sm">{t.agencyTours.extraCharges}</h2>
          <p className="text-xs text-muted-foreground">{t.agencyTours.extraChargesHint}</p>

          {extraCharges.length > 0 && (
            <div className="space-y-2">
              {extraCharges.map((charge, i) => (
                <div key={i} className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2 text-sm">
                  <span className="flex-1 font-medium text-slate-700">{charge.name}</span>
                  <span className="text-amber-700 font-bold">${charge.amount}</span>
                  <button type="button" onClick={() => removeExtraCharge(i)} className="text-red-400 hover:text-red-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder={t.agencyTours.extraChargeName}
              value={newChargeName}
              onChange={(e) => setNewChargeName(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder={t.agencyTours.extraChargeAmount}
              type="number"
              min={0}
              value={newChargeAmount}
              onChange={(e) => setNewChargeAmount(e.target.value)}
              className="w-24"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExtraCharge(); } }}
            />
            <Button type="button" variant="outline" size="sm" onClick={addExtraCharge}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Accommodation, Transport & Airline */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-semibold text-sm">{t.agencyTours.accommodationTransport}</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="hotel_name">{t.agencyTours.hotelName}</Label>
              <Input id="hotel_name" placeholder={t.agencyTours.hotelNamePlaceholder} {...register('hotel_name')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hotel_stars">{t.agencyTours.stars}</Label>
              <Input id="hotel_stars" type="number" min={1} max={5} {...register('hotel_stars')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hotel_booking_url">{t.agencyTours.hotelBookingUrl}</Label>
            <Input id="hotel_booking_url" placeholder={t.agencyTours.hotelBookingUrlPlaceholder} {...register('hotel_booking_url')} />
          </div>

          {/* Hotel Images */}
          <div className="space-y-2">
            <Label>{t.agencyTours.hotelImages}</Label>
            <p className="text-xs text-muted-foreground">{t.agencyTours.hotelImagesHint}</p>
            <MultiImageUploader
              values={hotelImages}
              onChange={setHotelImages}
              maxImages={4}
              label={t.agencyTours.uploadHotelImage}
              folder="hotels"
            />
          </div>

          {/* Airline (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="airline">{t.agencyTours.airline}</Label>
            <Input id="airline" placeholder={t.agencyTours.airlinePlaceholder} {...register('airline')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t.agencyTours.mealType}</Label>
              <Select defaultValue={initialData?.meal_type || 'none'} onValueChange={(v) => setValue('meal_type', v as 'none' | 'breakfast' | 'half_board' | 'full_board' | 'all_inclusive')}>
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
            <div className="space-y-1.5">
              <Label>{t.agencyTours.transport}</Label>
              <Select defaultValue={initialData?.transport_type || 'flight'} onValueChange={(v) => setValue('transport_type', v as 'flight' | 'bus' | 'train' | 'self' | 'mixed')}>
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
        <CardContent className="p-4 space-y-3">
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
