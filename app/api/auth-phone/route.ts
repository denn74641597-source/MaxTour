import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/auth-phone
 * Given a phone number, returns the auth email associated with that phone.
 * Used so agencies can login with their phone number.
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

  const admin = await createAdminClient();

  // Try exact match first
  const { data: profile } = await admin
    .from('profiles')
    .select('email, role')
    .eq('phone', cleaned)
    .single();

  if (profile?.email) {
    return NextResponse.json({ email: profile.email });
  }

  // Try without + prefix
  const withoutPlus = cleaned.replace(/^\+/, '');
  const { data: profile2 } = await admin
    .from('profiles')
    .select('email, role')
    .eq('phone', withoutPlus)
    .single();

  if (profile2?.email) {
    return NextResponse.json({ email: profile2.email });
  }

  // Try with + prefix
  if (!cleaned.startsWith('+')) {
    const { data: profile3 } = await admin
      .from('profiles')
      .select('email, role')
      .eq('phone', '+' + cleaned)
      .single();

    if (profile3?.email) {
      return NextResponse.json({ email: profile3.email });
    }
  }

  return NextResponse.json({ email: null });
}
