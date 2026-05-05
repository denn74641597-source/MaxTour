# MaxTour Deployment Checklist

Date: 2026-05-03

## 1) Detected Project Runtime

1. Framework: Next.js App Router (`next@15`).
2. Build/runtime target: OpenNext + Cloudflare Workers.
3. Deployment config files:
   - `open-next.config.ts`
   - `wrangler.toml`
4. Domain split runtime enforcement:
   - `middleware.ts`
   - `lib/routing/domains.ts`
   - `lib/routing/guards.ts`

## 2) Production Domain Targets

1. `mxtr.uz` -> public + user surfaces.
2. `www.mxtr.uz` -> same as `mxtr.uz`.
3. `remote.mxtr.uz` -> admin panel surface only.
4. `agency.mxtr.uz` -> standalone agency project (`C:/Projects/MaxTour-agency`) and is out of scope for monolith deployment.

`wrangler.toml` custom-domain routes must include all 3 hostnames.

## 3) Required Environment Variables

Do not commit secrets to git.  
Set secrets with `wrangler secret put ...` (or Cloudflare dashboard Worker secrets).

### Public/runtime vars

1. `NEXT_PUBLIC_APP_NAME`
2. `NEXT_PUBLIC_APP_URL` (recommended: `https://mxtr.uz`)
3. `NEXT_PUBLIC_SUPABASE_URL`
4. `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Server-only vars

1. `SUPABASE_SERVICE_ROLE_KEY`
2. `ADMIN_BOT_TOKEN` (if Telegram admin alerts are enabled)
3. `ADMIN_BOT_WEBHOOK_SECRET` (if webhook verification is enabled)
4. `ADMIN_CHAT_ID`
5. `ADMIN_CHAT_ID_2`

## 4) DNS + Cloudflare Setup

1. Add `mxtr.uz` zone to Cloudflare.
2. Update registrar nameservers to Cloudflare nameservers.
3. Deploy Worker (`npm run build:cf` then `npm run deploy:cf`).
4. In Worker custom domains, verify:
   - `mxtr.uz`
   - `www.mxtr.uz`
   - `remote.mxtr.uz`
5. SSL/TLS mode: `Full (strict)`.
6. Keep proxy enabled so original host headers are preserved.

## 5) Pre-Production Safety Checklist

1. Confirm middleware host split behavior in preview and production.
2. Confirm `/admin*` is blocked on `mxtr.uz` and accessible only on `remote.mxtr.uz`.
3. Confirm admin access requires `profiles.role = 'admin'`.
4. Confirm non-admin users cannot enter admin pages even with valid credentials.
5. Confirm `/agency*` on `mxtr.uz`/`www.mxtr.uz` redirects to `https://agency.mxtr.uz`.
6. Confirm no secrets are present in repo files or client bundles.
7. Confirm Supabase service-role usage remains server-side only.
8. Confirm admin/user smoke tests on desktop + mobile responsive layouts.
9. Confirm error monitoring/logging is enabled for auth and middleware redirects.
10. Confirm rollback command and last known good deployment are available.

## 6) Deployment Run Commands

1. Install dependencies (if needed): `npm install`
2. Build for Cloudflare: `npm run build:cf`
3. Deploy: `npm run deploy:cf`

Optional local preview:

1. `npm run preview:cf`

## 7) Post-Deploy Verification Matrix

1. `https://mxtr.uz/` -> public homepage loads.
2. `https://mxtr.uz/agency` -> redirects to `https://agency.mxtr.uz/agency`.
3. `https://mxtr.uz/admin` -> redirects to `/`.
4. `https://remote.mxtr.uz/` -> redirects to `/admin`.
5. `https://remote.mxtr.uz/admin/login` -> login page available.
6. Admin account login on remote domain -> dashboard loads.
7. Non-admin account login on remote domain -> admin denied.
8. `https://remote.mxtr.uz/tours` -> redirects to `/admin`.

## 8) Rollback Plan

1. Keep previous successful Worker version/tag noted before deployment.
2. If domain split or auth regression appears:
   - rollback Worker deployment to last known good version
   - re-run verification matrix
3. Pause new releases until middleware and domain checks are green again.
