'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AtSign,
  Bell,
  Building2,
  Calendar,
  ChevronRight,
  CircleHelp,
  Clock3,
  Loader2,
  LogOut,
  Mail,
  Phone,
  Save,
  Settings2,
  Shield,
  ShieldAlert,
  Star,
  Ticket,
  User,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { updatePasswordAction } from '@/features/auth/security-actions';
import type { Profile } from '@/types';

type ProfileTab = 'overview' | 'personal' | 'saved' | 'inquiries' | 'agency' | 'settings';

interface UserProfileViewProps {
  profile: Profile;
}

interface SavedTourActivity {
  id: string;
  created_at: string;
  tour: {
    id: string;
    slug: string;
    title: string;
    cover_image_url: string | null;
    country: string | null;
    city: string | null;
  } | null;
}

interface InquiryActivity {
  id: string;
  status: string;
  created_at: string;
  tour: {
    id: string;
    slug: string;
    title: string;
    cover_image_url: string | null;
  } | null;
}

interface AgencySummary {
  id: string;
  name: string;
  slug: string;
  is_verified: boolean;
  is_approved: boolean;
  city: string | null;
  country: string | null;
  description: string | null;
  phone: string | null;
  inn: string | null;
  responsible_person: string | null;
  maxcoin_balance: number | null;
}

interface AgencyMetrics {
  toursCount: number;
  leadsCount: number;
  activePlanName: string | null;
  activePlanEndsAt: string | null;
}

const UZ_PHONE_STRICT_REGEX = /^\+\d{12}$/;
const TELEGRAM_REGEX = /^[A-Za-z0-9_]{5,32}$/;

export function UserProfileView({ profile }: UserProfileViewProps) {
  const { t } = useTranslation();
  const supabase = useMemo(() => createClient(), []);

  const [currentProfile, setCurrentProfile] = useState(profile);
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [telegramUsername, setTelegramUsername] = useState(
    profile.telegram_username ?? ''
  );
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const [savedTours, setSavedTours] = useState<SavedTourActivity[]>([]);
  const [inquiries, setInquiries] = useState<InquiryActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState<string | null>(null);

  const [agencySummary, setAgencySummary] = useState<AgencySummary | null>(null);
  const [agencyMetrics, setAgencyMetrics] = useState<AgencyMetrics | null>(null);
  const [agencyLoading, setAgencyLoading] = useState(false);
  const [agencyError, setAgencyError] = useState<string | null>(null);

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletionLoading, setDeletionLoading] = useState(false);

  useEffect(() => {
    setCurrentProfile(profile);
    setFullName(profile.full_name ?? '');
    setPhone(profile.phone ?? '');
    setTelegramUsername(profile.telegram_username ?? '');
  }, [profile]);

  useEffect(() => {
    async function loadActivity() {
      setActivityLoading(true);
      setActivityError(null);

      try {
        const [favoritesRes, leadsRes] = await Promise.all([
          supabase
            .from('favorites')
            .select(
              'id, created_at, tour:tours(id, slug, title, cover_image_url, country, city)'
            )
            .eq('user_id', currentProfile.id)
            .order('created_at', { ascending: false })
            .limit(8),
          supabase
            .from('leads')
            .select('id, status, created_at, tour:tours(id, slug, title, cover_image_url)')
            .eq('user_id', currentProfile.id)
            .order('created_at', { ascending: false })
            .limit(8),
        ]);

        if (favoritesRes.error) {
          throw favoritesRes.error;
        }
        if (leadsRes.error) {
          throw leadsRes.error;
        }

        setSavedTours((favoritesRes.data ?? []) as unknown as SavedTourActivity[]);
        setInquiries((leadsRes.data ?? []) as unknown as InquiryActivity[]);
      } catch (error) {
        console.error('profile activity load error:', error);
        setActivityError('Unable to load activity right now.');
      } finally {
        setActivityLoading(false);
      }
    }

    loadActivity();
  }, [currentProfile.id, supabase]);

  useEffect(() => {
    async function loadAgencySummary() {
      if (currentProfile.role !== 'agency_manager') {
        setAgencySummary(null);
        setAgencyMetrics(null);
        setAgencyError(null);
        return;
      }

      setAgencyLoading(true);
      setAgencyError(null);

      try {
        const { data: agency, error } = await supabase
          .from('agencies')
          .select(
            'id, name, slug, is_verified, is_approved, city, country, description, phone, inn, responsible_person, maxcoin_balance'
          )
          .eq('owner_id', currentProfile.id)
          .maybeSingle();

        if (error) throw error;
        if (!agency) {
          setAgencySummary(null);
          setAgencyMetrics(null);
          return;
        }

        const [tourCountRes, leadCountRes, planRes] = await Promise.all([
          supabase
            .from('tours')
            .select('id', { count: 'exact', head: true })
            .eq('agency_id', agency.id),
          supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('agency_id', agency.id),
          supabase
            .from('agency_subscriptions')
            .select('ends_at, plan:subscription_plans(name)')
            .eq('agency_id', agency.id)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle(),
        ]);

        if (tourCountRes.error) throw tourCountRes.error;
        if (leadCountRes.error) throw leadCountRes.error;

        setAgencySummary(agency as AgencySummary);
        setAgencyMetrics({
          toursCount: tourCountRes.count ?? 0,
          leadsCount: leadCountRes.count ?? 0,
          activePlanName:
            ((planRes.data?.plan as { name?: string } | null)?.name as string | undefined) ??
            null,
          activePlanEndsAt: planRes.data?.ends_at ?? null,
        });
      } catch (error) {
        console.error('agency summary load error:', error);
        setAgencyError('Agency details are not available for this account yet.');
      } finally {
        setAgencyLoading(false);
      }
    }

    loadAgencySummary();
  }, [currentProfile.id, currentProfile.role, supabase]);

  const roleBadge = useMemo(() => {
    if (currentProfile.role === 'agency_manager') {
      return (
        <Badge className="bg-emerald-600 text-white">
          <Building2 className="mr-1 h-3.5 w-3.5" />
          {t.auth.roleAgency}
        </Badge>
      );
    }
    if (currentProfile.role === 'admin') {
      return (
        <Badge className="bg-slate-800 text-white">
          <Shield className="mr-1 h-3.5 w-3.5" />
          {t.auth.roleAdmin}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <User className="mr-1 h-3.5 w-3.5" />
        {t.auth.roleUser}
      </Badge>
    );
  }, [currentProfile.role, t.auth.roleAdmin, t.auth.roleAgency, t.auth.roleUser]);

  const profileCompleteness = useMemo(() => {
    const checkpoints = [
      Boolean(currentProfile.full_name?.trim()),
      Boolean(currentProfile.phone?.trim()),
      Boolean(currentProfile.telegram_username?.trim()),
      Boolean(currentProfile.email?.trim()),
    ];
    const filled = checkpoints.filter(Boolean).length;
    return Math.round((filled / checkpoints.length) * 100);
  }, [
    currentProfile.email,
    currentProfile.full_name,
    currentProfile.phone,
    currentProfile.telegram_username,
  ]);

  const agencyCompleteness = useMemo(() => {
    if (!agencySummary) return null;
    const checks = [
      Boolean(agencySummary.description?.trim()),
      Boolean(agencySummary.phone?.trim()),
      Boolean(agencySummary.city?.trim()),
      Boolean(agencySummary.inn?.trim()),
      Boolean(agencySummary.responsible_person?.trim()),
    ];
    const filled = checks.filter(Boolean).length;
    return Math.round((filled / checks.length) * 100);
  }, [agencySummary]);

  const isAgencyManager = currentProfile.role === 'agency_manager';
  const isAdmin = currentProfile.role === 'admin';

  const tabs = useMemo(() => {
    const baseTabs: Array<{ id: ProfileTab; label: string }> = [
      { id: 'overview', label: 'Overview' },
      { id: 'personal', label: 'Personal information' },
      { id: 'saved', label: 'Saved tours' },
      { id: 'inquiries', label: 'My inquiries' },
      { id: 'settings', label: 'Settings & safety' },
    ];
    if (isAgencyManager) {
      baseTabs.splice(4, 0, { id: 'agency', label: 'Agency profile' });
    }
    return baseTabs;
  }, [isAgencyManager]);

  async function handleSaveProfile() {
    setEditError(null);
    const trimmedPhone = phone.trim();
    const trimmedTelegram = telegramUsername.trim();

    if (trimmedPhone && !UZ_PHONE_STRICT_REGEX.test(trimmedPhone)) {
      setEditError("Phone format must be +998XXXXXXXXX.");
      return;
    }

    let normalizedTelegram: string | null = null;
    if (trimmedTelegram) {
      const withoutAt = trimmedTelegram.replace(/^@+/, '');
      if (!TELEGRAM_REGEX.test(withoutAt)) {
        setEditError('Telegram username must contain 5-32 letters, numbers or _.');
        return;
      }
      normalizedTelegram = `@${withoutAt}`;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          phone: trimmedPhone || null,
          telegram_username: normalizedTelegram,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentProfile.id);

      if (error) throw error;

      setCurrentProfile((prev) => ({
        ...prev,
        full_name: fullName.trim() || null,
        phone: trimmedPhone || null,
        telegram_username: normalizedTelegram,
      }));
      setIsEditing(false);
      toast.success(t.auth.profileUpdated);
    } catch (error) {
      console.error('profile update error:', error);
      setEditError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      await supabase.auth.signOut().catch(() => undefined);
    } finally {
      window.location.href = '/profile';
    }
  }

  function mapPasswordError(error: string): string {
    switch (error) {
      case 'wrong_password':
        return t.security.wrongPassword;
      case 'password_too_short':
        return t.security.passwordTooShort;
      default:
        return t.security.error;
    }
  }

  async function handlePasswordChange() {
    setPasswordError(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Fill in all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError(t.security.passwordTooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t.security.passwordMismatch);
      return;
    }

    setPasswordLoading(true);
    const result = await updatePasswordAction(currentPassword, newPassword);
    setPasswordLoading(false);

    if (result.error) {
      setPasswordError(mapPasswordError(result.error));
      return;
    }

    setIsPasswordDialogOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast.success(t.security.saved);
  }

  async function handleRequestDeletion() {
    setDeletionLoading(true);
    try {
      const {
        data: { session },
        error: refreshError,
      } = await supabase.auth.refreshSession();

      if (refreshError) {
        toast.error(refreshError.message);
        await handleLogout();
        return;
      }

      if (!session?.access_token) {
        toast.error('Session not found. Please sign in again.');
        await handleLogout();
        return;
      }

      const res = await supabase.functions.invoke('request-account-deletion');
      if (res.error) {
        let message = res.error.message;
        const context = (res.error as { context?: { clone?: () => Response } }).context;
        if (context && typeof context.clone === 'function') {
          try {
            const body = await context.clone().json();
            if (typeof body?.error === 'string') {
              message = body.error;
            }
          } catch {
            // Ignore parse errors
          }
        }
        toast.error(message || 'Failed to send deletion request.');
        return;
      }

      toast.success('Deletion request sent. You will be signed out now.');
      await handleLogout();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send deletion request.');
    } finally {
      setDeletionLoading(false);
      setIsDeleteDialogOpen(false);
    }
  }

  const formattedDate = new Date(currentProfile.created_at).toLocaleDateString();

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-6 lg:py-10">
      <Card className="market-section market-subtle-border overflow-hidden rounded-3xl border-none">
        <CardContent className="p-6 md:p-8">
          <div className="grid gap-5 md:grid-cols-[auto_1fr_auto] md:items-center">
            <Avatar size="lg" className="h-20 w-20">
              {currentProfile.avatar_url ? (
                <AvatarImage src={currentProfile.avatar_url} alt={currentProfile.full_name ?? 'User'} />
              ) : null}
              <AvatarFallback className="text-xl font-bold">
                {(currentProfile.full_name ?? currentProfile.email ?? 'U').slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold md:text-3xl">
                  {currentProfile.full_name || t.nav.profile}
                </h1>
                {roleBadge}
              </div>
              <p className="text-sm text-muted-foreground">
                {currentProfile.email || currentProfile.phone || 'Not provided'}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {t.auth.memberSince}: {formattedDate}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-primary" />
                  Profile completeness: {profileCompleteness}%
                </span>
              </div>
              <div className="h-2 w-full max-w-xs rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${profileCompleteness}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Link href="/favorites">
                <Button variant="outline" className="w-full justify-between gap-2">
                  <span className="inline-flex items-center gap-2">
                    <Ticket className="h-4 w-4" />
                    Saved tours
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/profile/notifications">
                <Button variant="outline" className="w-full justify-between gap-2">
                  <span className="inline-flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notifications
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              {isAgencyManager && (
                <Link href="/agency">
                  <Button className="w-full justify-between gap-2">
                    <span className="inline-flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {t.nav.agencyPanel}
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card className="rounded-2xl border-slate-200 bg-slate-50/70">
          <CardContent className="flex items-start gap-3 p-4 text-sm text-slate-700">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              This is the public profile space (`mxtr.uz`). Admin tools stay isolated
              on `remote.mxtr.uz`.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="market-subtle-border h-fit rounded-2xl border-none shadow-[0_20px_42px_-30px_rgba(15,23,42,0.35)]">
          <CardContent className="p-2">
            <nav className="grid gap-1">
              {tabs.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {activeTab === 'overview' && (
            <Card className="market-subtle-border rounded-2xl border-none">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <StatCard title="Saved tours" value={savedTours.length} icon={<Ticket className="h-4 w-4 text-primary" />} />
                  <StatCard title="My inquiries" value={inquiries.length} icon={<Mail className="h-4 w-4 text-primary" />} />
                  <StatCard title="Role" value={currentProfile.role} icon={<Shield className="h-4 w-4 text-primary" />} />
                </div>

                <Separator />

                {activityLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                  </div>
                ) : activityError ? (
                  <p className="text-sm text-destructive">{activityError}</p>
                ) : (
                  <div className="space-y-2">
                    {savedTours.slice(0, 3).map((item) => (
                      <ActivityRow
                        key={item.id}
                        title={item.tour?.title ?? 'Tour unavailable'}
                        subtitle={`Saved ${new Date(item.created_at).toLocaleDateString()}`}
                        href={item.tour?.slug ? `/tours/${item.tour.slug}` : undefined}
                      />
                    ))}
                    {savedTours.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No saved tours yet.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'personal' && (
            <Card className="market-subtle-border rounded-2xl border-none">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t.auth.personalInfo}</CardTitle>
                {!isEditing && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                    {t.auth.editProfile}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">{t.auth.fullName}</Label>
                      <Input
                        id="edit-name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={t.auth.fullNamePlaceholder}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">{t.auth.phone}</Label>
                      <Input
                        id="edit-phone"
                        value={phone}
                        onChange={(e) => {
                          let cleaned = e.target.value.replace(/[^\d+]/g, '');
                          cleaned = cleaned.replace(/(?!^)\+/g, '');
                          if (cleaned && !cleaned.startsWith('+')) {
                            cleaned = `+${cleaned.replace(/^\+/, '')}`;
                          }
                          if (cleaned.length > 13) cleaned = cleaned.slice(0, 13);
                          setPhone(cleaned);
                        }}
                        placeholder={t.auth.phonePlaceholder}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-telegram">{t.auth.telegramUsername}</Label>
                      <Input
                        id="edit-telegram"
                        value={telegramUsername}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '' || raw === '@') {
                            setTelegramUsername(raw);
                            return;
                          }
                          const withoutAt = raw
                            .replace(/^@+/, '')
                            .replace(/[^A-Za-z0-9_]/g, '');
                          setTelegramUsername(withoutAt ? `@${withoutAt}` : '');
                        }}
                        placeholder={t.auth.telegramPlaceholder}
                      />
                    </div>
                    {editError && <p className="text-sm text-destructive">{editError}</p>}
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handleSaveProfile} disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t.auth.saving}
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            {t.common.save}
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setEditError(null);
                          setFullName(currentProfile.full_name ?? '');
                          setPhone(currentProfile.phone ?? '');
                          setTelegramUsername(currentProfile.telegram_username ?? '');
                        }}
                      >
                        {t.common.cancel}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3 text-sm">
                    <InfoRow icon={<User className="h-4 w-4 text-muted-foreground" />} label={t.auth.fullName} value={currentProfile.full_name || 'Not provided'} />
                    <InfoRow icon={<Phone className="h-4 w-4 text-muted-foreground" />} label={t.auth.phone} value={currentProfile.phone || 'Not provided'} />
                    <InfoRow icon={<AtSign className="h-4 w-4 text-muted-foreground" />} label="Telegram" value={currentProfile.telegram_username || 'Not provided'} />
                    <InfoRow icon={<Mail className="h-4 w-4 text-muted-foreground" />} label={t.auth.email} value={currentProfile.email || 'Not provided'} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'saved' && (
            <Card className="market-subtle-border rounded-2xl border-none">
              <CardHeader>
                <CardTitle>Saved tours</CardTitle>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                  </div>
                ) : savedTours.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    You have not saved tours yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {savedTours.map((item) => (
                      <TourActivityCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'inquiries' && (
            <Card className="market-subtle-border rounded-2xl border-none">
              <CardHeader>
                <CardTitle>My inquiries</CardTitle>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </div>
                ) : inquiries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    You have not sent inquiries yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {inquiries.map((item) => (
                      <InquiryActivityCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'agency' && isAgencyManager && (
            <Card className="market-subtle-border rounded-2xl border-none">
              <CardHeader>
                <CardTitle>{t.nav.agencyPanel}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {agencyLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                  </div>
                ) : agencyError ? (
                  <p className="text-sm text-destructive">{agencyError}</p>
                ) : agencySummary ? (
                  <>
                    <div className="rounded-2xl bg-muted/60 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">{agencySummary.name}</h3>
                        {agencySummary.is_verified ? (
                          <Badge className="bg-emerald-600 text-white">Verified</Badge>
                        ) : (
                          <Badge variant="secondary">Not verified</Badge>
                        )}
                        {agencySummary.is_approved ? (
                          <Badge className="bg-sky-600 text-white">Approved</Badge>
                        ) : (
                          <Badge variant="secondary">Pending approval</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[agencySummary.city, agencySummary.country].filter(Boolean).join(', ') || 'Location not provided'}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <StatCard
                        title="Tours"
                        value={agencyMetrics?.toursCount ?? 0}
                        icon={<Ticket className="h-4 w-4 text-primary" />}
                      />
                      <StatCard
                        title="Leads"
                        value={agencyMetrics?.leadsCount ?? 0}
                        icon={<Mail className="h-4 w-4 text-primary" />}
                      />
                      <StatCard
                        title="MaxCoin"
                        value={agencySummary.maxcoin_balance ?? 0}
                        icon={<Wallet className="h-4 w-4 text-primary" />}
                      />
                      <StatCard
                        title="Plan"
                        value={agencyMetrics?.activePlanName ?? 'Not active'}
                        icon={<Clock3 className="h-4 w-4 text-primary" />}
                      />
                    </div>

                    {typeof agencyCompleteness === 'number' && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Agency profile completeness: {agencyCompleteness}%
                        </p>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${agencyCompleteness}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {!agencySummary.is_verified && (
                      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                        Agency verification is not completed yet. Add full legal
                        details in agency panel and submit verification.
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Link href="/agency">
                        <Button>
                          Open agency dashboard
                        </Button>
                      </Link>
                      {agencySummary.slug && (
                        <Link href={`/agencies/${agencySummary.slug}`}>
                          <Button variant="outline">View public agency page</Button>
                        </Link>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-muted-foreground/20 p-4 text-sm text-muted-foreground">
                    No linked agency found for this account yet.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'settings' && (
            <Card className="market-subtle-border rounded-2xl border-none">
              <CardHeader>
                <CardTitle>Settings & safety</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Link href="/profile/notifications">
                    <Button variant="outline" className="w-full justify-between">
                      <span className="inline-flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Notification preferences
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <a href="https://t.me/maxtour_support" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full justify-between">
                      <span className="inline-flex items-center gap-2">
                        <CircleHelp className="h-4 w-4" />
                        Help & support
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </a>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <a href="https://maxtour.uz/privacy" target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" className="w-full justify-start">
                      <Shield className="mr-2 h-4 w-4" />
                      Privacy policy
                    </Button>
                  </a>
                  <a href="https://maxtour.uz/terms" target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" className="w-full justify-start">
                      <Settings2 className="mr-2 h-4 w-4" />
                      Terms of service
                    </Button>
                  </a>
                </div>

                <Separator />

                <div className="rounded-xl border border-muted-foreground/20 p-4">
                  <h3 className="text-sm font-semibold">Security actions</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Use safe account actions available in current backend flow.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)}>
                      Change password
                    </Button>
                    <Button
                      variant="outline"
                      className="border-destructive/40 text-destructive hover:bg-destructive/10"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      Request account deletion
                    </Button>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  {t.auth.logout}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.security.changePassword}</DialogTitle>
            <DialogDescription>{t.security.changePasswordHint}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="current-password">{t.security.currentPassword}</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t.security.currentPasswordPlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">{t.security.newPassword}</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t.security.newPasswordPlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">{t.security.confirmPassword}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t.security.confirmPasswordPlaceholder}
              />
            </div>
            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handlePasswordChange} disabled={passwordLoading}>
              {passwordLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.security.saving}
                </>
              ) : (
                t.common.save
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request account deletion</DialogTitle>
            <DialogDescription>
              This sends a deletion request for admin review. After submitting, you
              will be signed out.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleRequestDeletion}
              disabled={deletionLoading}
            >
              {deletionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending request
                </>
              ) : (
                'Send deletion request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-surface p-3 shadow-[0_18px_24px_-26px_rgba(15,23,42,0.9)]">
      <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
        {icon}
      </div>
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2.5">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-medium">{value}</p>
      </div>
    </div>
  );
}

function ActivityRow({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {href ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : null}
    </div>
  );

  if (!href) return content;
  return <Link href={href}>{content}</Link>;
}

function TourActivityCard({ item }: { item: SavedTourActivity }) {
  if (!item.tour) {
    return (
      <div className="rounded-xl bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
        Tour details are no longer available.
      </div>
    );
  }

  return (
    <Link href={`/tours/${item.tour.slug}`} className="block">
      <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-2.5 transition hover:bg-muted/70">
        <div className="relative h-14 w-20 overflow-hidden rounded-lg bg-muted">
          {item.tour.cover_image_url ? (
            <Image
              src={item.tour.cover_image_url}
              alt={item.tour.title}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-muted-foreground">
              <Ticket className="h-4 w-4" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{item.tour.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[item.tour.city, item.tour.country].filter(Boolean).join(', ') || 'Location not specified'}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Saved {new Date(item.created_at).toLocaleDateString()}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  );
}

function InquiryActivityCard({ item }: { item: InquiryActivity }) {
  const statusTone =
    item.status === 'new'
      ? 'bg-blue-100 text-blue-700'
      : item.status === 'contacted'
      ? 'bg-amber-100 text-amber-700'
      : item.status === 'won'
      ? 'bg-emerald-100 text-emerald-700'
      : item.status === 'lost'
      ? 'bg-rose-100 text-rose-700'
      : 'bg-slate-100 text-slate-700';

  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold">
          {item.tour?.title ?? 'Tour unavailable'}
        </p>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusTone}`}>
          {item.status}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Sent {new Date(item.created_at).toLocaleDateString()}
      </p>
      {item.tour?.slug ? (
        <Link
          href={`/tours/${item.tour.slug}`}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Open tour
          <ChevronRight className="h-3 w-3" />
        </Link>
      ) : null}
    </div>
  );
}
