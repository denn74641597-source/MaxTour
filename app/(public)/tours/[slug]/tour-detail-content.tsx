'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  MapPin, CalendarDays, Clock, Users,
  ArrowLeft, Share2, Send, Star, Check, X,
  Plane, DollarSign, Navigation, Hotel, Map, Mountain,
  Landmark, Heart, Compass, TreePine, Phone, User,
} from 'lucide-react';
import { DOMESTIC_CATEGORIES } from '@/lib/tour-data';
import { useTranslation } from '@/lib/i18n';
import { formatDate, placeholderImage } from '@/lib/utils';
import { HotelImageCarousel } from '@/components/shared/hotel-image-carousel';
import { VerifiedBadge } from '@/components/shared/verified-badge';
import { useFavorites } from '@/hooks/use-favorites';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LeadForm } from '@/components/shared/lead-form';
import { TourCard } from '@/components/shared/tour-card';
import type { Tour, TourHotel } from '@/types';

interface TourDetailContentProps {
  tour: any;
  similarTours?: Tour[];
}

export function TourDetailContent({ tour, similarTours = [] }: TourDetailContentProps) {
  const { t, language } = useTranslation();
  const router = useRouter();
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();

  const agency = tour.agency;
  const images = tour.images ?? [];
  const allImages = [
    tour.cover_image_url || placeholderImage(800, 600, tour.title),
    ...images.map((img: any) => img.image_url),
  ];
  const includedServices = (tour.included_services as string[]) ?? [];
  const excludedServices = (tour.excluded_services as string[]) ?? [];
  const hotelImages = (tour.hotel_images as string[]) ?? [];
  const destinations = (tour.destinations as string[]) ?? [];
  const extraCharges = (tour.extra_charges as { name: string; amount: number }[]) ?? [];
  const variableCharges = (tour.variable_charges as { name: string; min_amount: number; max_amount: number }[]) ?? [];
  const hotels = (tour.hotels as TourHotel[]) ?? [];
  const whatToBring = (tour.what_to_bring as string[]) ?? [];
  const isDomestic = tour.tour_type === 'domestic';

  const categoryIcons: Record<string, React.ReactNode> = {
    excursion: <Compass className="h-3.5 w-3.5" />,
    nature: <TreePine className="h-3.5 w-3.5" />,
    historical: <Landmark className="h-3.5 w-3.5" />,
    pilgrimage: <Heart className="h-3.5 w-3.5" />,
    recreation: <Mountain className="h-3.5 w-3.5" />,
    adventure: <Map className="h-3.5 w-3.5" />,
  };

  const telegramLink = tour.operator_telegram_username
    ? `https://t.me/${tour.operator_telegram_username.replace('@', '')}`
    : agency?.telegram_username
      ? `https://t.me/${agency.telegram_username.replace('@', '')}`
      : null;

  const operatorPhone = tour.operator_phone || agency?.phone || null;

  function trackClick(type: 'call' | 'telegram') {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tour_id: tour.id, agency_id: tour.agency_id, type }),
    }).catch(() => {});
  }

  return (
    <div className="bg-background min-h-screen pb-4">
      {/* Top App Bar */}
      <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-background/95 backdrop-blur z-10">
        <button onClick={() => router.back()} className="p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="font-semibold text-sm">{t.tours.tourDetails}</h2>
        <button className="p-1">
          <Share2 className="h-5 w-5" />
        </button>
      </div>

      {/* Hero Image */}
      <div className="relative min-h-[260px] w-full overflow-hidden bg-muted">
        <Image
          src={allImages[0]}
          alt={tour.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Favorite button */}
        <button
          onClick={() => toggleFavorite(tour.id)}
          className="absolute top-3 right-3 p-2.5 bg-surface/90 backdrop-blur rounded-full shadow-ambient z-10"
        >
          <Heart className={`h-5 w-5 ${isFavorite(tour.id) ? 'text-red-500 fill-red-500' : 'text-white'}`} />
        </button>
        {allImages.length > 1 && (
          <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2">
            {allImages.slice(0, 5).map((_: any, i: number) => (
              <div
                key={i}
                className={`size-2 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Header Info: Title + Price */}
      <div className="px-6 pt-3 pb-1 bg-surface">
        <div className="flex justify-between items-start">
          <div className="flex-1 mr-3">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-foreground">
              {tour.title}
            </h1>
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4 text-primary" />
              <p className="text-muted-foreground text-sm font-medium">
                {isDomestic
                  ? `${tour.district ? `${tour.district}, ` : ''}${tour.region || 'O\'zbekiston'}`
                  : tour.destinations && tour.destinations.length > 1
                    ? (() => {
                        const parsed: { country: string; city: string }[] = tour.destinations.map((d: string) => { const p = d.split(' - '); return { country: p[0], city: p[1] || '' }; });
                        const countries = [...new Set(parsed.map(p => p.country))];
                        const cities = parsed.map(p => p.city).filter(Boolean);
                        if (countries.length === 1 && cities.length > 0) {
                          return `${cities.join(' - ')}, ${countries[0]}`;
                        }
                        return parsed.map(p => p.city ? `${p.city}, ${p.country}` : p.country).join(' - ');
                      })()
                    : `${tour.city ? `${tour.city}, ` : ''}${tour.country}`
                }
              </p>
            </div>

          </div>
          <div className="text-right shrink-0">
            {tour.old_price && (
              <p className="text-muted-foreground text-xs line-through">${tour.old_price.toLocaleString()}</p>
            )}
            <p className="text-primary text-xl font-bold">${tour.price.toLocaleString()}</p>
            <p className="text-muted-foreground text-xs">{t.common.perPerson}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 px-6 mt-3">
        {tour.duration_days && (
          <div className="bg-surface p-2 rounded-xl shadow-ambient flex flex-col items-center">
            <Clock className="h-4 w-4 text-primary mb-0.5" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.tours.duration}</span>
            <span className="text-xs font-bold text-foreground">
              {tour.duration_days} {t.common.days}
              {tour.duration_nights ? ` | ${tour.duration_nights} ${t.common.nights}` : ''}
            </span>
          </div>
        )}
        {(tour.departure_date || tour.departure_month) && (
          <div className="bg-surface p-2 rounded-xl shadow-ambient flex flex-col items-center">
            <CalendarDays className="h-4 w-4 text-primary mb-0.5" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.tours.departure}</span>
            <span className="text-xs font-bold text-foreground">
              {tour.departure_date
                ? (() => {
                    const dep = new Date(tour.departure_date);
                    const depStr = `${String(dep.getDate()).padStart(2, '0')}.${String(dep.getMonth() + 1).padStart(2, '0')}`;
                    if (tour.return_date) {
                      const ret = new Date(tour.return_date);
                      const retStr = `${String(ret.getDate()).padStart(2, '0')}.${String(ret.getMonth() + 1).padStart(2, '0')}`;
                      return `${depStr} - ${retStr}`;
                    }
                    return depStr;
                  })()
                : (() => {
                    const [y, m] = (tour.departure_month as string).split('-');
                    return `${t.dateFormat.monthNames[m as keyof typeof t.dateFormat.monthNames] ?? m} ${y}`;
                  })()
              }
            </span>
          </div>
        )}
        {tour.seats_left !== null && (
          <div className="bg-surface p-2 rounded-xl shadow-ambient flex flex-col items-center">
            <Users className="h-4 w-4 text-primary mb-0.5" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.common.seatsLeft}</span>
            <span className={`text-xs font-bold ${tour.seats_left <= 5 ? 'text-red-500' : 'text-foreground'}`}>
              {tour.seats_left} {t.common.seats}
            </span>
          </div>
        )}
      </div>

      {/* Agency Profile Card */}
      {agency && (
        <div className="px-3 mt-4">
          <div className="bg-primary/5 rounded-xl p-3 flex items-center justify-between border border-primary/10">
            <div className="flex items-center gap-2.5">
              <div className="size-10 rounded-full bg-muted overflow-hidden relative shrink-0">
                <Image
                  src={agency.logo_url || placeholderImage(100, 100, agency.name[0])}
                  alt={agency.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <h4 className="font-bold text-foreground">{agency.name}</h4>
                  {agency.is_verified && (
                    <VerifiedBadge />
                  )}
                </div>
                {agency.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium">{agency.rating}</span>
                  </div>
                )}
              </div>
            </div>
            <Link
              href={`/agencies/${agency.slug}`}
              className="text-primary font-bold text-sm hover:underline"
            >
              {t.common.viewProfile}
            </Link>
          </div>
        </div>
      )}

      {/* Content Sections */}
      <div className="px-6 mt-4 space-y-4">
        {/* About */}
        {tour.full_description && (
          <section>
            <h3 className="text-base font-bold mb-1.5 text-foreground">{t.tours.aboutTour}</h3>
            {isDomestic && tour.domestic_category && (
              <div className="flex items-center gap-1.5 mb-2">
                <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-1 text-xs font-medium border border-emerald-200">
                  {categoryIcons[tour.domestic_category]}
                  <span>{DOMESTIC_CATEGORIES[language]?.[tour.domestic_category] || tour.domestic_category}</span>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground leading-snug whitespace-pre-line">
              {tour.full_description}
            </p>
          </section>
        )}

        {/* What's Included */}
        {(includedServices.length > 0 || destinations.length > 0) && (
          <section>
            <h3 className="text-base font-bold mb-1.5 text-foreground">{t.tours.whatsIncluded}</h3>
            <div className="bg-surface rounded-xl shadow-ambient divide-y divide-muted">
              {destinations.length > 0 && (
                <div className="flex items-center gap-2.5 px-3 py-2">
                  <div className="size-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <Navigation className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {destinations.map((dest: string, i: number) => (
                      <span key={i} className="text-xs font-medium">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">{dest}</span>
                        {i < destinations.length - 1 && <span className="text-muted-foreground mx-0.5">→</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {includedServices.map((service, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2">
                  <div className="size-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <span className="text-sm text-foreground">{service}</span>
                </div>
              ))}
            </div>
          </section>
        )}



        {/* Meeting Point - Domestic */}
        {isDomestic && tour.meeting_point && (
          <section>
            <h3 className="text-base font-bold mb-1.5 text-foreground">{t.domesticTour.meetingPoint}</h3>
            <div className="bg-surface rounded-xl shadow-ambient px-3 py-2.5">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">{tour.meeting_point}</p>
              </div>
            </div>
          </section>
        )}

        {/* Guide Info - Domestic */}
        {isDomestic && (tour.guide_name || tour.guide_phone) && (
          <section>
            <h3 className="text-base font-bold mb-1.5 text-foreground">{t.domesticTour.guideInfo}</h3>
            <div className="bg-surface rounded-xl shadow-ambient divide-y divide-muted">
              {tour.guide_name && (
                <div className="flex items-center gap-2.5 px-3 py-2">
                  <div className="size-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <User className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <span className="text-sm text-foreground">{tour.guide_name}</span>
                </div>
              )}
              {tour.guide_phone && (
                <div className="flex items-center gap-2.5 px-3 py-2">
                  <div className="size-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <Phone className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <span className="text-sm text-foreground">{tour.guide_phone}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* What to Bring - Domestic */}
        {isDomestic && whatToBring.length > 0 && (
          <section>
            <h3 className="text-base font-bold mb-1.5 text-foreground">{t.domesticTour.whatToBring}</h3>
            <div className="bg-surface rounded-xl shadow-ambient divide-y divide-muted">
              {whatToBring.map((item: string, i: number) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2">
                  <div className="size-5 rounded-full bg-tertiary/10 flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 text-tertiary" />
                  </div>
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Extra Charges + Variable Charges combined */}
        {(extraCharges.length > 0 || variableCharges.length > 0) && (
          <section>
            <h3 className="text-base font-bold mb-1.5 text-foreground">{t.tours.extraCharges}</h3>
            <div className="bg-surface rounded-xl shadow-ambient divide-y divide-muted">
              {extraCharges.map((charge: { name: string; amount: number }, i: number) => (
                <div key={`ec-${i}`} className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    <div className="size-5 rounded-full bg-tertiary/10 flex items-center justify-center shrink-0">
                      <DollarSign className="h-3.5 w-3.5 text-tertiary" />
                    </div>
                    <span className="text-sm text-foreground">{charge.name}</span>
                  </div>
                  <span className="text-sm font-bold text-tertiary">${charge.amount}</span>
                </div>
              ))}
              {variableCharges.map((charge: { name: string; min_amount: number; max_amount: number }, i: number) => (
                <div key={`vc-${i}`} className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    <div className="size-5 rounded-full bg-tertiary/10 flex items-center justify-center shrink-0">
                      <DollarSign className="h-3.5 w-3.5 text-tertiary" />
                    </div>
                    <span className="text-sm text-foreground">{charge.name}</span>
                  </div>
                  <span className="text-sm font-bold text-tertiary">${charge.min_amount} – ${charge.max_amount}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Hotels */}
        {hotels.length > 0 ? (
          <section>
            <h3 className="text-base font-bold mb-1.5 text-foreground">{t.tours.hotels}</h3>
            <div className="space-y-3">
              {hotels.map((hotel: TourHotel, hotelIdx: number) => (
                <div key={hotelIdx} className="rounded-2xl overflow-hidden shadow-ambient bg-surface flex">
                  {/* Left: compact image */}
                  <div className="w-28 shrink-0 relative bg-muted">
                    {hotel.images.length > 0 ? (
                      <Image
                        src={hotel.images[0]}
                        alt={hotel.name}
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <Hotel className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  {/* Right: info */}
                  <div className="flex-1 p-3 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-foreground truncate">{hotel.name}</h4>
                        {hotel.stars && (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {Array.from({ length: hotel.stars }).map((_: unknown, i: number) => (
                              <Star key={i} className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-primary text-base font-bold">${hotel.price.toLocaleString()}</p>
                        <p className="text-muted-foreground text-[10px]">{t.common.perPerson}</p>
                      </div>
                    </div>
                    {hotel.description && (
                      <p className="text-xs text-muted-foreground leading-snug mt-1.5 line-clamp-2">
                        {hotel.description}
                      </p>
                    )}
                    {hotel.booking_url && (
                      <a
                        href={hotel.booking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-1.5 text-[11px] font-semibold text-primary hover:underline"
                      >
                        {t.tours.hotelInfo} →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : tour.hotel_name ? (
          <section>
            <h3 className="text-base font-bold mb-1.5 text-foreground">{t.tours.hotelInfo}</h3>
            <div className="rounded-2xl overflow-hidden shadow-ambient bg-surface flex">
              <div className="w-28 shrink-0 relative bg-muted">
                {hotelImages.length > 0 ? (
                  <Image
                    src={hotelImages[0]}
                    alt={tour.hotel_name}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <Hotel className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 p-3 min-w-0">
                <h4 className="font-bold text-sm text-foreground">{tour.hotel_name}</h4>
                {tour.hotel_stars && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {Array.from({ length: tour.hotel_stars }).map((_: any, i: number) => (
                      <Star key={i} className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : null}
      </div>

      {/* Similar Tours */}
      {similarTours.length > 0 && (
        <section className="mt-4 px-3">
          <h2 className="text-lg font-bold text-foreground mb-3">
            {t.similarTours?.title ?? "O'xshash turlar"}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-3 -mx-3 px-3 snap-x snap-mandatory scrollbar-hide">
            {similarTours.map((st) => (
              <div key={st.id} className="min-w-[260px] max-w-[260px] snap-start">
                <TourCard tour={st} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA Bar — sits above BottomNav */}
      <div className="sticky bottom-16 glass-nav px-6 py-2.5 z-40 mt-4">
        <div className="max-w-2xl mx-auto space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => setShowLeadForm(true)}
              className="flex-1 bg-primary text-white font-bold py-3 rounded-xl text-center hover:bg-primary/90 transition-colors text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              <Send className="h-4 w-4" />
              {t.tours.leaveRequest}
            </button>
            {telegramLink && (
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick('telegram')}
                className="bg-muted text-foreground font-bold py-3 px-5 rounded-xl flex items-center justify-center gap-2 hover:bg-muted/80 transition-all text-sm shrink-0"
              >
                <Send className="h-4 w-4" />
                Telegram
              </a>
            )}
          </div>
          {/* Aloqa button */}
          <button
            onClick={() => { setShowContact(!showContact); if (!showContact) trackClick('call'); }}
            className="w-full bg-surface border border-muted text-foreground font-bold py-2.5 rounded-xl text-center hover:bg-muted/50 transition-colors text-sm flex items-center justify-center gap-2"
          >
            <Phone className="h-4 w-4" />
            {t.tours.contact}
          </button>
          {/* Operator phone display */}
          {showContact && operatorPhone && (
            <div className="bg-surface border border-primary/20 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{operatorPhone}</span>
              </div>
              <a
                href={`tel:${operatorPhone}`}
                className="text-primary text-sm font-bold hover:underline"
              >
                {t.tours.contact}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Lead Form Sheet */}
      <Sheet open={showLeadForm} onOpenChange={setShowLeadForm}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t.tours.leaveRequest}</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <LeadForm
              tourId={tour.id}
              agencyId={tour.agency_id}
              onClose={() => setShowLeadForm(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
