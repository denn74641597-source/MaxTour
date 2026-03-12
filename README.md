# MaxTour — Travel Marketplace for Uzbekistan

A Telegram Mini App marketplace where users can browse, search, filter, and contact travel agencies. Built with Next.js, TypeScript, Tailwind CSS, shadcn/ui, and Supabase.

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- A [Supabase](https://supabase.com) project

### 1. Clone and Install

```bash
cd MaxTour
npm install
```

### 2. Configure Environment

Copy the example environment file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Database

Run the migration SQL against your Supabase project:

1. Go to your Supabase dashboard → **SQL Editor**
2. Open and run `supabase/migrations/001_initial_schema.sql`
3. Then run `supabase/seed/seed.sql` for demo data

Or use the Supabase CLI:

```bash
# If you have supabase CLI installed and linked
supabase db push
supabase db seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
MaxTour/
├── app/                         # Next.js App Router
│   ├── (public)/                # Public marketplace pages
│   │   ├── page.tsx             # Home page
│   │   ├── tours/               # Tour listing & details
│   │   ├── agencies/[slug]/     # Agency profile
│   │   ├── favorites/           # Saved tours
│   │   └── search/              # Search results
│   ├── (agency)/                # Agency dashboard (route group)
│   │   └── agency/
│   │       ├── page.tsx         # Dashboard home
│   │       ├── profile/         # Edit agency profile
│   │       ├── tours/           # Manage tours
│   │       ├── leads/           # Lead management
│   │       └── subscription/    # Subscription plans
│   ├── (admin)/                 # Admin panel (route group)
│   │   └── admin/
│   │       ├── page.tsx         # Admin overview
│   │       ├── agencies/        # Agency approval
│   │       ├── tours/           # Tour moderation
│   │       ├── featured/        # Featured management
│   │       └── subscriptions/   # Subscription overview
│   ├── api/leads/               # Lead submission API
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/
│   ├── shared/                  # Reusable app components
│   └── ui/                      # shadcn/ui primitives
├── features/                    # Feature modules (queries, actions)
│   ├── admin/
│   ├── agencies/
│   ├── auth/
│   ├── leads/
│   └── tours/
├── hooks/                       # React hooks
├── lib/
│   ├── supabase/                # Supabase client utilities
│   ├── telegram/                # Telegram Mini App SDK
│   ├── validators/              # Zod validation schemas
│   └── utils.ts                 # Shared utility functions
├── types/                       # TypeScript type definitions
├── supabase/
│   ├── migrations/              # SQL migration files
│   └── seed/                    # Seed/demo data
├── docs/                        # Documentation
├── middleware.ts                # Auth middleware
└── .env.example                 # Environment template
```

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 14+ (App Router) | Full-stack React framework |
| TypeScript | Type safety |
| Tailwind CSS v4 | Utility-first styling |
| shadcn/ui | UI component library |
| Supabase | Postgres database, auth, storage |
| React Hook Form + Zod | Form handling & validation |
| Lucide React | Icon library |
| Sonner | Toast notifications |

## Roles

| Role | Access |
|---|---|
| `user` | Browse tours, save favorites, submit lead requests |
| `agency_manager` | Manage own agency, tours, leads, subscription |
| `admin` | Approve agencies, moderate tours, manage featured items |

## Deployment on Vercel

1. Push your code to a Git repository
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Deploy

### Environment Variables for Vercel

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_APP_NAME
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
```

## Key Design Decisions

- **Route Groups**: `(public)`, `(agency)`, `(admin)` separate layouts without affecting URL paths
- **Server Components**: Data fetching in server components for better performance
- **Feature Modules**: Queries and actions are organized by feature domain
- **MVP Auth**: Auth structure is prepared for Supabase Auth + Telegram login. Currently, dashboard pages are accessible without auth for development
- **RLS Policies**: Basic Row Level Security is implemented. Admin operations use the service_role key server-side

## License

Private — All rights reserved.
