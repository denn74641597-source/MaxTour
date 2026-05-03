# Supabase Web Mapping (Mobile -> MaxTour Web)

Date: 2026-05-03  
Source of truth reviewed (read-only): `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile`

## Goal

Centralize web Supabase access in `MaxTour/src/lib/supabase/*` while preserving the same table names, RPC names, edge functions, auth patterns, and role semantics used by mobile.

## Implemented Central Access Layer

### Core

- `src/lib/supabase/client.ts`
- `src/lib/supabase/auth.ts`
- `src/lib/supabase/index.ts`

### Read layer (`queries`)

- `src/lib/supabase/queries/agencies.ts`
- `src/lib/supabase/queries/tours.ts`
- `src/lib/supabase/queries/favorites.ts`
- `src/lib/supabase/queries/interests.ts`
- `src/lib/supabase/queries/leads.ts`
- `src/lib/supabase/queries/maxcoin.ts`
- `src/lib/supabase/queries/notifications.ts`
- `src/lib/supabase/queries/verification.ts`
- `src/lib/supabase/queries/index.ts`

### Write layer (`mutations`)

- `src/lib/supabase/mutations/agencies.ts`
- `src/lib/supabase/mutations/tours.ts`
- `src/lib/supabase/mutations/favorites.ts`
- `src/lib/supabase/mutations/leads.ts`
- `src/lib/supabase/mutations/maxcoin.ts`
- `src/lib/supabase/mutations/notifications.ts`
- `src/lib/supabase/mutations/verification.ts`
- `src/lib/supabase/mutations/index.ts`

### Shared types

- `src/types/supabase.ts`
- `src/types/auth.ts`
- `src/types/index.ts`

## Mobile Table Contracts Mapped

The centralized layer uses the same table identifiers found in mobile:

1. `agencies`
2. `agency_follows`
3. `agency_subscriptions`
4. `call_tracking`
5. `coin_requests`
6. `favorites`
7. `leads`
8. `maxcoin_transactions`
9. `notification_preferences`
10. `profiles`
11. `promotion_tiers`
12. `reviews`
13. `subscription_plans`
14. `tour_promotions`
15. `tours`
16. `verification_requests`

## Mobile RPC Contracts Mapped

All mobile RPC names are preserved in the web access layer:

1. `get_verified_agencies_ranked`
2. `get_agency_total_views`
3. `get_agency_analytics`
4. `get_featured_premium_tours_v1`
5. `register_featured_impression_by_tour_v1`
6. `register_featured_click_by_tour_v1`
7. `get_fair_promoted_tours_v1`
8. `get_hot_tours_ranked`
9. `get_recommended_tours`
10. `get_sponsored_tours`
11. `get_tours_by_engagement`
12. `increment_view_count`
13. `search_tours_public_v1`
14. `promote_tour_fair_v1`
15. `promote_tour_featured_fair_v1`

## Edge Functions Mapped

1. `translate-tour` (tour translation trigger)
2. `request-account-deletion` (account deletion request)

## Auth / Role Flow Mapped

`src/lib/supabase/auth.ts` includes mobile-parity logic:

1. Allowed roles: `user | agency_manager | admin`
2. Phone auth-email derivation (`+998...@user.maxtour.uz`)
3. Login fallbacks:
   - direct identifier login
   - legacy phone-derived email retry (`@maxtour.local`)
   - profile lookup based fallback
4. User registration:
   - signUp
   - immediate signIn
   - `profiles` upsert with role `user`
5. Agency registration:
   - OTP send (`signInWithOtp`)
   - OTP verify (`verifyOtp`)
   - password set (`updateUser` with session-race retry)
   - `profiles` upsert role `agency_manager`
   - `agencies` upsert
6. Pending deletion lock:
   - checks `profiles.deletion_requested_at`
   - local sign-out when pending
7. Social-profile upsert guard:
   - keeps existing `admin`
   - blocks `agency_manager` hijack path

## Parity Behavior Notes

1. Tours and promotions use RPC-first strategy where mobile uses RPC-first.
2. Fallback query paths are preserved for environments where RPC/migration rollout is incomplete.
3. Subscription queries are intentionally short-circuited as disabled by default (matching mobile behavior).
4. MaxCoin promotion uses fair RPC-only path plus idempotency key generation.

## Important Scope Note

This task centralizes Supabase access logic into `src/lib/supabase/*`.  
Existing legacy callers in `features/*` and `lib/supabase/*` were not refactored in this step.

## Known Unknowns

Ambiguous schema details were not guessed and are documented in:

- `docs/SUPABASE_GAPS.md`
