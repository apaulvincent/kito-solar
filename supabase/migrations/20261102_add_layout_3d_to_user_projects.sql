-- Migration: 20261102_add_layout_3d_to_user_projects.sql
-- Description: Add layout_3d JSONB column to public.user_projects table
-- Purpose: Persist custom 3D plant room components, moved node positions, and (+/-) polarity wire runs per project

ALTER TABLE public.user_projects
ADD COLUMN IF NOT EXISTS layout_3d JSONB DEFAULT NULL;

COMMENT ON COLUMN public.user_projects.layout_3d IS
  'Serialized 3D plant room layout: base node position overrides, added wall/floor components, and positive/negative wire connections';
