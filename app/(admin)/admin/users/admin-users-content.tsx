'use client';

import { useMemo, useState } from 'react';
import { User, Building2, Shield, Search, Phone, Mail } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { UserRole } from '@/types';

interface AdminUserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

interface AdminUsersContentProps {
  users: AdminUserRow[];
}

const ROLE_FILTERS: Array<{ key: 'all' | UserRole; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'user', label: 'Users' },
  { key: 'agency_manager', label: 'Agencies' },
  { key: 'admin', label: 'Admins' },
];

function RoleBadge({ role }: { role: UserRole }) {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
        <Shield className="h-3 w-3" />
        admin
      </span>
    );
  }

  if (role === 'agency_manager') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
        <Building2 className="h-3 w-3" />
        agency_manager
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
      <User className="h-3 w-3" />
      user
    </span>
  );
}

export function AdminUsersContent({ users }: AdminUsersContentProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        user.full_name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.phone?.toLowerCase().includes(q);
      const matchRole = roleFilter === 'all' || user.role === roleFilter;
      return Boolean(matchSearch && matchRole);
    });
  }, [users, search, roleFilter]);

  const counts = useMemo(() => {
    return {
      total: users.length,
      users: users.filter((u) => u.role === 'user').length,
      agencies: users.filter((u) => u.role === 'agency_manager').length,
      admins: users.filter((u) => u.role === 'admin').length,
    };
  }, [users]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <p className="text-sm text-slate-500">Profil va role roʻyxati</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-900">{counts.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Users</p>
          <p className="text-2xl font-bold text-slate-900">{counts.users}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-white p-4">
          <p className="text-sm text-emerald-600">Agency Managers</p>
          <p className="text-2xl font-bold text-emerald-700">{counts.agencies}</p>
        </div>
        <div className="rounded-xl border border-purple-100 bg-white p-4">
          <p className="text-sm text-purple-600">Admins</p>
          <p className="text-2xl font-bold text-purple-700">{counts.admins}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex gap-2">
            {ROLE_FILTERS.map((item) => (
              <button
                key={item.key}
                onClick={() => setRoleFilter(item.key)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  roleFilter === item.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {filteredUsers.length === 0 ? (
          <div className="py-12 text-center">
            <User className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-400">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden md:table-cell">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden lg:table-cell">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden lg:table-cell">Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((userRow) => (
                  <tr key={userRow.id} className="border-b border-slate-100 hover:bg-slate-50/40">
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{userRow.full_name || 'No name'}</p>
                        <p className="truncate text-xs text-slate-500">{userRow.email || 'No email'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-1">
                        <p className="flex items-center gap-1 text-xs text-slate-600">
                          <Phone className="h-3 w-3" />
                          {userRow.phone || '—'}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-slate-600">
                          <Mail className="h-3 w-3" />
                          {userRow.email || '—'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={userRow.role} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">
                      {formatDate(userRow.created_at)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">
                      {formatDate(userRow.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
