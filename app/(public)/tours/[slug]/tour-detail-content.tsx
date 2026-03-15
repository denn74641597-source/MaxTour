'use client';

import Image from 'next/image';
import Link from 'next/link';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LeadForm } from '@/components/shared/lead-form';
import type { TourHotel } from '@/types';

interface TourDetailContentProps {
  tour: any;
}

export function TourDetailContent({ tour }: TourDetailContentProps) {
  const { t, language } = useTranslation();
  const [showLeadForm, setShowLeadForm] = useState(false);

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

  return (
    <div className="pb-4 bg-[#f6f6f8]">
      {/* Top App Bar */}
      <div className="sticky top-0 z-50 flex items-center bg-white/80 backdrop-blur-md px-3 py-2.5 justify-between border-b border-slate-200">
        <Link
          href="/tours"
          className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-900" />
        </Link>
        <h2 className="text-lg font-bold tracking-tight text-slate-900">{t.tours.tourDetails}</h2>
        <button className="flex size-10 items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
          <Share2 className="h-5 w-5 text-slate-900" />
        </button>
      </div>

      {/* Hero Image */}
      <div className="relative min-h-[260px] w-full overflow-hidden bg-slate-200">
        <Image
          src={allImages[0]}
          alt={tour.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
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
      <div className="px-3 pt-3 pb-1 bg-white">
        <div className="flex justify-between items-start">
          <div className="flex-1 mr-3">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-slate-900">
              {tour.title}
            </h1>
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4 text-primary" />
              <p className="text-slate-600 text-sm font-medium">
                {isDomestic
                  ? `${tour.district ? `${tour.district}, ` : ''}${tour.region || 'O\'zbekiston'}`
                  : `${tour.city ? `${tour.city}, ` : ''}${tour.country}`
                }
              </p>
            </div>

          </div>
          <div className="text-right shrink-0">
            {tour.old_price && (
              <p className="text-slate-400 text-xs line-through">${tour.old_price.toLocaleString()}</p>
            )}
            <p className="text-primary text-xl font-bold">${tour.price.toLocaleString()}</p>
            <p className="text-slate-500 text-xs">{t.common.perPerson}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 px-3 mt-3">
        {tour.duration_days && (
          <div className="bg-white p-2 rounded-xl border border-slate-100 flex flex-col items-center">
            <Clock className="h-4 w-4 text-primary mb-0.5" />
            <span className="text-[10px] uppercase tracking-wider text-slate-500">{t.tours.duration}</span>
            <span className="text-xs font-bold text-slate-900">{tour.duration_days} {t.common.days}</span>
          </div>
        )}
        {tour.departure_date && (
          <div className="bg-white p-2 rounded-xl border border-slate-100 flex flex-col items-center">
            <CalendarDays className="h-4 w-4 text-primary mb-0.5" />
            <span className="text-[10px] uppercase tracking-wider text-slate-500">{t.tours.departure}</span>
            <span className="text-xs font-bold text-slate-900">{formatDate(tour.departure_date)}</span>
          </div>
        )}
        {tour.seats_left !== null && (
          <div className="bg-white p-2 rounded-xl border border-slate-100 flex flex-col items-center">
            <Users className="h-4 w-4 text-primary mb-0.5" />
            <span className="text-[10px] uppercase tracking-wider text-slate-500">{t.common.seatsLeft}</span>
            <span className={`text-xs font-bold ${tour.seats_left <= 5 ? 'text-red-500' : 'text-slate-900'}`}>
              {tour.seats_left} {t.common.left}
            </span>
          </div>
        )}
      </div>

      {/* Airline */}
      {tour.airline && (
        <div className="px-3 mt-3">
          <div className="bg-blue-50 rounded-xl px-3 py-2.5 flex items-center gap-2.5 border border-blue-100">
            <Plane className="h-5 w-5 text-blue-500" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-blue-400">{t.tours.airline}</span>
              <p className="text-sm font-bold text-slate-900">{tour.airline}</p>
            </div>
          </div>
        </div>
      )}

      {/* Agency Profile Card */}
      {agency && (
        <div className="px-3 mt-4">
          <div className="bg-primary/5 rounded-xl p-3 flex items-center justify-between border border-primary/10">
            <div className="flex items-center gap-2.5">
              <div className="size-10 rounded-full bg-slate-200 overflow-hidden relative shrink-0">
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
                  <h4 className="font-bold text-slate-900">{agency.name}</h4>
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
      <div className="px-3 mt-4 space-y-4">
        {/* About */}
        {tour.full_description && (
          <section>
            <h3 className="text-base font-bold mb-1.5 text-slate-900">{t.tours.aboutTour}</h3>
            {isDomestic && tour.domestic_category && (
              <div className="flex items-center gap-1.5 mb-2">
                <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-1 text-xs font-medium border border-emerald-200">
                  {categoryIcons[tour.domestic_category]}
                  <span>{DOMESTIC_CATEGORIES[language]?.[tour.domestic_category] || tour.domestic_category}</span>
                </div>
              </div>
            )}
            <p className="text-sm text-slate-600 leading-snug whitespace-pre-line">
              {tour.full_description}
            </p>
          </section>
        )}

        {/* What's Included */}
        {(includedServices.length > 0 || destinations.length > 0) && (
          <section>
            <h3 className="text-base font-bold mb-1.5 text-slate-900">{t.tours.whatsIncluded}</h3>
            <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">
              {destinations.length > 0 && (
                <div className="flex items-center gap-2.5 px-3 py-2">
                  <div className="size-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <Navigation className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {destinations.map((dest: string, i: number) => (
                      <span key={i} className="text-xs font-medium">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">{dest}</span>
                        {i < destinations.length - 1 && <span className="text-slate-400 mx-0.5">→</span>}
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
                  <span className="text-sm text-slate-700">{service}</span>
                </div>
              ))}
            </div>
          </section>
        )}



        {/* Meeting Point - Domestic */}
        {isDomestic && tour.meeting_point && (
          <section>
            <h3 className="text-base font-bold mb-1.5 text-slate-900">{t.domesticTour.meetingPoint}</h3>
            <div className="bg-white rounded-xl border border-slate-100 px-3 py-2.5">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-700">{tour.meeting_point}</p>
              </div>
            </div>
          </section>
        )}

        {/* Guide Info - Domestic */}
        {isDomestic && (tour.guide_name || tour.guide_phone) && (
          <section>
            <h3 className="text-base font-bold mb-1.5 text-slate-900">{t.domesticTour.guideInfo}</h3>
            <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">
              {tour.guide_name && (
                <div className="flex items-center gap-2.5 px-3 py-2">
                  <div className="size-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <User className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <span className="text-sm text-slate-700">{tour.guide_name}</span>
                </div>
              )}
              {tour.guide_phone && (
                <div className="flex items-center gap-2.5 px-3 py-2">
                  <div className="size-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <Phone className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <span className="text-sm text-slate-700">{tour.guide_phone}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* What to Bring - Domestic */}
        {isDomestic && whatToBring.length > 0 && (
          <section>
            <h3 className="text-base font-bold mb-1.5 text-slate-900">{t.domesticTour.whatToBring}</h3>
            <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">
              {whatToBring.map((item: string, i: number) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2">
                  <div className="size-5 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <span className="text-sm text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Extra Charges */}
        {extraCharges.length > 0 && (
          <section>
            <h3 className="text-base font-bold mb-1.5 text-slate-900">{t.tours.extraCharges}</h3>
            <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">
              {extraCharges.map((charge: { name: string; amount: number }, i: number) => (
                <div key={i} className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    <div className="size-5 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                      <DollarSign className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                    <span className="text-sm text-slate-700">{charge.name}</span>
                  </div>
                  <span className="text-sm font-bold text-amber-600">${charge.amount}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Hotels */}
        {hotels.length > 0 ? (
          <section>
            <h3 className="text-base font-bold mb-1.5 text-slate-900">{t.tours.hotels}</h3>
            <div className="space-y-3">
              {hotels.map((hotel: TourHotel, hotelIdx: number) => (
                <div key={hotelIdx} className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                  {hotel.images.length > 0 ? (
                    <HotelImageCarousel images={hotel.images} hotelName={hotel.name} />
                  ) : (
                    <div className="h-40 w-full bg-slate-200 relative flex items-center justify-center">
                      <Hotel className="h-10 w-10 text-slate-400" />
                    </div>
                  )}
                  <div className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-base text-slate-900">{hotel.name}</h4>
                        {hotel.stars && (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {Array.from({ length: hotel.stars }).map((_: unknown, i: number) => (
                              <Star key={i} className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-primary text-lg font-bold">${hotel.price.toLocaleString()}</p>
                        <p className="text-slate-500 text-[10px]">{t.common.perPerson}</p>
                      </div>
                    </div>
                    {hotel.description && (
                      <p className="text-sm text-slate-600 leading-snug mt-2">
                        {hotel.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : tour.hotel_name ? (
          <section>
            <h3 className="text-base font-bold mb-1.5 text-slate-900">{t.tours.hotelInfo}</h3>
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
              {hotelImages.length > 0 ? (
                <HotelImageCarousel images={hotelImages} hotelName={tour.hotel_name} />
              ) : (
                <div className="h-40 w-full bg-slate-200 relative flex items-center justify-center">
                  <Hotel className="h-10 w-10 text-slate-400" />
                </div>
              )}
              <div className="p-3">
                <h4 className="font-bold text-base text-slate-900">{tour.hotel_name}</h4>
                {tour.hotel_stars && (
                  <div className="flex items-center gap-0.5 mb-1">
                    {Array.from({ length: tour.hotel_stars }).map((_: any, i: number) => (
                      <Star key={i} className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : null}
      </div>

      {/* CTA Bar — sits above BottomNav */}
      <div className="sticky bottom-16 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2.5 z-40 mt-4">
        <div className="max-w-2xl mx-auto flex gap-2">
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
              className="bg-slate-100 text-slate-900 font-bold py-3 px-5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-all text-sm shrink-0"
            >
              <Send className="h-4 w-4" />
              Telegram
            </a>
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
