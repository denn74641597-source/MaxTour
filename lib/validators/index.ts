import { z } from 'zod';

export const leadFormSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  people_count: z.number().int().min(1).max(100),
  telegram_username: z.string().optional(),
  comment: z.string().max(500, 'Comment must be under 500 characters').optional(),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;

export const agencyProfileSchema = z.object({
  name: z.string().min(2, 'Agency name is required'),
  description: z.string().min(1, 'Description is required').max(2000),
  phone: z.string().min(7, 'Enter a valid phone number'),
  telegram_username: z.string().min(1, 'Telegram username is required'),
  instagram_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  google_maps_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  inn: z.string().min(1, 'INN is required'),
  responsible_person: z.string().min(1, 'Responsible person is required'),
});

export type AgencyProfileData = z.infer<typeof agencyProfileSchema>;

export const tourHotelSchema = z.object({
  name: z.string().optional().or(z.literal('')).transform((v) => v || ''),
  stars: z.coerce.number().int().min(1).max(5).nullable().default(null),
  price: z.coerce.number().optional().default(0),
  description: z.string().nullable().default(null),
  booking_url: z.string().optional().or(z.literal('')).transform(v => v || null),
  images: z.array(z.string()).default([]),
});

export type TourHotelFormData = z.infer<typeof tourHotelSchema>;

export const comboHotelEntrySchema = z.object({
  city: z.string().optional().or(z.literal('')).transform((v) => v || ''),
  name: z.string().optional().or(z.literal('')).transform((v) => v || ''),
  booking_url: z.string().optional().or(z.literal('')).transform(v => v || null),
  image_url: z.string().optional().or(z.literal('')).transform(v => v || null),
});

export const comboHotelVariantSchema = z.object({
  price: z.coerce.number().optional().default(0),
  hotels: z.array(comboHotelEntrySchema).default([]),
});

export type ComboHotelVariantFormData = z.infer<typeof comboHotelVariantSchema>;

export const tourSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional().or(z.literal('')).default(''),
  full_description: z.string().optional().or(z.literal('')),
  tour_type: z.enum(['international', 'domestic']).default('international'),
  // International fields
  country: z.string().optional(),
  city: z.string().optional(),
  departure_date: z.string().optional(),
  departure_month: z.string().optional(),
  return_date: z.string().optional(),
  duration_days: z.coerce.number().int().min(0).optional(),
  duration_nights: z.coerce.number().int().min(0).optional(),
  price: z.coerce.number().optional().default(0),
  old_price: z.coerce.number().min(0).optional(),
  currency: z.enum(['USD', 'UZS', 'EUR']).default('USD'),
  seats_total: z.coerce.number().int().min(0).optional(),
  seats_left: z.coerce.number().int().min(0).optional(),
  hotel_name: z.string().optional().or(z.literal('')),
  hotel_stars: z.coerce.number().int().min(1).max(5).optional(),
  hotel_booking_url: z.string().optional().or(z.literal('')),
  hotel_images: z.array(z.string()).default([]),
  hotels: z.array(tourHotelSchema).default([]),
  combo_hotels: z.array(comboHotelVariantSchema).default([]),
  destinations: z.array(z.string()).default([]),
  airline: z.string().optional().or(z.literal('')),
  extra_charges: z.array(z.object({ name: z.string(), amount: z.coerce.number(), required: z.boolean().default(true) })).default([]),
  variable_charges: z.array(z.object({ name: z.string(), min_amount: z.coerce.number(), max_amount: z.coerce.number(), required: z.boolean().default(true) })).default([]),
  meal_type: z
    .enum(['none', 'breakfast', 'half_board', 'full_board', 'all_inclusive'])
    .default('none'),
  transport_type: z.enum(['flight', 'bus', 'train', 'self', 'mixed']).default('flight'),
  visa_required: z.boolean().default(false),
  included_services: z.array(z.string()).default([]),
  operator_telegram_username: z.string().optional().or(z.literal('')),
  operator_phone: z.string().optional().or(z.literal('')),
  category: z.string().optional().or(z.literal('')),
  additional_info: z.string().optional().or(z.literal('')),
  // Domestic fields
  domestic_category: z.enum(['excursion', 'nature', 'historical', 'pilgrimage', 'recreation', 'adventure']).optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  meeting_point: z.string().optional(),
  what_to_bring: z.array(z.string()).default([]),
  guide_name: z.string().optional(),
  guide_phone: z.string().optional(),
  status: z.enum(['draft', 'pending', 'published', 'archived']).default('draft'),
});

export type TourFormData = z.infer<typeof tourSchema>;
