-- Create csv_imports table
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

-- RLS
alter table public.csv_imports enable row level security;

create policy "Users can view own csv imports" on public.csv_imports
  for select using (auth.uid() = user_id);

create policy "Users can insert own csv imports" on public.csv_imports
  for insert with check (auth.uid() = user_id);

create policy "Users can update own csv imports" on public.csv_imports
  for update using (auth.uid() = user_id);

-- Indexes
create index idx_csv_imports_brand_id on public.csv_imports(brand_id);
create index idx_csv_imports_user_id on public.csv_imports(user_id);
