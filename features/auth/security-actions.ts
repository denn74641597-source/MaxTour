'use server';

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';

/**
 * Update the agency manager's email address.
 * Uses admin client to update Supabase auth email + profile email.
 */
export async function updateEmailAction(newEmail: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const trimmed = newEmail.trim().toLowerCase();
  if (!trimmed || !trimmed.includes('@')) {
    return { error: 'Invalid email' };
  }

  const admin = await createAdminClient();

  // Update auth email
  const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
    email: trimmed,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message?.includes('already been registered')) {
      return { error: 'email_taken' };
    }
    return { error: authError.message };
  }

  // Update profile email
  await admin
    .from('profiles')
    .update({ email: trimmed, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  return { success: true };
}

/**
 * Update the agency manager's login phone number.
 * Updates both auth user metadata and profile phone.
 */
export async function updatePhoneAction(newPhone: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  let cleaned = newPhone.trim().replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('998') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  if (cleaned.length < 9) return { error: 'Invalid phone' };

  const admin = await createAdminClient();

  // Check if phone is already used by another profile
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('phone', cleaned)
    .neq('id', user.id)
    .limit(1)
    .single();

  if (existing) {
    return { error: 'phone_taken' };
  }

  // Update profile phone
  const { error: profileError } = await admin
    .from('profiles')
    .update({ phone: cleaned, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (profileError) return { error: profileError.message };

  // Also update agency phone if this user owns one
  await admin
    .from('agencies')
    .update({ phone: cleaned, updated_at: new Date().toISOString() })
    .eq('owner_id', user.id);

  return { success: true };
}

/**
 * Change password. Requires current password verification.
 */
export async function updatePasswordAction(currentPassword: string, newPassword: string) {
  if (!newPassword || newPassword.length < 6) {
    return { error: 'password_too_short' };
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Verify current password by attempting sign-in
  const admin = await createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single();

  const authEmail = user.email || profile?.email;
  if (!authEmail) return { error: 'No email found' };

  // Verify old password via a temporary sign-in
  const { createClient } = await import('@supabase/supabase-js');
  const tempClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error: signInError } = await tempClient.auth.signInWithPassword({
    email: authEmail,
    password: currentPassword,
  });

  if (signInError) {
    return { error: 'wrong_password' };
  }

  // Update password via admin
  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });

  if (updateError) return { error: updateError.message };

  return { success: true };
}

/**
 * Get current auth info (email & phone) for the security section.
 */
export async function getSecurityInfoAction() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, phone')
    .eq('id', user.id)
    .single();

  return {
    authEmail: user.email || null,
    profileEmail: profile?.email || null,
    phone: profile?.phone || null,
  };
}
