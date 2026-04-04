-- Create alerts table
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

-- RLS
alter table public.alerts enable row level security;

create policy "Users can view alerts of own brands" on public.alerts
  for select using (
    exists (select 1 from public.brands where brands.id = alerts.brand_id and brands.user_id = auth.uid())
  );

create policy "Users can insert alerts for own brands" on public.alerts
  for insert with check (
    exists (select 1 from public.brands where brands.id = alerts.brand_id and brands.user_id = auth.uid())
  );

-- Indexes
create index idx_alerts_brand_id on public.alerts(brand_id);
create index idx_alerts_product_id on public.alerts(product_id);
create index idx_alerts_severity on public.alerts(severity);
create index idx_alerts_created_at on public.alerts(created_at desc);
