import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { EditTourContent } from './edit-tour-content';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditTourPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: tour } = await supabase
    .from('tours')
    .select('*')
    .eq('id', id)
    .single();

  if (!tour) notFound();

  return (
    <EditTourContent
      tourId={tour.id}
      tourTitle={tour.title}
      initialData={{
        title: tour.title,
        slug: tour.slug,
        short_description: tour.short_description ?? undefined,
        full_description: tour.full_description ?? undefined,
        country: tour.country,
        city: tour.city ?? undefined,
        departure_date: tour.departure_date ?? undefined,
        return_date: tour.return_date ?? undefined,
        duration_days: tour.duration_days ?? undefined,
        price: tour.price,
        currency: tour.currency,
        seats_total: tour.seats_total ?? undefined,
        seats_left: tour.seats_left ?? undefined,
        hotel_name: tour.hotel_name ?? undefined,
        hotel_stars: tour.hotel_stars ?? undefined,
        hotel_booking_url: tour.hotel_booking_url ?? undefined,
        hotel_images: tour.hotel_images ?? [],
        destinations: tour.destinations ?? [],
        airline: tour.airline ?? undefined,
        extra_charges: tour.extra_charges ?? [],
        cover_image_url: tour.cover_image_url ?? undefined,
        meal_type: tour.meal_type,
        transport_type: tour.transport_type,
        visa_required: tour.visa_required,
        included_services: tour.included_services ?? [],
        excluded_services: tour.excluded_services ?? [],
        status: tour.status,
      }}
    />
  );
}
