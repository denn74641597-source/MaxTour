'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, User, ArrowRight, Phone, Lock, Loader2, Eye, EyeOff, Upload, FileText, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { uploadPdfAction } from '@/features/upload/actions';
import { slugify } from '@/lib/utils';
import type { UserRole } from '@/types';

type AuthStep = 'role-select' | 'register-form' | 'agency-login';

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

  // Agency registration fields
  const [agencyName, setAgencyName] = useState('');
  const [inn, setInn] = useState('');
  const [agencyAddress, setAgencyAddress] = useState('');
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [licensePdf, setLicensePdf] = useState<File | null>(null);
  const [certificatePdf, setCertificatePdf] = useState<File | null>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);
  const certificateInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const resetForm = () => {
    setError('');
    setPhone('');
    setFullName('');
    setPassword('');
    setShowPassword(false);
    setAgencyName('');
    setInn('');
    setAgencyAddress('');
    setResponsiblePerson('');
    setLicensePdf(null);
    setCertificatePdf(null);
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    resetForm();
    setStep('register-form');
  };

  const handleAgencyLoginSelect = () => {
    resetForm();
    setStep('agency-login');
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
          options: { data: { phone: trimmedPhone, full_name: trimmedName } },
        });

      let userId: string | undefined;

      if (signUpError) {
        // If user already exists, try sign in
        if (
          signUpError.message?.toLowerCase().includes('already') ||
          signUpError.message?.toLowerCase().includes('registered')
        ) {
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
        // If email confirmation is enabled, user might be returned but not confirmed
        userId = signUpData.user?.id;
        if (!userId) {
          // Sign up returned no user — try sign in (user may already exist)
          const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({ email, password: autoPassword });
          if (signInError) {
            setError(t.auth.phoneAlreadyRegistered);
            return;
          }
          userId = signInData.user?.id;
        }
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
    } catch (err) {
      console.error('User register error:', err);
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // Register agency (all fields)
  const handleAgencyRegister = async () => {
    const trimmedPhone = phone.trim();
    const trimmedPassword = password.trim();
    const trimmedName = agencyName.trim();
    const trimmedInn = inn.trim();
    const trimmedAddress = agencyAddress.trim();
    const trimmedPerson = responsiblePerson.trim();

    if (!trimmedPhone || !trimmedPassword || !trimmedName || !trimmedInn || !trimmedAddress || !trimmedPerson) return;

    if (trimmedPassword.length < 6) {
      setError(t.auth.passwordTooShort);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Upload PDFs if provided
      let licensePdfUrl: string | null = null;
      let certificatePdfUrl: string | null = null;

      if (licensePdf) {
        const formData = new FormData();
        formData.append('file', licensePdf);
        formData.append('folder', 'licenses');
        const result = await uploadPdfAction(formData);
        if (result.error) {
          setError(result.error);
          return;
        }
        licensePdfUrl = result.url ?? null;
      }

      if (certificatePdf) {
        const formData = new FormData();
        formData.append('file', certificatePdf);
        formData.append('folder', 'certificates');
        const result = await uploadPdfAction(formData);
        if (result.error) {
          setError(result.error);
          return;
        }
        certificatePdfUrl = result.url ?? null;
      }

      const email = phoneToEmail(trimmedPhone);

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password: trimmedPassword,
          options: { data: { phone: trimmedPhone } },
        });

      let userId: string | undefined;

      if (signUpError) {
        if (
          signUpError.message?.toLowerCase().includes('already') ||
          signUpError.message?.toLowerCase().includes('registered')
        ) {
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
        if (!userId) {
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
        }
      }

      if (!userId) {
        setError('Xatolik yuz berdi');
        return;
      }

      // Upsert profile as agency_manager
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        role: 'agency_manager' as const,
        full_name: trimmedPerson,
        phone: trimmedPhone,
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        setError(profileError.message);
        return;
      }

      // Generate slug from agency name
      const slug = slugify(trimmedName) || `agency-${userId.slice(0, 8)}`;

      // Create agency record with all fields
      const { error: agencyError } = await supabase.from('agencies').upsert({
        owner_id: userId,
        name: trimmedName,
        slug,
        phone: trimmedPhone,
        address: trimmedAddress,
        inn: trimmedInn,
        responsible_person: trimmedPerson,
        license_pdf_url: licensePdfUrl,
        certificate_pdf_url: certificatePdfUrl,
        country: 'Uzbekistan',
      });

      if (agencyError) {
        setError(agencyError.message);
        return;
      }

      router.push('/agency');
    } catch (err) {
      console.error('Agency register error:', err);
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // Login existing agency (phone + password)
  const handleAgencyLogin = async () => {
    const trimmedPhone = phone.trim();
    const trimmedPassword = password.trim();
    if (!trimmedPhone || !trimmedPassword) return;

    setLoading(true);
    setError('');

    try {
      const email = phoneToEmail(trimmedPhone);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: trimmedPassword,
      });

      if (signInError) {
        setError(t.auth.wrongPassword);
        return;
      }

      router.push('/agency');
    } catch (err) {
      console.error('Agency login error:', err);
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
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
      : phone.trim() && password.trim() && agencyName.trim() && inn.trim() && agencyAddress.trim() && responsiblePerson.trim();

  return (
    <div className="px-4 py-8">
      {/* Step 1: Role Selection */}
      {step === 'role-select' && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              {t.auth.welcome}
            </h1>
            <p className="text-sm text-muted-foreground">{t.auth.registerOrLogin}</p>
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
                  <h3 className="font-semibold text-foreground">
                    {t.auth.registerAsUser}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t.auth.registerAsUserHint}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
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
                  <h3 className="font-semibold text-foreground">
                    {t.auth.registerAsAgency}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t.auth.registerAsAgencyHint}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-xs text-muted-foreground">{t.auth.alreadyHaveAccount}</span>
              </div>
            </div>

            <Card
              className="cursor-pointer border-2 border-transparent hover:border-emerald-300 transition-all"
              onClick={() => handleAgencyLoginSelect()}
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tertiary/15">
                  <Lock className="h-6 w-6 text-tertiary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    {t.auth.loginAsAgency}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t.auth.loginAsAgencyHint}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
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
            <h1 className="text-xl font-bold text-foreground">
              {selectedRole === 'user'
                ? t.auth.registerAsUser
                : t.auth.registerAsAgency}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t.auth.fillInfo}
            </p>
          </div>

          <div className="space-y-4">
            {/* Phone — always shown */}
            <div className="space-y-2">
              <Label htmlFor="phone">{t.auth.phone}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

            {/* Agency: All registration fields */}
            {selectedRole === 'agency_manager' && (
              <>
                {/* Agency Name (Latin) */}
                <div className="space-y-2">
                  <Label htmlFor="agencyName">{t.auth.agencyName} *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="agencyName"
                      placeholder={t.auth.agencyNamePlaceholder}
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                {/* INN */}
                <div className="space-y-2">
                  <Label htmlFor="inn">{t.auth.inn} *</Label>
                  <Input
                    id="inn"
                    placeholder={t.auth.innPlaceholder}
                    value={inn}
                    onChange={(e) => setInn(e.target.value)}
                    className="h-12"
                  />
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="agencyAddress">{t.auth.agencyAddress} *</Label>
                  <Input
                    id="agencyAddress"
                    placeholder={t.auth.agencyAddressPlaceholder}
                    value={agencyAddress}
                    onChange={(e) => setAgencyAddress(e.target.value)}
                    className="h-12"
                  />
                </div>

                {/* Responsible Person F.I.O. */}
                <div className="space-y-2">
                  <Label htmlFor="responsiblePerson">{t.auth.responsiblePerson} *</Label>
                  <Input
                    id="responsiblePerson"
                    placeholder={t.auth.responsiblePersonPlaceholder}
                    value={responsiblePerson}
                    onChange={(e) => setResponsiblePerson(e.target.value)}
                    className="h-12"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">{t.auth.password} *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.auth.passwordHint}</p>
                </div>

                {/* License PDF */}
                <div className="space-y-2">
                  <Label>{t.auth.uploadLicense}</Label>
                  <input
                    ref={licenseInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setLicensePdf(file);
                    }}
                  />
                  {licensePdf ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-container-low border">
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm truncate flex-1">{licensePdf.name}</span>
                      <button type="button" onClick={() => { setLicensePdf(null); if (licenseInputRef.current) licenseInputRef.current.value = ''; }}>
                        <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12"
                      onClick={() => licenseInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {t.auth.uploadLicense}
                    </Button>
                  )}
                </div>

                {/* Certificate PDF */}
                <div className="space-y-2">
                  <Label>{t.auth.uploadCertificate}</Label>
                  <input
                    ref={certificateInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setCertificatePdf(file);
                    }}
                  />
                  {certificatePdf ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-container-low border">
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm truncate flex-1">{certificatePdf.name}</span>
                      <button type="button" onClick={() => { setCertificatePdf(null); if (certificateInputRef.current) certificateInputRef.current.value = ''; }}>
                        <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12"
                      onClick={() => certificateInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {t.auth.uploadCertificate}
                    </Button>
                  )}
                </div>
              </>
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
                resetForm();
              }}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              {t.common.back}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Agency Login */}
      {step === 'agency-login' && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-tertiary/15 mx-auto">
              <Building2 className="h-8 w-8 text-tertiary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              {t.auth.agencyLoginTitle}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t.auth.loginAsAgencyHint}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loginPhone">{t.auth.phone}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="loginPhone"
                  type="tel"
                  placeholder={t.auth.phonePlaceholder}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loginPassword">{t.auth.password}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="loginPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t.auth.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAgencyLogin()}
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
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button
              onClick={handleAgencyLogin}
              disabled={!phone.trim() || !password.trim() || loading}
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

            <button
              onClick={() => {
                setStep('role-select');
                resetForm();
              }}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              {t.common.back}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              {t.auth.noAccount}{' '}
              <button
                onClick={() => {
                  resetForm();
                  handleRoleSelect('agency_manager');
                }}
                className="text-primary hover:underline"
              >
                {t.auth.register}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
