# MaxTour — Project Architecture

## Overview

MaxTour is a full-stack Next.js application structured as a Telegram Mini App travel marketplace. The app connects travelers with travel agencies in Uzbekistan.

Current split status:
- `agency.mxtr.uz/*` is served by standalone project: `C:/Projects/MaxTour-agency`
- This monolith serves:
  - `mxtr.uz/*`
  - `www.mxtr.uz/*`
  - `remote.mxtr.uz/*`
- Agency feature development should not be done in this monolith.
- Rollback references:
  - monolith: `C:/Users/adbax/OneDrive/Desktop/MaxTour/AGENCY_MONOLITH_CLEANUP_PLAN.md`
  - standalone: `C:/Projects/MaxTour-agency/AGENCY_CUTOVER_STATUS.md`

## Architecture Diagram

The diagram below reflects the original unified app structure and is kept for historical context.
Current production ownership is defined in the split-status section above.

```
┌──────────────────────────────────────┐
│           Telegram Mini App          │
│      (WebView / Mobile Browser)      │
└──────────────┬───────────────────────┘
               │
┌──────────────▼───────────────────────┐
│           Next.js App Router         │
│                                      │
│  ┌──────────┐ ┌────────┐ ┌───────┐  │
│  │ (public)  │ │(agency)│ │(admin)│  │
│  │ Route Grp │ │Rte Grp │ │Rt Grp │  │
│  └────┬─────┘ └───┬────┘ └──┬────┘  │
│       │            │         │       │
│  ┌────▼────────────▼─────────▼────┐  │
│  │      Server Components         │  │
│  │   (data fetching, rendering)   │  │
│  └────────────┬───────────────────┘  │
│               │                      │
│  ┌────────────▼───────────────────┐  │
│  │      Feature Modules           │  │
│  │  queries.ts / actions.ts       │  │
│  └────────────┬───────────────────┘  │
│               │                      │
│  ┌────────────▼───────────────────┐  │
│  │     Supabase Client Layer      │  │
│  │  server.ts / client.ts         │  │
│  └────────────┬───────────────────┘  │
└───────────────┼──────────────────────┘
                │
┌───────────────▼──────────────────────┐
│         Supabase (Postgres)          │
│  Auth │ Database │ Storage │ RLS     │
└──────────────────────────────────────┘
```

## Route Groups

The monolith uses these active Next.js route groups:

| Route Group | URL Prefix | Layout | Purpose |
|---|---|---|---|
| `(public)` | `/` | Header + Bottom Nav | Marketplace for all users |
| `(admin)` | `/admin` | Sidebar Dashboard Nav | Platform administration |

Route groups do **not** create URL segments — they only organize layouts and code.

## Data Flow

### Public Pages (Server Components)

```
Page (server) → Feature Query → Supabase Server Client → DB
                                      ↓
                              Render HTML (RSC)
```

### Admin Forms (Client Components)

```
Form (client) → Server Action → Supabase Server Client → DB
     ↓                                    ↓
  React Hook Form              Return result / revalidate
  + Zod validation
```

### Lead Submission

```
LeadForm (client) → submitLead Server Action → Supabase insert
                                                    ↓
                                              Toast notification
```

## Module Organization

### `/features` — Domain Logic

Each feature module contains server-side queries and/or server actions:

| Module | Files | Purpose |
|---|---|---|
| `auth` | `helpers.ts` | `getCurrentProfile()`, `requireRole()`, `getCurrentAgency()` |
| `tours` | `queries.ts` | `getTours()`, `getTourBySlug()`, `getFeaturedTours()`, `getSimilarTours()` |
| `agencies` | `queries.ts` | `getAgencyBySlug()`, `getVerifiedAgencies()`, `getAgencyReviews()` |
| `leads` | `actions.ts`, `queries.ts` | `submitLead()`, `getLeadsByAgency()`, `updateLeadStatus()` |
| `admin` | `queries.ts` | `getAllAgencies()`, `setAgencyApproval()`, `getAdminStats()`, etc. |

### `/components/shared` — Reusable UI

17 shared components built on top of shadcn/ui primitives:

- **Layout**: `AppHeader`, `BottomNav`, `DashboardNav`, `SectionHeader`
- **Cards**: `TourCard`, `AgencyCard`, `DashboardStatCard`
- **Display**: `PriceBlock`, `StatusBadge`, `VerifiedBadge`, `EmptyState`
- **Forms**: `LeadForm`, `SearchBar`, `FilterChips`, `ImageUploader`
- **Loading**: `TourCardSkeleton`, `TourListSkeleton`, `AgencyCardSkeleton`

### `/lib` — Shared Utilities

| Module | Purpose |
|---|---|
| `supabase/client.ts` | Browser-side Supabase client (for client components) |
| `supabase/server.ts` | Server-side Supabase client (cookie-based) + admin client |
| `supabase/middleware.ts` | Session refresh for middleware |
| `telegram/index.ts` | Telegram WebApp SDK helpers |
| `validators/index.ts` | Zod schemas (lead form, agency profile, tour) |
| `utils.ts` | `cn()`, `formatPrice()`, `formatDate()`, `slugify()`, `truncate()` |

### `/hooks` — Client-Side Hooks

| Hook | Purpose |
|---|---|
| `use-profile` | Fetches current user profile from Supabase |
| `use-favorites` | Manages favorite tours (localStorage + Supabase) |

## Database Schema

10 tables with Row Level Security:

```
profiles ─── agencies ─── tours ─── tour_images
                │            │
                │            ├── leads
                │            └── reviews
                │
                ├── agency_subscriptions ─── subscription_plans
                └── featured_items ────────── tours
                                              favorites
```

Key relationships:
- `profiles.id` → Supabase Auth user ID
- `agencies.owner_id` → `profiles.id`
- `tours.agency_id` → `agencies.id`
- `leads` link users to tours and agencies

See `supabase/migrations/001_initial_schema.sql` for the full schema.

## Authentication Strategy

### Current MVP

- Middleware refreshes Supabase sessions on every request
- Protected admin routes (`/admin/*`) are guarded by middleware and role checks
- Feature queries use `getCurrentProfile()` which returns null if not authenticated

### Production Path

1. Implement Telegram `initData` validation on the server
2. Create or match Supabase Auth users from Telegram user data
3. Enable middleware redirects for unauthenticated users
4. Role-based access control via `profiles.role` column

## Localization Strategy

The app is structured for future Uzbek and Russian translations:

- All user-facing text is in English as placeholders
- Text is co-located in components (not in a separate i18n file yet)
- Recommended approach: use `next-intl` or a similar library when ready

## Deployment

The app is designed for Vercel deployment:

- Server components and server actions run as serverless functions
- Static assets served via Vercel CDN
- Supabase handles the database and auth externally
- Environment variables configured in Vercel dashboard
