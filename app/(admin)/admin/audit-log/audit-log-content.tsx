'use client';

import { useState } from 'react';
import {
  FileText, Search, Shield, Building2, MapPin,
  Coins, CheckCircle2, XCircle, Clock, Filter,
} from 'lucide-react';

// Placeholder audit log entries - will be populated from database in future
const PLACEHOLDER_LOGS = [
  { id: '1', action: 'System Started', actor: 'System', target: 'Platform', type: 'system', timestamp: new Date().toISOString() },
];

export function AuditLogContent() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const actionTypes = ['all', 'agency', 'tour', 'verification', 'coin', 'system'];

  const logs = PLACEHOLDER_LOGS;

  const typeIcons: Record<string, React.ElementType> = {
    agency: Building2,
    tour: MapPin,
    verification: Shield,
    coin: Coins,
    system: FileText,
  };

  const typeColors: Record<string, { bg: string; icon: string }> = {
    agency: { bg: 'bg-blue-100', icon: 'text-blue-600' },
    tour: { bg: 'bg-emerald-100', icon: 'text-emerald-600' },
    verification: { bg: 'bg-violet-100', icon: 'text-violet-600' },
    coin: { bg: 'bg-amber-100', icon: 'text-amber-600' },
    system: { bg: 'bg-slate-100', icon: 'text-slate-600' },
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
        <p className="text-sm text-slate-500">Barcha admin harakatlarini kuzatish</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search actions, actors, targets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {actionTypes.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  typeFilter === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Type</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Action</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Actor</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 hidden md:table-cell">Target</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const Icon = typeIcons[log.type] || FileText;
              const colors = typeColors[log.type] || typeColors.system;
              return (
                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className={`h-7 w-7 rounded-md ${colors.bg} flex items-center justify-center`}>
                      <Icon className={`h-3.5 w-3.5 ${colors.icon}`} />
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">{log.action}</td>
                  <td className="py-3 px-4 text-slate-600">{log.actor}</td>
                  <td className="py-3 px-4 text-slate-500 hidden md:table-cell">{log.target}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {logs.length === 0 && (
          <div className="py-12 text-center">
            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No audit log entries yet</p>
          </div>
        )}

        <div className="p-4 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400">
            Audit log entries will be recorded automatically as admin actions occur
          </p>
        </div>
      </div>
    </div>
  );
}
