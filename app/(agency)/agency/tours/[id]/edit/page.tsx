import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getMyAgency } from '@/features/agencies/queries';
import { EditTourContent } from './edit-tour-content';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditTourPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const [agency, tourRes] = await Promise.all([
    getMyAgency(),
    supabase.from('tours').select('*').eq('id', id).single(),
  ]);

  const tour = tourRes.data;
  if (!tour) notFound();

  return (
    <EditTourContent
      tourId={tour.id}
      tourTitle={tour.title}
      initialData={{
        title: tour.title,
        slug: tour.slug,
        full_description: tour.full_description ?? undefined,
        country: tour.country,
        city: tour.city ?? undefined,
        departure_date: tour.departure_date ?? undefined,
        departure_month: tour.departure_month ?? undefined,
        return_date: tour.return_date ?? undefined,
        duration_days: tour.duration_days ?? undefined,
        duration_nights: tour.duration_nights ?? undefined,
        price: tour.price,
        currency: tour.currency,
        seats_total: tour.seats_total ?? undefined,
        seats_left: tour.seats_left ?? undefined,
        hotel_name: tour.hotel_name ?? undefined,
        hotel_stars: tour.hotel_stars ?? undefined,
        old_price: tour.old_price ?? undefined,
        hotel_booking_url: tour.hotel_booking_url ?? undefined,
        hotel_images: tour.hotel_images ?? [],
        hotels: tour.hotels ?? [],
        combo_hotels: tour.combo_hotels ?? [],
        destinations: tour.destinations ?? [],
        airline: tour.airline ?? undefined,
        extra_charges: tour.extra_charges ?? [],
        variable_charges: tour.variable_charges ?? [],
        cover_image_url: tour.cover_image_url ?? undefined,
        meal_type: tour.meal_type,
        transport_type: tour.transport_type,
        visa_required: tour.visa_required,
        included_services: tour.included_services ?? [],
        operator_telegram_username: tour.operator_telegram_username ?? undefined,
        operator_phone: tour.operator_phone ?? undefined,
        category: tour.category ?? undefined,
        additional_info: tour.additional_info ?? undefined,
        tour_type: tour.tour_type ?? 'international',
        domestic_category: tour.domestic_category ?? undefined,
        region: tour.region ?? undefined,
        district: tour.district ?? undefined,
        meeting_point: tour.meeting_point ?? undefined,
        what_to_bring: tour.what_to_bring ?? [],
        guide_name: tour.guide_name ?? undefined,
        guide_phone: tour.guide_phone ?? undefined,
        status: tour.status,
      }}
    />
  );
}
