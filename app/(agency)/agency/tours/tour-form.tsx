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

interface TourFormProps {
  initialData?: Partial<TourFormData>;
  tourId?: string;
}

export function TourForm({ initialData, tourId }: TourFormProps) {
  const router = useRouter();
  const [coverUrl, setCoverUrl] = useState(initialData?.slug ?? '');
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
    const payload = {
      ...data,
      included_services: includedServices,
      excluded_services: excludedServices,
    };

    // In production, call a server action to create/update the tour
    console.log(isEditing ? 'Update tour:' : 'Create tour:', payload);
    toast.success(isEditing ? 'Tour updated' : 'Tour created');
    router.push('/agency/tours');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Cover Image */}
      <Card>
        <CardContent className="p-4">
          <Label className="mb-2 block">Cover Image</Label>
          <ImageUploader
            value={coverUrl}
            onChange={setCoverUrl}
            label="Upload cover image"
          />
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h2 className="font-semibold text-sm">Basic Information</h2>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" placeholder="Istanbul Cultural Discovery" {...register('title')} onBlur={autoSlug} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug *</Label>
            <Input id="slug" placeholder="istanbul-cultural-discovery" {...register('slug')} />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="short_description">Short Description</Label>
            <Textarea id="short_description" placeholder="Brief summary..." rows={2} {...register('short_description')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_description">Full Description</Label>
            <Textarea id="full_description" placeholder="Detailed tour description..." rows={5} {...register('full_description')} />
          </div>
        </CardContent>
      </Card>

      {/* Destination */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h2 className="font-semibold text-sm">Destination & Dates</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input id="country" placeholder="Turkey" {...register('country')} />
              {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="Istanbul" {...register('city')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="departure_date">Departure Date</Label>
              <Input id="departure_date" type="date" {...register('departure_date')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="return_date">Return Date</Label>
              <Input id="return_date" type="date" {...register('return_date')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration_days">Duration (days)</Label>
            <Input id="duration_days" type="number" min={1} {...register('duration_days')} />
          </div>
        </CardContent>
      </Card>

      {/* Pricing & Seats */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h2 className="font-semibold text-sm">Pricing & Availability</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input id="price" type="number" min={0} step="0.01" placeholder="850" {...register('price')} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
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
              <Label htmlFor="seats_total">Total Seats</Label>
              <Input id="seats_total" type="number" min={1} {...register('seats_total')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seats_left">Seats Left</Label>
              <Input id="seats_left" type="number" min={0} {...register('seats_left')} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accommodation & Transport */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h2 className="font-semibold text-sm">Accommodation & Transport</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="hotel_name">Hotel Name</Label>
              <Input id="hotel_name" placeholder="Grand Star Hotel" {...register('hotel_name')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hotel_stars">Stars</Label>
              <Input id="hotel_stars" type="number" min={1} max={5} {...register('hotel_stars')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Meal Type</Label>
              <Select defaultValue="none" onValueChange={(v) => setValue('meal_type', v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="half_board">Half Board</SelectItem>
                  <SelectItem value="full_board">Full Board</SelectItem>
                  <SelectItem value="all_inclusive">All Inclusive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Transport</Label>
              <Select defaultValue="flight" onValueChange={(v) => setValue('transport_type', v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="flight">Flight</SelectItem>
                  <SelectItem value="bus">Bus</SelectItem>
                  <SelectItem value="train">Train</SelectItem>
                  <SelectItem value="self">Self</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="visa_required" {...register('visa_required')} className="h-4 w-4 rounded border" />
            <Label htmlFor="visa_required">Visa Required</Label>
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h2 className="font-semibold text-sm">Included Services</h2>
          <div className="space-y-2">
            {includedServices.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-emerald-500">✓</span>
                <span className="flex-1">{s}</span>
                <button type="button" onClick={() => removeService('included', i)} className="text-red-400 text-xs">Remove</button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="Add included service..."
                value={newIncluded}
                onChange={(e) => setNewIncluded(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addService('included'); } }}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => addService('included')}>Add</Button>
            </div>
          </div>

          <h2 className="font-semibold text-sm pt-2">Excluded Services</h2>
          <div className="space-y-2">
            {excludedServices.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-red-400">✕</span>
                <span className="flex-1">{s}</span>
                <button type="button" onClick={() => removeService('excluded', i)} className="text-red-400 text-xs">Remove</button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="Add excluded service..."
                value={newExcluded}
                onChange={(e) => setNewExcluded(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addService('excluded'); } }}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => addService('excluded')}>Add</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditing ? 'Update Tour' : 'Save as Draft'}
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
          Submit for Review
        </Button>
      </div>
    </form>
  );
}
