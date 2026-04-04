-- Create products table
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

-- RLS
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

-- Indexes
create index idx_products_brand_id on public.products(brand_id);
create unique index idx_products_brand_sku on public.products(brand_id, sku);
create index idx_products_current_quantity on public.products(current_quantity);
