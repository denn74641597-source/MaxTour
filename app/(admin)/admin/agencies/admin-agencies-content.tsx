'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Search, Filter, Check, X, ChevronRight,
  MapPin, Calendar, Shield, Eye, MoreHorizontal,
  CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { updateAgencyApprovalAction } from '@/features/admin/actions';
import { toast } from 'sonner';

interface AdminAgenciesContentProps {
  agencies: any[];
}

export function AdminAgenciesContent({ agencies }: AdminAgenciesContentProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [selectedAgency, setSelectedAgency] = useState<any>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const filtered = agencies.filter((a) => {
    const matchSearch = !search ||
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.city?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' ||
      (statusFilter === 'approved' && a.is_approved) ||
      (statusFilter === 'pending' && !a.is_approved);
    return matchSearch && matchStatus;
  });

  const approvedCount = agencies.filter(a => a.is_approved).length;
  const pendingCount = agencies.filter(a => !a.is_approved).length;

  async function handleApproval(agencyId: string, approved: boolean) {
    setProcessing(agencyId);
    const result = await updateAgencyApprovalAction(agencyId, approved);
    setProcessing(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(approved ? 'Agency approved' : 'Agency rejected');
      router.refresh();
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agencies</h1>
          <p className="text-sm text-slate-500">{agencies.length} ta ro&apos;yxatdagi agentliklar</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-900">{agencies.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-emerald-100 p-4">
          <p className="text-sm text-emerald-600">Approved</p>
          <p className="text-2xl font-bold text-emerald-700">{approvedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-amber-100 p-4">
          <p className="text-sm text-amber-600">Pending</p>
          <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search agencies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2">
                {(['all', 'approved', 'pending'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      statusFilter === s
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s === 'all' ? 'All' : s === 'approved' ? 'Approved' : 'Pending'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Agency</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 hidden md:table-cell">Location</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 hidden lg:table-cell">Owner</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 hidden lg:table-cell">Created</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((agency) => (
                    <tr
                      key={agency.id}
                      className={`border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors ${
                        selectedAgency?.id === agency.id ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => setSelectedAgency(agency)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                            <Building2 className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">{agency.name}</p>
                            <p className="text-xs text-slate-500 truncate">{agency.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-slate-600">{agency.city}, {agency.country}</span>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <span className="text-slate-600">{agency.owner?.full_name ?? '—'}</span>
                      </td>
                      <td className="py-3 px-4">
                        {agency.is_approved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-full">
                            <CheckCircle2 className="h-3 w-3" /> Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-full">
                            <Clock className="h-3 w-3" /> Pending
                          </span>
                        )}
                        {agency.is_verified && (
                          <span className="ml-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded-full">
                            <Shield className="h-3 w-3" /> Verified
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs hidden lg:table-cell">
                        {formatDate(agency.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!agency.is_approved ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleApproval(agency.id, true); }}
                              disabled={processing === agency.id}
                              className="p-1.5 rounded-md bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors disabled:opacity-50"
                              title="Approve"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleApproval(agency.id, false); }}
                              disabled={processing === agency.id}
                              className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50"
                              title="Reject"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedAgency(agency); }}
                            className="p-1.5 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                            title="View details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-slate-400">
                <Building2 className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                No agencies found
              </div>
            )}
          </div>
        </div>

        {/* Detail sidebar */}
        {selectedAgency && (
          <div className="hidden lg:block w-80 shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Agency Details</h3>
                <button
                  onClick={() => setSelectedAgency(null)}
                  className="p-1 rounded-md hover:bg-slate-100 text-slate-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{selectedAgency.name}</p>
                    <p className="text-xs text-slate-500">{selectedAgency.slug}</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>{selectedAgency.city}, {selectedAgency.country}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{formatDate(selectedAgency.created_at)}</span>
                  </div>
                  {selectedAgency.owner?.full_name && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <span>{selectedAgency.owner.full_name}</span>
                    </div>
                  )}
                  {selectedAgency.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="text-slate-400 text-xs">📞</span>
                      <span>{selectedAgency.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedAgency.is_approved ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                      <Clock className="h-3 w-3" /> Pending
                    </span>
                  )}
                  {selectedAgency.is_verified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      <Shield className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  {!selectedAgency.is_approved ? (
                    <button
                      onClick={() => handleApproval(selectedAgency.id, true)}
                      disabled={processing === selectedAgency.id}
                      className="flex-1 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      Approve
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApproval(selectedAgency.id, false)}
                      disabled={processing === selectedAgency.id}
                      className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
