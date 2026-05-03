'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  PlaneTakeoff,
  ShieldAlert,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AuthMode = 'login' | 'register' | 'otp';
type AccessState = 'none' | 'non_agency' | 'admin';
type UserRole = 'user' | 'agency_manager' | 'admin';

interface PendingAgencyPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

const OTP_COOLDOWN_SECONDS = 60;
const UZ_PHONE_REGEX = /^\+?998\d{9}$/;

const COPY: Record<
  Language,
  {
    badge: string;
    headline: string;
    subtitle: string;
    benefits: Array<{ title: string; description: string }>;
    loginTab: string;
    registerTab: string;
    loginCardTitle: string;
    registerCardTitle: string;
    otpCardTitle: string;
    otpSentHint: string;
    phoneSupportHint: string;
    checkingSession: string;
    requiredFields: string;
    invalidEmail: string;
    invalidPhone: string;
    termsRequired: string;
    resendSuccess: string;
    registerSuccess: string;
    genericError: string;
    accessDeniedTitle: string;
    accessDeniedHint: string;
    switchAccount: string;
    registerAgency: string;
    goUserProfile: string;
    adminTitle: string;
    adminHint: string;
    openAdmin: string;
    legalPrefix: string;
    legalTerms: string;
    legalAnd: string;
    legalPrivacy: string;
    legalSuffix: string;
  }
> = {
  uz: {
    badge: 'MaxTour Agency',
    headline: 'Agentliklar uchun boshqaruv paneli',
    subtitle:
      'Turlarni joylang, so‘rovlarni boshqaring, reklama va statistikani kuzating.',
    benefits: [
      {
        title: "Turlarni joylash",
        description: 'Xalqaro va ichki turlarni bir joydan boshqaring.',
      },
      {
        title: "So'rovlarni boshqarish",
        description: 'Mijoz leadlari va qiziqish bildirganlarni tez ishlang.',
      },
      {
        title: 'Reklama va statistika',
        description: 'MaxCoin reklamalari va natijalarini real vaqtda kuzating.',
      },
      {
        title: 'Tasdiqlash jarayoni',
        description: 'Agentlik verifikatsiyasi va profil holatini nazorat qiling.',
      },
    ],
    loginTab: 'Kirish',
    registerTab: "Ro'yxatdan o'tish",
    loginCardTitle: 'Agentlik hisobiga kirish',
    registerCardTitle: "Agentlik hisobini ro'yxatdan o'tkazish",
    otpCardTitle: 'Email tasdiqlash',
    otpSentHint: 'Tasdiqlash kodi yuborildi',
    phoneSupportHint:
      'Telefon bilan kirish mavjud: mavjud backend mantiqida telefon emailga map qilinadi.',
    checkingSession: 'Sessiya tekshirilmoqda...',
    requiredFields: 'Majburiy maydonlarni to‘ldiring.',
    invalidEmail: 'Email formatini to‘g‘ri kiriting.',
    invalidPhone: "Telefon formati: +998XXXXXXXXX bo'lishi kerak.",
    termsRequired: 'Davom etish uchun shartlar va maxfiylik siyosatiga rozilik bering.',
    resendSuccess: 'Tasdiqlash kodi qayta yuborildi.',
    registerSuccess: "Agentlik hisobingiz yaratildi. Panelga yo'naltirilmoqda...",
    genericError: 'Xatolik yuz berdi. Qayta urinib ko‘ring.',
    accessDeniedTitle: 'Bu hisobda agentlik paneliga kirish ruxsati yo‘q',
    accessDeniedHint:
      "Kiritilgan akkaunt agency_manager emas. Agentlik paneli uchun agentlik akkaunti bilan kiring yoki yangi agentlik akkaunti yarating.",
    switchAccount: 'Boshqa akkaunt bilan kirish',
    registerAgency: "Agentlik akkaunti ro'yxatdan o'tkazish",
    goUserProfile: 'Foydalanuvchi profiliga o‘tish',
    adminTitle: 'Bu akkaunt administrator roliga ega',
    adminHint:
      'Admin boshqaruvi remote.mxtr.uz domenida ishlaydi. Agentlik paneli faqat agentlik akkauntlari uchun.',
    openAdmin: "Admin panelini ochish",
    legalPrefix: 'Men ',
    legalTerms: 'Foydalanish shartlari',
    legalAnd: ' va ',
    legalPrivacy: 'Maxfiylik siyosati',
    legalSuffix: ' ga roziman.',
  },
  ru: {
    badge: 'MaxTour Agency',
    headline: 'Панель управления для агентств',
    subtitle:
      'Публикуйте туры, управляйте заявками, рекламой и статистикой в одном месте.',
    benefits: [
      {
        title: 'Публикация туров',
        description: 'Управляйте международными и внутренними турами из одной панели.',
      },
      {
        title: 'Управление заявками',
        description: 'Быстро обрабатывайте лиды и заинтересованных пользователей.',
      },
      {
        title: 'Реклама и статистика',
        description: 'Отслеживайте MaxCoin-рекламу и результаты в реальном времени.',
      },
      {
        title: 'Верификация агентства',
        description: 'Контролируйте статус проверки и полноту профиля агентства.',
      },
    ],
    loginTab: 'Вход',
    registerTab: 'Регистрация',
    loginCardTitle: 'Вход в аккаунт агентства',
    registerCardTitle: 'Регистрация аккаунта агентства',
    otpCardTitle: 'Подтверждение email',
    otpSentHint: 'Код подтверждения отправлен',
    phoneSupportHint:
      'Вход по телефону поддерживается через текущую backend-логику привязки телефона к email.',
    checkingSession: 'Проверяем сессию...',
    requiredFields: 'Заполните обязательные поля.',
    invalidEmail: 'Введите корректный email.',
    invalidPhone: 'Формат телефона: +998XXXXXXXXX.',
    termsRequired: 'Для продолжения примите условия и политику конфиденциальности.',
    resendSuccess: 'Код подтверждения отправлен повторно.',
    registerSuccess: 'Аккаунт агентства создан. Перенаправляем в панель...',
    genericError: 'Произошла ошибка. Попробуйте ещё раз.',
    accessDeniedTitle: 'У этого аккаунта нет доступа к панели агентства',
    accessDeniedHint:
      'Указанный аккаунт не имеет роли agency_manager. Войдите под аккаунтом агентства или зарегистрируйте новый.',
    switchAccount: 'Войти под другим аккаунтом',
    registerAgency: 'Зарегистрировать аккаунт агентства',
    goUserProfile: 'Перейти в профиль пользователя',
    adminTitle: 'Этот аккаунт имеет роль администратора',
    adminHint:
      'Админ-панель доступна на домене remote.mxtr.uz. Панель агентства доступна только аккаунтам агентств.',
    openAdmin: 'Открыть админ-панель',
    legalPrefix: 'Я принимаю ',
    legalTerms: 'Условия использования',
    legalAnd: ' и ',
    legalPrivacy: 'Политику конфиденциальности',
    legalSuffix: '.',
  },
};

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('998') && !cleaned.startsWith('+')) {
    cleaned = `+${cleaned}`;
  }
  return cleaned;
}

function isValidUzPhone(phone: string): boolean {
  return UZ_PHONE_REGEX.test(normalizePhone(phone));
}

function phoneToAuthEmail(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, '');
  return `${cleaned}@user.maxtour.uz`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeAgencyNextPath(pathname: string | null | undefined): string {
  if (!pathname || !pathname.startsWith('/agency') || pathname.startsWith('/agency/login')) {
    return '/agency';
  }
  return pathname;
}

function getUserProfileDestination(): string {
  if (process.env.NODE_ENV === 'production') {
    return 'https://mxtr.uz/profile';
  }
  return '/profile';
}

function getAdminDestination(): string {
  if (process.env.NODE_ENV === 'production') {
    return 'https://remote.mxtr.uz/admin';
  }
  return '/admin';
}

export function AgencyAuthScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { t, language } = useTranslation();

  const copy = COPY[language];
  const nextPath = useMemo(
    () => normalizeAgencyNextPath(searchParams.get('next')),
    [searchParams]
  );

  const [mode, setMode] = useState<AuthMode>('login');
  const [accessState, setAccessState] = useState<AccessState>('none');
  const [checkingSession, setCheckingSession] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);

  const [otpCode, setOtpCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [pendingAgency, setPendingAgency] = useState<PendingAgencyPayload | null>(null);

  const resetMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  const resolveCurrentRole = useCallback(async (): Promise<UserRole | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) return null;
    return (profile?.role as UserRole | null) ?? null;
  }, [supabase]);

  const handleRolePostAuth = useCallback(async () => {
    const role = await resolveCurrentRole();

    if (role === 'agency_manager') {
      router.replace(nextPath);
      return;
    }

    if (role === 'admin') {
      setAccessState('admin');
      return;
    }

    setAccessState('non_agency');
  }, [nextPath, resolveCurrentRole, router]);

  useEffect(() => {
    let active = true;

    const bootstrapSession = async () => {
      setCheckingSession(true);
      try {
        const role = await resolveCurrentRole();
        if (!active) return;

        if (role === 'agency_manager') {
          router.replace(nextPath);
          return;
        }

        if (role === 'admin') {
          setAccessState('admin');
        } else if (role) {
          setAccessState('non_agency');
        }
      } catch {
        // no-op
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    };

    bootstrapSession();

    return () => {
      active = false;
    };
  }, [nextPath, resolveCurrentRole, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const sendOtp = useCallback(
    async (targetEmail: string) => {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: targetEmail,
        options: { shouldCreateUser: true },
      });

      if (otpError) {
        throw otpError;
      }

      setCooldown(OTP_COOLDOWN_SECONDS);
    },
    [supabase.auth]
  );

  const handleLogin = useCallback(async () => {
    const identifier = loginIdentifier.trim();
    const password = loginPassword.trim();

    if (!identifier || !password) {
      setError(copy.requiredFields);
      return;
    }

    resetMessages();
    setLoading(true);

    try {
      const isEmailIdentifier = identifier.includes('@');
      const normalizedIdentifier = isEmailIdentifier
        ? identifier.toLowerCase()
        : normalizePhone(identifier);

      const authEmail = isEmailIdentifier
        ? normalizedIdentifier
        : phoneToAuthEmail(normalizedIdentifier);

      let { error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password,
      });

      if (signInError && !isEmailIdentifier) {
        try {
          const phoneDigits = normalizedIdentifier.replace(/^\+/, '');
          const legacyEmail = `${phoneDigits}@maxtour.local`;

          if (legacyEmail !== authEmail) {
            const legacyTry = await supabase.auth.signInWithPassword({
              email: legacyEmail,
              password,
            });
            if (!legacyTry.error) {
              signInError = null;
            }
          }

          if (signInError) {
            const phoneLookup = await fetch('/api/auth-phone', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone: normalizedIdentifier }),
            });
            const phoneLookupData = await phoneLookup.json();

            if (phoneLookupData?.email) {
              const retry = await supabase.auth.signInWithPassword({
                email: phoneLookupData.email as string,
                password,
              });
              signInError = retry.error ?? null;
            }

            if (signInError && Array.isArray(phoneLookupData?.legacyEmails)) {
              for (const legacy of phoneLookupData.legacyEmails as string[]) {
                if (legacy === phoneLookupData.email) continue;
                const retry = await supabase.auth.signInWithPassword({
                  email: legacy,
                  password,
                });
                if (!retry.error) {
                  signInError = null;
                  break;
                }
              }
            }
          }
        } catch {
          // fallback lookup failed, keep original error
        }
      }

      if (signInError && isEmailIdentifier) {
        try {
          const { data: profileByEmail } = await supabase
            .from('profiles')
            .select('phone')
            .eq('email', normalizedIdentifier)
            .limit(1)
            .single();

          if (profileByEmail?.phone) {
            const mappedPhoneEmail = phoneToAuthEmail(profileByEmail.phone);
            if (mappedPhoneEmail !== authEmail) {
              const retry = await supabase.auth.signInWithPassword({
                email: mappedPhoneEmail,
                password,
              });
              signInError = retry.error ?? null;
            }
          }
        } catch {
          // fallback lookup failed, keep original error
        }
      }

      if (signInError) {
        const lowMessage = signInError.message?.toLowerCase() ?? '';
        if (
          lowMessage.includes('invalid login credentials') ||
          lowMessage.includes('invalid password')
        ) {
          setError(t.auth.wrongPassword);
        } else if (lowMessage.includes('not found') || lowMessage.includes('no user')) {
          setError(copy.accessDeniedHint);
        } else {
          setError(signInError.message || copy.genericError);
        }
        return;
      }

      await handleRolePostAuth();
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : copy.genericError);
    } finally {
      setLoading(false);
    }
  }, [
    copy.accessDeniedHint,
    copy.genericError,
    copy.requiredFields,
    handleRolePostAuth,
    loginIdentifier,
    loginPassword,
    resetMessages,
    supabase,
    t.auth.wrongPassword,
  ]);

  const handleAgencyRegister = useCallback(async () => {
    const fullName = registerName.trim();
    const email = registerEmail.trim().toLowerCase();
    const phone = normalizePhone(registerPhone.trim());
    const password = registerPassword.trim();

    if (!fullName || !email || !phone || !password) {
      setError(copy.requiredFields);
      return;
    }

    if (!isValidEmail(email)) {
      setError(copy.invalidEmail);
      return;
    }

    if (!isValidUzPhone(phone)) {
      setError(copy.invalidPhone);
      return;
    }

    if (password.length < 6) {
      setError(t.auth.passwordTooShort);
      return;
    }

    if (!legalAccepted) {
      setError(copy.termsRequired);
      return;
    }

    resetMessages();
    setLoading(true);

    try {
      await sendOtp(email);
      setPendingAgency({ fullName, email, phone, password });
      setMode('otp');
      setSuccess(copy.otpSentHint);
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : copy.genericError);
    } finally {
      setLoading(false);
    }
  }, [
    copy.genericError,
    copy.invalidEmail,
    copy.invalidPhone,
    copy.otpSentHint,
    copy.requiredFields,
    copy.termsRequired,
    legalAccepted,
    registerEmail,
    registerName,
    registerPassword,
    registerPhone,
    resetMessages,
    sendOtp,
    t.auth.passwordTooShort,
  ]);

  const handleVerifyOtp = useCallback(async () => {
    const otp = otpCode.trim();

    if (!pendingAgency) {
      setError(copy.genericError);
      return;
    }

    if (otp.length !== 6) {
      setError(t.auth.otpInvalid);
      return;
    }

    resetMessages();
    setLoading(true);

    try {
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email: pendingAgency.email,
        token: otp,
        type: 'email',
      });

      if (verifyError) {
        const lowMessage = verifyError.message?.toLowerCase() ?? '';
        if (lowMessage.includes('expired')) {
          setError(t.auth.otpExpired);
        } else {
          setError(t.auth.otpInvalid);
        }
        return;
      }

      const userId = verifyData.user?.id;
      if (!userId) {
        setError(copy.genericError);
        return;
      }

      if (verifyData.session?.access_token && verifyData.session?.refresh_token) {
        await supabase.auth.setSession({
          access_token: verifyData.session.access_token,
          refresh_token: verifyData.session.refresh_token,
        });
      }

      let { error: passwordError } = await supabase.auth.updateUser({
        password: pendingAgency.password,
      });

      if (passwordError && /session/i.test(passwordError.message ?? '')) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const retry = await supabase.auth.updateUser({ password: pendingAgency.password });
        passwordError = retry.error;
      }

      if (passwordError) {
        const lowMessage = (passwordError.message ?? '').toLowerCase();
        if (
          !lowMessage.includes('should be different') &&
          !lowMessage.includes('same password')
        ) {
          setError(passwordError.message || copy.genericError);
          return;
        }
      }

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        role: 'agency_manager',
        full_name: pendingAgency.fullName,
        phone: pendingAgency.phone,
        email: pendingAgency.email,
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        setError(profileError.message || copy.genericError);
        return;
      }

      const slug = slugify(pendingAgency.fullName) || `agency-${userId.slice(0, 8)}`;

      const { error: agencyError } = await supabase.from('agencies').upsert({
        owner_id: userId,
        name: pendingAgency.fullName,
        slug,
        phone: pendingAgency.phone,
        country: 'Uzbekistan',
      });

      if (agencyError) {
        setError(agencyError.message || copy.genericError);
        return;
      }

      setSuccess(copy.registerSuccess);
      router.replace(nextPath);
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : copy.genericError);
    } finally {
      setLoading(false);
    }
  }, [
    copy.genericError,
    copy.registerSuccess,
    nextPath,
    otpCode,
    pendingAgency,
    resetMessages,
    router,
    supabase,
    t.auth.otpExpired,
    t.auth.otpInvalid,
  ]);

  const handleResendOtp = useCallback(async () => {
    if (!pendingAgency || cooldown > 0) return;
    resetMessages();
    setLoading(true);

    try {
      await sendOtp(pendingAgency.email);
      setSuccess(copy.resendSuccess);
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : copy.genericError);
    } finally {
      setLoading(false);
    }
  }, [
    cooldown,
    copy.genericError,
    copy.resendSuccess,
    pendingAgency,
    resetMessages,
    sendOtp,
  ]);

  const handleSwitchAccount = useCallback(async () => {
    setLoading(true);
    resetMessages();
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      await supabase.auth.signOut().catch(() => undefined);
    } finally {
      setAccessState('none');
      setMode('login');
      setLoading(false);
    }
  }, [resetMessages, supabase.auth]);

  const handleOpenAdmin = useCallback(() => {
    window.location.assign(getAdminDestination());
  }, []);

  const handleGoUserProfile = useCallback(() => {
    window.location.assign(getUserProfileDestination());
  }, []);

  const loginFormReady = loginIdentifier.trim() && loginPassword.trim();
  const registerFormReady =
    registerName.trim() &&
    registerEmail.trim() &&
    registerPhone.trim() &&
    registerPassword.trim() &&
    legalAccepted;

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#f6fbff_0%,#f5f7fb_42%,#eef3f8_100%)] px-4">
        <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          {copy.checkingSession}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,rgba(14,116,144,0.18),transparent_34%),radial-gradient(circle_at_100%_90%,rgba(15,118,110,0.12),transparent_30%),linear-gradient(160deg,#f6fbff_0%,#f5f7fb_42%,#eef3f8_100%)] px-4 py-5 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex justify-end">
          <LanguageSwitcher variant="toggle" />
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-[1.15fr_0.9fr] lg:gap-6">
          <Card className="overflow-hidden border-none bg-white/85 shadow-[0_32px_52px_-38px_rgba(15,23,42,0.65)] backdrop-blur-sm">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {copy.badge}
              </span>

              <div className="space-y-3">
                <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                  {copy.headline}
                </h1>
                <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
                  {copy.subtitle}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {copy.benefits.map((benefit, index) => (
                  <BenefitCard
                    key={benefit.title}
                    icon={
                      index === 0 ? (
                        <PlaneTakeoff className="h-4 w-4 text-cyan-700" />
                      ) : index === 1 ? (
                        <MessageSquare className="h-4 w-4 text-emerald-700" />
                      ) : index === 2 ? (
                        <BarChart3 className="h-4 w-4 text-indigo-700" />
                      ) : (
                        <BadgeCheck className="h-4 w-4 text-amber-700" />
                      )
                    }
                    title={benefit.title}
                    subtitle={benefit.description}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-white/92 shadow-[0_36px_58px_-40px_rgba(15,23,42,0.78)]">
            <CardContent className="p-5 sm:p-7">
              {accessState === 'non_agency' && (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                      <ShieldAlert className="h-4 w-4" />
                      {copy.accessDeniedTitle}
                    </p>
                    <p className="mt-2 text-sm text-amber-900/85">{copy.accessDeniedHint}</p>
                  </div>

                  <div className="grid gap-2">
                    <Button onClick={handleSwitchAccount} disabled={loading} className="h-11">
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t.common.loading}
                        </>
                      ) : (
                        copy.switchAccount
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        await handleSwitchAccount();
                        setMode('register');
                      }}
                      disabled={loading}
                      className="h-11"
                    >
                      {copy.registerAgency}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleGoUserProfile}
                      className="h-10 text-slate-600"
                    >
                      {copy.goUserProfile}
                    </Button>
                  </div>
                </div>
              )}

              {accessState === 'admin' && (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/85 p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                      <Building2 className="h-4 w-4" />
                      {copy.adminTitle}
                    </p>
                    <p className="mt-2 text-sm text-blue-900/85">{copy.adminHint}</p>
                  </div>
                  <div className="grid gap-2">
                    <Button onClick={handleOpenAdmin} className="h-11">
                      {copy.openAdmin}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSwitchAccount}
                      disabled={loading}
                      className="h-11"
                    >
                      {copy.switchAccount}
                    </Button>
                  </div>
                </div>
              )}

              {accessState === 'none' && (
                <div className="space-y-5">
                  <div className="flex rounded-xl bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        resetMessages();
                      }}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        mode === 'login'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {copy.loginTab}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        resetMessages();
                      }}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        mode === 'register' || mode === 'otp'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {copy.registerTab}
                    </button>
                  </div>

                  {(mode === 'login' || mode === 'register') && (
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-slate-900">
                        {mode === 'login' ? copy.loginCardTitle : copy.registerCardTitle}
                      </h2>
                      <p className="text-xs text-slate-500">{copy.phoneSupportHint}</p>
                    </div>
                  )}

                  {mode === 'login' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="agency-login-id">{t.auth.emailOrPhone}</Label>
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="agency-login-id"
                            value={loginIdentifier}
                            onChange={(event) => setLoginIdentifier(event.target.value)}
                            placeholder={t.auth.emailOrPhonePlaceholder}
                            className="h-11 pl-10"
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                void handleLogin();
                              }
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="agency-login-password">{t.auth.password}</Label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="agency-login-password"
                            type={showLoginPassword ? 'text' : 'password'}
                            value={loginPassword}
                            onChange={(event) => setLoginPassword(event.target.value)}
                            placeholder={t.auth.passwordPlaceholder}
                            className="h-11 pl-10 pr-10"
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                void handleLogin();
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                            aria-label="Toggle password visibility"
                          >
                            {showLoginPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {error && <p className="text-sm text-destructive">{error}</p>}
                      {success && <p className="text-sm text-emerald-700">{success}</p>}

                      <Button
                        onClick={() => void handleLogin()}
                        disabled={!loginFormReady || loading}
                        className="h-11 w-full"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t.auth.loggingIn}
                          </>
                        ) : (
                          t.auth.login
                        )}
                      </Button>
                    </div>
                  )}

                  {mode === 'register' && (
                    <div className="space-y-4">
                      <FieldWithIcon
                        id="agency-register-name"
                        label={`${t.auth.fullName} *`}
                        value={registerName}
                        onChange={setRegisterName}
                        placeholder={t.auth.fullNamePlaceholder}
                        icon={<UserRound className="h-4 w-4 text-slate-400" />}
                      />
                      <FieldWithIcon
                        id="agency-register-email"
                        label={`${t.auth.email} *`}
                        value={registerEmail}
                        onChange={setRegisterEmail}
                        placeholder={t.auth.emailPlaceholder}
                        icon={<Mail className="h-4 w-4 text-slate-400" />}
                      />
                      <FieldWithIcon
                        id="agency-register-phone"
                        label={`${t.auth.phone} *`}
                        value={registerPhone}
                        onChange={setRegisterPhone}
                        placeholder={t.auth.phonePlaceholder}
                        icon={<Phone className="h-4 w-4 text-slate-400" />}
                      />

                      <div className="space-y-2">
                        <Label htmlFor="agency-register-password">{`${t.auth.password} *`}</Label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="agency-register-password"
                            type={showRegisterPassword ? 'text' : 'password'}
                            value={registerPassword}
                            onChange={(event) => setRegisterPassword(event.target.value)}
                            placeholder={t.auth.passwordPlaceholder}
                            className="h-11 pl-10 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegisterPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                            aria-label="Toggle password visibility"
                          >
                            {showRegisterPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <label className="flex items-start gap-2 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={legalAccepted}
                          onChange={(event) => setLegalAccepted(event.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300"
                        />
                        <span>
                          {copy.legalPrefix}
                          <a
                            href="https://maxtour.uz/terms"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary hover:underline"
                          >
                            {copy.legalTerms}
                          </a>
                          {copy.legalAnd}
                          <a
                            href="https://maxtour.uz/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary hover:underline"
                          >
                            {copy.legalPrivacy}
                          </a>
                          {copy.legalSuffix}
                        </span>
                      </label>

                      {error && <p className="text-sm text-destructive">{error}</p>}
                      {success && <p className="text-sm text-emerald-700">{success}</p>}

                      <Button
                        onClick={() => void handleAgencyRegister()}
                        disabled={!registerFormReady || loading}
                        className="h-11 w-full"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t.auth.sendingOtp}
                          </>
                        ) : (
                          t.auth.sendOtp
                        )}
                      </Button>
                    </div>
                  )}

                  {mode === 'otp' && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h2 className="text-xl font-bold text-slate-900">{copy.otpCardTitle}</h2>
                        <p className="text-sm text-slate-500">
                          {copy.otpSentHint}:{' '}
                          <span className="font-semibold text-slate-800">
                            {pendingAgency?.email}
                          </span>
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="agency-otp-code">{t.auth.otpCode}</Label>
                        <Input
                          id="agency-otp-code"
                          type="text"
                          inputMode="numeric"
                          value={otpCode}
                          onChange={(event) =>
                            setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                          }
                          placeholder={t.auth.otpCodePlaceholder}
                          className="h-12 text-center font-mono text-2xl tracking-[0.4em]"
                          maxLength={6}
                        />
                      </div>

                      {error && <p className="text-sm text-destructive">{error}</p>}
                      {success && <p className="text-sm text-emerald-700">{success}</p>}

                      <Button
                        onClick={() => void handleVerifyOtp()}
                        disabled={otpCode.length !== 6 || loading}
                        className="h-11 w-full"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t.auth.verifyingOtp}
                          </>
                        ) : (
                          t.auth.verifyOtp
                        )}
                      </Button>

                      <div className="text-center text-sm">
                        {cooldown > 0 ? (
                          <span className="text-slate-500">
                            {t.auth.resendIn} {cooldown}s
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handleResendOtp()}
                            disabled={loading}
                            className="font-semibold text-primary hover:underline"
                          >
                            {t.auth.resendCode}
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setMode('register');
                          setOtpCode('');
                          resetMessages();
                        }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-800"
                      >
                        <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                        {t.auth.changeEmail}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/75 p-4 shadow-[0_16px_28px_-26px_rgba(15,23,42,0.65)]">
      <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
        {icon}
      </span>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs text-slate-600">{subtitle}</p>
    </div>
  );
}

function FieldWithIcon({
  id,
  label,
  value,
  onChange,
  placeholder,
  icon,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          {icon}
        </span>
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-11 pl-10"
        />
      </div>
    </div>
  );
}

