'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Building2,
  Shield,
  LogOut,
  ChevronRight,
  Phone,
  AtSign,
  Calendar,
  Loader2,
  Save,
  Bell,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Profile } from '@/types';

interface UserProfileViewProps {
  profile: Profile;
}

export function UserProfileView({ profile }: UserProfileViewProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [telegramUsername, setTelegramUsername] = useState(
    profile.telegram_username || ''
  );
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const supabase = createClient();

  const getRoleBadge = () => {
    switch (profile.role) {
      case 'agency_manager':
        return (
          <Badge variant="default" className="bg-emerald-500">
            <Building2 className="h-3 w-3 mr-1" />
            {t.auth.roleAgency}
          </Badge>
        );
      case 'admin':
        return (
          <Badge variant="default" className="bg-purple-500">
            <Shield className="h-3 w-3 mr-1" />
            {t.auth.roleAdmin}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <User className="h-3 w-3 mr-1" />
            {t.auth.roleUser}
          </Badge>
        );
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
          telegram_username: telegramUsername.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      setIsEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    window.location.href = '/profile';
  };

  const formattedDate = new Date(profile.created_at).toLocaleDateString();

  return (
    <div className="px-4 py-6 space-y-5 lg:max-w-3xl lg:mx-auto">
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <User className="h-8 w-8 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">
            {profile.full_name || t.nav.profile}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {getRoleBadge()}
          </div>
        </div>
      </div>

      <Separator />

      {/* Profile Info / Edit Form */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t.auth.personalInfo}</CardTitle>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                {t.auth.editProfile}
              </Button>
            )}
          </div>
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
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.auth.phonePlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-telegram">
                  {t.auth.telegramUsername}
                </Label>
                <Input
                  id="edit-telegram"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  placeholder={t.auth.telegramPlaceholder}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t.auth.saving}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {t.common.save}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFullName(profile.full_name || '');
                    setPhone(profile.phone || '');
                    setTelegramUsername(profile.telegram_username || '');
                  }}
                >
                  {t.common.cancel}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t.auth.fullName}:</span>
                <span className="font-medium text-foreground">
                  {profile.full_name || '—'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t.auth.phone}:</span>
                <span className="font-medium text-foreground">
                  {profile.phone || '—'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <AtSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Telegram:</span>
                <span className="font-medium text-foreground">
                  {profile.telegram_username || '—'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t.auth.memberSince}:</span>
                <span className="font-medium text-foreground">
                  {formattedDate}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role-specific actions */}
      {profile.role === 'agency_manager' && (
        <Link href="/agency">
          <Card className="cursor-pointer hover:bg-muted transition-colors">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <Building2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {t.auth.goToAgencyDashboard}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t.nav.agencyPanel}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Notification settings */}
      <Link href="/profile/notifications">
        <Card className="cursor-pointer hover:bg-muted transition-colors">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                {t.notifications.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t.notifications.subtitle}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>



      {/* Logout Button */}
      <Button
        variant="outline"
        className="w-full mt-4 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
        onClick={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <LogOut className="h-4 w-4 mr-2" />
        )}
        {t.auth.logout}
      </Button>
    </div>
  );
}
