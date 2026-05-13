# MaxTour Notification Worker (Stage 1)

Dedicated Cloudflare Worker for real device push notification delivery through Expo Push API.

This worker is intentionally separate from the OpenNext app worker. Do not merge this logic into `/.open-next/worker.js`.

## What It Does

- Exposes `POST /internal/notifications/process` for immediate processing.
- Runs cron fallback every minute via Cloudflare `scheduled` trigger.
- Claims outbox rows via Supabase RPC (`claim_notification_outbox`).
- Resolves recipients from `notification_outbox.user_ids` (fallback: `data.user_ids`).
- Filters users by `notification_preferences` when `preference_key` is present.
- Reads `profiles.push_token` and sends push messages to Expo in chunks of max 100.
- Parses Expo ticket responses.
- Marks rows with:
  - `mark_notification_sent` (accepted Expo tickets only)
  - `mark_notification_failed` (transient failures)
  - `mark_notification_skipped` (no eligible recipients/tokens)
- Cleans up invalid tokens on permanent token errors (for example `DeviceNotRegistered`).

## Required Cloudflare Secrets

Set these in the worker directory:

1. `SUPABASE_URL`
2. `SUPABASE_SERVICE_ROLE_KEY`
3. `INTERNAL_NOTIFICATION_SECRET`
4. `EXPO_ACCESS_TOKEN` (optional, recommended)

Commands:

```bash
npx wrangler secret put SUPABASE_URL --config workers/notification-worker/wrangler.toml
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config workers/notification-worker/wrangler.toml
npx wrangler secret put INTERNAL_NOTIFICATION_SECRET --config workers/notification-worker/wrangler.toml
npx wrangler secret put EXPO_ACCESS_TOKEN --config workers/notification-worker/wrangler.toml
```

## Deploy Command

```bash
npx wrangler deploy --config workers/notification-worker/wrangler.toml
```

## Local Test Command

```bash
npx wrangler dev --config workers/notification-worker/wrangler.toml
```

## Internal Endpoint

- Method: `POST`
- Path: `/internal/notifications/process`
- Auth: provide `INTERNAL_NOTIFICATION_SECRET` via:
  - `x-internal-notification-secret: <secret>` header, or
  - `Authorization: Bearer <secret>` header
- Optional JSON body:
  - `batch_size` (1..100)
  - `source` (string for logs)

Example:

```bash
curl -X POST "http://127.0.0.1:8787/internal/notifications/process" \
  -H "content-type: application/json" \
  -H "x-internal-notification-secret: YOUR_SECRET" \
  -d '{"batch_size":50,"source":"manual-test"}'
```

## Cron Behavior

- Trigger: every minute (`* * * * *`)
- Source label in logs: `cron`
- Uses same processing pipeline as internal endpoint.

## Logging

Structured logs are emitted for:

- `claimed`
- `sent`
- `failed`
- `skipped`
- `invalid_token`
- `expo_error`
- `cron_complete`

## Required DB Contract

This worker expects the following in the shared Supabase database:

1. Table: `notification_outbox`
2. RPC: `claim_notification_outbox(p_batch_size int, p_worker_id text)`
3. RPC: `mark_notification_sent(p_id uuid)`
4. RPC: `mark_notification_failed(p_id uuid, p_error text, p_retry_after_seconds int default null)`
5. RPC: `mark_notification_skipped(p_id uuid, p_reason text)`
6. Table/columns: `profiles(id, push_token)`
7. Table/columns: `notification_preferences(user_id, <preference_key columns>)`

If any of these are missing in production, add them in MaxTour-owned Supabase migrations without changing this worker RPC contract.

## Safety Warning

This worker sends real device push notifications to user devices. Treat all manual invocations as production-impacting operations.
