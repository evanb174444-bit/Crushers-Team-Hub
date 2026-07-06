-- SCV Crushers Navy Team Hub
-- Initial Supabase schema + starter seed data.
--
-- Paste/run this file in the Supabase SQL Editor, or apply it with the
-- Supabase CLI after linking the project.

begin;

create extension if not exists pgcrypto;

-- ============================================================================
-- Core identity / roster
-- ============================================================================

create table public.families (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  contact_email text,
  password_hash text not null,
  dad_name text,
  dad_phone text,
  mom_name text,
  mom_phone text,
  address text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint families_email_lowercase_check check (email = lower(email))
);

create table public.coaches (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete set null,
  name text not null,
  phone text,
  email text not null,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'active',
  first_name text not null,
  last_name text not null,
  jersey_number integer,
  bats text,
  throws text,
  catches boolean,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint players_status_check check (status in ('active', 'inactive')),
  constraint players_bats_check check (bats is null or bats in ('R', 'L', 'S')),
  constraint players_throws_check check (throws is null or throws in ('R', 'L'))
);

create table public.player_private_details (
  player_id uuid primary key references public.players(id) on delete cascade,
  birthdate date,
  allergies text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.family_players (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  relationship text not null default 'parent',
  created_at timestamptz not null default now(),
  unique (family_id, player_id)
);

-- ============================================================================
-- Availability
-- ============================================================================

create table public.availability_weekends (
  id uuid primary key default gen_random_uuid(),
  weekend_start date not null unique,
  weekend_end date not null,
  month_label text not null,
  season_year integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_weekends_date_order_check check (weekend_end >= weekend_start)
);

create table public.availability_responses (
  id uuid primary key default gen_random_uuid(),
  weekend_id uuid not null references public.availability_weekends(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  response text not null default 'yes',
  submitted_by_family_id uuid references public.families(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (weekend_id, player_id),
  constraint availability_responses_response_check check (response in ('yes', 'no', 'sat_only', 'sun_only'))
);

-- ============================================================================
-- Expenses
-- ============================================================================

create table public.expense_months (
  id uuid primary key default gen_random_uuid(),
  month integer not null,
  year integer not null,
  label text not null,
  bank_account_name text,
  bank_balance numeric(10, 2) not null default 0,
  bank_as_of date,
  bank_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (month, year),
  constraint expense_months_month_check check (month between 1 and 12)
);

create table public.fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  expense_month_id uuid not null references public.expense_months(id) on delete cascade,
  name text not null,
  per_session numeric(10, 2),
  sessions integer,
  total_team_cost numeric(10, 2) not null,
  notes text,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  expense_month_id uuid not null references public.expense_months(id) on delete cascade,
  name text not null,
  tournament_date date,
  total_cost numeric(10, 2) not null,
  notes text,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tournament_players (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (tournament_id, player_id)
);

create table public.monthly_transactions (
  id uuid primary key default gen_random_uuid(),
  expense_month_id uuid not null references public.expense_months(id) on delete cascade,
  transaction_name text not null,
  transaction_date date not null,
  transaction_type text not null,
  amount numeric(10, 2) not null,
  balance numeric(10, 2),
  note text,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_transactions_type_check check (transaction_type in ('debit', 'credit'))
);

create table public.family_monthly_payments (
  id uuid primary key default gen_random_uuid(),
  expense_month_id uuid not null references public.expense_months(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  is_paid boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (expense_month_id, family_id)
);

-- ============================================================================
-- Order Center
-- ============================================================================

create table public.order_windows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'closed',
  opens_at timestamptz,
  closes_at timestamptz,
  expected_delivery_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_windows_status_check check (status in ('open', 'closed', 'complete'))
);

create table public.order_products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  price numeric(10, 2) not null,
  product_type text not null,
  image_path text,
  description text,
  size_options text[] not null default '{}',
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_products_type_check check (product_type in ('jersey', 'hat', 'other'))
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_window_id uuid not null references public.order_windows(id) on delete restrict,
  family_id uuid not null references public.families(id) on delete restrict,
  player_id uuid not null references public.players(id) on delete restrict,
  status text not null default 'submitted',
  total_amount numeric(10, 2) not null default 0,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_status_check check (status in ('submitted', 'cancelled'))
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.order_products(id) on delete restrict,
  size text not null,
  quantity integer not null,
  unit_price numeric(10, 2) not null,
  line_total numeric(10, 2) generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now(),
  constraint order_items_quantity_check check (quantity > 0)
);

-- ============================================================================
-- Functions, triggers, and dependent views
-- ============================================================================

create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.current_family_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.families
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1;
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select is_admin
    from public.families
    where id = public.current_family_id()
    limit 1
  ), false);
$$;

create trigger families_touch_updated_at
before update on public.families
for each row execute function public.touch_updated_at();

create trigger coaches_touch_updated_at
before update on public.coaches
for each row execute function public.touch_updated_at();

create trigger players_touch_updated_at
before update on public.players
for each row execute function public.touch_updated_at();

create trigger player_private_details_touch_updated_at
before update on public.player_private_details
for each row execute function public.touch_updated_at();

create trigger availability_weekends_touch_updated_at
before update on public.availability_weekends
for each row execute function public.touch_updated_at();

create trigger availability_responses_touch_updated_at
before update on public.availability_responses
for each row execute function public.touch_updated_at();

create trigger expense_months_touch_updated_at
before update on public.expense_months
for each row execute function public.touch_updated_at();

create trigger fixed_expenses_touch_updated_at
before update on public.fixed_expenses
for each row execute function public.touch_updated_at();

create trigger tournaments_touch_updated_at
before update on public.tournaments
for each row execute function public.touch_updated_at();

create trigger monthly_transactions_touch_updated_at
before update on public.monthly_transactions
for each row execute function public.touch_updated_at();

create trigger family_monthly_payments_touch_updated_at
before update on public.family_monthly_payments
for each row execute function public.touch_updated_at();

create trigger order_windows_touch_updated_at
before update on public.order_windows
for each row execute function public.touch_updated_at();

create trigger order_products_touch_updated_at
before update on public.order_products
for each row execute function public.touch_updated_at();

create trigger orders_touch_updated_at
before update on public.orders
for each row execute function public.touch_updated_at();

create view public.roster_directory as
select
  p.id as player_id,
  p.status,
  p.first_name,
  p.last_name,
  concat_ws(' ', p.first_name, p.last_name) as player_name,
  p.jersey_number,
  p.bats,
  p.throws,
  p.catches,
  f.dad_name,
  f.mom_name,
  coalesce(f.contact_email, f.email) as parent_email,
  p.sort_order
from public.players p
left join public.family_players fp on fp.player_id = p.id
left join public.families f on f.id = fp.family_id;

-- ============================================================================
-- Indexes
-- ============================================================================

create index families_email_idx on public.families (lower(email));
create index families_contact_email_idx on public.families (lower(contact_email));
create index coaches_email_idx on public.coaches (lower(email));
create index players_name_idx on public.players (last_name, first_name);
create index family_players_family_id_idx on public.family_players (family_id);
create index family_players_player_id_idx on public.family_players (player_id);
create index availability_weekends_month_idx on public.availability_weekends (season_year, weekend_start);
create index availability_responses_weekend_id_idx on public.availability_responses (weekend_id);
create index availability_responses_player_id_idx on public.availability_responses (player_id);
create index expense_months_year_month_idx on public.expense_months (year, month);
create index fixed_expenses_month_id_idx on public.fixed_expenses (expense_month_id);
create index tournaments_month_id_idx on public.tournaments (expense_month_id);
create index tournament_players_tournament_id_idx on public.tournament_players (tournament_id);
create index tournament_players_player_id_idx on public.tournament_players (player_id);
create index monthly_transactions_month_id_idx on public.monthly_transactions (expense_month_id);
create index family_monthly_payments_family_id_idx on public.family_monthly_payments (family_id);
create index order_windows_status_idx on public.order_windows (status);
create index order_products_active_idx on public.order_products (is_active, sort_order);
create index orders_family_id_idx on public.orders (family_id);
create index orders_player_id_idx on public.orders (player_id);
create index orders_window_id_idx on public.orders (order_window_id);
create index order_items_order_id_idx on public.order_items (order_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.families enable row level security;
alter table public.coaches enable row level security;
alter table public.players enable row level security;
alter table public.player_private_details enable row level security;
alter table public.family_players enable row level security;
alter table public.availability_weekends enable row level security;
alter table public.availability_responses enable row level security;
alter table public.expense_months enable row level security;
alter table public.fixed_expenses enable row level security;
alter table public.tournaments enable row level security;
alter table public.tournament_players enable row level security;
alter table public.monthly_transactions enable row level security;
alter table public.family_monthly_payments enable row level security;
alter table public.order_windows enable row level security;
alter table public.order_products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "families_select_all_authenticated"
on public.families for select
to authenticated
using (true);

create policy "families_update_own_or_admin"
on public.families for update
to authenticated
using (id = public.current_family_id() or public.is_admin())
with check (id = public.current_family_id() or public.is_admin());

create policy "families_admin_insert_delete"
on public.families for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "coaches_select_all"
on public.coaches for select
to authenticated
using (true);

create policy "coaches_admin_all"
on public.coaches for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "players_select_all_authenticated"
on public.players for select
to authenticated
using (true);

create policy "players_update_own_or_admin"
on public.players for update
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.family_players fp
    where fp.player_id = players.id
      and fp.family_id = public.current_family_id()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.family_players fp
    where fp.player_id = players.id
      and fp.family_id = public.current_family_id()
  )
);

create policy "players_admin_insert_delete"
on public.players for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "player_private_details_select_own_or_admin"
on public.player_private_details for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.family_players fp
    where fp.player_id = player_private_details.player_id
      and fp.family_id = public.current_family_id()
  )
);

create policy "player_private_details_update_own_or_admin"
on public.player_private_details for update
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.family_players fp
    where fp.player_id = player_private_details.player_id
      and fp.family_id = public.current_family_id()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.family_players fp
    where fp.player_id = player_private_details.player_id
      and fp.family_id = public.current_family_id()
  )
);

create policy "player_private_details_admin_insert_delete"
on public.player_private_details for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "family_players_select_all_authenticated"
on public.family_players for select
to authenticated
using (true);

create policy "family_players_admin_all"
on public.family_players for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "availability_weekends_select_active"
on public.availability_weekends for select
to authenticated
using (is_active or public.is_admin());

create policy "availability_weekends_admin_all"
on public.availability_weekends for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "availability_responses_select_all"
on public.availability_responses for select
to authenticated
using (true);

create policy "availability_responses_insert_own_or_admin"
on public.availability_responses for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1
    from public.family_players fp
    where fp.player_id = availability_responses.player_id
      and fp.family_id = public.current_family_id()
  )
);

create policy "availability_responses_update_own_or_admin"
on public.availability_responses for update
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.family_players fp
    where fp.player_id = availability_responses.player_id
      and fp.family_id = public.current_family_id()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.family_players fp
    where fp.player_id = availability_responses.player_id
      and fp.family_id = public.current_family_id()
  )
);

create policy "availability_responses_admin_delete"
on public.availability_responses for delete
to authenticated
using (public.is_admin());

create policy "expense_months_select_all"
on public.expense_months for select
to authenticated
using (true);

create policy "expense_months_admin_all"
on public.expense_months for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "fixed_expenses_select_all"
on public.fixed_expenses for select
to authenticated
using (true);

create policy "fixed_expenses_admin_all"
on public.fixed_expenses for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "tournaments_select_all"
on public.tournaments for select
to authenticated
using (true);

create policy "tournaments_admin_all"
on public.tournaments for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "tournament_players_select_all"
on public.tournament_players for select
to authenticated
using (true);

create policy "tournament_players_admin_all"
on public.tournament_players for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "monthly_transactions_select_all"
on public.monthly_transactions for select
to authenticated
using (true);

create policy "monthly_transactions_admin_all"
on public.monthly_transactions for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "family_monthly_payments_select_own_or_admin"
on public.family_monthly_payments for select
to authenticated
using (family_id = public.current_family_id() or public.is_admin());

create policy "family_monthly_payments_admin_all"
on public.family_monthly_payments for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "order_windows_select_all"
on public.order_windows for select
to authenticated
using (true);

create policy "order_windows_admin_all"
on public.order_windows for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "order_products_select_active"
on public.order_products for select
to authenticated
using (is_active or public.is_admin());

create policy "order_products_admin_all"
on public.order_products for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "orders_select_own_or_admin"
on public.orders for select
to authenticated
using (family_id = public.current_family_id() or public.is_admin());

create policy "orders_insert_own_open_window"
on public.orders for insert
to authenticated
with check (
  family_id = public.current_family_id()
  and exists (
    select 1
    from public.family_players fp
    where fp.family_id = public.current_family_id()
      and fp.player_id = orders.player_id
  )
  and exists (
    select 1
    from public.order_windows ow
    where ow.id = orders.order_window_id
      and ow.status = 'open'
  )
);

create policy "orders_update_own_or_admin"
on public.orders for update
to authenticated
using (family_id = public.current_family_id() or public.is_admin())
with check (family_id = public.current_family_id() or public.is_admin());

create policy "orders_admin_delete"
on public.orders for delete
to authenticated
using (public.is_admin());

create policy "order_items_select_own_or_admin"
on public.order_items for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.family_id = public.current_family_id()
  )
);

create policy "order_items_insert_own_open_window"
on public.order_items for insert
to authenticated
with check (
  exists (
    select 1
    from public.orders o
    join public.order_windows ow on ow.id = o.order_window_id
    where o.id = order_items.order_id
      and o.family_id = public.current_family_id()
      and ow.status = 'open'
  )
);

create policy "order_items_update_own_or_admin"
on public.order_items for update
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.family_id = public.current_family_id()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.family_id = public.current_family_id()
  )
);

create policy "order_items_delete_own_or_admin"
on public.order_items for delete
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.family_id = public.current_family_id()
  )
);

grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.families,
  public.coaches,
  public.players,
  public.player_private_details,
  public.family_players,
  public.availability_weekends,
  public.availability_responses,
  public.expense_months,
  public.fixed_expenses,
  public.tournaments,
  public.tournament_players,
  public.monthly_transactions,
  public.family_monthly_payments,
  public.order_windows,
  public.order_products,
  public.orders,
  public.order_items
to authenticated;
grant select on public.roster_directory to authenticated;

-- ============================================================================
-- Starter seed data
-- ============================================================================

insert into public.families (email, contact_email, password_hash, dad_name, dad_phone, mom_name, mom_phone, address, is_admin)
values
  ('nicole@thomewaterproofing', 'nicole@thomewaterproofing', crypt('Crushers', gen_salt('bf')), 'Jake', '661-618-1590', 'Nicole', '(661) 236-8715', null, false),
  ('saar3233@msn.com', 'saar3233@msn.com', crypt('Crushers', gen_salt('bf')), 'Chris', '818-261-8198', 'Joanna', '(818) 370-7458', null, false),
  ('ayywillard44@gmail.com', 'ayywillard44@gmail.com', crypt('Crushers', gen_salt('bf')), 'Alex', '818-687-5635', 'Maisie', '(661) 557-4918', null, false),
  ('kvoytish48@gmail.com', 'kvoytish48@gmail.com', crypt('Crushers', gen_salt('bf')), 'Kevin', '661-313-0865', 'Candice', '(310) 413-3606', null, false),
  ('dsddm3@gmail.com', 'skmascarenas@gmail.com', crypt('Crushers', gen_salt('bf')), 'Devon', '661-210-8943', 'Sasha', '(661) 755-3220', null, true),
  ('rb1701d@yahoo.com', 'rb1701d@yahoo.com', crypt('Crushers', gen_salt('bf')), 'Rob', '818-590-2903', 'Teresa', '(626) 215-3559', null, false),
  ('4jsracingteam@gmail.com', '4jsracingteam@gmail.com', crypt('Crushers', gen_salt('bf')), 'Jason', '(661)310-5842', 'Jen', '(661)645-9928', null, false),
  ('melsspace26@gmail.com', 'melsspace26@gmail.com', crypt('Crushers', gen_salt('bf')), null, null, 'Melissa', '661-317-2132', null, false),
  ('sophiacleao@gmail.com', 'sophiacleao@gmail.com', crypt('Crushers', gen_salt('bf')), 'Daniel', '661-904-8384', 'Sophia', '661-618-1140', null, false),
  ('tkubinak@yahoo.com', 'tkubinak@yahoo.com', crypt('Crushers', gen_salt('bf')), 'Nate', '661-388-3510', 'Teresa', '(661) 305-7183', null, false),
  ('evanbelfi@gmail.com', 'evanbelfi@gmail.com', crypt('Crushers', gen_salt('bf')), 'Evan', '818-427-9904', 'Kelly', '(562) 301-8677', null, true),
  ('mylansilva09@gmail.com', 'mylansilva09@gmail.com', crypt('Crushers', gen_salt('bf')), 'Bean', '818-747-3245', 'Vanessa', '(818) 747-5633', null, false),
  ('alexisdterry@yahoo.com', 'alexisdterry@yahoo.com', crypt('Crushers', gen_salt('bf')), 'Brad', '661-510-3969', 'Alexis', '(661) 609-3499', null, false);

insert into public.coaches (family_id, name, phone, email, sort_order)
values
  ((select id from public.families where email = 'dsddm3@gmail.com'), 'Devon Mascarenas', '661-210-8943', 'dsddm3@gmail.com', 1),
  ((select id from public.families where email = 'evanbelfi@gmail.com'), 'Evan Belfi', '818-427-9904', 'evanbelfi@gmail.com', 2);

insert into public.players (status, first_name, last_name, jersey_number, bats, throws, catches, sort_order)
values
  ('active', 'Blake', 'Thome', 84, 'R', 'R', true, 1),
  ('active', 'Brysen', 'Moeller', 4, 'R', 'R', true, 2),
  ('active', 'Colten', 'Willardsen', 44, 'R', 'R', null, 3),
  ('active', 'Colt', 'Voytish', 11, 'R', 'R', null, 4),
  ('active', 'Dash', 'Mascarenas', 3, 'R', 'R', true, 5),
  ('active', 'Elijah', 'Andreno', 12, 'R', 'R', true, 6),
  ('active', 'Jameson', 'Mandle', 52, 'R', 'R', null, 7),
  ('active', 'Jaxson', 'Murphy', 5, 'R', 'R', null, 8),
  ('active', 'John', 'Leao', 6, 'R', 'R', true, 9),
  ('active', 'Josh', 'Coe', 2, 'R', 'R', true, 10),
  ('active', 'Luke', 'Belfi', 7, 'L', 'R', null, 11),
  ('active', 'Mylan', 'Silva', 34, 'R', 'R', null, 12),
  ('active', 'Slater', 'Terry', 20, 'R', 'R', true, 13);

insert into public.player_private_details (player_id, birthdate, allergies)
values
  ((select id from public.players where first_name = 'Blake' and last_name = 'Thome'), '2014-09-09', 'Allergic to Motrin'),
  ((select id from public.players where first_name = 'Brysen' and last_name = 'Moeller'), '2014-11-11', 'Anaphylactic NUTS/Asthma'),
  ((select id from public.players where first_name = 'Colten' and last_name = 'Willardsen'), '2014-08-16', 'no allergies has asthma'),
  ((select id from public.players where first_name = 'Colt' and last_name = 'Voytish'), '2014-10-12', 'None'),
  ((select id from public.players where first_name = 'Dash' and last_name = 'Mascarenas'), '2015-03-03', null),
  ((select id from public.players where first_name = 'Elijah' and last_name = 'Andreno'), '2015-06-05', 'None'),
  ((select id from public.players where first_name = 'Jameson' and last_name = 'Mandle'), '2014-10-20', 'None'),
  ((select id from public.players where first_name = 'Jaxson' and last_name = 'Murphy'), '2014-12-20', 'None'),
  ((select id from public.players where first_name = 'John' and last_name = 'Leao'), '2014-09-04', 'None'),
  ((select id from public.players where first_name = 'Josh' and last_name = 'Coe'), '2014-11-24', 'None/asthma'),
  ((select id from public.players where first_name = 'Luke' and last_name = 'Belfi'), '2014-10-24', null),
  ((select id from public.players where first_name = 'Mylan' and last_name = 'Silva'), '2015-02-09', 'Amoxicillin/ Cats'),
  ((select id from public.players where first_name = 'Slater' and last_name = 'Terry'), '2014-10-20', 'None');

insert into public.family_players (family_id, player_id, relationship)
values
  ((select id from public.families where email = 'nicole@thomewaterproofing'), (select id from public.players where first_name = 'Blake' and last_name = 'Thome'), 'parent'),
  ((select id from public.families where email = 'saar3233@msn.com'), (select id from public.players where first_name = 'Brysen' and last_name = 'Moeller'), 'parent'),
  ((select id from public.families where email = 'ayywillard44@gmail.com'), (select id from public.players where first_name = 'Colten' and last_name = 'Willardsen'), 'parent'),
  ((select id from public.families where email = 'kvoytish48@gmail.com'), (select id from public.players where first_name = 'Colt' and last_name = 'Voytish'), 'parent'),
  ((select id from public.families where email = 'dsddm3@gmail.com'), (select id from public.players where first_name = 'Dash' and last_name = 'Mascarenas'), 'parent'),
  ((select id from public.families where email = 'rb1701d@yahoo.com'), (select id from public.players where first_name = 'Elijah' and last_name = 'Andreno'), 'parent'),
  ((select id from public.families where email = '4jsracingteam@gmail.com'), (select id from public.players where first_name = 'Jameson' and last_name = 'Mandle'), 'parent'),
  ((select id from public.families where email = 'melsspace26@gmail.com'), (select id from public.players where first_name = 'Jaxson' and last_name = 'Murphy'), 'parent'),
  ((select id from public.families where email = 'sophiacleao@gmail.com'), (select id from public.players where first_name = 'John' and last_name = 'Leao'), 'parent'),
  ((select id from public.families where email = 'tkubinak@yahoo.com'), (select id from public.players where first_name = 'Josh' and last_name = 'Coe'), 'parent'),
  ((select id from public.families where email = 'evanbelfi@gmail.com'), (select id from public.players where first_name = 'Luke' and last_name = 'Belfi'), 'parent'),
  ((select id from public.families where email = 'mylansilva09@gmail.com'), (select id from public.players where first_name = 'Mylan' and last_name = 'Silva'), 'parent'),
  ((select id from public.families where email = 'alexisdterry@yahoo.com'), (select id from public.players where first_name = 'Slater' and last_name = 'Terry'), 'parent');

insert into public.availability_weekends (weekend_start, weekend_end, month_label, season_year)
values
  ('2026-09-05', '2026-09-06', 'September', 2026),
  ('2026-09-12', '2026-09-13', 'September', 2026),
  ('2026-09-19', '2026-09-20', 'September', 2026),
  ('2026-09-26', '2026-09-27', 'September', 2026),
  ('2026-10-03', '2026-10-04', 'October', 2026),
  ('2026-10-10', '2026-10-11', 'October', 2026),
  ('2026-10-17', '2026-10-18', 'October', 2026),
  ('2026-10-24', '2026-10-25', 'October', 2026),
  ('2026-10-31', '2026-11-01', 'October', 2026),
  ('2026-11-07', '2026-11-08', 'November', 2026),
  ('2026-11-14', '2026-11-15', 'November', 2026),
  ('2026-11-21', '2026-11-22', 'November', 2026),
  ('2026-11-28', '2026-11-29', 'November', 2026),
  ('2026-12-05', '2026-12-06', 'December', 2026),
  ('2026-12-12', '2026-12-13', 'December', 2026),
  ('2026-12-19', '2026-12-20', 'December', 2026),
  ('2026-12-26', '2026-12-27', 'December', 2026);

insert into public.availability_responses (weekend_id, player_id, response, submitted_by_family_id)
select
  aw.id,
  p.id,
  'yes',
  fp.family_id
from public.availability_weekends aw
cross join public.players p
join public.family_players fp on fp.player_id = p.id;

insert into public.expense_months (month, year, label, bank_account_name, bank_balance, bank_as_of, bank_notes)
values
  (5, 2026, 'May', 'SCV Crushers Navy Team Account', 6840, '2026-05-28', 'Reconciled against receipts and deposits'),
  (6, 2026, 'June', 'SCV Crushers Navy Team Account', 7250, '2026-06-28', 'Reconciled against receipts and deposits'),
  (7, 2026, 'July', 'SCV Crushers Navy Team Account', 7660, '2026-07-28', 'Reconciled against receipts and deposits'),
  (8, 2026, 'August', 'SCV Crushers Navy Team Account', 8070, '2026-08-28', 'Reconciled against receipts and deposits'),
  (9, 2026, 'September', 'SCV Crushers Navy Team Account', 8480, '2026-09-28', 'Reconciled against receipts and deposits'),
  (10, 2026, 'October', 'SCV Crushers Navy Team Account', 8890, '2026-10-28', 'Reconciled against receipts and deposits'),
  (11, 2026, 'November', 'SCV Crushers Navy Team Account', 9300, '2026-11-28', 'Reconciled against receipts and deposits'),
  (12, 2026, 'December', 'SCV Crushers Navy Team Account', 9710, '2026-12-28', 'Reconciled against receipts and deposits');

do $$
declare
  month_row record;
  month_index integer;
  cages_total numeric(10, 2);
  practice_total numeric(10, 2);
  equipment_total numeric(10, 2) := 180;
  fixed_total numeric(10, 2);
  pg_total numeric(10, 2);
  wood_total numeric(10, 2);
  tournament_total numeric(10, 2);
  family_count integer;
  pg_tournament_id uuid;
  wood_tournament_id uuid;
  participant_names text[];
begin
  select count(*) into family_count from public.players where status = 'active';

  for month_row in
    select * from public.expense_months where year = 2026 order by month
  loop
    month_index := month_row.month - 5;
    cages_total := (70 + month_index * 2) * 6;
    practice_total := 65 * 4;
    fixed_total := cages_total + practice_total + equipment_total;
    pg_total := 895 + month_index * 35;
    wood_total := 520 + month_index * 20;
    tournament_total := pg_total + wood_total;

    insert into public.fixed_expenses (expense_month_id, name, per_session, sessions, total_team_cost, notes, sort_order)
    values
      (month_row.id, 'Cage / Field Rentals', 70 + month_index * 2, 6, cages_total, 'Monthly facility block', 1),
      (month_row.id, 'Practice Field', 65, 4, practice_total, 'City field invoice', 2),
      (month_row.id, 'Team Equipment Fund', 180, 1, equipment_total, 'Baseballs, scorebooks, first aid', 3);

    insert into public.tournaments (expense_month_id, name, total_cost, sort_order)
    values (month_row.id, 'Perfect Game Tournament', pg_total, 1)
    returning id into pg_tournament_id;

    insert into public.tournaments (expense_month_id, name, total_cost, sort_order)
    values (month_row.id, 'Sunday Wood Bat Tournament', wood_total, 2)
    returning id into wood_tournament_id;

    participant_names := array[
      'Blake Thome',
      'Brysen Moeller',
      'Colten Willardsen',
      'Dash Mascarenas',
      'Elijah Andreno',
      'Jameson Mandle',
      'Jaxson Murphy',
      'John Leao',
      'Josh Coe',
      'Luke Belfi'
    ];

    insert into public.tournament_players (tournament_id, player_id)
    select pg_tournament_id, p.id
    from public.players p
    where concat_ws(' ', p.first_name, p.last_name) = any(participant_names);

    if mod(month_index, 2) = 0 then
      participant_names := array[
        'Blake Thome',
        'Colt Voytish',
        'Dash Mascarenas',
        'Elijah Andreno',
        'John Leao',
        'Josh Coe',
        'Luke Belfi',
        'Mylan Silva',
        'Slater Terry'
      ];
    else
      participant_names := array[
        'Blake Thome',
        'Colt Voytish',
        'Dash Mascarenas',
        'Elijah Andreno',
        'John Leao',
        'Josh Coe',
        'Luke Belfi',
        'Mylan Silva'
      ];
    end if;

    insert into public.tournament_players (tournament_id, player_id)
    select wood_tournament_id, p.id
    from public.players p
    where concat_ws(' ', p.first_name, p.last_name) = any(participant_names);

    insert into public.monthly_transactions (
      expense_month_id,
      transaction_name,
      transaction_date,
      transaction_type,
      amount,
      balance,
      note,
      sort_order
    )
    values
      (
        month_row.id,
        'Tournament Entries',
        make_date(month_row.year, month_row.month, 2),
        'debit',
        -tournament_total,
        month_row.bank_balance - tournament_total,
        'Tournament fees paid',
        1
      ),
      (
        month_row.id,
        'Family monthly deposits',
        make_date(month_row.year, month_row.month, 8),
        'credit',
        fixed_total + tournament_total,
        month_row.bank_balance,
        'Monthly dues received',
        2
      ),
      (
        month_row.id,
        'Cage / Field Rentals',
        make_date(month_row.year, month_row.month, 14),
        'debit',
        -cages_total,
        month_row.bank_balance - cages_total,
        'Monthly facility block',
        3
      ),
      (
        month_row.id,
        'Practice Field',
        make_date(month_row.year, month_row.month, 21),
        'debit',
        -practice_total,
        month_row.bank_balance - cages_total - practice_total,
        'City field invoice',
        4
      );

    insert into public.family_monthly_payments (expense_month_id, family_id, is_paid)
    select month_row.id, f.id, false
    from public.families f;
  end loop;
end $$;

insert into public.order_windows (name, status, opens_at, closes_at, expected_delivery_date)
values (
  'Summer Practice Gear',
  'closed',
  '2026-06-15 00:00:00-07',
  '2026-06-22 23:59:59-07',
  '2026-07-08'
);

insert into public.order_products (sku, name, price, product_type, image_path, description, size_options, sort_order)
values
  (
    'navy-practice-jersey',
    'Navy Practice Jersey',
    34,
    'jersey',
    '/assets/order-center/navy-practice-jersey.png',
    'Navy lightweight practice jersey with Crushers team styling for summer workouts.',
    array['YS', 'YM', 'YL', 'YXL', 'AS', 'AM', 'AL', 'AXL'],
    1
  ),
  (
    'gray-practice-jersey',
    'Gray Practice Jersey',
    34,
    'jersey',
    '/assets/order-center/gray-practice-jersey.png',
    'Gray practice jersey for extra training days and cage sessions.',
    array['YS', 'YM', 'YL', 'YXL', 'AS', 'AM', 'AL', 'AXL'],
    2
  ),
  (
    'navy-flexfit-hat',
    'Navy FlexFit Hat',
    25,
    'hat',
    '/assets/order-center/navy-flexfit-hat.png',
    'Navy FlexFit team hat for practices, warmups, and tournament travel days.',
    array['XS-SM', 'SM-MD', 'L-XL'],
    3
  ),
  (
    'gray-flexfit-hat',
    'Gray FlexFit Hat',
    25,
    'hat',
    '/assets/order-center/gray-flexfit-hat.png',
    'Gray FlexFit hat with clean Crushers branding.',
    array['XS-SM', 'SM-MD', 'L-XL'],
    4
  );

do $$
declare
  summer_window_id uuid;
  luke_family_id uuid;
  luke_player_id uuid;
  josh_family_id uuid;
  josh_player_id uuid;
  order_id uuid;
begin
  select id into summer_window_id from public.order_windows where name = 'Summer Practice Gear';
  select f.id, p.id into luke_family_id, luke_player_id
  from public.families f
  join public.family_players fp on fp.family_id = f.id
  join public.players p on p.id = fp.player_id
  where f.email = 'evanbelfi@gmail.com';

  insert into public.orders (order_window_id, family_id, player_id, status, total_amount)
  values (summer_window_id, luke_family_id, luke_player_id, 'submitted', 59)
  returning id into order_id;

  insert into public.order_items (order_id, product_id, size, quantity, unit_price)
  values
    (order_id, (select id from public.order_products where sku = 'navy-practice-jersey'), 'YM', 1, 34),
    (order_id, (select id from public.order_products where sku = 'navy-flexfit-hat'), 'SM-MD', 1, 25);

  select f.id, p.id into josh_family_id, josh_player_id
  from public.families f
  join public.family_players fp on fp.family_id = f.id
  join public.players p on p.id = fp.player_id
  where f.email = 'tkubinak@yahoo.com';

  insert into public.orders (order_window_id, family_id, player_id, status, total_amount)
  values (summer_window_id, josh_family_id, josh_player_id, 'submitted', 34)
  returning id into order_id;

  insert into public.order_items (order_id, product_id, size, quantity, unit_price)
  values (order_id, (select id from public.order_products where sku = 'gray-practice-jersey'), 'YL', 1, 34);
end $$;

commit;
