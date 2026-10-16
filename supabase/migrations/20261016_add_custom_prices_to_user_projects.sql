-- Migration: 20261016_add_custom_prices_to_user_projects.sql
-- Description: Add custom_prices JSONB column to user_projects table
-- Purpose: Persist project-specific line-item unit price overrides and custom pricing for TBD components

ALTER TABLE public.user_projects
ADD COLUMN IF NOT EXISTS custom_prices JSONB DEFAULT NULL;

COMMENT ON COLUMN public.user_projects.custom_prices IS 'Line-item unit price overrides and TBD item custom prices in PHP for this project only';
