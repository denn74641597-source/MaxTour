import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

function getClientEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return { url, anonKey };
}

export function createSupabaseBrowserClient(): SupabaseClient {
  const { url, anonKey } = getClientEnv();

  return createBrowserClient(url, anonKey, {
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 400,
      path: '/',
      sameSite: 'lax',
      secure: true,
    },
  });
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;
  browserClient = createSupabaseBrowserClient();
  return browserClient;
}

export function resolveSupabaseClient(
  client?: SupabaseClient | null
): SupabaseClient {
  if (client) return client;
  return getSupabaseBrowserClient();
}
