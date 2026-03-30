'use client';

import { useState } from 'react';
import {
  approveVerificationAction,
  rejectVerificationAction,
} from '@/features/verification/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Building2,
  Phone,
  Mail,
  Globe,
  FileText,
  Scale,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { VerificationFormData } from '@/types';

interface Props {
  requests: any[];
}

function FormDataDetails({ formData }: { formData: VerificationFormData | null }) {
  if (!formData) return null;

  const fields: { label: string; value: string | undefined; isLink?: boolean }[] = [
    { label: 'Kompaniya nomi', value: formData.company_name },
    { label: "Ro'yxatdagi nomi", value: formData.registered_name },
    { label: 'Mamlakat', value: formData.country },
    { label: 'Ofis manzili', value: formData.office_address },
    { label: 'Ish telefon', value: formData.work_phone },
    { label: 'Ish email', value: formData.work_email },
    { label: 'Telegram', value: formData.telegram_link },
    { label: 'Instagram', value: formData.instagram_url },
    { label: 'Veb-sayt', value: formData.website_url },
    { label: 'INN', value: formData.inn },
    { label: "Ro'yxatga olish raqami", value: formData.registration_number },
  ];

  return (
    <div className="space-y-3">
      {/* Text fields */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {fields.map(({ label, value }) =>
          value ? (
            <div key={label}>
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">{label}</p>
              <p className="text-xs text-slate-700 mt-0.5">{value}</p>
            </div>
          ) : null
        )}
      </div>

      {/* PDF links */}
      <div className="flex gap-2">
        {formData.certificate_pdf_url && (
          <a
            href={formData.certificate_pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
          >
            <FileText className="h-3 w-3" /> Sertifikat PDF
          </a>
        )}
        {formData.license_pdf_url && (
          <a
            href={formData.license_pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-600 rounded-lg text-xs font-medium hover:bg-violet-100 transition-colors"
          >
            <Scale className="h-3 w-3" /> Litsenziya PDF
          </a>
        )}
      </div>
    </div>
  );
}

export function AdminVerificationContent({ requests }: Props) {
  const router = useRouter();
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [tab, setTab] = useState<'pending' | 'processed'>('pending');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const processedRequests = requests.filter((r) => r.status !== 'pending');

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleApprove(requestId: string, agencyId: string) {
    setProcessing(requestId);
    const result = await approveVerificationAction(requestId, agencyId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Verification approved');
    }
    setProcessing(null);
    router.refresh();
  }

  async function handleReject(requestId: string, agencyId: string) {
    setProcessing(requestId);
    const note = rejectNotes[requestId] || '';
    const result = await rejectVerificationAction(requestId, agencyId, note);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Verification rejected');
    }
    setProcessing(null);
    router.refresh();
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Verification & Request Center</h1>
        <p className="text-sm text-slate-500">Agentlik sertifikatlarini tekshirish</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-amber-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-amber-500" />
            <p className="text-sm text-amber-600">Pending Queue</p>
          </div>
          <p className="text-2xl font-bold text-amber-700">{pendingRequests.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-emerald-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <p className="text-sm text-emerald-600">Approved</p>
          </div>
          <p className="text-2xl font-bold text-emerald-700">
            {processedRequests.filter(r => r.status === 'approved').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-red-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm text-red-600">Rejected</p>
          </div>
          <p className="text-2xl font-bold text-red-700">
            {processedRequests.filter(r => r.status === 'rejected').length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'pending'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Pending Queue
          {pendingRequests.length > 0 && (
            <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{pendingRequests.length}</span>
          )}
        </button>
        <button
          onClick={() => setTab('processed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'processed'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Processed History ({processedRequests.length})
        </button>
      </div>

      {/* Pending Queue */}
      {tab === 'pending' && (
        <div className="space-y-3">
          {pendingRequests.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No pending verification requests</p>
            </div>
          ) : (
            pendingRequests.map((req) => {
              const fd = req.form_data as VerificationFormData | null;
              const isExpanded = expandedIds.has(req.id);
              return (
                <div key={req.id} className="bg-white rounded-xl border border-amber-200 p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {req.agency?.name ?? 'Unknown Agency'}
                          </h3>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                            <span>Submitted: {formatDate(req.created_at)}</span>
                            {req.agency?.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {req.agency.phone}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {req.certificate_url && (
                            <a
                              href={req.certificate_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                            >
                              Certificate <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {fd && (
                            <button
                              onClick={() => toggleExpand(req.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
                            >
                              {isExpanded ? 'Yopish' : "Batafsil"}
                              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded form data */}
                      {fd && isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <FormDataDetails formData={fd} />
                        </div>
                      )}

                      <div className="mt-3">
                        <input
                          placeholder="Admin note (optional for rejection)..."
                          value={rejectNotes[req.id] || ''}
                          onChange={(e) =>
                            setRejectNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          disabled={processing === req.id}
                          onClick={() => handleApprove(req.id, req.agency_id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          disabled={processing === req.id}
                          onClick={() => handleReject(req.id, req.agency_id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Processed History */}
      {tab === 'processed' && (
        <div className="space-y-3">
          {processedRequests.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-12 text-center">
              <ShieldCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No processed requests yet</p>
            </div>
          ) : (
            processedRequests.map((req) => {
              const fd = req.form_data as VerificationFormData | null;
              const isExpanded = expandedIds.has(req.id);
              return (
                <div key={req.id} className={`bg-white rounded-xl border p-4 ${req.status === 'approved' ? 'border-emerald-200' : 'border-red-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-slate-900 text-sm">{req.agency?.name ?? 'Unknown'}</span>
                      {req.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-full">
                          <CheckCircle2 className="h-3 w-3" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-semibold rounded-full">
                          <XCircle className="h-3 w-3" /> Rejected
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{formatDate(req.created_at)}</span>
                      {req.certificate_url && (
                        <a
                          href={req.certificate_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {fd && (
                        <button
                          onClick={() => toggleExpand(req.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                  {fd && isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <FormDataDetails formData={fd} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
