import type { AdminVerificationRequest } from '@/features/verification/types';

export interface VerificationDocumentItem {
  key: string;
  label: string;
  url: string;
  source: 'request' | 'form' | 'agency';
}

export interface VerificationWarningItem {
  key: string;
  label: string;
  severity: 'low' | 'medium' | 'high';
}

export interface VerificationRiskContext {
  request: AdminVerificationRequest;
  documentCount: number;
  duplicateContactCount: number;
}

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg', '.avif'];

export function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return value;
  } catch {
    return null;
  }
}

export function isImageUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.includes(ext));
}

export function extractVerificationDocuments(request: AdminVerificationRequest): VerificationDocumentItem[] {
  const results: VerificationDocumentItem[] = [];
  const pushDoc = (
    key: string,
    label: string,
    url: string | null | undefined,
    source: VerificationDocumentItem['source']
  ) => {
    const safeUrl = safeHttpUrl(url);
    if (!safeUrl) return;
    results.push({ key, label, url: safeUrl, source });
  };

  pushDoc('certificate_url', 'Submitted Certificate', request.certificate_url, 'request');
  pushDoc(
    'certificate_pdf_url',
    'Company Certificate PDF',
    request.form_data?.certificate_pdf_url,
    'form'
  );
  pushDoc('license_pdf_url', 'License PDF', request.form_data?.license_pdf_url, 'form');
  pushDoc(
    'agency_certificate_pdf_url',
    'Agency Certificate File',
    request.agency?.certificate_pdf_url,
    'agency'
  );
  pushDoc('agency_license_pdf_url', 'Agency License File', request.agency?.license_pdf_url, 'agency');

  const seen = new Set<string>();
  return results.filter((doc) => {
    if (seen.has(doc.url)) return false;
    seen.add(doc.url);
    return true;
  });
}

export function buildVerificationWarnings(context: VerificationRiskContext): VerificationWarningItem[] {
  const { request, documentCount, duplicateContactCount } = context;
  const warnings: VerificationWarningItem[] = [];
  const agency = request.agency;
  const owner = agency?.owner;
  const form = request.form_data;

  if (!agency?.logo_url) {
    warnings.push({ key: 'missing_logo', label: 'Agency logo is missing', severity: 'medium' });
  }

  const hasCompanyName = Boolean(form?.company_name?.trim() || form?.registered_name?.trim());
  if (!hasCompanyName) {
    warnings.push({
      key: 'missing_legal_name',
      label: 'Legal/company name is not provided',
      severity: 'high',
    });
  }

  const hasContact = Boolean(
    agency?.phone?.trim() || owner?.phone?.trim() || owner?.email?.trim() || form?.work_phone?.trim() || form?.work_email?.trim()
  );
  if (!hasContact) {
    warnings.push({
      key: 'missing_contact',
      label: 'Primary contact information is missing',
      severity: 'high',
    });
  }

  if (documentCount === 0) {
    warnings.push({
      key: 'missing_documents',
      label: 'No verification documents were attached',
      severity: 'high',
    });
  }

  if (!agency?.city?.trim()) {
    warnings.push({
      key: 'missing_city',
      label: 'City/region location is missing',
      severity: 'medium',
    });
  }

  const hasLegalInfo = Boolean(form?.inn?.trim() || agency?.inn?.trim() || form?.registration_number?.trim());
  if (!hasLegalInfo) {
    warnings.push({
      key: 'missing_legal_info',
      label: 'Legal identification fields are incomplete',
      severity: 'high',
    });
  }

  if (request.related_tours_count === 0) {
    warnings.push({
      key: 'no_tours',
      label: 'Agency has no tours created',
      severity: 'low',
    });
  }

  const hasCompleteManager = Boolean(owner?.full_name?.trim() && (owner?.phone?.trim() || owner?.email?.trim()));
  if (!hasCompleteManager) {
    warnings.push({
      key: 'manager_incomplete',
      label: 'Manager profile is incomplete',
      severity: 'medium',
    });
  }

  if (duplicateContactCount > 1) {
    warnings.push({
      key: 'duplicate_contact',
      label: `Contact is shared across ${duplicateContactCount} verification requests`,
      severity: 'medium',
    });
  }

  if (!agency?.is_verified && request.related_published_tours_count > 0) {
    warnings.push({
      key: 'unverified_with_published_tours',
      label: 'Agency is unverified while having published tours',
      severity: 'high',
    });
  }

  return warnings;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return 'Not available';
  return parsed.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
