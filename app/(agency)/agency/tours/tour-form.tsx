'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
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
import { Loader2, MapPin, Plus, X, Hotel, Star, Search, Globe, Map, Mountain, Landmark, Heart, Compass, TreePine, ArrowLeft, Send, CalendarDays, Clock, DollarSign, Utensils, Bus, Plane, Image as ImageIcon, FileText, CheckCircle2, Phone, User, Eye, AlertTriangle } from 'lucide-react';
import type { TourLimitInfo } from '@/features/agencies/queries';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import { COUNTRIES, CITIES_BY_COUNTRY, AIRLINES, UZ_REGIONS, UZ_DISTRICTS } from '@/lib/tour-data';
import { TOUR_CATEGORIES } from '@/types';
import type { TourHotel, TourType, DomesticTourCategory, TourCategoryTag } from '@/types';

interface TourFormProps {
  initialData?: Partial<TourFormData> & {
    cover_image_url?: string | null;
    hotel_images?: string[];
    hotels?: TourHotel[];
    destinations?: string[];
    airline?: string | null;
    extra_charges?: { name: string; amount: number }[];
    operator_telegram_username?: string | null;
    operator_phone?: string | null;
    category?: string | null;
    additional_info?: string | null;
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
  tourLimit?: TourLimitInfo;
}

// Inline sub-component to add a combo country+city pair (avoids lifting search state)
function ComboDestinationAdder({ language, onAdd, t }: { language: string; onAdd: (d: { country: string; city: string }) => void; t: ReturnType<typeof useTranslation>['t'] }) {
  const [cs, setCs] = useState('');
  const [cis, setCis] = useState('');
  const [selCountry, setSelCountry] = useState('');

  return (
    <div className="flex gap-2 mt-2">
      <div className="flex-1 relative">
        {selCountry ? (
          <div className="flex items-center h-11 rounded-xl border border-muted bg-surface-container-low px-3">
            <span className="flex-1 text-sm truncate">{selCountry}</span>
            <button type="button" onClick={() => { setSelCountry(''); setCis(''); }} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <Input
              placeholder={t.agencyTours.countryPlaceholder}
              value={cs}
              onChange={(e) => setCs(e.target.value)}
              className="rounded-xl border-muted bg-surface-container-low h-11"
            />
            {cs && (
              <div className="absolute z-20 mt-1 w-full border rounded-xl max-h-44 overflow-y-auto bg-surface shadow-lg">
                {COUNTRIES[language].filter(c => c.toLowerCase().includes(cs.toLowerCase())).map((country) => (
                  <button key={country} type="button" className="w-full text-left px-3 py-2.5 text-sm hover:bg-primary/5 transition-colors" onClick={() => { setSelCountry(country); setCs(''); setCis(''); }}>
                    {country}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <div className="flex-1 relative">
        {!selCountry ? (
          <Input placeholder={t.agencyTours.selectCountryFirst} disabled className="rounded-xl border-muted bg-surface-container-low h-11" />
        ) : (
          <>
            <Input
              placeholder={t.agencyTours.cityPlaceholder}
              value={cis}
              onChange={(e) => setCis(e.target.value)}
              className="rounded-xl border-muted bg-surface-container-low h-11"
            />
            {cis && (() => {
              const cities = CITIES_BY_COUNTRY[language][selCountry] ?? [];
              const filtered = cities.filter(c => c.toLowerCase().includes(cis.toLowerCase()));
              return filtered.length > 0 ? (
                <div className="absolute z-20 mt-1 w-full border rounded-xl max-h-44 overflow-y-auto bg-surface shadow-lg">
                  {filtered.map((city) => (
                    <button key={city} type="button" className="w-full text-left px-3 py-2.5 text-sm hover:bg-primary/5 transition-colors" onClick={() => { onAdd({ country: selCountry, city }); setSelCountry(''); setCis(''); }}>
                      {city}
                    </button>
                  ))}
                </div>
              ) : null;
            })()}
          </>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={!selCountry}
        onClick={() => { if (selCountry) { onAdd({ country: selCountry, city: '' }); setSelCountry(''); setCis(''); } }}
        className="rounded-xl h-11 w-11 shrink-0"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function TourForm({ initialData, tourId, tourLimit }: TourFormProps) {
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
  const [showPreview, setShowPreview] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'pending' | 'draft'>('pending');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialData?.category ? initialData.category.split(',').filter(Boolean) : []
  );
  const [additionalInfo, setAdditionalInfo] = useState<string>(initialData?.additional_info ?? '');
  const [departureMonth, setDepartureMonth] = useState<string>(
    (initialData as Record<string, unknown>)?.departure_month as string ?? ''
  );
  const [coverKey, setCoverKey] = useState(0);
  // Combo tour: extra country+city pairs
  const [comboDestinations, setComboDestinations] = useState<{ country: string; city: string }[]>(() => {
    // Parse from destinations if editing (stored as "Country - City")
    const dests = initialData?.destinations ?? [];
    return dests
      .filter(d => d.includes(' - '))
      .map(d => { const [country, ...rest] = d.split(' - '); return { country, city: rest.join(' - ') }; });
  });

  const isEditing = !!tourId;
  const isCombo = selectedCategories.includes('combo');

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
    if (!newDestination.trim() || destinations.length >= 10) return;
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
    // Check tour limit for new tours
    if (!isEditing && tourLimit && !tourLimit.canCreate) {
      toast.error(t.agencyTours.tourLimitReached);
      return;
    }

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
      departure_month: departureMonth || null,
      return_date: data.return_date || null,
      duration_days: data.duration_days ? Number(data.duration_days) : null,
      duration_nights: data.duration_nights ? Number(data.duration_nights) : null,
      price: hotels.length > 0
        ? (Math.min(...hotels.map(h => h.price).filter(p => p > 0)) || Number(data.price))
        : Number(data.price),
      old_price: data.old_price ? Number(data.old_price) : null,
      currency: tourType === 'domestic' ? 'UZS' : 'USD',
      seats_total: data.seats_total ? Number(data.seats_total) : null,
      seats_left: data.seats_left ? Number(data.seats_left) : null,
      hotel_name: hotels.length > 0 ? hotels[0].name : (data.hotel_name || null),
      hotel_stars: hotels.length > 0 ? hotels[0].stars : (data.hotel_stars ? Number(data.hotel_stars) : null),
      hotel_booking_url: hotels.length > 0 ? hotels[0].booking_url : (data.hotel_booking_url || null),
      hotel_images: hotels.length > 0 ? hotels[0].images : [],
      hotels: hotels,
      destinations: isCombo
        ? comboDestinations.filter(d => d.country).map(d => `${d.country} - ${d.city || ''}`.replace(/ - $/, ''))
        : destinations,
      airline: tourType === 'international' ? (data.airline || null) : null,
      extra_charges: extraCharges,
      meal_type: data.meal_type || 'none',
      transport_type: data.transport_type || (tourType === 'domestic' ? 'bus' : 'flight'),
      visa_required: tourType === 'domestic' ? false : (data.visa_required || false),
      included_services: includedServices,
      excluded_services: [],
      operator_telegram_username: data.operator_telegram_username || null,
      operator_phone: data.operator_phone || null,
      category: selectedCategories.length > 0 ? selectedCategories.join(',') : null,
      additional_info: additionalInfo || null,
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
            className="flex items-start gap-4 p-5 bg-surface ghost-border rounded-2xl hover:border-primary hover:bg-primary/5 transition-all text-left"
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
            className="flex items-start gap-4 p-5 bg-surface ghost-border rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
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

  // Section header component
  const SectionHeader = ({ icon, label, color = 'text-primary' }: { icon: React.ReactNode; label: string; color?: string }) => (
    <div className="flex items-center gap-2 mb-4">
      <div className={`${color}`}>{icon}</div>
      <h2 className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</h2>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="pb-6">
      <input type="hidden" {...register('tour_type')} />
      <input type="hidden" {...register('slug')} />

      {/* Tour Type Badge */}
      <div className="flex items-center gap-2 mb-5">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${isDomestic ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
          {isDomestic ? <Map className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
          {isDomestic ? t.domesticTour.domestic : t.domesticTour.international}
        </div>
        {!isEditing && (
          <button type="button" onClick={() => setTourTypeSelected(false)} className="text-xs text-muted-foreground hover:text-foreground underline">
            {t.common.edit}
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* в”Ђв”Ђ TOUR BASICS в”Ђв”Ђ */}
        <section>
          <SectionHeader icon={<FileText className="h-4 w-4" />} label={t.agencyTours.basicInfo} />
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-foreground">{t.agencyTours.titleLabel}</Label>
              <Input id="title" placeholder={t.agencyTours.titlePlaceholder} {...register('title')} onBlur={autoSlug} className="mt-1.5 rounded-xl border-muted bg-surface-container-low h-11" />
              {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
            </div>

            {/* Tour Category Selection */}
            <div>
              <Label className="text-sm font-medium text-foreground">{t.agencyTours.tourCategory}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t.agencyTours.tourCategoryHint}</p>
              <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-muted bg-surface-container-low">
                {TOUR_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategories.includes(cat);
                  const isDisabled = !isSelected && selectedCategories.length >= 5;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedCategories(prev => prev.filter(c => c !== cat));
                        } else if (selectedCategories.length < 5) {
                          setSelectedCategories(prev => [...prev, cat]);
                        }
                      }}
                      disabled={isDisabled}
                      className={`w-full text-left px-3 py-2.5 text-sm transition-colors border-b border-muted last:border-b-0 ${
                        isSelected
                          ? 'bg-primary/10 text-primary font-semibold'
                          : isDisabled
                            ? 'text-muted-foreground/50 cursor-not-allowed'
                            : 'text-foreground hover:bg-primary/5'
                      }`}
                    >
                      {t.tourCategories[cat as keyof typeof t.tourCategories]}
                      {isSelected && ' ✓'}
                    </button>
                  );
                })}
              </div>
              {selectedCategories.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{selectedCategories.length}/5</p>
              )}
            </div>

            {/* Full Description - moved here from included services */}
            <div>
              <Label className="text-sm font-medium text-foreground">{t.agencyTours.fullDescription}</Label>
              <Textarea placeholder={t.agencyTours.fullDescriptionPlaceholder} rows={4} {...register('full_description')} className="mt-1.5 rounded-xl border-muted bg-surface-container-low" />
            </div>

            {/* Country & City вЂ” International */}
            {!isDomestic && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-foreground">{t.agencyTours.country}</Label>
                  <div className="relative mt-1.5">
                    {watch('country') ? (
                      <div className="flex items-center h-11 rounded-xl border border-muted bg-surface-container-low px-3">
                        <span className="flex-1 text-sm truncate">{watch('country')}</span>
                        <button type="button" onClick={() => { setValue('country', ''); setValue('city', ''); }} className="text-muted-foreground hover:text-foreground">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Input
                          placeholder={t.agencyTours.countryPlaceholder}
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          className="rounded-xl border-muted bg-surface-container-low h-11"
                        />
                        {countrySearch && (
                          <div className="absolute z-20 mt-1 w-full border rounded-xl max-h-44 overflow-y-auto bg-surface shadow-lg">
                            {COUNTRIES[language].filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())).map((country) => (
                              <button key={country} type="button" className="w-full text-left px-3 py-2.5 text-sm hover:bg-primary/5 transition-colors" onClick={() => { setValue('country', country); setCountrySearch(''); setValue('city', ''); setCitySearch(''); }}>
                                {country}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground">{t.agencyTours.city}</Label>
                  <div className="relative mt-1.5">
                    {watch('city') ? (
                      <div className="flex items-center h-11 rounded-xl border border-muted bg-surface-container-low px-3">
                        <span className="flex-1 text-sm truncate">{watch('city')}</span>
                        <button type="button" onClick={() => setValue('city', '')} className="text-muted-foreground hover:text-foreground">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Input
                          placeholder={watch('country') ? t.agencyTours.cityPlaceholder : t.agencyTours.selectCountryFirst}
                          value={citySearch}
                          onChange={(e) => setCitySearch(e.target.value)}
                          className="rounded-xl border-muted bg-surface-container-low h-11"
                          disabled={!watch('country')}
                        />
                        {citySearch && (() => {
                          const cities = CITIES_BY_COUNTRY[language][watch('country') ?? ''] ?? [];
                          const filtered = cities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));
                          return filtered.length > 0 ? (
                            <div className="absolute z-20 mt-1 w-full border rounded-xl max-h-44 overflow-y-auto bg-surface shadow-lg">
                              {filtered.map((city) => (
                                <button key={city} type="button" className="w-full text-left px-3 py-2.5 text-sm hover:bg-primary/5 transition-colors" onClick={() => { setValue('city', city); setCitySearch(''); }}>
                                  {city}
                                </button>
                              ))}
                            </div>
                          ) : null;
                        })()}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}


            {/* Combo Tour: Additional Country+City pairs */}
            {!isDomestic && isCombo && (
              <div>
                <Label className="text-sm font-medium text-foreground">Qo&apos;shimcha mamlakatlar va shaharlar</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Kombi tur uchun 5 tagacha qo&apos;shimcha mamlakat va shahar qo&apos;shing</p>
                {comboDestinations.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {comboDestinations.map((dest, i) => (
                      <div key={i} className="flex items-center gap-2 bg-primary/5 rounded-xl px-3 py-2">
                        <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="flex-1 text-sm font-medium text-foreground">{dest.country}{dest.city ? ` \u2014 ${dest.city}` : ''}</span>
                        <button type="button" onClick={() => setComboDestinations(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-red-500">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {comboDestinations.length < 5 && (
                  <ComboDestinationAdder
                    language={language}
                    onAdd={(dest) => setComboDestinations(prev => [...prev, dest])}
                    t={t}
                  />
                )}
                <p className="text-xs text-muted-foreground mt-1">{comboDestinations.length}/5</p>
              </div>
            )}

            {/* Region & District вЂ” Domestic */}
            {isDomestic && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-foreground">{t.domesticTour.region}</Label>
                  <div className="relative mt-1.5">
                    {watch('region') ? (
                      <div className="flex items-center h-11 rounded-xl border border-muted bg-surface-container-low px-3">
                        <span className="flex-1 text-sm truncate">{watch('region')}</span>
                        <button type="button" onClick={() => { setValue('region', ''); setValue('district', ''); }} className="text-muted-foreground hover:text-foreground">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Input
                          placeholder={t.domesticTour.selectRegion}
                          value={regionSearch}
                          onChange={(e) => setRegionSearch(e.target.value)}
                          className="rounded-xl border-muted bg-surface-container-low h-11"
                        />
                        {regionSearch && (
                          <div className="absolute z-20 mt-1 w-full border rounded-xl max-h-44 overflow-y-auto bg-surface shadow-lg">
                            {(UZ_REGIONS[language] || UZ_REGIONS['uz']).filter(r => r.toLowerCase().includes(regionSearch.toLowerCase())).map((region) => (
                              <button key={region} type="button" className="w-full text-left px-3 py-2.5 text-sm hover:bg-primary/5 transition-colors" onClick={() => { setValue('region', region); setRegionSearch(''); setValue('district', ''); setDistrictSearch(''); }}>
                                {region}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground">{t.domesticTour.district}</Label>
                  <div className="relative mt-1.5">
                    {watch('district') ? (
                      <div className="flex items-center h-11 rounded-xl border border-muted bg-surface-container-low px-3">
                        <span className="flex-1 text-sm truncate">{watch('district')}</span>
                        <button type="button" onClick={() => setValue('district', '')} className="text-muted-foreground hover:text-foreground">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Input
                          placeholder={watch('region') ? t.domesticTour.selectDistrict : t.domesticTour.selectRegionFirst}
                          value={districtSearch}
                          onChange={(e) => setDistrictSearch(e.target.value)}
                          className="rounded-xl border-muted bg-surface-container-low h-11"
                          disabled={!watch('region')}
                        />
                        {districtSearch && (() => {
                          const regionData = UZ_DISTRICTS[language] || UZ_DISTRICTS['uz'];
                          const districts = regionData[watch('region') ?? ''] ?? [];
                          const filtered = districts.filter(d => d.toLowerCase().includes(districtSearch.toLowerCase()));
                          return filtered.length > 0 ? (
                            <div className="absolute z-20 mt-1 w-full border rounded-xl max-h-44 overflow-y-auto bg-surface shadow-lg">
                              {filtered.map((district) => (
                                <button key={district} type="button" className="w-full text-left px-3 py-2.5 text-sm hover:bg-primary/5 transition-colors" onClick={() => { setValue('district', district); setDistrictSearch(''); }}>
                                  {district}
                                </button>
                              ))}
                            </div>
                          ) : null;
                        })()}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Domestic Category */}
            {isDomestic && (
              <div>
                <Label className="text-sm font-medium text-foreground">{t.domesticTour.category}</Label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {(['excursion', 'nature', 'historical', 'pilgrimage', 'recreation', 'adventure'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setValue('domestic_category', cat)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                        watch('domestic_category') === cat
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-muted hover:border-foreground/20 text-muted-foreground'
                      }`}
                    >
                      {categoryIcons[cat]}
                      <span className="leading-tight text-center">{t.domesticTour[cat]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="border-t border-muted" />

        {/* в”Ђв”Ђ LOGISTICS в”Ђв”Ђ */}
        <section>
          <SectionHeader icon={<CalendarDays className="h-4 w-4" />} label={t.agencyTours.dates} />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium text-foreground">{t.agencyTours.departureDate}</Label>
                <Input type="date" {...register('departure_date')} placeholder={t.dateFormat.placeholder} className="mt-1.5 rounded-xl border-muted bg-surface-container-low h-11" />
              </div>
              <div>
                <Label className="text-sm font-medium text-foreground">{t.agencyTours.departureMonth}</Label>
                <select
                  value={departureMonth}
                  onChange={(e) => setDepartureMonth(e.target.value)}
                  className="mt-1.5 w-full h-11 rounded-xl border border-muted bg-surface-container-low px-3 text-sm text-foreground"
                >
                  <option value="">{t.agencyTours.departureMonthPlaceholder}</option>
                  {Object.entries(t.dateFormat.monthNames).map(([key, name]) => (
                    <option key={key} value={`${new Date().getFullYear()}-${key}`}>{name} {new Date().getFullYear()}</option>
                  ))}
                  {Object.entries(t.dateFormat.monthNames).map(([key, name]) => (
                    <option key={`next-${key}`} value={`${new Date().getFullYear() + 1}-${key}`}>{name} {new Date().getFullYear() + 1}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">{t.dateFormat.dateOrMonthRequired}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium text-foreground">{t.agencyTours.durationLabel}</Label>
                <div className="flex gap-2 mt-1.5">
                  <div className="relative flex-1">
                    <Input type="number" min={1} placeholder="7" {...register('duration_days')} className="rounded-xl border-muted bg-surface-container-low h-11 pr-14" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground pointer-events-none">{t.agencyTours.daysSuffix}</span>
                  </div>
                  <div className="relative flex-1">
                    <Input type="number" min={0} placeholder="6" {...register('duration_nights')} className="rounded-xl border-muted bg-surface-container-low h-11 pr-16" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground pointer-events-none">{t.agencyTours.nightsSuffix}</span>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-foreground">{t.agencyTours.returnDate}</Label>
                <Input type="date" {...register('return_date')} placeholder={t.dateFormat.placeholder} className="mt-1.5 rounded-xl border-muted bg-surface-container-low h-11" />
              </div>
            </div>
          </div>
        </section>

        <div className="border-t border-muted" />

        {/* в”Ђв”Ђ PRICING в”Ђв”Ђ */}
        <section>
          <SectionHeader icon={<DollarSign className="h-4 w-4" />} label={t.agencyTours.pricingAvailability} />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium text-foreground">{t.agencyTours.price}</Label>
                <div className="relative mt-1.5">
                  <Input type="number" min={0} step="0.01" placeholder="0.00" {...register('price')} className="pl-3 pr-14 rounded-xl border-muted bg-surface-container-low h-11" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">USD</span>
                </div>
                {errors.price && <p className="text-xs text-destructive mt-1">{errors.price.message}</p>}
              </div>
              <div>
                <Label className="text-sm font-medium text-foreground">{t.agencyTours.oldPrice}</Label>
                <div className="relative mt-1.5">
                  <Input type="number" min={0} step="0.01" placeholder="0.00" {...register('old_price')} className="pl-3 pr-14 rounded-xl border-muted bg-surface-container-low h-11" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">USD</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium text-foreground">{t.agencyTours.totalSeats}</Label>
                <Input type="number" min={1} {...register('seats_total')} className="mt-1.5 rounded-xl border-muted bg-surface-container-low h-11" />
              </div>
              <div>
                <Label className="text-sm font-medium text-foreground">{t.agencyTours.seatsLeft}</Label>
                <Input type="number" min={0} {...register('seats_left')} className="mt-1.5 rounded-xl border-muted bg-surface-container-low h-11" />
              </div>
            </div>

            {/* Extra Charges */}
            <div>
              <Label className="text-sm font-medium text-foreground">{t.agencyTours.extraCharges}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t.agencyTours.extraChargesHint}</p>
              {extraCharges.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {extraCharges.map((charge, i) => (
                    <div key={i} className="flex items-center gap-2 bg-tertiary/10 rounded-xl px-3 py-2 text-sm">
                      <span className="flex-1 font-medium text-foreground">{charge.name}</span>
                      <span className="text-tertiary font-bold text-xs">${charge.amount}</span>
                      <button type="button" onClick={() => removeExtraCharge(i)} className="text-muted-foreground hover:text-red-500">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <Input placeholder={t.agencyTours.extraChargeName} value={newChargeName} onChange={(e) => setNewChargeName(e.target.value)} className="flex-1 rounded-xl border-muted bg-surface-container-low h-11" />
                <div className="relative w-28">
                  <Input placeholder={t.agencyTours.extraChargeAmount} type="number" min={0} value={newChargeAmount} onChange={(e) => setNewChargeAmount(e.target.value)} className="rounded-xl border-muted bg-surface-container-low h-11 pr-12" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExtraCharge(); } }} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">USD</span>
                </div>
                <Button type="button" variant="outline" size="icon" onClick={addExtraCharge} className="rounded-xl h-11 w-11 shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="border-t border-muted" />

        {/* в”Ђв”Ђ DETAILS в”Ђв”Ђ */}
        <section>
          <SectionHeader icon={<CheckCircle2 className="h-4 w-4" />} label={t.agencyTours.includedServices} />
          <div className="space-y-4">
            {/* Included Services */}
            <div>
              <Label className="text-sm font-medium text-foreground">{t.agencyTours.includedServices}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t.agencyTours.includedServicesHint}</p>
              {includedServices.length > 0 && (
                <div className="space-y-1 mt-2">
                  {includedServices.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm bg-emerald-50/50 rounded-lg px-3 py-1.5">
                      <span className="text-emerald-500 text-xs">вњ“</span>
                      <span className="flex-1 text-foreground">{s}</span>
                      <button type="button" onClick={() => removeService(i)} className="text-muted-foreground hover:text-red-500">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <Input placeholder={t.agencyTours.addIncludedService} value={newIncluded} onChange={(e) => setNewIncluded(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addService(); } }} className="rounded-xl border-muted bg-surface-container-low h-11" />
                <Button type="button" variant="outline" size="icon" onClick={() => addService()} className="rounded-xl h-11 w-11 shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Operator Info */}
            <div>
              <Label className="text-sm font-medium text-foreground">{t.agencyTours.operatorTelegram}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t.agencyTours.operatorTelegramHint}</p>
              <div className="space-y-2 mt-1.5">
                <Input placeholder={t.agencyTours.operatorTelegramPlaceholder} {...register('operator_telegram_username')} className="rounded-xl border-muted bg-surface-container-low h-11" />
                <Input placeholder={t.agencyTours.operatorPhonePlaceholder} {...register('operator_phone')} className="rounded-xl border-muted bg-surface-container-low h-11" />
              </div>
            </div>
          </div>
        </section>

        <div className="border-t border-muted" />

        {/* в”Ђв”Ђ STAY & TRAVEL в”Ђв”Ђ */}
        <section>
          <SectionHeader icon={<Hotel className="h-4 w-4" />} label={t.agencyTours.accommodation} />
          <div className="space-y-4">
            {/* Hotels */}
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground">{t.tours.hotels}</Label>
              <button
                type="button"
                onClick={() => setHotels((prev) => [...prev, { name: '', stars: null, price: 0, description: null, booking_url: null, images: [] }])}
                className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> {t.tours.addHotel}
              </button>
            </div>

            {hotels.map((hotel, hotelIndex) => (
              <div key={hotelIndex} className="rounded-xl border border-muted bg-surface-container-low p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hotel className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">#{hotelIndex + 1}</span>
                    {hotelIndex === 0 && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Asosiy</span>}
                  </div>
                  <button type="button" onClick={() => setHotels((prev) => prev.filter((_, i) => i !== hotelIndex))} className="text-red-400 hover:text-red-500 text-xs font-medium">
                    {t.tours.removeHotel}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">{t.agencyTours.hotelName}</Label>
                    <Input placeholder={t.agencyTours.hotelNamePlaceholder} value={hotel.name} onChange={(e) => { const u = [...hotels]; u[hotelIndex] = { ...hotel, name: e.target.value }; setHotels(u); }} className="mt-1 rounded-xl border-muted bg-surface h-10 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{t.agencyTours.stars}</Label>
                    <div className="flex items-center gap-0.5 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => { const u = [...hotels]; u[hotelIndex] = { ...hotel, stars: star }; setHotels(u); }} className="p-0.5">
                          <Star className={`h-5 w-5 ${hotel.stars && star <= hotel.stars ? 'text-yellow-500 fill-yellow-500' : 'text-muted'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">{t.tours.hotelPrice}</Label>
                  <Input type="number" min={0} step="0.01" placeholder="850" value={hotel.price || ''} onChange={(e) => { const u = [...hotels]; u[hotelIndex] = { ...hotel, price: Number(e.target.value) }; setHotels(u); if (hotelIndex === 0) setValue('price', Number(e.target.value)); }} className="mt-1 rounded-xl border-muted bg-surface h-10 text-sm" />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">{t.tours.hotelDescription}</Label>
                  <Textarea placeholder={t.tours.hotelDescriptionPlaceholder} rows={2} value={hotel.description || ''} onChange={(e) => { const u = [...hotels]; u[hotelIndex] = { ...hotel, description: e.target.value || null }; setHotels(u); }} className="mt-1 rounded-xl border-muted bg-surface text-sm" />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">{t.agencyTours.hotelBookingUrl}</Label>
                  <Input placeholder={t.agencyTours.hotelBookingUrlPlaceholder} value={hotel.booking_url || ''} onChange={(e) => { const u = [...hotels]; u[hotelIndex] = { ...hotel, booking_url: e.target.value || null }; setHotels(u); }} className="mt-1 rounded-xl border-muted bg-surface h-10 text-sm" />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">{t.agencyTours.hotelImages}</Label>
                  <div className="mt-1">
                    <MultiImageUploader values={hotel.images} onChange={(imgs) => { const u = [...hotels]; u[hotelIndex] = { ...hotel, images: imgs }; setHotels(u); }} maxImages={4} label={t.agencyTours.uploadHotelImage} folder="hotels" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* в”Ђв”Ђ DOMESTIC EXTRAS в”Ђв”Ђ */}
        {isDomestic && (
          <>
            <div className="border-t border-muted" />
            <section>
              <SectionHeader icon={<MapPin className="h-4 w-4" />} label={t.domesticTour.guideInfo} color="text-emerald-600" />
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-foreground">{t.domesticTour.meetingPoint}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.domesticTour.meetingPointHint}</p>
                  <Textarea placeholder={t.domesticTour.meetingPointPlaceholder} rows={2} {...register('meeting_point')} className="mt-1.5 rounded-xl border-muted bg-surface-container-low" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-foreground">{t.domesticTour.guideName}</Label>
                    <Input placeholder={t.domesticTour.guideNamePlaceholder} {...register('guide_name')} className="mt-1.5 rounded-xl border-muted bg-surface-container-low h-11" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-foreground">{t.domesticTour.guidePhone}</Label>
                    <Input placeholder={t.domesticTour.guidePhonePlaceholder} {...register('guide_phone')} className="mt-1.5 rounded-xl border-muted bg-surface-container-low h-11" />
                  </div>
                </div>

                {/* What to Bring */}
                <div>
                  <Label className="text-sm font-medium text-foreground">{t.domesticTour.whatToBring}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.domesticTour.whatToBringHint}</p>
                  {whatToBring.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {whatToBring.map((item, i) => (
                        <div key={i} className="flex items-center gap-1 bg-tertiary/10 text-tertiary rounded-full px-2.5 py-1 text-xs font-medium">
                          <span>{item}</span>
                          <button type="button" onClick={() => removeBringItem(i)} className="hover:bg-tertiary/20 rounded-full p-0.5">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Input placeholder={t.domesticTour.addItem} value={newBringItem} onChange={(e) => setNewBringItem(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addBringItem(); } }} className="rounded-xl border-muted bg-surface-container-low h-11" />
                    <Button type="button" variant="outline" size="icon" onClick={addBringItem} className="rounded-xl h-11 w-11 shrink-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        <div className="border-t border-muted" />

        {/* в”Ђв”Ђ MEDIA в”Ђв”Ђ */}
        <section>
          <SectionHeader icon={<ImageIcon className="h-4 w-4" />} label={t.agencyTours.coverImage} />
          <ImageUploader
            key={coverKey}
            value={coverUrl}
            onChange={(url) => {
              setCoverUrl(url);
              if (!url) setCoverKey((k) => k + 1);
            }}
            label={t.agencyTours.uploadCoverImage}
          />
          <p className="text-xs text-muted-foreground mt-1.5">{t.agencyTours.coverImageHint}</p>
        </section>

        {/* в”Ђв”Ђ PREVIEW / PUBLISH BUTTONS в”Ђв”Ђ */}
        <div className="pt-4 space-y-3">
          {/* Preview Button */}
          <Button
            type="button"
            className="w-full h-12 rounded-2xl text-base font-bold shadow-lg shadow-primary/20"
            disabled={isSubmitting}
            onClick={() => {
              setPendingStatus('pending');
              handleSubmit(() => setShowPreview(true))();
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            {t.agencyTours.previewAndPublish}
          </Button>
          {!isEditing && (
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-2xl text-sm"
              disabled={isSubmitting}
              onClick={() => {
                setPendingStatus('draft');
                handleSubmit(() => setShowPreview(true))();
              }}
            >
              {t.agencyTours.saveAsDraft}
            </Button>
          )}
        </div>
      </div>

      {/* в”Ђв”Ђ PREVIEW MODAL в”Ђв”Ђ */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center sm:items-center">
          <div className="bg-surface w-full max-w-lg max-h-[85vh] rounded-t-3xl sm:rounded-3xl overflow-y-auto">
            <div className="sticky top-0 bg-surface border-b border-muted p-4 flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="text-lg font-bold">{t.agencyTours.previewTitle}</h2>
              <button type="button" onClick={() => setShowPreview(false)} className="p-1.5 rounded-full hover:bg-surface-container-low">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Cover image preview */}
              {coverUrl && (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-surface-container-low">
                  <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Title */}
              <div>
                <h3 className="text-xl font-bold">{watch('title') || 'вЂ”'}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isDomestic ? `${watch('region') || ''}${watch('district') ? `, ${watch('district')}` : ''}` : `${watch('country') || ''}${watch('city') ? `, ${watch('city')}` : ''}`}
                </p>
              </div>

              {/* Key info grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-low rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">{t.agencyTours.price}</p>
                  {watch('old_price') && Number(watch('old_price')) > 0 && (
                    <p className="text-xs text-muted-foreground line-through">
                      {watch('old_price')} <span className="text-[10px]">{isDomestic ? 'UZS' : (watch('currency') || 'USD')}</span>
                    </p>
                  )}
                  <p className="text-lg font-bold">
                    {hotels.length > 0
                      ? (Math.min(...hotels.map(h => h.price).filter(p => p > 0)) || watch('price') || '0')
                      : (watch('price') || '0')}
                    <span className="text-xs font-normal ml-1">{isDomestic ? 'UZS' : (watch('currency') || 'USD')}</span>
                  </p>
                </div>
                <div className="bg-surface-container-low rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">{t.agencyTours.durationLabel}</p>
                  <p className="text-lg font-bold">{watch('duration_days') || '\u2014'} {t.agencyTours.daysSuffix}{watch('duration_nights') ? ` | ${watch('duration_nights')} ${t.agencyTours.nightsSuffix}` : ''}</p>
                </div>
                <div className="bg-surface-container-low rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">{t.agencyTours.departureDate}</p>
                  <p className="text-sm font-semibold">{watch('departure_date') || (departureMonth ? (() => { const [y, m] = departureMonth.split('-'); return `${t.dateFormat.monthNames[m as keyof typeof t.dateFormat.monthNames] ?? m} ${y}`; })() : '—')}</p>
                </div>
                <div className="bg-surface-container-low rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">{t.agencyTours.totalSeats}</p>
                  <p className="text-lg font-bold">{watch('seats_total') || 'вЂ”'}</p>
                </div>
              </div>

              {/* Hotels */}
              {hotels.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground mb-2">{t.agencyTours.accommodationTransport}</p>
                  {hotels.map((h, i) => (
                    <div key={i} className="bg-surface-container-low rounded-xl p-3 mb-2">
                      <p className="font-semibold text-sm">{h.name} {'в­ђ'.repeat(h.stars || 0)}</p>
                      {h.price > 0 && <p className="text-xs text-muted-foreground">{h.price} {isDomestic ? 'UZS' : (watch('currency') || 'USD')}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Services */}
              {includedServices.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground mb-2">{t.agencyTours.includedServices}</p>
                  <div className="space-y-1">
                    {includedServices.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {watch('full_description') && (
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground mb-2">{t.agencyTours.fullDescription}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{watch('full_description')}</p>
                </div>
              )}

              {/* Tour limit warning */}
              {tourLimit && !tourLimit.canCreate && !isEditing && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span className="text-xs">{t.agencyTours.tourLimitReached}</span>
                </div>
              )}
            </div>

            {/* Confirm buttons */}
            <div className="sticky bottom-0 bg-surface border-t border-muted p-4 space-y-2">
              <Button
                type="button"
                className="w-full h-12 rounded-2xl text-base font-bold"
                disabled={isSubmitting || (tourLimit && !tourLimit.canCreate && !isEditing)}
                onClick={() => {
                  setShowPreview(false);
                  setValue('status', pendingStatus);
                  handleSubmit(onSubmit)();
                }}
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {isEditing ? t.agencyTours.updateTour : (pendingStatus === 'draft' ? t.agencyTours.saveAsDraft : t.agencyTours.submitForReview)}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 rounded-2xl text-sm"
                onClick={() => setShowPreview(false)}
              >
                {t.agencyTours.backToEdit}
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
