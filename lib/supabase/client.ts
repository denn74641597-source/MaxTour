import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // During build/prerender, env vars may not be available.
    // Return a dummy client that won't crash the build.
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    );
  }

  return createBrowserClient(url, key, {
    cookieOptions: {
      // Persist cookies for ~13 months so sessions survive
      // Telegram Mini App WebView restarts
      maxAge: 60 * 60 * 24 * 400,
      path: '/',
      sameSite: 'lax' as const,
      secure: true,
    },
  });
}
