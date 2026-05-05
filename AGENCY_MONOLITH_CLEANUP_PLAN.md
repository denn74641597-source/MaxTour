# AGENCY Monolith Cleanup Plan (Step 24, Non-Destructive)

Date: 2026-05-06
Project: C:/Users/adbax/OneDrive/Desktop/MaxTour
Standalone agency project: C:/Projects/MaxTour-agency

## 1) Current Route Ownership (Confirmed)
- `agency.mxtr.uz/*` -> standalone `maxtour-agency` worker
- `mxtr.uz/*` -> monolith
- `www.mxtr.uz/*` -> monolith
- `remote.mxtr.uz/*` -> monolith

Monolith `wrangler.toml` no longer includes `agency.mxtr.uz/*`.

## 2) Git / Archive Prep Status
Working tree is currently dirty, so archive tag/branch snapshot is not created automatically in this step.

Current status (high-level):
- Modified files include admin/public/agency/middleware-related paths.
- Untracked files include verification split modules.

Recommended manual archive flow before destructive cleanup:
1. Make sure rollback-relevant changes are committed or stashed intentionally.
2. Create archive branch from current stable commit, for example:
   - `git switch -c archive/pre-agency-cleanup-20260506`
3. Optionally create tag:
   - `git tag pre-agency-cleanup-20260506`

## 3) Exact Deletion Candidates (DO NOT DELETE YET)

### Phase D Primary route candidates (likely safe after explicit approval)
- Entire folder: `app/(agency)/`
  - `app/(agency)/error.tsx`
  - `app/(agency)/layout.tsx`
  - `app/(agency)/agency/agency-dashboard-content.tsx`
  - `app/(agency)/agency/loading.tsx`
  - `app/(agency)/agency/page.tsx`
  - `app/(agency)/agency/advertising/advertising-content.tsx`
  - `app/(agency)/agency/advertising/page.tsx`
  - `app/(agency)/agency/analytics/analytics-content.tsx`
  - `app/(agency)/agency/analytics/page.tsx`
  - `app/(agency)/agency/interests/interests-content.tsx`
  - `app/(agency)/agency/interests/page.tsx`
  - `app/(agency)/agency/leads/leads-content.tsx`
  - `app/(agency)/agency/leads/page.tsx`
  - `app/(agency)/agency/profile/page.tsx`
  - `app/(agency)/agency/profile/profile-content.tsx`
  - `app/(agency)/agency/profile/security-section.tsx`
  - `app/(agency)/agency/requests/page.tsx`
  - `app/(agency)/agency/requests/requests-content.tsx`
  - `app/(agency)/agency/subscription/page.tsx`
  - `app/(agency)/agency/subscription/subscription-content.tsx`
  - `app/(agency)/agency/tours/agency-tours-content.tsx`
  - `app/(agency)/agency/tours/page.tsx`
  - `app/(agency)/agency/tours/tour-form.tsx`
  - `app/(agency)/agency/tours/new/new-tour-content.tsx`
  - `app/(agency)/agency/tours/new/page.tsx`
  - `app/(agency)/agency/tours/[id]/edit/edit-tour-content.tsx`
  - `app/(agency)/agency/tours/[id]/edit/page.tsx`
  - `app/(agency)/agency/verification/page.tsx`
  - `app/(agency)/agency/verification/verification-content.tsx`

- Agency-auth route candidates:
  - `app/(agency-auth)/agency/login/page.tsx`
  - `app/(agency-auth)/agency/login/agency-auth-screen.tsx`

### Phase E secondary candidates (only after route deletion + re-scan)
- `components/layouts/agency-dashboard-layout.tsx`
- `components/shared/dashboard-nav.tsx`
- `components/layouts/index.ts` (remove agency export line if file retained)
- `components/shared/index.ts` (remove dashboard-nav exports if no consumers)
- Agency-only middleware branches (see section 5)

### Optional feature-module cleanup candidates (manual verification required)
These currently look agency-only in monolith imports, but require one more import scan before deletion:
- `features/maxcoin/actions.ts`
- `features/maxcoin/queries.ts`
- `features/interests/queries.ts`
- `features/leads/queries.ts`
- `features/tours/actions.ts`
- `features/verification/agency-actions.ts`

## 4) Keep-List (Must NOT be removed)

Required keep-list (shared/public/admin dependencies):
- `features/agencies/actions.ts`
- `features/agencies/queries.ts`
- `features/tours/queries.ts`
- `features/leads/actions.ts`
- `features/auth/security-actions.ts`
- `features/auth/helpers.ts`
- `components/shared/agency-card.tsx`
- `hooks/use-profile.ts`
- `lib/routing/domains.ts`
- `lib/routing/guards.ts`
- `middleware.ts`
- `app/api/auth-phone/route.ts`
- `app/api/errors/report/route.ts`
- `app/api/admin-bot/webhook/route.ts`
- `lib/telegram/admin-bot.ts`

Additional keep-list from re-check:
- `app/(public)/profile/auth-screen.tsx` (public -> agency portal link logic)
- `app/(public)/profile/user-profile-view.tsx` (public -> agency portal link logic)
- `components/shared/public-desktop-sidebar.tsx` (public -> agency portal link logic)
- `features/admin/settings.ts` (uses routing/domain helpers)
- `app/api/admin-auth/route.ts` (admin login flow)
- `app/api/track/route.ts` (public analytics tracking)
- `components/shared/lead-form.tsx` and `features/leads/actions.ts` pair (public lead submission)

## 5) Middleware/Guard Cleanup Candidates (Do Not Remove Yet)

- `middleware.ts` agency auth gate block (`pathname.startsWith('/agency')`)
  - Classification: Safe to remove later (after route folders removed and regression checks pass)

- `lib/routing/guards.ts` branch `domainTarget === 'agency'`
  - Classification: Manual review
  - Reason: still tied to `resolveDomainTarget` semantics and link-routing policy

- `middleware.ts` legacy redirect from mxtr host `/agency*` -> `agency.mxtr.uz`
  - Classification: Manual review
  - Reason: may still be desired deep-link behavior from public host

- `lib/routing/domains.ts` agency host constants + `getAgencyPortalHref`
  - Classification: Keep
  - Reason: public UX still uses this function to open standalone agency portal

## 6) Dry-Run Dependency Check Result (No Deletions)

Checked non-agency files for direct references to:
- `app/(agency)`
- `app/(agency-auth)`
- `@/components/layouts/agency-dashboard-layout`
- `agency-dashboard-content`
- `agency-auth-screen`
- `@/features/verification/agency-actions`

Result:
- No direct non-agency imports found for the above patterns.
- Important coupling still present via layout barrel import usage:
  - `app/(admin)/layout.tsx` imports `@/components/layouts`
  - `app/(public)/layout.tsx` imports `@/components/layouts`
  - `app/(public)/profile/layout.tsx` imports `@/components/layouts`
  - and `components/layouts/index.ts` still exports `AgencyDashboardLayout`

## 7) Docs Update Scope
- `README.md` updated in Step 24 (docs-only) to reflect:
  - agency is standalone
  - monolith route ownership excludes `agency.mxtr.uz/*`
  - rollback/status reference path in standalone project
  - avoid new agency development in monolith

## 8) Step 25 Execution Preview (Pending Approval)
1. Archive snapshot branch/tag after clean/stable git state.
2. Remove primary route candidates (`app/(agency)`, `app/(agency-auth)/agency/login`).
3. Re-run import scan and typecheck.
4. Remove secondary candidates and stale exports.
5. Re-run validation and smoke-check monolith public/admin surfaces.

## 9) Step 25 Execution Status (Completed)

Date: 2026-05-06

- Primary route groups deleted:
  - `app/(agency)/**`
  - `app/(agency-auth)/agency/login/**`
- Import/reference re-scan after deletion:
  - No code references found for:
    - `app/(agency)`
    - `app/(agency-auth)`
    - `agency-dashboard-content`
    - `agency-auth-screen`
    - `app/(agency)/agency`
- Validation:
  - Initial `npx tsc --noEmit` failed only due stale generated `.next/types` references to removed route files.
  - Cleared generated artifacts at `.next/types`.
  - Re-ran `npx tsc --noEmit`: **passed**.

No shared feature modules, middleware branches, routing helpers, API shared routes, DNS, or deployment ownership were changed in Step 25.

### Remaining secondary cleanup candidates (for Step 26+)
- `components/layouts/agency-dashboard-layout.tsx`
- `components/shared/dashboard-nav.tsx`
- `components/layouts/index.ts` (remove agency export when safe)
- `components/shared/index.ts` (remove dashboard-nav exports when safe)
- Optional agency-only feature module candidates (manual re-check before removal):
  - `features/maxcoin/actions.ts`
  - `features/maxcoin/queries.ts`
  - `features/interests/queries.ts`
  - `features/leads/queries.ts`
  - `features/tours/actions.ts`
  - `features/verification/agency-actions.ts`
- Agency-specific middleware/domain branches (manual review before any removal):
  - agency auth gate in `middleware.ts`
  - `domainTarget === 'agency'` branch in `lib/routing/guards.ts`
  - legacy `/agency` redirect behavior in `middleware.ts`

## 10) Step 26 Execution Status (Completed)

Date: 2026-05-06

- Secondary obsolete agency shell components deleted:
  - `components/layouts/agency-dashboard-layout.tsx`
  - `components/shared/dashboard-nav.tsx`
- Barrel export cleanup applied:
  - `components/layouts/index.ts`: removed `AgencyDashboardLayout` export
  - `components/shared/index.ts`: removed `DashboardNav, DashboardMenuTrigger` export

Post-cleanup stale reference scan:
- No references found for:
  - `@/components/layouts/agency-dashboard-layout`
  - `AgencyDashboardLayout`
  - `@/components/shared/dashboard-nav`
  - `DashboardNav`
  - `./agency-dashboard-layout`
  - `./dashboard-nav`
  - `export { AgencyDashboardLayout }`
  - `export { DashboardNav, DashboardMenuTrigger }`

Validation:
- `npx tsc --noEmit`: **passed**

## 14) Step 34 Execution Status (Public-to-Private Agency Coupling Removal)

Date: 2026-05-06

Goal:
- Remove only public monolith UI/link coupling to private agency panel (`/agency*`).
- Preserve full public agency ecosystem (`/agencies/[slug]`, agency cards, follows/subscriptions, comments/reviews/ratings, and public agency-tour data flows).

### Classification summary

- `REMOVE_PRIVATE_PANEL_LINK`
  - `components/shared/public-desktop-sidebar.tsx`
  - `app/(public)/profile/user-profile-view.tsx`
  - `app/(public)/profile/auth-screen.tsx` (private-panel redirect behavior only)
- `KEEP_PUBLIC_AGENCY_FEATURE`
  - `app/(public)/agencies/[slug]/page.tsx`
  - `app/(public)/agencies/[slug]/agency-profile-content.tsx`
  - `components/shared/agency-card.tsx`
  - public tour pages that render agency/provider data
- `KEEP_DATA_QUERY`
  - public `agencies`/`tours`/favorites/review-comment-related data modules used by `(public)` and `(admin)` surfaces
- `KEEP_ADMIN`
  - all `app/(admin)` surfaces and admin routing protections
- `KEEP_CONFIG_ONLY`
  - domain target awareness for `agency.mxtr.uz` in host resolution

### Code changes made

1. Removed private agency panel links/buttons from public monolith UI:
   - sidebar agency panel entry removed
   - profile quick-action agency panel button removed
   - profile "agency" tab block removed
2. Removed public profile/auth redirect coupling to private panel:
   - agency manager login/register completion now stays in monolith user profile flow (`/profile`) instead of portal jump.
3. Removed private-link helper after zero consumers:
   - `getAgencyPortalHref(...)` removed from `lib/routing/domains.ts`.
4. `mxtr.uz/agency` redirect decision:
   - **Option B applied** (no forced cross-domain redirect from monolith middleware).
   - `/agency*` is no longer a public monolith UX path.
5. Defensive branch decision:
   - kept `domainTarget === 'agency'` branch in `lib/routing/guards.ts` unchanged for defensive/rollback safety.

### Explicitly preserved

- Public agency profile routes and rendering remain intact:
  - `/agencies/[slug]`
- Public follow/subscribe agency behavior remains intact.
- Public reviews/comments/ratings behavior remains intact where implemented.
- Public agency/tour/promotions data relationship remains unchanged (shared Supabase data, split app surfaces).

### Validation

- `npx tsc --noEmit`: **passed**
- `npm run build`: **passed**

## 13) Step 33 Execution Status (Final Migration Closeout + Cleanup Freeze)

Date: 2026-05-06

Migration closeout status:
- **Closed / stable**
- `agency.mxtr.uz/*` is served by standalone Worker (`maxtour-agency`)
- `mxtr.uz/*`, `www.mxtr.uz/*`, and `remote.mxtr.uz/*` remain on the old monolith Worker

Removed in old monolith (completed in prior steps):
- `app/(agency)` route group
- `app/(agency-auth)/agency/login` route
- obsolete agency shell components:
  - `components/layouts/agency-dashboard-layout.tsx`
  - `components/shared/dashboard-nav.tsx`
- obsolete monolith-only `/agency` auth gate in `middleware.ts`
- obsolete `resolveRouteArea('/agency')` mapping in `lib/routing/guards.ts`
- confirmed obsolete agency-only feature files:
  - `features/maxcoin/actions.ts`
  - `features/maxcoin/queries.ts`
  - `features/interests/queries.ts`
  - `features/leads/queries.ts`
  - `features/tours/actions.ts`
  - `features/verification/actions.ts`
  - `features/verification/agency-actions.ts`

Intentionally kept in monolith:
- `domainTarget === 'agency'` defensive branch in `lib/routing/guards.ts` (keep for stability/rollback safety)
- agency portal domain/link helpers in `lib/routing/domains.ts`:
  - `AGENCY_WEB_HOSTS`
  - `AGENCY_PORTAL_ORIGIN`
  - `getAgencyPortalHref(...)`
- public-host `/agency*` redirect behavior in `middleware.ts` that forwards legacy links to `https://agency.mxtr.uz`

Rollback note:
- Rollback runbook remains documented in:
  - `C:/Projects/MaxTour-agency/AGENCY_CUTOVER_STATUS.md`
  - this cleanup plan document
- Do not remove remaining defensive agency branches/helpers until a new targeted change explicitly approves it.

Development ownership note:
- Future agency feature development must happen in:
  - `C:/Projects/MaxTour-agency`
- Old monolith (`C:/Users/adbax/OneDrive/Desktop/MaxTour`) should not be used for new agency feature work.

Cleanup freeze policy:
- After Step 33 closeout, no additional runtime cleanup/removal should be performed unless a targeted issue requires it and is approved as a separate step.

## 17) Step 32 Execution Status (Final Guard + Docs Consistency Cleanup)

Date: 2026-05-06

Code cleanup applied:
- `lib/routing/guards.ts`
  - Removed only unused `/agency` mapping in `resolveRouteArea`.
  - Kept `/admin` mapping and default `public` return.
  - Kept `evaluateDomainAccess` branch for `domainTarget === 'agency'` unchanged (rollback/defensive safety).

Docs consistency updates applied:
- `README.md`
- `docs/ROUTING_AND_DOMAINS.md`
- `docs/WEB_ARCHITECTURE.md`
- `docs/project-architecture.md`
- `docs/DEPLOYMENT_CHECKLIST.md`

Documentation now states:
1. `agency.mxtr.uz` is served by standalone project `C:/Projects/MaxTour-agency`.
2. Monolith serves `mxtr.uz`, `www.mxtr.uz`, and `remote.mxtr.uz`.
3. Monolith keeps public-to-agency redirect/link helpers.
4. Monolith is not for new agency feature development.
5. Rollback details live in:
   - `C:/Users/adbax/OneDrive/Desktop/MaxTour/AGENCY_MONOLITH_CLEANUP_PLAN.md`
   - `C:/Projects/MaxTour-agency/AGENCY_CUTOVER_STATUS.md`

Search validation:
- `routeArea === 'agency'`: no matches.
- `domainTarget === 'agency'` in guards: present.
- `getAgencyPortalHref`: present.
- `AGENCY_PORTAL_ORIGIN`: present.

Validation:
- `npx tsc --noEmit`: **passed**

Safety confirmation:
- No DNS/routes changes.
- No deployment changes.
- No schema/RLS changes.
- No business logic changes.

## 16) Step 31B Execution Status (Delete Confirmed Obsolete Agency Feature Files)

Date: 2026-05-06

Scope:
- Deleted only the approved 7 files from Step 31A.
- No middleware/routing/API/public/admin/shared-UI code paths were modified.

Deleted files:
1. `features/maxcoin/actions.ts`
2. `features/maxcoin/queries.ts`
3. `features/interests/queries.ts`
4. `features/leads/queries.ts`
5. `features/tours/actions.ts`
6. `features/verification/actions.ts`
7. `features/verification/agency-actions.ts`

Stale reference scan result (post-delete):
- No references found for:
  - `features/maxcoin/actions`
  - `features/maxcoin/queries`
  - `features/interests/queries`
  - `features/leads/queries`
  - `features/tours/actions`
  - `features/verification/actions`
  - `features/verification/agency-actions`

Stale export/import fixes applied:
- None required.
- Typecheck did not require any barrel or import cleanup for these paths.

Validation:
- `npx tsc --noEmit`: **passed**

Safety confirmation:
- No DNS/routes changes.
- No deployment changes.
- No Supabase schema/RLS changes.
- No business-logic refactors outside approved deletions.

Remaining cleanup items:
1. Branch-level routing cleanup (manual review):
   - `lib/routing/guards.ts` -> `resolveRouteArea` `/agency` mapping (candidate for safe branch removal)
   - `lib/routing/guards.ts` -> `domainTarget === 'agency'` policy branch (keep temporarily until rollback window close)
2. Docs/config consistency pass:
   - remove stale monolith `(agency)` architecture mentions in older docs (for example `README.md` structure section and legacy routing docs).

## 15) Step 31A Execution Status (Full Old-Agency Cleanup Audit)

Date: 2026-05-06

Scope:
- Final audit-only pass before Step 31B deletion.
- No runtime code behavior changed in this step.

### 15.1 Candidate table

| File | Current consumers (code/runtime) | Classification | Reason | Recommended action |
|---|---|---|---|---|
| `middleware.ts` | Next middleware runtime | `KEEP_REQUIRED` | Active host split and admin auth enforcement for monolith domains | Keep |
| `lib/routing/guards.ts` | `middleware.ts`, `features/admin/settings.ts` | `KEEP_REQUIRED` | File is active; only branch-level cleanup is possible later | Keep file; optional branch-level cleanup in later step |
| `lib/routing/domains.ts` | `lib/routing/guards.ts`, `features/admin/settings.ts`, `app/(public)/profile/auth-screen.tsx`, `app/(public)/profile/user-profile-view.tsx`, `components/shared/public-desktop-sidebar.tsx` | `KEEP_REQUIRED` | Public/admin cross-domain behavior depends on it | Keep |
| `types/shared/routing.ts` | `lib/routing/domains.ts`, `lib/routing/guards.ts` | `KEEP_REQUIRED` | Shared routing types still in active use | Keep |
| `features/maxcoin/actions.ts` | No imports found in `app`, `components`, `features`, `hooks`, `lib`, `src`, `types`, `app/api` | `DELETE_NOW_SAFE` | Agency route group removed; no remaining monolith consumers | Delete in Step 31B |
| `features/maxcoin/queries.ts` | No imports found in code/runtime paths | `DELETE_NOW_SAFE` | No current monolith consumers | Delete in Step 31B |
| `features/interests/queries.ts` | No imports found in code/runtime paths | `DELETE_NOW_SAFE` | No current monolith consumers | Delete in Step 31B |
| `features/leads/queries.ts` | No imports found in code/runtime paths | `DELETE_NOW_SAFE` | No current monolith consumers; public lead flow uses `features/leads/actions.ts` | Delete in Step 31B |
| `features/tours/actions.ts` | No imports found in code/runtime paths | `DELETE_NOW_SAFE` | No current monolith consumers | Delete in Step 31B |
| `features/verification/agency-actions.ts` | Referenced only by `features/verification/actions.ts` re-export | `REFACTOR_THEN_DELETE` | Internal-only dependency chain; no external consumers | Delete together with `features/verification/actions.ts` in Step 31B |
| `features/verification/actions.ts` | No imports found in code/runtime paths | `DELETE_NOW_SAFE` | Compatibility barrel is currently unused | Delete in Step 31B (or first, then agency-actions) |
| `features/verification/admin-actions.ts` | `app/(admin)/admin/verification/page.tsx`, `app/(admin)/admin/verification/admin-verification-content.tsx` | `KEEP_REQUIRED` | Active admin verification workflow | Keep |
| `components/layouts/index.ts` | `app/(admin)/layout.tsx`, `app/(public)/layout.tsx`, `app/(public)/profile/layout.tsx` | `KEEP_REQUIRED` | Active layout barrel for public/admin shells | Keep |
| `components/shared/index.ts` | No direct barrel imports found | `MANUAL_REVIEW` | Appears unused but non-agency shared barrel; outside strict agency-only cleanup scope | Keep for now or remove in separate generic cleanup |
| `components/shared/agency-card.tsx` | `app/(public)/home/home-content.tsx` | `KEEP_REQUIRED` | Public homepage uses it | Keep |
| `app/(admin)/admin/agencies/agency-actions.tsx` | Admin agencies UI flow | `KEEP_REQUIRED` | Admin feature file (name contains agency but not old agency panel) | Keep |
| `app/(public)/agencies/[slug]/agency-profile-content.tsx` | Public agency profile route flow | `KEEP_REQUIRED` | Public feature file | Keep |
| `README.md` | Project docs | `REFACTOR_THEN_DELETE` (docs update) | Contains stale references to removed `(agency)` route group in structure section | Update docs in later doc pass (no delete) |
| `AGENCY_MONOLITH_CLEANUP_PLAN.md` | Active cleanup runbook | `KEEP_REQUIRED` | Source-of-truth for staged cleanup | Keep |
| `wrangler.toml` | Deployment config | `KEEP_REQUIRED` | No `agency.mxtr.uz/*` route remains; current ownership is correct | Keep |
| `.env.example` | Env template | `MANUAL_REVIEW` | Empty template; no agency-specific cleanup action needed in this step | Keep (or update later in docs-only pass) |

### 15.2 Exact Step 31B deletion list

Delete in Step 31B (`DELETE_NOW_SAFE` + `REFACTOR_THEN_DELETE` candidates only):

1. `features/maxcoin/actions.ts`
2. `features/maxcoin/queries.ts`
3. `features/interests/queries.ts`
4. `features/leads/queries.ts`
5. `features/tours/actions.ts`
6. `features/verification/actions.ts`
7. `features/verification/agency-actions.ts`

Optional non-agency cleanup (separate scope, not part of Step 31B):
- `components/shared/index.ts` (currently no direct imports found; treat as generic dead-barrel cleanup).

### 15.3 Keep-list summary (must not be removed in Step 31B)

- `middleware.ts` (public/admin runtime gate)
- `lib/routing/guards.ts` (used by middleware + admin settings)
- `lib/routing/domains.ts` (public profile/sidebar + admin settings dependencies)
- `types/shared/routing.ts` (routing types)
- `features/verification/admin-actions.ts` (admin verification runtime)
- `components/layouts/index.ts` (layout consumers in public/admin)
- `components/shared/agency-card.tsx` (public home agencies section)
- `app/(admin)/admin/agencies/agency-actions.tsx` (admin feature)
- `app/(public)/agencies/[slug]/agency-profile-content.tsx` (public feature)

### 15.4 Proposed final cleanup order

1. Remove unused agency feature files listed in Step 31B deletion list.
2. Re-run typecheck and import scans.
3. Revisit `lib/routing/guards.ts` branch-level cleanup:
   - candidate: `resolveRouteArea` `/agency` mapping (previously identified as removable)
   - keep `domainTarget === 'agency'` policy branch until rollback window is explicitly closed.
4. Do docs/config cleanup pass:
   - update `README.md` stale `(agency)` architecture text
   - update older architecture docs that still claim monolith serves agency routes.

### 15.5 Risk report

Potential breakages if deletion is done incorrectly:
- accidental removal of admin verification path (`features/verification/admin-actions.ts`)
- accidental removal of public agency card/profile components used by `mxtr.uz`.

Rollback approach:
1. Restore deleted files from git (`git checkout -- <path>` or restore in branch).
2. Re-run `npx tsc --noEmit`.
3. Re-run import scan for deleted module paths.

Validation commands:
- `npx tsc --noEmit`
- targeted import scan for deleted paths across `app`, `components`, `features`, `hooks`, `lib`, `src`, `types`, `app/api`.

Validation:
- `npx tsc --noEmit`: **passed**

## 13) Step 29 Execution Status (Controlled Middleware Removal)

Date: 2026-05-06

Scope changed:
- `middleware.ts` only (plus this status-doc update).

Removed (`REMOVE_SAFE_LATER` from Step 28):
- `normalizeAgencyNext` helper (old monolith agency-login next-path normalization).
- `redirectToAgencyLogin` helper (old monolith agency login redirect helper).
- Entire `pathname.startsWith('/agency')` auth/role gate block that protected in-monolith agency routes.

Explicitly kept:
- mxtr host redirect for legacy `/agency*` links:
  - `hostContext.domainTarget === 'mxtr' && pathname.startsWith('/agency')`
  - redirects to `https://agency.mxtr.uz/...`
- admin route auth/role checks and `/admin/login` behavior.
- static/internal skip behavior.
- shared domain-split evaluation flow (`evaluateDomainAccess`).
- `updateSession` flow for non-admin requests (returns `supabaseResponse`).

Import cleanup:
- No middleware import lines needed removal in this step.
- Local destructuring after `updateSession(request)` was reduced to only `supabaseResponse` for non-admin branch.

Validation:
- `npx tsc --noEmit`: **passed**

Targeted behavior check status:
- Live host-route behavior could not be executed from local monolith-only typecheck pass (no deploy/run in this step).
- Static code-path verification confirms `/agency*` on `mxtr` host still redirects to `agency.mxtr.uz`.

Safety note:
- No DNS/routes, deployment ownership, schema, RLS, business logic, or user-facing text changed in Step 29.

## 14) Step 30 Execution Status (Focused Guard Consumer Trace + Behavior Plan)

Date: 2026-05-06

Scope audited:
- `lib/routing/guards.ts`
- `lib/routing/domains.ts`
- `middleware.ts`
- `features/admin/settings.ts`
- `app/(public)/profile/auth-screen.tsx`
- `app/(public)/profile/user-profile-view.tsx`
- `components/shared/public-desktop-sidebar.tsx`
- `types/shared/routing.ts`

### Consumer trace result

`evaluateDomainAccess` consumers:
- `middleware.ts` (runtime domain split enforcement)
- `features/admin/settings.ts` (admin readiness checks with `mxtr` and `remote` targets)
- declaration in `lib/routing/guards.ts`

`resolveRouteArea` consumers:
- no runtime callers found (only declaration/export in `lib/routing/guards.ts`)

`DomainTarget` consumers:
- `lib/routing/domains.ts` (resolve target + host context)
- `lib/routing/guards.ts` (evaluate function signature)
- `types/shared/routing.ts` (type definition)
- indirect via `resolveDomainTarget(...)` usage in `features/admin/settings.ts`

`domainTarget === 'agency'` occurrences:
- only in `lib/routing/guards.ts` within `evaluateDomainAccess`

`routeArea === 'agency'` occurrences:
- none found

`getAgencyPortalHref` consumers:
- `app/(public)/profile/auth-screen.tsx`
- `app/(public)/profile/user-profile-view.tsx`
- `components/shared/public-desktop-sidebar.tsx`
- declaration in `lib/routing/domains.ts`

### Behavior matrix (current intended behavior)

| URL | Current owner | Intended behavior |
|---|---|---|
| `https://mxtr.uz/agency` | monolith | redirect to `https://agency.mxtr.uz/agency` via middleware host redirect |
| `https://mxtr.uz/agency/login` | monolith | redirect to `https://agency.mxtr.uz/agency/login` |
| `https://mxtr.uz/agency/tours` | monolith | redirect to `https://agency.mxtr.uz/agency/tours` |
| `https://agency.mxtr.uz/agency` | standalone worker | handled by standalone agency app (outside monolith runtime) |
| `https://agency.mxtr.uz/agency/login` | standalone worker | handled by standalone agency app (outside monolith runtime) |
| `https://remote.mxtr.uz/admin` | monolith | allowed admin surface; non-admin redirected to `/admin/login` |
| `https://mxtr.uz/admin` | monolith | redirected to `https://remote.mxtr.uz/admin...` |
| `https://mxtr.uz/*` public paths | monolith | public routes remain accessible |
| `https://www.mxtr.uz/*` public paths | monolith | same public behavior as `mxtr.uz` |

### Branch necessity classification

1. `resolveRouteArea` `/agency` mapping (`if (pathname.startsWith('/agency')) return 'agency'`)
- Classification: `REMOVE_SAFE`
- Why: no callers found; no observed runtime usage in middleware/admin/public paths.

2. `evaluateDomainAccess` branch `domainTarget === 'agency'`
- Classification: `KEEP_TEMPORARILY`
- Why: currently not exercised by production monolith route ownership, but serves as a defensive policy branch and rollback-era guard semantics for agency host if routing is temporarily reintroduced or misrouted.

### Risk analysis if removed

Remove `resolveRouteArea` `/agency` mapping:
- Expected impact: none in current repo runtime (no consumers found).
- Risk level: low.

Remove `evaluateDomainAccess` `domainTarget === 'agency'` branch:
- Public `/agency` deep links on `mxtr`: no direct impact (still handled by explicit mxtr->agency host redirect branch in middleware).
- Public profile/sidebar “agency portal” links: no impact (use `getAgencyPortalHref`, not guards).
- Admin/public routing on `mxtr`/`remote`: no direct impact in current flow.
- Potential risk: if agency host traffic accidentally hits monolith again, no agency-domain gating policy remains in `evaluateDomainAccess`.
- Risk level: medium (operational/rollback safety, not current feature behavior).

### Step 31 recommendation

Recommended option: **B. remove only one branch**
- Remove `resolveRouteArea` `/agency` mapping (safe dead-path cleanup).
- Keep `evaluateDomainAccess` `domainTarget === 'agency'` temporarily until rollback window is formally closed and route-ownership stability is reaffirmed.

Validation:
- `npx tsc --noEmit`: **passed**

## 12) Step 28 Execution Status (Middleware/Domain Helper Audit)

Date: 2026-05-06

Scope audited:
- `middleware.ts`
- `lib/routing/domains.ts`
- `lib/routing/guards.ts`
- `types/shared/routing.ts`
- consumer checks in:
  - `app/(public)/profile/auth-screen.tsx`
  - `app/(public)/profile/user-profile-view.tsx`
  - `components/shared/public-desktop-sidebar.tsx`
  - `features/admin/settings.ts`

### Agency-specific middleware inventory (`middleware.ts`)

1. `normalizeAgencyNext` + `redirectToAgencyLogin`
- Lines: 14-27
- Purpose: normalizes/encodes post-login next path and redirects unauthenticated users to `/agency/login?next=...`.
- Classification: `REMOVE_SAFE_LATER`
- Reason: old monolith no longer owns agency routes, but keeping this temporarily is low-risk during stabilization.

2. mxtr host `/agency*` cross-host redirect
- Lines: 45-47
- Logic: when `domainTarget === 'mxtr'` and path starts with `/agency`, redirect to `agency.mxtr.uz`.
- Classification: `KEEP_REQUIRED`
- Reason: still useful for legacy/deep links on public host; safe compatibility bridge after split.

3. full agency auth gate block (`pathname.startsWith('/agency')`)
- Lines: 92-130
- Logic: session check, role fetch from `profiles`, unauth redirect to login, admin redirect to remote admin host, agency login next-path redirect.
- Classification: `REMOVE_SAFE_LATER`
- Reason: branch no longer executes for normal traffic after route split, but can be removed in a dedicated cleanup step after a final rollback-window close.

### Agency-specific domain helper inventory (`lib/routing/domains.ts`)

1. `AGENCY_WEB_HOSTS` and `AGENCY_PORTAL_ORIGIN`
- Lines: 4-6
- Classification: `KEEP_REQUIRED`
- Reason: used by public/admin cross-domain navigation and URL construction.

2. `resolveDomainTarget` agency target mapping
- Lines: 24-30
- Classification: `KEEP_REQUIRED`
- Reason: shared domain model still consumed by admin settings/runtime checks.

3. `getAgencyPortalHref`
- Lines: 40-53
- Classification: `KEEP_REQUIRED`
- Reason: active consumers in public profile/auth/sidebar still depend on this helper for correct agency portal links.

### Agency-specific guard inventory (`lib/routing/guards.ts`)

1. `resolveRouteArea` agency route detection (`/agency`)
- Lines: 17
- Classification: `MANUAL_REVIEW`
- Reason: currently safe but coupled with shared guard semantics and domain snapshots; remove only with coordinated guard simplification.

2. `evaluateDomainAccess` branch `domainTarget === 'agency'`
- Lines: 33-39
- Classification: `MANUAL_REVIEW`
- Reason: still part of shared domain policy model and referenced by admin diagnostics/readiness logic.

3. public host block for `/agency` in `domainTarget === 'mxtr'` branch
- Lines: 41-43
- Classification: `KEEP_REQUIRED`
- Reason: protects public host routing and preserves expected fallback behavior.

### Step 28 classification table

| Item | Classification | Why |
|---|---|---|
| `middleware.ts` mxtr `/agency*` -> `agency.mxtr.uz` redirect (lines 45-47) | `KEEP_REQUIRED` | Preserves legacy/deep-link compatibility from public domain to standalone agency host. |
| `middleware.ts` agency auth gate block (lines 92-130) | `REMOVE_SAFE_LATER` | No longer primary route owner, but removal should happen after rollback window closes. |
| `middleware.ts` agency login helper funcs (lines 14-27) | `REMOVE_SAFE_LATER` | Supports only old in-monolith agency gate path. |
| `lib/routing/domains.ts` agency constants + `getAgencyPortalHref` | `KEEP_REQUIRED` | Actively used by public profile/auth/sidebar links. |
| `lib/routing/domains.ts` agency target in `resolveDomainTarget` | `KEEP_REQUIRED` | Shared domain-target model used outside removed agency routes. |
| `lib/routing/guards.ts` `domainTarget === 'agency'` branch | `MANUAL_REVIEW` | Shared policy helper still used by admin settings snapshot logic. |
| `lib/routing/guards.ts` `resolveRouteArea` agency branch | `MANUAL_REVIEW` | Shared helper semantics; removal requires wider policy refactor. |
| `lib/routing/guards.ts` mxtr block of `/agency` | `KEEP_REQUIRED` | Guards public host behavior and expected redirects. |

### Recommended removal order (later steps, not applied here)

1. Keep `lib/routing/domains.ts` agency constants/helpers until public UX no longer links to agency portal.
2. Decouple admin diagnostics from `evaluateDomainAccess`/`resolveDomainTarget` shared assumptions.
3. Remove `middleware.ts` agency auth gate block and helper functions in one PR.
4. Re-audit `lib/routing/guards.ts` agency branches after step 3 and remove only with full typecheck + route behavior verification.

Validation:
- `npx tsc --noEmit`: **passed**

Step 26 did not change shared feature modules, middleware branches, routing/domain helpers, API routes, DNS/routes, deployment config, schema/RLS, or business logic.

### Remaining cleanup candidates after Step 26
- Optional agency-only feature module candidates (manual re-check before removal):
  - `features/maxcoin/actions.ts`
  - `features/maxcoin/queries.ts`
  - `features/interests/queries.ts`
  - `features/leads/queries.ts`
  - `features/tours/actions.ts`
  - `features/verification/agency-actions.ts`
- Agency-specific middleware/domain branches (still pending manual review):
  - agency auth gate in `middleware.ts`
  - `domainTarget === 'agency'` branch in `lib/routing/guards.ts`
  - legacy `/agency` redirect behavior in `middleware.ts`

## 11) Step 27 Execution Status (Focused Usage Audit)

Date: 2026-05-06

Scope audited:
- `features/maxcoin/actions.ts`
- `features/maxcoin/queries.ts`
- `features/interests/queries.ts`
- `features/leads/queries.ts`
- `features/tours/actions.ts`
- `features/verification/agency-actions.ts`

Audit method:
- Repo-wide scan for direct imports by module path.
- Repo-wide scan for path-string references.
- Repo-wide scan for exported symbol references.
- Additional scan for indirect/barrel usage roots (for example `@/features/verification/actions`).

### Step 27 classification table

| Candidate | Classification | Reason |
|---|---|---|
| `features/maxcoin/actions.ts` | `MANUAL_REVIEW` | No direct imports found after route cleanup, but symbol-name collisions exist in `src/lib/supabase/mutations/maxcoin.ts`; destructive deletion requires stronger proof or explicit approval. |
| `features/maxcoin/queries.ts` | `MANUAL_REVIEW` | No direct imports found; similarly overlaps with `src/lib/supabase/queries/maxcoin.ts` naming and requires explicit confirmation before irreversible deletion. |
| `features/interests/queries.ts` | `MANUAL_REVIEW` | No direct imports found; duplicate symbol names in `src/lib/supabase/queries/interests.ts` require cautious manual verification. |
| `features/leads/queries.ts` | `MANUAL_REVIEW` | No direct imports found; duplicate symbol names in `src/lib/supabase/queries/leads.ts` and `src/lib/supabase/mutations/leads.ts` require manual confirmation. |
| `features/tours/actions.ts` | `MANUAL_REVIEW` | No direct imports found, but deletion was not executed because irreversible cleanup was blocked without stronger safety proof. |
| `features/verification/agency-actions.ts` | `MANUAL_REVIEW` | Still referenced by `features/verification/actions.ts` re-export block, so not zero-consumer at code level. |

Step 27 deletion outcome:
- No candidate files deleted in this step.
- No barrel export lines changed in this step.

Reason no deletion:
- Safety guard blocked irreversible source deletion because current evidence was considered insufficient for strict zero-consumer proof under this workflow.

Validation:
- `npx tsc --noEmit`: **passed**
