'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, User, Phone, Lock, Loader2, Eye, EyeOff, Mail, LogIn } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { slugify } from '@/lib/utils';

type AuthStep = 'login' | 'register' | 'otp-verify';
type RegisterTab = 'user' | 'agency';

const OTP_COOLDOWN = 60;

// Generate a deterministic email from phone for user auth (no email verification)
function phoneToAuthEmail(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, '');
  return `${cleaned}@user.maxtour.uz`;
}

/** Normalize phone number to consistent format for lookups */
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  // Ensure + prefix for numbers starting with country code
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

  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // User registration fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Agency registration fields
  const [agencyFullName, setAgencyFullName] = useState('');
  const [agencyEmail, setAgencyEmail] = useState('');
  const [agencyPhone, setAgencyPhone] = useState('');
  const [agencyPassword, setAgencyPassword] = useState('');
  const [showAgencyPassword, setShowAgencyPassword] = useState(false);

  // OTP fields
  const [otpCode, setOtpCode] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Common
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pending agency data for after OTP
  const pendingAgencyRef = useRef<{
    fullName: string;
    email: string;
    phone: string;
    password: string;
  } | null>(null);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // ── LOGIN ──
  const handleLogin = async () => {
    const identifier = loginIdentifier.trim();
    const pwd = loginPassword.trim();
    if (!identifier || !pwd) return;

    setLoading(true);
    setError('');

    try {
      // Determine if input is email or phone
      const isEmail = identifier.includes('@');
      const authEmail = isEmail ? identifier.toLowerCase() : phoneToAuthEmail(normalizePhone(identifier));

      let { error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: pwd,
      });

      // If email login failed, try looking up actual auth email via phone
      if (signInError && isEmail) {
        try {
          // Look up phone from profiles by this email, then resolve auth email
          const { data: profileByEmail } = await supabase
            .from('profiles')
            .select('phone')
            .eq('email', identifier.toLowerCase())
            .limit(1)
            .single();

          if (profileByEmail?.phone) {
            const res = await fetch('/api/auth-phone', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone: profileByEmail.phone }),
            });
            const data = await res.json();
            if (data.email && data.email !== authEmail) {
              const retry = await supabase.auth.signInWithPassword({
                email: data.email,
                password: pwd,
              });
              signInError = retry.error ?? null;
            }
          }
        } catch {
          // ignore lookup error
        }
      }

      // If phone login failed, try looking up agency email by phone
      if (signInError && !isEmail) {
        try {
          const normalizedPhone = normalizePhone(identifier);
          const res = await fetch('/api/auth-phone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: normalizedPhone }),
          });
          const data = await res.json();

          // Try primary email from auth-phone
          if (data.email) {
            const retry = await supabase.auth.signInWithPassword({
              email: data.email,
              password: pwd,
            });
            signInError = retry.error ?? null;
          }

          // Try legacy email patterns if primary failed
          if (signInError && data.legacyEmails) {
            for (const legacyEmail of data.legacyEmails) {
              if (legacyEmail === data.email) continue;
              const legacyRetry = await supabase.auth.signInWithPassword({
                email: legacyEmail,
                password: pwd,
              });
              if (!legacyRetry.error) {
                signInError = null;
                break;
              }
            }
          }

          // Last resort: try legacy @maxtour.local format
          if (signInError) {
            const phoneDigits = normalizedPhone.replace(/^\+/, '');
            const legacyEmail = `${phoneDigits}@maxtour.local`;
            if (legacyEmail !== data.email) {
              const legacy = await supabase.auth.signInWithPassword({
                email: legacyEmail,
                password: pwd,
              });
              signInError = legacy.error ?? null;
            }
          }
        } catch {
          // ignore lookup error, keep original error
        }
      }

      if (signInError) {
        const msg = signInError.message?.toLowerCase() || '';
        if (msg.includes('invalid login credentials') || msg.includes('invalid password')) {
          setError(t.auth.wrongPassword);
        } else if (msg.includes('email not confirmed')) {
          setError('Email tasdiqlanmagan. Iltimos, emailingizni tekshiring.');
        } else if (msg.includes('not found') || msg.includes('no user')) {
          setError('Foydalanuvchi topilmadi. Ro\'yxatdan o\'ting.');
        } else {
          setError(t.auth.wrongPassword);
        }
        return;
      }

      // Check user role to redirect properly
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'agency_manager') {
          router.push('/agency');
        } else {
          router.push('/');
        }
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // ── USER REGISTRATION (no email verification) ──
  const handleUserRegister = async () => {
    const trimmedName = fullName.trim();
    const trimmedPhone = normalizePhone(phone.trim());
    const trimmedPassword = password.trim();
    if (!trimmedName || !trimmedPhone || !trimmedPassword) return;

    if (trimmedPassword.length < 6) {
      setError(t.auth.passwordTooShort);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const authEmail = phoneToAuthEmail(trimmedPhone);

      // Sign up with generated email + password
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

      // Auto-confirm: sign in immediately
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: trimmedPassword,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // Upsert user profile
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

      // Redirect to home
      router.push('/');
    } catch (err) {
      console.error('User register error:', err);
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // ── AGENCY: Send OTP ──
  const sendOtp = useCallback(async (targetEmail: string) => {
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: { shouldCreateUser: true },
    });
    if (otpError) throw otpError;
    setCooldown(OTP_COOLDOWN);
  }, [supabase.auth]);

  const handleAgencyRegister = async () => {
    const trimmedName = agencyFullName.trim();
    const trimmedEmail = agencyEmail.trim().toLowerCase();
    const trimmedPhone = agencyPhone.trim();
    const trimmedPassword = agencyPassword.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone || !trimmedPassword) return;

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

  // ── VERIFY OTP (agency only) ──
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

      // Set password for future email+password login
      const { error: pwdError } = await supabase.auth.updateUser({ password: pending.password });
      if (pwdError) {
        console.error('Password update error:', pwdError);
        setError('Parolni saqlashda xatolik. Qayta urinib ko\'ring.');
        return;
      }

      // Upsert agency_manager profile
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

      // Create agency record with minimal data (profile to be completed in dashboard)
      const slug = slugify(pending.fullName) || `agency-${userId.slice(0, 8)}`;

      const { error: agencyError } = await supabase.from('agencies').upsert({
        owner_id: userId,
        name: pending.fullName,
        slug,
        phone: pending.phone,
        country: 'Uzbekistan',
      });

      if (agencyError) {
        setError(agencyError.message);
        return;
      }

      // Redirect to agency dashboard
      router.push('/agency');
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
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
  const isAgencyFormValid = agencyFullName.trim() && agencyEmail.trim() && agencyPhone.trim() && agencyPassword.trim();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* ══════════════ LOGIN SCREEN ══════════════ */}
      {step === 'login' && (
        <div className="market-section space-y-6 p-5 md:p-8">
          <div className="text-center space-y-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {t.auth.welcome}
            </h1>
            <p className="text-sm text-muted-foreground">{t.auth.loginHint}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loginId">{t.auth.emailOrPhone}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="loginId"
                  placeholder={t.auth.emailOrPhonePlaceholder}
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loginPwd">{t.auth.password}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="loginPwd"
                  type={showLoginPassword ? 'text' : 'password'}
                  placeholder={t.auth.passwordPlaceholder}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="pl-10 pr-10 h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button
              onClick={handleLogin}
              disabled={!loginIdentifier.trim() || !loginPassword.trim() || loading}
              className="w-full h-12 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  {t.auth.loggingIn}
                </>
              ) : (
                t.auth.login
              )}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-muted-foreground">{t.auth.noAccount}</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => { setError(''); setStep('register'); }}
              className="w-full h-12 text-base"
            >
              {t.auth.register}
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════ REGISTER SCREEN WITH TABS ══════════════ */}
      {step === 'register' && (
        <div className="market-section space-y-6 p-5 md:p-8">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold text-foreground">
              {t.auth.register}
            </h1>
            <p className="text-sm text-muted-foreground">{t.auth.registerHint}</p>
          </div>

          {/* Tab Switcher */}
          <div className="flex rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => { setRegisterTab('user'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                registerTab === 'user'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="h-4 w-4" />
              {t.auth.tabUser}
            </button>
            <button
              type="button"
              onClick={() => { setRegisterTab('agency'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                registerTab === 'agency'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Building2 className="h-4 w-4" />
              {t.auth.tabAgency}
            </button>
          </div>

          {/* ── User Registration Tab ── */}
          {registerTab === 'user' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userName">{t.auth.fullName} *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="userName"
                    placeholder={t.auth.fullNamePlaceholder}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userPhone">{t.auth.phone} *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="userPhone"
                    type="tel"
                    placeholder={t.auth.phonePlaceholder}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userPassword">{t.auth.password} *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="userPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t.auth.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">{t.auth.passwordHint}</p>
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <Button
                onClick={handleUserRegister}
                disabled={!isUserFormValid || loading}
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
          )}

          {/* ── Agency Registration Tab ── */}
          {registerTab === 'agency' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agName">{t.auth.fullName} *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="agName"
                    placeholder={t.auth.fullNamePlaceholder}
                    value={agencyFullName}
                    onChange={(e) => setAgencyFullName(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agEmail">{t.auth.email} *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="agEmail"
                    type="email"
                    placeholder={t.auth.emailPlaceholder}
                    value={agencyEmail}
                    onChange={(e) => setAgencyEmail(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agPhone">{t.auth.phone} *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="agPhone"
                    type="tel"
                    placeholder={t.auth.phonePlaceholder}
                    value={agencyPhone}
                    onChange={(e) => setAgencyPhone(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agPassword">{t.auth.password} *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="agPassword"
                    type={showAgencyPassword ? 'text' : 'password'}
                    placeholder={t.auth.passwordPlaceholder}
                    value={agencyPassword}
                    onChange={(e) => setAgencyPassword(e.target.value)}
                    className="pl-10 pr-10 h-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAgencyPassword(!showAgencyPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showAgencyPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">{t.auth.passwordHint}</p>
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <Button
                onClick={handleAgencyRegister}
                disabled={!isAgencyFormValid || loading}
                className="w-full h-12 text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {t.auth.sendingOtp}
                  </>
                ) : (
                  t.auth.sendOtp
                )}
              </Button>
            </div>
          )}

          {/* Back to login */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {t.auth.alreadyHaveAccount}{' '}
              <button
                onClick={() => { setError(''); setStep('login'); }}
                className="text-primary hover:underline font-medium"
              >
                {t.auth.login}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* ══════════════ OTP VERIFICATION (Agency) ══════════════ */}
      {step === 'otp-verify' && (
        <div className="market-section space-y-6 p-5 md:p-8">
          <div className="text-center space-y-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              {t.auth.otpCode}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t.auth.otpSentTo}
            </p>
            <p className="text-sm font-medium text-foreground">
              {pendingAgencyRef.current?.email}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otpCode">{t.auth.otpCode}</Label>
              <Input
                id="otpCode"
                type="text"
                inputMode="numeric"
                placeholder={t.auth.otpCodePlaceholder}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => e.key === 'Enter' && otpCode.length === 6 && handleVerifyOtp()}
                className="h-14 text-center text-2xl tracking-[0.5em] font-mono"
                maxLength={6}
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button
              onClick={handleVerifyOtp}
              disabled={otpCode.length !== 6 || loading}
              className="w-full h-12 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  {t.auth.verifyingOtp}
                </>
              ) : (
                t.auth.verifyOtp
              )}
            </Button>

            <div className="flex items-center justify-center gap-2">
              {cooldown > 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t.auth.resendIn} {cooldown}s
                </p>
              ) : (
                <button
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-sm text-primary hover:underline"
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
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              {t.auth.changeEmail}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
