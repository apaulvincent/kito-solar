// src/features/combiner-builder/data/prebuiltBoxTemplates.ts
import { CombinerComponentInstance, CombinerWireConnection } from '../types';
import { CATALOG_MAP } from './combinerHardwareCatalog';
import { computeWireWaypoints } from '../utils/wireRouting3D';

const SLOT_PITCH_X = 0.082;
const RAIL_TOP_Y = 0.62;
const RAIL_MIDDLE_Y = -0.05;
const BOTTOM_PLATE_Y = -0.72;
const SIDE_BUSBAR_X = 1.08;
const SIDE_BUSBAR_Y = 0.0;

export interface PrebuiltTemplateData {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  components: CombinerComponentInstance[];
  wires: CombinerWireConnection[];
}

function createInstance(
  catalogId: string,
  instanceId: string,
  mountZone: CombinerComponentInstance['mountZone'],
  railSlotIndex: number,
  customY?: number,
): CombinerComponentInstance {
  const item = CATALOG_MAP.get(catalogId);
  if (!item) throw new Error(`Unknown catalog ID: ${catalogId}`);

  let posX = -0.98 + railSlotIndex * SLOT_PITCH_X;
  let posY =
    mountZone === 'rail_top'
      ? RAIL_TOP_Y
      : mountZone === 'rail_middle'
      ? RAIL_MIDDLE_Y
      : mountZone === 'bottom_plate'
      ? (customY ?? BOTTOM_PLATE_Y)
      : SIDE_BUSBAR_Y;
  let posZ = 0.05;

  if (mountZone === 'bottom_plate') {
    posX = 0.0;
    posY = customY ?? BOTTOM_PLATE_Y;
    posZ = 0.08;
  } else if (mountZone === 'side_busbar') {
    posX = SIDE_BUSBAR_X;
    posY = SIDE_BUSBAR_Y;
    posZ = 0.05;
  }

  const ports = item.ports.map((p, idx) => ({
    ...p,
    id: `${instanceId}:p_${idx}_${p.polarity}`,
    componentId: instanceId,
  }));

  return {
    id: instanceId,
    catalogId,
    name: item.name,
    brand: item.brand,
    category: item.category,
    mountZone,
    railSlotIndex,
    position3D: [posX, posY, posZ],
    widthMm: item.widthMm,
    ratedAmps: item.ratedAmps,
    ratedVoltage: item.ratedVoltage,
    isSwitchOn: true,
    atsMode: 'auto',
    atsActiveSource: 'source_a',
    pricePhp: item.pricePhp,
    ports,
  };
}

function createWire(
  id: string,
  c1: CombinerComponentInstance,
  p1Idx: number,
  c2: CombinerComponentInstance,
  p2Idx: number,
  wireColor: string,
  ferruleColor: CombinerWireConnection['ferruleColor'],
  gaugeMm2: CombinerWireConnection['gaugeMm2'],
  isJumperLoop = false,
): CombinerWireConnection {
  const port1 = c1.ports[p1Idx];
  const port2 = c2.ports[p2Idx];

  const startPos: [number, number, number] = [
    c1.position3D[0] + port1.positionOffset[0],
    c1.position3D[1] + port1.positionOffset[1],
    c1.position3D[2] + port1.positionOffset[2],
  ];

  const endPos: [number, number, number] = [
    c2.position3D[0] + port2.positionOffset[0],
    c2.position3D[1] + port2.positionOffset[1],
    c2.position3D[2] + port2.positionOffset[2],
  ];

  const waypoints = computeWireWaypoints({
    startPos,
    startDirection: port1.entryDirection,
    endPos,
    endDirection: port2.entryDirection,
    isJumperLoop,
  });

  return {
    id,
    fromPortId: port1.id,
    toPortId: port2.id,
    wireColor,
    ferruleColor,
    gaugeMm2,
    isJumperLoop,
    waypoints3D: waypoints,
  };
}

/**
 * Builds Template 1: JEsolar Hybrid 2-String + ATS + 160A MCCB (Video Replica)
 */
export function buildTemplate1JEsolar(): PrebuiltTemplateData {
  // Top Rail: AC & ATS Section
  const acSpd1 = createInstance('taxnele-txsa-40', 'top_ac_spd_1', 'rail_top', 0);
  const rcbo = createInstance('taxnele-tx63le-50a', 'top_rcbo', 'rail_top', 3);
  const ats = createInstance('gcdqcn-gq02-63-2p', 'top_ats', 'rail_top', 6);
  const acMcb1 = createInstance('taxnele-txba1-63-c50', 'top_ac_mcb_1', 'rail_top', 13);
  const acSpd2 = createInstance('taxnele-txsa-40', 'top_ac_spd_2', 'rail_top', 16);

  // Middle Rail: 2 PV Strings + Sub-Load Breakers
  const pvMcb1 = createInstance('taxnele-txbd1-63-32a', 'mid_pv_mcb_1', 'rail_middle', 0);
  const pvSpd1 = createInstance('taxnele-txsd-60ka', 'mid_pv_spd_1', 'rail_middle', 3);
  const pvMcb2 = createInstance('taxnele-txbd1-63-32a', 'mid_pv_mcb_2', 'rail_middle', 6);
  const pvSpd2 = createInstance('taxnele-txsd-60ka', 'mid_pv_spd_2', 'rail_middle', 9);
  const loadMcb1 = createInstance('taxnele-txba1-63-c50', 'mid_load_mcb_1', 'rail_middle', 13);
  const loadMcb2 = createInstance('taxnele-txba1-63-c32', 'mid_load_mcb_2', 'rail_middle', 16);

  // Bottom Enclosure Mount: Heavy Battery MCCB
  const batteryMccb = createInstance('matsic-160a-mccb', 'bottom_battery_mccb', 'bottom_plate', 0);

  // Side Chassis: 5-Hole Brass PE Ground Busbar
  const peBusbar = createInstance('pe-ground-busbar-5h', 'side_pe_busbar', 'side_busbar', 0);

  const components = [
    acSpd1,
    rcbo,
    ats,
    acMcb1,
    acSpd2,
    pvMcb1,
    pvSpd1,
    pvMcb2,
    pvSpd2,
    loadMcb1,
    loadMcb2,
    batteryMccb,
    peBusbar,
  ];

  // Pre-wired connections
  const wires: CombinerWireConnection[] = [
    // 1. PV String 1 MCB to SPD parallel jumper loops
    createWire('w_pv1_pos_jumper', pvMcb1, 0, pvSpd1, 0, '#ef4444', 'red', 6, true),
    createWire('w_pv1_neg_jumper', pvMcb1, 1, pvSpd1, 1, '#1e293b', 'black', 6, true),

    // 2. PV String 2 MCB to SPD parallel jumper loops
    createWire('w_pv2_pos_jumper', pvMcb2, 0, pvSpd2, 0, '#ef4444', 'red', 6, true),
    createWire('w_pv2_neg_jumper', pvMcb2, 1, pvSpd2, 1, '#1e293b', 'black', 6, true),

    // 3. DC SPDs to Brass PE Ground Busbar
    createWire('w_pv_spd1_pe', pvSpd1, 2, peBusbar, 0, '#22c55e', 'green_yellow', 6),
    createWire('w_pv_spd2_pe', pvSpd2, 2, peBusbar, 1, '#22c55e', 'green_yellow', 6),

    // 4. AC Top Rail: RCBO to ATS Source B (Grid In)
    createWire('w_rcbo_to_ats_l', rcbo, 2, ats, 2, '#ef4444', 'white', 10),
    createWire('w_rcbo_to_ats_n', rcbo, 3, ats, 3, '#3b82f6', 'blue', 10),

    // 5. Inverter AC MCB to ATS Source A (Inverter In)
    createWire('w_inverter_to_ats_l', acMcb1, 2, ats, 0, '#ef4444', 'white', 10),
    createWire('w_inverter_to_ats_n', acMcb1, 3, ats, 1, '#3b82f6', 'blue', 10),

    // 6. ATS Voltage Sensing jumpers (Yellow 1.5mm² control wires with yellow ferrules)
    createWire('w_ats_sense_al', ats, 0, ats, 4, '#eab308', 'yellow', 1.5, true),
    createWire('w_ats_sense_an', ats, 1, ats, 5, '#eab308', 'yellow', 1.5, true),
    createWire('w_ats_sense_bl', ats, 2, ats, 6, '#eab308', 'yellow', 1.5, true),
    createWire('w_ats_sense_bn', ats, 3, ats, 7, '#eab308', 'yellow', 1.5, true),

    // 7. AC SPDs grounded to Brass PE Busbar
    createWire('w_ac_spd1_pe', acSpd1, 2, peBusbar, 2, '#22c55e', 'green_yellow', 6),
    createWire('w_ac_spd2_pe', acSpd2, 2, peBusbar, 3, '#22c55e', 'green_yellow', 6),

    // 8. AC MCB to adjacent AC SPD parallel jumper
    createWire('w_ac_spd1_l_jumper', rcbo, 0, acSpd1, 0, '#ef4444', 'red', 10, true),
    createWire('w_ac_spd1_n_jumper', rcbo, 1, acSpd1, 1, '#3b82f6', 'blue', 10, true),
    createWire('w_ac_spd2_l_jumper', acMcb1, 0, acSpd2, 0, '#ef4444', 'red', 10, true),
    createWire('w_ac_spd2_n_jumper', acMcb1, 1, acSpd2, 1, '#3b82f6', 'blue', 10, true),

    // 9. ATS Common Load Output feeding Load MCB
    createWire('w_ats_load_l', ats, 8, loadMcb1, 0, '#ef4444', 'white', 10),
    createWire('w_ats_load_n', ats, 9, loadMcb1, 1, '#3b82f6', 'blue', 10),
  ];

  return {
    id: 'template_jesolar_hybrid',
    name: 'JEsolar Hybrid 2-String + ATS + 160A MCCB',
    subtitle: 'Reference Build A (Video Replica)',
    description: 'Complete 2-rail hybrid combiner box with twin PV string DC SPDs, dual-power ATS, AC RCBO, battery MCCB, and PE grounding busbar.',
    components,
    wires,
  };
}

/**
 * Builds Template 2: MT SolarCell Solenoid ATS + LCD Meter (Image Replica)
 */
export function buildTemplate2MTC(): PrebuiltTemplateData {
  // Upper Rail: Solenoid ATS, Distribution Block, Load Breaker
  const backupMcb = createInstance('abb-2p-ac-mcb-c32', 'top_backup_mcb', 'rail_top', 0);
  const distBlock = createInstance('terminal-block-4p', 'top_dist_block', 'rail_top', 3);
  const solenoidAts = createInstance('mtc-mtq3-100-2p', 'top_solenoid_ats', 'rail_top', 8);

  // Lower Rail: Grid RCBO, Inverter MCB, Smart LCD Meter, Sub MCB, CSQ Yellow SPD
  const gridRcbo = createInstance('mtc-2p-rcbo-32a', 'bot_grid_rcbo', 'rail_middle', 0);
  const inverterMcb = createInstance('abb-2p-ac-mcb-c32', 'bot_inverter_mcb', 'rail_middle', 3);
  const lcdMeter = createInstance('taxnele-din-meter', 'bot_lcd_meter', 'rail_middle', 6);
  const branchMcb = createInstance('abb-2p-ac-mcb-c32', 'bot_branch_mcb', 'rail_middle', 9);
  const yellowSpd = createInstance('csq-myc1-c-40ka', 'bot_yellow_spd', 'rail_middle', 12);

  // Side Chassis: Brass PE Busbar
  const peBusbar = createInstance('pe-ground-busbar-5h', 'side_pe_busbar_2', 'side_busbar', 0);

  const components = [
    backupMcb,
    distBlock,
    solenoidAts,
    gridRcbo,
    inverterMcb,
    lcdMeter,
    branchMcb,
    yellowSpd,
    peBusbar,
  ];

  const wires: CombinerWireConnection[] = [
    // 1. Grid RCBO to Solenoid ATS Reserve (RL / RN)
    createWire('w2_grid_to_ats_l', gridRcbo, 2, solenoidAts, 2, '#ef4444', 'white', 10),
    createWire('w2_grid_to_ats_n', gridRcbo, 3, solenoidAts, 3, '#3b82f6', 'blue', 10),

    // 2. Inverter MCB to Solenoid ATS Normal (NL / NN)
    createWire('w2_inv_to_ats_l', inverterMcb, 2, solenoidAts, 0, '#ef4444', 'white', 10),
    createWire('w2_inv_to_ats_n', inverterMcb, 3, solenoidAts, 1, '#3b82f6', 'blue', 10),

    // 3. Green 6-Pin low-voltage sensing plug to Normal & Reserve lines (Yellow control wires with yellow ferrules)
    createWire('w2_sense_nl', solenoidAts, 0, solenoidAts, 6, '#eab308', 'yellow', 1.5, true),
    createWire('w2_sense_nn', solenoidAts, 1, solenoidAts, 7, '#eab308', 'yellow', 1.5, true),
    createWire('w2_sense_rl', solenoidAts, 2, solenoidAts, 8, '#eab308', 'yellow', 1.5, true),
    createWire('w2_sense_rn', solenoidAts, 3, solenoidAts, 9, '#eab308', 'yellow', 1.5, true),

    // 4. ATS Load Output to 4-Pole Distribution Junction Block
    createWire('w2_ats_load_l', solenoidAts, 4, distBlock, 0, '#ef4444', 'red', 16),
    createWire('w2_ats_load_n', solenoidAts, 5, distBlock, 2, '#3b82f6', 'blue', 16),

    // 5. Distribution Block to Backup MCB
    createWire('w2_dist_to_backup_l', distBlock, 4, backupMcb, 0, '#ef4444', 'white', 6),
    createWire('w2_dist_to_backup_n', distBlock, 6, backupMcb, 1, '#3b82f6', 'blue', 6),

    // 6. Distribution Block to LCD Smart Meter
    createWire('w2_dist_to_meter_l', distBlock, 5, lcdMeter, 0, '#ef4444', 'white', 10),
    createWire('w2_dist_to_meter_n', distBlock, 7, lcdMeter, 1, '#3b82f6', 'blue', 10),

    // 7. LCD Meter to Branch MCB
    createWire('w2_meter_to_branch_l', lcdMeter, 2, branchMcb, 0, '#ef4444', 'white', 10),
    createWire('w2_meter_to_branch_n', lcdMeter, 3, branchMcb, 1, '#3b82f6', 'blue', 10),

    // 8. Branch MCB to Yellow AC SPD parallel jumper
    createWire('w2_branch_to_spd_l', branchMcb, 0, yellowSpd, 0, '#ef4444', 'red', 10, true),
    createWire('w2_branch_to_spd_n', branchMcb, 1, yellowSpd, 1, '#3b82f6', 'blue', 10, true),

    // 9. Yellow AC SPD bottom PE terminal to Brass Busbar
    createWire('w2_yellow_spd_pe', yellowSpd, 2, peBusbar, 0, '#22c55e', 'green_yellow', 6),
  ];

  return {
    id: 'template_mt_solarcell',
    name: 'MT SolarCell Solenoid ATS + LCD Meter',
    subtitle: 'Reference Build B (Image Replica)',
    description: 'Industrial solenoid ATS panel with 4-pole distribution block, DIN LCD energy meter, grid RCBO, and yellow modular AC SPD.',
    components,
    wires,
  };
}

export const PREBUILT_TEMPLATES: PrebuiltTemplateData[] = [
  buildTemplate1JEsolar(),
  buildTemplate2MTC(),
];
