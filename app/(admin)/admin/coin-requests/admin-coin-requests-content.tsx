'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Coins, Check, X, Clock, Building2, CheckCircle2 } from 'lucide-react';
import { approveCoinRequest, rejectCoinRequest } from '@/features/admin/actions';
import { toast } from 'sonner';
import type { CoinRequest } from '@/types';

interface Props {
  requests: CoinRequest[];
}

export function AdminCoinRequestsContent({ requests }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [processing, setProcessing] = useState<string | null>(null);

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;

  async function handleApprove(id: string) {
    setProcessing(id);
    const result = await approveCoinRequest(id);
    setProcessing(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Approved!');
      router.refresh();
    }
  }

  async function handleReject(id: string) {
    setProcessing(id);
    const result = await rejectCoinRequest(id);
    setProcessing(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Rejected');
      router.refresh();
    }
  }

  const statusStyles: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
    approved: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700' },
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Coin Requests</h1>
        <p className="text-sm text-slate-500">MaxCoin sotib olish so&apos;rovlarini boshqarish</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-amber-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-amber-500" />
            <p className="text-sm text-amber-600">Pending</p>
          </div>
          <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-emerald-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <p className="text-sm text-emerald-600">Approved</p>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{approvedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="h-4 w-4 text-slate-500" />
            <p className="text-sm text-slate-600">Total</p>
          </div>
          <p className="text-2xl font-bold text-slate-700">{requests.length}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['pending', 'all', 'approved', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Coins className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No requests found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Agency</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Coins</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 hidden md:table-cell">Amount (UZS)</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 hidden lg:table-cell">Date</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => {
                const style = statusStyles[req.status] || statusStyles.pending;
                return (
                  <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4 text-cyan-600" />
                        </div>
                        <span className="font-medium text-slate-900">{req.agency?.name ?? 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-blue-600">{req.coins} MC</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 hidden md:table-cell">
                      {Number(req.price_uzs).toLocaleString()} UZS
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 ${style.bg} ${style.text} text-[10px] font-semibold rounded-full capitalize`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs hidden lg:table-cell">
                      {new Date(req.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {req.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleApprove(req.id)}
                            disabled={processing === req.id}
                            className="p-1.5 rounded-md bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            disabled={processing === req.id}
                            className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
