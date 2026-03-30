'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin, Search, Clock, CheckCircle2, Star,
  Eye, Globe, Calendar, DollarSign,
} from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';
import { updateTourStatusAction } from '@/features/admin/actions';
import { toast } from 'sonner';

interface AdminToursContentProps {
  tours: any[];
}

export function AdminToursContent({ tours }: AdminToursContentProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processing, setProcessing] = useState<string | null>(null);

  const filtered = tours.filter((t) => {
    const matchSearch = !search ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.agency?.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.country?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = tours.filter(t => t.status === 'pending').length;
  const publishedCount = tours.filter(t => t.status === 'published').length;
  const featuredCount = tours.filter(t => t.is_featured).length;

  async function handleStatusChange(tourId: string, newStatus: string) {
    setProcessing(tourId);
    const result = await updateTourStatusAction(tourId, newStatus);
    setProcessing(null);
    if (result.error) {
      toast.error('Tizimda xatolik');
    } else {
      toast.success('Tur holati yangilandi');
      router.refresh();
    }
  }

  const statusStyles: Record<string, { bg: string; text: string }> = {
    draft: { bg: 'bg-slate-100', text: 'text-slate-700' },
    pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
    published: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    archived: { bg: 'bg-red-100', text: 'text-red-700' },
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tours Moderation</h1>
        <p className="text-sm text-slate-500">Turlarni boshqarish va moderatsiya</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-amber-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-amber-500" />
            <p className="text-sm text-amber-600">Pending Review</p>
          </div>
          <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-emerald-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <p className="text-sm text-emerald-600">Published</p>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{publishedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-violet-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Star className="h-4 w-4 text-violet-500" />
            <p className="text-sm text-violet-600">Featured</p>
          </div>
          <p className="text-2xl font-bold text-violet-700">{featuredCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tours by name, agency, country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'published', 'draft', 'archived'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                {s === 'pending' && pendingCount > 0 && (
                  <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tours Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Tour</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 hidden md:table-cell">Agency</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 hidden lg:table-cell">Destination</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Price</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Status</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tour) => {
                const style = statusStyles[tour.status] || statusStyles.draft;
                return (
                  <tr key={tour.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                          <MapPin className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate max-w-[200px]">{tour.title}</p>
                          {tour.departure_date && (
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(tour.departure_date)}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 hidden md:table-cell">
                      {tour.agency?.name ?? '—'}
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <Globe className="h-3 w-3 text-slate-400" />
                        {tour.country}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900">{formatPrice(tour.price, tour.currency)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 ${style.bg} ${style.text} text-[10px] font-semibold rounded-full capitalize`}>
                        {tour.status}
                      </span>
                      {tour.is_featured && (
                        <span className="ml-1 inline-flex items-center px-2 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-semibold rounded-full">
                          ★ Featured
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <select
                        value={tour.status}
                        onChange={(e) => handleStatusChange(tour.id, e.target.value)}
                        disabled={processing === tour.id}
                        className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                      >
                        <option value="draft">Draft</option>
                        <option value="pending">Pending</option>
                        <option value="published">Publish</option>
                        <option value="archived">Archive</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-400">
            <MapPin className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            No tours found
          </div>
        )}
      </div>
    </div>
  );
}
