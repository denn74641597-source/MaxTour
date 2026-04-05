import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { notifySystemError } from '@/lib/telegram/admin-bot';
import { checkRateLimit, getClientIP, rateLimitHeaders } from '@/lib/rate-limit';
import { z } from 'zod';

// Tracking so'rovi uchun Zod sxemasi
const trackSchema = z.object({
  tour_id: z.string().uuid(),
  agency_id: z.string().uuid(),
  type: z.enum(['call', 'telegram']),
});

export async function POST(request: NextRequest) {
  try {
    // Spam himoyasi: bir IP dan 1 daqiqada 30 ta track
    const ip = getClientIP(request.headers);
    const { allowed, remaining, retryAfterMs } = checkRateLimit(
      `track:${ip}`,
      30,
      60_000
    );
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: rateLimitHeaders(remaining, retryAfterMs) }
      );
    }

    const body = await request.json();
    const parsed = trackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const { error } = await supabase.from('call_tracking').insert({
      tour_id: parsed.data.tour_id,
      agency_id: parsed.data.agency_id,
      type: parsed.data.type,
    });

    if (error) {
      console.error('Track insert error:', error);
      await notifySystemError({ source: 'API: /api/track', message: error.message });
      return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Track API error:', e);
    await notifySystemError({ source: 'API: /api/track', message: e instanceof Error ? e.message : 'Unknown error' });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
