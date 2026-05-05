# Routing And Domains

Date: 2026-05-06

## Split Status

1. `agency.mxtr.uz/*` is served by the standalone project: `C:/Projects/MaxTour-agency`.
2. This monolith serves only:
   - `mxtr.uz/*`
   - `www.mxtr.uz/*`
   - `remote.mxtr.uz/*`
3. Monolith keeps domain-target awareness for `agency.mxtr.uz`, but no longer exposes public UI links or redirects into private agency panel paths.
4. Public auth on `mxtr.uz` is user-only; agency management auth is standalone at `https://agency.mxtr.uz/agency/login`.

## Domain Responsibilities (Monolith Runtime)

| Domain | Allowed Surface | Blocked Surface |
|---|---|---|
| `mxtr.uz`, `www.mxtr.uz` | Public, User | Admin, direct agency rendering |
| `remote.mxtr.uz` | Admin | Public, User, Agency |

## Route Surface Map (Monolith)

### Public website

1. `/`
2. `/tours/*`
3. `/search`
4. `/agencies/*`

### User area

1. `/profile`
2. `/profile/notifications`

### Admin dashboard

1. `/admin`
2. `/admin/*` (agencies, tours, users, verification, leads, settings, and related admin tools)

### Agency routes in monolith

1. `/agency*` is not served by monolith pages.
2. On `mxtr.uz` / `www.mxtr.uz`, `/agency*` is no longer force-redirected; those paths are treated as non-public monolith routes.

## Middleware Policy

File: `middleware.ts`

### Host-based rules

1. If host resolves to `remote.mxtr.uz`:
   - `/` redirects to `/admin`
   - any non-`/admin*` path redirects to `/admin`
2. If host resolves to `mxtr.uz` or `www.mxtr.uz`:
   - any `/admin*` path redirects to remote admin host
3. Unknown/dev hosts:
   - no strict domain split is enforced (helps local development).

### Auth-related rules

1. `/admin/login` is public, but authenticated `admin` users are redirected to `/admin`.
2. Other `/admin*` routes require Supabase-authenticated user with `profiles.role = 'admin'`.

## Routing Utility Modules

### `lib/routing/domains.ts`

1. Normalizes hostnames from request headers.
2. Resolves domain target: `mxtr`, `agency`, `remote`, or `unknown`.
3. Keeps shared domain constants used by host-target resolution.

### `lib/routing/guards.ts`

1. Defines internal/static path bypass logic.
2. Defines domain-access checks used by middleware and admin readiness checks.
3. Keeps `domainTarget === 'agency'` branch temporarily as rollback/defensive safety.

## Risk Notes

1. If DNS/proxy is misconfigured and `Host` is not preserved, domain split behavior can be incorrect.
2. Unknown hosts intentionally bypass strict split for development; production traffic should use only `mxtr.uz`, `www.mxtr.uz`, `remote.mxtr.uz`, and standalone `agency.mxtr.uz`.
3. Any future auth refactor must preserve the same host split contract to avoid exposing admin routes on public hosts.
