-- Service role policies for cron jobs (bypasses RLS by default, but explicit for clarity)
-- These allow the service role to manage all data for cron operations

-- Allow service role to insert snapshots (cron sync)
create policy "Service role can insert snapshots" on public.inventory_snapshots
  for insert with check (true);

-- Allow service role to insert alerts (cron alerts)
create policy "Service role can insert alerts" on public.alerts
  for insert with check (true);

-- Allow service role to delete old snapshots (cron cleanup)
create policy "Service role can delete snapshots" on public.inventory_snapshots
  for delete using (true);
