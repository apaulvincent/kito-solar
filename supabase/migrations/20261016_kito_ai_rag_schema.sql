-- supabase/migrations/20261016_kito_ai_rag_schema.sql
-- Kito Solar AI Copilot: RAG Knowledge Base, Utility Tariffs, and Hardware Catalog Schema

-- 0. Enable pgvector extension for RAG datasheet & knowledge retrieval
create extension if not exists vector;

-- 1. Utility Tariffs & Regional Solar Irradiance Table
create table if not exists public.utility_tariffs (
  id uuid primary key default gen_random_uuid(),
  region_name text not null,              -- e.g., 'Calabarzon', 'NCR', 'Central Visayas'
  city_or_municipality text not null,     -- e.g., 'San Pablo City, Laguna', 'Metro Manila', 'Cebu City'
  utility_provider text not null,         -- e.g., 'Meralco', 'BATELEC II', 'VECO'
  rate_php_per_kwh numeric(8, 2) not null,-- e.g., 11.85
  net_metering_export_rate numeric(8, 2) default 5.50,
  peak_sun_hours numeric(4, 2) not null,  -- e.g., 4.60
  record_low_temp_c numeric(4, 1) default 18.0, -- Used for cold Voc string calculation
  ambient_high_temp_c numeric(4, 1) default 38.0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Solar Panels Catalog
create table if not exists public.catalog_panels (
  id uuid primary key default gen_random_uuid(),
  brand text not null,                    -- e.g., 'Jinko Solar', 'LONGi', 'Canadian Solar'
  model text not null,                    -- e.g., 'Tiger Neo N-Type 580W'
  wattage_wp integer not null,            -- e.g., 580
  voc_v numeric(6, 2) not null,           -- Open Circuit Voltage (V), e.g., 51.20
  vmp_v numeric(6, 2) not null,           -- Maximum Power Voltage (V), e.g., 43.10
  isc_a numeric(6, 2) not null,           -- Short Circuit Current (A), e.g., 14.35
  imp_a numeric(6, 2) not null,           -- Maximum Power Current (A), e.g., 13.46
  temp_coeff_voc_pct numeric(5, 3) not null default -0.250, -- %/°C
  efficiency_pct numeric(5, 2) not null,  -- e.g., 22.45
  length_m numeric(4, 2) not null default 2.27,
  width_m numeric(4, 2) not null default 1.13,
  price_php numeric(10, 2) not null,
  tier text check (tier in ('economy', 'standard', 'premium')) default 'standard',
  in_stock boolean default true,
  created_at timestamptz default now()
);

-- 3. Inverters Catalog
create table if not exists public.catalog_inverters (
  id uuid primary key default gen_random_uuid(),
  brand text not null,                    -- e.g., 'Deye', 'Growatt', 'Solis', 'Huawei'
  model text not null,                    -- e.g., 'SUN-8K-SG01LP1-EU'
  system_type text check (system_type in ('grid-tie', 'hybrid', 'off-grid')) not null,
  rated_ac_kw numeric(6, 2) not null,     -- e.g., 8.00
  max_dc_input_kw numeric(6, 2) not null, -- e.g., 10.40
  max_dc_voltage_v numeric(6, 2) not null,-- Absolute max input voltage, e.g., 500
  mppt_min_v numeric(6, 2) not null,      -- MPPT operating range min, e.g., 150
  mppt_max_v numeric(6, 2) not null,      -- MPPT operating range max, e.g., 425
  startup_voltage_v numeric(6, 2) not null default 125,
  mppt_count integer not null default 2,
  max_input_current_per_mppt_a numeric(6, 2) not null default 26.0,
  battery_voltage_nominal_v numeric(5, 1),-- e.g., 48.0 or 51.2 (null for grid-tie)
  phase text check (phase in ('1P', '3P')) default '1P',
  price_php numeric(10, 2) not null,
  tier text check (tier in ('economy', 'standard', 'premium')) default 'standard',
  in_stock boolean default true,
  created_at timestamptz default now()
);

-- 4. Batteries Catalog (LiFePO4)
create table if not exists public.catalog_batteries (
  id uuid primary key default gen_random_uuid(),
  brand text not null,                    -- e.g., 'Deye', 'Pylontech', 'LVTOPSUN'
  model text not null,                    -- e.g., 'SE-G5.1 Pro-B'
  capacity_kwh numeric(6, 2) not null,    -- e.g., 5.12
  nominal_voltage_v numeric(5, 1) not null default 51.2,
  capacity_ah numeric(6, 1) not null default 100.0,
  max_dod_pct numeric(4, 2) not null default 0.90, -- 90% Depth of Discharge
  cycle_life integer not null default 6000,
  price_php numeric(10, 2) not null,
  in_stock boolean default true,
  created_at timestamptz default now()
);

-- 5. RAG Knowledge Base Chunks (Datasheets, PEC Wiring Rules, Installation FAQs)
create table if not exists public.solar_knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_title text not null,
  category text check (category in ('datasheet', 'electrical_code', 'net_metering', 'sizing_guide', 'faq')) not null,
  related_hardware_model text,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  embedding vector(768),                   -- 768 for gemini text-embedding-004 / 1536 for openai
  created_at timestamptz default now()
);

-- 6. Vector similarity search RPC function
create or replace function match_solar_knowledge (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_category text default null
)
returns table (
  id uuid,
  document_title text,
  category text,
  related_hardware_model text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    id,
    document_title,
    category,
    related_hardware_model,
    content,
    1 - (solar_knowledge_chunks.embedding <=> query_embedding) as similarity
  from solar_knowledge_chunks
  where 1 - (solar_knowledge_chunks.embedding <=> query_embedding) > match_threshold
    and (filter_category is null or category = filter_category)
  order by solar_knowledge_chunks.embedding <=> query_embedding
  limit match_count;
$$;

-- 7. Seed Utility Tariffs
insert into public.utility_tariffs (region_name, city_or_municipality, utility_provider, rate_php_per_kwh, net_metering_export_rate, peak_sun_hours, record_low_temp_c, ambient_high_temp_c)
values
  ('Calabarzon', 'San Pablo City, Laguna', 'Meralco', 11.85, 5.50, 4.60, 18.0, 38.0),
  ('NCR (Metro Manila)', 'Metro Manila', 'Meralco', 12.15, 5.65, 4.50, 20.0, 39.0),
  ('Calabarzon', 'Batangas', 'BATELEC II', 10.90, 5.10, 4.70, 19.0, 37.0),
  ('Central Luzon', 'Pampanga', 'PELCO / Clark Electric', 11.20, 5.30, 4.80, 17.5, 40.0),
  ('Central Visayas', 'Cebu City', 'Visayan Electric (VECO)', 12.10, 5.60, 4.70, 22.0, 36.5),
  ('Davao Region', 'Davao City', 'Davao Light & Power (DLPC)', 10.50, 4.90, 4.80, 21.0, 36.0)
on conflict do nothing;

-- 8. Seed Solar Panels
insert into public.catalog_panels (brand, model, wattage_wp, voc_v, vmp_v, isc_a, imp_a, temp_coeff_voc_pct, efficiency_pct, length_m, width_m, price_php, tier, in_stock)
values
  ('Jinko Solar', 'Tiger Neo N-Type 580W', 580, 51.20, 43.10, 14.35, 13.46, -0.250, 22.45, 2.27, 1.13, 5800.00, 'standard', true),
  ('Canadian Solar', 'HiKu6 Mono PERC 550W', 550, 49.60, 41.70, 14.00, 13.19, -0.260, 21.30, 2.26, 1.13, 5400.00, 'economy', true),
  ('LONGi Solar', 'Hi-MO 6 Explorer 600W', 600, 52.40, 44.30, 14.45, 13.55, -0.240, 23.20, 2.28, 1.13, 6200.00, 'premium', true)
on conflict do nothing;

-- 9. Seed Inverters
insert into public.catalog_inverters (brand, model, system_type, rated_ac_kw, max_dc_input_kw, max_dc_voltage_v, mppt_min_v, mppt_max_v, startup_voltage_v, mppt_count, max_input_current_per_mppt_a, battery_voltage_nominal_v, phase, price_php, tier, in_stock)
values
  ('Growatt', 'MIN 5000TL-X', 'grid-tie', 5.00, 7.00, 550, 80, 500, 100, 2, 13.5, null, '1P', 32000.00, 'economy', true),
  ('Solis', 'S6-GR1P8K', 'grid-tie', 8.00, 11.20, 600, 90, 520, 120, 2, 16.0, null, '1P', 48000.00, 'standard', true),
  ('Deye', 'SUN-5K-SG03LP1-EU', 'hybrid', 5.00, 6.50, 500, 150, 425, 125, 2, 13.0, 48.0, '1P', 58000.00, 'standard', true),
  ('Deye', 'SUN-8K-SG01LP1-EU', 'hybrid', 8.00, 10.40, 500, 150, 425, 125, 2, 26.0, 48.0, '1P', 85000.00, 'standard', true),
  ('Deye', 'SUN-12K-SG04LP3-EU', 'hybrid', 12.00, 15.60, 800, 200, 650, 160, 2, 26.0, 48.0, '3P', 128000.00, 'premium', true)
on conflict do nothing;

-- 10. Seed Batteries
insert into public.catalog_batteries (brand, model, capacity_kwh, nominal_voltage_v, capacity_ah, max_dod_pct, cycle_life, price_php, in_stock)
values
  ('Deye', 'SE-G5.1 Pro-B', 5.12, 51.2, 100.0, 0.90, 6000, 62000.00, true),
  ('LVTOPSUN', 'Wall-Mounted LiFePO4 10.24kWh', 10.24, 51.2, 200.0, 0.90, 6000, 105000.00, true),
  ('LVTOPSUN', 'Mobile Roller LiFePO4 15.36kWh', 15.36, 51.2, 300.0, 0.90, 6000, 145000.00, true)
on conflict do nothing;

-- 11. Seed Knowledge Chunks
insert into public.solar_knowledge_chunks (document_title, category, content)
values
  ('Philippine Electrical Code (PEC) Article 6.90 - PV String Voltage Calculations', 'electrical_code', 'Under PEC Article 6.90 and NEC 690.7, maximum PV system DC voltage must be calculated at the lowest expected ambient temperature. For Luzon and Visayas, record low temperatures reach 18°C. Open-circuit voltage (Voc) rises as temperature drops, following the temperature coefficient gamma_Voc (-0.25%/°C). The total series string Voc must never exceed the inverter absolute maximum DC input voltage (500V or 600V for residential, 800V-1000V for commercial). Exceeding this rating causes instantaneous component puncture and voids inverter warranty.'),
  ('Deye SUN-8K-SG01LP1-EU Hybrid Inverter Engineering Manual', 'datasheet', 'The Deye 8kW hybrid inverter features 2 MPPT trackers with an operating MPPT range of 150V to 425V and an absolute maximum DC input voltage of 500V. For 550W-600W Tier-1 panels (nominal Vmp ~42V-44V), minimum panels in series per MPPT to ensure early morning startup is 4 panels (170V), while optimal nominal string length is 6 to 9 panels per string (260V-380V). Connecting 14 or more modern panels in a single string violates the 500V maximum DC limit and must instead be split into 2 parallel strings (e.g., 7S2P or 8S2P across the 2 MPPTs).'),
  ('ERC Net Metering Rules for End-Users in the Philippines', 'net_metering', 'The Energy Regulatory Commission (ERC) Net-Metering Rules allow qualified end-users up to 100kW peak to export surplus daytime solar generation into distribution utility grids (Meralco, VECO, Davao Light). Export credits are valued at the utility blended generation cost (currently approximately ₱5.00 - ₱5.65/kWh), rather than retail retail rates (₱11.00 - ₱12.50/kWh). Because retail rates exceed export credits by over 50%, maximizing daytime self-consumption or storing surplus solar in LiFePO4 batteries yields significantly higher financial ROI than relying solely on net metering export.'),
  ('Grid-Tie vs. Hybrid Solar Systems in the Philippines', 'sizing_guide', 'Grid-Tie systems shut down instantly during utility blackouts (anti-islanding safety) and provide no brownout protection. They offer the lowest initial equipment investment and fastest payback (typically 3 to 4.5 years). Hybrid systems include an automatic transfer switch (ATS) and LiFePO4 battery storage, maintaining continuous electricity to critical lighting, refrigeration, and aircon loads within 10 milliseconds of a utility blackout. Payback for hybrid systems ranges from 4.5 to 6.5 years depending on battery capacity.')
on conflict do nothing;
