# MaxTour Admin Panel (remote.mxtr.uz)

Date: 2026-05-03

## Scope

- Admin panel is isolated under `app/(admin)` and served only on `remote.mxtr.uz`.
- Public/user/agency routes remain on `mxtr.uz`.
- No changes were made to `maxtour-mobile`.

## Role Model (Mobile-Consistent)

Source-of-truth roles are unchanged:

1. `user`
2. `agency_manager`
3. `admin`

Admin access requires `profiles.role = 'admin'`.

## Auth And Guard Flow

### 1) Admin login

- Route: `/admin/login`
- Login uses Supabase auth credentials (email/phone + password), aligned with mobile/web identifier fallback behavior.
- After sign-in, profile is checked:
  - if role is `admin`: allow and redirect to `/admin`
  - otherwise: local sign-out and deny access

### 2) Middleware gate

- `middleware.ts` now checks admin route access using Supabase session + `profiles.role`.
- `/admin/login`:
  - if already admin -> redirect `/admin`
  - otherwise -> allowed
- `/admin/*` (excluding login):
  - non-admin or unauthenticated -> redirect `/admin/login`

### 3) Server-side admin guard

- `features/admin/guard.ts` enforces role checks for admin data operations.
- `features/admin/queries.ts` and `features/admin/actions.ts` require admin role before using service-role client.

## Implemented Admin Areas

1. Dashboard overview (`/admin`)
2. Agencies management (`/admin/agencies`)
3. Tours moderation (`/admin/tours`)
4. Users list (`/admin/users`) from `profiles` table
5. Leads (`/admin/leads`)
6. Verification (`/admin/verification`)
7. Account deletions (`/admin/account-deletions`)
8. MaxCoin requests (`/admin/coin-requests`)
9. Promotions (`/admin/featured`)
10. Subscriptions (`/admin/subscriptions`)
11. Settings (`/admin/settings`)
12. Audit log (`/admin/audit-log`)

## Data Coverage Notes

- Users list is supported by existing logic via `profiles`.
- Promotions/MaxCoin management is supported by existing logic via:
  - `coin_requests`
  - `maxcoin_transactions`
  - existing featured/promotions datasets already used in admin

## Gaps

- No role-model gap found for admin authorization.
- Existing role model from mobile (`admin`) is clear and reused directly.
