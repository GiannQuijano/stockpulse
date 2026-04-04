-- ================================================
-- STOCKPULSE FULL DATABASE MIGRATION
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ================================================

-- 001: Create brands table
create table public.brands (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  name text not null,
  platform text not null check (platform in ('shopify', 'woocommerce', 'csv', 'custom')),
  platform_url text,
  api_key text,
  api_secret text,
  access_token text,
  slack_webhook_url text,
  alert_email text,
  default_threshold_days integer not null default 7,
  is_active boolean not null default true,
  last_synced_at timestamptz,
  user_id uuid not null references auth.users(id) on delete cascade
);

alter table public.brands enable row level security;

create policy "Users can view own brands" on public.brands
  for select using (auth.uid() = user_id);

create policy "Users can insert own brands" on public.brands
  for insert with check (auth.uid() = user_id);

create policy "Users can update own brands" on public.brands
  for update using (auth.uid() = user_id);

create policy "Users can delete own brands" on public.brands
  for delete using (auth.uid() = user_id);

create index idx_brands_user_id on public.brands(user_id);
create index idx_brands_platform on public.brands(platform);

-- 002: Create products table
create table public.products (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  brand_id uuid not null references public.brands(id) on delete cascade,
  external_id text,
  sku text not null,
  name text not null,
  variant_title text,
  current_quantity integer not null default 0,
  alert_threshold_days integer not null default 7,
  image_url text,
  is_active boolean not null default true
);

alter table public.products enable row level security;

create policy "Users can view products of own brands" on public.products
  for select using (
    exists (select 1 from public.brands where brands.id = products.brand_id and brands.user_id = auth.uid())
  );

create policy "Users can insert products for own brands" on public.products
  for insert with check (
    exists (select 1 from public.brands where brands.id = products.brand_id and brands.user_id = auth.uid())
  );

create policy "Users can update products of own brands" on public.products
  for update using (
    exists (select 1 from public.brands where brands.id = products.brand_id and brands.user_id = auth.uid())
  );

create policy "Users can delete products of own brands" on public.products
  for delete using (
    exists (select 1 from public.brands where brands.id = products.brand_id and brands.user_id = auth.uid())
  );

create index idx_products_brand_id on public.products(brand_id);
create unique index idx_products_brand_sku on public.products(brand_id, sku);
create index idx_products_current_quantity on public.products(current_quantity);

-- 003: Create inventory_snapshots table
create table public.inventory_snapshots (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null,
  source text not null default 'sync' check (source in ('sync', 'csv', 'manual', 'webhook'))
);

alter table public.inventory_snapshots enable row level security;

create policy "Users can view snapshots of own products" on public.inventory_snapshots
  for select using (
    exists (
      select 1 from public.products p
      join public.brands b on b.id = p.brand_id
      where p.id = inventory_snapshots.product_id and b.user_id = auth.uid()
    )
  );

create policy "Users can insert snapshots for own products" on public.inventory_snapshots
  for insert with check (
    exists (
      select 1 from public.products p
      join public.brands b on b.id = p.brand_id
      where p.id = inventory_snapshots.product_id and b.user_id = auth.uid()
    )
  );

create index idx_snapshots_product_id on public.inventory_snapshots(product_id);
create index idx_snapshots_product_created on public.inventory_snapshots(product_id, created_at desc);
create index idx_snapshots_created_at on public.inventory_snapshots(created_at);

-- 004: Create alerts table
create table public.alerts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  brand_id uuid not null references public.brands(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  alert_rule_id uuid,
  severity text not null check (severity in ('warning', 'critical', 'stockout')),
  channel text not null check (channel in ('slack', 'email', 'dashboard')),
  message text not null,
  metadata jsonb,
  sent_at timestamptz
);

alter table public.alerts enable row level security;

create policy "Users can view alerts of own brands" on public.alerts
  for select using (
    exists (select 1 from public.brands where brands.id = alerts.brand_id and brands.user_id = auth.uid())
  );

create policy "Users can insert alerts for own brands" on public.alerts
  for insert with check (
    exists (select 1 from public.brands where brands.id = alerts.brand_id and brands.user_id = auth.uid())
  );

create index idx_alerts_brand_id on public.alerts(brand_id);
create index idx_alerts_product_id on public.alerts(product_id);
create index idx_alerts_severity on public.alerts(severity);
create index idx_alerts_created_at on public.alerts(created_at desc);

-- 005: Create alert_rules table
create table public.alert_rules (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  threshold_days integer not null,
  severity text not null check (severity in ('warning', 'critical', 'stockout')),
  channels text[] not null default '{dashboard}',
  cooldown_hours integer not null default 24,
  is_active boolean not null default true
);

alter table public.alert_rules enable row level security;

create policy "Users can view alert rules of own brands" on public.alert_rules
  for select using (
    exists (select 1 from public.brands where brands.id = alert_rules.brand_id and brands.user_id = auth.uid())
  );

create policy "Users can insert alert rules for own brands" on public.alert_rules
  for insert with check (
    exists (select 1 from public.brands where brands.id = alert_rules.brand_id and brands.user_id = auth.uid())
  );

create policy "Users can update alert rules of own brands" on public.alert_rules
  for update using (
    exists (select 1 from public.brands where brands.id = alert_rules.brand_id and brands.user_id = auth.uid())
  );

create policy "Users can delete alert rules of own brands" on public.alert_rules
  for delete using (
    exists (select 1 from public.brands where brands.id = alert_rules.brand_id and brands.user_id = auth.uid())
  );

create index idx_alert_rules_brand_id on public.alert_rules(brand_id);

-- 006: Create csv_imports table
create table public.csv_imports (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  brand_id uuid not null references public.brands(id) on delete cascade,
  filename text not null,
  row_count integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  user_id uuid not null references auth.users(id) on delete cascade
);

alter table public.csv_imports enable row level security;

create policy "Users can view own csv imports" on public.csv_imports
  for select using (auth.uid() = user_id);

create policy "Users can insert own csv imports" on public.csv_imports
  for insert with check (auth.uid() = user_id);

create policy "Users can update own csv imports" on public.csv_imports
  for update using (auth.uid() = user_id);

create index idx_csv_imports_brand_id on public.csv_imports(brand_id);
create index idx_csv_imports_user_id on public.csv_imports(user_id);

-- 007: Auto-update updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger brands_updated_at
  before update on public.brands
  for each row execute function public.handle_updated_at();

create trigger products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

create trigger alert_rules_updated_at
  before update on public.alert_rules
  for each row execute function public.handle_updated_at();

-- 008: Service role policies for cron jobs
create policy "Service role can insert snapshots" on public.inventory_snapshots
  for insert with check (true);

create policy "Service role can insert alerts" on public.alerts
  for insert with check (true);

create policy "Service role can delete snapshots" on public.inventory_snapshots
  for delete using (true);
