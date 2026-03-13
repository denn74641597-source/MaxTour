'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, User, ArrowRight, Phone, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import type { UserRole } from '@/types';

type AuthStep = 'role-select' | 'register-form';

export function AuthScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [step, setStep] = useState<AuthStep>('role-select');
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    setStep('register-form');
  };

  // Normalize phone to E.164 for use as a fake email identifier
  const phoneToEmail = (rawPhone: string) => {
    const digits = rawPhone.replace(/\D/g, '');
    return `${digits}@maxtour.local`;
  };

  // Register user (phone + name only, no SMS)
  const handleUserRegister = async () => {
    const trimmedPhone = phone.trim();
    const trimmedName = fullName.trim();
    if (!trimmedPhone || !trimmedName) return;

    setLoading(true);
    setError('');

    try {
      const email = phoneToEmail(trimmedPhone);
      // Use a deterministic auto-password so the user never needs to know it
      const autoPassword = `user_${trimmedPhone.replace(/\D/g, '')}_maxtour`;

      // Try sign up first
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password: autoPassword,
        });

      let userId: string | undefined;

      if (signUpError) {
        // If user already exists, try sign in
        if (signUpError.message?.toLowerCase().includes('already')) {
          const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({ email, password: autoPassword });
          if (signInError) {
            setError(t.auth.phoneAlreadyRegistered);
            return;
          }
          userId = signInData.user?.id;
        } else {
          setError(signUpError.message);
          return;
        }
      } else {
        userId = signUpData.user?.id;
      }

      if (!userId) {
        setError('Xatolik yuz berdi');
        return;
      }

      // Upsert profile
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        role: 'user' as const,
        full_name: trimmedName,
        phone: trimmedPhone,
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        setError(profileError.message);
        return;
      }

      router.refresh();
    } catch {
      setError('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // Register agency (phone + password)
  const handleAgencyRegister = async () => {
    const trimmedPhone = phone.trim();
    const trimmedPassword = password.trim();
    if (!trimmedPhone || !trimmedPassword) return;

    if (trimmedPassword.length < 6) {
      setError(t.auth.passwordTooShort);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const email = phoneToEmail(trimmedPhone);

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password: trimmedPassword,
        });

      let userId: string | undefined;

      if (signUpError) {
        if (signUpError.message?.toLowerCase().includes('already')) {
          // Try logging in with the password
          const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({
              email,
              password: trimmedPassword,
            });
          if (signInError) {
            setError(t.auth.wrongPassword);
            return;
          }
          userId = signInData.user?.id;
        } else {
          setError(signUpError.message);
          return;
        }
      } else {
        userId = signUpData.user?.id;
      }

      if (!userId) {
        setError('Xatolik yuz berdi');
        return;
      }

      // Upsert profile as agency_manager
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        role: 'agency_manager' as const,
        full_name: trimmedPhone,
        phone: trimmedPhone,
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        setError(profileError.message);
        return;
      }

      // Create agency record
      const slug = `agency-${userId.slice(0, 8)}`;
      await supabase.from('agencies').upsert({
        owner_id: userId,
        name: `Agentlik ${trimmedPhone}`,
        slug,
        country: 'Uzbekistan',
      });

      router.push('/agency');
    } catch {
      setError('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (selectedRole === 'user') {
      handleUserRegister();
    } else {
      handleAgencyRegister();
    }
  };

  const isFormValid =
    selectedRole === 'user'
      ? phone.trim() && fullName.trim()
      : phone.trim() && password.trim();

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

      {/* Step 2: Registration Form */}
      {step === 'register-form' && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
              {selectedRole === 'user' ? (
                <User className="h-8 w-8 text-primary" />
              ) : (
                <Building2 className="h-8 w-8 text-primary" />
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              {selectedRole === 'user'
                ? t.auth.registerAsUser
                : t.auth.registerAsAgency}
            </h1>
            <p className="text-sm text-slate-500">
              {t.auth.fillInfo}
            </p>
          </div>

          <div className="space-y-4">
            {/* Phone — always shown */}
            <div className="space-y-2">
              <Label htmlFor="phone">{t.auth.phone}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t.auth.phonePlaceholder}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>
            </div>

            {/* User: Name field */}
            {selectedRole === 'user' && (
              <div className="space-y-2">
                <Label htmlFor="fullName">{t.auth.fullName}</Label>
                <Input
                  id="fullName"
                  placeholder={t.auth.fullNamePlaceholder}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12"
                />
              </div>
            )}

            {/* Agency: Password field */}
            {selectedRole === 'agency_manager' && (
              <div className="space-y-2">
                <Label htmlFor="password">{t.auth.password}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t.auth.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-400">{t.auth.passwordHint}</p>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || loading}
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

            <button
              onClick={() => {
                setStep('role-select');
                setError('');
                setPhone('');
                setFullName('');
                setPassword('');
              }}
              className="w-full text-sm text-slate-500 hover:text-slate-700"
            >
              {t.common.back}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
