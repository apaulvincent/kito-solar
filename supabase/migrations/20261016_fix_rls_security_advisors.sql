-- ==============================================================================
-- Kito Solar — Fix Supabase Security & Performance Advisors
-- Migration: 20261016_fix_rls_security_advisors.sql
--
-- Fixes:
-- 1. [CRITICAL] RLS Disabled in Public for:
--    - public.utility_tariffs
--    - public.catalog_panels
--    - public.catalog_inverters
--    - public.catalog_batteries
--    - public.solar_knowledge_chunks
-- 2. [PERFORMANCE/WARNING] Auth RLS Initialization Plan for:
--    - public.user_projects (wraps auth.uid() in (select auth.uid()) for InitPlan optimization)
-- 3. [DEFENSIVE] Enables RLS & public read on any remaining legacy catalog/rule tables
-- ==============================================================================

begin;

-- ==============================================================================
-- PART 1: Fix CRITICAL "RLS Disabled in Public" on New Catalog & Knowledge Tables
-- ==============================================================================

-- 1. utility_tariffs
alter table if exists public.utility_tariffs enable row level security;

drop policy if exists "Allow public read access on utility_tariffs" on public.utility_tariffs;
create policy "Allow public read access on utility_tariffs"
  on public.utility_tariffs
  for select
  to public
  using (true);

-- 2. catalog_panels
alter table if exists public.catalog_panels enable row level security;

drop policy if exists "Allow public read access on catalog_panels" on public.catalog_panels;
create policy "Allow public read access on catalog_panels"
  on public.catalog_panels
  for select
  to public
  using (true);

-- 3. catalog_inverters
alter table if exists public.catalog_inverters enable row level security;

drop policy if exists "Allow public read access on catalog_inverters" on public.catalog_inverters;
create policy "Allow public read access on catalog_inverters"
  on public.catalog_inverters
  for select
  to public
  using (true);

-- 4. catalog_batteries
alter table if exists public.catalog_batteries enable row level security;

drop policy if exists "Allow public read access on catalog_batteries" on public.catalog_batteries;
create policy "Allow public read access on catalog_batteries"
  on public.catalog_batteries
  for select
  to public
  using (true);

-- 5. solar_knowledge_chunks
alter table if exists public.solar_knowledge_chunks enable row level security;

drop policy if exists "Allow public read access on solar_knowledge_chunks" on public.solar_knowledge_chunks;
create policy "Allow public read access on solar_knowledge_chunks"
  on public.solar_knowledge_chunks
  for select
  to public
  using (true);


-- ==============================================================================
-- PART 2: Fix "Auth RLS Initialization Plan" on public.user_projects
-- Wrap auth.uid() in (select auth.uid()) so PostgreSQL evaluates it once per statement
-- instead of re-evaluating it for every row scanned.
-- ==============================================================================

alter table if exists public.user_projects enable row level security;

drop policy if exists "Users can view their own saved projects" on public.user_projects;
create policy "Users can view their own saved projects"
  on public.user_projects
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own saved projects" on public.user_projects;
create policy "Users can insert their own saved projects"
  on public.user_projects
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own saved projects" on public.user_projects;
create policy "Users can update their own saved projects"
  on public.user_projects
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own saved projects" on public.user_projects;
create policy "Users can delete their own saved projects"
  on public.user_projects
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);


-- ==============================================================================
-- PART 3: Defensive RLS & Read-Only Policies for Existing Legacy Tables (if present)
-- ==============================================================================

-- solar_inverters
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'solar_inverters') then
    execute 'alter table public.solar_inverters enable row level security';
    execute 'drop policy if exists "Allow public read access on solar_inverters" on public.solar_inverters';
    execute 'create policy "Allow public read access on solar_inverters" on public.solar_inverters for select to public using (true)';
  end if;
end $$;

-- solar_modules
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'solar_modules') then
    execute 'alter table public.solar_modules enable row level security';
    execute 'drop policy if exists "Allow public read access on solar_modules" on public.solar_modules';
    execute 'create policy "Allow public read access on solar_modules" on public.solar_modules for select to public using (true)';
  end if;
end $$;

-- batteries
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'batteries') then
    execute 'alter table public.batteries enable row level security';
    execute 'drop policy if exists "Allow public read access on batteries" on public.batteries';
    execute 'create policy "Allow public read access on batteries" on public.batteries for select to public using (true)';
  end if;
end $$;

-- calculator_accessories
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'calculator_accessories') then
    execute 'alter table public.calculator_accessories enable row level security';
    execute 'drop policy if exists "Allow public read access on calculator_accessories" on public.calculator_accessories';
    execute 'create policy "Allow public read access on calculator_accessories" on public.calculator_accessories for select to public using (true)';
  end if;
end $$;

-- calculator_rule_breakers
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'calculator_rule_breakers') then
    execute 'alter table public.calculator_rule_breakers enable row level security';
    execute 'drop policy if exists "Allow public read access on calculator_rule_breakers" on public.calculator_rule_breakers';
    execute 'create policy "Allow public read access on calculator_rule_breakers" on public.calculator_rule_breakers for select to public using (true)';
  end if;
end $$;

-- calculator_rule_wires
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'calculator_rule_wires') then
    execute 'alter table public.calculator_rule_wires enable row level security';
    execute 'drop policy if exists "Allow public read access on calculator_rule_wires" on public.calculator_rule_wires';
    execute 'create policy "Allow public read access on calculator_rule_wires" on public.calculator_rule_wires for select to public using (true)';
  end if;
end $$;

-- calculator_rule_conduit
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'calculator_rule_conduit') then
    execute 'alter table public.calculator_rule_conduit enable row level security';
    execute 'drop policy if exists "Allow public read access on calculator_rule_conduit" on public.calculator_rule_conduit';
    execute 'create policy "Allow public read access on calculator_rule_conduit" on public.calculator_rule_conduit for select to public using (true)';
  end if;
end $$;

-- calculator_rule_isolators
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'calculator_rule_isolators') then
    execute 'alter table public.calculator_rule_isolators enable row level security';
    execute 'drop policy if exists "Allow public read access on calculator_rule_isolators" on public.calculator_rule_isolators';
    execute 'create policy "Allow public read access on calculator_rule_isolators" on public.calculator_rule_isolators for select to public using (true)';
  end if;
end $$;

-- calculator_rule_grounding
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'calculator_rule_grounding') then
    execute 'alter table public.calculator_rule_grounding enable row level security';
    execute 'drop policy if exists "Allow public read access on calculator_rule_grounding" on public.calculator_rule_grounding';
    execute 'create policy "Allow public read access on calculator_rule_grounding" on public.calculator_rule_grounding for select to public using (true)';
  end if;
end $$;

commit;
