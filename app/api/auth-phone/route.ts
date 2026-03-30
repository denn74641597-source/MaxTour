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

  const cleaned = phone.trim();
  const admin = await createAdminClient();

  // Look up profile by phone
  const { data: profile } = await admin
    .from('profiles')
    .select('email, role')
    .eq('phone', cleaned)
    .single();

  if (!profile?.email) {
    return NextResponse.json({ email: null });
  }

  return NextResponse.json({ email: profile.email });
}
