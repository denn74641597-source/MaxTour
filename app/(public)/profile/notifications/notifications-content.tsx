'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, BellRing, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateNotificationPreferencesAction } from '@/features/notifications/actions';
import {
  NOTIFICATION_PREFERENCE_KEYS,
  type NotificationPreferenceKey,
  type NotificationPreferences,
  type UserRole,
} from '@/types';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const USER_KEYS: NotificationPreferenceKey[] = [
  'new_tour_from_followed',
  'price_drop',
  'seats_low',
  'tour_cancelled',
  'departure_reminder',
  'hot_deals',
  'lead_confirmed',
  'lead_status_changed',
  'agency_verified_notify',
  'weekly_picks',
];

const AGENCY_KEYS: NotificationPreferenceKey[] = [
  'new_lead',
  'daily_leads_summary',
  'pending_leads_reminder',
  'tour_approved',
  'tour_rejected',
  'tour_milestone',
  'seats_alert',
  'tour_expiring',
  'subscription_expiring',
  'subscription_expired',
  'new_review',
  'new_follower',
  'follower_milestone',
  'verification_update',
];

interface Props {
  initialPreferences: NotificationPreferences;
  role: UserRole;
}

export function NotificationsContent({ initialPreferences, role }: Props) {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    const out: Record<string, boolean> = {};
    for (const key of NOTIFICATION_PREFERENCE_KEYS) {
      const raw = (initialPreferences as Record<string, unknown>)[key];
      out[key] = typeof raw === 'boolean' ? raw : true;
    }
    return out;
  });
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();

  const isAgency = role === 'agency_manager' || role === 'admin';

  function toggle(key: NotificationPreferenceKey) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setDirty(true);
  }

  function save() {
    startTransition(async () => {
      const updates: Partial<Record<NotificationPreferenceKey, boolean>> = {};
      for (const key of NOTIFICATION_PREFERENCE_KEYS) {
        updates[key] = prefs[key];
      }
      const result = await updateNotificationPreferencesAction(updates);
      if (result.success) {
        toast.success(t.notifications.saved);
        setDirty(false);
      } else {
        toast.error(result.error ?? t.security.error);
      }
    });
  }

  return (
    <div className="px-4 lg:px-0 py-6 lg:py-10 space-y-8">
      {/* Page header */}
      <header className="flex items-start gap-4">
        <Link
          href="/profile"
          aria-label={t.common.back}
          className="rounded-full p-2 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <BellRing className="h-6 w-6 text-primary" />
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{t.notifications.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{t.notifications.subtitle}</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <PreferenceSection
          title={t.notifications.sectionUser}
          keys={USER_KEYS}
          prefs={prefs}
          onToggle={toggle}
          labels={t.notifications}
        />
        {isAgency && (
          <PreferenceSection
            title={t.notifications.sectionAgency}
            keys={AGENCY_KEYS}
            prefs={prefs}
            onToggle={toggle}
            labels={t.notifications}
          />
        )}
      </div>

      <div className="sticky bottom-20 md:bottom-4 z-10 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || pending}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold shadow-lg transition-all',
            dirty
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed',
          )}
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t.notifications.saving}
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              {t.notifications.save}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function PreferenceSection({
  title,
  keys,
  prefs,
  onToggle,
  labels,
}: {
  title: string;
  keys: NotificationPreferenceKey[];
  prefs: Record<string, boolean>;
  onToggle: (key: NotificationPreferenceKey) => void;
  labels: Record<string, string>;
}) {
  return (
    <section className="rounded-2xl border bg-card p-4 lg:p-6 shadow-sm">
      <header className="flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </header>
      <ul className="space-y-1.5">
        {keys.map((key) => {
          const checked = !!prefs[key];
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onToggle(key)}
                className="w-full flex items-start gap-4 rounded-xl px-3 py-3 text-left hover:bg-muted/60 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{labels[key] ?? key}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {labels[`${key}_hint`] ?? ''}
                  </div>
                </div>
                <span
                  role="switch"
                  aria-checked={checked}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors mt-0.5',
                    checked ? 'bg-primary' : 'bg-muted-foreground/20',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
                      checked ? 'translate-x-5' : 'translate-x-0.5',
                    )}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
