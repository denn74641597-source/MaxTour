# MaxTour Web Rebuild Audit

Date: 2026-05-03  
Workspace audited:
- `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile` (read-only source of truth)
- `C:\Users\adbax\OneDrive\Desktop\MaxTour` (web target)

## Scope And Hard Boundaries

- `maxtour-mobile` is read-only and was used only as business-logic reference.
- Only `MaxTour` is editable.
- No package installation was performed.
- No Supabase schema change was made.
- No migration creation/update was made.
- This document is the only output artifact for this task.

## Structure Audit (Both Projects)

### `maxtour-mobile` (source of truth)

- Architecture docs at root: `SYSTEM_OVERVIEW.md`, `NAVIGATION.md`, `FEATURE_MODULES.md`, `ROLE_SYSTEM.md`, `RPC_LAYER.md`, `DATABASE_SCHEMA.md`.
- Business logic modules: `src/features/*/queries.ts`.
- Screen layer: `src/screens/**`.
- Role/auth/session behavior: `src/screens/auth/LoginScreen.tsx`, `src/screens/auth/RoleSelectScreen.tsx`, `src/store/auth-store.ts`.
- Routing/deep linking and notification navigation: `src/navigation/*`, `src/hooks/useNotifications.ts`.

### `MaxTour` (web target)

- App Router route groups: `app/(public)`, `app/(agency)`, `app/(admin)`.
- Feature modules: `features/**` (queries/actions).
- Current auth/routing gates: `middleware.ts`, `features/auth/helpers.ts`, `app/(public)/profile/auth-screen.tsx`.
- Supabase integration layer: `lib/supabase/*`.

---

## 1. Mobile Screens/Features That Must Exist On Web

Status legend: `OK` (exists), `PARTIAL` (exists but behavior mismatch), `MISSING` (not present).

| Mobile Screen/Feature | Mobile Source | Web Target | Current Web Status | Required Rebuild Action |
|---|---|---|---|---|
| Home | `src/screens/home/HomeScreen.tsx` | `/` | `PARTIAL` | Use mobile ranking/promoted logic parity for home rails. |
| Tours list/filter | `src/screens/tours/ToursScreen.tsx` | `/tours` | `PARTIAL` | Replace simple query path with mobile RPC-first search/filter behavior. |
| Tour detail | `src/screens/tours/TourDetailScreen.tsx` | `/tours/[slug]` | `PARTIAL` | Ensure same tracking, related-tours behavior, and CTA logic parity. |
| Agency profile | `src/screens/agencies/AgencyProfileScreen.tsx` | `/agencies/[slug]` | `PARTIAL` | Align follow/review/stats behavior to mobile feature contracts. |
| Search | `src/screens/search/SearchScreen.tsx` | `/search` | `PARTIAL` | Align with `search_tours_public_v1` flow and sorting rules. |
| Favorites | `src/screens/favorites/FavoritesScreen.tsx` | `/favorites` | `PARTIAL` | Align pagination/followed agencies/suggestions behavior to mobile. |
| Profile | `src/screens/profile/ProfileScreen.tsx` | `/profile` | `PARTIAL` | Preserve role-aware navigation and profile mutation rules. |
| Settings | `src/screens/profile/SettingsScreen.tsx` | `/profile/settings` (recommended) | `MISSING` | Add settings page including account-deletion request flow parity. |
| Notification settings | `src/screens/profile/NotificationSettingsScreen.tsx` | `/profile/notifications` | `OK/PARTIAL` | Keep table/keys parity and verify defaults/upsert behavior parity. |
| Role select modal | `src/screens/auth/RoleSelectScreen.tsx` | `/profile` auth flow modal/step | `PARTIAL` | Add explicit role-select step parity before login/register branch. |
| Login/register OTP flow | `src/screens/auth/LoginScreen.tsx` | `/profile` auth flow | `PARTIAL` | Maintain generated-email, OTP agency registration, fallback login behavior. |
| Social login (Google/Apple user-only) | `src/screens/auth/LoginScreen.tsx` | `/profile` auth flow | `MISSING` | Implement OAuth parity with user-only restriction logic. |
| Agency dashboard | `src/screens/agency-panel/AgencyDashboardScreen.tsx` | `/agency` | `PARTIAL` | Shift KPI computations to mobile parity (RPC-first where defined). |
| Agency leads | `src/screens/agency-panel/LeadsScreen.tsx` | `/agency/leads` | `OK/PARTIAL` | Verify status transitions and ordering parity. |
| Agency tour form/list | `TourFormScreen.tsx`, `ToursListScreen.tsx` | `/agency/tours/*` | `PARTIAL` | Restore translation trigger and parity validations/field rules. |
| Agency advertising (MaxCoin) | `AdvertisingScreen.tsx` | `/agency/advertising` | `PARTIAL` | Move promotion purchase to fair RPC-based flow parity. |
| Agency interests/analytics | `InterestsScreen.tsx`, `AnalyticsScreen.tsx` | `/agency/interests`, `/agency/analytics` | `PARTIAL` | Use mobile RPC-first analytics and favorites-based interest model. |
| Agency verification | `VerificationScreen.tsx` | `/agency/verification` | `OK/PARTIAL` | Keep verification-request logic parity and pending-request guard. |
| Agency subscription screen | `SubscriptionScreen.tsx` | `/agency/subscription` | `PARTIAL` | Keep route; mirror mobile disabled-subscriptions behavior. |
| Admin tools | `AdminToolsPlaceholderScreen.tsx` | `remote.mxtr.uz` admin app | `WEB-ONLY` | Keep web admin, but separate by host/domain and harden auth model. |

---

## 2. Supabase Tables/RPC/Functions Used By Mobile

### 2.1 Mobile tables referenced directly in code (`.from(...)`)

- `agencies`
- `agency_follows`
- `agency_subscriptions`
- `call_tracking`
- `coin_requests`
- `favorites`
- `leads`
- `maxcoin_transactions`
- `notification_preferences`
- `profiles`
- `promotion_tiers`
- `reviews`
- `subscription_plans`
- `tour_promotions`
- `tours`
- `verification_requests`

### 2.2 Mobile tables referenced via joins/select aliases

- `tour_images` (joined as `images:tour_images(...)`)

### 2.3 Mobile RPC calls (source-of-truth behavior)

- `get_verified_agencies_ranked`
- `get_agency_total_views`
- `get_agency_analytics`
- `get_featured_premium_tours_v1`
- `register_featured_impression_by_tour_v1`
- `register_featured_click_by_tour_v1`
- `get_fair_promoted_tours_v1`
- `get_hot_tours_ranked`
- `get_recommended_tours`
- `get_sponsored_tours`
- `get_tours_by_engagement`
- `increment_view_count`
- `search_tours_public_v1`
- `promote_tour_fair_v1`
- `promote_tour_featured_fair_v1`

### 2.4 Mobile Edge Functions invoked by app

- `translate-tour`
- `request-account-deletion`

### 2.5 Current web parity snapshot

- Web source currently uses only one RPC directly: `increment_view_count`.
- Web does not currently invoke `translate-tour`.
- Web currently depends on legacy/non-mobile tables in app logic: `featured_items`, `tour_interests`.

---

## 3. Auth And Role Flow (Source Of Truth = Mobile)

### Mobile behavior to preserve

- Roles: `user | agency_manager | admin`.
- Registration split:
  - User: phone-based generated auth email + password + profile upsert.
  - Agency: email OTP verification, then password set, then `profiles.role='agency_manager'`, then `agencies` upsert.
- Login resilience:
  - Email/phone identifier support.
  - Fallback lookup through profile/phone helper.
  - Legacy email pattern retries.
- Role-based redirection:
  - `agency_manager` to agency panel.
  - `admin` capability exists in role model.
- Session/profile safety:
  - `auth-store` validates allowed roles.
  - Blocks access when `profiles.deletion_requested_at` is set.
- Social auth:
  - Google and Apple sign-in flows (user flow only).

### Web gaps against mobile

- No social OAuth parity in web auth screen.
- No equivalent `pending deletion` lockout in the web auth/profile session flow.
- Admin auth currently decoupled from Supabase role model (cookie + password only).

---

## 4. Agency Panel Logic (Source Of Truth = Mobile)

### Required parity behavior

- Dashboard KPIs:
  - Active tours, leads, total views, balance.
  - Use mobile strategy: RPC-first where available (`get_agency_total_views`) with fallback.
- Leads:
  - Agency-scoped lead list + status transitions (`new/contacted/closed/won/lost`).
- Tours:
  - Agency CRUD under ownership + approval constraints.
  - Trigger `translate-tour` after create/update.
- Advertising/MaxCoin:
  - Purchase request via `coin_requests`.
  - Promotion spend via fair RPC flow (`promote_tour_fair_v1` / `promote_tour_featured_fair_v1`) with idempotency.
- Interests/analytics:
  - Interests from `favorites` by agency tours.
  - Analytics via `get_agency_analytics` RPC with fallback path.
- Verification:
  - Pending-request guard + form-based submission to `verification_requests`.
- Subscription:
  - Keep route for deep links, but preserve mobile disabled mode.

### Current web deviations

- Promotion spend path is direct table mutation via service-role flow, not fair RPC parity.
- Dashboard and analytics use local aggregation/service-role paths where mobile uses RPC-first behavior.
- Tour create/update does not trigger `translate-tour`.
- Subscription page actively loads plans/subscriptions, while mobile intentionally short-circuits (disabled feature).

---

## 5. Admin Panel Logic

### Source truth note

- Mobile UI has only `AdminToolsPlaceholderScreen`; operational admin behavior comes from Supabase role/RLS model and backend flows.
- Web admin is therefore valid as a platform console, but must stay compatible with mobile-side data/RLS assumptions.

### Existing web admin capabilities

- Agency moderation, tour moderation, verification management.
- Coin requests, leads, account deletion queue, settings, featured/subscription views.

### Mandatory rebuild direction

- Separate admin surface for `remote.mxtr.uz`.
- Remove dependency on `?mode=admin` routing gate.
- Bind admin access to durable auth model (preferred: Supabase user with `profiles.role='admin'`) rather than only password cookie.
- Keep service-role writes only behind strict admin server-side authorization checks.

---

## 6. Public/User-Facing Pages (mxtr.uz)

### Must be preserved/enhanced

- `/` Home (featured/promoted/hot/top-rated/popular places rails).
- `/tours`, `/tours/[slug]`.
- `/search`.
- `/agencies/[slug]`.
- `/favorites`.
- `/profile` + auth and role-based redirect behavior.
- `/profile/notifications`.
- Add `/profile/settings` (recommended) to cover mobile settings/account lifecycle parity.

### Behavior parity requirements

- Home rails should use the same ranking and promotion semantics as mobile (RPC-first).
- Search and tours filtering/sorting should use mobile `search_tours_public_v1` behavior.
- Favorites/follows/reviews/leads flows should preserve mobile ownership and dedupe patterns.

---

## 7. Missing Or Weak Parts In Current MaxTour Web

Severity tags: `Critical`, `High`, `Medium`.

1. `Critical` Admin routing model uses query-param gate (`?mode=admin`) + cookie-only auth; not host-separated.
2. `Critical` MaxCoin promotion flow bypasses mobile fair RPC path and performs direct service-role balance/promotion writes.
3. `High` Home ranking/promoted rails rely on direct table queries instead of mobile RPC-first ranking/promoted functions.
4. `High` Search/tours listing does not mirror mobile `search_tours_public_v1` behavior and keyset pagination strategy.
5. `High` Web tour create/update path does not trigger mobile translation edge function (`translate-tour`).
6. `High` Web auth/session flow does not enforce `deletion_requested_at` lockout parity.
7. `Medium` Social login parity gap (Google/Apple flow not implemented in web).
8. `Medium` Subscription feature behavior diverges (mobile disabled, web active).
9. `Medium` Web logic depends on legacy tables not used by mobile logic (`featured_items`, `tour_interests`).
10. `Medium` Service-role client usage appears in non-admin paths where user-scoped/RLS paths should be preferred for parity/safety.

---

## 8. Recommended Web Folder Architecture

Use mobile-domain parity modules and keep domain separation explicit.

```text
app/
  (public)/                 # mxtr.uz public/user routes
    page.tsx
    tours/
    search/
    agencies/
    favorites/
    profile/
      notifications/
      settings/             # add
  (agency)/                 # mxtr.uz agency panel
    agency/
      page.tsx
      tours/
      leads/
      advertising/
      interests/
      analytics/
      verification/
      subscription/
  (admin)/                  # remote.mxtr.uz only
    admin/
      page.tsx
      agencies/
      tours/
      verification/
      coin-requests/
      leads/
      account-deletions/
      settings/

features/
  auth/
  tours/
  agencies/
  favorites/
  leads/
  interests/
  maxcoin/
  notifications/
  verification/
  account-deletions/
  admin/

lib/
  supabase/
  auth/
  routing/
```

Architecture rules:

- Feature modules must mirror mobile business logic contracts first, UI second.
- Keep admin-only logic isolated from public/agency modules.
- Avoid cross-feature direct table writes when mobile uses RPC or edge-function wrappers.

---

## 9. Routing Plan For `mxtr.uz` And `remote.mxtr.uz`

### Domain responsibility matrix

| Domain | Allowed surfaces | Blocked surfaces |
|---|---|---|
| `mxtr.uz` | Public + User + Agency (`/`, `/tours`, `/profile`, `/agency/*`, etc.) | Admin routes |
| `remote.mxtr.uz` | Admin only (`/admin/*` or `/` -> `/admin`) | Public + Agency routes |

### Middleware plan

1. Resolve host from request (`mxtr.uz`, `www.mxtr.uz`, `remote.mxtr.uz`).
2. If host is `remote.mxtr.uz`, allow only admin paths; redirect all else to admin entry.
3. If host is `mxtr.uz`, deny admin paths; redirect to public home.
4. Remove `mode=admin` dependency completely.
5. Enforce admin auth server-side by session/role checks for every admin page/action.
6. Preserve Supabase session refresh for non-admin domains as today.

---

## 10. Risks And Files That Must Not Be Touched

### Risks

- Diverging from mobile RPC/edge-function logic will create ranking, promotion, and auth inconsistencies across platforms.
- Continuing cookie-only admin auth without host separation increases accidental exposure risk.
- Service-role overuse in user/agency flows can bypass intended RLS ownership rules.
- Keeping subscriptions active on web while disabled in mobile can produce product and support confusion.

### Must-not-touch files/areas (without explicit approval)

- Entire `C:\Users\adbax\OneDrive\Desktop\maxtour-mobile` tree (read-only reference).
- `C:\Users\adbax\OneDrive\Desktop\MaxTour\supabase\migrations\*` (no schema changes/migrations).
- Any Supabase table/RPC/function names used by mobile logic.
- Generated/build artifacts:
  - `.next/`
  - `.open-next/`
  - `node_modules/`
  - `tsconfig.tsbuildinfo`

---

## Detailed Implementation Plan (Execution Order)

### Phase 0: Baseline and safeguards

- Freeze current web behavior via route/feature inventory snapshots.
- Add parity checklist from this audit into project tracking.
- Define acceptance: all mobile feature modules have web parity status (`Done/Partial/Blocked`).

### Phase 1: Shared contracts parity

- Align shared types/constants with mobile (`types/index.ts` parity pass).
- Add explicit parity map for enums, statuses, placement values, role values.
- Add feature-level contract tests for core serialization/validation rules.

### Phase 2: Data layer parity (RPC-first where mobile is RPC-first)

- `features/tours`: implement mobile-compatible RPC-first functions for home rails and search path.
- `features/agencies`: switch verified agencies and total views logic to mobile RPC-first behavior.
- `features/interests`: adopt `get_agency_analytics` RPC-first with fallback.
- `features/maxcoin`: move promotion spend to fair RPC path with idempotency semantics.
- Preserve fallback behavior where mobile has migration-tolerant fallback branches.

### Phase 3: Auth and role parity

- Add explicit role-select step parity in web auth flow.
- Implement social OAuth parity (Google/Apple) with user-only restrictions.
- Add pending-deletion lockout flow based on `profiles.deletion_requested_at`.
- Keep generated email + OTP agency registration logic aligned with mobile.

### Phase 4: Public/user parity completion

- Rebuild home data composition using mobile ranking/promotion semantics.
- Rebuild tours/search pagination and sort logic around mobile contracts.
- Add `/profile/settings` and request-account-deletion flow parity.
- Ensure notification preference and deep-link target coverage parity.

### Phase 5: Agency panel parity completion

- Update dashboard KPI computation path to mobile-compatible logic.
- Ensure tour create/update triggers translation function.
- Align leads/interests/analytics/verification flows exactly with mobile behavior.
- Keep subscription route visible but data behavior disabled to match mobile.

### Phase 6: Admin domain split and hardening

- Implement host-based routing separation for `remote.mxtr.uz`.
- Remove `mode=admin` pathing.
- Enforce role-backed admin authorization for all admin routes/actions.
- Keep audit logging for admin-critical mutations.

### Phase 7: QA and rollout

- Cross-platform parity test matrix:
  - Auth (all role paths + pending deletion)
  - Home rails ordering
  - Search/filter consistency
  - Promotion spend and balance outcomes
  - Verification and deletion workflows
- Stage rollout:
  - Internal beta on subdomain
  - Agency pilot
  - Public launch with monitoring

### Phase 8: Post-launch guardrails

- Add monitoring for RPC fallback rates and auth failures.
- Track parity drift by periodically diffing mobile feature contracts vs web feature contracts.

---

## Final Notes

- Web rebuild should be **business-logic-first** from `maxtour-mobile`, not UI-copy-first.
- UI may be web-native, but Supabase behavior, role semantics, and backend contracts must remain mobile-consistent.
