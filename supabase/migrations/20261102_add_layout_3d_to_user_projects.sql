-- ==============================================================================
-- Migration: 20261102_add_layout_3d_to_user_projects.sql
-- Description:
--   1. Extend public.user_projects with layout_3d (JSONB), layout_version,
--      JSONB object constraint, and GIN index so every saved project stores its
--      complete 3D component placement and organized wiring arrangement.
--   2. Create public.plant_layout_templates for default & reusable 3D wiring
--      setups (with RLS policies and seeded default hybrid setup).
--   3. Sync public.calculator_accessories with calibrated Philippine market
--      pricing (Taxnele / TOMZN / Suntree / CNC PH averages).
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- PART 1: Extend public.user_projects for Project-Level 3D Wiring & Layout Save
-- ==============================================================================

ALTER TABLE public.user_projects
  ADD COLUMN IF NOT EXISTS layout_3d JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS layout_version INTEGER NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_user_projects_layout_3d_object'
  ) THEN
    ALTER TABLE public.user_projects
      ADD CONSTRAINT chk_user_projects_layout_3d_object
      CHECK (layout_3d IS NULL OR jsonb_typeof(layout_3d) = 'object');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_projects_layout_3d_gin
  ON public.user_projects USING gin (layout_3d);

COMMENT ON COLUMN public.user_projects.layout_3d IS
  'Serialized 3D plant room layout: baseNodePositions, removedBaseNodes, placedComponents, and wires (including routeOffset channel arrangements)';

COMMENT ON COLUMN public.user_projects.layout_version IS
  'Schema version of the layout_3d JSONB payload (default 1)';


-- ==============================================================================
-- PART 2: Create public.plant_layout_templates for Default & Preset Wiring Setups
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.plant_layout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT NULL,
  system_type TEXT NOT NULL DEFAULT 'HYBRID' CHECK (system_type IN ('HYBRID', 'ON-GRID', 'ALL')),
  is_default BOOLEAN NOT NULL DEFAULT false,
  layout_version INTEGER NOT NULL DEFAULT 1,
  layout_3d JSONB NOT NULL CHECK (jsonb_typeof(layout_3d) = 'object'),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plant_layout_templates_default
  ON public.plant_layout_templates (is_default, system_type);

ALTER TABLE public.plant_layout_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on plant_layout_templates" ON public.plant_layout_templates;
CREATE POLICY "Allow public read access on plant_layout_templates"
  ON public.plant_layout_templates
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own layout templates" ON public.plant_layout_templates;
CREATE POLICY "Users can insert their own layout templates"
  ON public.plant_layout_templates
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can update their own layout templates" ON public.plant_layout_templates;
CREATE POLICY "Users can update their own layout templates"
  ON public.plant_layout_templates
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can delete their own layout templates" ON public.plant_layout_templates;
CREATE POLICY "Users can delete their own layout templates"
  ON public.plant_layout_templates
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = created_by);

-- Seed the baseline default wiring template (can be updated anytime with custom organized JSON)
INSERT INTO public.plant_layout_templates (
  template_key,
  name,
  description,
  system_type,
  is_default,
  layout_version,
  layout_3d
)
VALUES (
  'default',
  'Default Hybrid 3D Plant & Wiring Setup',
  'Standard 3D plant-room layout with organized (+), (-), and (GND) wiring connections',
  'HYBRID',
  true,
  1,
  '{
    "version": 1,
    "baseNodePositions": {
      "pv_array": [-7.8, 0.75, 2.2],
      "dc_isolator": [-5.5, 4.9, 0.0],
      "dc_breaker": [-4.2, 2.9, 0.0],
      "dc_spd": [-5.0, 2.9, 0.0],
      "dc_conduit": [-5.0, 2.9, 0.0],
      "inverter": [-1.5, 5.6, 0.0],
      "battery_breaker": [-1.3, 2.9, 0.0],
      "battery": [-1.2, 0.9, 0.0],
      "battery_wire": [-1.4, 0.4, 0.4],
      "ac_breaker": [1.4, 2.9, 0.0],
      "ac_spd": [0.6, 2.9, 0.0],
      "ac_isolator": [2.9, 2.9, 0.0],
      "main_panel": [4.3, 2.6, 0.0],
      "ats": [5.95, 2.5, 0.0],
      "eps_breaker": [5.95, 1.4, 0.0],
      "grid": [12.0, 1.6, 0.9],
      "load": [5.8, 0.8, 3.8],
      "grounding": [4.6, 0.75, 0.0]
    },
    "removedBaseNodes": [],
    "placedComponents": [],
    "wires": [
      { "id": "base_wire_pv_iso_pos", "polarity": "positive", "fromNodeId": "pv_array", "fromPortId": "pv_pos", "toNodeId": "dc_isolator", "toPortId": "in_pos", "lengthMeters": 11.43, "routeOffset": [0, 0] },
      { "id": "base_wire_pv_iso_neg", "polarity": "negative", "fromNodeId": "pv_array", "fromPortId": "pv_neg", "toNodeId": "dc_isolator", "toPortId": "in_neg", "lengthMeters": 11.2, "routeOffset": [-0.28, -0.02] },
      { "id": "base_wire_iso_brk_pos", "polarity": "positive", "fromNodeId": "dc_isolator", "fromPortId": "out_pos", "toNodeId": "dc_breaker", "toPortId": "in_pos", "lengthMeters": 2.58, "routeOffset": [0, 0] },
      { "id": "base_wire_iso_brk_neg", "polarity": "negative", "fromNodeId": "dc_isolator", "fromPortId": "out_neg", "toNodeId": "dc_breaker", "toPortId": "in_neg", "lengthMeters": 2.46, "routeOffset": [0, 0] },
      { "id": "base_wire_dcbrk_inv_pos", "polarity": "positive", "fromNodeId": "dc_breaker", "fromPortId": "out_pos", "toNodeId": "inverter", "toPortId": "pv_pos", "lengthMeters": 5.44, "routeOffset": [0, 0] },
      { "id": "base_wire_dcbrk_inv_neg", "polarity": "negative", "fromNodeId": "dc_breaker", "fromPortId": "out_neg", "toNodeId": "inverter", "toPortId": "pv_neg", "lengthMeters": 5.38, "routeOffset": [0, 0] },
      { "id": "base_wire_inv_batbrk_pos", "polarity": "positive", "fromNodeId": "inverter", "fromPortId": "bat_pos", "toNodeId": "battery_breaker", "toPortId": "in_pos", "lengthMeters": 1.71, "routeOffset": [-0.05, -0.34] },
      { "id": "base_wire_inv_batbrk_neg", "polarity": "negative", "fromNodeId": "inverter", "fromPortId": "bat_neg", "toNodeId": "battery_breaker", "toPortId": "in_neg", "lengthMeters": 1.76, "routeOffset": [-0.05, -0.13] },
      { "id": "base_wire_batbrk_bat_pos", "polarity": "positive", "fromNodeId": "battery_breaker", "fromPortId": "out_pos", "toNodeId": "battery", "toPortId": "bat_pos", "lengthMeters": 0.84, "routeOffset": [0, 0] },
      { "id": "base_wire_batbrk_bat_neg", "polarity": "negative", "fromNodeId": "battery_breaker", "fromPortId": "out_neg", "toNodeId": "battery", "toPortId": "bat_neg", "lengthMeters": 1.03, "routeOffset": [0, 0] },
      { "id": "base_wire_inv_acbrk_pos", "polarity": "positive", "fromNodeId": "inverter", "fromPortId": "ac_pos", "toNodeId": "ac_breaker", "toPortId": "in_pos", "lengthMeters": 4.2, "routeOffset": [0, 0] },
      { "id": "base_wire_inv_acbrk_neg", "polarity": "negative", "fromNodeId": "inverter", "fromPortId": "ac_neg", "toNodeId": "ac_breaker", "toPortId": "in_neg", "lengthMeters": 4.27, "routeOffset": [-0.01, 0.23] },
      { "id": "base_wire_acbrk_iso_pos", "polarity": "positive", "fromNodeId": "ac_breaker", "fromPortId": "out_pos", "toNodeId": "ac_isolator", "toPortId": "in_pos", "lengthMeters": 3.63, "routeOffset": [0.39, -0.1] },
      { "id": "base_wire_acbrk_iso_neg", "polarity": "negative", "fromNodeId": "ac_breaker", "fromPortId": "out_neg", "toNodeId": "ac_isolator", "toPortId": "in_neg", "lengthMeters": 3.92, "routeOffset": [-0.19, 0.06] },
      { "id": "base_wire_aciso_panel_pos", "polarity": "positive", "fromNodeId": "ac_isolator", "fromPortId": "out_pos", "toNodeId": "main_panel", "toPortId": "in_pos", "lengthMeters": 3.52, "routeOffset": [0.35, -0.15] },
      { "id": "base_wire_aciso_panel_neg", "polarity": "negative", "fromNodeId": "ac_isolator", "fromPortId": "out_neg", "toNodeId": "main_panel", "toPortId": "in_neg", "lengthMeters": 3.9, "routeOffset": [-0.2, 0.04] },
      { "id": "base_wire_grid_panel_pos", "polarity": "positive", "fromNodeId": "grid", "fromPortId": "grid_pos", "toNodeId": "main_panel", "toPortId": "in_pos", "lengthMeters": 16.83, "routeOffset": [3.28, 0.71] },
      { "id": "base_wire_grid_panel_neg", "polarity": "negative", "fromNodeId": "grid", "fromPortId": "grid_neg", "toNodeId": "main_panel", "toPortId": "in_neg", "lengthMeters": 16.46, "routeOffset": [2.5, 0.58] },
      { "id": "base_wire_panel_ats_pos", "polarity": "positive", "fromNodeId": "main_panel", "fromPortId": "out_pos", "toNodeId": "ats", "toPortId": "in_pos", "lengthMeters": 4.24, "routeOffset": [0, 0] },
      { "id": "base_wire_panel_ats_neg", "polarity": "negative", "fromNodeId": "main_panel", "fromPortId": "out_neg", "toNodeId": "ats", "toPortId": "in_neg", "lengthMeters": 4.4, "routeOffset": [-0.11, -0.02] },
      { "id": "base_wire_ats_load_pos", "polarity": "positive", "fromNodeId": "ats", "fromPortId": "out_pos", "toNodeId": "load", "toPortId": "load_pos", "lengthMeters": 6.03, "routeOffset": [0, 0] },
      { "id": "base_wire_ats_load_neg", "polarity": "negative", "fromNodeId": "ats", "fromPortId": "out_neg", "toNodeId": "load", "toPortId": "load_neg", "lengthMeters": 6.12, "routeOffset": [0, 0] },
      { "id": "base_wire_panel_gnd", "polarity": "ground", "fromNodeId": "main_panel", "fromPortId": "gnd", "toNodeId": "grounding", "toPortId": "gnd_3", "lengthMeters": 1.7, "routeOffset": [0, 0] },
      { "id": "base_wire_acspd_gnd", "polarity": "ground", "fromNodeId": "ac_spd", "fromPortId": "gnd", "toNodeId": "grounding", "toPortId": "gnd_2", "lengthMeters": 7.73, "routeOffset": [-0.37, -1.44] },
      { "id": "base_wire_dcspd_brk_pos", "polarity": "positive", "fromNodeId": "dc_spd", "fromPortId": "in_pos", "toNodeId": "dc_breaker", "toPortId": "in_pos", "lengthMeters": 1.3, "routeOffset": [0, 0] },
      { "id": "base_wire_dcspd_brk_neg", "polarity": "negative", "fromNodeId": "dc_spd", "fromPortId": "in_neg", "toNodeId": "dc_breaker", "toPortId": "in_neg", "lengthMeters": 1.49, "routeOffset": [0.02, 0.11] },
      { "id": "base_wire_dcspd_gnd", "polarity": "ground", "fromNodeId": "dc_spd", "fromPortId": "gnd", "toNodeId": "grounding", "toPortId": "gnd_1", "lengthMeters": 13.6, "routeOffset": [0.06, -1.96] },
      { "id": "base_wire_acspd_brk_pos", "polarity": "positive", "fromNodeId": "ac_spd", "fromPortId": "in_pos", "toNodeId": "ac_breaker", "toPortId": "in_pos", "lengthMeters": 1.3, "routeOffset": [0, 0] },
      { "id": "base_wire_acspd_brk_neg", "polarity": "negative", "fromNodeId": "ac_spd", "fromPortId": "in_neg", "toNodeId": "ac_breaker", "toPortId": "in_neg", "lengthMeters": 1.62, "routeOffset": [0.05, 0.17] }
    ]
  }'::jsonb
)
ON CONFLICT (template_key) DO UPDATE
SET
  layout_3d = EXCLUDED.layout_3d,
  updated_at = now();


-- ==============================================================================
-- PART 3: Sync Philippine Market Pricing on public.calculator_accessories
-- ==============================================================================

UPDATE public.calculator_accessories SET price_php = 280.00 WHERE accessory_key = 'pv_dc_breaker';
UPDATE public.calculator_accessories SET price_php = 850.00 WHERE accessory_key = 'pv_dc_isolator';
UPDATE public.calculator_accessories SET price_php = 420.00 WHERE accessory_key = 'pv_dc_spd';
UPDATE public.calculator_accessories SET price_php = 550.00 WHERE accessory_key = 'grounding';
UPDATE public.calculator_accessories SET price_php = 950.00 WHERE accessory_key = 'battery_breaker';
UPDATE public.calculator_accessories SET price_php = 220.00 WHERE accessory_key = 'ac_grid_breaker';
UPDATE public.calculator_accessories SET price_php = 650.00 WHERE accessory_key = 'ac_isolator';
UPDATE public.calculator_accessories SET price_php = 380.00 WHERE accessory_key = 'ac_spd';
UPDATE public.calculator_accessories SET price_php = 950.00 WHERE accessory_key = 'ats';
UPDATE public.calculator_accessories SET price_php = 220.00 WHERE accessory_key = 'eps_breaker';

COMMIT;
