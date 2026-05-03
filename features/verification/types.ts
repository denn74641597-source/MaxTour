import type { VerificationFormData, VerificationStatus } from '@/types';

export interface VerificationAgencyOwner {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  telegram_username: string | null;
  avatar_url: string | null;
  role: string | null;
}

export interface VerificationTourPreview {
  id: string;
  agency_id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  country: string | null;
  city: string | null;
  cover_image_url: string | null;
}

export interface AdminVerificationAgency {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  phone: string | null;
  telegram_username: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
  inn: string | null;
  responsible_person: string | null;
  website_url: string | null;
  instagram_url: string | null;
  certificate_pdf_url: string | null;
  license_pdf_url: string | null;
  is_verified: boolean;
  is_approved: boolean;
  owner: VerificationAgencyOwner | null;
}

export interface AdminVerificationRequest {
  id: string;
  agency_id: string;
  certificate_url: string | null;
  form_data: VerificationFormData | null;
  status: VerificationStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  agency: AdminVerificationAgency | null;
  related_tours_count: number;
  related_published_tours_count: number;
  recent_tours: VerificationTourPreview[];
}
