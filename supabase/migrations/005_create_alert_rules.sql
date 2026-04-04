-- Create alert_rules table
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

-- RLS
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

-- Indexes
create index idx_alert_rules_brand_id on public.alert_rules(brand_id);
