# Admin Design Log

## 1) Date/time of change

- 2026-05-03 16:10:50 +08:00

## 2) What was changed

- Redesigned only the admin sidebar visual experience for desktop-first usage.
- Converted the sidebar into grouped navigation sections:
  - `Operations`
  - `Growth`
  - `Safety`
  - `System`
- Updated nav labels to align with requested admin vocabulary while keeping existing route paths.
- Added premium header/branding block (`MaxTour Remote`, `Operations Console`) and environment status chip (`remote.mxtr.uz / live`).
- Improved active route treatment with stronger visual indicator, rounded nav rows, and hover/focus transitions.
- Kept mobile-safe behavior, but upgraded to a smoother slide-in drawer pattern with backdrop.
- Kept logout action in the sidebar footer and separated it clearly from nav items.
- Adjusted admin content offset to match new desktop sidebar width (`272px`) to avoid layout shift.

## 3) Files changed

- `app/(admin)/admin-sidebar.tsx`
- `components/layouts/admin-dashboard-layout.tsx`
- `docs/admin_design.md`

## 4) Design decisions

- Sidebar width set to `272px` to satisfy the target range (`260px - 288px`) and maintain readable spacing.
- Chose a premium dark/neutral visual language with subtle gradients and grid texture for an operations-console feel.
- Grouped navigation by task context instead of a single long list for faster operator scanning.
- Preserved all existing admin routes already present in the project.
- Active state uses contrast + border + glow instead of heavy blocks to keep the interface clean but obvious.
- Keyboard focus states are explicit (`focus-visible` rings) for accessibility.

## 5) Components used

- Existing project components:
  - `Separator` from `components/ui/separator`
- Existing utilities/hooks:
  - `cn` from `lib/utils`
  - `useTranslation` and language config constants
  - `createClient` for existing logout flow
- Icons from existing `lucide-react` dependency (already in project)
- Tailwind CSS transition classes for small animations

## 6) What was intentionally not changed

- No changes to middleware/domain routing.
- No changes to admin auth guard logic or `/admin/login` behavior.
- No changes to public, user, or agency pages/components.
- No changes to Supabase schema, queries, or migrations.
- No changes to dashboard cards/tables/content pages.

## 7) Local test command

- `npm run dev`

## 8) Manual QA checklist

- Open `http://localhost:3000/admin` and verify sidebar is visible on admin pages.
- Open `http://localhost:3000/admin/login` and verify sidebar does not render there.
- Navigate through:
  - `/admin`
  - `/admin/agencies`
  - `/admin/tours`
  - `/admin/users`
  - `/admin/verification`
  - `/admin/leads`
  - `/admin/coin-requests`
  - `/admin/featured`
  - `/admin/account-deletions`
  - `/admin/settings`
  and confirm active route highlighting updates correctly.
- Verify desktop layout does not shift unexpectedly while route changes occur.
- On mobile width, verify:
  - top admin bar appears
  - sidebar opens/closes smoothly
  - overlay click closes sidebar
- Verify logout button still routes to `/admin/login`.
- Verify no admin navigation is exposed on `mxtr.uz` public/user/agency areas (separate from this sidebar component scope).

---

## Tours Panel Redesign (Admin Only)

### 1) Date/time of change

- 2026-05-03 16:52:34 +08:00

### 2) What was changed

- Fully redesigned only the admin Tours operations panel at `/admin/tours`.
- Replaced the old lightweight list with a premium operations layout:
  - Hero header with refresh action and last-updated indicator.
  - KPI cards for moderation and marketplace health.
  - Advanced toolbar for search, filtering, sorting, and range controls.
  - Desktop-first data table plus responsive mobile cards.
- Added rich in-panel tour detail experience via right-side sheet with tabs:
  - Overview
  - Itinerary & details
  - Agency
  - Moderation
  - Activity
  - Quality
- Added real data-quality warning system (missing image/price/location/description/contact, schedule inconsistency, agency verification/approval issues).
- Added moderation confirmation dialog for status transitions with safe loading/error/success feedback.
- Added tours-specific loading and error states (`loading.tsx`, `error.tsx`).
- Added copy actions (tour link, contact), public page open action, agency/leads navigation actions.
- Added server-side admin tours payload function with related metrics and health metadata:
  - lead counts per tour
  - latest lead timestamp
  - promotion rows per tour
  - partial-data error reporting

### 3) Files changed

- `app/(admin)/admin/tours/page.tsx`
- `app/(admin)/admin/tours/admin-tours-content.tsx`
- `app/(admin)/admin/tours/tour-detail-sheet.tsx`
- `app/(admin)/admin/tours/tour-admin-utils.ts`
- `app/(admin)/admin/tours/tour-status-badge.tsx`
- `app/(admin)/admin/tours/loading.tsx`
- `app/(admin)/admin/tours/error.tsx`
- `features/admin/queries.ts`
- `features/admin/types.ts`
- `docs/admin_design.md`

### 4) Data sources used

- `getAdminToursPanelData()` from `features/admin/queries.ts` (new admin tours payload).
- Existing `updateTourStatusAction()` from `features/admin/actions.ts` for moderation mutations.
- Existing admin access guard and server admin client (`assertAdminAccess`, `createAdminClient`).

### 5) Supabase tables/RPC/functions used

- Tables queried:
  - `tours`
  - `agencies` (joined as `agency`)
  - `tour_images` (joined as `images`)
  - `leads` (for count and latest lead timestamp)
  - `tour_promotions` (promotion and active promotion info)
- Mutation used:
  - `tours` status update via existing server action `updateTourStatusAction`
- RPC used for this redesign:
  - None added

### 6) Components used

- Existing UI components:
  - `Button`, `Input`, `Select`, `Badge`, `Dialog`, `Sheet`, `Tabs`, `Skeleton`
- Existing utility functions:
  - `formatDate`, `formatPrice`, `formatNumber`, `cn`, `placeholderImage`
- Existing icon set:
  - `lucide-react`
- New admin tours-specific components/utilities:
  - `tour-detail-sheet.tsx`
  - `tour-status-badge.tsx`
  - `tour-admin-utils.ts`

### 7) Design decisions

- Kept all operations inside `/admin/tours` with an in-page detail sheet for faster moderation workflows.
- Prioritized desktop moderation speed with dense but structured tabular layout and quick actions.
- Used only real fields and relations; no fabricated metrics or placeholder fake business values.
- Added `health.partialData` + `health.errors` in payload so UI can transparently signal partial metric failures without hiding tours.
- Kept status mutation path exactly on existing server action and added confirmation gate in UI before applying updates.
- Implemented filter/sort options only where backed by known fields:
  - moderation status
  - visibility status
  - agency
  - country/destination
  - category/type
  - price range
  - departure date range
  - created date range
  - image/seats/featured presence
  - sort by newest/oldest/price/departure/pending/views/leads

### 8) What was intentionally not changed

- No changes to middleware/domain routing.
- No changes to `/admin/login`.
- No changes to admin auth guard logic (`profiles.role = 'admin'` restriction remains unchanged).
- No changes to public/user/agency pages or components.
- No changes to sidebar/dashboard/agencies panel designs.
- No Supabase schema, migration, or RLS changes.
- No new dependencies/libraries installed.
- No new server-side moderation fields introduced (e.g., rejection reason persistence) due missing existing schema path.

### 9) Local test command

- `npm run dev`

### 10) Manual QA checklist

- Open `http://localhost:3000/admin/tours`.
- Confirm header, refresh, and last-updated indicator render.
- Verify KPI cards display real values.
- Test search across title/agency/location/category/description/contact terms.
- Test filters:
  - moderation status
  - visibility
  - agency
  - destination/country
  - category
  - tour type
  - image presence
  - seats presence
  - featured state
  - price range
  - departure date range
  - created date range
- Test sorting:
  - newest
  - oldest
  - price low/high
  - departure soonest
  - pending first
  - most viewed
  - most leads
- Open a tour detail sheet from table and from mobile card layout.
- In detail sheet, verify tabs and data blocks render without layout breaks on missing fields.
- Verify image fallback behavior on missing/broken image URLs.
- Trigger status moderation change:
  - confirmation modal appears
  - loading state appears
  - success/error toast appears
  - status updates in UI and refresh remains functional
- Verify copy actions:
  - copy tour link
  - copy contact (enabled only when available)
- Verify routes/actions:
  - agencies navigation button
  - open leads button
  - open public page button
- Verify tours-specific loading and error boundaries by simulating reload/failure scenarios.

### 11) Known limitations or missing data

- `bookings` metrics are not shown because no bookings table/query path is currently present in this project.
- Moderation rejection reason/admin note for tours is not persisted because no existing tour-level rejection-note mutation/schema field is wired in current admin logic.
- Featured/promotion mutation controls are intentionally read-only in this panel because no existing admin server action safely updates promotion state here.
- Promotion `status` field is treated as optional; active-state logic primarily uses `is_active` and `ends_at`.
- Existing repository-wide ESLint debt remains outside this scope; this change was validated with focused lint on modified Tours files and full TypeScript check (`npx tsc --noEmit`).

---

## Dashboard Redesign Update (Admin Content Only)

### 1) Date/time of change

- 2026-05-03 16:41:47 +08:00

### 2) What was changed

- Rebuilt `/admin` dashboard content into a premium operations layout with:
  - executive KPI strip
  - action center
  - operational activity panels
  - marketplace health blocks
  - quality/expiry watch panels
  - metric detail dialogs
- Added dashboard-specific loading state (`/admin/loading.tsx`) with no layout jump.
- Added resilient dashboard data layer with warnings/unavailable-source reporting instead of fake metrics.

### 3) Files changed

- `app/(admin)/admin/page.tsx`
- `app/(admin)/admin/admin-dashboard-content.tsx`
- `app/(admin)/admin/loading.tsx`
- `features/admin/queries.ts`
- `docs/admin_design.md`

### 4) Data sources used

- Supabase admin-safe server queries via `createAdminClient()` after `assertAdminAccess()`.
- Existing admin route links only:
  - `/admin/agencies`
  - `/admin/tours`
  - `/admin/users`
  - `/admin/verification`
  - `/admin/leads`
  - `/admin/coin-requests`
  - `/admin/account-deletions`
  - `/admin/featured`
  - `/admin/subscriptions`

### 5) Supabase tables/RPC/functions used

- Tables:
  - `profiles`
  - `agencies`
  - `tours`
  - `leads`
  - `verification_requests`
  - `coin_requests`
  - `account_deletion_requests`
  - `agency_subscriptions`
  - `subscription_plans`
  - `maxcoin_transactions`
  - `featured_items`
- RPC/functions:
  - No new RPC used.
- Existing guard/helpers:
  - `assertAdminAccess()` (role restriction remains `profiles.role = 'admin'`)
  - `createAdminClient()`

### 6) Components used

- Shared/admin:
  - `PageTitle`
  - `SectionShell`
- UI:
  - `Card`, `CardHeader`, `CardContent`, `CardTitle`, `CardDescription`
  - `Badge`
  - `Button`
  - `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`
  - `Separator`
  - `Skeleton` (loading file)
- Icons:
  - existing `lucide-react` icons only
- Styling:
  - Tailwind classes only (no new UI library)

### 7) Design decisions

- Desktop-first grid with right rail for health/quality/expiry and left rail for action/activity.
- Every KPI card opens detail context (dialog) and links to relevant admin page.
- No fabricated trend lines or fake percentages; metrics render real counts or explicit empty/unavailable text.
- Query failures are surfaced in “Dashboard Data Notes” instead of silent failure.
- Loading skeleton mirrors final layout proportions to minimize perceived shift.

### 8) What was intentionally not changed

- Sidebar redesign was not changed (except reused as-is).
- No changes to `/admin/login`.
- No changes to middleware/domain routing.
- No changes to admin auth guard behavior.
- No changes to public/user/agency pages.
- No Supabase schema/migration/RLS changes.

### 9) Local test command

- `npm run dev`
- Optional compile validation: `npm run build`

### 10) Manual QA checklist

- Open `http://localhost:3000/admin`.
- Confirm KPI cards load with real values (not placeholders after data resolves).
- Click each KPI card and verify detail dialog opens and link button targets the correct admin route.
- Confirm Action Center cards navigate to matching admin pages.
- Confirm recent tours link to `/admin/tours/[id]` detail moderation page.
- Confirm health/quality blocks render empty states gracefully when no records exist.
- Confirm data warning panel appears only when query sources fail or are unavailable.
- Confirm `/admin/login` remains unchanged and does not show dashboard/sidebar content.
- Confirm no admin navigation appears in public/user/agency layouts.

### 11) Known limitations or missing data

- If optional tables/columns are missing or restricted in the current environment, affected widgets are marked unavailable and listed in `Dashboard Data Notes`.
- Revenue indicator is an estimate from active subscription plan prices (`subscription_plans.price_monthly`) and is not a payment ledger total.
- Trend analytics/history are intentionally omitted because no dedicated time-series source is currently wired in this dashboard layer.

## Agencies Panel Redesign (Admin Agencies)

### 1) Date/time of change

- 2026-05-03 16:49:48 +08:00

### 2) What was changed

- Completely redesigned only ` /admin/agencies ` into a desktop-first agencies operations panel.
- Added a new agencies overview header with subtitle, refresh control, and last-updated indicator.
- Added KPI cards for:
  - total agencies
  - pending verification
  - verified agencies
  - rejected/not-approved agencies
  - agencies with active tours
  - agencies with missing profile data
- Replaced the old basic table with a richer management table containing:
  - agency identity and logo fallback
  - contact block
  - location block
  - verification state block
  - subscription state block
  - real tour/lead metrics
  - created and last activity timestamps
  - quick actions (view, approve/reject, copy contact)
- Added advanced search/filter/sort toolbar using only real available data fields:
  - search by name/slug/contact/city/country/manager
  - approval filter
  - verification filter
  - subscription filter
  - city filter
  - has tours filter
  - activity bucket filter (derived from real last activity timestamps)
  - created date range filter
  - sort: newest, oldest, most tours, pending verification first, most active
- Added rich agency drill-down sheet with tabs:
  - Overview
  - Verification
  - Tours
  - Leads
  - Ops
- Added verification action center in detail view with confirmation dialogs:
  - approve verification request
  - reject verification request with optional admin note
- Kept existing admin approval flow and added confirmation dialog for approve/reject agency.
- Added agencies-specific route loading skeleton state.
- Added typed admin agencies data models and a new admin detail action/query path for drill-down payloads.

### 3) Files changed

- `features/admin/types.ts` (new)
- `features/admin/queries.ts`
- `features/admin/actions.ts`
- `app/(admin)/admin/agencies/page.tsx`
- `app/(admin)/admin/agencies/admin-agencies-content.tsx`
- `app/(admin)/admin/agencies/loading.tsx` (new)
- `docs/admin_design.md`

### 4) Data sources used

- Server-side admin Supabase reads through existing admin query layer.
- Client-side interactions use existing server actions.
- No mocked/fake data added.

### 5) Supabase tables/RPC/functions used

Tables queried:
- `agencies`
- `profiles` (owner relation)
- `tours`
- `leads`
- `verification_requests`
- `agency_subscriptions`
- `subscription_plans`
- `maxcoin_transactions`
- `tour_promotions`

Server actions/functions used:
- `updateAgencyApprovalAction`
- `approveVerificationAction`
- `rejectVerificationAction`
- `getAdminAgencyDetailAction` (new admin drill-down action)

RPC used:
- None in this redesign.

### 6) Components used

Shared/admin UI primitives used from existing project:
- `PageTitle`, `SectionShell`
- `Button`, `Badge`, `Card`, `Input`, `Select`, `Tabs`, `Sheet`, `Dialog`, `Textarea`, `Skeleton`
- Existing icon set from `lucide-react`
- Existing toast system (`sonner`)

### 7) Design decisions

- Kept the layout operations-focused and desktop-first while preserving responsiveness.
- Used a strong table for scanability plus a sheet-based detail experience for deep moderation.
- Avoided introducing new dependencies or chart libraries; all summaries are built with existing components and Tailwind.
- Kept verification and agency approval controls explicit, with confirmation dialogs for safer moderation actions.
- Implemented image URL safety and fallback rendering for logos/media to avoid layout breaks on invalid URLs.
- Kept metrics strictly grounded in real table data (counts/relations/time fields).

### 8) What was intentionally not changed

- Sidebar redesign was not touched.
- Dashboard redesign was not touched.
- Middleware/domain routing/auth guard logic was not changed.
- `/admin/login` flow was not changed.
- No public/user/agency-facing pages were modified.
- No Supabase schema/migration/RLS changes were made.
- No new package dependencies were added.

### 9) Local test command

- `npm run dev`

### 10) Manual QA checklist

- Open `http://localhost:3000/admin/agencies`.
- Verify header shows title/subtitle, refresh button, and last updated timestamp.
- Verify KPI cards show real values and update after refresh.
- Test search by:
  - agency name
  - manager name
  - email
  - phone
  - city/country
- Test filters:
  - approval
  - verification
  - subscription
  - city
  - has tours
  - activity bucket
  - created date range
- Test sorting:
  - newest
  - oldest
  - most tours
  - pending verification first
  - most active
- Click agency row and verify detail sheet opens.
- In detail sheet, verify tabs render:
  - overview
  - verification
  - tours
  - leads
  - ops
- Verify quick actions:
  - approve/reject agency opens confirmation dialog and refreshes data
  - copy contact copies to clipboard and shows feedback
  - verify pending verification request can be approved/rejected with confirmation
- Verify empty states for filtered no-results and missing related data sections.
- Verify loading skeleton appears while route loads.
- Resize to tablet widths and confirm layout remains usable.

### 11) Known limitations or missing data

- No dedicated agency `suspended/disabled` status column exists in current schema; suspend action is shown as not supported.
- No dedicated admin user detail route exists for direct manager profile drill-down from agencies.
- `/admin/tours` and `/admin/leads` routes currently open as global lists (no guaranteed agency-pre-filter in route state).
- Project-wide `npx tsc --noEmit` currently reports unrelated existing issues in admin tours files outside this agencies scope; agencies redesign files were adjusted to avoid introducing additional TypeScript errors in this area.

---

## Delete Account Panel Redesign (Admin Safety Review Mode)

### 1) Date/time of change

- 2026-05-03 17:51:10 +08:00

### 2) What was changed

- Fully redesigned only the admin Delete Account panel under `/admin/account-deletions`.
- Replaced the old destructive-first UI with a safety-first review workflow:
  - premium operations header
  - explicit safety banner
  - KPI row (real request/risk counts)
  - advanced search/filter/sort toolbar
  - desktop table + responsive mobile cards
  - rich account impact detail sheet
  - reject-request confirmation flow
- Added route-specific loading skeleton for account deletion panel.
- Reworked account-deletion server action module to:
  - provide enriched admin review payload with linked-data/risk metrics
  - disable hard-delete processing action in this panel
  - keep safe reject flow only, including reviewer audit field update (`reviewed_by`).

### 3) Files changed

- `features/account-deletions/actions.ts`
- `app/(admin)/admin/account-deletions/page.tsx`
- `app/(admin)/admin/account-deletions/admin-account-deletions-content.tsx`
- `app/(admin)/admin/account-deletions/loading.tsx`
- `docs/admin_design.md`

### 4) Data sources used

- Server-side admin-safe reads through existing `createAdminClient()` + `assertAdminAccess()`.
- Primary source: `account_deletion_requests` queue.
- Fallback source when queue table is unavailable: `profiles` lookup rows.
- Linked impact sources:
  - `profiles`
  - `agencies`
  - `tours`
  - `leads`
  - `tour_promotions`
  - `maxcoin_transactions`
  - `verification_requests`
  - `favorites`
  - `reviews`
  - optional `featured_items` when available

### 5) Supabase tables/RPC/functions used

- Tables queried:
  - `account_deletion_requests`
  - `profiles`
  - `agencies`
  - `tours`
  - `leads`
  - `tour_promotions`
  - `maxcoin_transactions`
  - `verification_requests`
  - `favorites`
  - `reviews`
  - `featured_items` (optional; gracefully handled if unavailable)
- Mutations used:
  - `account_deletion_requests` status update to `rejected` (existing flow)
  - `profiles.deletion_requested_at` / `profiles.deletion_request_id` reset on reject
  - `agencies.deletion_requested_at` reset on reject (when linked)
- RPC/functions:
  - No new RPC/function added.
  - Hard-delete processing action is disabled in this web admin panel.

### 6) Components used

- Existing shared/admin UI:
  - `Button`
  - `Input`
  - `Textarea`
  - `Select`
  - `Badge`
  - `Dialog`
  - `Sheet`
  - `Skeleton`
- Existing utilities/icons:
  - `cn`, `formatDate`, `formatNumber` from `lib/utils`
  - existing `lucide-react` icon set
  - existing toast system (`sonner`)
- No new dependencies installed.

### 7) Design decisions

- Treated account deletion as high-risk and shifted to a review-first model with explicit risk visibility.
- Kept all metrics grounded in real linked table data; unavailable sources render as `Not available` instead of fake values.
- Implemented clear risk hierarchy (low/medium/high/critical) using transparent rule-based flags.
- Preserved existing admin guard model (`profiles.role = 'admin'`) and route structure.
- Disabled destructive delete action in UI and server action output to avoid unsafe hard-delete execution from this panel.
- Retained safe reject workflow with explicit typed confirmation (`REJECT`) and refresh-on-success.

### 8) What was intentionally not changed

- No changes to middleware.
- No changes to `/admin/login`.
- No changes to admin auth guard rules.
- No changes to sidebar structure (existing Delete Account nav route retained).
- No changes to dashboard/agencies/tours/users/verification/leads/promotions/featured panels.
- No changes to public/user/agency pages.
- No Supabase schema changes.
- No migrations added.
- No RLS policy changes.
- No mobile project edits.

### 9) Local test command

- `npm run dev`

### 10) Manual QA checklist

- Open `http://localhost:3000/admin/account-deletions`.
- Confirm header, subtitle, refresh button, and last-updated indicator are visible.
- Confirm red safety banner clearly states destructive deletion is disabled.
- Confirm KPI cards populate with real values from available data.
- Test search by:
  - full name
  - email
  - phone
  - role
  - request ID
  - agency name
  - reason text
- Test filters:
  - role
  - request status
  - linked agency
  - active tours
  - leads
  - promotions
  - high-risk only
  - created/requested date range
- Test sort options:
  - newest
  - oldest
  - pending first
  - highest risk
  - role
  - linked data count
- Open detail sheet from list row and verify:
  - identity section
  - linked agency section
  - impact summary section
  - request/review section
  - risk warnings
  - action center buttons
- Confirm `Process deletion` is visibly disabled with reason text.
- Confirm `Reject request` flow:
  - dialog opens
  - requires typing `REJECT`
  - optional admin note persists through submission
  - success toast appears and list refreshes
- Confirm empty/error states render correctly when filters remove all rows or sources fail.
- Confirm mobile/tablet fallback layout remains usable.

### 11) Known limitations or missing data

- `bookings/orders` impact metrics are not available in current admin query layer/table mapping and are shown as `Not available`.
- `featured_items` may not exist in some environments; this metric is optional and rendered as unavailable when absent.
- In this web repo there is no integrated vetted admin deletion executor endpoint currently wired for safe hard-delete from the panel.

### 12) Safety notes for account deletion

- Destructive account deletion is treated as high-risk and is intentionally blocked in this panel.
- UI exposes explicit risk flags (admin target, self-target, active tours/promotions/leads, MaxCoin balance, unresolved verification, recent activity).
- No client-side direct delete is performed.
- No direct `auth.users` delete is performed from client code.
- No direct profile hard-delete is exposed via this panel.
- Reject flow is explicit and auditable (`reviewed_by`, `reviewed_at`, `admin_notes`).

### 13) Whether actual deletion is implemented or disabled/read-only

- Actual deletion is **disabled** in this admin panel.
- Panel operates in safe review mode with non-destructive actions.

### 14) If disabled, exact missing backend requirements

- Dedicated admin-safe deletion processor must be explicitly wired for web admin use (Edge Function or server endpoint) with verified admin JWT checks.
- Backend must enforce hard guardrails:
  - block deletion of `profiles.role = 'admin'` targets unless explicitly approved by policy
  - block current-admin self-delete
- Backend should expose deterministic impact preview contract before destructive execution.
- Backend should guarantee idempotent request locking and reliable reviewer audit trail.
- Backend should define partial-failure recovery/compensation behavior for storage and relational cleanup.

---

## Leads Panel Redesign (Admin Leads)

### 1) Date/time of change

- 2026-05-03 18:23:00 +08:00

### 2) What was changed

- Completely redesigned only `/admin/leads` into a desktop-first CRM/inbox operations panel.
- Added leads operations header with:
  - title `Leads`
  - subtitle for inquiry tracking and response operations
  - refresh action
  - last-updated indicator
- Added KPI cards with click-to-filter behavior:
  - total leads
  - new/unread (`status = new`)
  - open/in-progress (`status = contacted`)
  - converted/closed (`status in won, closed`)
  - lost/cancelled (`status = lost`)
  - leads in last 24h
  - leads in last 7d
  - stale unresolved leads (derived from `updated_at`/`created_at`)
- Added advanced search/filter/sort toolbar with only real field-backed controls:
  - search by customer/contact/tour/agency/destination/message
  - status filter
  - agency filter
  - tour filter
  - destination filter
  - outcome filter (open/converted/lost derived from real statuses)
  - contact presence filter
  - created date range filter
  - sort: newest, oldest, unresolved first, status, agency, tour
- Replaced old simple cards with a stronger admin table + responsive mobile cards.
- Added row-level quick actions:
  - open detail
  - copy contact
  - safe status progression quick action (`new -> contacted`, `contacted -> closed`)
- Added rich lead detail sheet with:
  - lead identity and status
  - customer/contact block
  - full inquiry message
  - tour context with admin/public links
  - agency context with verification/approval state
  - workflow metadata
  - quality warnings
  - admin action center
- Added safe status update workflow using existing admin-authenticated server action with:
  - confirmation dialog
  - loading/disable state
  - success/error feedback
  - local state update + route refresh
- Added lead-specific loading skeleton route state (`/admin/leads/loading.tsx`).

### 3) Files changed

- `app/(admin)/admin/leads/page.tsx`
- `app/(admin)/admin/leads/admin-leads-content.tsx`
- `app/(admin)/admin/leads/loading.tsx` (new)
- `features/admin/queries.ts`
- `features/admin/types.ts`
- `features/admin/actions.ts`
- `docs/admin_design.md`

### 4) Data sources used

- Server-side admin leads payload query from `features/admin/queries.ts`:
  - `getAdminLeadsPanelData()`
- Existing admin auth/role guard path (`assertAdminAccess`) and admin Supabase client (`createAdminClient`).
- Existing client-side refresh flow (`router.refresh`) for synchronization after status actions.

### 5) Supabase tables/RPC/functions used

Tables queried:
- `leads`
- `tours` (joined as `tour`)
- `agencies` (joined as `agency`)
- `profiles` (joined as `user` via `user_id`)

Mutations:
- `leads` status update via new admin server action `updateLeadStatusAction()` in `features/admin/actions.ts`

RPC/functions:
- No new RPC used
- No database functions added/changed

### 6) Components used

Shared/admin:
- `PageTitle`
- `SectionShell`

UI:
- `Card`, `CardContent`
- `Badge`
- `Button`
- `Input`
- `Select`
- `Sheet`
- `Dialog`
- `Skeleton` (loading file)

Icons:
- Existing `lucide-react` icons only

Notifications:
- Existing `sonner` toast usage

### 7) Design decisions

- Chosen layout: CRM-style operations table on desktop + compact cards on smaller screens for operational scanability.
- Every major metric card is interactive and applies a useful filter preset.
- Detail workflow is in-sheet (not route change) for faster triage.
- Quality checks are warnings only (non-blocking) and based strictly on real current fields.
- No synthetic/fake stats were introduced; all metrics are computed from fetched leads rows and existing relations.
- Lead status action is confirmation-gated and strictly limited to known schema statuses (`new`, `contacted`, `closed`, `won`, `lost`).
- Where requested data dimensions were not present in schema/query layer, UI explicitly shows unavailable state instead of guessing.

### 8) What was intentionally not changed

- Sidebar layout/design unchanged.
- Dashboard unchanged.
- Agencies/Tours/Users/Verification panel designs unchanged.
- Admin login page unchanged.
- Middleware unchanged.
- Admin auth guard unchanged (`profiles.role = 'admin'` restriction preserved).
- Public/user/agency pages untouched.
- No Supabase schema changes, no migrations, no RLS changes.
- No new dependency/library added.

### 9) Local test command

- `npm run dev`

### 10) Manual QA checklist

- Open `http://localhost:3000/admin/leads`.
- Confirm header renders title/subtitle, refresh, and last-updated indicator.
- Confirm KPI cards show real counts and apply filters when clicked.
- Test global search across:
  - customer name
  - phone/email
  - tour title
  - agency
  - destination
  - message text
- Test filters:
  - status
  - agency
  - tour
  - destination
  - outcome
  - contact presence
  - recent window
  - created date range
- Test sorting options:
  - newest
  - oldest
  - unresolved first
  - status
  - agency
  - tour
- Open lead detail from both desktop row and mobile card.
- In detail, verify:
  - customer/contact values
  - full inquiry text
  - tour context links
  - agency verification/approval indicators
  - workflow metadata block
  - quality warnings block
- Trigger status update:
  - confirmation dialog appears
  - button disables/spinner appears during request
  - success/error toast shown
  - status updates and data refresh behavior remains correct
- Verify loading skeleton appears while route loads.
- Resize to tablet/mobile widths and verify list remains usable.

### 11) Known limitations or missing data

- `leads` schema in this project currently does not expose explicit source/channel, response-time, assignment-owner, admin-note, or agency-response-note columns in existing query layer.
- No dedicated admin agency detail route is currently present; agency context links to `/admin/agencies` panel rather than `/admin/agencies/[id]`.
- No dedicated admin user detail route is currently present; user context links to `/admin/users`.
- Conversation/activity timeline beyond lead timestamps is not available from existing lead query relations.
- High-intent scoring is not available because no lead-scoring field exists in the current schema/query path.

---

## Promotions / MaxCoin Panel Redesign (Admin Only)

### 1) Date/time of change

- 2026-05-03 17:48:56 +08:00

### 2) What was changed

- Fully redesigned the admin Promotions / MaxCoin operations experience on ` /admin/coin-requests ` (existing panel route).
- Added premium operations layout with:
  - page header/subtitle
  - refresh button
  - last-updated indicator
  - KPI strip (active, scheduled/pending, ending soon, expired, spent, low balance)
  - placement monitoring cards
  - advanced search/filter/sort toolbar
  - promotions operations table
  - MaxCoin ledger section
  - agency balances section
  - pending coin request operations section
  - data-quality warning section
  - promotion detail drawer
  - agency MaxCoin detail drawer
- Replaced old coin-request-only list UI with a unified promotion + MaxCoin operations panel.
- Added route-level loading and error states for this panel.
- Updated `/admin/featured` route to redirect into the new operations panel with featured placement preset for compatibility.
- Added new typed admin query payload for promotions/maxcoin aggregation with partial-data health reporting.

### 3) Files changed

- `features/admin/types.ts`
- `features/admin/queries.ts`
- `app/(admin)/admin/coin-requests/page.tsx`
- `app/(admin)/admin/coin-requests/admin-coin-requests-content.tsx`
- `app/(admin)/admin/coin-requests/loading.tsx`
- `app/(admin)/admin/coin-requests/error.tsx`
- `app/(admin)/admin/featured/page.tsx`
- `docs/admin_design.md`

### 4) Data sources used

- Server-side admin payload:
  - `getAdminPromotionsMaxcoinPanelData()` from `features/admin/queries.ts`
- Existing safe mutation actions:
  - `approveCoinRequest()`
  - `rejectCoinRequest()`
- Existing admin guard/client:
  - `assertAdminAccess()`
  - `createAdminClient()`

### 5) Supabase tables/RPC/functions used

- Tables queried:
  - `tour_promotions`
  - `featured_items`
  - `maxcoin_transactions`
  - `coin_requests`
  - `agencies`
  - `promotion_tiers`
  - `leads` (tour lead metrics for promoted tours)
- RPC used for this redesign:
  - None added
- Mutations used:
  - Existing server actions for coin requests only (approve/reject)

### 6) Components used

- Shared/admin:
  - `PageTitle`
  - `SectionShell`
- UI:
  - `Card`, `CardHeader`, `CardContent`, `CardTitle`, `CardDescription`
  - `Button`
  - `Input`
  - `Select`
  - `Badge`
  - `Dialog`
  - `Sheet`
  - `Separator`
  - `Skeleton` (loading file)
- Existing icon set:
  - `lucide-react`
- Styling:
  - Tailwind CSS only

### 7) Design decisions

- Kept this redesign isolated to admin Promotions/MaxCoin routes/components only.
- Built one operations panel that combines promotions and MaxCoin in a single admin workflow surface.
- Preserved existing data integrity boundaries:
  - no direct client-side balance mutation
  - no service-role exposure in client
  - only existing server actions for financial state changes
- Promotion statuses are computed from real date/activity fields (`starts_at`, `ends_at`, `is_active`) to avoid fabricating unsupported states.
- Placement cards use real placement values present in data and display generic labels where schema does not provide humanized names.
- Slot-capacity and rotation controls are monitoring-only because no explicit safe editable slot config exists in current admin flow.

### 8) What was intentionally not changed

- Sidebar design was not changed.
- Dashboard, Agencies, Tours, Users, Verification, Leads panels were not redesigned.
- `/admin/login`, middleware, and admin auth guard behavior were not changed.
- No public/user/agency-facing pages were modified.
- No Supabase schema, migrations, RLS, or promotion algorithm changes were made.
- No new package dependencies/libraries were added.
- No cancel/expire/extend promotion mutation was added because no existing safe admin mutation flow exists in this codebase.

### 9) Local test command

- `npm run dev`

### 10) Manual QA checklist

- Open `http://localhost:3000/admin/coin-requests`.
- Verify header title/subtitle, refresh button, and last-updated indicator.
- Verify KPI cards render and clicking them applies useful filters/sort.
- Verify placement monitoring cards render from real placement values and click-to-filter works.
- Verify toolbar filters:
  - search
  - placement
  - promotion status
  - agency
  - tour
  - transaction type
  - date range
  - balance range
  - sort selector
  - reset
- Verify promotions table shows:
  - tour title/image
  - agency name
  - placement
  - status
  - start/end
  - MaxCoin cost (when available)
  - warning indicator
  - actions
- Open promotion detail drawer and verify:
  - identity/source
  - linked tour preview
  - linked agency preview
  - schedule/duration
  - MaxCoin cost
  - warning list
  - action center with unsupported actions clearly disabled
- Open agency balance and transaction rows; verify agency MaxCoin detail drawer.
- Verify pending coin requests can be approved/rejected with confirmation dialog and refresh.
- Verify empty states for promotions/transactions/agencies when filters remove all rows.
- Verify `http://localhost:3000/admin/featured` redirects to the redesigned operations page with featured placement preset.

### 11) Known limitations or missing data

- No explicit slot-capacity/rotation config table is currently wired in admin query layer, so over-capacity is monitoring-limited.
- Click/impression metrics for promotions are not available in the queried admin payload; performance currently uses available `tour.view_count` and lead counts.
- Ledger audit fields such as `admin_id`, `created_by`, `payment_id`, `order_id` are not present in the currently used transaction select fields, so they cannot be displayed.
- Promotion mutation actions (cancel/expire/extend/manual adjustment) are intentionally disabled due missing existing safe admin server mutation flows.
- `npx tsc --noEmit` still reports unrelated pre-existing errors in other admin modules (`users`, `leads`, `account-deletions`) outside this Promotions/MaxCoin scope.

---

## Verification Panel Redesign (Admin Verification)

### 1) Date/time of change

- 2026-05-03 17:40:37 +08:00

### 2) What was changed

- Completely redesigned only `/admin/verification` into a desktop-first moderation workspace for verification operations.
- Replaced the old pending/processed list with:
  - operations header (title/subtitle, refresh, last-updated)
  - KPI strip (total, pending, approved/verified, rejected, incomplete)
  - advanced search/filter/sort toolbar using only real fields
  - verification queue table (desktop) and card stack (mobile)
  - quick actions (view/approve/reject/copy contact)
- Added rich verification detail sheet with tabs:
  - Overview
  - Documents
  - Context
  - Risk
  - Actions
- Added document/media handling:
  - safe HTTP/HTTPS URL validation
  - document count and source labeling
  - image/document preview flows with fallback
  - open-in-new-tab links
- Added transparent risk/warning engine based on real fields only:
  - missing logo
  - missing legal/company name
  - missing contact
  - missing documents
  - missing city/location
  - no tours
  - manager profile incomplete
  - duplicate contact signature
  - unverified agency with published tours
- Added confirmation workflow for approve/reject:
  - confirmation dialog
  - loading state and double-submit protection
  - rejection reason required in UI
  - success/error toasts
  - data refresh after mutation
- Added verification-specific loading state file to prevent layout jump during route loading.
- Upgraded verification server data function to return enriched admin-safe payload:
  - agency
  - owner profile
  - related tours counts
  - recent tours preview

### 3) Files changed

- `features/verification/actions.ts`
- `features/verification/types.ts` (new)
- `app/(admin)/admin/verification/page.tsx`
- `app/(admin)/admin/verification/admin-verification-content.tsx` (rewritten)
- `app/(admin)/admin/verification/verification-detail-sheet.tsx` (new)
- `app/(admin)/admin/verification/verification-utils.ts` (new)
- `app/(admin)/admin/verification/loading.tsx` (new)
- `docs/admin_design.md`

### 4) Data sources used

- Server-side admin verification fetch from `getAllVerificationRequests()` in `features/verification/actions.ts`.
- Existing admin drill-down action `getAdminAgencyDetailAction()` for linked agency/tours/verification history context in detail sheet.
- Existing approval/rejection mutations:
  - `approveVerificationAction()`
  - `rejectVerificationAction()`

### 5) Supabase tables/RPC/functions used

Tables queried:
- `verification_requests`
- `agencies` (joined as `agency`)
- `profiles` (joined as `owner`)
- `tours` (for related tour count and preview)

Tables mutated:
- `verification_requests` (`status`, `admin_note`, `updated_at`)
- `agencies` (`is_verified`, `updated_at`)

RPC/functions:
- No new RPC added.
- Existing guard/helper usage:
  - `assertAdminAccess()` (unchanged role rule: `profiles.role = 'admin'`)
  - `createAdminClient()`

### 6) Components used

Shared/admin:
- `PageTitle`
- `SectionShell`

UI primitives:
- `Card`, `Badge`, `Button`, `Input`, `Select`, `Dialog`, `Sheet`, `Tabs`, `Textarea`, `Skeleton`

Verification-specific admin components:
- `verification-detail-sheet.tsx`
- `verification-utils.ts`

Other existing tools:
- `lucide-react` icons
- `sonner` toast
- Tailwind CSS transitions and responsive utilities

### 7) Design decisions

- Used a queue + detail moderation workflow optimized for desktop review speed.
- Kept all filtering/sorting strictly tied to known existing fields (no fabricated status types or fake metrics).
- Implemented incomplete/risk visibility through transparent warnings derived from actual request/agency/profile/tour fields.
- Kept unsupported actions visible but disabled (`request info`, `suspend`) to avoid fake mutation flows.
- Kept document rendering resilient against missing or invalid URLs to avoid broken layouts.
- Added detail tabs so identity, legal info, documents, context, and risk can be reviewed without route changes.

### 8) What was intentionally not changed

- No changes to middleware.
- No changes to admin auth guard semantics.
- No changes to `/admin/login`.
- No changes to sidebar/dashboard/agencies/tours/users panel designs.
- No changes to any public/user/agency-facing pages.
- No Supabase schema changes.
- No migrations.
- No RLS policy changes.
- No new package dependencies installed.

### 9) Local test command

- `npm run dev`

### 10) Manual QA checklist

- Open `http://localhost:3000/admin/verification`.
- Verify header subtitle, refresh button, and last-updated indicator render.
- Verify KPI cards show real values and are clickable.
- Verify search works for:
  - agency name/slug
  - manager name
  - email
  - phone
  - city/country
- Verify filters:
  - status
  - owner role
  - city
  - documents present/missing
  - legal info complete/missing
  - created date range
- Verify sorting:
  - newest
  - oldest
  - pending first
  - incomplete first
  - agency name
  - highest warning count
- Verify queue actions:
  - view detail
  - approve pending request
  - reject pending request
  - copy contact
- Verify reject flow enforces reason and shows success/error toast.
- Verify detail sheet tabs and data blocks render on missing fields without layout breaks.
- Verify document section:
  - image preview
  - non-image fallback
  - open-in-new-tab links
- Verify risk tab warning list and severity rendering.
- Verify loading state at route load (`/admin/verification/loading.tsx`).
- Verify responsive behavior on tablet/smaller desktop widths.

### 11) Known limitations or missing data

- Verification status currently supports only real existing values: `pending`, `approved`, `rejected`; no `needs_info`/`suspended` schema status exists.
- No dedicated admin route exists for direct single-user detail or single-agency detail; actions route to existing list pages (`/admin/users`, `/admin/agencies`).
- Document type is inferred from available URL fields and extension; there is no dedicated stored `document_type` column.
- Private signed URL generation is not introduced; panel displays only URLs already available through existing data paths.
- Full project `npx tsc --noEmit` still reports pre-existing unrelated type errors in `app/(admin)/admin/leads/page.tsx` and `app/(admin)/admin/users/page.tsx`.

---

## Audit Log Panel Redesign (Admin Audit)

### 1) Date/time of change

- 2026-05-03 17:48:10 +08:00

### 2) What was changed

- Replaced placeholder-only Audit Log with a real, admin-only, read-only monitoring panel at `/admin/audit-log`.
- Added server-side audit data discovery and normalization layer that pulls only real operational records and converts them into a unified audit event stream.
- Implemented explicit coverage modes:
  - `Partial audit coverage` when operational sources exist but no canonical audit table exists.
  - `Audit logging is not configured yet` when no source tables are readable.
- Added premium desktop-first UI with:
  - overview header and refresh
  - coverage banner with covered/uncovered areas
  - KPI row (total, 24h, high-risk, failed/error, admin actions, top module)
  - search/filter/sort toolbar
  - table/timeline hybrid event list
  - rich event detail sheet
  - source coverage table
  - loading/empty/error states
- Added metadata sanitization/redaction and safe detail rendering to avoid exposing tokens/secrets/auth internals.

### 3) Files changed

- `app/(admin)/admin/audit-log/page.tsx`
- `app/(admin)/admin/audit-log/audit-log-content.tsx`
- `app/(admin)/admin/audit-log/audit-log-detail-sheet.tsx` (new)
- `app/(admin)/admin/audit-log/loading.tsx` (new)
- `features/admin/audit-log.ts` (new)
- `docs/admin_design.md`

### 4) Data sources used

- Admin-safe server reads via `createAdminClient()` after `assertAdminAccess()`.
- Real operational sources queried (when present):
  - verification workflow
  - maxcoin/promotion workflow
  - deletion review workflow
  - notification operation logs
- No fake or hardcoded audit records were introduced.

### 5) Supabase tables/RPC/functions used

- Tables used:
  - `verification_requests`
  - `coin_requests`
  - `maxcoin_transactions`
  - `tour_promotions`
  - `account_deletion_requests` (queried with graceful fallback if unavailable)
  - `notification_log` (queried with graceful fallback if unavailable)
- RPC used:
  - None
- Admin guard/helpers:
  - `assertAdminAccess()`
  - `createAdminClient()`

### 6) Components used

- Existing UI/shared components only:
  - `Button`, `Input`, `Select`, `Badge`, `Sheet`, `Separator`, `Skeleton`
- Existing icon library:
  - `lucide-react`
- Tailwind CSS for layout/visual design.
- No new dependencies installed.

### 7) Design decisions

- Kept audit view read-only by design; no create/update/delete actions are exposed.
- Since no canonical `audit_logs` table exists, implemented transparent derived timeline from real operational tables and clearly labeled it as partial coverage.
- Added high-risk signals based on real event classes (verification decisions, deletion approvals/reviews, financial moderation, debit ledger activity).
- Added click-through filtering interactions from KPI cards and row-level quick detail.
- Kept sensitive-data redaction centralized in server normalization (`features/admin/audit-log.ts`) to prevent accidental raw metadata leakage in UI.

### 8) What was intentionally not changed

- Middleware/domain routing was not touched.
- `/admin/login` and admin auth guard flow were not changed.
- Sidebar was not redesigned/modified.
- Dashboard/Agencies/Tours/Users/Verification/Leads/Promotions/Featured/Delete Account panels were not redesigned.
- No public/user/agency pages were changed.
- No Supabase schema/migration/trigger/RLS changes were made.
- No audit write/delete/edit/export actions were added.

### 9) Local test command

- `npm run dev`

### 10) Manual QA checklist

- Open `http://localhost:3000/admin/audit-log`.
- Verify header, subtitle, refresh button, and last-updated indicator.
- Verify coverage banner shows:
  - partial coverage when at least one source table is available
  - not configured mode when all sources are unavailable
- Verify KPI cards:
  - total events
  - last 24h
  - high-risk
  - failed/error
  - admin actions
  - top module
- Click KPI cards and verify filter behavior updates event list.
- Test toolbar search/filter/sort:
  - actor
  - action type
  - entity type
  - severity
  - status
  - source module
  - date range
  - high-risk only
  - failed only
- Open several events and verify detail sheet sections:
  - actor
  - target entity
  - status/severity
  - risk notes
  - sanitized metadata
  - related admin route links
- Verify no sensitive values (tokens/secrets/headers/cookies/service keys/passwords/refresh/access tokens) appear in metadata.
- Verify source coverage table availability/counts and warning rendering.
- Verify loading skeleton on route load.

### 11) Known limitations or missing data

- There is no canonical `audit_logs` table in the currently discovered source set, so this panel cannot provide full actor-accurate audit history for every admin mutation.
- Some source tables may be environment-dependent (`account_deletion_requests`, `notification_log`) and can be unavailable; panel degrades gracefully.
- Verification/coin moderation events do not always include explicit `reviewed_by` actor fields, so actor identity can be missing for some admin decisions.
- Before/after diffs are not currently available from existing source tables.

### 12) Audit coverage notes

- Covered now (real/derived):
  - verification request lifecycle and approve/reject decisions
  - maxcoin request submission/resolution
  - maxcoin ledger credits/debits
  - promotion record creation windows
  - account deletion request/review flow (if table present)
  - notification operations log (if table present)
- Not covered now:
  - canonical login/auth security events
  - generic admin settings/config mutation history
  - complete actor-attribution trail for every admin action
  - global error/event stream equivalent to a dedicated system audit table

### 13) Whether audit data is real, partial, or unavailable

- Current implementation status: **real + partial coverage**.
- Events shown are derived only from real records in existing tables; no fake records are generated.
- UI automatically switches to unavailable mode when no source table is readable.

### 14) Missing backend requirements if no audit log table exists

- For full audit capability, backend should provide a canonical `audit_logs` source with at least:
  - `actor_id`
  - `action`
  - `entity_type`
  - `entity_id`
  - `status`
  - `severity`
  - `metadata JSONB`
  - `created_at`
- Also required for production-grade completeness:
  - server-side logging at every admin mutation entrypoint
  - explicit admin-only read policy (RLS/admin role)
  - consistent actor attribution (`reviewed_by`/`performed_by`) for moderation flows

---

## Settings Panel Redesign (Admin Settings)

### 1) Date/time of change

- 2026-05-03 19:02:00 +08:00

### 2) What was changed

- Rebuilt only `/admin/settings` as a premium desktop-first admin operations settings panel.
- Implemented a server-side admin settings snapshot loader to read safe status/config data and mask sensitive values.
- Added settings coverage banner, readiness cards, grouped expandable settings sections, and warning rails.
- Added settings-specific loading and error route states.
- Implemented strict read-only behavior because no safe global settings mutation backend was detected.
- Added backend requirements dialog and explicit “read-only by design” explanations.

### 3) Files changed

- `app/(admin)/admin/settings/page.tsx`
- `app/(admin)/admin/settings/settings-content.tsx`
- `app/(admin)/admin/settings/loading.tsx` (new)
- `app/(admin)/admin/settings/error.tsx` (new)
- `features/admin/settings-types.ts` (new)
- `features/admin/settings.ts` (new)
- `docs/admin_design.md`

### 4) Data sources used

- Server runtime env presence checks via `process.env` (status-only for secrets).
- Admin-safe server queries through `createAdminClient()` after `assertAdminAccess()`.
- Routing/domain expectations from:
  - `lib/routing/domains.ts`
  - `lib/routing/guards.ts`
  - docs domain/deployment documents
- Deployment command/domain expectations from `package.json` scripts and docs.
- Existing admin feature docs and current panel implementations for audit/account-deletion status interpretation.

### 5) Supabase tables/RPC/functions used

Tables queried (read-only):
- `profiles`
- `verification_requests`
- `tours`
- `tour_promotions`
- `featured_items`
- `account_deletion_requests`
- `notification_log`
- `promotion_tiers`

Functions/RPC:
- No new RPC used.
- No settings mutation action added.
- Existing guard used: `assertAdminAccess()`.

### 6) Components used

- Shared UI:
  - `PageTitle`
  - `SectionShell`
- UI primitives:
  - `Card`
  - `Badge`
  - `Button`
  - `Dialog`
  - `Skeleton`
- Icons from existing `lucide-react`.
- Tailwind CSS for layout and visual states.

### 7) Design decisions

- Chose **read-only** settings mode to avoid unsafe production mutations without an audited backend flow.
- Represented status with clear badges for:
  - configured/missing/unknown/expected/not-available
  - risk level
  - source
  - editability
- Added expandable grouped sections to keep high-density configuration readable:
  - General Platform
  - Admin Access
  - Marketplace Controls
  - Promotions / MaxCoin
  - Notifications / Admin Alerts
  - Security / Compliance
  - System Readiness
- Used “Expected by config” wording for domain/routing behavior that is not live-network verified in-panel.
- Enforced secret-safe display policy (never render raw tokens/keys/chat IDs/secrets).

### 8) What was intentionally not changed

- Middleware was not modified.
- Admin auth logic and guard behavior were not modified.
- `/admin/login` was not modified.
- Sidebar/dashboard/agencies/tours/users/verification/leads/promotions/featured/delete-account/audit panels were not redesigned here.
- No public/user/agency pages were modified.
- No Supabase schema, migrations, RLS policies, or SQL were changed.
- No new dependencies/packages were installed.

### 9) Local test command

- `npm run dev`

### 10) Manual QA checklist

- Open `http://localhost:3000/admin/settings`.
- Confirm page header, subtitle, configuration mode, last-updated, and refresh button render.
- Confirm coverage banner shows backend status and read-only explanation.
- Confirm readiness cards render:
  - Admin domain configured
  - Supabase connectivity
  - Audit status
  - Account deletion flow
  - Notification alerts
  - Settings backend status
- Expand each section and verify cards show:
  - setting name
  - value/status
  - editability badge
  - source badge
  - risk badge
  - sensitive masking note when applicable
- Confirm no setting mutation controls are enabled.
- Confirm backend requirements dialog opens and lists missing requirements.
- Confirm warnings/limitations blocks render without layout breaks.
- Verify loading skeleton appears on refresh/navigation.
- Simulate error boundary and confirm retry UI appears.
- Confirm `/admin/login` and non-settings admin pages remain unchanged.

### 11) Known limitations or missing data

- No dedicated global settings persistence backend exists for safe admin writes.
- Some status metrics may be unknown if optional tables are unavailable in the runtime environment.
- Domain/routing indicators are config-derived expectations, not active network probes.
- Notification outbox status depends on `notification_log` availability and readable permissions.

### 12) Settings safety notes

- Secrets are never displayed:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ADMIN_BOT_TOKEN`
  - `ADMIN_BOT_WEBHOOK_SECRET`
  - `ADMIN_CHAT_ID`
  - `ADMIN_CHAT_ID_2`
- Public values are shown only as safe summaries or masked previews when needed.
- No environment-variable editing was implemented.
- No destructive toggles/actions were implemented.
- Production configuration management remains external (Cloudflare/Supabase dashboards).

### 13) Whether settings are editable or read-only

- Current implementation status: **read-only**.
- Editable controls intentionally disabled until safe backend mutation flow exists.

### 14) If read-only, exact missing backend requirements

- A dedicated admin-safe settings persistence layer with allowlisted fields and strict server-side validation.
- Server actions or RPC endpoints for global settings updates (marketplace defaults, notification policies, promotion policy) with transactional safety.
- Immutable audit trail for every settings change (actor, timestamp, before/after values, reason).
- High-risk change confirmation and rollback workflow before enabling editable controls.

---

## Featured Promotions Panel Redesign (Admin Featured)

### 1) Date/time of change

- 2026-05-03 18:09:52 +08:00

### 2) What was changed

- Replaced `/admin/featured` redirect behavior with a dedicated Featured Promotions admin operations panel.
- Built a new premium, desktop-first featured operations surface with:
  - page header + subtitle + refresh + last-updated indicator
  - KPI row (active, scheduled, ending soon, expired, slot pressure, warnings)
  - placement monitoring cards with active/ending-soon/warnings/slot usage
  - search/filter/sort toolbar
  - featured promotions list (image-rich table + responsive cards)
  - drill-down detail sheet with linked tour/agency previews
  - campaign quality warning panel
  - read-only action center with safe disabled states for unsupported mutations
- Added featured-specific utility module for:
  - featured placement detection
  - warning generation
  - slot pressure math
  - sorting helpers
  - date/placement formatting helpers
- Extended promotions tour preview shape with location fields (`country`, `city`, `region`, `district`) to support destination filtering and display.

### 3) Files changed

- `app/(admin)/admin/featured/page.tsx`
- `app/(admin)/admin/featured/admin-featured-content.tsx`
- `app/(admin)/admin/featured/featured-promotions-utils.ts` (new)
- `features/admin/queries.ts`
- `features/admin/types.ts`
- `docs/admin_design.md`

### 4) Data sources used

- `getAdminPromotionsMaxcoinPanelData()` from `features/admin/queries.ts` (existing admin promotions payload).
- Featured panel consumes real rows from that payload:
  - `promotions` (combined `tour_promotions` + `featured_items`)
  - `promotionTiers`
- Last-updated metadata from payload `generatedAt`.

### 5) Supabase tables/RPC/functions used

Queried (via existing `getAdminPromotionsMaxcoinPanelData()` pipeline):
- `tour_promotions`
- `featured_items`
- `promotion_tiers`
- `leads` (tour lead summary enrichment)
- `agencies` (joined agency metadata for promotions)
- `maxcoin_transactions` and `coin_requests` are still queried by the reused existing payload function (not mutated by this featured panel)

RPC/functions:
- No new RPC added.
- No mutation RPC/action added for featured cancellation/expiry/extension/priority.

### 6) Components used

- Shared components:
  - `PageTitle`
  - `SectionShell`
- UI primitives:
  - `Card`, `Badge`, `Button`, `Input`, `Select`, `Sheet`, `Separator`
- Existing icons from `lucide-react`
- Existing toast system `sonner`
- Existing utility helpers:
  - `formatNumber`
  - `placeholderImage`
  - `cn`

### 7) Design decisions

- Kept all work isolated to admin featured route/components and existing admin query/types.
- Did not redesign other admin panels.
- Kept panel read-only for monetization-sensitive campaign actions unless existing safe server mutation exists.
- Featured placement detection is based on real placement values only:
  - Union of:
    - placements present in records sourced from `featured_items` (`source = featured_item`)
    - real placement values in promotions/tiers matching known featured/recommended signals (`featured`, `recommended`, `tavsiya`, `main_banner`, `featured_banner`, `homepage_featured`, `home_featured`, `good_deals`, `hot_tours`, `hot_deals`, and keyword matches `featured/recommend/tavsiya/banner`)
    - fallback to actual observed placement values if no featured-like values are detected
- Slot monitoring is read-only:
  - known limit map shown only when available
  - no rotation/pricing/mutation logic changed
- Destination filter uses real tour location fields now included in promotion tour preview (`country`, `city`, `region`, `district`).

### 8) What was intentionally not changed

- No middleware changes.
- No admin auth guard changes.
- `/admin/login` unchanged.
- No changes to Dashboard, Agencies, Tours, Users, Verification, Leads, or general Promotions/MaxCoin panel route UI.
- No public/user/agency page changes.
- No Supabase schema/migration/RLS changes.
- No pricing logic, MaxCoin mutation logic, or promotion rotation algorithm changes.
- No new package dependencies.

### 9) Local test command

- `npm run dev`

### 10) Manual QA checklist

- Open `http://localhost:3000/admin/featured`.
- Verify header/subtitle, refresh button, and last-updated badge.
- Verify KPI cards render and click-to-filter works:
  - active
  - scheduled
  - ending soon
  - expired
  - slot pressure
  - warnings
- Verify placement monitoring cards show real placement values and click-to-filter by placement works.
- Verify toolbar behaviors:
  - search (tour/agency/placement/contact/id/destination)
  - placement filter
  - status filter
  - agency filter
  - destination filter
  - issue filter
  - date range
  - sort selector
  - reset filters
- Verify campaigns list rows show:
  - image
  - tour title
  - agency
  - placement
  - status
  - schedule
  - quality/warning summary
  - quick actions
- Open detail sheet from table and mobile cards; verify:
  - linked tour section
  - linked agency section
  - schedule/remaining/duration
  - warnings
  - action center (safe read-only disabled mutations)
- Verify copy actions:
  - copy campaign ID
  - copy public link
- Verify empty state appears when filters remove all rows.
- Verify partial-data warning card appears when payload health reports errors.

### 11) Known limitations or missing data

- No existing safe admin mutation flow was found for cancel/expire/extend/priority updates; these actions are intentionally disabled.
- Rotation fairness internals (e.g., rank, delivered impressions, serving order) are not exposed by current web admin payload tables, so fairness notes are limited to available status/time/pressure signals.
- Slot-capacity display uses known values only when available in current logic; unknown placements remain `Not available`.
- Existing query function still fetches broader promotions/maxcoin datasets because the panel reuses `getAdminPromotionsMaxcoinPanelData()` to avoid duplicating query logic.
- If runtime schema differs from local snapshot/migration references, some metrics may be partial and are surfaced through payload health warnings.
