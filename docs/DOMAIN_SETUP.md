# Domain Setup (mxtr.uz + remote.mxtr.uz)

Date: 2026-05-03

## Detected Stack

1. Framework: Next.js App Router (`next@15`).
2. Hosting runtime: OpenNext on Cloudflare Workers (`open-next.config.ts` + `wrangler.toml`).
3. Domain split enforcement: `middleware.ts` + `lib/routing/*`.

## Domain Responsibilities

1. `mxtr.uz`, `www.mxtr.uz`:
   - Public pages
   - User profile/auth
   - Agency dashboard
2. `remote.mxtr.uz`:
   - Admin panel only (`/admin*`)

## Domain Binding In Deployment Config

`wrangler.toml` now includes custom-domain routes:

1. `mxtr.uz`
2. `www.mxtr.uz`
3. `remote.mxtr.uz`

These bind all three hostnames to the same Worker deployment; middleware decides which surface is allowed per host.

## Middleware Enforcement

1. On `remote.mxtr.uz`:
   - `/` redirects to `/admin`
   - any non-`/admin*` path redirects to `/admin`
2. On `mxtr.uz` / `www.mxtr.uz`:
   - any `/admin*` path redirects to `/`

## Admin Authorization Enforcement

For `/admin*` routes:

1. Supabase session is checked.
2. `profiles.role` must equal `admin`.
3. Non-admin users are redirected to `/admin/login`.

## DNS And Cloudflare Steps (Exact)

1. Add `mxtr.uz` zone to Cloudflare (if not already added).
2. Update registrar nameservers to Cloudflare nameservers.
3. Deploy Worker once: `npm run build:cf` then `npm run deploy:cf`.
4. In Cloudflare dashboard, confirm custom domains attached to Worker:
   - `mxtr.uz`
   - `www.mxtr.uz`
   - `remote.mxtr.uz`
5. Ensure SSL/TLS mode is `Full (strict)`.
6. Ensure proxy stays enabled so `Host` header reaches Worker correctly.

## Required Runtime Environment Variables

Public/runtime:

1. `NEXT_PUBLIC_APP_NAME`
2. `NEXT_PUBLIC_APP_URL` (recommended production value: `https://mxtr.uz`)
3. `NEXT_PUBLIC_SUPABASE_URL`
4. `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Server-only secrets:

1. `SUPABASE_SERVICE_ROLE_KEY`
2. `ADMIN_BOT_TOKEN` (if Telegram admin alerts are used)
3. `ADMIN_BOT_WEBHOOK_SECRET` (if webhook validation is used)
4. `ADMIN_CHAT_ID`, `ADMIN_CHAT_ID_2` (if alert routing is used)

## Verification Scenarios

1. `https://remote.mxtr.uz/` -> redirects to `/admin`.
2. `https://remote.mxtr.uz/tours` -> redirects to `/admin`.
3. `https://mxtr.uz/admin` -> redirects to `/`.
4. Admin user login on `https://remote.mxtr.uz/admin/login` -> enters `/admin`.
5. Non-admin login on `https://remote.mxtr.uz/admin/login` -> blocked from admin area.

## Operational Note

No Supabase schema changes are required for this split. Authorization uses existing `profiles.role` values (`user`, `agency_manager`, `admin`) consistent with mobile logic.
