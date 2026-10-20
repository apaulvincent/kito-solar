// src/components/load-calculator/ApplianceIcon.tsx
import React from 'react';
import {
  AirVent,
  Fan,
  Refrigerator,
  CookingPot,
  Microwave,
  Disc3,
  Coffee,
  MonitorPc,
  Laptop,
  Router,
  Tv,
  Lightbulb,
  Gauge,
  Waves,
  WashingMachine,
  Zap,
  Cpu,
  Droplets,
  Layers,
} from 'lucide-react';
import { ApplianceCategory } from '@/lib/applianceSizingEngine';

interface Props {
  presetId?: string;
  category?: ApplianceCategory;
  name?: string;
  className?: string;
  strokeWidth?: number;
}

export const ApplianceIcon: React.FC<Props> = ({
  presetId,
  category,
  name = '',
  className = 'w-5 h-5',
  strokeWidth = 1.75,
}) => {
  const normName = name.toLowerCase();

  // 1. Direct Preset Mapping
  if (presetId) {
    switch (presetId) {
      case 'ac_split_1hp_inverter':
      case 'ac_window_1hp_non_inverter':
      case 'ac_split_1_5hp_inverter':
        return <AirVent className={className} strokeWidth={strokeWidth} />;
      case 'fan_ceiling_stand_std':
      case 'fan_dc_inverter':
        return <Fan className={className} strokeWidth={strokeWidth} />;
      case 'fridge_inverter_2door':
      case 'fridge_standard_non_inverter':
        return <Refrigerator className={className} strokeWidth={strokeWidth} />;
      case 'rice_cooker_std':
        return <CookingPot className={className} strokeWidth={strokeWidth} />;
      case 'microwave_oven':
        return <Microwave className={className} strokeWidth={strokeWidth} />;
      case 'induction_cooker_1burner':
        return <Disc3 className={className} strokeWidth={strokeWidth} />;
      case 'electric_kettle_airfryer':
        return <Coffee className={className} strokeWidth={strokeWidth} />;
      case 'pc_gaming_workstation':
        return <MonitorPc className={className} strokeWidth={strokeWidth} />;
      case 'laptop_monitor_setup':
        return <Laptop className={className} strokeWidth={strokeWidth} />;
      case 'wifi_router_modem':
        return <Router className={className} strokeWidth={strokeWidth} />;
      case 'tv_led_smart_55':
        return <Tv className={className} strokeWidth={strokeWidth} />;
      case 'led_bulb_10w':
        return <Lightbulb className={className} strokeWidth={strokeWidth} />;
      case 'water_pump_jet_0_5hp':
        return <Gauge className={className} strokeWidth={strokeWidth} />;
      case 'water_pump_submersible_1hp':
        return <Waves className={className} strokeWidth={strokeWidth} />;
      case 'washing_machine_inverter':
        return <WashingMachine className={className} strokeWidth={strokeWidth} />;
    }
  }

  // 2. Name-based Keyword Matching (for Custom Appliances)
  if (normName.includes('ac') || normName.includes('aircon') || normName.includes('air condition')) {
    return <AirVent className={className} strokeWidth={strokeWidth} />;
  }
  if (normName.includes('fan')) {
    return <Fan className={className} strokeWidth={strokeWidth} />;
  }
  if (normName.includes('fridge') || normName.includes('refrigerator') || normName.includes('freezer')) {
    return <Refrigerator className={className} strokeWidth={strokeWidth} />;
  }
  if (normName.includes('cooker') || normName.includes('pot') || normName.includes('stove')) {
    return <CookingPot className={className} strokeWidth={strokeWidth} />;
  }
  if (normName.includes('microwave') || normName.includes('oven')) {
    return <Microwave className={className} strokeWidth={strokeWidth} />;
  }
  if (normName.includes('kettle') || normName.includes('coffee') || normName.includes('fryer')) {
    return <Coffee className={className} strokeWidth={strokeWidth} />;
  }
  if (normName.includes('pc') || normName.includes('computer') || normName.includes('desktop')) {
    return <MonitorPc className={className} strokeWidth={strokeWidth} />;
  }
  if (normName.includes('laptop') || normName.includes('notebook')) {
    return <Laptop className={className} strokeWidth={strokeWidth} />;
  }
  if (normName.includes('wifi') || normName.includes('router') || normName.includes('modem')) {
    return <Router className={className} strokeWidth={strokeWidth} />;
  }
  if (normName.includes('tv') || normName.includes('television') || normName.includes('display')) {
    return <Tv className={className} strokeWidth={strokeWidth} />;
  }
  if (normName.includes('light') || normName.includes('bulb') || normName.includes('lamp')) {
    return <Lightbulb className={className} strokeWidth={strokeWidth} />;
  }
  if (normName.includes('pump') || normName.includes('well') || normName.includes('water')) {
    return <Droplets className={className} strokeWidth={strokeWidth} />;
  }
  if (normName.includes('wash') || normName.includes('laundry')) {
    return <WashingMachine className={className} strokeWidth={strokeWidth} />;
  }

  // 3. Fallback to Category
  switch (category) {
    case 'cooling':
      return <AirVent className={className} strokeWidth={strokeWidth} />;
    case 'kitchen':
      return <CookingPot className={className} strokeWidth={strokeWidth} />;
    case 'work_tech':
      return <Cpu className={className} strokeWidth={strokeWidth} />;
    case 'lighting_utility':
      return <Lightbulb className={className} strokeWidth={strokeWidth} />;
    default:
      return <Zap className={className} strokeWidth={strokeWidth} />;
  }
};
