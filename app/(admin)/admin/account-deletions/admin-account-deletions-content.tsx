'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Trash2,
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Mail,
  Phone,
  AlertTriangle,
  User as UserIcon,
} from 'lucide-react';
import {
  approveDeletionRequestAction,
  rejectDeletionRequestAction,
  type AccountDeletionRequest,
} from '@/features/account-deletions/actions';
import { formatDate } from '@/lib/utils';

interface Props {
  requests: AccountDeletionRequest[];
}

export function AdminAccountDeletionsContent({ requests }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<'pending' | 'processed'>('pending');
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const processedRequests = requests.filter((r) => r.status !== 'pending');

  async function handleApprove(req: AccountDeletionRequest) {
    if (confirmingId !== req.id) {
      setConfirmingId(req.id);
      // Auto-clear confirm state after 5s so user must re-arm.
      setTimeout(() => {
        setConfirmingId((current) => (current === req.id ? null : current));
      }, 5000);
      return;
    }
    setConfirmingId(null);
    setProcessing(req.id);
    const result = await approveDeletionRequestAction(req.id, adminNotes[req.id]);
    if ('error' in result && result.error) {
      toast.error(`Tasdiqlashda xatolik: ${result.error}`);
    } else {
      const deleted = (result as { deleted_storage_objects?: number }).deleted_storage_objects ?? 0;
      const warnings = (result as { warnings?: string[] }).warnings ?? [];
      toast.success(
        `Hisob o'chirildi. Storage'dan ${deleted} ta fayl tozalandi.${
          warnings.length > 0 ? ` (${warnings.length} ogohlantirish)` : ''
        }`
      );
    }
    setProcessing(null);
    router.refresh();
  }

  async function handleReject(req: AccountDeletionRequest) {
    setProcessing(req.id);
    const result = await rejectDeletionRequestAction(req.id, adminNotes[req.id]);
    if ('error' in result && result.error) {
      toast.error(`Rad etishda xatolik: ${result.error}`);
    } else {
      toast.success("So'rov rad etildi. User qayta kira oladi.");
    }
    setProcessing(null);
    router.refresh();
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hisob o&apos;chirish so&apos;rovlari</h1>
        <p className="text-sm text-slate-500">
          User va agentliklar tomonidan yuborilgan hisobni o&apos;chirish so&apos;rovlarini boshqarish
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-amber-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-amber-500" />
            <p className="text-sm text-amber-600">Kutilmoqda</p>
          </div>
          <p className="text-2xl font-bold text-amber-700">{pendingRequests.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-emerald-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <p className="text-sm text-emerald-600">O&apos;chirilgan</p>
          </div>
          <p className="text-2xl font-bold text-emerald-700">
            {processedRequests.filter((r) => r.status === 'approved').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-red-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm text-red-600">Rad etilgan</p>
          </div>
          <p className="text-2xl font-bold text-red-700">
            {processedRequests.filter((r) => r.status === 'rejected').length}
          </p>
        </div>
      </div>

      {/* Danger banner */}
      <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
        <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <div className="text-sm text-red-800">
          <p className="font-semibold">Diqqat — qaytarib bo&apos;lmaydigan amal</p>
          <p className="text-red-700 mt-1">
            &quot;Tasdiqlash&quot; tugmasini bosgandan keyin user, uning agentligi, sayohatlari, sertifikat va
            litsenziya fayllari butunlay o&apos;chiriladi. Tasdiqdan oldin so&apos;rovni diqqat bilan ko&apos;rib chiqing.
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
          Kutilmoqda
          {pendingRequests.length > 0 && (
            <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
              {pendingRequests.length}
            </span>
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
          Tarix ({processedRequests.length})
        </button>
      </div>

      {/* Pending */}
      {tab === 'pending' && (
        <div className="space-y-3">
          {pendingRequests.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Hozircha pending so&apos;rovlar yo&apos;q</p>
            </div>
          ) : (
            pendingRequests.map((req) => (
              <div key={req.id} className="bg-white rounded-xl border border-amber-200 p-5">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Trash2 className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                          {req.agency_name ? (
                            <>
                              <Building2 className="h-4 w-4 text-slate-400" />
                              {req.agency_name}
                            </>
                          ) : (
                            <>
                              <UserIcon className="h-4 w-4 text-slate-400" />
                              {req.user_full_name || 'Ismsiz user'}
                            </>
                          )}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                          <span>So&apos;ralgan: {formatDate(req.requested_at)}</span>
                          {req.user_email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {req.user_email}
                            </span>
                          )}
                          {req.user_phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {req.user_phone}
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-slate-100 rounded font-mono text-[10px]">
                            user: {req.user_id.slice(0, 8)}…
                          </span>
                        </div>
                      </div>
                    </div>

                    {req.reason && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium mb-1">
                          Sabab (user yozgan)
                        </p>
                        <p className="text-sm text-slate-700">{req.reason}</p>
                      </div>
                    )}

                    <div className="mt-3">
                      <input
                        placeholder="Admin izohi (ixtiyoriy)..."
                        value={adminNotes[req.id] || ''}
                        onChange={(e) =>
                          setAdminNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        disabled={processing === req.id}
                        onClick={() => handleApprove(req)}
                        className={`flex items-center gap-1.5 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                          confirmingId === req.id
                            ? 'bg-red-600 hover:bg-red-700 ring-2 ring-red-300'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        {confirmingId === req.id ? "Aniqmi? Yana bosing" : "Tasdiqlash va o'chirish"}
                      </button>
                      <button
                        disabled={processing === req.id}
                        onClick={() => handleReject(req)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" /> Rad etish
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Processed */}
      {tab === 'processed' && (
        <div className="space-y-3">
          {processedRequests.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-12 text-center">
              <p className="text-sm text-slate-500">Tarix bo&apos;sh</p>
            </div>
          ) : (
            processedRequests.map((req) => {
              const isApproved = req.status === 'approved';
              return (
                <div
                  key={req.id}
                  className={`bg-white rounded-xl border p-4 ${
                    isApproved ? 'border-emerald-100' : 'border-red-100'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isApproved ? 'bg-emerald-50' : 'bg-red-50'
                      }`}
                    >
                      {isApproved ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {req.agency_name || req.user_full_name || req.user_email || 'Noma\'lum'}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            So&apos;ralgan: {formatDate(req.requested_at)}
                            {req.reviewed_at && ` • Hal qilingan: ${formatDate(req.reviewed_at)}`}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {isApproved ? "O'chirilgan" : 'Rad etilgan'}
                        </span>
                      </div>
                      {req.admin_notes && (
                        <p className="mt-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded">
                          <span className="font-medium text-slate-500">Admin izohi:</span> {req.admin_notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
