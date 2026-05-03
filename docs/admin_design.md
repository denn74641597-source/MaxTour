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
