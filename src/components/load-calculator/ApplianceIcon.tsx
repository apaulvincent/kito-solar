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

export const KitoApplianceGradientDefs: React.FC = () => (
  <svg width="0" height="0" className="absolute -z-10 pointer-events-none opacity-0" aria-hidden="true">
    <defs>
      <linearGradient id="kito-appliance-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="35%" stopColor="#EA580C" />
        <stop offset="70%" stopColor="#9333EA" />
        <stop offset="100%" stopColor="#4F46E5" />
      </linearGradient>
      <linearGradient id="kito-appliance-gradient-h" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="40%" stopColor="#EA580C" />
        <stop offset="70%" stopColor="#9333EA" />
        <stop offset="100%" stopColor="#4F46E5" />
      </linearGradient>
    </defs>
  </svg>
);

interface Props {
  presetId?: string;
  category?: ApplianceCategory;
  name?: string;
  className?: string;
  strokeWidth?: number;
  useGradient?: boolean;
}

export const ApplianceIcon: React.FC<Props> = ({
  presetId,
  category,
  name = '',
  className = 'w-6 h-6',
  strokeWidth = 2,
  useGradient = true,
}) => {
  const normName = name.toLowerCase();
  const strokeColor = useGradient ? 'url(#kito-appliance-gradient)' : 'currentColor';
  const iconProps = {
    className,
    strokeWidth,
    stroke: strokeColor,
    color: strokeColor,
  };

  // 1. Direct Preset Mapping
  if (presetId) {
    switch (presetId) {
      case 'ac_split_1hp_inverter':
      case 'ac_window_1hp_non_inverter':
      case 'ac_split_1_5hp_inverter':
        return <AirVent {...iconProps} />;
      case 'fan_ceiling_stand_std':
      case 'fan_dc_inverter':
        return <Fan {...iconProps} />;
      case 'fridge_inverter_2door':
      case 'fridge_standard_non_inverter':
        return <Refrigerator {...iconProps} />;
      case 'rice_cooker_std':
        return <CookingPot {...iconProps} />;
      case 'microwave_oven':
        return <Microwave {...iconProps} />;
      case 'induction_cooker_1burner':
        return <Disc3 {...iconProps} />;
      case 'electric_kettle_airfryer':
        return <Coffee {...iconProps} />;
      case 'pc_gaming_workstation':
        return <MonitorPc {...iconProps} />;
      case 'laptop_monitor_setup':
        return <Laptop {...iconProps} />;
      case 'wifi_router_modem':
        return <Router {...iconProps} />;
      case 'tv_led_smart_55':
        return <Tv {...iconProps} />;
      case 'led_bulb_10w':
        return <Lightbulb {...iconProps} />;
      case 'water_pump_jet_0_5hp':
        return <Gauge {...iconProps} />;
      case 'water_pump_submersible_1hp':
        return <Waves {...iconProps} />;
      case 'washing_machine_inverter':
        return <WashingMachine {...iconProps} />;
    }
  }

  // 2. Name-based Keyword Matching (for Custom Appliances)
  if (normName.includes('ac') || normName.includes('aircon') || normName.includes('air condition')) {
    return <AirVent {...iconProps} />;
  }
  if (normName.includes('fan')) {
    return <Fan {...iconProps} />;
  }
  if (normName.includes('fridge') || normName.includes('refrigerator') || normName.includes('freezer')) {
    return <Refrigerator {...iconProps} />;
  }
  if (normName.includes('cooker') || normName.includes('pot') || normName.includes('stove')) {
    return <CookingPot {...iconProps} />;
  }
  if (normName.includes('microwave') || normName.includes('oven')) {
    return <Microwave {...iconProps} />;
  }
  if (normName.includes('kettle') || normName.includes('coffee') || normName.includes('fryer')) {
    return <Coffee {...iconProps} />;
  }
  if (normName.includes('pc') || normName.includes('computer') || normName.includes('desktop')) {
    return <MonitorPc {...iconProps} />;
  }
  if (normName.includes('laptop') || normName.includes('notebook')) {
    return <Laptop {...iconProps} />;
  }
  if (normName.includes('wifi') || normName.includes('router') || normName.includes('modem')) {
    return <Router {...iconProps} />;
  }
  if (normName.includes('tv') || normName.includes('television') || normName.includes('display')) {
    return <Tv {...iconProps} />;
  }
  if (normName.includes('light') || normName.includes('bulb') || normName.includes('lamp')) {
    return <Lightbulb {...iconProps} />;
  }
  if (normName.includes('pump') || normName.includes('well') || normName.includes('water')) {
    return <Droplets {...iconProps} />;
  }
  if (normName.includes('wash') || normName.includes('laundry')) {
    return <WashingMachine {...iconProps} />;
  }

  // 3. Fallback to Category
  switch (category) {
    case 'cooling':
      return <AirVent {...iconProps} />;
    case 'kitchen':
      return <CookingPot {...iconProps} />;
    case 'work_tech':
      return <Cpu {...iconProps} />;
    case 'lighting_utility':
      return <Lightbulb {...iconProps} />;
    default:
      return <Zap {...iconProps} />;
  }
};
