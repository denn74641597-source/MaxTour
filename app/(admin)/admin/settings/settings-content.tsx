'use client';

import { useState } from 'react';
import {
  Settings, Users, Shield, Globe, Database, Bell,
  CheckCircle2, Lock, Mail, Key, Save, Clock,
} from 'lucide-react';

export function SettingsContent() {
  const [activeTab, setActiveTab] = useState<'general' | 'roles' | 'system'>('general');

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Settings },
    { id: 'roles' as const, label: 'Roles & Permissions', icon: Shield },
    { id: 'system' as const, label: 'System Config', icon: Database },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Tizim sozlamalari va konfiguratsiya</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* Admin Users */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Admin Users
              </h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">User</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Role</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Access</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">SA</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Super Admin</p>
                        <p className="text-xs text-slate-500">Password protected</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-semibold rounded-full">
                      <Key className="h-3 w-3" /> Super Admin
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 text-xs">Full Access</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Bell className="h-4 w-4 text-violet-600" />
              Notifications
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">New agency registrations</p>
                  <p className="text-xs text-slate-500">Get notified when a new agency registers</p>
                </div>
                <div className="h-6 w-10 bg-emerald-500 rounded-full relative cursor-pointer">
                  <div className="h-5 w-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm" />
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">Verification requests</p>
                  <p className="text-xs text-slate-500">Notify on new verification submissions</p>
                </div>
                <div className="h-6 w-10 bg-emerald-500 rounded-full relative cursor-pointer">
                  <div className="h-5 w-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm" />
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">Coin purchase requests</p>
                  <p className="text-xs text-slate-500">Notify on pending coin requests</p>
                </div>
                <div className="h-6 w-10 bg-emerald-500 rounded-full relative cursor-pointer">
                  <div className="h-5 w-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roles & Permissions */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Role Permission Matrix</h2>
            <p className="text-xs text-slate-500 mt-1">Define access levels for each role</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Permission</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-slate-500">Super Admin</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-slate-500">Agency Manager</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-slate-500">User</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { perm: 'View Dashboard', admin: true, agency: true, user: false },
                  { perm: 'Manage Agencies', admin: true, agency: false, user: false },
                  { perm: 'Moderate Tours', admin: true, agency: false, user: false },
                  { perm: 'Manage Own Tours', admin: true, agency: true, user: false },
                  { perm: 'Verify Agencies', admin: true, agency: false, user: false },
                  { perm: 'Manage Subscriptions', admin: true, agency: false, user: false },
                  { perm: 'Approve Coins', admin: true, agency: false, user: false },
                  { perm: 'View Analytics', admin: true, agency: true, user: false },
                  { perm: 'Manage Featured', admin: true, agency: false, user: false },
                  { perm: 'View Audit Log', admin: true, agency: false, user: false },
                  { perm: 'System Settings', admin: true, agency: false, user: false },
                  { perm: 'Browse Tours', admin: true, agency: true, user: true },
                  { perm: 'Submit Leads', admin: true, agency: false, user: true },
                ].map((row) => (
                  <tr key={row.perm} className="border-b border-slate-100">
                    <td className="py-2.5 px-4 text-slate-700 text-xs font-medium">{row.perm}</td>
                    <td className="py-2.5 px-4 text-center">
                      {row.admin ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {row.agency ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {row.user ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* System Config */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-blue-600" />
              Platform Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Platform Name</label>
                <input
                  type="text"
                  defaultValue="MaxTour"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deployment URL</label>
                <input
                  type="text"
                  defaultValue="https://maxtour.denn74641597.workers.dev"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Default Language</label>
                <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  <option value="uz">O&apos;zbek</option>
                  <option value="ru">Русский</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Database className="h-4 w-4 text-emerald-600" />
              Database & Storage
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Supabase Project</span>
                <span className="text-sm font-medium text-slate-900">vgdfewmyhgzpbxesxfdb</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Storage</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-full">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Auth Provider</span>
                <span className="text-sm font-medium text-slate-900">Supabase Auth</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-600">Edge Functions</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-full">
                  <CheckCircle2 className="h-3 w-3" /> Ready
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Mail className="h-4 w-4 text-rose-600" />
              Email Configuration
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">SMTP Provider</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-full">
                  <Clock className="h-3 w-3" /> Default (Limited)
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-600">Email Rate Limit</span>
                <span className="text-sm font-medium text-slate-900">3/hour (free tier)</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              ⚠ Custom SMTP kerak. Gmail App Password yoki Resend.com tavsiya etiladi.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
