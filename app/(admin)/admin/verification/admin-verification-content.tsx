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
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Props {
  requests: any[];
}

export function AdminVerificationContent({ requests }: Props) {
  const router = useRouter();
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [tab, setTab] = useState<'pending' | 'processed'>('pending');

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const processedRequests = requests.filter((r) => r.status !== 'pending');

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
            pendingRequests.map((req) => (
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
                        <p className="text-xs text-slate-500 mt-0.5">
                          Submitted: {formatDate(req.created_at)}
                        </p>
                      </div>
                      <a
                        href={req.certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors shrink-0"
                      >
                        View Certificate <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
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
            ))
          )}
        </div>
      )}

      {/* Processed History */}
      {tab === 'processed' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {processedRequests.length === 0 ? (
            <div className="py-12 text-center">
              <ShieldCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No processed requests yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Agency</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Date</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-500">Certificate</th>
                </tr>
              </thead>
              <tbody>
                {processedRequests.map((req) => (
                  <tr key={req.id} className="border-b border-slate-100">
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900">{req.agency?.name ?? 'Unknown'}</span>
                    </td>
                    <td className="py-3 px-4">
                      {req.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-full">
                          <CheckCircle2 className="h-3 w-3" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-semibold rounded-full">
                          <XCircle className="h-3 w-3" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{formatDate(req.created_at)}</td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={req.certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="h-3.5 w-3.5 inline" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
