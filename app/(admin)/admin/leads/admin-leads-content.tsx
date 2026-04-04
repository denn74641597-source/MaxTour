'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatPrice, formatDate, placeholderImage } from '@/lib/utils';
import {
  Phone, MessageCircle, Users, MapPin, DollarSign,
  Building2, MessageSquare, Search, Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLead {
  id: string;
  full_name: string;
  phone: string;
  telegram_username?: string | null;
  people_count: number;
  comment?: string | null;
  status: string;
  created_at: string;
  tour?: {
    id: string;
    title: string;
    slug: string;
    cover_image_url?: string | null;
    country?: string | null;
    city?: string | null;
    price?: number | null;
    currency?: string | null;
  } | null;
  agency?: {
    id: string;
    name: string;
    slug: string;
    phone?: string | null;
    telegram_username?: string | null;
  } | null;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-slate-100 text-slate-600',
  won: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-red-100 text-red-700',
};

export function AdminLeadsContent({ leads }: { leads: AdminLead[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = leads.filter((lead) => {
    const matchesSearch =
      !search ||
      lead.full_name.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.includes(search) ||
      lead.tour?.title?.toLowerCase().includes(search.toLowerCase()) ||
      lead.agency?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tour Requests</h1>
          <p className="text-sm text-slate-500">{leads.length} total requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, tour, agency..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 pl-10 pr-8 rounded-lg border border-slate-200 bg-white text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Lead Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No requests found</p>
          </div>
        ) : (
          filtered.map((lead) => (
            <div
              key={lead.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex gap-0">
                {/* Tour Image */}
                {lead.tour?.cover_image_url && (
                  <div className="relative w-32 shrink-0">
                    <Image
                      src={lead.tour.cover_image_url || placeholderImage(256, 256, lead.tour?.title || 'Tour')}
                      alt={lead.tour?.title || 'Tour'}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0 p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">{lead.full_name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatDate(lead.created_at)}
                      </p>
                    </div>
                    <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', STATUS_COLORS[lead.status] || STATUS_COLORS.new)}>
                      {lead.status}
                    </span>
                  </div>

                  {/* Tour Info */}
                  {lead.tour && (
                    <div className="bg-slate-50 rounded-lg p-2.5 mb-2.5 text-sm">
                      <p className="font-medium text-slate-800 truncate">{lead.tour.title}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-slate-500">
                        {(lead.tour.country || lead.tour.city) && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />
                            {lead.tour.country}{lead.tour.city ? `, ${lead.tour.city}` : ''}
                          </span>
                        )}
                        {lead.tour.price != null && (
                          <span className="flex items-center gap-0.5">
                            <DollarSign className="h-3 w-3" />
                            {formatPrice(lead.tour.price, lead.tour.currency || 'USD')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Agency Info */}
                  {lead.agency && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                      <Building2 className="h-3 w-3" />
                      <span className="font-medium">{lead.agency.name}</span>
                      {lead.agency.phone && (
                        <span className="text-slate-400">· {lead.agency.phone}</span>
                      )}
                    </div>
                  )}

                  {/* People count */}
                  {lead.people_count > 1 && (
                    <p className="text-xs text-blue-600 font-medium mb-2 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {lead.people_count} people
                    </p>
                  )}

                  {/* Comment */}
                  {lead.comment && (
                    <div className="flex items-start gap-1.5 text-xs text-slate-500 bg-slate-50 rounded-lg p-2 mb-2">
                      <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>{lead.comment}</span>
                    </div>
                  )}

                  {/* Contact Buttons */}
                  <div className="flex gap-2">
                    <a
                      href={`tel:${lead.phone}`}
                      className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {lead.phone}
                    </a>
                    {lead.telegram_username && (
                      <a
                        href={`https://t.me/${lead.telegram_username.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Telegram
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
