-- Configurable subscription plan prices.
-- Admins can change the amount and visibility of each plan from the
-- Flutter admin panel without touching code or redeploying.
create table if not exists subscription_plans (
  id text primary key,
  label text not null,
  amount integer not null,
  period_days integer not null,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Public read is fine for the payment gate / billing page.
-- Writes are restricted to the service role (admin API uses it).
alter table subscription_plans enable row level security;

create policy "Public can read active subscription plans"
  on subscription_plans for select
  using (active = true);

create policy "Only service role can manage plans"
  on subscription_plans for all
  using (false);

-- Seed default prices. These are the same as the previous hardcoded values.
insert into subscription_plans (id, label, amount, period_days)
values
  ('monthly', 'Monthly', 899, 30),
  ('quarterly', 'Quarterly', 899 * 3, 90),
  ('yearly', 'Yearly', 899 * 12, 365)
on conflict (id) do nothing;
