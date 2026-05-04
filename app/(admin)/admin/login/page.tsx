'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, Eye, EyeOff, Shield, Phone, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminI18n } from '@/features/admin/i18n';

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('998') && !cleaned.startsWith('+')) {
    cleaned = `+${cleaned}`;
  }
  return cleaned;
}

function phoneToAuthEmail(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, '');
  return `${cleaned}@user.maxtour.uz`;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { tp, tInline } = useAdminI18n();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    const trimmedIdentifier = identifier.trim();
    const trimmedPassword = password.trim();
    if (!trimmedIdentifier || !trimmedPassword) return;

    setLoading(true);
    setError('');

    try {
      const isEmail = trimmedIdentifier.includes('@');
      const normalizedPhone = normalizePhone(trimmedIdentifier);
      const authEmail = isEmail
        ? trimmedIdentifier.toLowerCase()
        : phoneToAuthEmail(normalizedPhone);

      let { error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: trimmedPassword,
      });

      if (signInError && isEmail) {
        try {
          const { data: profileByEmail } = await supabase
            .from('profiles')
            .select('phone')
            .eq('email', trimmedIdentifier.toLowerCase())
            .limit(1)
            .maybeSingle();

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
                password: trimmedPassword,
              });
              signInError = retry.error ?? null;
            }
          }
        } catch {
          // Keep original error
        }
      }

      if (signInError && !isEmail) {
        try {
          const res = await fetch('/api/auth-phone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: normalizedPhone }),
          });
          const data = await res.json();

          if (data.email) {
            const retry = await supabase.auth.signInWithPassword({
              email: data.email,
              password: trimmedPassword,
            });
            signInError = retry.error ?? null;
          }

          if (signInError && data.legacyEmails) {
            for (const legacyEmail of data.legacyEmails as string[]) {
              if (legacyEmail === data.email) continue;
              const retry = await supabase.auth.signInWithPassword({
                email: legacyEmail,
                password: trimmedPassword,
              });
              if (!retry.error) {
                signInError = null;
                break;
              }
            }
          }
        } catch {
          // Keep original error
        }
      }

      if (signInError) {
        setError(tInline("Kirish ma'lumotlari noto'g'ri"));
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError(tInline('Foydalanuvchi topilmadi'));
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError || profile?.role !== 'admin') {
        await supabase.auth.signOut({ scope: 'local' }).catch(async () => {
          await supabase.auth.signOut();
        });
        setError(tInline('Admin ruxsati talab qilinadi'));
        return;
      }

      router.replace('/admin');
    } catch {
      setError(tInline('Tizimda xatolik yuz berdi'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600/20">
            <Shield className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">{tp('adminLogin')}</h1>
          <p className="mt-1 text-sm text-slate-400">{tInline('Admin panel')}</p>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-700 bg-slate-800/75 p-5">
          <div className="space-y-2">
            <Label htmlFor="adminIdentifier" className="text-slate-300">
              {tInline('Email yoki telefon')}
            </Label>
            <div className="relative">
              {identifier.includes('@') ? (
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              ) : (
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              )}
              <Input
                id="adminIdentifier"
                type="text"
                placeholder={tInline('admin email yoki +998...')}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="h-12 border-slate-700 bg-slate-900 pl-10 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminPassword" className="text-slate-300">
              {tInline('Parol')}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                id="adminPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder={tInline('Parol')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="h-12 border-slate-700 bg-slate-900 pl-10 pr-10 text-white placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-center text-sm text-red-400">{error}</p>}

          <Button
            onClick={handleLogin}
            disabled={!identifier.trim() || !password.trim() || loading}
            className="h-12 w-full bg-blue-600 text-base text-white hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {tInline('Tekshirilmoqda...')}
              </>
            ) : (
              tInline('Admin panelga kirish')
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
