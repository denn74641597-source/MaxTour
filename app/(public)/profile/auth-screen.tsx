'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, User, ArrowRight, Phone, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import type { UserRole } from '@/types';

type AuthStep = 'role-select' | 'phone-input' | 'otp-verify' | 'info-form';

export function AuthScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [step, setStep] = useState<AuthStep>('role-select');
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  // Step 1: Select role
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('phone-input');
  };

  // Step 2: Send OTP
  const handleSendOtp = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    setError('');

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: phone.trim(),
      });

      if (otpError) {
        setError(otpError.message);
      } else {
        setStep('otp-verify');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp.trim()) return;
    setLoading(true);
    setError('');

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: phone.trim(),
        token: otp.trim(),
        type: 'sms',
      });

      if (verifyError) {
        setError(t.auth.invalidCode);
      } else {
        setStep('info-form');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Save profile info
  const handleSaveProfile = async () => {
    if (!fullName.trim()) return;
    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      // Update profile with role and info
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          role: selectedRole,
          full_name: fullName.trim(),
          phone: phone.trim(),
          telegram_username: telegramUsername.trim() || null,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      // If agency role, create agency record
      if (selectedRole === 'agency_manager' && agencyName.trim()) {
        const slug = agencyName
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-');

        await supabase.from('agencies').upsert({
          owner_id: user.id,
          name: agencyName.trim(),
          slug: slug || `agency-${user.id.slice(0, 8)}`,
          country: 'Uzbekistan',
        });
      }

      // Redirect based on role
      if (selectedRole === 'agency_manager') {
        router.push('/agency');
      } else {
        router.refresh();
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-8">
      {/* Step 1: Role Selection */}
      {step === 'role-select' && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">
              {t.auth.welcome}
            </h1>
            <p className="text-sm text-slate-500">{t.auth.chooseRole}</p>
          </div>

          <div className="space-y-3">
            {/* User role card */}
            <Card
              className="cursor-pointer border-2 border-transparent hover:border-primary/30 transition-all"
              onClick={() => handleRoleSelect('user')}
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">
                    {t.auth.registerAsUser}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {t.auth.registerAsUserHint}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400" />
              </CardContent>
            </Card>

            {/* Agency role card */}
            <Card
              className="cursor-pointer border-2 border-transparent hover:border-primary/30 transition-all"
              onClick={() => handleRoleSelect('agency_manager')}
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <Building2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">
                    {t.auth.registerAsAgency}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {t.auth.registerAsAgencyHint}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400" />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Step 2: Phone Input */}
      {step === 'phone-input' && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
              <Phone className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              {t.auth.enterPhone}
            </h1>
            <p className="text-sm text-slate-500">{t.auth.welcomeHint}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t.auth.phone}</Label>
              <Input
                id="phone"
                type="tel"
                placeholder={t.auth.phonePlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-lg h-12"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button
              onClick={handleSendOtp}
              disabled={!phone.trim() || loading}
              className="w-full h-12 text-base"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                t.auth.sendCode
              )}
            </Button>

            <button
              onClick={() => setStep('role-select')}
              className="w-full text-sm text-slate-500 hover:text-slate-700"
            >
              {t.common.back}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: OTP Verification */}
      {step === 'otp-verify' && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold text-slate-900">
              {t.auth.enterCode}
            </h1>
            <p className="text-sm text-slate-500">
              {t.auth.codeSent}: {phone}
            </p>
          </div>

          <div className="space-y-4">
            <Input
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="text-center text-2xl tracking-[0.5em] h-14"
              maxLength={6}
            />

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button
              onClick={handleVerifyOtp}
              disabled={otp.length < 6 || loading}
              className="w-full h-12 text-base"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                t.auth.verifyCode
              )}
            </Button>

            <button
              onClick={() => {
                setStep('phone-input');
                setOtp('');
                setError('');
              }}
              className="w-full text-sm text-slate-500 hover:text-slate-700"
            >
              {t.common.back}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Profile Info Form */}
      {step === 'info-form' && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold text-slate-900">
              {t.auth.personalInfo}
            </h1>
            <p className="text-sm text-slate-500">{t.auth.fillInfo}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t.auth.fullName}</Label>
              <Input
                id="fullName"
                placeholder={t.auth.fullNamePlaceholder}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram">{t.auth.telegramUsername}</Label>
              <Input
                id="telegram"
                placeholder={t.auth.telegramPlaceholder}
                value={telegramUsername}
                onChange={(e) => setTelegramUsername(e.target.value)}
              />
            </div>

            {selectedRole === 'agency_manager' && (
              <div className="space-y-2">
                <Label htmlFor="agencyName">{t.auth.agencyName}</Label>
                <Input
                  id="agencyName"
                  placeholder={t.auth.agencyNamePlaceholder}
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button
              onClick={handleSaveProfile}
              disabled={!fullName.trim() || loading}
              className="w-full h-12 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  {t.auth.registering}
                </>
              ) : (
                t.auth.register
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
