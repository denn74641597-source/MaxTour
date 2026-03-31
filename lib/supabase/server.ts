import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Check your environment variables.'
    );
  }

  return createServerClient(url, key, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                maxAge: 60 * 60 * 24 * 400,
                path: '/',
              })
            );
          } catch {
            // Server Component — ignore set errors
          }
        },
      },
    }
  );
}

/** Admin client with service role — use only in server actions / API routes */
export async function createAdminClient() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Cookie-free read-only client for public data queries.
 * Does NOT call cookies(), so results can be safely cached across requests.
 * Uses the anon key — RLS still applies, only public/published data is readable.
 */
let _publicClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createPublicSupabaseClient() {
  if (_publicClient) return _publicClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  _publicClient = createSupabaseClient(url, key);
  return _publicClient;
}
