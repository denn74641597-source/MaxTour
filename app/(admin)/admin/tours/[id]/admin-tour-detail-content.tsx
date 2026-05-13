'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Calendar, Clock, Users, DollarSign,
  Plane, Star, Globe, Hotel, CheckCircle2, XCircle,
  Phone, Send, Eye, Utensils, Bus, ShieldCheck,
} from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';
import { updateTourStatusAction } from '@/features/admin/actions';
import { toast } from 'sonner';
import type { Tour, TourHotel } from '@/types';

interface Props {
  tour: Tour;
}

const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
  draft: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  published: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  archived: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

const mealLabels: Record<string, string> = {
  none: 'Ovqatsiz',
  breakfast: 'Nonushta',
  half_board: 'Yarim pansion',
  full_board: 'To\'liq pansion',
  all_inclusive: 'Hammasini o\'z ichiga oladi',
};

const transportLabels: Record<string, string> = {
  flight: 'Samolyot',
  bus: 'Avtobus',
  train: 'Poyezd',
  self: 'O\'zi',
  mixed: 'Aralash',
};

export function AdminTourDetailContent({ tour }: Props) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  const style = statusStyles[tour.status] || statusStyles.draft;
  const agency = tour.agency;
  const hotels = (tour.hotels as TourHotel[]) ?? [];
  const images = tour.images ?? [];
  const allImages = [
    ...(tour.cover_image_url ? [tour.cover_image_url] : []),
    ...images.sort((a, b) => a.sort_order - b.sort_order).map(i => i.image_url),
  ];

  const location = tour.tour_type === 'domestic'
    ? [tour.district, tour.region].filter(Boolean).join(', ') || 'O\'zbekiston'
    : [tour.city, tour.country].filter(Boolean).join(', ');

  async function handleStatusChange(newStatus: string) {
    let grantApprovalBonus = false;
    if (newStatus === 'published') {
      grantApprovalBonus = window.confirm('Give 2 MaxCoin approval bonus to this tour\'s agency?');
    }

    setProcessing(true);
    const result = await updateTourStatusAction(
      tour.id,
      newStatus,
      newStatus === 'published' ? { grantApprovalBonus } : {}
    );
    setProcessing(false);
    if (result.error) {
      toast.error('Xatolik yuz berdi');
    } else {
      if (newStatus === 'published') {
        if (result.bonusError) {
          toast.error(`Tur nashr qilindi, bonus berishda xatolik: ${result.bonusError}`);
        } else if (result.bonusGranted) {
          toast.success('Tur nashr qilindi va 2 MaxCoin bonus berildi');
        } else {
          toast.success('Tur nashr qilindi (bonus berilmadi)');
        }
      } else {
        toast.success('Tur holati yangilandi');
      }
      router.refresh();
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/admin/tours')} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900 truncate">{tour.title}</h1>
          <p className="text-sm text-slate-500">ID: {tour.id}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border ${style.bg} ${style.text} ${style.border}`}>
          {tour.status}
        </span>
      </div>

      {/* Images */}
      {allImages.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {allImages.map((url, idx) => (
            <div key={idx} className={`relative rounded-xl overflow-hidden bg-slate-100 ${idx === 0 ? 'col-span-2 row-span-2 aspect-[4/3]' : 'aspect-square'}`}>
              <Image
                src={url}
                alt={`${tour.title} - ${idx + 1}`}
                fill
                className="object-cover"
                sizes={idx === 0 ? '50vw' : '25vw'}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="h-48 rounded-xl bg-slate-100 flex items-center justify-center">
          <p className="text-slate-400 text-sm">Rasm yuklanmagan</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h2 className="font-bold text-slate-900">Asosiy ma&apos;lumotlar</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InfoItem icon={<MapPin className="h-4 w-4" />} label="Joylashuv" value={location} />
              <InfoItem icon={<Globe className="h-4 w-4" />} label="Tur turi" value={tour.tour_type === 'domestic' ? 'Ichki' : 'Xalqaro'} />
              <InfoItem icon={<DollarSign className="h-4 w-4" />} label="Narx" value={formatPrice(tour.price, tour.currency)} />
              {tour.old_price && (
                <InfoItem icon={<DollarSign className="h-4 w-4" />} label="Eski narx" value={formatPrice(tour.old_price, tour.currency)} strikethrough />
              )}
              {tour.duration_days && (
                <InfoItem icon={<Clock className="h-4 w-4" />} label="Davomiyligi" value={`${tour.duration_days} kun${tour.duration_nights ? ` / ${tour.duration_nights} tun` : ''}`} />
              )}
              {tour.departure_date && (
                <InfoItem icon={<Calendar className="h-4 w-4" />} label="Jo'nash sanasi" value={formatDate(tour.departure_date)} />
              )}
              {tour.return_date && (
                <InfoItem icon={<Calendar className="h-4 w-4" />} label="Qaytish sanasi" value={formatDate(tour.return_date)} />
              )}
              {tour.departure_month && (
                <InfoItem icon={<Calendar className="h-4 w-4" />} label="Jo'nash oyi" value={tour.departure_month} />
              )}
              <InfoItem icon={<Users className="h-4 w-4" />} label="Joylar" value={`${tour.seats_left ?? '—'} / ${tour.seats_total ?? '—'}`} />
              <InfoItem icon={<Utensils className="h-4 w-4" />} label="Ovqat" value={mealLabels[tour.meal_type] || tour.meal_type} />
              <InfoItem icon={<Bus className="h-4 w-4" />} label="Transport" value={transportLabels[tour.transport_type] || tour.transport_type} />
              {tour.airline && (
                <InfoItem icon={<Plane className="h-4 w-4" />} label="Aviakompaniya" value={tour.airline} />
              )}
              <InfoItem icon={<Eye className="h-4 w-4" />} label="Ko'rishlar" value={String(tour.view_count)} />
              <InfoItem
                icon={tour.visa_required ? <CheckCircle2 className="h-4 w-4 text-amber-500" /> : <XCircle className="h-4 w-4 text-slate-400" />}
                label="Viza"
                value={tour.visa_required ? 'Talab qilinadi' : 'Talab qilinmaydi'}
              />
              {tour.category && (
                <InfoItem icon={<Star className="h-4 w-4" />} label="Kategoriya" value={tour.category} />
              )}
              {tour.is_featured && (
                <InfoItem icon={<Star className="h-4 w-4 text-amber-500" />} label="Featured" value="Ha" />
              )}
            </div>

            {/* Destinations */}
            {tour.destinations && tour.destinations.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">Yo&apos;nalishlar</p>
                <div className="flex flex-wrap gap-1.5">
                  {tour.destinations.map((d, i) => (
                    <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">{d}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {(tour.short_description || tour.full_description) && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <h2 className="font-bold text-slate-900">Tavsif</h2>
              {tour.short_description && (
                <p className="text-sm text-slate-600">{tour.short_description}</p>
              )}
              {tour.full_description && (
                <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border-t border-slate-100 pt-3">
                  {tour.full_description}
                </div>
              )}
            </div>
          )}

          {/* Services */}
          {(tour.included_services?.length > 0 || tour.excluded_services?.length > 0) && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <h2 className="font-bold text-slate-900">Xizmatlar</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tour.included_services?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-emerald-600 mb-2">Narxga kiritilgan</p>
                    <ul className="space-y-1">
                      {tour.included_services.map((s, i) => (
                        <li key={i} className="text-sm text-slate-700 flex items-start gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {tour.excluded_services?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-red-600 mb-2">Narxga kiritilmagan</p>
                    <ul className="space-y-1">
                      {tour.excluded_services.map((s, i) => (
                        <li key={i} className="text-sm text-slate-700 flex items-start gap-1.5">
                          <XCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hotels */}
          {hotels.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <h2 className="font-bold text-slate-900">Mehmonxonalar</h2>
              <div className="space-y-3">
                {hotels.map((hotel, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                    {hotel.images?.[0] ? (
                      <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 relative bg-slate-200">
                        <Image src={hotel.images[0]} alt={hotel.name} fill className="object-cover" sizes="80px" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                        <Hotel className="h-6 w-6 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900">{hotel.name}</p>
                      {hotel.stars && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {Array.from({ length: hotel.stars }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          ))}
                        </div>
                      )}
                      <p className="text-sm font-bold text-blue-600 mt-1">{formatPrice(hotel.price)}</p>
                      {hotel.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{hotel.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extra charges */}
          {(tour.extra_charges?.length > 0 || tour.variable_charges?.length > 0) && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <h2 className="font-bold text-slate-900">Qo&apos;shimcha to&apos;lovlar</h2>
              {tour.extra_charges?.length > 0 && (
                <div className="space-y-1">
                  {tour.extra_charges.map((c, i) => (
                    <div key={i} className="flex justify-between text-sm py-1.5 border-b border-slate-50">
                      <span className="text-slate-700">{c.name} {c.required && <span className="text-red-500 text-xs">(majburiy)</span>}</span>
                      <span className="font-medium text-slate-900">{formatPrice(c.amount, tour.currency)}</span>
                    </div>
                  ))}
                </div>
              )}
              {tour.variable_charges?.length > 0 && (
                <div className="space-y-1 mt-2">
                  {tour.variable_charges.map((c, i) => (
                    <div key={i} className="flex justify-between text-sm py-1.5 border-b border-slate-50">
                      <span className="text-slate-700">{c.name} {c.required && <span className="text-red-500 text-xs">(majburiy)</span>}</span>
                      <span className="font-medium text-slate-900">{formatPrice(c.min_amount, tour.currency)} – {formatPrice(c.max_amount, tour.currency)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Additional info */}
          {tour.additional_info && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
              <h2 className="font-bold text-slate-900">Qo&apos;shimcha ma&apos;lumot</h2>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{tour.additional_info}</p>
            </div>
          )}

          {/* Domestic-specific */}
          {tour.tour_type === 'domestic' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <h2 className="font-bold text-slate-900">Ichki tur ma&apos;lumotlari</h2>
              <div className="grid grid-cols-2 gap-3">
                {tour.domestic_category && <InfoItem icon={<Star className="h-4 w-4" />} label="Kategoriya" value={tour.domestic_category} />}
                {tour.meeting_point && <InfoItem icon={<MapPin className="h-4 w-4" />} label="Yig'ilish joyi" value={tour.meeting_point} />}
                {tour.guide_name && <InfoItem icon={<Users className="h-4 w-4" />} label="Gid" value={tour.guide_name} />}
                {tour.guide_phone && <InfoItem icon={<Phone className="h-4 w-4" />} label="Gid telefon" value={tour.guide_phone} />}
              </div>
              {tour.what_to_bring?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1.5">Nima olib kelish kerak</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tour.what_to_bring.map((item, i) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">{item}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <h2 className="font-bold text-slate-900">Holatni boshqarish</h2>
            <div className="grid grid-cols-2 gap-2">
              {(['draft', 'pending', 'published', 'archived'] as const).map(s => {
                const isActive = tour.status === s;
                const sty = statusStyles[s];
                return (
                  <button
                    key={s}
                    onClick={() => !isActive && handleStatusChange(s)}
                    disabled={isActive || processing}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-colors border ${
                      isActive
                        ? `${sty.bg} ${sty.text} ${sty.border}`
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    } disabled:opacity-60`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agency Info */}
          {agency && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <h2 className="font-bold text-slate-900">Agentlik</h2>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0">
                  {agency.logo_url ? (
                    <Image src={agency.logo_url} alt={agency.name} width={48} height={48} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center">
                      <span className="text-white font-bold">{agency.name?.[0]?.toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-slate-900 truncate">{agency.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {agency.is_verified && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600">
                        <ShieldCheck className="h-3 w-3" /> Tasdiqlangan
                      </span>
                    )}
                    {agency.is_approved && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" /> Approved
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {agency.phone && (
                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-slate-400" /> {agency.phone}
                </p>
              )}
              {agency.telegram_username && (
                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Send className="h-3 w-3 text-slate-400" /> @{agency.telegram_username}
                </p>
              )}
              {agency.slug && (
                <Link
                  href={`/agencies/${agency.slug}`}
                  target="_blank"
                  className="block text-xs text-blue-600 hover:underline mt-1"
                >
                  Agentlik sahifasini ko&apos;rish →
                </Link>
              )}
            </div>
          )}

          {/* Operator Contact */}
          {(tour.operator_telegram_username || tour.operator_phone) && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
              <h2 className="font-bold text-slate-900">Operator</h2>
              {tour.operator_phone && (
                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-slate-400" /> {tour.operator_phone}
                </p>
              )}
              {tour.operator_telegram_username && (
                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Send className="h-3 w-3 text-slate-400" /> @{tour.operator_telegram_username}
                </p>
              )}
            </div>
          )}

          {/* Timestamps */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
            <h2 className="font-bold text-slate-900">Vaqtlar</h2>
            <p className="text-xs text-slate-600 flex justify-between">
              <span>Yaratilgan:</span>
              <span className="font-medium">{formatDate(tour.created_at)}</span>
            </p>
            <p className="text-xs text-slate-600 flex justify-between">
              <span>Yangilangan:</span>
              <span className="font-medium">{formatDate(tour.updated_at)}</span>
            </p>
          </div>

          {/* Public link */}
          <Link
            href={`/tours/${tour.slug}`}
            target="_blank"
            className="block w-full text-center bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Saytda ko&apos;rish →
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value, strikethrough }: { icon: React.ReactNode; label: string; value: string; strikethrough?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-medium text-slate-900 ${strikethrough ? 'line-through text-slate-400' : ''}`}>{value}</p>
      </div>
    </div>
  );
}
