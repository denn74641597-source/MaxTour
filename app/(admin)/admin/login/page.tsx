'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, Eye, EyeOff, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { hapticFeedback } from '@/lib/telegram';

const ADMIN_EMAIL = 'admin@maxtour.local';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  const handleLogin = async () => {
    const trimmed = password.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: trimmed,
      });

      if (signInError) {
        setError('Parol noto\'g\'ri');
        return;
      }

      router.push('/admin');
    } catch {
      setError('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mx-auto">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
          <p className="text-sm text-slate-500">Faqat admin uchun</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adminPassword">Parol</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="adminPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Admin parolini kiriting"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="pl-10 pr-10 h-12"
              />
              <button
                type="button"
                onClick={() => { hapticFeedback('light'); setShowPassword(!showPassword); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button
            onClick={handleLogin}
            disabled={!password.trim() || loading}
            className="w-full h-12 text-base bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Kirish...
              </>
            ) : (
              'Kirish'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
