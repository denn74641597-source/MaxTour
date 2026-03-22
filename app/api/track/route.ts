import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tour_id, agency_id, type } = body;

    if (!tour_id || !agency_id || !['call', 'telegram'].includes(type)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const { error } = await supabase.from('call_tracking').insert({
      tour_id,
      agency_id,
      type,
    });

    if (error) {
      console.error('Track insert error:', error);
      return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Track API error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
