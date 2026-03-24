-- ============================================================
-- MaxCoin Full Setup — idempotent, safe to re-run
-- Creates ALL tables, columns, indexes, RLS policies, and seed data
-- ============================================================

begin;

-- ===================== 1) agencies.maxcoin_balance =====================
alter table public.agencies
  add column if not exists maxcoin_balance integer not null default 0;

-- ===================== 2) maxcoin_transactions =====================
create table if not exists public.maxcoin_transactions (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  amount integer not null,
  type text not null check (type in ('purchase','spend_featured','spend_hot_deals','spend_hot_tours','bonus','refund')),
  description text,
  tour_id uuid references public.tours(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_maxcoin_transactions_agency
  on public.maxcoin_transactions (agency_id, created_at desc);

-- ===================== 3) tour_promotions =====================
create table if not exists public.tour_promotions (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  placement text not null check (placement in ('featured','hot_deals','hot_tours')),
  cost_coins integer not null default 0,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_tour_promotions_active
  on public.tour_promotions (placement, is_active, ends_at);
create index if not exists idx_tour_promotions_tour
  on public.tour_promotions (tour_id, is_active);

-- ===================== 4) promotion_tiers =====================
-- drop old tables that were replaced (019)
drop table if exists public.promotion_pricing;
drop table if exists public.maxcoin_packages;

create table if not exists public.promotion_tiers (
  id uuid primary key default gen_random_uuid(),
  placement text not null check (placement in ('featured','hot_deals','hot_tours')),
  coins integer not null,
  days integer not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_promotion_tiers_placement
  on public.promotion_tiers (placement, sort_order);

-- Seed tiers only if table is empty
insert into public.promotion_tiers (placement, coins, days, sort_order)
select * from (values
  ('featured',  20,  3,  1),
  ('featured',  35,  6,  2),
  ('featured',  65,  10, 3),
  ('featured',  110, 20, 4),
  ('featured',  150, 30, 5),
  ('hot_deals', 5,   2,  1),
  ('hot_deals', 9,   4,  2),
  ('hot_deals', 16,  8,  3),
  ('hot_tours', 3,   1,  1),
  ('hot_tours', 5,   2,  2),
  ('hot_tours', 7,   3,  3)
) as t(placement, coins, days, sort_order)
where not exists (select 1 from public.promotion_tiers limit 1);

-- ===================== 5) coin_requests =====================
create table if not exists public.coin_requests (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  coins integer not null check (coins > 0),
  price_uzs numeric not null check (price_uzs >= 0),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_coin_requests_status
  on public.coin_requests (status, created_at desc);
create index if not exists idx_coin_requests_agency
  on public.coin_requests (agency_id, created_at desc);

-- ===================== 6) RLS Policies =====================

-- maxcoin_transactions
alter table public.maxcoin_transactions enable row level security;
drop policy if exists "Agency owners can view own transactions" on public.maxcoin_transactions;
create policy "Agency owners can view own transactions"
  on public.maxcoin_transactions for select
  using (agency_id in (select id from public.agencies where owner_id = auth.uid()));

-- tour_promotions
alter table public.tour_promotions enable row level security;
drop policy if exists "Active promotions are publicly viewable" on public.tour_promotions;
create policy "Active promotions are publicly viewable"
  on public.tour_promotions for select
  using (
    (is_active = true and ends_at > now())
    or agency_id in (select id from public.agencies where owner_id = auth.uid())
  );

-- promotion_tiers
alter table public.promotion_tiers enable row level security;
drop policy if exists "Promotion tiers are viewable by everyone" on public.promotion_tiers;
create policy "Promotion tiers are viewable by everyone"
  on public.promotion_tiers for select
  using (true);

-- coin_requests
alter table public.coin_requests enable row level security;
drop policy if exists "Agency owners can view own coin requests" on public.coin_requests;
create policy "Agency owners can view own coin requests"
  on public.coin_requests for select
  using (agency_id in (select id from public.agencies where owner_id = auth.uid()));

drop policy if exists "Agency owners can submit coin requests" on public.coin_requests;
create policy "Agency owners can submit coin requests"
  on public.coin_requests for insert
  with check (agency_id in (select id from public.agencies where owner_id = auth.uid()));

commit;

-- Refresh PostgREST schema cache
notify pgrst, 'reload schema';
