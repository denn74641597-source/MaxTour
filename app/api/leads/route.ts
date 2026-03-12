import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { leadFormSchema } from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
