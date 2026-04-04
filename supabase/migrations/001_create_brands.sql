-- Create brands table
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

-- RLS
alter table public.brands enable row level security;

create policy "Users can view own brands" on public.brands
  for select using (auth.uid() = user_id);

create policy "Users can insert own brands" on public.brands
  for insert with check (auth.uid() = user_id);

create policy "Users can update own brands" on public.brands
  for update using (auth.uid() = user_id);

create policy "Users can delete own brands" on public.brands
  for delete using (auth.uid() = user_id);

-- Indexes
create index idx_brands_user_id on public.brands(user_id);
create index idx_brands_platform on public.brands(platform);
