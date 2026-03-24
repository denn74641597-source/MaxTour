'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Coins, Check, X, Clock, Building2 } from 'lucide-react';
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

  async function handleApprove(id: string) {
    setProcessing(id);
    const result = await approveCoinRequest(id);
    setProcessing(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Tasdiqlandi!');
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
      toast.success('Rad etildi');
      router.refresh();
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Kutilmoqda',
    approved: 'Tasdiqlangan',
    rejected: 'Rad etilgan',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Coin so'rovlar</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">{pendingCount} ta kutilayotgan so'rov</p>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['pending', 'all', 'approved', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f === 'all' ? 'Barchasi' : statusLabels[f]}
            {f === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Requests list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">So'rovlar yo'q</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div key={req.id} className="bg-card border rounded-xl p-4">
              <div className="flex items-start gap-3">
                {/* Agency info */}
                <div className="bg-primary/10 rounded-full p-2.5 shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{req.agency?.name ?? 'Noma\'lum'}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-lg font-bold text-primary">{req.coins} MC</span>
                    <span className="text-sm text-muted-foreground">
                      {Number(req.price_uzs).toLocaleString()} UZS
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[req.status]}`}>
                      {statusLabels[req.status]}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(req.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                {req.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={processing === req.id}
                      className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                      title="Tasdiqlash"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      disabled={processing === req.id}
                      className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                      title="Rad etish"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
