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
import { Loader2, MapPin, Plus, X, Hotel, Star, Search, Globe, Map, Mountain, Landmark, Heart, Compass, TreePine } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import { COUNTRIES, CITIES_BY_COUNTRY, AIRLINES, UZ_REGIONS, UZ_DISTRICTS } from '@/lib/tour-data';
import type { TourHotel, TourType, DomesticTourCategory } from '@/types';

interface TourFormProps {
  initialData?: Partial<TourFormData> & {
    cover_image_url?: string | null;
    hotel_images?: string[];
    hotels?: TourHotel[];
    destinations?: string[];
    airline?: string | null;
    extra_charges?: { name: string; amount: number }[];
    operator_telegram_username?: string | null;
    tour_type?: TourType;
    domestic_category?: DomesticTourCategory | null;
    region?: string | null;
    district?: string | null;
    meeting_point?: string | null;
    what_to_bring?: string[];
    guide_name?: string | null;
    guide_phone?: string | null;
  };
  tourId?: string;
}

export function TourForm({ initialData, tourId }: TourFormProps) {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [coverUrl, setCoverUrl] = useState(initialData?.cover_image_url ?? '');
  const [tourType, setTourType] = useState<TourType>(initialData?.tour_type ?? 'international');
  const [tourTypeSelected, setTourTypeSelected] = useState(!!tourId || !!initialData?.tour_type);
  const [includedServices, setIncludedServices] = useState<string[]>(
    initialData?.included_services ?? []
  );
  const [newIncluded, setNewIncluded] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [airlineSearch, setAirlineSearch] = useState('');

  // New fields state
  const [destinations, setDestinations] = useState<string[]>(
    initialData?.destinations ?? []
  );
  const [newDestination, setNewDestination] = useState('');
  const [hotels, setHotels] = useState<TourHotel[]>(
    initialData?.hotels ?? []
  );
  const [extraCharges, setExtraCharges] = useState<{ name: string; amount: number }[]>(
    initialData?.extra_charges ?? []
  );
  const [newChargeName, setNewChargeName] = useState('');
  const [newChargeAmount, setNewChargeAmount] = useState('');

  // Domestic tour state
  const [regionSearch, setRegionSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [whatToBring, setWhatToBring] = useState<string[]>(
    initialData?.what_to_bring ?? []
  );
  const [newBringItem, setNewBringItem] = useState('');

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
      tour_type: 'international',
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

  function addService() {
    if (!newIncluded.trim()) return;
    setIncludedServices((prev) => [...prev, newIncluded.trim()]);
    setNewIncluded('');
  }

  function removeService(index: number) {
    setIncludedServices((prev) => prev.filter((_, i) => i !== index));
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
      slug: data.slug || slugify(data.title),
      cover_image_url: coverUrl || null,
      full_description: data.full_description || null,
      tour_type: tourType,
      // International fields
      country: tourType === 'international' ? (data.country || null) : 'O\'zbekiston',
      city: tourType === 'international' ? (data.city || null) : (data.district || null),
      departure_date: data.departure_date || null,
      return_date: data.return_date || null,
      duration_days: data.duration_days ? Number(data.duration_days) : null,
      price: hotels.length > 0 ? hotels[0].price : Number(data.price),
      old_price: data.old_price ? Number(data.old_price) : null,
      currency: tourType === 'domestic' ? 'UZS' : (data.currency || 'USD'),
      seats_total: data.seats_total ? Number(data.seats_total) : null,
      seats_left: data.seats_left ? Number(data.seats_left) : null,
      hotel_name: hotels.length > 0 ? hotels[0].name : (data.hotel_name || null),
      hotel_stars: hotels.length > 0 ? hotels[0].stars : (data.hotel_stars ? Number(data.hotel_stars) : null),
      hotel_booking_url: hotels.length > 0 ? hotels[0].booking_url : (data.hotel_booking_url || null),
      hotel_images: hotels.length > 0 ? hotels[0].images : [],
      hotels: hotels,
      destinations: destinations,
      airline: tourType === 'international' ? (data.airline || null) : null,
      extra_charges: extraCharges,
      meal_type: data.meal_type || 'none',
      transport_type: data.transport_type || (tourType === 'domestic' ? 'bus' : 'flight'),
      visa_required: tourType === 'domestic' ? false : (data.visa_required || false),
      included_services: includedServices,
      excluded_services: [],
      operator_telegram_username: data.operator_telegram_username || null,
      // Domestic fields
      domestic_category: tourType === 'domestic' ? (data.domestic_category || null) : null,
      region: tourType === 'domestic' ? (data.region || null) : null,
      district: tourType === 'domestic' ? (data.district || null) : null,
      meeting_point: tourType === 'domestic' ? (data.meeting_point || null) : null,
      what_to_bring: tourType === 'domestic' ? whatToBring : [],
      guide_name: tourType === 'domestic' ? (data.guide_name || null) : null,
      guide_phone: tourType === 'domestic' ? (data.guide_phone || null) : null,
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

  function addBringItem() {
    if (!newBringItem.trim()) return;
    setWhatToBring((prev) => [...prev, newBringItem.trim()]);
    setNewBringItem('');
  }

  function removeBringItem(index: number) {
    setWhatToBring((prev) => prev.filter((_, i) => i !== index));
  }

  // If tour type not yet selected, show selection screen
  if (!tourTypeSelected) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold">{t.domesticTour.tourTypeSelection}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t.domesticTour.tourTypeHint}</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button
            type="button"
            onClick={() => {
              setTourType('international');
              setValue('tour_type', 'international');
              setValue('currency', 'USD');
              setValue('transport_type', 'flight');
              setTourTypeSelected(true);
            }}
            className="flex items-start gap-4 p-5 bg-white border-2 border-slate-200 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all text-left"
          >
            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <Globe className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-base">{t.domesticTour.international}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{t.domesticTour.internationalHint}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setTourType('domestic');
              setValue('tour_type', 'domestic');
              setValue('currency', 'UZS');
              setValue('transport_type', 'bus');
              setValue('visa_required', false);
              setTourTypeSelected(true);
            }}
            className="flex items-start gap-4 p-5 bg-white border-2 border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
          >
            <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <Map className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-base">{t.domesticTour.domestic}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{t.domesticTour.domesticHint}</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  const isDomestic = tourType === 'domestic';
  const categoryIcons: Record<string, React.ReactNode> = {
    excursion: <Compass className="h-4 w-4" />,
    nature: <Mountain className="h-4 w-4" />,
    historical: <Landmark className="h-4 w-4" />,
    pilgrimage: <Heart className="h-4 w-4" />,
    recreation: <TreePine className="h-4 w-4" />,
    adventure: <Map className="h-4 w-4" />,
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Tour Type Badge */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${isDomestic ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
          {isDomestic ? <Map className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
          {isDomestic ? t.domesticTour.domestic : t.domesticTour.international}
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setTourTypeSelected(false)}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            {t.common.edit}
          </button>
        )}
      </div>

      <input type="hidden" {...register('tour_type')} />
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

          <input type="hidden" {...register('slug')} />

          <div className="space-y-1.5">
            <Label htmlFor="full_description">{t.agencyTours.fullDescription}</Label>
            <Textarea id="full_description" placeholder={t.agencyTours.fullDescriptionPlaceholder} rows={4} {...register('full_description')} />
          </div>

          {/* Domestic category selection */}
          {isDomestic && (
            <div className="space-y-2">
              <Label>{t.domesticTour.category} *</Label>
              <p className="text-xs text-muted-foreground">{t.domesticTour.categoryHint}</p>
              <div className="grid grid-cols-2 gap-2">
                {(['excursion', 'nature', 'historical', 'pilgrimage', 'recreation', 'adventure'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setValue('domestic_category', cat)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                      watch('domestic_category') === cat
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      watch('domestic_category') === cat ? 'bg-emerald-100' : 'bg-slate-100'
                    }`}>
                      {categoryIcons[cat]}
                    </div>
                    {t.domesticTour[cat]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Destination & Route - International */}
      {!isDomestic && (
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-semibold text-sm">{t.agencyTours.destinationDates}</h2>

          <div className="grid grid-cols-1 gap-3">
            {/* Country searchable dropdown */}
            <div className="space-y-1.5">
              <Label>{t.agencyTours.country} *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.agencyTours.countryPlaceholder}
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {countrySearch && (
                <div className="border rounded-lg max-h-48 overflow-y-auto bg-white shadow-lg">
                  {COUNTRIES[language].filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())).map((country) => (
                    <button
                      key={country}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-primary/10 transition-colors"
                      onClick={() => {
                        setValue('country', country);
                        setCountrySearch('');
                        setValue('city', '');
                        setCitySearch('');
                      }}
                    >
                      {country}
                    </button>
                  ))}
                </div>
              )}
              {watch('country') && (
                <div className="flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1.5 text-sm font-medium w-fit">
                  <MapPin className="h-3 w-3" />
                  <span>{watch('country')}</span>
                  <button type="button" onClick={() => { setValue('country', ''); setValue('city', ''); }} className="hover:bg-primary/20 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
            </div>

            {/* City searchable dropdown */}
            <div className="space-y-1.5">
              <Label>{t.agencyTours.city}</Label>
              {(() => {
                const selectedCountry = watch('country');
                const availableCities = selectedCountry ? (CITIES_BY_COUNTRY[language][selectedCountry] ?? []) : [];
                return (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={selectedCountry ? t.agencyTours.cityPlaceholder : t.agencyTours.selectCountryFirst}
                        value={citySearch}
                        onChange={(e) => setCitySearch(e.target.value)}
                        className="pl-9"
                        disabled={!selectedCountry}
                      />
                    </div>
                    {citySearch && availableCities.length > 0 && (
                      <div className="border rounded-lg max-h-48 overflow-y-auto bg-white shadow-lg">
                        {availableCities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).map((city) => (
                          <button
                            key={city}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-primary/10 transition-colors"
                            onClick={() => {
                              setValue('city', city);
                              setCitySearch('');
                            }}
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    )}
                    {watch('city') && (
                      <div className="flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-3 py-1.5 text-sm font-medium w-fit">
                        <MapPin className="h-3 w-3" />
                        <span>{watch('city')}</span>
                        <button type="button" onClick={() => setValue('city', '')} className="hover:bg-blue-200 rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      )}

      {/* Destination & Route - Domestic */}
      {isDomestic && (
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-semibold text-sm">{t.domesticTour.regionDistrict}</h2>

          <div className="grid grid-cols-1 gap-3">
            {/* Region searchable dropdown */}
            <div className="space-y-1.5">
              <Label>{t.domesticTour.region} *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.domesticTour.selectRegion}
                  value={regionSearch}
                  onChange={(e) => setRegionSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {regionSearch && (
                <div className="border rounded-lg max-h-48 overflow-y-auto bg-white shadow-lg">
                  {(UZ_REGIONS[language] || UZ_REGIONS['uz']).filter(r =>
                    r.toLowerCase().includes(regionSearch.toLowerCase())
                  ).map((region) => (
                    <button
                      key={region}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-primary/10 transition-colors"
                      onClick={() => {
                        setValue('region', region);
                        setRegionSearch('');
                        setValue('district', '');
                        setDistrictSearch('');
                      }}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              )}
              {watch('region') && (
                <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 rounded-full px-3 py-1.5 text-sm font-medium w-fit">
                  <MapPin className="h-3 w-3" />
                  <span>{watch('region')}</span>
                  <button type="button" onClick={() => { setValue('region', ''); setValue('district', ''); }} className="hover:bg-emerald-200 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* District searchable dropdown */}
            <div className="space-y-1.5">
              <Label>{t.domesticTour.district}</Label>
              {(() => {
                const selectedRegion = watch('region');
                const regionData = UZ_DISTRICTS[language] || UZ_DISTRICTS['uz'];
                const availableDistricts = selectedRegion ? (regionData[selectedRegion] ?? []) : [];
                return (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={selectedRegion ? t.domesticTour.selectDistrict : t.domesticTour.selectRegionFirst}
                        value={districtSearch}
                        onChange={(e) => setDistrictSearch(e.target.value)}
                        className="pl-9"
                        disabled={!selectedRegion}
                      />
                    </div>
                    {districtSearch && availableDistricts.length > 0 && (
                      <div className="border rounded-lg max-h-48 overflow-y-auto bg-white shadow-lg">
                        {availableDistricts.filter(d => d.toLowerCase().includes(districtSearch.toLowerCase())).map((district) => (
                          <button
                            key={district}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-primary/10 transition-colors"
                            onClick={() => {
                              setValue('district', district);
                              setDistrictSearch('');
                            }}
                          >
                            {district}
                          </button>
                        ))}
                      </div>
                    )}
                    {watch('district') && (
                      <div className="flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-3 py-1.5 text-sm font-medium w-fit">
                        <MapPin className="h-3 w-3" />
                        <span>{watch('district')}</span>
                        <button type="button" onClick={() => setValue('district', '')} className="hover:bg-blue-200 rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      )}

      {/* Pricing & Seats */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-semibold text-sm">{t.agencyTours.pricingAvailability}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">{t.agencyTours.price} *</Label>
              <Input id="price" type="number" min={0} step="0.01" placeholder="850" {...register('price')} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="old_price">{t.agencyTours.oldPrice}</Label>
              <Input id="old_price" type="number" min={0} step="0.01" placeholder="1200" {...register('old_price')} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">{t.tours.hotels}</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setHotels((prev) => [...prev, { name: '', stars: null, price: 0, description: null, booking_url: null, images: [] }])}
            >
              <Plus className="h-4 w-4 mr-1" /> {t.tours.addHotel}
            </Button>
          </div>

          {hotels.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">{t.tours.addHotel}</p>
          )}

          {hotels.map((hotel, hotelIndex) => (
            <div key={hotelIndex} className="border border-slate-200 rounded-xl p-3 space-y-3 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hotel className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">#{hotelIndex + 1}</span>
                  {hotelIndex === 0 && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Asosiy</span>}
                </div>
                <button
                  type="button"
                  onClick={() => setHotels((prev) => prev.filter((_, i) => i !== hotelIndex))}
                  className="text-red-400 hover:text-red-500 text-xs"
                >
                  {t.tours.removeHotel}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t.agencyTours.hotelName} *</Label>
                  <Input
                    placeholder={t.agencyTours.hotelNamePlaceholder}
                    value={hotel.name}
                    onChange={(e) => {
                      const updated = [...hotels];
                      updated[hotelIndex] = { ...hotel, name: e.target.value };
                      setHotels(updated);
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.agencyTours.stars}</Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => {
                          const updated = [...hotels];
                          updated[hotelIndex] = { ...hotel, stars: star };
                          setHotels(updated);
                        }}
                        className="p-0.5"
                      >
                        <Star className={`h-5 w-5 ${hotel.stars && star <= hotel.stars ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{t.tours.hotelPrice} *</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="850"
                  value={hotel.price || ''}
                  onChange={(e) => {
                    const updated = [...hotels];
                    updated[hotelIndex] = { ...hotel, price: Number(e.target.value) };
                    setHotels(updated);
                    if (hotelIndex === 0) setValue('price', Number(e.target.value));
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t.tours.hotelDescription}</Label>
                <Textarea
                  placeholder={t.tours.hotelDescriptionPlaceholder}
                  rows={2}
                  value={hotel.description || ''}
                  onChange={(e) => {
                    const updated = [...hotels];
                    updated[hotelIndex] = { ...hotel, description: e.target.value || null };
                    setHotels(updated);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t.agencyTours.hotelBookingUrl}</Label>
                <Input
                  placeholder={t.agencyTours.hotelBookingUrlPlaceholder}
                  value={hotel.booking_url || ''}
                  onChange={(e) => {
                    const updated = [...hotels];
                    updated[hotelIndex] = { ...hotel, booking_url: e.target.value || null };
                    setHotels(updated);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>{t.agencyTours.hotelImages}</Label>
                <MultiImageUploader
                  values={hotel.images}
                  onChange={(imgs) => {
                    const updated = [...hotels];
                    updated[hotelIndex] = { ...hotel, images: imgs };
                    setHotels(updated);
                  }}
                  maxImages={4}
                  label={t.agencyTours.uploadHotelImage}
                  folder="hotels"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Transport & Airline */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-semibold text-sm">{t.agencyTours.accommodationTransport}</h2>

          {/* Airline searchable dropdown - international only */}
          {!isDomestic && (
          <div className="space-y-1.5">
            <Label>{t.agencyTours.airline}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.agencyTours.airlinePlaceholder}
                value={airlineSearch}
                onChange={(e) => setAirlineSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {airlineSearch && (
              <div className="border rounded-lg max-h-48 overflow-y-auto bg-white shadow-lg">
                {AIRLINES.filter(a => a.toLowerCase().includes(airlineSearch.toLowerCase())).map((airline) => (
                  <button
                    key={airline}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-primary/10 transition-colors"
                    onClick={() => {
                      setValue('airline', airline);
                      setAirlineSearch('');
                    }}
                  >
                    {airline}
                  </button>
                ))}
              </div>
            )}
            {watch('airline') && (
              <div className="flex items-center gap-2 bg-sky-100 text-sky-700 rounded-full px-3 py-1.5 text-sm font-medium w-fit">
                <span>{watch('airline')}</span>
                <button type="button" onClick={() => setValue('airline', '')} className="hover:bg-sky-200 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t.agencyTours.mealType}</Label>
              <Select
                defaultValue={initialData?.meal_type || 'none'}
                onValueChange={(v) => setValue('meal_type', v as 'none' | 'breakfast' | 'half_board' | 'full_board' | 'all_inclusive')}
              >
                <SelectTrigger>
                  <SelectValue>
                    {t.mealTypes[watch('meal_type') || 'none']}
                  </SelectValue>
                </SelectTrigger>
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
              <Select
                defaultValue={initialData?.transport_type || 'flight'}
                onValueChange={(v) => setValue('transport_type', v as 'flight' | 'bus' | 'train' | 'self' | 'mixed')}
              >
                <SelectTrigger>
                  <SelectValue>
                    {t.transportTypes[watch('transport_type') || 'flight']}
                  </SelectValue>
                </SelectTrigger>
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

          {!isDomestic && (
          <div className="flex items-center gap-2">
            <input type="checkbox" id="visa_required" {...register('visa_required')} className="h-4 w-4 rounded border" />
            <Label htmlFor="visa_required">{t.agencyTours.visaRequired}</Label>
          </div>
          )}
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
                <button type="button" onClick={() => removeService(i)} className="text-red-400 text-xs">{t.common.remove}</button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder={t.agencyTours.addIncludedService}
                value={newIncluded}
                onChange={(e) => setNewIncluded(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addService(); } }}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => addService()}>{t.common.add}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operator Telegram */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-semibold text-sm">{t.agencyTours.operatorTelegram}</h2>
          <p className="text-xs text-muted-foreground">{t.agencyTours.operatorTelegramHint}</p>
          <div className="space-y-1.5">
            <Label htmlFor="operator_telegram_username">{t.agencyTours.operatorTelegram}</Label>
            <Input
              id="operator_telegram_username"
              placeholder={t.agencyTours.operatorTelegramPlaceholder}
              {...register('operator_telegram_username')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Domestic-only sections */}
      {isDomestic && (
        <>
          {/* Meeting Point */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h2 className="font-semibold text-sm">{t.domesticTour.meetingPoint}</h2>
              <p className="text-xs text-muted-foreground">{t.domesticTour.meetingPointHint}</p>
              <div className="space-y-1.5">
                <Label htmlFor="meeting_point">{t.domesticTour.meetingPoint}</Label>
                <Textarea
                  id="meeting_point"
                  placeholder={t.domesticTour.meetingPointPlaceholder}
                  rows={2}
                  {...register('meeting_point')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Guide Info */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h2 className="font-semibold text-sm">{t.domesticTour.guideInfo}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="guide_name">{t.domesticTour.guideName}</Label>
                  <Input
                    id="guide_name"
                    placeholder={t.domesticTour.guideNamePlaceholder}
                    {...register('guide_name')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="guide_phone">{t.domesticTour.guidePhone}</Label>
                  <Input
                    id="guide_phone"
                    placeholder={t.domesticTour.guidePhonePlaceholder}
                    {...register('guide_phone')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What to Bring */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h2 className="font-semibold text-sm">{t.domesticTour.whatToBring}</h2>
              <p className="text-xs text-muted-foreground">{t.domesticTour.whatToBringHint}</p>
              {whatToBring.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {whatToBring.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 bg-amber-50 text-amber-700 rounded-full px-3 py-1.5 text-sm font-medium"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => removeBringItem(i)}
                        className="ml-0.5 hover:bg-amber-100 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder={t.domesticTour.addItem}
                  value={newBringItem}
                  onChange={(e) => setNewBringItem(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addBringItem(); } }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addBringItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Submit */}
      <div className="flex flex-col sm:flex-row gap-3">
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
