-- Create inventory_snapshots table (time-series)
create table public.inventory_snapshots (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null,
  source text not null default 'sync' check (source in ('sync', 'csv', 'manual', 'webhook'))
);

-- RLS
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

-- Indexes for time-series queries
create index idx_snapshots_product_id on public.inventory_snapshots(product_id);
create index idx_snapshots_product_created on public.inventory_snapshots(product_id, created_at desc);
create index idx_snapshots_created_at on public.inventory_snapshots(created_at);
