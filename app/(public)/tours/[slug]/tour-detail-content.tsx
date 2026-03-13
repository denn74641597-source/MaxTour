'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin, CalendarDays, Clock, Users,
  ArrowLeft, Share2, Send, Star, BadgeCheck, Check, X, ExternalLink,
  Plane, DollarSign, Navigation,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { formatDate, placeholderImage } from '@/lib/utils';
import { HotelImageCarousel } from '@/components/shared/hotel-image-carousel';

interface TourDetailContentProps {
  tour: any;
}

export function TourDetailContent({ tour }: TourDetailContentProps) {
  const { t } = useTranslation();

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

  const telegramLink = agency?.telegram_username
    ? `https://t.me/${agency.telegram_username.replace('@', '')}`
    : null;

  return (
    <div className="pb-24 bg-[#f6f6f8]">
      {/* Top App Bar */}
      <div className="sticky top-0 z-50 flex items-center bg-white/80 backdrop-blur-md p-4 justify-between border-b border-slate-200">
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
      <div className="relative min-h-[400px] w-full overflow-hidden bg-slate-200">
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
      <div className="px-4 pt-6 bg-white">
        <div className="flex justify-between items-start">
          <div className="flex-1 mr-4">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900">
              {tour.title}
            </h1>
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4 text-primary" />
              <p className="text-slate-600 text-sm font-medium">
                {tour.city ? `${tour.city}, ` : ''}
                {tour.country}
              </p>
            </div>
            {/* Multi-city route */}
            {destinations.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <Navigation className="h-3.5 w-3.5 text-primary shrink-0" />
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
          </div>
          <div className="text-right shrink-0">
            <p className="text-primary text-2xl font-bold">${tour.price.toLocaleString()}</p>
            <p className="text-slate-500 text-xs">{t.common.perPerson}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 px-4 mt-6">
        {tour.duration_days && (
          <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col items-center">
            <Clock className="h-5 w-5 text-primary mb-1" />
            <span className="text-[10px] uppercase tracking-wider text-slate-500">{t.tours.duration}</span>
            <span className="text-sm font-bold text-slate-900">{tour.duration_days} {t.common.days}</span>
          </div>
        )}
        {tour.departure_date && (
          <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col items-center">
            <CalendarDays className="h-5 w-5 text-primary mb-1" />
            <span className="text-[10px] uppercase tracking-wider text-slate-500">{t.tours.departure}</span>
            <span className="text-sm font-bold text-slate-900">{formatDate(tour.departure_date)}</span>
          </div>
        )}
        {tour.seats_left !== null && (
          <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col items-center">
            <Users className="h-5 w-5 text-primary mb-1" />
            <span className="text-[10px] uppercase tracking-wider text-slate-500">{t.common.seatsLeft}</span>
            <span className={`text-sm font-bold ${tour.seats_left <= 5 ? 'text-red-500' : 'text-slate-900'}`}>
              {tour.seats_left} {t.common.left}
            </span>
          </div>
        )}
      </div>

      {/* Airline */}
      {tour.airline && (
        <div className="px-4 mt-4">
          <div className="bg-blue-50 rounded-xl px-4 py-3 flex items-center gap-3 border border-blue-100">
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
        <div className="px-4 mt-8">
          <div className="bg-primary/5 rounded-xl p-4 flex items-center justify-between border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-slate-200 overflow-hidden relative shrink-0">
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
                    <BadgeCheck className="h-4 w-4 text-blue-500 fill-blue-500" />
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
      <div className="px-4 mt-8 space-y-8">
        {/* About */}
        {tour.full_description && (
          <section>
            <h3 className="text-lg font-bold mb-3 text-slate-900">{t.tours.aboutTour}</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {tour.full_description}
            </p>
          </section>
        )}

        {/* What's Included */}
        {includedServices.length > 0 && (
          <section>
            <h3 className="text-lg font-bold mb-3 text-slate-900">{t.tours.whatsIncluded}</h3>
            <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">
              {includedServices.map((service, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="size-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <span className="text-sm text-slate-700">{service}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* What's Excluded */}
        {excludedServices.length > 0 && (
          <section>
            <h3 className="text-lg font-bold mb-3 text-slate-900">{t.tours.whatsExcluded}</h3>
            <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">
              {excludedServices.map((service, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="size-6 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <X className="h-3.5 w-3.5 text-red-400" />
                  </div>
                  <span className="text-sm text-slate-500">{service}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Extra Charges */}
        {extraCharges.length > 0 && (
          <section>
            <h3 className="text-lg font-bold mb-3 text-slate-900">{t.tours.extraCharges}</h3>
            <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">
              {extraCharges.map((charge: { name: string; amount: number }, i: number) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="size-6 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
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

        {/* Hotel Info */}
        {tour.hotel_name && (
          <section>
            <h3 className="text-lg font-bold mb-3 text-slate-900">{t.tours.hotelInfo}</h3>
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
              {/* Hotel Image Carousel */}
              {hotelImages.length > 0 ? (
                <HotelImageCarousel images={hotelImages} hotelName={tour.hotel_name} />
              ) : (
                <div className="h-48 w-full bg-slate-200 relative">
                  <Image
                    src={allImages[1] || placeholderImage(800, 400, tour.hotel_name)}
                    alt={tour.hotel_name}
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                </div>
              )}
              <div className="p-4">
                <h4 className="font-bold text-lg text-slate-900">{tour.hotel_name}</h4>
                {tour.hotel_stars && (
                  <div className="flex items-center gap-0.5 mb-2">
                    {Array.from({ length: tour.hotel_stars }).map((_: any, i: number) => (
                      <Star key={i} className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                )}
                {tour.short_description && (
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {tour.short_description}
                  </p>
                )}
                {tour.hotel_booking_url && (
                  <a
                    href={tour.hotel_booking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Booking.com
                  </a>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 z-50">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Link
            href={`/tours/${tour.slug}#request`}
            className="flex-1 bg-slate-100 text-slate-900 font-bold py-4 rounded-xl text-center hover:bg-slate-200 transition-colors text-sm"
          >
            {t.tours.leaveRequest}
          </Link>
          {telegramLink ? (
            <a
              href={telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-[1.5] bg-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all text-sm"
            >
              <Send className="h-4 w-4" />
              {t.tours.contactTelegram}
            </a>
          ) : (
            <button className="flex-[1.5] bg-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all text-sm">
              <Send className="h-4 w-4" />
              {t.tours.contactTelegram}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
