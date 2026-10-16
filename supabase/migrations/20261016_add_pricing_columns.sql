-- Migration: 20261016_add_pricing_columns.sql
-- Description: Add price_php column to catalog tables and seed initial market prices
-- Currency: Philippine Peso (PHP, ₱) with 2 decimal precision (NUMERIC(12, 2))

-- 1. Add price_php column to catalog tables (nullable, default NULL resolves to TBD in FE)
ALTER TABLE public.solar_inverters 
ADD COLUMN IF NOT EXISTS price_php NUMERIC(12, 2) DEFAULT NULL;

ALTER TABLE public.solar_modules 
ADD COLUMN IF NOT EXISTS price_php NUMERIC(12, 2) DEFAULT NULL;

ALTER TABLE public.batteries 
ADD COLUMN IF NOT EXISTS price_php NUMERIC(12, 2) DEFAULT NULL;

ALTER TABLE public.calculator_accessories 
ADD COLUMN IF NOT EXISTS price_php NUMERIC(12, 2) DEFAULT NULL;

-- 2. Add documentation comments
COMMENT ON COLUMN public.solar_inverters.price_php IS 'Estimated unit retail price in Philippine Peso (PHP), 2 decimals. NULL indicates TBD.';
COMMENT ON COLUMN public.solar_modules.price_php IS 'Estimated unit retail price in Philippine Peso (PHP), 2 decimals. NULL indicates TBD.';
COMMENT ON COLUMN public.batteries.price_php IS 'Estimated unit retail price in Philippine Peso (PHP), 2 decimals. NULL indicates TBD.';
COMMENT ON COLUMN public.calculator_accessories.price_php IS 'Estimated unit retail price in Philippine Peso (PHP), 2 decimals. NULL indicates TBD.';

-- 3. Seed benchmark market prices for accessories & switchgear
UPDATE public.calculator_accessories SET price_php = 650.00 WHERE accessory_key = 'pv_dc_breaker';
UPDATE public.calculator_accessories SET price_php = 850.00 WHERE accessory_key = 'pv_dc_wire';
UPDATE public.calculator_accessories SET price_php = 1850.00 WHERE accessory_key = 'pv_dc_isolator';
UPDATE public.calculator_accessories SET price_php = 950.00 WHERE accessory_key = 'pv_dc_spd';
UPDATE public.calculator_accessories SET price_php = 480.00 WHERE accessory_key = 'dc_conduit';
UPDATE public.calculator_accessories SET price_php = 1250.00 WHERE accessory_key = 'grounding';
UPDATE public.calculator_accessories SET price_php = 2850.00 WHERE accessory_key = 'battery_breaker';
UPDATE public.calculator_accessories SET price_php = 1950.00 WHERE accessory_key = 'battery_wire';
UPDATE public.calculator_accessories SET price_php = 750.00 WHERE accessory_key = 'ac_grid_breaker';
UPDATE public.calculator_accessories SET price_php = 980.00 WHERE accessory_key = 'ac_wire';
UPDATE public.calculator_accessories SET price_php = 1450.00 WHERE accessory_key = 'ac_isolator';
UPDATE public.calculator_accessories SET price_php = 1150.00 WHERE accessory_key = 'ac_spd';
UPDATE public.calculator_accessories SET price_php = 4200.00 WHERE accessory_key = 'ats';
UPDATE public.calculator_accessories SET price_php = 650.00 WHERE accessory_key = 'eps_breaker';
UPDATE public.calculator_accessories SET price_php = 450.00 WHERE accessory_key = 'roof_rail';
UPDATE public.calculator_accessories SET price_php = 95.00 WHERE accessory_key = 'l_foot';
UPDATE public.calculator_accessories SET price_php = 45.00 WHERE accessory_key = 'mid_clamp';
UPDATE public.calculator_accessories SET price_php = 120.00 WHERE accessory_key = 'splice';
UPDATE public.calculator_accessories SET price_php = 65.00 WHERE accessory_key = 'mc4';
UPDATE public.calculator_accessories SET price_php = 45.00 WHERE accessory_key = 'end_clamp';
UPDATE public.calculator_accessories SET price_php = 180.00 WHERE accessory_key = 'grounding_lug';

-- 4. Seed benchmark popular inverters (leave unpriced inverters as NULL to display TBD)
UPDATE public.solar_inverters SET price_php = 88000.00 WHERE model = 'SUN-6K-SG05LP1-EU';
UPDATE public.solar_inverters SET price_php = 82000.00 WHERE model = 'SUN-5K-SG04LP3-EU';
UPDATE public.solar_inverters SET price_php = 89500.00 WHERE model = 'SUN-6K-SG04LP3-EU';

-- 5. Seed benchmark modules
UPDATE public.solar_modules SET price_php = 5100.00 WHERE model = 'AIKO-M-500';
UPDATE public.solar_modules SET price_php = 5600.00 WHERE model = 'AIKO-M-550';
UPDATE public.solar_modules SET price_php = 6840.00 WHERE model = 'Vertex N 720W';

-- 6. Seed benchmark batteries
UPDATE public.batteries SET price_php = 115000.00 WHERE model = '51.2V-200 Ah';
UPDATE public.batteries SET price_php = 62500.00 WHERE model = '51.2V-100 Ah';
UPDATE public.batteries SET price_php = 14500.00 WHERE model = '12V-100 Ah';
