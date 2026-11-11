import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  SolarInverterRecord,
  SolarModuleRecord,
  BatteryRecord,
  AccessoryRecord,
} from '@/types/supabase';

import invertersSeed from '@/data/seed/solar_inverters.json';
import modulesSeed from '@/data/seed/solar_modules.json';
import batteriesSeed from '@/data/seed/batteries.json';
import accessoriesSeed from '@/data/seed/calculator_accessories.json';

export class CatalogService {
  isLive: boolean = false;

  async getInverters(): Promise<SolarInverterRecord[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('solar_inverters')
          .select('*')
          .eq('is_active', true)
          .order('brand', { ascending: true })
          .order('rated_ac_power_w', { ascending: true });

        if (!error && data && data.length > 0) {
          this.isLive = true;
          return data as SolarInverterRecord[];
        }
      } catch (err) {
        console.warn('Supabase query failed, falling back to local seed data:', err);
      }
    }
    this.isLive = false;
    return invertersSeed as SolarInverterRecord[];
  }

  async getModules(): Promise<SolarModuleRecord[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('solar_modules')
          .select('*')
          .eq('is_active', true)
          .order('brand', { ascending: true })
          .order('pv_wattage_w', { ascending: true });

        if (!error && data && data.length > 0) {
          this.isLive = true;
          return data as SolarModuleRecord[];
        }
      } catch (err) {
        console.warn('Supabase query failed, falling back to local seed data:', err);
      }
    }
    return modulesSeed as SolarModuleRecord[];
  }

  async getBatteries(): Promise<BatteryRecord[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('batteries')
          .select('*')
          .eq('is_active', true)
          .order('nominal_voltage_v', { ascending: true })
          .order('capacity_ah', { ascending: true });

        if (!error && data && data.length > 0) {
          this.isLive = true;
          return data as BatteryRecord[];
        }
      } catch (err) {
        console.warn('Supabase query failed, falling back to local seed data:', err);
      }
    }
    return batteriesSeed as BatteryRecord[];
  }

  async getAccessories(): Promise<AccessoryRecord[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('calculator_accessories')
          .select('*')
          .eq('is_active', true);

        if (!error && data && data.length > 0) {
          const seedMap = new Map(
            (accessoriesSeed as AccessoryRecord[]).map((s) => [s.accessory_key, s.price_php])
          );
          return (data as AccessoryRecord[]).map((row) => {
            const calibratedSeedPrice = seedMap.get(row.accessory_key);
            if (typeof calibratedSeedPrice === 'number') {
              return { ...row, price_php: calibratedSeedPrice };
            }
            return row;
          });
        }
      } catch (err) {
        console.warn('Supabase query failed, falling back to local seed data:', err);
      }
    }
    return accessoriesSeed as AccessoryRecord[];
  }
}

export const catalogService = new CatalogService();
