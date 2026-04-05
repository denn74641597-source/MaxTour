import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { editCallbackMessage, notifySystemError, ensureWebhook } from '@/lib/telegram/admin-bot';

/** Answer Telegram callback query immediately to prevent queue blocking */
async function answerCallback(callbackId: string, text: string) {
  try {
    await fetch(
      `https://api.telegram.org/bot${process.env.ADMIN_BOT_TOKEN}/answerCallbackQuery`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callbackId, text }),
      }
    );
  } catch {
    // ignore — answering is best-effort
  }
}

/**
 * Telegram Bot Webhook — handles inline button callbacks from admin.
 * POST /api/admin-bot/webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Webhook so'rovining haqiqiyligini tekshirish (Telegram secret_token orqali)
    const webhookSecret = process.env.ADMIN_BOT_WEBHOOK_SECRET;
    if (webhookSecret) {
      const receivedToken = request.headers.get('x-telegram-bot-api-secret-token');
      if (receivedToken !== webhookSecret) {
        return NextResponse.json({ ok: false }, { status: 403 });
      }
    }

    // Ensure webhook URL is set on cold start
    await ensureWebhook();

    const update = await request.json();

    // Only handle callback_query
    const callback = update.callback_query;
    if (!callback?.data) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(callback.message?.chat?.id);
    const messageId = callback.message?.message_id;
    const originalText = callback.message?.text || callback.message?.caption || '';
    const data: string = callback.data;

    // Parse callback_data format: "action:id1:id2?"
    const parts = data.split(':');
    const action = parts[0];
    const id1 = parts[1];
    const id2 = parts[2]; // optional (e.g. agencyId for verification)

    // Answer callback IMMEDIATELY — prevents Telegram from blocking the webhook queue
    const isApprove = action.includes('approve') || action === 'tour_publish';
    await answerCallback(callback.id, isApprove ? '✅ Tasdiqlandi' : '❌ Rad etildi');

    // Now process the action in database
    const supabase = await createAdminClient();
    let decision = '';
    let dbError: string | null = null;

    try {
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
          } else {
            dbError = reqError.message;
          }
          decision = 'approved';
          break;
        }
        case 'verify_reject': {
          const { error: e1 } = await supabase
            .from('verification_requests')
            .update({ status: 'rejected', updated_at: new Date().toISOString() })
            .eq('id', id1);
          const { error: e2 } = await supabase
            .from('agencies')
            .update({ is_verified: false, updated_at: new Date().toISOString() })
            .eq('id', id2);
          if (e1 || e2) dbError = (e1?.message || '') + (e2?.message || '');
          decision = 'rejected';
          break;
        }

        // ─── Coin Requests ───
        case 'coin_approve': {
          // Takroriy approve oldini olish: faqat pending statusdagi so'rovni o'zgartirish
          const { data: req, error: fetchErr } = await supabase
            .from('coin_requests')
            .update({ status: 'approved', resolved_at: new Date().toISOString() })
            .eq('id', id1)
            .eq('status', 'pending')
            .select('*')
            .maybeSingle();

          if (fetchErr) {
            dbError = fetchErr.message;
          } else if (!req) {
            dbError = 'Coin request not found or already processed';
          } else {
            const { data: agency } = await supabase
              .from('agencies')
              .select('maxcoin_balance')
              .eq('id', req.agency_id)
              .maybeSingle();

            const currentBalance = (agency as { maxcoin_balance: number } | null)?.maxcoin_balance ?? 0;

            const { error: e1 } = await supabase
              .from('agencies')
              .update({ maxcoin_balance: currentBalance + req.coins })
              .eq('id', req.agency_id);

            const { error: e3 } = await supabase.from('maxcoin_transactions').insert({
              agency_id: req.agency_id,
              amount: req.coins,
              type: 'purchase',
              description: `${req.coins} MC sotib olindi (${Number(req.price_uzs).toLocaleString()} UZS)`,
            });

            if (e1 || e3) dbError = [e1, e3].filter(Boolean).map(e => e!.message).join('; ');
          }
          decision = 'approved';
          break;
        }
        case 'coin_reject': {
          const { error } = await supabase
            .from('coin_requests')
            .update({ status: 'rejected', resolved_at: new Date().toISOString() })
            .eq('id', id1);
          if (error) dbError = error.message;
          decision = 'rejected';
          break;
        }

        // ─── Agency Approval ───
        case 'agency_approve': {
          const { error } = await supabase
            .from('agencies')
            .update({ is_approved: true, updated_at: new Date().toISOString() })
            .eq('id', id1);
          if (error) dbError = error.message;
          decision = 'approved';
          break;
        }
        case 'agency_reject': {
          const { error } = await supabase
            .from('agencies')
            .update({ is_approved: false, updated_at: new Date().toISOString() })
            .eq('id', id1);
          if (error) dbError = error.message;
          decision = 'rejected';
          break;
        }

        // ─── Tour Publish ───
        case 'tour_publish': {
          const { error } = await supabase
            .from('tours')
            .update({ status: 'published', updated_at: new Date().toISOString() })
            .eq('id', id1);
          if (error) dbError = error.message;
          decision = 'approved';
          break;
        }
        case 'tour_reject': {
          const { error } = await supabase
            .from('tours')
            .update({ status: 'archived', updated_at: new Date().toISOString() })
            .eq('id', id1);
          if (error) dbError = error.message;
          decision = 'rejected';
          break;
        }

        default:
          return NextResponse.json({ ok: true });
      }
    } catch (actionErr) {
      dbError = actionErr instanceof Error ? actionErr.message : 'Unknown DB error';
      if (!decision) decision = isApprove ? 'approved' : 'rejected';
    }

    // Update the Telegram message to show the decision
    if (messageId && decision) {
      try {
        if (dbError) {
          // Show error in message
          await editCallbackMessage(chatId, messageId, originalText, 'error', dbError);
        } else {
          await editCallbackMessage(chatId, messageId, originalText, decision);
        }
      } catch {
        // ignore edit errors
      }
    }

    // Log DB errors
    if (dbError) {
      console.error(`Webhook action ${action} error:`, dbError);
      await notifySystemError({
        source: `Bot callback: ${action}`,
        message: dbError,
        extra: `ID: ${id1}`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Admin bot webhook error:', err);
    await notifySystemError({ source: 'API: /api/admin-bot/webhook', message: err instanceof Error ? err.message : 'Unknown error' });
    return NextResponse.json({ ok: true });
  }
}
