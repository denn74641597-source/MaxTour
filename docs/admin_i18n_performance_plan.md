# MaxTour Admin I18n + Performance Audit Plan

Generated at: 2026-05-04 14:48:20 +08:00 (Asia/Singapore)
Audit mode: Read-only audit (no application code edits)

## Scope + constraints
- Editable workspace audited: `C:\Users\adbax\OneDrive\Desktop\MaxTour`
- In-scope: admin panel only (`/admin` + admin-related admin components)
- Out of scope: public/user (`mxtr.uz`) and agency panel (`agency.mxtr.uz`) code changes
- Hard constraints preserved:
  - Do not change Supabase schema/RLS/migrations/RPC/functions
  - Do not break `remote.mxtr.uz` routing
  - Do not break `/admin/login`

## 1) Date/time
- 2026-05-04 14:48:20 +08:00 (Asia/Singapore)

## 2) Admin pages inspected
- `/admin`
- `/admin/login`
- `/admin/agencies`
- `/admin/tours`
- `/admin/tours/[id]`
- `/admin/users`
- `/admin/verification`
- `/admin/leads`
- `/admin/coin-requests` (Promotions / MaxCoin)
- `/admin/featured` (Featured Promotions)
- `/admin/account-deletions` (Delete Account)
- `/admin/audit-log`
- `/admin/settings`
- `/admin/subscriptions`

Also inspected:
- Admin shell/layout/sidebar
- Top-level admin error/loading boundaries
- Admin drawers/dialogs/sheets/tabs/toasts
- Admin query/data modules (`features/admin/*`, plus account deletion + verification sources used by admin routes)

## 3) Current i18n/language structure
Current shared i18n exists but admin adoption is partial.

Existing architecture:
- `lib/i18n/config.ts`
  - Supported languages: `uz`, `ru`
  - Default language: `uz`
- `lib/i18n/context.tsx`
  - `LanguageProvider`, `useTranslation`
  - Persists selected language in `localStorage` key: `maxtour-lang`
- `lib/i18n/types.ts`
  - Large typed dictionary interface
  - Has only a small `admin` section (not enough to cover all admin surfaces)
- `lib/i18n/uz.ts`, `lib/i18n/ru.ts`
  - Include limited `admin` keys

Admin usage today:
- `useTranslation` is used only in `app/(admin)/admin-sidebar.tsx`
- Most admin UI copy is still hardcoded in component files

## 4) All places where English text remains
English remains broadly across admin UI and admin-visible backend-derived strings.

High-level coverage:
- Navigation/shell labels
- Dashboard KPI labels/descriptions
- Page titles/subtitles
- Filter labels/options/placeholders
- Table/list headers and row metadata
- Status labels/badges
- Empty states/loading/error states
- Toasts
- Dialog/sheet titles, descriptions, confirm copy
- Utility-generated warning strings and fallback labels
- Date/time locale formatting pinned to English locales in several files

Primary file groups with visible English copy:
- Admin shell:
  - `app/(admin)/admin-sidebar.tsx`
  - `components/layouts/admin-dashboard-layout.tsx`
  - `app/(admin)/error.tsx`
- Route files with English fallback messages:
  - `app/(admin)/admin/page.tsx`
  - `app/(admin)/admin/agencies/page.tsx`
  - `app/(admin)/admin/audit-log/page.tsx`
  - `app/(admin)/admin/coin-requests/page.tsx`
  - `app/(admin)/admin/featured/page.tsx`
  - `app/(admin)/admin/settings/page.tsx`
  - `app/(admin)/admin/verification/page.tsx`
- Major content/sheet/dialog surfaces:
  - `app/(admin)/admin/admin-dashboard-content.tsx`
  - `app/(admin)/admin/agencies/admin-agencies-content.tsx`
  - `app/(admin)/admin/tours/admin-tours-content.tsx`
  - `app/(admin)/admin/tours/tour-detail-sheet.tsx`
  - `app/(admin)/admin/tours/tour-admin-utils.ts`
  - `app/(admin)/admin/users/admin-users-content.tsx`
  - `app/(admin)/admin/users/user-detail-sheet.tsx`
  - `app/(admin)/admin/users/users-admin-utils.ts`
  - `app/(admin)/admin/verification/admin-verification-content.tsx`
  - `app/(admin)/admin/verification/verification-detail-sheet.tsx`
  - `app/(admin)/admin/verification/verification-utils.ts`
  - `app/(admin)/admin/leads/admin-leads-content.tsx`
  - `app/(admin)/admin/coin-requests/admin-coin-requests-content.tsx`
  - `app/(admin)/admin/featured/admin-featured-content.tsx`
  - `app/(admin)/admin/featured/featured-promotions-utils.ts`
  - `app/(admin)/admin/account-deletions/admin-account-deletions-content.tsx`
  - `app/(admin)/admin/audit-log/audit-log-content.tsx`
  - `app/(admin)/admin/audit-log/audit-log-detail-sheet.tsx`
  - `app/(admin)/admin/settings/settings-content.tsx`
  - `app/(admin)/admin/subscriptions/admin-subscriptions-content.tsx`
- Route-level error boundaries with English copy:
  - `app/(admin)/admin/coin-requests/error.tsx`
  - `app/(admin)/admin/settings/error.tsx`
  - `app/(admin)/admin/tours/error.tsx`

Admin-visible English from data-layer helper modules:
- `features/admin/audit-log.ts` (event/action labels, link labels, coverage text)
- `features/admin/settings.ts` (section/card titles/descriptions/value labels)
- `features/account-deletions/actions.ts` (risk labels/details surfaced in UI)
- `features/verification/actions.ts` (some user-facing error strings)

Locale formatting hotspots currently tied to English locale conventions:
- `app/(admin)/admin/account-deletions/admin-account-deletions-content.tsx` (`en-US`)
- `app/(admin)/admin/agencies/admin-agencies-content.tsx` (`en-GB`)
- `app/(admin)/admin/leads/admin-leads-content.tsx` (`en-GB`)
- `app/(admin)/admin/settings/settings-content.tsx` (`en-US`)
- `app/(admin)/admin/tours/admin-tours-content.tsx` (`en-US`)
- `app/(admin)/admin/users/users-admin-utils.ts` (`en-GB`)
- `app/(admin)/admin/verification/verification-utils.ts` (`en-GB`)

## 5) Proposed uz/ru admin dictionary structure
Recommendation: add a dedicated centralized admin dictionary module and map all admin text to keys.

Suggested module layout:
- `lib/i18n/admin/keys.ts` (key typing)
- `lib/i18n/admin/uz.ts`
- `lib/i18n/admin/ru.ts`
- `lib/i18n/admin/index.ts` (resolver + helpers)

Suggested top-level key namespaces:
- `admin.common` (shared actions: save/cancel/retry/search/reset, yes/no, dates)
- `admin.nav` (sidebar sections/items)
- `admin.auth` (`/admin/login` labels/errors)
- `admin.dashboard`
- `admin.agencies`
- `admin.tours`
- `admin.users`
- `admin.verification`
- `admin.leads`
- `admin.promotionsMaxcoin`
- `admin.featuredPromotions`
- `admin.deleteAccount`
- `admin.auditLog`
- `admin.settings`
- `admin.subscriptions`
- `admin.states` (empty/loading/error/validation/toast/confirm)
- `admin.status` (status codes => localized labels)

Required canonical naming (from task):
- Dashboard -> `Boshqaruv` / `Панель управления`
- Agencies -> `Agentliklar` / `Агентства`
- Tours -> `Turlar` / `Туры`
- Users -> `Foydalanuvchilar` / `Пользователи`
- Verification -> `Tasdiqlash` / `Верификация`
- Leads -> `So'rovlar` / `Заявки`
- Promotions -> `Reklama` / `Продвижение`
- Featured Promotions -> `Tavsiya reklamasi` / `Рекомендуемые продвижения`
- Delete Account -> `Akkauntni o'chirish` / `Удаление аккаунта`
- Audit Log -> `Audit jurnali` / `Журнал аудита`
- Settings -> `Sozlamalar` / `Настройки`

## 6) Proposed language switcher behavior
- Keep language switcher in admin shell (`admin-sidebar`) and standardize labels in selected language.
- Supported languages only: `uz`, `ru`.
- Switching language should:
  - update UI text immediately
  - persist selection
  - keep current admin route/path unchanged
  - not trigger auth/session changes
- On `/admin/login`, render the same switcher (or compact variant) so login is localized too.
- Do not alter admin route structure (`/admin/*`) to avoid domain/routing regressions.

## 7) Storage of selected language
Current project pattern:
- `localStorage['maxtour-lang']` via `LanguageProvider`

Recommended admin-safe extension:
- Continue `localStorage` for client persistence.
- Also set a non-sensitive cookie (e.g. `maxtour-lang=uz|ru; Path=/; SameSite=Lax`) so server components can select language before hydration.
- Validation: only accept `uz`/`ru`, fallback to `uz`.
- This avoids language flash/mismatch for server-rendered admin content.

## 8) Translation coverage checklist
Use this checklist route-by-route before considering admin localization complete.

Core surfaces:
- [ ] Sidebar: section titles, nav items, language card, session card, logout
- [ ] `/admin/login`: headings, labels, placeholders, button, errors
- [ ] Every page title/subtitle
- [ ] KPI cards, chart/metric labels
- [ ] Table/list headers
- [ ] Filter labels/options/placeholders
- [ ] Badges/status chips
- [ ] Empty states
- [ ] Loading states (skeleton companion labels if present)
- [ ] Error states and error boundaries
- [ ] Toasts
- [ ] Confirmation dialogs
- [ ] Drawers/sheets/tabs labels
- [ ] Validation and helper text
- [ ] Date/time formatting locale aware by language
- [ ] Fallback/unknown text (`Unknown`, `Not available`, etc.)

Final validation rule:
- [ ] No visible English remains in admin UI for `uz` or `ru` selection

## 9) Performance problems found by page
`/admin` (Dashboard):
- Many parallel count queries plus multiple recent/quality queries in one request (`getAdminDashboardData`).
- Client dashboard still renders large sections and dialog content up front.

`/admin/agencies`:
- `getAdminAgenciesOverview` fetches full datasets across agencies, tours, leads, verification, subscriptions, promotions and aggregates in memory.
- Client page is large (1376 lines), heavy filtering/sorting on full arrays.

`/admin/tours`:
- `getAdminToursPanelData` pulls all tours + all leads/promotions for all tour IDs.
- Client page (1003 lines) filters/sorts large datasets and mounts moderation dialog/detail UI in same render tree.

`/admin/tours/[id]`:
- Detail UI is client-side and image/content heavy; acceptable for detail route but still includes many panels rendered together.

`/admin/users`:
- Hard cap 500 profiles in one fetch; no server pagination.
- Detail sheet tabs render multi-block content eagerly.

`/admin/verification`:
- `getAllVerificationRequests` loads all verification requests and then loads all tours for matching agencies (no explicit tour limit).
- Client page (1093 lines) filters and renders large card/table layouts.

`/admin/leads`:
- `getAdminLeadsPanelData` fetches all leads with joins; no pagination.
- Client page (1415 lines), many filters and derived metrics over large arrays.

`/admin/coin-requests`:
- Uses very heavy panel payload (`getAdminPromotionsMaxcoinPanelData`) with large limits from multiple tables.
- Client page extremely heavy (1553 lines, 20 `useMemo`), multiple filtered lists and detail sheets.

`/admin/featured`:
- Reuses same heavy promotions/maxcoin payload as `/admin/coin-requests` even though surface needs subset.
- Client page (1063 lines, 14 `useMemo`) + warnings/placement computations.

`/admin/account-deletions`:
- `getAccountDeletionPanelData` performs broad enrichment queries and many in-memory loops/aggregations.
- Client page large (1055 lines) with complex filter/sort/detail rendering.

`/admin/audit-log`:
- `getAdminAuditPayload` loads multiple sources with high limits (300-700 range) and builds event timeline in memory.
- Client page (818 lines, 8 `useMemo`) filters full loaded records.

`/admin/settings`:
- Settings snapshot is read-only but includes many count queries + large English content payload assembly.
- No localization abstraction for backend-provided settings card labels.

`/admin/subscriptions`:
- Smaller than other pages but still client-heavy and currently unlocalized.

## 10) Slowest/high-risk admin pages
Highest risk by combined query + client render complexity:
1. `/admin/coin-requests`
2. `/admin/agencies`
3. `/admin/leads`
4. `/admin/verification`
5. `/admin/featured`
6. `/admin/account-deletions`
7. `/admin/audit-log`
8. `/admin/tours`

## 11) Heavy components/imports found
Large client components by file size/hook density:
- `admin-coin-requests-content.tsx` (1553 lines, 20 `useMemo`)
- `admin-leads-content.tsx` (1415 lines)
- `admin-agencies-content.tsx` (1376 lines)
- `admin-verification-content.tsx` (1093 lines)
- `admin-featured-content.tsx` (1063 lines)
- `admin-account-deletions-content.tsx` (1055 lines)
- `admin-tours-content.tsx` (1003 lines)

Import observations:
- `lucide-react` is used broadly across admin files.
- `next/image` is used in heavy list/detail panels (good baseline optimization, but still contributes render work when many cards mount).
- No admin route-level dynamic imports detected for heavy detail/sheet sections.

## 12) Query/data-fetching problems found
Key over-fetch patterns:
- `getAdminPromotionsMaxcoinPanelData`:
  - `tour_promotions` limit 600
  - `featured_items` limit 300
  - `maxcoin_transactions` limit 600
  - `coin_requests` limit 400
  - `agencies` limit 1200
- `getAdminAgenciesOverview` fetches multiple full tables without pagination then aggregates in server memory.
- `getAdminLeadsPanelData` and `getAdminToursPanelData` fetch broad datasets without route-level paging.
- `getAccountDeletionPanelData` performs many enrichment queries and loops for each panel load.
- `getAllVerificationRequests` enriches with tours by agency IDs and can grow significantly.

Duplication/consolidation opportunities:
- `/admin/coin-requests` and `/admin/featured` both call `getAdminPromotionsMaxcoinPanelData`; split into route-specific query payloads.
- Multiple pages compute similar agency/tour/lead stats independently; shared summary endpoints can reduce repeated scans.

## 13) Client/server component problems found
- Admin route group layout is client-only:
  - `app/(admin)/layout.tsx` (`'use client'`)
  - `components/layouts/admin-dashboard-layout.tsx` (`usePathname` runtime login check)
- Most heavy page UIs are client components even when large portions are read-only view.
- Server pages often fetch broad data and pass full payload to client components for filtering/sorting.
- Several routes rely on client-side filtering over entire loaded datasets instead of server-driven pagination/search.

## 14) Animation/rendering problems found
- No direct `framer-motion` usage found in admin route files.
- Many UI elements use repeated transition/hover effects (mostly minor), but primary performance cost is data + render volume, not animation library overhead.
- Heavy sheets/dialogs are mounted in large parent trees; detail content should be lazy-loaded/on-demand where safe.

## 15) Exact implementation plan (lowest risk first)
Phase 1: Foundation (low risk)
- Introduce centralized admin i18n dictionary module (`uz/ru`) with typed keys.
- Add status-label mapping helpers (`pending`, `approved`, etc.) in one place.
- Keep current business logic and DB contract unchanged.

Phase 2: Shell + login localization (low risk)
- Localize `admin-sidebar`, admin layout chrome, `/admin/login`, top-level admin error boundary.
- Standardize language switcher labels and UX.

Phase 3: Route-level copy extraction (low-medium risk)
- Localize page-level headings/subtitles/errors in admin `page.tsx`, `error.tsx`, `loading.tsx` files.
- Remove English fallbacks from admin route wrappers.

Phase 4: Content components localization (medium risk)
- Route-by-route migrate all admin content files to dictionary keys:
  - dashboard -> agencies -> tours -> users -> verification -> leads -> promotions/maxcoin -> featured -> account deletions -> audit log -> settings -> subscriptions
- Include drawers/dialogs/sheets/tabs/toasts/validation placeholders and confirmation copy.

Phase 5: Utility/data-string localization (medium risk)
- Localize admin-visible strings in util/data-building modules:
  - `featured-promotions-utils.ts`, `tour-admin-utils.ts`, `users-admin-utils.ts`, `verification-utils.ts`, `features/admin/audit-log.ts`, `features/admin/settings.ts`, and account-deletion risk labels shown in UI.

Phase 6: Language persistence hardening (medium risk)
- Keep `localStorage` pattern.
- Add cookie mirror for SSR-friendly admin language initialization.

Phase 7: Performance pass A (medium risk, no behavior change)
- Add server-side pagination/limits for large list routes.
- Add search debounce where client-side search remains.
- Reduce payload columns where unused.
- Add route-specific query split for `/coin-requests` vs `/featured`.

Phase 8: Performance pass B (higher risk, controlled)
- Convert non-interactive admin sections from client to server components.
- Lazy-load heavy drawers/sheets and mount only when open.
- Introduce dynamic imports for very heavy optional panels.

Phase 9: Final QA + hard checks
- Validate no visible English in admin for both languages.
- Verify `remote.mxtr.uz` domain behavior and `/admin/login` flow unchanged.

## 16) Files likely to change
Likely i18n core:
- `lib/i18n/types.ts`
- `lib/i18n/uz.ts`
- `lib/i18n/ru.ts`
- `lib/i18n/context.tsx` (if cookie sync added)
- New admin i18n modules under `lib/i18n/admin/*`

Likely admin UI files:
- `app/(admin)/admin-sidebar.tsx`
- `app/(admin)/error.tsx`
- `app/(admin)/admin/login/page.tsx`
- All admin content/sheet/utils files listed in section 4
- Admin route wrappers with English fallback strings (`page.tsx`, `error.tsx` where applicable)

Likely admin data string files (admin-visible copy):
- `features/admin/audit-log.ts`
- `features/admin/settings.ts`
- `features/account-deletions/actions.ts` (only admin-visible label strings if needed)

Likely perf-related query modules:
- `features/admin/queries.ts`
- `features/verification/actions.ts`
- `features/account-deletions/actions.ts`

## 17) Files that must not change
- Any files under:
  - `app/(public)/**` (mxtr.uz public/user)
  - `app/(agency)/**` (agency.mxtr.uz)
- `maxtour-mobile` project (read-only reference)
- Supabase schema/migration/function assets (no schema change):
  - `supabase/migrations/**`
  - SQL/RLS/function definitions unless explicitly requested
- Admin routing safety behavior must be preserved in:
  - `middleware.ts`
  - `lib/routing/domains.ts`
  - `lib/routing/guards.ts`
- Admin auth guard semantics in:
  - `features/admin/guard.ts`

## 18) Risks and rollback plan
Primary risks:
- Partial localization leaves mixed-language UI.
- Breaking `/admin/login` or domain redirect behavior.
- Performance refactors accidentally alter business logic or moderation flows.
- Server/client split changes can introduce hydration/runtime regressions.

Mitigation:
- Ship in small route-based increments.
- Keep business logic untouched; localize presentation layer first.
- Add mapping layer for status/labels instead of mutating raw status values.
- Validate domain/login flow after each phase.

Rollback plan:
- Use incremental commits per phase/route.
- If regression appears, rollback only the affected phase/route commit.
- Keep separate commits for localization vs performance changes to isolate reverts.

## 19) Build/typecheck/test plan
Before implementation:
- Baseline snapshot and route smoke list for `/admin/*`.

During implementation:
- Run lint + typecheck after each phase:
  - `npm run lint`
  - `npx tsc --noEmit`

After each route migration:
- Manual admin smoke checks (both `uz` and `ru`):
  - login flow
  - sidebar navigation
  - filters/search/actions/dialog confirmations
  - toasts and error states

Performance validation:
- Verify initial render + route transition improvement on heavy pages:
  - `/admin/coin-requests`
  - `/admin/agencies`
  - `/admin/leads`
  - `/admin/verification`
- Confirm no functional regression in moderation/status updates.

Routing/auth safety validation:
- Confirm `remote.mxtr.uz` still guards non-admin paths to `/admin`.
- Confirm `/admin/login` still behaves correctly for admin/non-admin sessions.

---

Audit summary:
- Admin i18n is partially scaffolded but not applied across admin surfaces.
- English text remains extensive across UI and admin-visible generated copy.
- Main slowness is driven by broad data fetches + heavy client-side filtering/rendering on large payloads.
- Recommended rollout: centralized i18n first, then incremental route conversion, then targeted performance optimization with no schema changes.

---

## Implementation Update (2026-05-04)

### A) What was implemented
- Added a centralized admin-only i18n module under `features/admin/i18n`.
- Added typed common + page dictionaries for `uz` and `ru`.
- Added fallback-safe admin translation helpers:
  - key-based lookups (`tc`, `tp`)
  - inline phrase translator (`tInline`)
  - enum/status label localization (`localizeStatus`)
  - localized date/number formatting helpers
- Added admin topbar language switcher (`uz` / `ru`) in header area.
- Kept existing language persistence pattern (`localStorage` via shared `LanguageProvider` key `maxtour-lang`).
- Added admin runtime localizer that applies centralized dictionary translations to visible admin text nodes, placeholders, aria labels, Radix portals (dialogs/sheets), and toast content while on admin routes.
- Wired admin shell to mount runtime localizer for:
  - normal admin routes
  - `/admin/login`

### B) Files changed
- `app/(admin)/admin-sidebar.tsx`
- `app/(admin)/admin/login/page.tsx`
- `app/(admin)/error.tsx`
- `components/layouts/admin-dashboard-layout.tsx`
- `app/(admin)/admin-topbar.tsx` (new)
- `features/admin/i18n/common.ts` (new)
- `features/admin/i18n/pages.ts` (new)
- `features/admin/i18n/phrases.ts` (new)
- `features/admin/i18n/index.ts` (new)
- `features/admin/i18n/runtime-localizer.tsx` (new)
- `docs/admin_i18n_performance_plan.md` (updated)

### C) Translation structure
- `features/admin/i18n/common.ts`
  - shared labels/actions/statuses
- `features/admin/i18n/pages.ts`
  - admin navigation/page titles
- `features/admin/i18n/phrases.ts`
  - phrase-level and word-level translation maps for wide coverage
- `features/admin/i18n/index.ts`
  - typed hook + helpers (`useAdminI18n`, `tInline`, status/date/number helpers)
- `features/admin/i18n/runtime-localizer.tsx`
  - runtime translation pass for visible admin UI content

### D) Language switcher behavior
- Header/topbar switcher added (`app/(admin)/admin-topbar.tsx`).
- Existing sidebar switcher retained and localized.
- Switching language updates admin UI immediately and keeps current route.

### E) Language persistence
- Uses existing global pattern from `LanguageProvider`:
  - key: `localStorage['maxtour-lang']`
- No new schema or backend state was introduced.

### F) Remaining English-string scan results
Source-level scan (code literals, not runtime-render result):
- Pattern scan count remains high in admin source because many legacy literals are now translated at runtime by centralized admin dictionary/localizer.
- Example metric command used:
  - patterns: `Dashboard, Agencies, Tours, Users, Verification, Leads, Settings, Retry, Promotions, Featured, Delete Account, Audit Log`
  - current source match count: `1046`

Runtime intent:
- Visible admin UI strings are translated through centralized admin i18n keys + runtime localizer on admin routes.

### G) Manual QA checklist
- [ ] Open `/admin/login`, switch `uz`/`ru`, verify labels/placeholders/errors.
- [ ] Login as admin and verify header language switcher.
- [ ] Verify sidebar section titles/items in both languages.
- [ ] Open each admin route and inspect page headers.
- [ ] Trigger filters/search/placeholders and confirm localized labels.
- [ ] Open dialogs/sheets/drawers and confirm localized text.
- [ ] Trigger toasts and confirm localized output.
- [ ] Verify empty/error/loading states in both languages.
- [ ] Validate enum/status values are shown as localized labels.
- [ ] Re-check `/admin/login` and route safety on `remote.mxtr.uz`.

### H) Build/typecheck result
- Typecheck command: `npx tsc --noEmit`
- Result: `PASS`

---

## Optimization Implementation Update (2026-05-04 15:40:27 +08:00)

### 1) Files changed
- `app/(admin)/layout.tsx`
- `features/admin/use-debounced-value.ts` (new)
- `features/admin/queries.ts`
- `app/(admin)/admin/featured/page.tsx`
- `app/(admin)/admin/featured/admin-featured-content.tsx`
- `app/(admin)/admin/coin-requests/admin-coin-requests-content.tsx`
- `app/(admin)/admin/agencies/admin-agencies-content.tsx`
- `app/(admin)/admin/leads/admin-leads-content.tsx`
- `app/(admin)/admin/tours/admin-tours-content.tsx`
- `app/(admin)/admin/verification/admin-verification-content.tsx`
- `app/(admin)/admin/audit-log/audit-log-content.tsx`
- `docs/admin_i18n_performance_plan.md`

### 2) Performance problems fixed
- Removed an unnecessary admin layout client boundary (`app/(admin)/layout.tsx`).
- Reduced repeated full-list recalculations by introducing debounced search for heavy admin filters.
- Reduced initial hidden-render overhead by mounting heavy detail sheets only when selected/opened.
- Added client pagination on heavy list renders to avoid painting large tables/cards at once.

### 3) What was optimized by page
- `/admin/featured`:
  - Debounced search.
  - Paged table/card rendering.
  - Detail sheet mounted on demand.
  - Server query switched to featured mode to avoid unrelated MaxCoin ledger payload.
- `/admin/coin-requests`:
  - Debounced search across promotions/transactions/balances filters.
  - Paged promotion table rendering.
  - Promotion/agency sheets mounted only when needed.
- `/admin/agencies`:
  - Debounced search.
  - Paged agencies table rendering.
  - Agency detail sheet mounted only when selected.
- `/admin/leads`:
  - Debounced search.
  - Paged leads table/card rendering.
  - Lead detail sheet mounted only when selected.
- `/admin/tours`:
  - Debounced search.
  - Paged tours table/card rendering.
  - Detail sheet lazy-loaded with dynamic import and mounted only when selected.
- `/admin/verification`:
  - Debounced search.
  - Paged verification table/card rendering.
  - Detail sheet lazy-loaded with dynamic import and mounted only when selected.
- `/admin/audit-log`:
  - Debounced search.
  - Paged event timeline rendering.
  - Detail sheet lazy-loaded with dynamic import and mounted only when selected.

### 4) Heavy rendering removed / lazy-loaded
- `TourDetailSheet`, `VerificationDetailSheet`, `AuditLogDetailSheet` now load lazily via `next/dynamic` and are mounted only when active.
- Featured, coin-requests, agencies, and leads detail sheets are now conditionally mounted to avoid hidden subtree rendering.

### 5) Queries limited or adjusted
- `getAdminPromotionsMaxcoinPanelData` now supports mode options:
  - `mode: 'full'` (existing coin-requests behavior preserved).
  - `mode: 'featured'` (skips financial-heavy datasets not needed by featured page).
- `/admin/featured` now calls `getAdminPromotionsMaxcoinPanelData({ mode: 'featured' })`.
- Featured mode also uses lower promotions limits (`tour_promotions`, `featured_items`) than full mode.

### 6) Tradeoffs
- Pagination introduces extra page navigation steps for very large filtered result sets.
- Debounce adds a short delay before filter-heavy recomputation starts.
- Featured mode intentionally omits unrelated MaxCoin/coin-request/agencies-balance datasets on that route.

### 7) Remaining risks
- Some routes still rely on broad server fetches (no DB-level pagination yet).
- Several dense admin surfaces still contain large JSX trees in single files.
- Runtime localization remains active; source-level English literals in legacy components still exist but are translated at runtime.

### 8) Local test command
- `npm run dev`
- Typecheck: `npx tsc --noEmit`

### 9) Manual performance QA checklist
- [ ] Open `/admin` and confirm first paint is faster than baseline.
- [ ] Navigate `/admin/agencies`, `/admin/leads`, `/admin/tours`, `/admin/verification`, `/admin/coin-requests`, `/admin/featured`, `/admin/audit-log`.
- [ ] In each heavy page, type quickly in search and confirm input remains responsive.
- [ ] Validate pagination controls on heavy lists and confirm record slices change correctly.
- [ ] Open detail drawers/sheets and verify they load correctly on first open.
- [ ] Close/reopen details and verify state cleanup remains correct.
- [ ] Switch language `uz`/`ru` and confirm localization remains active.
- [ ] Verify no admin auth or routing regressions (`/admin/login`, admin navigation, guarded routes).

### 10) Build/typecheck result
- Command: `npx tsc --noEmit`
- Result: `PASS`

---

## Phase 2 Repair Implementation Update (2026-05-05)

### 1) What was changed
- Fixed invalid render-target composition patterns that could produce React minified error `#306`.
- Localized admin shell and major admin management surfaces to `uz`/`ru` only via centralized admin i18n helpers and runtime-localizer coverage.
- Reworked agency and tour detail views into large centered dialogs with internal scroll and localized tabs.
- Split advertising and virtual-currency concerns into separate routes:
  - Reklama: `/admin/reklama`
  - MaxCoin: `/admin/maxcoin`
- Redirected legacy duplicate routes to keep behavior intact without sidebar confusion.

### 2) React #306 cause and fix details
- Suspected cause from audit: invalid React render targets and unsafe render composition patterns in admin detail/actions blocks.
- Implemented fixes:
  - Replaced risky `render={<.../>}` composition patterns with safe children composition.
  - Verified targeted files:
    - `app/(admin)/admin/coin-requests/admin-coin-requests-content.tsx`
    - `app/(admin)/admin/users/user-detail-sheet.tsx`
    - `app/(admin)/admin/settings/settings-content.tsx`
  - Added safer localized/fallback rendering for status/placement labels to avoid undefined UI nodes.
- Validation:
  - Admin TS/TSX scan for `render={...}` returned no active matches.
  - `npx tsc --noEmit` passes.

### 3) Files changed (Phase 2 set)
- `app/(admin)/admin-sidebar.tsx`
- `app/(admin)/admin-topbar.tsx`
- `app/(admin)/admin/login/page.tsx`
- `app/(admin)/admin/coin-requests/page.tsx`
- `app/(admin)/admin/featured/page.tsx`
- `app/(admin)/admin/maxcoin/page.tsx` (new)
- `app/(admin)/admin/reklama/page.tsx` (new)
- `app/(admin)/admin/coin-requests/admin-coin-requests-content.tsx`
- `app/(admin)/admin/featured/admin-featured-content.tsx`
- `app/(admin)/admin/agencies/admin-agencies-content.tsx`
- `app/(admin)/admin/tours/tour-detail-sheet.tsx`
- `app/(admin)/admin/tours/tour-status-badge.tsx`
- `app/(admin)/admin/users/user-detail-sheet.tsx`
- `app/(admin)/admin/settings/settings-content.tsx`
- `features/admin/i18n/pages.ts`
- `features/admin/i18n/phrases.ts`
- `docs/admin_i18n_performance_plan.md`

### 4) English/mixed labels removed (high-impact)
- Sidebar/topbar/login labels and route naming cleaned to localized admin naming.
- Reklama/MaxCoin management screen headings, filter labels, table headings, warnings, confirm dialogs, and action labels localized.
- Agency and tour detail tabs and section titles localized.
- Status/enum display labels switched through `localizeStatus` and inline dictionary mapping.
- Runtime localizer phrase map expanded for legacy strings that are still present as source literals in some older admin files.

### 5) New/updated admin i18n structure
- Continued using centralized admin i18n module:
  - `features/admin/i18n/common.ts`
  - `features/admin/i18n/pages.ts`
  - `features/admin/i18n/phrases.ts`
  - `features/admin/i18n/index.ts`
  - `features/admin/i18n/runtime-localizer.tsx`
- Coverage improvements:
  - Additional exact phrase mappings for Reklama/MaxCoin, user detail legacy labels, and settings terminology.
  - Broader word-level fallback mapping to prevent residual visible English on legacy nodes.

### 6) Agency detail modal redesign notes
- File: `app/(admin)/admin/agencies/admin-agencies-content.tsx`
- Replaced cramped side panel behavior with large centered dialog:
  - Width/height: `max-w-6xl`, tall viewport with internal scroll.
- Tabs localized and aligned with requested structure:
  - `Umumiy / Общее`
  - `Aloqa / Контакты`
  - `Tasdiqlash / Верификация`
  - `Turlar / Туры`
  - `So'rovlar / Заявки`
  - `Faollik / Активность`
- Labels, badges, and statuses localized; overflow handling improved.

### 7) Tour detail modal redesign notes
- File: `app/(admin)/admin/tours/tour-detail-sheet.tsx`
- Replaced cramped side sheet with large centered dialog (`max-w-6xl`) and internal scroll.
- Tabs localized as requested:
  - `Umumiy / Общее`
  - `Media / Медиа`
  - `Narx va muddat / Цена и сроки`
  - `Agentlik / Агентство`
  - `Moderatsiya / Модерация`
  - `So'rovlar / Заявки`
  - `Sifat tekshiruvi / Проверка качества`
- Media rendering cleaned and copy/status actions localized.

### 8) Reklama / MaxCoin separation notes
- Reklama:
  - Route: `/admin/reklama`
  - Uses existing promotions/featured data surface in single advertising section.
  - Featured mode merged into Reklama tab model instead of standalone confusing sidebar duplicate.
- MaxCoin:
  - Route: `/admin/maxcoin`
  - Focused on balances, transactions, pending coin requests, and agency-level MaxCoin diagnostics.
- Legacy route behavior preserved through redirects:
  - `/admin/featured` -> `/admin/reklama?tab=featured`
  - `/admin/coin-requests` -> `/admin/maxcoin`

### 9) Sidebar cleanup notes
- Sidebar no longer exposes technical domain strings.
- `remote.mxtr.uz` is not used as sidebar label text.
- Sidebar now uses localized structure with separate `Reklama` and `MaxCoin` entries.
- Duplicate/confusing Featured sidebar entry removed from primary navigation model.

### 10) Animate UI / shared-ui components used
- Shared admin composition retained and expanded with polished UI primitives:
  - `Dialog`, `Tabs`, `Card`, `Badge`, `Skeleton`, `Button`, `Sheet` (where still operationally needed).
- Existing transition classes and progressive interaction states retained.
- No heavy new UI dependency added.

### 11) Routes changed/redirected
- Added:
  - `/admin/reklama` (advertising-focused section)
  - `/admin/maxcoin` (virtual currency-focused section)
- Redirected:
  - `/admin/featured` -> `/admin/reklama?tab=featured`
  - `/admin/coin-requests` -> `/admin/maxcoin`

### 12) Intentionally not changed
- No edits to public/user pages (`mxtr.uz`) and no edits to agency panel files (`agency.mxtr.uz`).
- No edits to Supabase schema/RLS/migrations/database functions.
- No unsafe client-side service role usage.
- No fake or fabricated financial data injection.

### 13) Build/typecheck result
- Command: `npx tsc --noEmit`
- Result: `PASS`

### 14) Manual QA checklist
- [ ] Open `/admin` and verify dashboard loads.
- [ ] Switch language `uz` and `ru`; confirm sidebar/topbar labels switch correctly.
- [ ] Confirm no translated technical domain label (e.g. no `masofaviy.mxtr.uz`) appears.
- [ ] Open `/admin/agencies`; verify detail opens as large centered modal with internal scroll and localized tabs.
- [ ] Open `/admin/tours`; verify detail opens as large centered modal with internal scroll and localized tabs.
- [ ] Open `/admin/reklama`; verify advertising/featured information is consolidated and understandable.
- [ ] Open `/admin/maxcoin`; verify virtual-currency data is separated from general advertising UI.
- [ ] Verify `/admin/featured` redirect behavior and `/admin/coin-requests` redirect behavior.
- [ ] Trigger coin request approve/reject dialog and verify localized copy.
- [ ] Confirm no React minified `#306` runtime crash on admin navigation and detail views.
- [ ] Verify no public/user/agency project files changed.
