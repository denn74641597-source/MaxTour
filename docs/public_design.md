# MaxTour Public/User/Agency Design Log

## 2026-05-03 19:11:58 +08:00 — Profile Rebuild (`mxtr.uz`)

### 1. Date/time of change
- 2026-05-03 19:11:58 +08:00

### 2. What was changed
- Rebuilt public profile entry page logic for all auth states:
  - session loading
  - unauthenticated prompt
  - authenticated user
  - authenticated `agency_manager`
  - authenticated `admin` on public domain (informational note only, no admin nav exposure)
  - expired session handling
  - deletion-requested account handling
- Rebuilt auth entry UI for profile with mobile-parity logic:
  - login with email/phone + fallback phone-email resolution
  - user registration using phone-derived auth email
  - agency registration with OTP verification and agency creation flow
- Rebuilt authenticated profile UI with desktop-first responsive layout:
  - profile hero, role badge, completeness meter, quick actions
  - tabbed profile navigation
  - personal info editing (safe fields only)
  - saved tours and inquiries activity
  - agency summary block for `agency_manager`
  - settings & safety actions (password change, logout, deletion request)

### 3. Files changed
- `app/(public)/profile/auth-screen.tsx`
- `app/(public)/profile/page.tsx`
- `app/(public)/profile/user-profile-view.tsx`
- `hooks/use-profile.ts`
- `types/index.ts`
- `docs/public_design.md`

### 4. Mobile source-of-truth files inspected
- `../maxtour-mobile/src/store/auth-store.ts`
- `../maxtour-mobile/src/screens/auth/LoginScreen.tsx`
- `../maxtour-mobile/src/screens/profile/ProfileScreen.tsx`
- `../maxtour-mobile/src/screens/profile/NotificationSettingsScreen.tsx`
- `../maxtour-mobile/src/screens/profile/SettingsScreen.tsx`
- `../maxtour-mobile/src/features/favorites/queries.ts`
- `../maxtour-mobile/src/features/leads/queries.ts`
- `../maxtour-mobile/src/features/agencies/queries.ts`
- `../maxtour-mobile/src/types/index.ts`
- `../maxtour-mobile/App.tsx`
- `../maxtour-mobile/src/navigation/AppNavigator.tsx`

### 5. Supabase tables/RPC/functions used
- Tables:
  - `profiles`
  - `favorites`
  - `leads`
  - `tours`
  - `agencies`
  - `agency_subscriptions`
  - `subscription_plans`
- Auth methods:
  - `auth.signInWithPassword`
  - `auth.signUp`
  - `auth.signInWithOtp`
  - `auth.verifyOtp`
  - `auth.updateUser`
  - `auth.getSession`
  - `auth.refreshSession`
  - `auth.signOut`
- Edge function:
  - `request-account-deletion`
- Existing local API route reused:
  - `/api/auth-phone`
- RPC usage in this profile task:
  - none

### 6. Auth/profile logic reused from mobile
- Same role model (`user`, `agency_manager`, `admin`)
- Same phone-based auth-email approach for user registration/login compatibility
- Same fallback login behavior for legacy phone/email mappings
- Same agency manager onboarding structure:
  - email OTP verify
  - set password
  - upsert `profiles` role
  - upsert linked `agencies` row
- Same profile edit field scope:
  - `full_name`
  - `phone`
  - `telegram_username`
- Same account deletion model:
  - request flow via `request-account-deletion`
  - blocked profile access when `deletion_requested_at` is set
- Same profile activity sources:
  - `favorites`
  - `leads`

### 7. Components used
- Shared/UI:
  - `Button`, `Input`, `Label`, `Card`, `Badge`, `Separator`, `Avatar`, `Skeleton`, `Dialog`
- Existing project libs:
  - `lucide-react`
  - `sonner`
  - `next/link`, `next/image`
- Styling:
  - existing Tailwind tokens/utilities in project theme

### 8. Design decisions
- Desktop-first two-column layout with persistent profile nav for faster account tasks
- Premium card hierarchy and completeness indicators for clarity of account status
- Explicit role badge and status messaging to reduce auth ambiguity
- Agency manager section separated as a dedicated tab with verification prompts
- Conservative data rendering:
  - real data only
  - clear empty states when data is unavailable
- Safety-focused settings:
  - surfaced only existing secure flows (logout, password change, deletion request)

### 9. What was intentionally not changed
- No admin files, admin routes, admin UI, or admin docs
- No middleware/domain split changes
- No Supabase schema/RLS/migration changes
- No new dependencies/packages
- No new avatar upload/storage flow
- No new account deletion backend logic beyond existing function invocation

### 10. Local test command
- `npm run dev`

### 11. Manual QA checklist
- Logged out view on `/profile` shows premium login/register prompt
- Login/register CTA paths work for user and agency flows
- Logged in regular user sees profile hero + personal/saved/inquiries/settings tabs
- Logged in `agency_manager` sees agency tab, linked agency summary, and agency dashboard CTA
- Logged in `admin` on `/profile` sees public profile context only (no admin navigation exposure)
- Profile edit updates `full_name`/`phone`/`telegram_username` with validation and feedback
- Logout clears session and returns to profile auth screen
- Loading skeleton/spinner states appear during profile/activity loads
- Error states appear for failed profile/activity requests
- Responsive layout verified on desktop and mobile widths
- Admin pages remain unchanged
- Public homepage remains unchanged
- Tours listing/detail pages remain unchanged

### 12. Known limitations or missing data
- Agency metrics depend on RLS visibility for `tours`, `leads`, and `agency_subscriptions`; if hidden, cards show empty/default values.
- Profile avatar is display-only in this rebuild because no existing safe public upload flow was enabled for this task.
- Extra profile modules (reviews/bookings/recently viewed) are not shown because no confirmed safe, existing public data source was identified in current web scope.

## 2026-05-03 19:54:19 +08:00 — Subscriptions/Favorites Rebuild (`/favorites`, `mxtr.uz`)

### 1. Date/time of change
- 2026-05-03 19:54:19 +08:00

### 2. What was changed
- Completely rebuilt public `Obunalar / Sevimlilar` web section on `/favorites`.
- Implemented mobile-parity logic for:
  - followed agencies list (`Obunalar`)
  - favorites/saved tours list (`Sevimlilar`)
  - suggested agencies fallback when follows are empty
  - refresh + incremental loading behavior
- Reworked auth-aware behavior for this section:
  - loading session state
  - logged-out premium prompt with login/register CTA
  - expired session warning
  - pending deletion warning state
  - runtime session-loss fallback to logged-out prompt (through existing auth listener flow in `useProfile`)
- Added richer public UX:
  - desktop-first header, summary KPI cards, tab switcher
  - subscriptions search
  - favorites search + destination/category/status filters
  - favorites sort (newest/oldest/price/departure date)
  - strong empty/error/offline states
  - real-data cards with safe actions (remove favorite, follow/unfollow)

### 3. Files changed
- `app/(public)/favorites/page.tsx`
- `lib/i18n/types.ts`
- `lib/i18n/uz.ts`
- `lib/i18n/ru.ts`
- `docs/public_design.md`

### 4. Mobile source-of-truth files inspected
- `../maxtour-mobile/src/screens/favorites/FavoritesScreen.tsx`
- `../maxtour-mobile/src/features/favorites/queries.ts`
- `../maxtour-mobile/src/store/user-relations-store.ts`
- `../maxtour-mobile/src/store/auth-store.ts`
- `../maxtour-mobile/src/components/shared/FollowButton.tsx`
- `../maxtour-mobile/src/components/shared/FavoriteButton.tsx`

### 5. Supabase tables/RPC/functions used
- Tables:
  - `favorites`
  - `agency_follows`
  - `agencies`
  - `tours`
  - `profiles` (via existing profile/session hook)
- Supabase auth/session methods (via existing public auth flow):
  - `auth.getSession`
  - `auth.onAuthStateChange`
  - `auth.signOut` (local-first strategy inside existing hooks)
- RPC/functions for this subscriptions/favorites rebuild:
  - none

### 6. Auth/session logic reused from mobile
- Same role assumptions: `user`, `agency_manager`, `admin`.
- Same session-first access model: favorites/follows are account-bound and require authenticated user.
- Same session-expiry handling intent: expired/invalid sessions are treated as signed-out for user-scoped sections.
- Same pending-deletion blocking intent through existing profile resolution flow.
- Same behavior for session loss/log out: relation data clears and UI returns to auth-required view.

### 7. Subscription/following logic reused from mobile
- `Obunalar` maps to followed agencies (not agency paid plan state).
- Follow list query follows mobile order semantics:
  - source: `agency_follows`
  - ordering: `created_at DESC`, `agency_id DESC`
  - then hydrate agencies from `agencies` with `is_approved = true`
  - preserve original follow order in UI
- Suggested agencies fallback shown when no follows exist, using approved agencies list.
- Follow/unfollow mutation uses safe existing model:
  - insert/delete in `agency_follows` by `user_id` + `agency_id`
- Added confirmation on unfollow in web for safer desktop action UX.

### 8. Favorites/saved logic reused from mobile
- Favorites query is user-scoped from `favorites`, joined to `tours` and agency info.
- Uses newest-first ordering aligned with mobile (`created_at DESC`, `tour_id DESC`).
- Remove favorite mutation uses safe existing delete path (`favorites` by `user_id` + `tour_id`).
- Refresh and load-more behavior mirrors mobile section behavior (cursor-style incremental loading).
- Extra web-only filters/sorts are computed on real fetched fields only (no fabricated data).

### 9. Components used
- Existing shared/UI components:
  - `Button`, `Card`, `Input`, `Select`, `Badge`
  - `VerifiedBadge`
- Existing project libs:
  - `next/image`, `next/link`
  - `lucide-react`
  - `sonner`
- Existing i18n + auth/profile hooks:
  - `useTranslation`
  - `useProfile`

### 10. Design decisions
- Kept mobile logic source-of-truth but redesigned UI for desktop-first premium public web.
- Chose two-tab structure (`Obunalar`, `Sevimlilar`) to match mobile mental model and preserve behavior parity.
- Added KPI row with clickable cards to speed navigation/filtering on desktop.
- Added stronger section-specific toolbars (search/filter/sort) without inventing new backend concepts.
- Used real fields only; when a field is missing, showed `Not provided` / `Not available` style fallbacks.
- Kept admin visual language out of the page; stayed within public site styling.

### 11. What was intentionally not changed
- No admin pages, admin routing, admin components, admin queries, or admin docs.
- No middleware/domain split changes.
- No public homepage changes.
- No tours listing/detail logic changes beyond existing links from cards.
- No agency dashboard changes.
- No Supabase schema, RLS, or migration changes.
- No new package/dependency installation.

### 12. Local test command
- `npm run dev`

### 13. Manual QA checklist
- Logged out state on `/favorites` shows premium auth-required prompt with login/register CTAs.
- Logged in regular user sees real followed agencies and real saved tours data.
- Logged in `agency_manager` sees same public subscriptions/favorites behavior with account-scoped data.
- Logged in `admin` on public domain sees public subscriptions/favorites only (no admin nav exposure).
- `Obunalar` block shows real followed agencies or suggested agencies fallback when none followed.
- `Sevimlilar` block shows real saved tours with image/title/location/price and saved date.
- Subscriptions search works.
- Favorites search/filter/sort controls work.
- Remove favorite works and persists after refresh.
- Unfollow/follow actions work and persist after refresh.
- Empty states render correctly:
  - no follows
  - no favorites
  - filter no-results
- Loading state appears during initial load and refresh.
- Error state appears if favorites/follows fetch fails.
- Responsive layout works on desktop and mobile viewport widths.
- Admin pages unchanged.
- Public homepage unchanged.
- Tours pages unchanged.

### 14. Known limitations or missing data
- Active tour count and last-activity values for agencies depend on RLS visibility of `tours`; if restricted, values can appear as unavailable.
- Favorites filters/sorts run on loaded items; users may need `Load more` to include additional pages in client-side filtering.
- Departure date, duration, status, and location details are shown only when present in source rows; missing values intentionally fall back to neutral labels.
