# Routing And Domains

Date: 2026-05-03

## Domain Responsibilities

| Domain | Allowed Surface | Blocked Surface |
|---|---|---|
| `mxtr.uz`, `www.mxtr.uz` | Public, User, Agency | Admin |
| `remote.mxtr.uz` | Admin | Public, User, Agency |

## Route Surface Map

### Public website

1. `/`
2. `/tours/*`
3. `/search`
4. `/agencies/*`

### User area

1. `/profile`
2. `/profile/notifications`

### Agency dashboard

1. `/agency`
2. `/agency/tours/*`
3. `/agency/leads`
4. `/agency/advertising`
5. `/agency/interests`
6. `/agency/analytics`
7. `/agency/verification`
8. `/agency/subscription`

### Admin dashboard

1. `/admin`
2. `/admin/*` (agencies, tours, users, verification, leads, settings, and related admin tools)

## Middleware Policy

File: `middleware.ts`

### Host-based rules

1. If host resolves to `remote.mxtr.uz`:
   - `/` redirects to `/admin`
   - any non-`/admin*` path redirects to `/admin`
2. If host resolves to `mxtr.uz` or `www.mxtr.uz`:
   - any `/admin*` path redirects to `/`
3. Unknown/dev hosts:
   - no strict domain split is enforced (helps local development).

### Auth-related rules

1. `/admin/login` is public, but authenticated `admin` users are redirected to `/admin`.
2. Other `/admin*` routes require Supabase-authenticated user with `profiles.role = 'admin'`.
3. `/agency*` routes require Supabase authenticated session.

## Routing Utility Modules

### `lib/routing/domains.ts`

1. Normalizes hostnames from request headers.
2. Resolves domain target: `mxtr`, `remote`, or `unknown`.
3. Exposes host context for middleware decisions.

### `lib/routing/guards.ts`

1. Defines internal/static path bypass logic.
2. Defines route-area and domain-access checks.
3. Exposes request helper for host-context resolution.

## Risk Notes

1. If DNS/proxy is misconfigured and `Host` is not preserved, domain split behavior can be incorrect.
2. Unknown hosts intentionally bypass strict split for development; production traffic should use only `mxtr.uz`, `www.mxtr.uz`, `remote.mxtr.uz`.
3. Any future auth refactor must preserve the same host split contract to avoid exposing admin routes on `mxtr.uz`.
