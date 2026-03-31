import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/auth-phone
 * Given a phone number, returns the Supabase auth email associated with that phone.
 * First checks auth.users directly (most reliable), then falls back to profiles table.
 */
export async function POST(request: NextRequest) {
  const { phone } = await request.json();
  if (!phone || typeof phone !== 'string') {
    return NextResponse.json({ error: 'Phone required' }, { status: 400 });
  }

  // Normalize phone: remove spaces/dashes, ensure + prefix
  let cleaned = phone.trim().replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('998') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  const withoutPlus = cleaned.replace(/^\+/, '');

  const admin = await createAdminClient();

  // 1. Find user ID from profiles table by phone
  const phoneVariants = [cleaned, withoutPlus];
  if (!cleaned.startsWith('+')) phoneVariants.push('+' + cleaned);

  let userId: string | null = null;
  for (const ph of phoneVariants) {
    const { data } = await admin
      .from('profiles')
      .select('id')
      .eq('phone', ph)
      .limit(1)
      .single();
    if (data?.id) {
      userId = data.id;
      break;
    }
  }

  if (!userId) {
    return NextResponse.json({ email: null });
  }

  // 2. Get the ACTUAL auth email from auth.users (this is what Supabase uses for login)
  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  if (authUser?.user?.email) {
    return NextResponse.json({ email: authUser.user.email });
  }

  // 3. Fallback: try legacy email patterns
  const legacyEmails = [
    `${withoutPlus}@maxtour.local`,
    `${cleaned}@user.maxtour.uz`,
    `${withoutPlus}@user.maxtour.uz`,
  ];

  return NextResponse.json({ email: legacyEmails[0], legacyEmails });
}
