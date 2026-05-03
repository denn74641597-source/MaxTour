import { createServerSupabaseClient } from '@/lib/supabase/server';

type AdminAccessResult =
  | { authorized: true; userId: string }
  | { authorized: false; reason: 'UNAUTHENTICATED' | 'FORBIDDEN' };

export async function getAdminAccess(): Promise<AdminAccessResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, reason: 'UNAUTHENTICATED' };
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (error || profile?.role !== 'admin') {
    return { authorized: false, reason: 'FORBIDDEN' };
  }

  return { authorized: true, userId: user.id };
}

export async function assertAdminAccess(): Promise<{ userId: string }> {
  const access = await getAdminAccess();
  if (!access.authorized) {
    throw new Error('ADMIN_ACCESS_REQUIRED');
  }
  return { userId: access.userId };
}
