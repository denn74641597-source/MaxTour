'use client';

import {
  Building2, MapPin, Users, CreditCard, ShieldCheck, Coins,
  TrendingUp, AlertTriangle, Clock, CheckCircle2, ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface AdminDashboardContentProps {
  stats: {
    totalAgencies: number;
    totalTours: number;
    totalLeads: number;
    activeSubscriptions: number;
    pendingCoinRequests: number;
  };
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
  color: string;
}) {
  const colorClasses: Record<string, { bg: string; icon: string; border: string }> = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
    violet: { bg: 'bg-violet-50', icon: 'text-violet-600', border: 'border-violet-100' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-100' },
    rose: { bg: 'bg-rose-50', icon: 'text-rose-600', border: 'border-rose-100' },
    cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600', border: 'border-cyan-100' },
  };
  const c = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`bg-white rounded-xl border ${c.border} p-5 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trendValue}
            </div>
          )}
        </div>
        <div className={`${c.bg} p-2.5 rounded-lg`}>
          <Icon className={`h-5 w-5 ${c.icon}`} />
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardContent({ stats }: AdminDashboardContentProps) {
  const pendingVerifications = 0; // will be populated from real data

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Platformaning asosiy ko&apos;rsatkichlari</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-emerald-700">System Status: Optimal</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Agencies" value={stats.totalAgencies} icon={Building2} color="blue" trend="up" trendValue="+12% this month" />
        <StatCard title="Total Tours" value={stats.totalTours} icon={MapPin} color="emerald" trend="up" trendValue="+8% this month" />
        <StatCard title="Total Leads" value={stats.totalLeads} icon={Users} color="violet" trend="up" trendValue="+15% this month" />
        <StatCard title="Active Subscriptions" value={stats.activeSubscriptions} icon={CreditCard} color="amber" />
        <StatCard title="Pending Verification" value={pendingVerifications} icon={ShieldCheck} color="rose" />
        <StatCard title="Coin Requests" value={stats.pendingCoinRequests} icon={Coins} color="cyan" />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Growth Trends */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Platform Growth Trends</h2>
            <select className="text-xs border border-slate-200 rounded-md px-2 py-1 text-slate-600 bg-white">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
          <div className="h-48 flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <div className="text-center">
              <TrendingUp className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Growth chart data</p>
              <p className="text-xs text-slate-400">Analytics coming soon</p>
            </div>
          </div>
        </div>

        {/* Needs Attention */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="font-semibold text-slate-900">Needs Attention</h2>
          </div>
          <div className="space-y-3">
            {stats.pendingCoinRequests > 0 && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <Coins className="h-4 w-4 text-amber-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{stats.pendingCoinRequests} pending coin requests</p>
                  <p className="text-xs text-slate-500">Review and approve/reject</p>
                </div>
                <Clock className="h-4 w-4 text-slate-400" />
              </div>
            )}
            {stats.totalAgencies > 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{stats.totalAgencies} agencies registered</p>
                  <p className="text-xs text-slate-500">Check approval status</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-slate-400" />
              </div>
            )}
            {stats.totalTours > 0 && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{stats.totalTours} tours total</p>
                  <p className="text-xs text-slate-500">Moderate pending tours</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-slate-400" />
              </div>
            )}
            {stats.pendingCoinRequests === 0 && stats.totalAgencies === 0 && stats.totalTours === 0 && (
              <div className="flex items-center justify-center py-8 text-sm text-slate-400">
                <CheckCircle2 className="h-5 w-5 mr-2 text-emerald-500" />
                All clear! No items need attention.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Admin Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Recent Admin Actions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">Action</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">Target</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">Status</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">Time</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-50">
                <td className="py-3 px-3 text-slate-700">System initialized</td>
                <td className="py-3 px-3 text-slate-500">Platform</td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                    Active
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-500 text-xs">Just now</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
