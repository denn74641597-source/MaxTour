import { z } from 'zod';

export const leadFormSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  telegram_username: z.string().optional(),
  comment: z.string().max(500, 'Comment must be under 500 characters').optional(),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;

export const agencyProfileSchema = z.object({
  name: z.string().min(2, 'Agency name is required'),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  description: z.string().max(2000).optional(),
  phone: z.string().min(7, 'Enter a valid phone number').optional(),
  telegram_username: z.string().optional(),
  instagram_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  website_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  google_maps_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
});

export type AgencyProfileData = z.infer<typeof agencyProfileSchema>;

export const tourHotelSchema = z.object({
  name: z.string().min(1, 'Hotel name is required'),
  stars: z.coerce.number().int().min(1).max(5).nullable().default(null),
  price: z.coerce.number().positive('Price must be greater than 0'),
  description: z.string().max(1000).nullable().default(null),
  booking_url: z.string().url().optional().or(z.literal('')).transform(v => v || null),
  images: z.array(z.string()).default([]),
});

export type TourHotelFormData = z.infer<typeof tourHotelSchema>;

export const tourSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  short_description: z.string().max(300).optional(),
  full_description: z.string().max(5000).optional(),
  country: z.string().min(1, 'Country is required'),
  city: z.string().optional(),
  departure_date: z.string().optional(),
  return_date: z.string().optional(),
  duration_days: z.coerce.number().int().positive().optional(),
  price: z.coerce.number().positive('Price must be greater than 0'),
  old_price: z.coerce.number().positive().optional(),
  currency: z.enum(['USD', 'UZS', 'EUR']).default('USD'),
  seats_total: z.coerce.number().int().positive().optional(),
  seats_left: z.coerce.number().int().min(0).optional(),
  hotel_name: z.string().optional(),
  hotel_stars: z.coerce.number().int().min(1).max(5).optional(),
  hotel_booking_url: z.string().url().optional().or(z.literal('')),
  hotel_images: z.array(z.string()).default([]),
  hotels: z.array(tourHotelSchema).default([]),
  destinations: z.array(z.string()).default([]),
  airline: z.string().optional().or(z.literal('')),
  extra_charges: z.array(z.object({ name: z.string(), amount: z.coerce.number() })).default([]),
  meal_type: z
    .enum(['none', 'breakfast', 'half_board', 'full_board', 'all_inclusive'])
    .default('none'),
  transport_type: z.enum(['flight', 'bus', 'train', 'self', 'mixed']).default('flight'),
  visa_required: z.boolean().default(false),
  included_services: z.array(z.string()).default([]),
  excluded_services: z.array(z.string()).default([]),
  status: z.enum(['draft', 'pending', 'published', 'archived']).default('draft'),
});

export type TourFormData = z.infer<typeof tourSchema>;
