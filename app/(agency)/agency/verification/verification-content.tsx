'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';
import { submitVerificationFormRequest } from '@/features/verification/actions';
import { uploadPdfAction } from '@/features/upload/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Upload,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Loader2,
  Building2,
  Scale,
  X,
} from 'lucide-react';
import type { Agency, VerificationRequest, VerificationFormData } from '@/types';

interface VerificationContentProps {
  agency: Agency;
  requests: VerificationRequest[];
}

export function VerificationContent({ agency, requests }: VerificationContentProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const latestRequest = requests[0] ?? null;
  const hasPending = latestRequest?.status === 'pending';
  const isApproved = latestRequest?.status === 'approved';
  const isRejected = latestRequest?.status === 'rejected';

  // Form state - pre-fill from agency data where possible
  const [form, setForm] = useState<VerificationFormData>({
    company_name: agency.name || '',
    registered_name: '',
    country: agency.country || 'Uzbekistan',
    office_address: agency.address || '',
    work_phone: agency.phone || '',
    work_email: '',
    telegram_link: agency.telegram_username || '',
    instagram_url: agency.instagram_url || '',
    website_url: agency.website_url || '',
    inn: agency.inn || '',
    registration_number: '',
    certificate_pdf_url: agency.certificate_pdf_url || '',
    license_pdf_url: agency.license_pdf_url || '',
  });

  const [uploadingField, setUploadingField] = useState<string | null>(null);

  function updateField(field: keyof VerificationFormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handlePdfUpload(field: 'certificate_pdf_url' | 'license_pdf_url', file: File) {
    setUploadingField(field);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', field === 'certificate_pdf_url' ? 'certificates' : 'licenses');
      const res = await uploadPdfAction(fd);
      if (res.url) {
        updateField(field, res.url);
      } else {
        toast.error('Tizimda xatolik');
      }
    } finally {
      setUploadingField(null);
    }
  }

  function isFormValid(): boolean {
    return !!(
      form.company_name.trim() &&
      form.registered_name.trim() &&
      form.country.trim() &&
      form.office_address.trim() &&
      form.work_phone.trim() &&
      form.work_email.trim() &&
      form.telegram_link.trim() &&
      form.inn.trim() &&
      form.registration_number.trim() &&
      form.certificate_pdf_url &&
      form.license_pdf_url
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid()) {
      toast.error(t.verification.allFieldsRequired);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitVerificationFormRequest(agency.id, form);
      if (result.error) {
        toast.error('Tizimda xatolik');
        return;
      }
      toast.success(t.verification.successMessage);
      router.refresh();
    } catch {
      toast.error('Tizimda xatolik');
    } finally {
      setIsSubmitting(false);
    }
  }

  function PdfUploadField({ label, hint, field, value }: {
    label: string;
    hint: string;
    field: 'certificate_pdf_url' | 'license_pdf_url';
    value: string;
  }) {
    const isUploading = uploadingField === field;
    if (value) {
      const fileName = decodeURIComponent(value.split('/').pop() || 'document.pdf');
      return (
        <div className="space-y-1.5">
          <Label>{label}</Label>
          <div className="flex items-center gap-2 bg-primary/5 rounded-xl px-3 py-2.5">
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs truncate flex-1">{fileName}</span>
            <button type="button" onClick={() => updateField(field, '')} className="shrink-0 p-1 rounded-full hover:bg-destructive/10 transition-colors">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-[11px] text-muted-foreground">{hint}</span>
            </>
          )}
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePdfUpload(field, file);
              e.target.value = '';
            }}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          {t.verification.title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t.verification.description}</p>
      </div>

      {/* Status Banner */}
      {hasPending && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-sm text-yellow-800">{t.verification.pending}</h3>
                <p className="text-xs text-yellow-700 mt-1">{t.verification.pendingDescription}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isApproved && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-sm text-green-800">{t.verification.approved}</h3>
                <p className="text-xs text-green-700 mt-1">{t.verification.approvedDescription}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isRejected && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-sm text-red-800">{t.verification.rejected}</h3>
                <p className="text-xs text-red-700 mt-1">{t.verification.rejectedDescription}</p>
                {latestRequest.admin_note && (
                  <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800">
                    <span className="font-medium">{t.verification.adminNote}:</span> {latestRequest.admin_note}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Verification Form — show when no pending request */}
      {!hasPending && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Info */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                {t.verification.companyInfo}
              </h2>

              <div className="space-y-1.5">
                <Label>{t.verification.companyName} *</Label>
                <Input value={form.company_name} onChange={e => updateField('company_name', e.target.value)} placeholder={t.verification.companyNamePlaceholder} />
              </div>

              <div className="space-y-1.5">
                <Label>{t.verification.registeredName} *</Label>
                <Input value={form.registered_name} onChange={e => updateField('registered_name', e.target.value)} placeholder={t.verification.registeredNamePlaceholder} />
              </div>

              <div className="space-y-1.5">
                <Label>{t.verification.country} *</Label>
                <Input value={form.country} onChange={e => updateField('country', e.target.value)} placeholder={t.verification.countryPlaceholder} />
              </div>

              <div className="space-y-1.5">
                <Label>{t.verification.officeAddress} *</Label>
                <Input value={form.office_address} onChange={e => updateField('office_address', e.target.value)} placeholder={t.verification.officeAddressPlaceholder} />
              </div>

              <div className="space-y-1.5">
                <Label>{t.verification.workPhone} *</Label>
                <Input type="tel" value={form.work_phone} onChange={e => updateField('work_phone', e.target.value)} placeholder={t.verification.workPhonePlaceholder} />
              </div>

              <div className="space-y-1.5">
                <Label>{t.verification.workEmail} *</Label>
                <Input type="email" value={form.work_email} onChange={e => updateField('work_email', e.target.value)} placeholder={t.verification.workEmailPlaceholder} />
              </div>

              <div className="space-y-1.5">
                <Label>{t.verification.telegramLink} *</Label>
                <Input value={form.telegram_link} onChange={e => updateField('telegram_link', e.target.value)} placeholder={t.verification.telegramLinkPlaceholder} />
              </div>

              <div className="space-y-1.5">
                <Label>{t.verification.instagramUrl}</Label>
                <Input value={form.instagram_url} onChange={e => updateField('instagram_url', e.target.value)} placeholder={t.verification.instagramUrlPlaceholder} />
              </div>

              <div className="space-y-1.5">
                <Label>{t.verification.websiteUrl}</Label>
                <Input value={form.website_url} onChange={e => updateField('website_url', e.target.value)} placeholder={t.verification.websiteUrlPlaceholder} />
              </div>
            </CardContent>
          </Card>

          {/* Legal Info */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                {t.verification.legalInfo}
              </h2>

              <div className="space-y-1.5">
                <Label>{t.verification.inn} *</Label>
                <Input value={form.inn} onChange={e => updateField('inn', e.target.value)} placeholder={t.verification.innPlaceholder} />
              </div>

              <div className="space-y-1.5">
                <Label>{t.verification.registrationNumber} *</Label>
                <Input value={form.registration_number} onChange={e => updateField('registration_number', e.target.value)} placeholder={t.verification.registrationNumberPlaceholder} />
              </div>

              <PdfUploadField
                label={`${t.verification.certificatePdf} *`}
                hint={t.verification.pdfHint}
                field="certificate_pdf_url"
                value={form.certificate_pdf_url}
              />

              <PdfUploadField
                label={`${t.verification.licensePdf} *`}
                hint={t.verification.pdfHint}
                field="license_pdf_url"
                value={form.license_pdf_url}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={isSubmitting || !isFormValid()}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t.verification.submitting}
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" />
                {t.verification.submit}
              </>
            )}
          </Button>
        </form>
      )}

      {/* History */}
      {requests.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">{t.verification.title}</h3>
          {requests.map((req) => (
            <Card key={req.id} className="opacity-80">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {req.status === 'pending' && <Clock className="h-4 w-4 text-yellow-500" />}
                  {req.status === 'approved' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {req.status === 'rejected' && <XCircle className="h-4 w-4 text-red-500" />}
                  <span className="text-xs capitalize">{req.status}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(req.created_at).toLocaleDateString()}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
