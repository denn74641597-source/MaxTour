'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Phone,
  Lock,
  Loader2,
  Eye,
  EyeOff,
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

type AuthStep = 'login' | 'register';
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

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [legalAccepted, setLegalAccepted] = useState(false);

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

  const isUserFormValid = fullName.trim() && phone.trim() && password.trim();

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
              Keep your trips and inquiries in one place
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Sign in to manage saved tours, receive updates and access your
              profile tools with the same account logic as mobile.
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
                subtitle="User account access stays consistent across devices."
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
