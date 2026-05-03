'use client';

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  User,
  Phone,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  LogIn,
  ShieldCheck,
  Sparkles,
  Plane,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { slugify } from '@/lib/utils';

type AuthStep = 'login' | 'register' | 'otp-verify';
type RegisterTab = 'user' | 'agency';

const OTP_COOLDOWN = 60;
const UZ_PHONE_REGEX = /^\+?998\d{9}$/;

function isValidUzPhone(phone: string): boolean {
  return UZ_PHONE_REGEX.test(normalizePhone(phone));
}

function phoneToAuthEmail(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, '');
  return `${cleaned}@user.maxtour.uz`;
}

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('998') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

export function AuthScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<AuthStep>('login');
  const [registerTab, setRegisterTab] = useState<RegisterTab>('user');

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [agencyFullName, setAgencyFullName] = useState('');
  const [agencyEmail, setAgencyEmail] = useState('');
  const [agencyPhone, setAgencyPhone] = useState('');
  const [agencyPassword, setAgencyPassword] = useState('');
  const [showAgencyPassword, setShowAgencyPassword] = useState(false);

  const [otpCode, setOtpCode] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [legalAccepted, setLegalAccepted] = useState(false);

  const pendingAgencyRef = useRef<{
    fullName: string;
    email: string;
    phone: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleLogin = async () => {
    const identifier = loginIdentifier.trim();
    const pwd = loginPassword.trim();
    if (!identifier || !pwd) return;

    setLoading(true);
    setError('');

    try {
      const isEmail = identifier.includes('@');
      const authEmail = isEmail
        ? identifier.toLowerCase()
        : phoneToAuthEmail(normalizePhone(identifier));

      let { error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: pwd,
      });

      if (signInError && !isEmail) {
        try {
          const normalizedPhone = normalizePhone(identifier);
          const phoneDigits = normalizedPhone.replace(/^\+/, '');
          const legacyEmail = `${phoneDigits}@maxtour.local`;

          if (legacyEmail !== authEmail) {
            const legacy = await supabase.auth.signInWithPassword({
              email: legacyEmail,
              password: pwd,
            });
            if (!legacy.error) signInError = null;
          }

          if (signInError) {
            const res = await fetch('/api/auth-phone', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone: normalizedPhone }),
            });
            const data = await res.json();

            if (data.email) {
              const retry = await supabase.auth.signInWithPassword({
                email: data.email,
                password: pwd,
              });
              signInError = retry.error ?? null;
            }

            if (signInError && data.legacyEmails) {
              for (const legacy of data.legacyEmails as string[]) {
                if (legacy === data.email) continue;
                const retry = await supabase.auth.signInWithPassword({
                  email: legacy,
                  password: pwd,
                });
                if (!retry.error) {
                  signInError = null;
                  break;
                }
              }
            }
          }
        } catch {
          // Ignore fallback lookup errors
        }
      }

      if (signInError && isEmail) {
        try {
          const { data: profileByEmail } = await supabase
            .from('profiles')
            .select('phone')
            .eq('email', identifier.toLowerCase())
            .limit(1)
            .single();

          if (profileByEmail?.phone) {
            const phoneEmail = phoneToAuthEmail(profileByEmail.phone);
            if (phoneEmail !== authEmail) {
              const retry = await supabase.auth.signInWithPassword({
                email: phoneEmail,
                password: pwd,
              });
              signInError = retry.error ?? null;
            }
          }
        } catch {
          // Ignore fallback lookup errors
        }
      }

      if (signInError) {
        const msg = signInError.message?.toLowerCase() || '';
        if (
          msg.includes('invalid login credentials') ||
          msg.includes('invalid password')
        ) {
          setError(t.auth.wrongPassword);
        } else if (msg.includes('not found') || msg.includes('no user')) {
          setError("Foydalanuvchi topilmadi. Ro'yxatdan o'ting.");
        } else {
          setError(t.auth.wrongPassword);
        }
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/profile');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role === 'agency_manager') {
        router.push('/agency');
        return;
      }

      router.push('/profile');
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleUserRegister = async () => {
    const trimmedName = fullName.trim();
    const trimmedPhone = normalizePhone(phone.trim());
    const trimmedPassword = password.trim();
    if (!trimmedName || !trimmedPhone || !trimmedPassword) return;

    if (!legalAccepted) {
      setError('Please accept Terms and Privacy Policy.');
      return;
    }

    if (!isValidUzPhone(trimmedPhone)) {
      setError("Telefon raqami noto'g'ri. Format: +998XXXXXXXXX");
      return;
    }

    if (trimmedPassword.length < 6) {
      setError(t.auth.passwordTooShort);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const authEmail = phoneToAuthEmail(trimmedPhone);

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: authEmail,
        password: trimmedPassword,
        options: {
          data: {
            full_name: trimmedName,
            phone: trimmedPhone,
            role: 'user',
          },
        },
      });

      if (signUpError) {
        if (signUpError.message?.includes('already registered')) {
          setError(t.auth.phoneAlreadyRegistered);
        } else {
          setError(signUpError.message);
        }
        return;
      }

      const userId = signUpData.user?.id;
      if (!userId) {
        setError('Xatolik yuz berdi');
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: trimmedPassword,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

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

      router.push('/profile');
    } catch (err) {
      console.error('User register error:', err);
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = useCallback(
    async (targetEmail: string) => {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: targetEmail,
        options: { shouldCreateUser: true },
      });
      if (otpError) throw otpError;
      setCooldown(OTP_COOLDOWN);
    },
    [supabase.auth]
  );

  const handleAgencyRegister = async () => {
    const trimmedName = agencyFullName.trim();
    const trimmedEmail = agencyEmail.trim().toLowerCase();
    const trimmedPhone = normalizePhone(agencyPhone.trim());
    const trimmedPassword = agencyPassword.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone || !trimmedPassword) return;

    if (!legalAccepted) {
      setError('Please accept Terms and Privacy Policy.');
      return;
    }

    if (!isValidUzPhone(trimmedPhone)) {
      setError("Telefon raqami noto'g'ri. Format: +998XXXXXXXXX");
      return;
    }

    if (trimmedPassword.length < 6) {
      setError(t.auth.passwordTooShort);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await sendOtp(trimmedEmail);

      pendingAgencyRef.current = {
        fullName: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        password: trimmedPassword,
      };
      setStep('otp-verify');
    } catch (err) {
      console.error('Agency OTP error:', err);
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const trimmedCode = otpCode.trim();
    const pending = pendingAgencyRef.current;
    if (!trimmedCode || !pending) return;

    setLoading(true);
    setError('');

    try {
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email: pending.email,
        token: trimmedCode,
        type: 'email',
      });

      if (verifyError) {
        if (verifyError.message?.toLowerCase().includes('expired')) {
          setError(t.auth.otpExpired);
        } else {
          setError(t.auth.otpInvalid);
        }
        return;
      }

      const userId = verifyData.user?.id;
      if (!userId) {
        setError('Xatolik yuz berdi');
        return;
      }

      if (verifyData.session?.access_token && verifyData.session?.refresh_token) {
        await supabase.auth.setSession({
          access_token: verifyData.session.access_token,
          refresh_token: verifyData.session.refresh_token,
        });
      }

      let { error: pwdError } = await supabase.auth.updateUser({
        password: pending.password,
      });

      if (pwdError && /session/i.test(pwdError.message ?? '')) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const retry = await supabase.auth.updateUser({ password: pending.password });
        pwdError = retry.error;
      }

      if (pwdError) {
        const msg = (pwdError.message ?? '').toLowerCase();
        if (
          !msg.includes('should be different') &&
          !msg.includes('same password')
        ) {
          setError(pwdError.message || "Parolni saqlashda xatolik. Qayta urinib ko'ring.");
          return;
        }
      }

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        role: 'agency_manager' as const,
        full_name: pending.fullName,
        phone: normalizePhone(pending.phone),
        email: pending.email,
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        setError(profileError.message);
        return;
      }

      const slug = slugify(pending.fullName) || `agency-${userId.slice(0, 8)}`;

      const { error: agencyError } = await supabase.from('agencies').upsert({
        owner_id: userId,
        name: pending.fullName,
        slug,
        phone: normalizePhone(pending.phone),
        country: 'Uzbekistan',
      });

      if (agencyError) {
        setError(agencyError.message);
        return;
      }

      router.push('/agency');
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    const pending = pendingAgencyRef.current;
    if (!pending) return;

    setLoading(true);
    setError('');
    try {
      await sendOtp(pending.email);
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const isUserFormValid = fullName.trim() && phone.trim() && password.trim();
  const isAgencyFormValid =
    agencyFullName.trim() &&
    agencyEmail.trim() &&
    agencyPhone.trim() &&
    agencyPassword.trim();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:py-10">
      <div className="grid gap-5 lg:grid-cols-[1.05fr_1.35fr]">
        <Card className="market-section market-subtle-border rounded-3xl border-none overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              MaxTour account
            </div>
            <h1 className="mt-4 text-2xl font-bold sm:text-3xl">
              Keep your trips, inquiries and agency growth in one place
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Sign in to manage saved tours, receive updates and access your
              personal or agency tools with the same account logic as mobile.
            </p>

            <div className="mt-6 grid gap-3">
              <BenefitCard
                icon={<Plane className="h-4 w-4 text-primary" />}
                title="Saved tours across devices"
                subtitle="Your favorites stay synced with your profile."
              />
              <BenefitCard
                icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />}
                title="Secure role-based access"
                subtitle="User, agency manager and admin roles stay consistent."
              />
              <BenefitCard
                icon={<Building2 className="h-4 w-4 text-amber-600" />}
                title="Agency panel entry"
                subtitle="Agency managers can continue straight to their dashboard."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="market-section market-subtle-border rounded-3xl border-none shadow-[0_30px_56px_-34px_rgba(15,23,42,0.55)]">
          <CardContent className="p-5 sm:p-8">
            {step === 'login' && (
              <div className="space-y-5">
                <div className="space-y-2 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <LogIn className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">{t.auth.welcome}</h2>
                  <p className="text-sm text-muted-foreground">{t.auth.loginHint}</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="loginId">{t.auth.emailOrPhone}</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="loginId"
                        placeholder={t.auth.emailOrPhonePlaceholder}
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        className="h-12 pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loginPwd">{t.auth.password}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="loginPwd"
                        type={showLoginPassword ? 'text' : 'password'}
                        placeholder={t.auth.passwordPlaceholder}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        className="h-12 pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showLoginPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-center text-sm text-destructive">{error}</p>}

                  <Button
                    onClick={handleLogin}
                    disabled={!loginIdentifier.trim() || !loginPassword.trim() || loading}
                    className="h-12 w-full text-base"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t.auth.loggingIn}
                      </>
                    ) : (
                      t.auth.login
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setError('');
                      setStep('register');
                    }}
                    className="h-12 w-full text-base"
                  >
                    {t.auth.register}
                  </Button>
                </div>
              </div>
            )}

            {step === 'register' && (
              <div className="space-y-5">
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-bold">{t.auth.register}</h2>
                  <p className="text-sm text-muted-foreground">{t.auth.registerHint}</p>
                </div>

                <div className="flex rounded-xl bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterTab('user');
                      setError('');
                    }}
                    className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition ${
                      registerTab === 'user'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <User className="h-4 w-4" />
                      {t.auth.tabUser}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterTab('agency');
                      setError('');
                    }}
                    className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition ${
                      registerTab === 'agency'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="h-4 w-4" />
                      {t.auth.tabAgency}
                    </span>
                  </button>
                </div>

                {registerTab === 'user' && (
                  <div className="space-y-4">
                    <FieldWithIcon
                      id="userName"
                      label={`${t.auth.fullName} *`}
                      value={fullName}
                      onChange={setFullName}
                      placeholder={t.auth.fullNamePlaceholder}
                      icon={<User className="h-4 w-4 text-muted-foreground" />}
                    />
                    <FieldWithIcon
                      id="userPhone"
                      label={`${t.auth.phone} *`}
                      value={phone}
                      onChange={setPhone}
                      placeholder={t.auth.phonePlaceholder}
                      icon={<Phone className="h-4 w-4 text-muted-foreground" />}
                    />
                    <PasswordField
                      id="userPassword"
                      label={`${t.auth.password} *`}
                      value={password}
                      onChange={setPassword}
                      placeholder={t.auth.passwordPlaceholder}
                      shown={showPassword}
                      onToggle={() => setShowPassword(!showPassword)}
                    />
                  </div>
                )}

                {registerTab === 'agency' && (
                  <div className="space-y-4">
                    <FieldWithIcon
                      id="agencyName"
                      label={`${t.auth.fullName} *`}
                      value={agencyFullName}
                      onChange={setAgencyFullName}
                      placeholder={t.auth.fullNamePlaceholder}
                      icon={<User className="h-4 w-4 text-muted-foreground" />}
                    />
                    <FieldWithIcon
                      id="agencyEmail"
                      type="email"
                      label={`${t.auth.email} *`}
                      value={agencyEmail}
                      onChange={setAgencyEmail}
                      placeholder={t.auth.emailPlaceholder}
                      icon={<Mail className="h-4 w-4 text-muted-foreground" />}
                    />
                    <FieldWithIcon
                      id="agencyPhone"
                      label={`${t.auth.phone} *`}
                      value={agencyPhone}
                      onChange={setAgencyPhone}
                      placeholder={t.auth.phonePlaceholder}
                      icon={<Phone className="h-4 w-4 text-muted-foreground" />}
                    />
                    <PasswordField
                      id="agencyPassword"
                      label={`${t.auth.password} *`}
                      value={agencyPassword}
                      onChange={setAgencyPassword}
                      placeholder={t.auth.passwordPlaceholder}
                      shown={showAgencyPassword}
                      onToggle={() => setShowAgencyPassword(!showAgencyPassword)}
                    />
                  </div>
                )}

                <label className="flex items-start gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={legalAccepted}
                    onChange={(e) => setLegalAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border"
                  />
                  <span>
                    I agree to the{' '}
                    <a
                      href="https://maxtour.uz/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      Terms
                    </a>{' '}
                    and{' '}
                    <a
                      href="https://maxtour.uz/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>

                {error && <p className="text-center text-sm text-destructive">{error}</p>}

                {registerTab === 'user' ? (
                  <Button
                    onClick={handleUserRegister}
                    disabled={!isUserFormValid || loading}
                    className="h-12 w-full text-base"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t.auth.registering}
                      </>
                    ) : (
                      t.auth.register
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleAgencyRegister}
                    disabled={!isAgencyFormValid || loading}
                    className="h-12 w-full text-base"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t.auth.sendingOtp}
                      </>
                    ) : (
                      t.auth.sendOtp
                    )}
                  </Button>
                )}

                <p className="text-center text-sm text-muted-foreground">
                  {t.auth.alreadyHaveAccount}{' '}
                  <button
                    onClick={() => {
                      setError('');
                      setStep('login');
                    }}
                    className="font-medium text-primary hover:underline"
                  >
                    {t.auth.login}
                  </button>
                </p>
              </div>
            )}

            {step === 'otp-verify' && (
              <div className="space-y-5">
                <div className="space-y-2 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">{t.auth.otpCode}</h2>
                  <p className="text-sm text-muted-foreground">{t.auth.otpSentTo}</p>
                  <p className="text-sm font-semibold">
                    {pendingAgencyRef.current?.email}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otpCode">{t.auth.otpCode}</Label>
                  <Input
                    id="otpCode"
                    type="text"
                    inputMode="numeric"
                    placeholder={t.auth.otpCodePlaceholder}
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    onKeyDown={(e) =>
                      e.key === 'Enter' && otpCode.length === 6 && handleVerifyOtp()
                    }
                    className="h-14 text-center font-mono text-2xl tracking-[0.42em]"
                    maxLength={6}
                    autoFocus
                  />
                </div>

                {error && <p className="text-center text-sm text-destructive">{error}</p>}

                <Button
                  onClick={handleVerifyOtp}
                  disabled={otpCode.length !== 6 || loading}
                  className="h-12 w-full text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t.auth.verifyingOtp}
                    </>
                  ) : (
                    t.auth.verifyOtp
                  )}
                </Button>

                <div className="text-center text-sm">
                  {cooldown > 0 ? (
                    <span className="text-muted-foreground">
                      {t.auth.resendIn} {cooldown}s
                    </span>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="font-medium text-primary hover:underline"
                    >
                      {t.auth.resendCode}
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    setOtpCode('');
                    setError('');
                    setStep('register');
                    setRegisterTab('agency');
                  }}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                >
                  {t.auth.changeEmail}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl bg-surface/80 p-4 shadow-[0_16px_28px_-26px_rgba(15,23,42,0.65)]">
      <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background">
        {icon}
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function FieldWithIcon({
  id,
  type = 'text',
  label,
  value,
  onChange,
  placeholder,
  icon,
}: {
  id: string;
  type?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-12 pl-10"
        />
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  shown,
  onToggle,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  shown: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={shown ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-12 pl-10 pr-10"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
