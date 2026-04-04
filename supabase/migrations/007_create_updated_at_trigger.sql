-- Auto-update updated_at column
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
