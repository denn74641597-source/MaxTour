'use client';

import { useState, useEffect } from 'react';
import { Mail, Phone, Lock, Loader2, Eye, EyeOff, Shield, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import {
  getSecurityInfoAction,
  updateEmailAction,
  updatePhoneAction,
  updatePasswordAction,
} from '@/features/auth/security-actions';

type OpenSection = 'email' | 'phone' | 'password' | null;

export function SecuritySection() {
  const { t } = useTranslation();

  const [openSection, setOpenSection] = useState<OpenSection>(null);
  const [loading, setLoading] = useState(false);
  const [infoLoading, setInfoLoading] = useState(true);

  // Current info
  const [currentEmail, setCurrentEmail] = useState('');
  const [currentPhone, setCurrentPhone] = useState('');

  // Form fields
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [curPassword, setCurPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurPassword, setShowCurPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    async function load() {
      const info = await getSecurityInfoAction();
      if (info) {
        setCurrentEmail(info.profileEmail || info.authEmail || '');
        setCurrentPhone(info.phone || '');
      }
      setInfoLoading(false);
    }
    load();
  }, []);

  function toggle(section: OpenSection) {
    setOpenSection(prev => prev === section ? null : section);
    // Reset fields when closing
    setNewEmail('');
    setNewPhone('');
    setCurPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }

  function mapError(err: string): string {
    switch (err) {
      case 'email_taken': return t.security.emailTaken;
      case 'phone_taken': return t.security.phoneTaken;
      case 'wrong_password': return t.security.wrongPassword;
      case 'password_too_short': return t.security.passwordTooShort;
      default: return t.security.error;
    }
  }

  async function handleEmailSave() {
    if (!newEmail.trim() || !newEmail.includes('@')) return;
    setLoading(true);
    const res = await updateEmailAction(newEmail.trim());
    setLoading(false);
    if (res.error) {
      toast.error(mapError(res.error));
    } else {
      toast.success(t.security.saved);
      setCurrentEmail(newEmail.trim().toLowerCase());
      setOpenSection(null);
      setNewEmail('');
    }
  }

  async function handlePhoneSave() {
    if (!newPhone.trim()) return;
    setLoading(true);
    const res = await updatePhoneAction(newPhone.trim());
    setLoading(false);
    if (res.error) {
      toast.error(mapError(res.error));
    } else {
      toast.success(t.security.saved);
      setCurrentPhone(newPhone.trim());
      setOpenSection(null);
      setNewPhone('');
    }
  }

  async function handlePasswordSave() {
    if (!curPassword || !newPassword) return;
    if (newPassword.length < 6) {
      toast.error(t.security.passwordTooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t.security.passwordMismatch);
      return;
    }
    setLoading(true);
    const res = await updatePasswordAction(curPassword, newPassword);
    setLoading(false);
    if (res.error) {
      toast.error(mapError(res.error));
    } else {
      toast.success(t.security.saved);
      setOpenSection(null);
      setCurPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  if (infoLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4 flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-1">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">{t.security.title}</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">{t.security.subtitle}</p>

        {/* ── Email Section ── */}
        <div className="border rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggle('email')}
            className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Mail className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium">{t.security.changeEmail}</p>
              <p className="text-xs text-muted-foreground truncate">
                {currentEmail || '—'}
              </p>
            </div>
            {openSection === 'email' ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </button>

          {openSection === 'email' && (
            <div className="px-3 pb-3 space-y-3 border-t pt-3">
              <p className="text-xs text-muted-foreground">{t.security.changeEmailHint}</p>
              {currentEmail && (
                <div className="text-xs">
                  <span className="text-muted-foreground">{t.security.currentEmail}: </span>
                  <span className="font-medium">{currentEmail}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="newEmail" className="text-xs">{t.security.newEmail}</Label>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder={t.security.newEmailPlaceholder}
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="h-10"
                />
              </div>
              <Button
                onClick={handleEmailSave}
                disabled={!newEmail.trim() || loading}
                className="w-full h-10"
                size="sm"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t.security.saving}</>
                ) : (
                  <><Check className="h-4 w-4 mr-2" />{t.common.save}</>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* ── Phone Section ── */}
        <div className="border rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggle('phone')}
            className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <Phone className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium">{t.security.changePhone}</p>
              <p className="text-xs text-muted-foreground truncate">
                {currentPhone || '—'}
              </p>
            </div>
            {openSection === 'phone' ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </button>

          {openSection === 'phone' && (
            <div className="px-3 pb-3 space-y-3 border-t pt-3">
              <p className="text-xs text-muted-foreground">{t.security.changePhoneHint}</p>
              {currentPhone && (
                <div className="text-xs">
                  <span className="text-muted-foreground">{t.security.currentPhone}: </span>
                  <span className="font-medium">{currentPhone}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="newPhone" className="text-xs">{t.security.newPhone}</Label>
                <Input
                  id="newPhone"
                  type="tel"
                  placeholder={t.security.newPhonePlaceholder}
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="h-10"
                />
              </div>
              <Button
                onClick={handlePhoneSave}
                disabled={!newPhone.trim() || loading}
                className="w-full h-10"
                size="sm"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t.security.saving}</>
                ) : (
                  <><Check className="h-4 w-4 mr-2" />{t.common.save}</>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* ── Password Section ── */}
        <div className="border rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggle('password')}
            className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Lock className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium">{t.security.changePassword}</p>
              <p className="text-xs text-muted-foreground">••••••••</p>
            </div>
            {openSection === 'password' ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </button>

          {openSection === 'password' && (
            <div className="px-3 pb-3 space-y-3 border-t pt-3">
              <p className="text-xs text-muted-foreground">{t.security.changePasswordHint}</p>

              <div className="space-y-1.5">
                <Label htmlFor="curPwd" className="text-xs">{t.security.currentPassword}</Label>
                <div className="relative">
                  <Input
                    id="curPwd"
                    type={showCurPassword ? 'text' : 'password'}
                    placeholder={t.security.currentPasswordPlaceholder}
                    value={curPassword}
                    onChange={e => setCurPassword(e.target.value)}
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurPassword(!showCurPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPwd" className="text-xs">{t.security.newPassword}</Label>
                <div className="relative">
                  <Input
                    id="newPwd"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder={t.security.newPasswordPlaceholder}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPwd" className="text-xs">{t.security.confirmPassword}</Label>
                <Input
                  id="confirmPwd"
                  type="password"
                  placeholder={t.security.confirmPasswordPlaceholder}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="h-10"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive">{t.security.passwordMismatch}</p>
                )}
              </div>

              <Button
                onClick={handlePasswordSave}
                disabled={!curPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || loading}
                className="w-full h-10"
                size="sm"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t.security.saving}</>
                ) : (
                  <><Check className="h-4 w-4 mr-2" />{t.common.save}</>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
