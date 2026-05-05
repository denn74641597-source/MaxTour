> Historical/archived note (Step 33, 2026-05-06): This document reflects pre-split planning when agency lived in the monolith. `agency.mxtr.uz` is now served by the standalone project at `C:/Projects/MaxTour-agency`.

# Agency Panel Migration Design (mxtr.uz -> agency.mxtr.uz)

Audit scope: planning only (no code implementation in this step).

## 1. Date/time

- Audit timestamp: `2026-05-03 22:42:48 +08:00` (Asia/Singapore)
- Project: `C:\Users\adbax\OneDrive\Desktop\MaxTour`
- Source of truth (read-only): `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile`

## 2. Current agency panel locations in MaxTour

### Route group and pages
- `app/(agency)/layout.tsx` (role-gated shell using `requireRole('agency_manager', 'admin')`)
- `app/(agency)/agency/page.tsx` (dashboard)
- `app/(agency)/agency/tours/page.tsx`
- `app/(agency)/agency/tours/new/page.tsx`
- `app/(agency)/agency/tours/[id]/edit/page.tsx`
- `app/(agency)/agency/leads/page.tsx`
- `app/(agency)/agency/interests/page.tsx`
- `app/(agency)/agency/advertising/page.tsx`
- `app/(agency)/agency/analytics/page.tsx`
- `app/(agency)/agency/verification/page.tsx`
- `app/(agency)/agency/profile/page.tsx`
- `app/(agency)/agency/subscription/page.tsx`

### Agency shell/navigation
- `components/layouts/agency-dashboard-layout.tsx`
- `components/shared/dashboard-nav.tsx` (`type='agency'` nav items)

### Public/user touchpoints that currently expose `/agency`
- `components/shared/public-desktop-sidebar.tsx` (secondary link for `agency_manager`)
- `app/(public)/profile/auth-screen.tsx` (post-login/register redirects to `/agency`)
- `app/(public)/profile/user-profile-view.tsx` (agency CTA buttons to `/agency`)

### Domain/middleware touchpoints
- `middleware.ts` (`/agency*` requires authenticated session)
- `lib/routing/guards.ts` (`resolveRouteArea('/agency') => 'agency'`)
- `lib/routing/domains.ts` (no `agency.mxtr.uz` mapping yet)
- `types/shared/routing.ts` (`DomainTarget = 'mxtr' | 'remote' | 'unknown'`)

## 3. maxtour-mobile source-of-truth files inspected

### Agency screens
- `src/screens/agency-panel/AgencyDashboardScreen.tsx`
- `src/screens/agency-panel/ToursListScreen.tsx`
- `src/screens/agency-panel/TourFormScreen.tsx`
- `src/screens/agency-panel/LeadsScreen.tsx`
- `src/screens/agency-panel/InterestsScreen.tsx`
- `src/screens/agency-panel/AdvertisingScreen.tsx`
- `src/screens/agency-panel/AnalyticsScreen.tsx`
- `src/screens/agency-panel/VerificationScreen.tsx`
- `src/screens/agency-panel/AgencyEditScreen.tsx`
- `src/screens/agency-panel/SubscriptionScreen.tsx`

### Mobile feature/query logic
- `src/features/agencies/queries.ts`
- `src/features/tours/queries.ts`
- `src/features/leads/queries.ts`
- `src/features/interests/queries.ts`
- `src/features/maxcoin/queries.ts`
- `src/features/verification/queries.ts`

### Mobile auth/navigation/menu references
- `src/store/auth-store.ts`
- `src/screens/auth/LoginScreen.tsx`
- `src/navigation/RootNavigator.tsx`
- `src/navigation/linking.ts`
- `src/components/shared/AgencyMenuButton.tsx`
- `src/types/index.ts`

## 4. Current agency routes in MaxTour

- `/agency`
- `/agency/tours`
- `/agency/tours/new`
- `/agency/tours/[id]/edit`
- `/agency/leads`
- `/agency/interests`
- `/agency/advertising`
- `/agency/analytics`
- `/agency/verification`
- `/agency/profile`
- `/agency/subscription`

## 5. Proposed agency.mxtr.uz routing model

Goal: agency panel becomes agency-only surface on `agency.mxtr.uz`, while keeping internal logic parity and minimizing break risk.

### External canonical URLs (recommended)
- `https://agency.mxtr.uz/` -> Boshqaruv
- `https://agency.mxtr.uz/tours` -> Turlar
- `https://agency.mxtr.uz/requests` -> So'rovlar
- `https://agency.mxtr.uz/requests?tab=interests` -> Qiziqish bildirganlar
- `https://agency.mxtr.uz/advertising` -> Reklama
- `https://agency.mxtr.uz/statistics` -> Statistika
- `https://agency.mxtr.uz/verification` -> Tasdiqlash
- `https://agency.mxtr.uz/profile` -> Profil

### Internal migration-safe mapping
- Keep existing internal data/UI modules and map canonical routes to existing `/agency/*` handlers via rewrite/route-layer mapping in implementation phase.
- Transitional redirects:
  - `mxtr.uz/agency*` -> `agency.mxtr.uz/*` equivalent

## 6. Required domain/middleware changes

### Required code areas
- `types/shared/routing.ts`
  - add new target (e.g., `'agency'`) to `DomainTarget`
- `lib/routing/domains.ts`
  - add `AGENCY_WEB_HOSTS = ['agency.mxtr.uz']`
  - resolve to new domain target
- `lib/routing/guards.ts`
  - enforce host-surface matrix for `mxtr` (public/user), `agency` (agency), `remote` (admin)
- `middleware.ts`
  - keep strict admin isolation for `remote.mxtr.uz`
  - disallow agency panel on `mxtr.uz`
  - disallow public/user/admin on `agency.mxtr.uz` except explicitly allowed agency auth entrypoints
  - preserve auth checks and role checks

### Domain rules target state
- `mxtr.uz` / `www.mxtr.uz`: public + user only
- `agency.mxtr.uz`: agency only
- `remote.mxtr.uz`: admin only

## 7. Required agency sidebar structure

Sidebar must be exactly:
1. Boshqaruv
2. Turlar
3. So'rovlar
4. Reklama
5. Statistika
6. Tasdiqlash
7. Profil

Notes:
- "Qiziqish bildirganlar" should be a separate tab inside `So'rovlar`, not a separate top-level sidebar item.
- Current web nav has separate `Leads` and `Interests`; this must be consolidated.

## 8. Required language/i18n plan (uz + ru)

### Current pattern found
- i18n already exists and supports only `uz` and `ru`:
  - `lib/i18n/config.ts`
  - `lib/i18n/context.tsx`
  - `lib/i18n/types.ts`
  - `lib/i18n/uz.ts`
  - `lib/i18n/ru.ts`
- Language persistence key: `maxtour-lang`
- Existing agency-related namespaces already present (`nav`, `agency`, `agencyTours`, `leadsPage`, `interestsPage`, `analytics`, `verification`, `statusLabels`, etc.)

### Plan
- Reuse existing i18n system (no new framework).
- Add/adjust only agency-domain-specific keys needed for:
  - Sidebar labels
  - Requests tabs (`So'rovlar`, `Qiziqish bildirganlar`)
  - Form labels, button states, empty states, errors, validation strings
- Keep keys typed through `lib/i18n/types.ts` to prevent missing translations.

## 9. Current Supabase tables/RPC/functions used by mobile agency panel

### Tables (mobile agency flows)
- `agencies`
- `profiles`
- `tours`
- `tour_images`
- `leads`
- `favorites`
- `call_tracking`
- `promotion_tiers`
- `tour_promotions`
- `maxcoin_transactions`
- `coin_requests`
- `verification_requests`
- `subscription_plans`
- `agency_subscriptions`
- `reviews`
- `agency_follows`

### RPC/functions observed in mobile agency-related code
- `get_verified_agencies_ranked`
- `get_agency_total_views`
- `get_agency_analytics`
- `promote_tour_fair_v1`
- `promote_tour_featured_fair_v1`
- `increment_view_count`
- Edge function invoke: `translate-tour`

## 10. Current agency auth/role/RLS assumptions from mobile

- Allowed roles include `user`, `agency_manager`, `admin` (`auth-store`).
- Agency panel screens are role-gated to `agency_manager`.
- Agency identity is derived from current session owner via `agencies.owner_id = session.user.id` (`getAgencyByOwnerId`).
- Agency-scoped read/write patterns always operate with `agency_id` or owned agency lookup before actions.
- Agency registration flow provisions:
  - `profiles` row with `role='agency_manager'`
  - `agencies` row tied to `owner_id`
- Social login path is user-only and blocks takeover of existing `agency_manager`.
- Data ownership assumptions rely on existing RLS and agency ownership filters; no bypass patterns should be added in web migration.

## 11. Tour creation form mapping from mobile (exact fields only)

Source: `src/screens/agency-panel/TourFormScreen.tsx` payload builder.

### Common/core fields
- `title`
- `slug`
- `cover_image_url`
- `full_description`
- `tour_type`
- `country`
- `city`
- `departure_date`
- `departure_month`
- `return_date`
- `duration_days`
- `duration_nights`
- `price`
- `old_price`
- `currency`
- `seats_total`
- `seats_left`
- `hotel_name`
- `hotel_stars`
- `hotel_booking_url`
- `hotel_images`
- `hotels`
- `combo_hotels`
- `destinations`
- `airline`
- `extra_charges`
- `variable_charges`
- `meal_type`
- `transport_type`
- `visa_required`
- `included_services`
- `excluded_services`
- `operator_telegram_username`
- `operator_phone`
- `category`
- `additional_info`
- `status`
- `agency_id`
- `updated_at`

### International tourism mapping (mobile)
- `tour_type='international'`
- `country` required in save validation
- `currency='USD'`
- `airline` allowed
- `transport_type` from selected transport
- `visa_required` from selected flag
- Combo rule: if combo, at least 2 destinations

### Domestic tourism mapping (mobile)
- `tour_type='domestic'`
- `country` forced to `"O'zbekiston"`
- `city` mapped from `district`
- `currency='UZS'`
- `transport_type='bus'`
- `visa_required=false`
- Domestic-only fields:
  - `domestic_category`
  - `region`
  - `district`
  - `meeting_point`
  - `what_to_bring`
  - `guide_name`
  - `guide_phone`
- Step validation requires:
  - `region`, `district`, `domestic_category` before advancing
  - `meeting_point`, `guide_name`, `guide_phone` on domestic final step

## 12. Current agency leads/requests logic from mobile

- Query source: `features/leads/queries.ts` (`leads` table)
- `getLeadsByAgency(agencyId)`:
  - selects lead rows with joined tour fields
  - ordered by `created_at desc`
- `updateLeadStatus(leadId, status)`:
  - updates `status`, `updated_at`
- `submitLead` (user flow) inserts lead with:
  - `tour_id`, `agency_id`, `user_id`, `full_name`, `phone`, `people_count`, `telegram_username`, `comment`, `status='new'`
- Screen behavior:
  - status filters and inline status change (`new`, `contacted`, `closed`, `won`, `lost`)
  - realtime subscription on `leads` changes filtered by `agency_id`

## 13. Current interested-users / qiziqish bildirganlar logic from mobile

- Primary interest source: `favorites` table, not `leads`
- `getInterestsByAgency(agencyId)`:
  - `favorites` joined with `tours` (inner join) and `profiles`
  - filtered by `tour.agency_id = agencyId`
- Mobile Interests screen has two tabs:
  - `interests` (favorites-derived "interested users")
  - `leads` (request list using `getLeadsByAgency`)
- Migration implication:
  - Web `So'rovlar` section should include both tabs
  - `Qiziqish bildirganlar` tab must map to favorites logic

## 14. Current ads/reklama logic from mobile

- Data load combines:
  - `getMaxCoinBalance`
  - `getPromotionTiers`
  - `getActivePromotions`
  - `getMaxCoinTransactions`
  - `getAgencyTours` (then filtered to `status='published'` for promote selection in UI)
- Purchase flow:
  - `purchaseMaxCoins(agencyId, coins)` inserts into `coin_requests` with `status='pending'`
  - allowed range in mobile flow: `5..200`
- Promote flow:
  - placement-level lock check via active `tour_promotions`
  - RPC-only server-authoritative purchase:
    - `promote_tour_featured_fair_v1` for featured
    - `promote_tour_fair_v1` for hot placements
  - handles status `active` or `waitlist`
  - handles errors like insufficient balance, already promoted/waitlisted, active placement locked
- Active promotions UI includes waitlist presentation.

## 15. Current statistics/statistika logic from mobile

- Source function: `getAgencyAnalytics(agencyId)` in `features/interests/queries.ts`
- Preferred path:
  - RPC `get_agency_analytics`
- Fallback path:
  - published agency tours + counts from `favorites` and `call_tracking`
- Analytics screen also fetches total leads count (`getAgencyLeadsCount`) for request total summary.

## 16. Current verification/tasdiqlash logic from mobile

- Request history source:
  - `getMyVerificationRequests(agencyId)` from `verification_requests`, newest first
- Submission source:
  - `submitVerificationFormRequest(agencyId, formData)`
  - blocks duplicate pending request (`status='pending'` guard)
- Form fields in use:
  - `company_name`
  - `registered_name`
  - `country` (default `"O'zbekiston"`)
  - `office_address`
  - `work_phone`
  - `work_email`
  - `telegram_link`
  - `instagram_url`
  - `website_url`
  - `inn`
  - `registration_number`
  - `certificate_pdf_url`
  - `license_pdf_url`
- Status handling in UI:
  - `pending`, `approved`, `rejected`
  - renders latest status banners and history list

## 17. Current agency profile/profil logic from mobile

- Agency identity:
  - fetched by owner (`getAgencyByOwnerId`)
- Update flow:
  - `updateAgencyProfile(agencyId, updates)` with fields:
    - `logo_url`, `name`, `slug`, `description`, `phone`, `telegram_username`, `instagram_url`, `website_url`, `address`, `city`, `country`, `google_maps_url`, `inn`, `responsible_person`, `certificate_pdf_url`, `license_pdf_url`
- Profile completeness (mobile):
  - requires `name`, `description`, `phone`, `address`, `city`, `inn`, `responsible_person`
- Dashboard uses completeness to gate important actions and show warnings.

## 18. Design system/component plan (animate-ui, shared-ui, Pioneer UI)

### Current availability in MaxTour
- `components/shared-ui/*` exists (`page-title`, `section-shell`, index export)
- `components/animate-ui/*` exists (tabs, sheet, sidebar, buttons, effects, etc.)
- `components/pioneerui/*` exists (`fluid-tabs`, `glass-card`, `glow-card`, `hero-gradient`, etc.)
- `framer-motion` and `motion` are already installed in `package.json`
- `lucide-react` already installed and currently used

### Plan
- Prioritize existing shared project patterns:
  - `shared-ui` + existing `components/ui/*` primitives first
  - Reuse existing dashboard shell concepts, but scoped to agency domain surface
- Use `animate-ui` selectively for meaningful transitions (tab switch, section transitions), not heavy decorative motion.
- Pioneer UI usage policy for implementation phase:
  - only use existing local files under `components/pioneerui`
  - if any Pioneer component is added/used, document before code change:
    - component name
    - source path/command
    - target files
    - dependencies
    - overwrite impact

## 19. Files likely to change later

- Domain/routing/middleware:
  - `types/shared/routing.ts`
  - `lib/routing/domains.ts`
  - `lib/routing/guards.ts`
  - `middleware.ts`
- Agency navigation/layout/surface:
  - `components/shared/dashboard-nav.tsx`
  - `components/layouts/agency-dashboard-layout.tsx`
  - `app/(agency)/layout.tsx`
  - agency route files under `app/(agency)/agency/**`
- Public surface touchpoints to remove internal `/agency` exposure:
  - `components/shared/public-desktop-sidebar.tsx`
  - `app/(public)/profile/auth-screen.tsx`
  - `app/(public)/profile/user-profile-view.tsx`
- i18n updates for new sidebar/tab structure:
  - `lib/i18n/types.ts`
  - `lib/i18n/uz.ts`
  - `lib/i18n/ru.ts`

## 20. Explicit files that must not be changed

- Entire mobile repo (read-only source of truth):
  - `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\**`
- Admin panel code (must stay stable for `remote.mxtr.uz`):
  - `app/(admin)/**`
  - `components/layouts/admin-dashboard-layout.tsx`
  - `features/admin/**`
  - Admin docs:
    - `docs/ADMIN_PANEL.md`
    - `docs/admin_design.md`
- Supabase schema/migrations/RLS/function definitions:
  - `supabase/migrations/**` (no migration changes)
  - no direct schema/RLS/function modifications without explicit approval

## 21. Risks and open questions

### Risks
- Domain split regression risk if host rules are incomplete (accidental exposure of agency/admin routes).
- Auth/session cookie behavior across subdomains may alter perceived SSO behavior (`mxtr.uz` vs `agency.mxtr.uz`).
- Mobile parity gaps currently present in web:
  - tour list/status behavior mismatch (`getToursByAgency` filtering differences)
  - advertising flow may diverge from mobile RPC-first pattern
  - tour form destination handling differences for non-combo mode
  - profile completeness criteria mismatch between web and mobile
- Translation completeness risk for newly introduced labels/errors in `uz`/`ru`.

### Open questions
- Canonical URL style on agency domain:
  - root-based (`/tours`, `/requests`) vs retained prefixed (`/agency/tours`) URLs
- Whether `mxtr.uz` should keep a visible external "Agency panel" CTA or hide it completely except role-gated profile actions.
- Whether subscriptions stay visible in agency surface when mobile currently disables functional subscription fetching (`SUBSCRIPTIONS_ENABLED=false`).

## 22. Step-by-step implementation plan

1. Finalize URL strategy for `agency.mxtr.uz` (recommended canonical root-based routes) and redirect rules from old `/agency*`.
2. Implement domain typing and host resolution updates (`types/shared/routing.ts`, `lib/routing/domains.ts`).
3. Implement domain access guard rules in `lib/routing/guards.ts` and `middleware.ts` with strict host-surface separation.
4. Keep existing agency business logic modules; remap route surface only.
5. Rebuild agency sidebar IA to exact required 7 sections.
6. Consolidate `Leads + Interests` into `So'rovlar` section with `Qiziqish bildirganlar` tab.
7. Ensure agency auth redirects from public profile/auth now point to `agency.mxtr.uz` safe entrypoint.
8. Preserve mobile parity for:
  - tour form fields and validation behavior
  - leads status flow
  - interests/favorites logic
  - maxcoin promotion RPC behavior
  - verification pending guard and form fields
9. Update i18n keys/messages in `uz` and `ru` for all agency labels/buttons/errors/empty states.
10. Regression test matrix:
  - `mxtr.uz`: public/user only
  - `agency.mxtr.uz`: agency only
  - `remote.mxtr.uz`: admin only
  - role-based redirects and unauthorized access cases
11. Update deployment/domain docs after implementation is validated.

## 23. Domain/routing implementation notes (2026-05-03)

### Summary
- Implemented host-level foundation for `agency.mxtr.uz` without changing admin internals, public/user UI design, or Supabase schema.
- Enforced production domain split while keeping unknown/dev hosts usable for local development.
- Added agency role enforcement (`agency_manager`) at middleware level to avoid redirect loops on agency host.

### Domain behavior implemented
- `mxtr.uz` / `www.mxtr.uz`
  - Public + user routes remain accessible.
  - `/admin*` redirects to `https://remote.mxtr.uz/admin*` (existing behavior preserved).
  - `/agency*` now redirects to `https://agency.mxtr.uz/agency*`.
- `agency.mxtr.uz`
  - `/` redirects to `/agency` (agency dashboard entry route).
  - Any non-`/agency*` route redirects to `/agency`.
  - `/agency*` requires authenticated session and `profiles.role = 'agency_manager'`.
  - Unauthenticated users are redirected to `https://mxtr.uz/profile` (existing login/register flow), with `next` param pointing back to agency path.
  - Authenticated non-agency users are redirected to profile flow; authenticated admins are redirected to `https://remote.mxtr.uz/admin`.
- `remote.mxtr.uz`
  - Existing admin-only `/admin*` behavior unchanged.
- Unknown/dev hosts
  - Domain split is not enforced, so local preview remains usable.
  - Existing `/agency*` auth protection still applies.

### Files changed (implementation)
- `types/shared/routing.ts`
- `lib/routing/domains.ts`
- `lib/routing/guards.ts`
- `middleware.ts`
- `docs/agency_panel_design.md`

### Local test URLs
- Public/user on local host:
  - `http://localhost:3000/`
  - `http://localhost:3000/profile`
- Agency routes on local host (dev preview):
  - `http://localhost:3000/agency`
  - `http://localhost:3000/agency/tours`
  - `http://localhost:3000/agency/leads`
- Host simulation for production behavior (using hosts file / proxy):
  - `https://mxtr.uz/agency` -> should redirect to `https://agency.mxtr.uz/agency`
  - `https://agency.mxtr.uz/` -> should redirect to `/agency`
  - `https://agency.mxtr.uz/profile` -> should redirect to `/agency` (then auth/role handling)
  - `https://mxtr.uz/admin` -> should redirect to `https://remote.mxtr.uz/admin`

### QA checklist
- [ ] `mxtr.uz` shows public/user pages normally.
- [ ] `mxtr.uz/agency*` does not render agency panel directly; redirects to `agency.mxtr.uz`.
- [ ] `agency.mxtr.uz/` redirects to `/agency`.
- [ ] `agency.mxtr.uz` non-agency paths redirect to `/agency`.
- [ ] Unauthenticated access to `agency.mxtr.uz/agency*` goes to existing profile login/register flow.
- [ ] Authenticated `agency_manager` can access all `agency` routes on agency host.
- [ ] Authenticated non-`agency_manager` cannot access agency panel routes.
- [ ] `remote.mxtr.uz/admin*` remains admin-only and unchanged.
- [ ] Unknown/dev hosts still allow local route preview and do not force production host redirects.
- [ ] No changes in admin internals, mobile repo, or Supabase schema/migrations.

## 24. Agency shell implementation notes (2026-05-03)

### What was changed
- Built a dedicated agency dashboard shell refinement for agency surface:
  - premium sidebar styling and active-route emphasis
  - desktop workspace topbar with section-aware title/description
  - profile summary + language access in shell UI
- Updated agency sidebar structure to exactly 7 primary items:
  1. Boshqaruv
  2. Turlar
  3. So'rovlar
  4. Reklama
  5. Statistika
  6. Tasdiqlash
  7. Profil
- Consolidated navigation behavior so `Qiziqish bildirganlar` lives as a tab inside the So'rovlar surface (not a separate sidebar entry).
- Added a dedicated `agency/requests` route that reuses existing interests/leads business logic and UI data sources.

### Files changed
- `components/shared/dashboard-nav.tsx`
- `components/layouts/agency-dashboard-layout.tsx`
- `app/(agency)/agency/requests/page.tsx` (new)
- `app/(agency)/agency/interests/page.tsx`
- `app/(agency)/agency/interests/interests-content.tsx`
- `app/(agency)/agency/agency-dashboard-content.tsx`
- `docs/agency_panel_design.md`

### Components used
- Existing project/shared UI:
  - `components/shared/dashboard-nav`
  - `components/shared/language-switcher`
  - `components/shared/app-header`
  - `components/ui/sheet`
  - `components/ui/card`
  - `components/shared/empty-state`
  - `components/shared/status-badge`
- Hooks/services:
  - `hooks/use-profile`
  - existing Supabase client/query functions already used by agency pages
- Pioneer UI usage:
  - No new Pioneer UI components were added in this step.

### i18n structure
- Reused existing project i18n pattern:
  - `lib/i18n/context.tsx`
  - `lib/i18n/config.ts` (`uz` / `ru`, default `uz`)
  - existing translation dictionaries and keys (`nav`, `agency`, `leadsPage`, `interestsPage`, `analytics`, etc.)
- No external i18n libraries added.
- Agency shell labels/routes rely on existing translation keys so sidebar/topbar/tabs remain language-ready in `uz` and `ru`.

### Sidebar routes
- `/agency` -> Boshqaruv
- `/agency/tours` -> Turlar
- `/agency/requests` -> So'rovlar
  - tab `leads` (default): so'rovlar
  - tab `interests`: qiziqish bildirganlar
- `/agency/advertising` -> Reklama
- `/agency/analytics` -> Statistika
- `/agency/verification` -> Tasdiqlash
- `/agency/profile` -> Profil

### Local test URL
- Primary local shell URL:
  - `http://localhost:3000/agency`
- Route checks:
  - `http://localhost:3000/agency/tours`
  - `http://localhost:3000/agency/requests`
  - `http://localhost:3000/agency/requests?tab=interests`
  - `http://localhost:3000/agency/advertising`
  - `http://localhost:3000/agency/analytics`
  - `http://localhost:3000/agency/verification`
  - `http://localhost:3000/agency/profile`

### Manual QA checklist
- [ ] Sidebar shows exactly 7 items in correct order.
- [ ] No separate sidebar item for interests; interests appears as tab inside So'rovlar page.
- [ ] Active route state is visually clear across all 7 sections.
- [ ] Desktop topbar updates title/description by current agency section.
- [ ] Language switcher is available from agency shell and updates labels.
- [ ] Mobile header/menu still opens agency navigation and logout correctly.
- [ ] Agency dashboard quick links now send requests flow to `/agency/requests`.
- [ ] Existing agency data pages still load without business-logic regressions.
- [ ] Admin pages/components remain unchanged.
- [ ] Public/user pages remain unchanged.

## 25. Boshqaruv dashboard redesign notes (2026-05-03)

### Scope executed
- Redesigned only the agency Boshqaruv dashboard surface (`/agency`) for agency host usage.
- No admin-panel internals changed.
- No public/user page redesign changed.
- No Supabase schema/RLS/migration changes.

### Files changed in this task
- `app/(agency)/agency/page.tsx`
- `app/(agency)/agency/agency-dashboard-content.tsx`
- `lib/i18n/types.ts`
- `lib/i18n/uz.ts`
- `lib/i18n/ru.ts`
- `docs/agency_panel_design.md`

### Mobile source-of-truth references used
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\screens\agency-panel\AgencyDashboardScreen.tsx`
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\features\agencies\queries.ts`
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\features\leads\queries.ts`
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\features\maxcoin\queries.ts`

### Dashboard data sources used (web)
- Agency/profile base:
  - `getMyAgency()` from `features/agencies/queries.ts`
  - `isAgencyProfileComplete()` from `features/agencies/queries.ts`
- Tours summary:
  - `tours` table (`status='published'`) for active tours
  - `tours` table (`view_count`) for total views
  - `tours` table (published list) for promo candidate card
- Leads summary:
  - `leads` table total count
  - `leads` table recent list filtered to last **48 hours** (mobile parity)
- Interested users summary:
  - `getInterestsByAgency()` from `features/interests/queries.ts`
- Reklama summary:
  - `getActivePromotions()` from `features/maxcoin/queries.ts`
  - `getMaxCoinBalance()` from `features/maxcoin/queries.ts`
- Statistika preview:
  - `getAgencyAnalytics()` from `features/interests/queries.ts`
  - totals derived from returned per-tour `interests/calls/telegram`
- Verification summary:
  - `getMyVerificationRequests()` from `features/verification/actions.ts`
  - latest request status/date + current `agencies.is_verified/is_approved`
- Plan/subscription summary (existing logic only):
  - `getAgencyTourLimit()` from `features/agencies/queries.ts`

### Logic parity and intentional handling
- Recent leads window aligned from 24h to **48h** to match mobile dashboard behavior.
- Active tours remains `status='published'`.
- Total views now sums agency tour `view_count` from all agency tours loaded in dashboard query path.
- No fake metrics introduced; cards render only from existing data sources.

### Components used
- Shared/UI:
  - `components/ui/card`
  - `components/ui/button`
  - `components/ui/badge`
  - `components/shared/status-badge`
- Pioneer UI (already present, reused only):
  - `components/pioneerui/glow-card`
  - `components/pioneerui/glass-card`
- Icons:
  - existing `lucide-react` package
- No new dependencies installed.

### i18n updates
- Reused existing project i18n pattern (`uz`/`ru`) and added agency-dashboard-specific keys only:
  - `overviewSubtitle`
  - `requestsLast48h`
  - `verificationStatusLabel`
  - `verificationLastRequestLabel`
  - `verificationNotSubmitted`
  - `trackedToursLabel`
  - `planUsageLabel`
  - `planRemainingLabel`
  - `recentLeadsSubtitle`
  - `dashboardErrorTitle`
  - `dashboardErrorHint`
  - `loadErrorAction`

### Local test URL
- Main dashboard:
  - `http://localhost:3000/agency`
- Related quick-action routes:
  - `http://localhost:3000/agency/tours/new`
  - `http://localhost:3000/agency/requests`
  - `http://localhost:3000/agency/verification`
  - `http://localhost:3000/agency/advertising`
  - `http://localhost:3000/agency/analytics`

### Manual QA checklist
- [ ] Boshqaruv page renders new shell and cards on desktop without touching admin/public layouts.
- [ ] Unauthenticated/role-gated behavior remains handled by existing agency guards.
- [ ] Missing-agency state shows setup CTA to `/agency/profile`.
- [ ] Error fallback state renders retry CTA.
- [ ] Profile incomplete banner appears when agency profile is incomplete.
- [ ] Leads summary and recent list use last 48h window.
- [ ] Verification summary reflects latest request status (`pending/approved/rejected`) or not-submitted state.
- [ ] Interests/reklama/statistics previews show real counts only.
- [ ] Plan summary displays existing limit data when available.
- [ ] Uzbek and Russian language switch updates all new dashboard labels/states.

## 26. Turlar redesign implementation notes (2026-05-03)

### Scope executed
- Redesigned only agency `Turlar` routes/components for `agency.mxtr.uz` surface:
  - tour list UI
  - create/edit tour shell + form UX polish
  - mobile-parity validation checks for required fields
- No admin files changed.
- No public/user files changed.
- No `maxtour-mobile` files changed.
- No Supabase schema/RLS/migration changes.

### Exact maxtour-mobile files used as source-of-truth
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\screens\agency-panel\ToursListScreen.tsx`
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\screens\agency-panel\TourFormScreen.tsx`
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\features\agencies\queries.ts`
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\features\tours\queries.ts`
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\components\shared\ImageUploader.tsx`
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\components\shared\MultiImageUploader.tsx`
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\lib\upload.ts`

### Exact Xalqaro turizm fields (mobile parity)
- `tour_type='international'`
- `title`
- `slug`
- `cover_image_url`
- `full_description`
- `country`
- `city`
- `departure_date`
- `departure_month`
- `return_date`
- `duration_days`
- `duration_nights`
- `price`
- `old_price`
- `currency='USD'`
- `seats_total`
- `seats_left`
- `hotel_name`
- `hotel_stars`
- `hotel_booking_url`
- `hotel_images`
- `hotels`
- `combo_hotels`
- `destinations` (combo cities only when combo)
- `airline` (kept in payload; no extra UI invented)
- `extra_charges`
- `variable_charges`
- `meal_type`
- `transport_type`
- `visa_required`
- `included_services`
- `excluded_services` (empty array)
- `operator_telegram_username`
- `operator_phone`
- `category`
- `additional_info`
- `status`
- `agency_id`
- `updated_at`

### Exact Ichki turizm fields (mobile parity)
- `tour_type='domestic'`
- all common fields above, with mobile mapping:
  - `country = "O'zbekiston"`
  - `city = district`
  - `currency = 'UZS'`
  - `transport_type = 'bus'`
  - `visa_required = false`
  - `airline = null`
- domestic-only fields:
  - `domestic_category`
  - `region`
  - `district`
  - `meeting_point`
  - `what_to_bring`
  - `guide_name`
  - `guide_phone`

### Validation mapping from mobile
- Save checks mirrored:
  - required `title`
  - required `price` presence
  - international requires `country`
  - combo tours require at least 2 combo destinations
- Step-gating requirements mirrored in web pre-submit/pre-preview checks:
  - domestic: `region + district + domestic_category`
  - domestic: `meeting_point + guide_name + guide_phone`
- Removed stricter-than-mobile schema constraints (URL/title-length/price-positive enforcement) from web validator layer for tour form.

### Supabase tables / functions / storage used
- Tables:
  - `agencies` (resolve agency by `owner_id`)
  - `tours` (list, create, update, delete)
  - `tour_images` (existing joined structures remain compatible)
- Storage:
  - bucket `images` via existing web upload action flow
- RPC/functions:
  - no new RPC/function introduced in this task

### Files changed in this task
- `app/(agency)/agency/tours/agency-tours-content.tsx`
- `app/(agency)/agency/tours/new/new-tour-content.tsx`
- `app/(agency)/agency/tours/[id]/edit/edit-tour-content.tsx`
- `app/(agency)/agency/tours/tour-form.tsx`
- `lib/validators/index.ts`
- `lib/i18n/types.ts`
- `lib/i18n/uz.ts`
- `lib/i18n/ru.ts`
- `docs/agency_panel_design.md`

### Components used
- Existing shared/UI components:
  - `components/ui/card`
  - `components/ui/button`
  - `components/ui/input`
  - `components/ui/textarea`
  - `components/ui/dialog`
  - `components/shared/status-badge`
  - `components/shared/empty-state`
  - `components/shared/image-uploader`
  - `components/shared/multi-image-uploader`
- Existing icon package: `lucide-react`
- Pioneer UI components added: none in this step.

### What was intentionally not added
- No new tour fields beyond mobile/source fields.
- No new tables/RPCs/functions.
- No new backend schema logic.
- No admin/public routing or UI changes.
- No artificial/fake metrics/data in tour list.

### Local test URL
- `http://localhost:3000/agency/tours`
- `http://localhost:3000/agency/tours/new`
- `http://localhost:3000/agency/tours/<tour-id>/edit`

### Manual QA checklist
- [ ] Tour list renders only current agency tours.
- [ ] Tour list shows status badges and cover image preview when available.
- [ ] Tour list filter/search UI works client-side without changing backend logic.
- [ ] Create Xalqaro tour: required checks (`title`, `price`, `country`) match mobile behavior.
- [ ] Create Ichki tour: required checks (`region`, `district`, `domestic_category`, `meeting_point`, `guide_name`, `guide_phone`) match mobile behavior.
- [ ] Combo tour blocks submit if fewer than 2 combo destinations.
- [ ] Image upload works through existing safe upload flow.
- [ ] Submit for review sets pending behavior and success flow.
- [ ] Draft save flow works.
- [ ] Edit tour flow works for existing tours.
- [ ] uz/ru language switch updates new Turlar labels.
- [ ] No admin regression (`remote.mxtr.uz`).
- [ ] No public/user regression (`mxtr.uz`).

## 27. So'rovlar redesign implementation notes (2026-05-03)

### Scope executed
- Redesigned only agency `So'rovlar` surface on `/agency/requests`.
- Kept sidebar item as `So'rovlar`; implemented in-page tabs:
  - `So'rovlar`
  - `Qiziqish bildirganlar`
- No admin panel internals changed.
- No public/user page files changed.
- No Supabase schema/RLS/migration changes.

### Mobile source-of-truth references used
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\screens\agency-panel\LeadsScreen.tsx`
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\screens\agency-panel\InterestsScreen.tsx`
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\features\leads\queries.ts`
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\features\interests\queries.ts`

### Data sources and logic mapping
- Leads (So'rovlar tab):
  - `features/leads/queries.ts#getLeadsByAgency`
  - table: `leads`
  - joined tour info: `tours(id, title, slug, cover_image_url, country, city)`
  - status update flow: client update on `leads.status` + `updated_at` (mobile parity).
- Interested users (`Qiziqish bildirganlar` tab):
  - `features/interests/queries.ts#getInterestsByAgency`
  - table: `favorites`
  - joined tour info: `tours(id, title, slug, country, city, cover_image_url)`
  - joined profile info: `profiles(full_name, phone, telegram_username, avatar_url)`
  - filtered to agency-owned tours through existing agency query flow.

### UX delivered in this step
- Tabs in required order with So'rovlar as default.
- Search/filter/sort:
  - So'rovlar: search + status filter + newest/oldest sort
  - Qiziqish bildirganlar: search + newest/oldest sort
- Detail drawer (`Sheet`) for both tabs with linked tour and contact actions.
- Safe contact copy action with success/error toasts.
- Loading state for status mutation, plus empty/no-filter-result states.
- uz/ru text coverage for all newly added So'rovlar strings.

### Files changed in this task
- `app/(agency)/agency/requests/page.tsx`
- `app/(agency)/agency/requests/requests-content.tsx` (new)
- `features/leads/queries.ts`
- `features/interests/queries.ts`
- `lib/i18n/types.ts`
- `lib/i18n/uz.ts`
- `lib/i18n/ru.ts`
- `docs/agency_panel_design.md`

### Components used
- Shared UI:
  - `components/ui/tabs`
  - `components/ui/card`
  - `components/ui/input`
  - `components/ui/select`
  - `components/ui/sheet`
  - `components/ui/button`
  - `components/shared/empty-state`
  - `components/shared/status-badge`
- Pioneer UI (already installed, reused):
  - `components/pioneerui/glow-card`
- Existing packages only:
  - `lucide-react`
  - `sonner`
- No new dependency installed.
- No Pioneer component copied/overwritten.

### Local test URL
- `http://localhost:3000/agency/requests`
- Optional tab query:
  - `http://localhost:3000/agency/requests?tab=leads`
  - `http://localhost:3000/agency/requests?tab=interests`

### Manual QA checklist
- [ ] Sidebar `So'rovlar` opens `/agency/requests`.
- [ ] Tabs render in exact order: `So'rovlar` then `Qiziqish bildirganlar`.
- [ ] So'rovlar tab shows only current agency leads.
- [ ] Qiziqish bildirganlar tab shows favorites/interested users from agency tours only.
- [ ] Linked tour info is visible in cards/detail drawer.
- [ ] Lead status update works and persists.
- [ ] Search/filter/sort work on both tabs.
- [ ] Contact call/telegram actions and copy contact action work.
- [ ] Loading/empty/error states render appropriately.
- [ ] uz/ru switch updates So'rovlar labels and messages.
- [ ] No admin regression (`remote.mxtr.uz`).
- [ ] No public/user regression (`mxtr.uz`).

## 28. Reklama redesign implementation notes (2026-05-04)

### Scope executed
- Redesigned only agency `Reklama` UI surface on `/agency/advertising`.
- Preserved existing MaxCoin/promotions data and action contracts.
- No admin promotions files changed.
- No public/user files changed.
- No Supabase schema/RLS/migration changes.

### Mobile source-of-truth references used
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\screens\agency-panel\AdvertisingScreen.tsx`
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\features\maxcoin\queries.ts`

### Data sources and logic used in web
- Page load:
  - `getMaxCoinBalance(agencyId)`
  - `getPromotionTiers()`
  - `getActivePromotions(agencyId)`
  - `getMaxCoinTransactions(agencyId)`
  - `getToursByAgency(agencyId)` (promote selector uses published tours only, mobile parity)
- Action flows (unchanged):
  - `purchaseMaxCoins(agencyId, coins)` from `features/maxcoin/actions.ts`
  - `promoteTour(agencyId, tourId, tierId)` from `features/maxcoin/actions.ts`
- Pricing retained:
  - `COIN_PRICE_UZS = 15000`
  - slider range logic retained (`5..200`)

### UI/UX delivered in this step
- Premium Reklama shell with:
  - balance overview
  - active promotions count
  - available placement count
- Tabs:
  - promote flow
  - coin purchase flow
  - history/ledger flow
- Placement cards and placement-tier picker from real `promotion_tiers`.
- Active promotions list from real `tour_promotions`.
- History list from real `maxcoin_transactions`.
- Empty states:
  - no active promotions
  - no published tours for boost
  - no history rows
- Loading states:
  - buy in-progress
  - promote in-progress
- Error states:
  - action error banner + toast from returned action errors
- uz/ru localization preserved via existing `maxcoin`, `empty`, `errors`, `agency`, `common` keys.

### Components used
- Shared/UI:
  - `components/ui/button`
  - `components/ui/card`
  - `components/ui/tabs`
  - `components/shared/empty-state`
  - `components/shared/status-badge`
- Pioneer UI (already present, reused):
  - `components/pioneerui/glow-card`
  - `components/pioneerui/glass-card`
- Existing icon/package stack only:
  - `lucide-react`
  - `sonner`
- No new dependencies installed.
- No Pioneer component copied or overwritten.

### Files changed in this task
- `app/(agency)/agency/advertising/advertising-content.tsx`
- `docs/agency_panel_design.md`

### Local test URL
- `http://localhost:3000/agency/advertising`

### Manual QA checklist
- [ ] Balance card shows real agency MaxCoin value.
- [ ] Placement cards reflect real `promotion_tiers` availability.
- [ ] Promote selector includes only published agency tours.
- [ ] Promote flow works with existing action logic and updates UI after refresh.
- [ ] Insufficient balance path is shown as error state.
- [ ] Buy flow sends coin request and shows success modal.
- [ ] Active promotions list renders from real data; empty state renders when none.
- [ ] History tab renders ledger rows from real transactions; empty state when none.
- [ ] uz/ru switch updates Reklama labels/messages.
- [ ] No admin regression (`remote.mxtr.uz`).
- [ ] No public/user regression (`mxtr.uz`).

## 29. Statistika redesign implementation notes (2026-05-04)

### Scope executed
- Redesigned only agency `Statistika` surface on `/agency/analytics`.
- Kept analytics logic aligned to maxtour-mobile source patterns for agency metrics aggregation.
- Used real Supabase data only; no synthetic/fake charts or fabricated KPIs.
- No admin files changed.
- No public/user files changed.
- No Supabase schema/RLS/migration changes.

### Mobile source-of-truth references used
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\screens\agency-panel\AnalyticsScreen.tsx`
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\features\interests\queries.ts`
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\features\leads\queries.ts`
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\features\agencies\queries.ts`
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\features\maxcoin\queries.ts`

### Data sources and logic used in web
- Mobile-parity aggregate path:
  - `features/interests/queries.ts#getAgencyAnalytics(agencyId)`
  - Preferred RPC: `get_agency_analytics(agency_id_input)`
  - Fallback aggregation from: `tours`, `favorites`, `call_tracking`
- Additional real metric feeds on `/agency/analytics`:
  - `tours` (`view_count`, status, publish set for performance ranking)
  - `leads` (agency-scoped lead events)
  - `favorites` (interested users + per-tour interests)
  - `call_tracking` (call/telegram events)
  - `tour_promotions` (promotion activity and active state)
  - `maxcoin_transactions` (`spend_*` types for promotion spend)
  - `agency_follows` (followers count)
  - `agencies` fields from `getMyAgency` (profile views, avg rating, review count)

### Metrics surfaced (only if real fields/data exist)
- Views summary: sum of `tours.view_count`.
- Leads summary: count of agency leads in selected range.
- Interested users summary: unique `favorites.user_id` in selected range.
- Tour performance: per-tour interactions (interests + leads + calls + telegram), top tours, and interaction-to-lead ratio.
- Agency profile performance: profile views, followers, average rating, review count, profile-view-to-lead conversion.
- Promotion performance: active promotions, launches in range, MaxCoin spend from real ledger rows.
- Date range filters: `7d`, `30d`, `90d`, `all`.

### Loading / empty / error states
- Load error banner with retry action when analytics fetch fails.
- Empty state when no analytics/event data exists.
- In-range loading indicator on date filter switch.
- Promotion empty hint when no promotion rows exist in selected range.

### i18n updates (uz/ru)
- Added analytics language keys for:
  - date range labels
  - interested users
  - tour/profile/promotion performance blocks
  - followers/profile views/rating/reviews
  - conversion labels
  - top tours and analytics load error title
- Implemented in:
  - `lib/i18n/types.ts`
  - `lib/i18n/uz.ts`
  - `lib/i18n/ru.ts`

### Components used
- Shared/UI:
  - `components/ui/button`
  - `components/ui/card`
  - `components/shared/empty-state`
- Pioneer UI (already present, reused):
  - `components/pioneerui/glow-card`
  - `components/pioneerui/glass-card`
- Existing icon/package stack only:
  - `lucide-react`
- No new dependencies installed.
- No Pioneer component copied or overwritten.

### Files changed in this task
- `app/(agency)/agency/analytics/page.tsx`
- `app/(agency)/agency/analytics/analytics-content.tsx`
- `features/interests/queries.ts`
- `lib/i18n/types.ts`
- `lib/i18n/uz.ts`
- `lib/i18n/ru.ts`
- `docs/agency_panel_design.md`

### What was intentionally not added
- No invented metrics/KPIs beyond available fields and existing mobile/web logic.
- No external chart dependency; visual summaries use existing Tailwind/UI components.
- No payment/pricing algorithm changes.
- No RPC/table/schema additions.

### Local test URL
- `http://localhost:3000/agency/analytics`

### Manual QA checklist
- [ ] Analytics page loads on agency domain/path and shows real data only.
- [ ] Date range switch (`7d/30d/90d/all`) updates cards and sections.
- [ ] Views/leads/interested users totals match underlying rows for selected period.
- [ ] Top tours ranking reflects real interaction aggregates.
- [ ] Profile performance block reflects real agency profile/follow data.
- [ ] Promotion performance reflects real promotion + MaxCoin spend rows.
- [ ] Loading state appears during range switch.
- [ ] Empty state appears when agency has no analytics data.
- [ ] Error banner appears on failed load and retry refresh works.
- [ ] uz/ru switch updates all Statistika labels/messages.
- [ ] No admin regression (`remote.mxtr.uz`).
- [ ] No public/user regression (`mxtr.uz`).

## 30. Tasdiqlash redesign implementation notes (2026-05-04)

### Scope executed
- Redesigned only agency `Tasdiqlash` surface on `/agency/verification`.
- Kept mobile/source-of-truth verification field set, status handling, and submit flow.
- Preserved existing safe PDF upload flow and storage behavior.
- No admin verification pages/components modified.
- No public/user pages modified.
- No Supabase schema/RLS/migration changes.

### Mobile source-of-truth references used
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\screens\agency-panel\VerificationScreen.tsx`
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\features\verification\queries.ts`
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\components\shared\DocumentUploader.tsx`

### Existing web data/action sources used
- `features/agencies/queries.ts#getMyAgency` (resolve current agency)
- `features/verification/actions.ts#getMyVerificationRequests`
- `features/verification/actions.ts#submitVerificationFormRequest`
- `features/upload/actions.ts#uploadPdfAction`

### Form/field mapping aligned to mobile
- Form payload object remains:
  - `company_name`
  - `registered_name`
  - `country`
  - `office_address`
  - `work_phone`
  - `work_email`
  - `telegram_link`
  - `instagram_url`
  - `website_url`
  - `inn`
  - `registration_number`
  - `certificate_pdf_url`
  - `license_pdf_url`
- Fields shown in UI were kept aligned to mobile screen:
  - company section: `company_name`, `registered_name`, fixed `country`, `office_address`, `work_phone`, `work_email`, `telegram_link`, `instagram_url`
  - legal section: `inn`, `certificate_pdf_url`, `license_pdf_url`
- Validation gate aligned to mobile logic:
  - required for submit: `company_name`, `registered_name`, `office_address`, `work_phone`, `work_email`, `telegram_link`, `inn`
  - pending-request block preserved: submit disabled when a pending request exists

### Status and reason handling
- Current verification status uses latest `verification_requests` row.
- Supported statuses:
  - `pending`
  - `approved`
  - `rejected`
- Rejection reason shown from `admin_note` when available.
- Agency-level badges (`is_approved`, `is_verified`) are shown as separate status cards.

### Upload logic preserved
- PDF upload remains via existing server action:
  - `uploadPdfAction`
  - content type: `application/pdf`
  - max size: `10MB`
  - storage bucket: `images`
  - folders: `certificates` / `licenses`

### UX/state coverage
- Premium desktop-first shell with gradient overview and structured cards.
- Loading states:
  - document upload spinner
  - submit spinner
- Empty states:
  - no verification request yet
  - no submission history
- Error states:
  - inline action error banner
  - toast feedback for submit/upload failures

### i18n updates (uz/ru)
- Added verification keys:
  - `latestRequestTitle`
  - `submittedAt`
  - `updatedAt`
  - `noRequestYetTitle`
  - `historyTitle`
  - `historyEmptyTitle`
  - `historyEmptyHint`
  - `formLockedTitle`
  - `formLockedHint`
  - `requiredFieldsHint`
- Implemented in:
  - `lib/i18n/types.ts`
  - `lib/i18n/uz.ts`
  - `lib/i18n/ru.ts`

### Components used
- Shared/UI:
  - `components/ui/button`
  - `components/ui/card`
  - `components/ui/input`
  - `components/ui/label`
  - `components/shared/status-badge`
  - `components/shared/empty-state`
- Pioneer UI (already present, reused):
  - `components/pioneerui/glow-card`
  - `components/pioneerui/glass-card`
- Existing icon/package stack only:
  - `lucide-react`
  - `sonner`
- No new dependencies installed.
- No Pioneer component copied or overwritten.

### Files changed in this task
- `app/(agency)/agency/verification/verification-content.tsx`
- `lib/i18n/types.ts`
- `lib/i18n/uz.ts`
- `lib/i18n/ru.ts`
- `docs/agency_panel_design.md`

### What was intentionally not added
- No invented verification fields/documents.
- No new verification tables/RPCs/backend flows.
- No admin moderation flow changes.
- No custom schema or status expansion beyond existing values.

### Local test URL
- `http://localhost:3000/agency/verification`

### Manual QA checklist
- [ ] Verification page loads current agency data.
- [ ] Latest request status card matches real `verification_requests` status.
- [ ] Rejection path shows `admin_note` reason when present.
- [ ] Pending request hides/disables form submission (mobile parity).
- [ ] Submit gate requires only mobile-required fields (`company_name`, `registered_name`, `office_address`, `work_phone`, `work_email`, `telegram_link`, `inn`).
- [ ] PDF upload works for certificate/license via existing safe upload action.
- [ ] File replace/remove behavior works for both documents.
- [ ] Submit creates a new verification request when no pending request exists.
- [ ] History list renders existing requests with status badges and dates.
- [ ] Empty states render for no-request/no-history scenarios.
- [ ] uz/ru switch updates Tasdiqlash labels/messages.
- [ ] No admin regression (`remote.mxtr.uz`).
- [ ] No public/user regression (`mxtr.uz`).

## 31. Profil redesign implementation notes (2026-05-04)

### Scope executed
- Redesigned only agency `Profil` surface on `/agency/profile`.
- Preserved agency profile business/update logic and existing safe upload actions.
- Added profile summary cards from existing supported data sources (verification, plan usage, MaxCoin, followers, owner/manager details).
- No user public profile pages changed.
- No admin files changed.
- No Supabase schema/RLS/migration changes.

### Mobile source-of-truth references used
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\screens\agency-panel\AgencyEditScreen.tsx`
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\features\agencies\queries.ts`
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\components\shared\ImageUploader.tsx`

### Existing web logic/data reused
- Profile read/update:
  - `features/agencies/queries.ts#getMyAgency`
  - `features/agencies/actions.ts#upsertAgencyProfileAction`
  - `features/agencies/actions.ts#getMyAgencyAction`
- Upload flows:
  - logo/image: existing `components/shared/image-uploader` -> `uploadImageAction`
  - certificate/license PDF: `features/upload/actions.ts#uploadPdfAction`
- Summary signals:
  - followers: `getAgencyFollowersCount(agency.id)`
  - MaxCoin balance: `getMaxCoinBalance(agency.id)`
  - plan usage: `getAgencyTourLimit(agency.id)`
  - latest verification: `getMyVerificationRequests(agency.id)`
  - owner profile snippet: `profiles(full_name, phone, email, telegram_username, avatar_url)` by `agency.owner_id`

### Field/update mapping aligned to mobile profile logic
- Mobile profile field set mirrored in form:
  - `name`
  - `slug`
  - `description`
  - `phone`
  - `telegram_username`
  - `instagram_url`
  - `website_url`
  - `address`
  - `city`
  - `country`
  - `google_maps_url`
  - `inn`
  - `responsible_person`
- Existing agency document fields retained as optional and supported by existing action payload:
  - `certificate_pdf_url`
  - `license_pdf_url`
- Save gate aligned to mobile behavior:
  - only `name` required before submit
  - slug auto-derived safely when empty (`slugify(name)`)

### UI/UX delivered
- Premium desktop-first profile shell:
  - hero with agency identity and verification state
  - summary cards (MaxCoin, followers, current plan, verification status)
  - quick links to `Tasdiqlash`, `Reklama`, `Obuna`
- Structured profile sections:
  - identity/about
  - contact info
  - location/region-city
  - owner/manager summary
  - verification snapshot + last request/reason if available
  - legal/documents
- Edit form mode with grouped sections and improved clarity.
- Security section preserved.

### Loading / empty / error states
- Loading states:
  - save submit spinner
  - per-document PDF upload spinner
- Empty states:
  - missing agency setup prompt
  - missing description/contact/location plan fallback text
- Error states:
  - inline action error card
  - toast feedback on save/upload failures

### i18n updates (uz/ru)
- Added profile strings:
  - `agencyProfileForm.companyNameRequired`
  - `agencyView.noDescription`
  - `agencyView.ownerManager`
  - `agencyView.followers`
  - `agencyView.planNotAvailable`
- Implemented in:
  - `lib/i18n/types.ts`
  - `lib/i18n/uz.ts`
  - `lib/i18n/ru.ts`

### Components used
- Shared/UI:
  - `components/ui/button`
  - `components/ui/card`
  - `components/ui/input`
  - `components/ui/label`
  - `components/ui/textarea`
  - `components/shared/image-uploader`
  - `components/shared/status-badge`
  - `components/shared/empty-state`
- Pioneer UI (already present, reused):
  - `components/pioneerui/glow-card`
  - `components/pioneerui/glass-card`
- Existing icon/package stack only:
  - `lucide-react`
  - `sonner`
- No new dependencies installed.
- No Pioneer component copied or overwritten.

### Files changed in this task
- `app/(agency)/agency/profile/page.tsx`
- `app/(agency)/agency/profile/profile-content.tsx`
- `lib/i18n/types.ts`
- `lib/i18n/uz.ts`
- `lib/i18n/ru.ts`
- `docs/agency_panel_design.md`

### What was intentionally not added
- No invented profile fields or new schema columns (no banner field invented).
- No admin/user profile coupling changes.
- No new backend algorithms or role/policy changes.
- No migration/RLS edits.

### Local test URL
- `http://localhost:3000/agency/profile`

### Manual QA checklist
- [ ] Profile page renders agency identity with real logo/status values.
- [ ] Summary cards show real MaxCoin/followers/plan/verification values when available.
- [ ] Owner/manager summary shows `responsible_person` and owner profile data when available.
- [ ] Edit mode includes mobile-aligned profile fields (`slug`, `website_url` included).
- [ ] Save requires company name and persists profile updates.
- [ ] Logo upload works via existing safe image uploader flow.
- [ ] Certificate/license PDF upload/remove works via existing safe upload action.
- [ ] Verification snapshot reflects latest verification request and admin note (if present).
- [ ] Empty/error/loading states render correctly.
- [ ] uz/ru switch updates all new Profil labels/messages.
- [ ] No admin regression (`remote.mxtr.uz`).
- [ ] No public/user regression (`mxtr.uz`).

## 32. mxtr.uz agency surface removal implementation notes (2026-05-04)

### Scope executed
- Removed direct agency-panel-like surface entry points from `mxtr.uz` public/profile UI.
- Preserved host split behavior where `/agency*` on `mxtr.uz` and `www.mxtr.uz` redirects to `agency.mxtr.uz`.
- Kept `agency.mxtr.uz` agency panel and `remote.mxtr.uz` admin isolation intact.
- No admin internals changed.
- No `maxtour-mobile` files changed.
- No schema/RLS/migration changes.

### Old agency routes on mxtr.uz (now redirected)
- `/agency`
- `/agency/tours`
- `/agency/tours/new`
- `/agency/tours/[id]/edit`
- `/agency/requests`
- `/agency/leads` (legacy)
- `/agency/interests` (legacy)
- `/agency/advertising`
- `/agency/analytics`
- `/agency/verification`
- `/agency/profile`
- `/agency/subscription`

### Redirect behavior in place
- `mxtr.uz` / `www.mxtr.uz` + `/agency*`:
  - redirect to `https://agency.mxtr.uz` with same path and query string.
- `agency.mxtr.uz` + non-`/agency*`:
  - redirect to `/agency` (agency dashboard entry route).
- Dev/unknown hosts (`localhost`, `127.0.0.1`, etc.):
  - host split is not forced, so local preview of `/agency` remains usable.

### Public CTA/navigation changes
- Public profile auth flow (agency manager login/register completion):
  - now routes to agency portal target via `getAgencyPortalHref('/agency')`.
- Public desktop sidebar agency item:
  - now uses agency portal target, not embedded local panel expectation.
- Public user profile agency CTA buttons:
  - now use agency portal target.
- Public user profile agency tab:
  - embedded agency-panel summary UI replaced with safe informational handoff + portal button.

### Files changed in this task
- `lib/routing/domains.ts`
- `components/shared/public-desktop-sidebar.tsx`
- `app/(public)/profile/auth-screen.tsx`
- `app/(public)/profile/user-profile-view.tsx`
- `docs/agency_panel_design.md`

### Local behavior note
- `getAgencyPortalHref('/agency')` returns:
  - local path (`/agency`) in non-production (`NODE_ENV !== 'production'`) for safe local preview
  - `https://agency.mxtr.uz/agency` in production surfaces

### QA checklist
- [ ] `mxtr.uz` homepage renders unchanged public UI.
- [ ] `mxtr.uz/profile` renders unchanged user/profile UX; agency CTA opens agency portal target.
- [ ] `mxtr.uz/agency` redirects to `agency.mxtr.uz/agency`.
- [ ] `mxtr.uz/agency/verification?x=1` redirects to `agency.mxtr.uz/agency/verification?x=1`.
- [ ] `agency.mxtr.uz/agency` still renders agency dashboard.
- [ ] `remote.mxtr.uz/admin` behavior remains unchanged.
- [ ] Localhost keeps `/agency` preview usable in development.

### Test matrix
- `mxtr.uz homepage`:
  - Expect: public landing/home works as before.
- `mxtr.uz profile`:
  - Expect: profile features intact; agency-related CTA links out to agency portal target.
- `old agency route on mxtr.uz`:
  - Example: `/agency`, `/agency/tours`, `/agency/verification`
  - Expect: host redirect to `agency.mxtr.uz` with path/query preserved.
- `agency.mxtr.uz dashboard`:
  - Expect: agency panel works with existing role/auth guard behavior.
- `remote.mxtr.uz admin`:
  - Expect: admin-only behavior unchanged.

## 33. Agency auth entry implementation notes (2026-05-04)

### 1) Date/time
- Implementation timestamp: `2026-05-04 01:19:33 +08:00` (Asia/Singapore)

### 2) What was changed
- Added a dedicated agency auth entry screen at `/agency/login` for `agency.mxtr.uz`.
- Added Kirish / Ro'yxatdan o'tish modes with agency-focused UI.
- Implemented agency registration with email OTP verification, then profile + agency provisioning (mobile parity logic).
- Updated middleware so `/agency/login` is the only public agency path; protected `/agency*` routes redirect to this screen.
- Preserved admin/public domain behavior and did not touch admin internals.

### 3) Files changed
- `middleware.ts`
- `app/(agency-auth)/agency/login/page.tsx`
- `app/(agency-auth)/agency/login/agency-auth-screen.tsx`
- `docs/agency_panel_design.md`

### 4) Mobile source-of-truth files inspected
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\screens\auth\LoginScreen.tsx`
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\store\auth-store.ts`
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\navigation\RootNavigator.tsx`
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile\src\screens\profile\ProfileScreen.tsx`

### 5) Existing MaxTour auth utilities used
- `lib/supabase/client.ts#createClient`
- `middleware.ts` + `lib/supabase/middleware.ts#updateSession`
- Existing fallback phone lookup endpoint: `app/api/auth-phone/route.ts`
- Existing utility: `lib/utils.ts#slugify`

### 6) Supabase auth methods used
- `supabase.auth.signInWithPassword`
- `supabase.auth.signInWithOtp`
- `supabase.auth.verifyOtp`
- `supabase.auth.setSession`
- `supabase.auth.updateUser`
- `supabase.auth.getUser`
- `supabase.auth.signOut`
- Data writes aligned to existing flows:
  - `profiles` upsert (`role`, identity fields)
  - `agencies` upsert (`owner_id`, `name`, `slug`, `phone`, `country`)

### 7) Login behavior
- Login accepts `email OR phone` + `password`.
- If identifier is phone:
  - tries mapped auth email (`<phone>@user.maxtour.uz`)
  - tries legacy email fallback (`<digits>@maxtour.local`)
  - uses `/api/auth-phone` lookup fallback for existing auth email(s)
- If identifier is email and login fails:
  - attempts fallback by looking up profile phone and mapped auth email.
- On success:
  - `agency_manager` -> redirect to `next` agency path or `/agency`
  - `admin` -> safe admin-access state with action to open `remote.mxtr.uz/admin`
  - non-agency roles -> safe no-access state with actions to switch account or register agency account

### 8) Registration behavior
- Registration fields (agency flow):
  - `email`
  - `full name`
  - `phone`
  - `password`
- Validation:
  - required fields
  - valid email format
  - Uzbekistan phone format (`+998XXXXXXXXX`)
  - password min length `6`
- After OTP verification:
  - set/update auth password
  - upsert `profiles` with `role='agency_manager'`
  - upsert `agencies` row for `owner_id`
  - redirect to agency dashboard entry route

### 9) OTP behavior
- Uses existing Supabase email OTP flow:
  - `signInWithOtp({ shouldCreateUser: true })`
  - `verifyOtp({ type: 'email' })`
- Includes resend OTP with cooldown (`60s`).
- Handles expired/invalid OTP messages with localized UI.

### 10) Phone login support status
- Phone+password is supported via current/mobile-compatible mapping fallback strategy.
- Direct native phone-password auth provider is not introduced (no new backend/provider added).

### 11) Role/onboarding behavior
- Middleware now allows `/agency/login` without agency role.
- Protected `/agency*` routes still require authenticated `agency_manager`.
- Non-agency authenticated users are kept on auth entry with safe access/onboarding messaging (no unsafe role mutation).
- Admin users are directed to admin surface (`remote.mxtr.uz/admin`) via explicit action.

### 12) i18n labels added
- Implemented agency-auth-specific copy as an agency-local `uz/ru` dictionary in:
  - `app/(agency-auth)/agency/login/agency-auth-screen.tsx`
- Reused existing global i18n keys (`t.auth.*`, `t.common.*`) for shared auth labels/placeholders/statuses.
- Included a language switcher (`uz`/`ru`) on the agency auth screen.

### 13) Components used (shared-ui / animate-ui / Pioneer UI)
- Shared/UI components:
  - `components/ui/button`
  - `components/ui/card`
  - `components/ui/input`
  - `components/ui/label`
  - `components/shared/language-switcher`
- Icons: `lucide-react` (already installed)
- No new dependencies installed.
- No Pioneer UI component copied or overwritten.

### 14) What was intentionally not implemented
- No forgot-password flow link (no confirmed safe existing agency-specific web reset flow in current scope).
- No new auth provider.
- No custom OTP tables/functions.
- No role auto-promotion outside existing mobile parity flow.
- No admin/public route redesign.

### 15) Local test command
- Run dev server:
  - `npm run dev`

### 16) Local test URLs
- Agency auth entry:
  - `http://localhost:3000/agency/login`
- Agency dashboard (requires agency role):
  - `http://localhost:3000/agency`
- Agency protected route redirect check:
  - `http://localhost:3000/agency/tours` (unauth -> `/agency/login?next=/agency/tours`)
- Optional host-based preview (if hosts/proxy configured):
  - `https://agency.mxtr.uz/agency/login`

### 17) Manual QA checklist
- [ ] `agency/login` loads dedicated agency auth UI (not public homepage).
- [ ] Language switcher toggles all auth screen copy between `uz` and `ru`.
- [ ] Login with agency email+password redirects to `/agency` or `next`.
- [ ] Login with phone+password works via mapping/fallback.
- [ ] Non-agency account login shows safe no-access/onboarding state.
- [ ] Admin account login shows safe admin handoff state.
- [ ] Registration validates required fields/email/phone/password.
- [ ] OTP send, verify, and resend flow works.
- [ ] After successful registration, `profiles.role` and agency row are provisioned by existing logic and redirect works.
- [ ] Unauthenticated access to `/agency` redirects to `/agency/login`.
- [ ] `remote.mxtr.uz` admin behavior remains unchanged.
- [ ] `mxtr.uz` public/user pages remain unchanged.

### 18) Known limitations
- Forgot-password shortcut is not surfaced on this screen due lack of a confirmed safe agency-specific reset route in current project flow.
- Phone login depends on existing mapping fallback (`@user.maxtour.uz` / legacy / API lookup), not native phone-password auth.
- If backend email OTP configuration is disabled in Supabase, registration OTP step will fail with backend error (no custom OTP fallback added by design).
