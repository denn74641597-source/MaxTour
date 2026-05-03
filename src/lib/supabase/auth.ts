import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { resolveSupabaseClient } from './client';
import type {
  AuthOperationResult,
  AuthSnapshot,
  RegisterUserInput,
  SignInWithIdentifierInput,
  VerifyAgencyOtpInput,
} from '../../types';
import type { ProfileRow, UserRole } from '../../types';

const ALLOWED_ROLES = new Set<UserRole>(['user', 'agency_manager', 'admin']);
const UZ_PHONE_REGEX = /^\+?998\d{9}$/;

function slugifyText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('998') && !cleaned.startsWith('+')) {
    cleaned = `+${cleaned}`;
  }
  return cleaned;
}

export function isValidUzPhone(phone: string): boolean {
  return UZ_PHONE_REGEX.test(normalizePhone(phone));
}

export function phoneToAuthEmail(phone: string): string {
  const cleaned = normalizePhone(phone).replace(/[^0-9+]/g, '');
  return `${cleaned}@user.maxtour.uz`;
}

export async function getCurrentAuthSnapshot(
  client?: SupabaseClient
): Promise<AuthSnapshot> {
  const supabase = resolveSupabaseClient(client);
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user) {
    return {
      user: null,
      session: null,
      profile: null,
      pendingDeletion: false,
      roleResolved: true,
    };
  }

  const profile = await getProfileByUserId(session.user.id, supabase);
  if (!profile) {
    return {
      user: session.user,
      session,
      profile: null,
      pendingDeletion: false,
      roleResolved: true,
    };
  }

  if (profile.deletion_requested_at) {
    await signOutLocalFirst(supabase);
    return {
      user: null,
      session: null,
      profile: null,
      pendingDeletion: true,
      roleResolved: false,
    };
  }

  if (!isAllowedRole(profile.role)) {
    return {
      user: session.user,
      session,
      profile: null,
      pendingDeletion: false,
      roleResolved: false,
    };
  }

  return {
    user: session.user,
    session,
    profile,
    pendingDeletion: false,
    roleResolved: true,
  };
}

export async function getProfileByUserId(
  userId: string,
  client?: SupabaseClient
): Promise<ProfileRow | null> {
  const supabase = resolveSupabaseClient(client);

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, role, full_name, phone, email, telegram_username, avatar_url, push_token, deletion_requested_at, created_at, updated_at'
    )
    .eq('id', userId)
    .maybeSingle();

  if (error) return null;
  return (data ?? null) as ProfileRow | null;
}

export async function signOutLocalFirst(
  client?: SupabaseClient
): Promise<void> {
  const supabase = resolveSupabaseClient(client);

  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    await supabase.auth.signOut().catch(() => undefined);
  }
}

export async function signInWithIdentifierPassword(
  input: SignInWithIdentifierInput,
  client?: SupabaseClient
): Promise<AuthOperationResult<Session>> {
  const supabase = resolveSupabaseClient(client);
  const identifier = input.identifier.trim();
  const password = input.password.trim();
  if (!identifier || !password) {
    return { success: false, error: 'Identifier and password are required' };
  }

  const isEmail = identifier.includes('@');
  const normalizedPhone = normalizePhone(identifier);
  const baseEmail = isEmail
    ? identifier.toLowerCase()
    : phoneToAuthEmail(normalizedPhone);

  const signIn = await supabase.auth.signInWithPassword({
    email: baseEmail,
    password,
  });

  if (!signIn.error) {
    return { success: true, data: signIn.data.session };
  }

  if (!isEmail) {
    const phoneDigits = normalizedPhone.replace(/^\+/, '');
    const legacyEmail = `${phoneDigits}@maxtour.local`;
    if (legacyEmail !== baseEmail) {
      const legacy = await supabase.auth.signInWithPassword({
        email: legacyEmail,
        password,
      });
      if (!legacy.error) return { success: true, data: legacy.data.session };
    }

    const { data: profileByPhone } = await supabase
      .from('profiles')
      .select('email')
      .eq('phone', normalizedPhone)
      .limit(1)
      .maybeSingle();

    if (profileByPhone?.email) {
      const retry = await supabase.auth.signInWithPassword({
        email: profileByPhone.email,
        password,
      });
      if (!retry.error) return { success: true, data: retry.data.session };
    }
  } else {
    const { data: profileByEmail } = await supabase
      .from('profiles')
      .select('phone')
      .eq('email', identifier.toLowerCase())
      .limit(1)
      .maybeSingle();

    if (profileByEmail?.phone) {
      const retry = await supabase.auth.signInWithPassword({
        email: phoneToAuthEmail(profileByEmail.phone),
        password,
      });
      if (!retry.error) return { success: true, data: retry.data.session };
    }
  }

  return {
    success: false,
    error: signIn.error?.message || 'Invalid login credentials',
  };
}

export async function registerUserWithPhonePassword(
  input: RegisterUserInput,
  client?: SupabaseClient
): Promise<AuthOperationResult<{ userId: string }>> {
  const supabase = resolveSupabaseClient(client);

  const fullName = input.fullName.trim();
  const normalizedPhone = normalizePhone(input.phone.trim());
  const password = input.password.trim();

  if (!fullName || !normalizedPhone || !password) {
    return { success: false, error: 'All fields are required' };
  }

  if (!isValidUzPhone(normalizedPhone)) {
    return {
      success: false,
      error: 'Phone must be in +998XXXXXXXXX format',
    };
  }

  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' };
  }

  const authEmail = phoneToAuthEmail(normalizedPhone);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: authEmail,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: normalizedPhone,
        role: 'user',
      },
    },
  });

  if (signUpError) return { success: false, error: signUpError.message };

  const userId = signUpData.user?.id;
  if (!userId) return { success: false, error: 'Missing user ID after sign up' };

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: authEmail,
    password,
  });
  if (signInError) return { success: false, error: signInError.message };

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    role: 'user',
    full_name: fullName,
    phone: normalizedPhone,
    updated_at: new Date().toISOString(),
  });

  if (profileError) return { success: false, error: profileError.message };
  return { success: true, data: { userId } };
}

export async function sendAgencyRegistrationOtp(
  email: string,
  client?: SupabaseClient
): Promise<AuthOperationResult> {
  const supabase = resolveSupabaseClient(client);
  const cleanEmail = email.trim().toLowerCase();

  const { error } = await supabase.auth.signInWithOtp({
    email: cleanEmail,
    options: { shouldCreateUser: true },
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function verifyAgencyOtpAndProvisionProfile(
  input: VerifyAgencyOtpInput,
  client?: SupabaseClient
): Promise<AuthOperationResult<{ userId: string; agencySlug: string }>> {
  const supabase = resolveSupabaseClient(client);

  const verify = await supabase.auth.verifyOtp({
    email: input.email.trim().toLowerCase(),
    token: input.otpCode.trim(),
    type: 'email',
  });

  if (verify.error) return { success: false, error: verify.error.message };
  const userId = verify.data.user?.id;
  if (!userId) return { success: false, error: 'Missing user after OTP verify' };

  if (verify.data.session?.access_token && verify.data.session.refresh_token) {
    await supabase.auth.setSession({
      access_token: verify.data.session.access_token,
      refresh_token: verify.data.session.refresh_token,
    });
  }

  let { error: updatePasswordError } = await supabase.auth.updateUser({
    password: input.password.trim(),
  });

  if (updatePasswordError && /session/i.test(updatePasswordError.message)) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const retry = await supabase.auth.updateUser({
      password: input.password.trim(),
    });
    updatePasswordError = retry.error;
  }

  if (updatePasswordError) {
    const isSamePassword =
      /should be different|same password/i.test(updatePasswordError.message);
    if (!isSamePassword) {
      return { success: false, error: updatePasswordError.message };
    }
  }

  const normalizedPhone = normalizePhone(input.phone.trim());
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    role: 'agency_manager',
    full_name: input.fullName.trim(),
    phone: normalizedPhone,
    email: input.email.trim().toLowerCase(),
    updated_at: new Date().toISOString(),
  });

  if (profileError) return { success: false, error: profileError.message };

  const agencySlug =
    slugifyText(input.fullName) || `agency-${userId.slice(0, 8)}`;

  const { error: agencyError } = await supabase.from('agencies').upsert({
    owner_id: userId,
    name: input.fullName.trim(),
    slug: agencySlug,
    phone: normalizedPhone,
    country: 'Uzbekistan',
  });

  if (agencyError) return { success: false, error: agencyError.message };

  return { success: true, data: { userId, agencySlug } };
}

export async function upsertSocialProfileAsUserOnly(
  user: User,
  partialProfile: Partial<Pick<ProfileRow, 'full_name' | 'email' | 'avatar_url'>>,
  client?: SupabaseClient
): Promise<AuthOperationResult> {
  const supabase = resolveSupabaseClient(client);

  const { data: existing, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (error) return { success: false, error: error.message };

  if (existing?.role === 'agency_manager') {
    await signOutLocalFirst(supabase);
    return {
      success: false,
      error: 'Existing account is agency_manager; social login is user-only',
    };
  }

  const roleToSave: UserRole = existing?.role === 'admin' ? 'admin' : 'user';
  const { error: upsertError } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      role: roleToSave,
      full_name: partialProfile.full_name ?? null,
      email: partialProfile.email ?? user.email ?? null,
      avatar_url: partialProfile.avatar_url ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (upsertError) return { success: false, error: upsertError.message };
  return { success: true };
}

export async function requestAccountDeletion(
  client?: SupabaseClient
): Promise<AuthOperationResult> {
  const supabase = resolveSupabaseClient(client);
  const { error } = await supabase.functions.invoke('request-account-deletion');
  if (error) return { success: false, error: error.message };
  return { success: true };
}

function isAllowedRole(role: string | null | undefined): role is UserRole {
  if (!role) return false;
  return ALLOWED_ROLES.has(role as UserRole);
}
