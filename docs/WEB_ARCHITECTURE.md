# MaxTour Web Architecture

Date: 2026-05-03  
Source of truth: `maxtour-mobile` business logic  
Editable target: `MaxTour` only

## Purpose

This document defines the architecture baseline for rebuilding MaxTour web without implementing full UI yet.  
The structure is prepared for:

1. Public website (`mxtr.uz`)
2. User area (`mxtr.uz/profile/*`)
3. Admin dashboard (`remote.mxtr.uz/admin/*`)

## Post-Cutover Note (Current Production)

1. `agency.mxtr.uz/*` is now served by the standalone project at `C:/Projects/MaxTour-agency`.
2. This monolith serves `mxtr.uz/*`, `www.mxtr.uz/*`, and `remote.mxtr.uz/*`.
3. Monolith keeps public-to-agency redirects and link helpers, but does not host agency feature development.
4. Rollback notes:
   - monolith: `C:/Users/adbax/OneDrive/Desktop/MaxTour/AGENCY_MONOLITH_CLEANUP_PLAN.md`
   - standalone: `C:/Projects/MaxTour-agency/AGENCY_CUTOVER_STATUS.md`

## Core Principles

1. Mobile business logic is authoritative for Supabase tables, RPC names, edge functions, auth semantics, and role flow.
2. Web UI can be web-native, but data and auth contracts must stay mobile-compatible.
3. Admin surface is isolated by domain and route guards.
4. No Supabase schema changes are made in this architecture phase.

## Implemented Architecture Layers

### 1) Route Groups (App Router)

Current route groups are retained and treated as the canonical surface split:

```text
app/
  (public)/
  (admin)/
  api/
```

Role of each group:

1. `(public)` contains public pages and user profile/auth area.
2. `(admin)` contains admin panel pages.
3. `api` contains backend endpoints used by web flows.

### 2) Layout Components (Shared Architectural Shells)

New architectural layout components:

```text
components/layouts/
  public-website-layout.tsx
  user-area-layout.tsx
  admin-dashboard-layout.tsx
  index.ts
```

Wiring completed:

1. `app/(public)/layout.tsx` now uses `PublicWebsiteLayout`.
2. `app/(public)/profile/layout.tsx` now uses `UserAreaLayout`.
3. `app/(admin)/layout.tsx` now uses `AdminDashboardLayout`.

### 3) Shared UI Foundation

New shared UI primitives for architecture-first composition:

```text
components/shared-ui/
  page-title.tsx
  section-shell.tsx
  index.ts
```

These are intentionally small and reusable to avoid early UI lock-in.

### 4) Shared Supabase Access Entry

New shared Supabase entrypoint:

```text
lib/shared/supabase/index.ts
```

This re-exports existing established clients:

1. Browser client
2. Server client
3. Admin client
4. Public read-only client

This keeps one import surface for future domain modules without changing DB contracts.

### 5) Shared Types

New shared type module:

```text
types/shared/
  index.ts
  routing.ts
```

`routing.ts` introduces domain-aware route typing:

1. `DomainTarget`
2. `RouteArea`
3. `HostContext`

### 6) Routing and Guard Layer

New guard modules:

```text
lib/routing/
  domains.ts
  guards.ts
```

Responsibilities:

1. Host normalization and domain target resolution
2. Internal/static path skipping
3. Domain access decisions (`mxtr.uz` vs `remote.mxtr.uz`)
4. Request host context helpers

## Middleware Architecture (Implemented)

`middleware.ts` now uses host-based routing policy and removes `?mode=admin` dependency.

### Enforcement now in place

1. `remote.mxtr.uz`:
   - `/` redirects to `/admin`
   - Non-admin paths redirect to `/admin`
2. `mxtr.uz` and `www.mxtr.uz`:
   - `/admin*` redirects to `/`
3. Admin auth gate:
   - `/admin/login` is allowed
   - other `/admin*` routes require `admin_authenticated=true` cookie
4. Agency legacy bridge:
   - `/agency*` requests on `mxtr.uz`/`www.mxtr.uz` are redirected to standalone `agency.mxtr.uz`.

## Query-Param Admin Mode Removal (Implemented)

The architecture now removes `?mode=admin` in key admin navigation flows:

1. Admin sidebar links
2. Admin login redirect
3. Admin tours list row navigation
4. Admin tour detail back navigation
5. Middleware admin gate behavior

## Current Scope Boundary

Completed in this phase:

1. Domain and route-guard architecture
2. Shared architecture folders and entrypoints
3. Layout component separation for public/user/admin shells
4. Documentation for architecture and domain routing

Explicitly not completed in this phase:

1. Full UI redesign
2. Mobile parity rebuild for each feature module
3. Supabase schema migrations or table changes
4. RPC/data-layer parity migrations

## Next Implementation Tracks

1. Data parity track: move web feature queries to mobile RPC-first contracts.
2. Auth parity track: role-select parity, social auth parity, pending-deletion lockout parity.
3. Admin hardening track: migrate from cookie-only admin gate to Supabase role-backed admin authorization.
4. Agency feature parity work continues in the standalone agency project (`C:/Projects/MaxTour-agency`).
