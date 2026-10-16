-- ==============================================================================
-- Kito Solar — Fix Extension in Public & Function Search Path Mutable
-- Migration: 20261016_fix_vector_extension_and_function_search_path.sql
--
-- Fixes:
-- 1. [WARNING] Extension in Public -> public.vector
--    Moves vector extension into the dedicated 'extensions' schema
-- 2. [WARNING] Function Search Path Mutable -> public.match_solar_knowledge
--    Pins search_path to public, extensions to prevent search_path hijacking
-- ==============================================================================

begin;

-- 1. Ensure extensions schema exists and move vector extension there
create schema if not exists extensions;
grant usage on schema extensions to anon, authenticated, service_role;

do $$
begin
  if exists (
    select 1 from pg_extension e
    join pg_namespace n on e.extnamespace = n.oid
    where e.extname = 'vector' and n.nspname = 'public'
  ) then
    alter extension vector set schema extensions;
  end if;
end $$;

-- 2. Re-declare match_solar_knowledge with fixed search_path
create or replace function public.match_solar_knowledge (
  query_embedding extensions.vector(768),
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
set search_path = public, extensions
as $$
  select
    id,
    document_title,
    category,
    related_hardware_model,
    content,
    1 - (solar_knowledge_chunks.embedding <=> query_embedding) as similarity
  from public.solar_knowledge_chunks
  where 1 - (solar_knowledge_chunks.embedding <=> query_embedding) > match_threshold
    and (filter_category is null or category = filter_category)
  order by solar_knowledge_chunks.embedding <=> query_embedding
  limit match_count;
$$;

commit;
