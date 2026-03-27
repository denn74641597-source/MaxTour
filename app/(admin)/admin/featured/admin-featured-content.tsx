'use client';

import { Star, Clock, TrendingUp, Calendar, MapPin, Building2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface AdminFeaturedContentProps {
  items: any[];
}

export function AdminFeaturedContent({ items }: AdminFeaturedContentProps) {
  const activeItems = items.filter(i => new Date(i.ends_at) > new Date());
  const expiredItems = items.filter(i => new Date(i.ends_at) <= new Date());
  const upcomingExpirations = activeItems.filter(i => {
    const daysLeft = Math.ceil((new Date(i.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Featured & Promotions</h1>
        <p className="text-sm text-slate-500">Reklama joylashtirish va featured turlarni boshqarish</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-violet-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Star className="h-4 w-4 text-violet-500" />
            <p className="text-sm text-violet-600">Active Placements</p>
          </div>
          <p className="text-2xl font-bold text-violet-700">{activeItems.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <p className="text-sm text-blue-600">Total Items</p>
          </div>
          <p className="text-2xl font-bold text-blue-700">{items.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-slate-500" />
            <p className="text-sm text-slate-600">Expired</p>
          </div>
          <p className="text-2xl font-bold text-slate-700">{expiredItems.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-amber-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-amber-500" />
            <p className="text-sm text-amber-600">Expiring Soon</p>
          </div>
          <p className="text-2xl font-bold text-amber-700">{upcomingExpirations.length}</p>
        </div>
      </div>

      {/* Active Placements Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Active Placements</h2>
        </div>

        {activeItems.length === 0 ? (
          <div className="py-12 text-center">
            <Star className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No active featured items</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Item</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Placement</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 hidden md:table-cell">Start</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 hidden md:table-cell">End</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {activeItems.map((item: any) => {
                const daysLeft = Math.ceil((new Date(item.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                          {item.tour ? <MapPin className="h-4 w-4 text-violet-600" /> : <Building2 className="h-4 w-4 text-violet-600" />}
                        </div>
                        <span className="font-medium text-slate-900 truncate">
                          {item.tour?.title ?? item.agency?.name ?? 'Item'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-semibold rounded-full capitalize">
                        {item.placement_type?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs hidden md:table-cell">{formatDate(item.starts_at)}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs hidden md:table-cell">{formatDate(item.ends_at)}</td>
                    <td className="py-3 px-4">
                      {daysLeft <= 3 ? (
                        <span className="inline-flex items-center px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-semibold rounded-full">
                          {daysLeft}d left
                        </span>
                      ) : daysLeft <= 7 ? (
                        <span className="inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-full">
                          {daysLeft}d left
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-full">
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Expired / History */}
      {expiredItems.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Expired Placements</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Item</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Placement</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Ended</th>
              </tr>
            </thead>
            <tbody>
              {expiredItems.slice(0, 10).map((item: any) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-3 px-4 text-slate-700">
                    {item.tour?.title ?? item.agency?.name ?? 'Item'}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs capitalize">
                    {item.placement_type?.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs">{formatDate(item.ends_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
