'use client';

import { Users, CreditCard, CheckCircle2, Clock } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';

interface AdminSubscriptionsContentProps {
  plans: any[];
  subscriptions: any[];
}

export function AdminSubscriptionsContent({ plans, subscriptions }: AdminSubscriptionsContentProps) {
  const activeCount = subscriptions.filter(s => s.status === 'active').length;

  const statusStyles: Record<string, { bg: string; text: string }> = {
    active: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    expired: { bg: 'bg-red-100', text: 'text-red-700' },
    cancelled: { bg: 'bg-slate-100', text: 'text-slate-700' },
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subscriptions</h1>
        <p className="text-sm text-slate-500">Obuna rejalarini boshqarish</p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-slate-900">{plan.name}</h3>
            <p className="text-2xl font-bold mt-2 text-slate-900">
              {plan.price_monthly === 0 ? 'Free' : `${formatPrice(plan.price_monthly)}/mo`}
            </p>
            <div className="mt-3 space-y-1.5">
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                {plan.max_active_tours} active tours
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                {plan.can_feature ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Clock className="h-3 w-3 text-slate-400" />
                )}
                {plan.can_feature ? 'Featured placement' : 'No featuring'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Agency Subscriptions</h2>
          <span className="text-xs text-slate-500">{activeCount} active / {subscriptions.length} total</span>
        </div>

        {subscriptions.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No subscriptions yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Agency</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Plan</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 hidden md:table-cell">Price</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 hidden lg:table-cell">Expires</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub: any) => {
                const style = statusStyles[sub.status] || statusStyles.expired;
                return (
                  <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900">{sub.agency?.name ?? '—'}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{sub.plan?.name ?? '—'}</td>
                    <td className="py-3 px-4 text-slate-600 hidden md:table-cell">
                      {sub.plan?.price_monthly === 0 ? 'Free' : formatPrice(sub.plan?.price_monthly)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 ${style.bg} ${style.text} text-[10px] font-semibold rounded-full capitalize`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs hidden lg:table-cell">
                      {formatDate(sub.ends_at)}
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
