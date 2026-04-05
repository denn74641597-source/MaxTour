import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notifySystemError } from '@/lib/telegram/admin-bot';
import { leadFormSchema } from '@/lib/validators';
import { checkRateLimit, getClientIP, rateLimitHeaders } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Spam himoyasi: bir IP dan 1 daqiqada 10 ta lead
    const ip = getClientIP(request.headers);
    const { allowed, remaining, retryAfterMs } = checkRateLimit(
      `leads:${ip}`,
      10,
      60_000
    );
    if (!allowed) {
      return NextResponse.json(
        { error: 'Juda koʻp soʻrov. Biroz kutib turing.' },
        { status: 429, headers: rateLimitHeaders(remaining, retryAfterMs) }
      );
    }

    const body = await request.json();
    const { tourId, agencyId, ...formData } = body;

    if (!tourId || !agencyId) {
      return NextResponse.json({ error: 'Missing tourId or agencyId' }, { status: 400 });
    }

    const parsed = leadFormSchema.safeParse(formData);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Takroriy lead oldini olish: bir xil tour + agency + telefon 5 daqiqa ichida kiritilmasin
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('tour_id', tourId)
      .eq('agency_id', agencyId)
      .eq('phone', parsed.data.phone)
      .gte('created_at', fiveMinAgo)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { success: true, message: 'Arizangiz allaqachon yuborilgan' },
        { status: 200 }
      );
    }

    const { error } = await supabase.from('leads').insert({
      tour_id: tourId,
      agency_id: agencyId,
      user_id: user?.id ?? null,
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      telegram_username: parsed.data.telegram_username ?? null,
      comment: parsed.data.comment ?? null,
      status: 'new',
    });

    if (error) {
      console.error('Lead API error:', error);
      await notifySystemError({ source: 'API: /api/leads', message: error.message });
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e) {
    await notifySystemError({ source: 'API: /api/leads', message: e instanceof Error ? e.message : 'Unknown error' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
