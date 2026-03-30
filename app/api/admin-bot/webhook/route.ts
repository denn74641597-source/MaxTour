import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { editCallbackMessage } from '@/lib/telegram/admin-bot';

/**
 * Telegram Bot Webhook — handles inline button callbacks from admin.
 * POST /api/admin-bot/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const update = await request.json();

    // Only handle callback_query
    const callback = update.callback_query;
    if (!callback?.data) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(callback.message?.chat?.id);
    const messageId = callback.message?.message_id;
    const originalText = callback.message?.text || '';
    const data: string = callback.data;

    const supabase = await createAdminClient();

    // Parse callback_data format: "action:id1:id2?"
    const parts = data.split(':');
    const action = parts[0];
    const id1 = parts[1];
    const id2 = parts[2]; // optional (e.g. agencyId for verification)

    let decision = '';

    switch (action) {
      // ─── Verification ───
      case 'verify_approve': {
        const { error: reqError } = await supabase
          .from('verification_requests')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .eq('id', id1);
        if (!reqError) {
          await supabase
            .from('agencies')
            .update({ is_verified: true, updated_at: new Date().toISOString() })
            .eq('id', id2);
        }
        decision = 'approved';
        break;
      }
      case 'verify_reject': {
        await supabase
          .from('verification_requests')
          .update({ status: 'rejected', updated_at: new Date().toISOString() })
          .eq('id', id1);
        await supabase
          .from('agencies')
          .update({ is_verified: false, updated_at: new Date().toISOString() })
          .eq('id', id2);
        decision = 'rejected';
        break;
      }

      // ─── Coin Requests ───
      case 'coin_approve': {
        const { data: req } = await supabase
          .from('coin_requests')
          .select('*')
          .eq('id', id1)
          .eq('status', 'pending')
          .single();

        if (req) {
          const { data: agency } = await supabase
            .from('agencies')
            .select('maxcoin_balance')
            .eq('id', req.agency_id)
            .single();

          const currentBalance = (agency as { maxcoin_balance: number } | null)?.maxcoin_balance ?? 0;

          await supabase
            .from('agencies')
            .update({ maxcoin_balance: currentBalance + req.coins })
            .eq('id', req.agency_id);

          await supabase
            .from('coin_requests')
            .update({ status: 'approved', resolved_at: new Date().toISOString() })
            .eq('id', id1);

          await supabase.from('maxcoin_transactions').insert({
            agency_id: req.agency_id,
            amount: req.coins,
            type: 'purchase',
            description: `${req.coins} MC sotib olindi (${Number(req.price_uzs).toLocaleString()} UZS)`,
          });
        }
        decision = 'approved';
        break;
      }
      case 'coin_reject': {
        await supabase
          .from('coin_requests')
          .update({ status: 'rejected', resolved_at: new Date().toISOString() })
          .eq('id', id1);
        decision = 'rejected';
        break;
      }

      // ─── Agency Approval ───
      case 'agency_approve': {
        await supabase
          .from('agencies')
          .update({ is_approved: true, updated_at: new Date().toISOString() })
          .eq('id', id1);
        decision = 'approved';
        break;
      }
      case 'agency_reject': {
        await supabase
          .from('agencies')
          .update({ is_approved: false, updated_at: new Date().toISOString() })
          .eq('id', id1);
        decision = 'rejected';
        break;
      }

      // ─── Tour Publish ───
      case 'tour_publish': {
        await supabase
          .from('tours')
          .update({ status: 'published', updated_at: new Date().toISOString() })
          .eq('id', id1);
        decision = 'approved';
        break;
      }
      case 'tour_reject': {
        await supabase
          .from('tours')
          .update({ status: 'archived', updated_at: new Date().toISOString() })
          .eq('id', id1);
        decision = 'rejected';
        break;
      }

      default:
        return NextResponse.json({ ok: true });
    }

    // Update the Telegram message to show the decision
    if (messageId) {
      await editCallbackMessage(chatId, messageId, originalText, decision);
    }

    // Answer callback to remove loading spinner on button
    await fetch(
      `https://api.telegram.org/bot${process.env.ADMIN_BOT_TOKEN || '8690380624:AAEWMibPtoXovf9W3avF-hPz9iM7PqU82Mc'}/answerCallbackQuery`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callback.id,
          text: decision === 'approved' ? '✅ Tasdiqlandi' : '❌ Rad etildi',
        }),
      }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Admin bot webhook error:', err);
    return NextResponse.json({ ok: true });
  }
}
