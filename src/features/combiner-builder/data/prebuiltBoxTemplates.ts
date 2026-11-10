// src/features/combiner-builder/data/prebuiltBoxTemplates.ts
import { CombinerComponentInstance, CombinerWireConnection } from '../types';
import { CATALOG_MAP } from './combinerHardwareCatalog';
import { computeWireWaypoints } from '../utils/wireRouting3D';

const SLOT_PITCH_X = 0.082;
const RAIL_TOP_Y = 0.70;
const RAIL_MIDDLE_Y = -0.05;
const BOTTOM_PLATE_Y = -0.78;
const SIDE_BUSBAR_X = 1.18;
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

  let posX = -1.06 + railSlotIndex * SLOT_PITCH_X;
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
 * Builds Template 1: JEsolar Hybrid 2-String + 100A ATS + 160A MCCB (Enhanced Reference)
 */
export function buildTemplate1JEsolar(): PrebuiltTemplateData {
  // Top Rail: AC & ATS Section (non-overlapping slots)
  const acSpd1 = createInstance('taxnele-txsa-40', 'top_ac_spd_1', 'rail_top', 0);
  const rcbo = createInstance('taxnele-tx63le-50a', 'top_rcbo', 'rail_top', 2.4);
  const ats = createInstance('ats-100a-2p', 'top_ats', 'rail_top', 6.8);
  const acMcb1 = createInstance('taxnele-txba1-63-c50', 'top_ac_mcb_1', 'rail_top', 11.2);
  const acSpd2 = createInstance('taxnele-txsa-40', 'top_ac_spd_2', 'rail_top', 13.6);

  // Middle Rail: 2 PV Strings + Sub-Load Breakers
  const pvMcb1 = createInstance('dc-mcb-nonpolar-25a', 'mid_pv_mcb_1', 'rail_middle', 0);
  const pvSpd1 = createInstance('dc-spd-1000v-dark', 'mid_pv_spd_1', 'rail_middle', 2.5);
  const pvMcb2 = createInstance('dc-mcb-nonpolar-25a', 'mid_pv_mcb_2', 'rail_middle', 5.2);
  const pvSpd2 = createInstance('dc-spd-1000v-dark', 'mid_pv_spd_2', 'rail_middle', 7.7);
  const loadMcb1 = createInstance('chnt-2p-ac-mcb-40a', 'mid_load_mcb_1', 'rail_middle', 11.2);
  const loadMcb2 = createInstance('chnt-2p-ac-mcb-30a', 'mid_load_mcb_2', 'rail_middle', 13.6);

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
    name: 'JEsolar Hybrid 2-String + 100A ATS + 160A MCCB',
    subtitle: 'Reference Build A (Video Replica)',
    description: 'Complete 2-rail hybrid combiner box with 100A ATS (green rotary handle), 25A non-polarity DC MCBs, dark DC SPDs, battery MCCB, and PE grounding busbar.',
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
  const lcdMeter = createInstance('digital-watt-meter-100a', 'bot_lcd_meter', 'rail_middle', 6);
  const branchMcb = createInstance('abb-2p-ac-mcb-c32', 'bot_branch_mcb', 'rail_middle', 10);
  const yellowSpd = createInstance('csq-myc1-c-40ka', 'bot_yellow_spd', 'rail_middle', 13);

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

    // 3. Green 6-Pin low-voltage sensing plug to Normal & Reserve lines
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

    // 6. Distribution Block to Multi-tier Color LCD Meter
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

/**
 * Builds Template 3: Reference Single-Line Diagram Build (Combiner Box Only, Excludes Battery)
 */
export function buildTemplate3ReferenceSLD(): PrebuiltTemplateData {
  // Top Rail: Grid Input, Surge, AC Isolator, Grid VA Protector, 100A ATS, Inverter MCB & Surge
  const acMcb80 = createInstance('chnt-2p-ac-mcb-80a', 'ref_grid_mcb80', 'rail_top', 0);
  const acSpd1 = createInstance('taxnele-txsa-40', 'ref_ac_spd1', 'rail_top', 2.4);
  const acIsolator = createInstance('ac-isolator-63a', 'ref_ac_iso', 'rail_top', 4.8);
  const digiProtector1 = createInstance('digital-protector-63a', 'ref_digi_prot_1', 'rail_top', 7.2);
  const ats100 = createInstance('ats-100a-2p', 'ref_ats_100', 'rail_top', 11.6);
  const invMcb63 = createInstance('chnt-2p-ac-mcb-63a', 'ref_inv_mcb63', 'rail_top', 16.0);
  const acSpd2 = createInstance('taxnele-txsa-40', 'ref_ac_spd2', 'rail_top', 18.4);

  // Middle Rail: PV DC String Protection, Load Protector, Watt Meter & Load Sub-Breakers
  const dcSpd = createInstance('dc-spd-1000v-dark', 'ref_dc_spd', 'rail_middle', 0);
  const dcIsolator = createInstance('dc-rotary-isolator-32a', 'ref_dc_iso', 'rail_middle', 3.0);
  const dcMcb = createInstance('dc-mcb-nonpolar-25a', 'ref_dc_mcb', 'rail_middle', 6.0);
  const digiProtector2 = createInstance('digital-protector-63a', 'ref_digi_prot_2', 'rail_middle', 8.7);
  const wattMeter = createInstance('digital-watt-meter-100a', 'ref_watt_meter', 'rail_middle', 11.8);
  const loadMcb1 = createInstance('chnt-2p-ac-mcb-40a', 'ref_load_mcb1', 'rail_middle', 14.9);
  const loadMcb2 = createInstance('chnt-2p-ac-mcb-30a', 'ref_load_mcb2', 'rail_middle', 17.3);

  // Side Chassis: 5-Hole Brass PE Ground Busbar
  const peBusbar = createInstance('pe-ground-busbar-5h', 'ref_pe_busbar', 'side_busbar', 0);

  const components = [
    acMcb80,
    acSpd1,
    acIsolator,
    digiProtector1,
    ats100,
    invMcb63,
    acSpd2,
    dcSpd,
    dcIsolator,
    dcMcb,
    digiProtector2,
    wattMeter,
    loadMcb1,
    loadMcb2,
    peBusbar,
  ];

  const wires: CombinerWireConnection[] = [
    // 1. PV String DC Path: DC SPD parallel jumper -> DC Rotary Isolator -> 25A Non-Polarity DC MCB
    createWire('w3_dc_spd_to_iso_pos', dcSpd, 0, dcIsolator, 0, '#ef4444', 'red', 6, true),
    createWire('w3_dc_spd_to_iso_neg', dcSpd, 1, dcIsolator, 1, '#334155', 'black', 6, true),
    createWire('w3_dc_iso_to_mcb_pos', dcIsolator, 2, dcMcb, 0, '#ef4444', 'red', 6),
    createWire('w3_dc_iso_to_mcb_neg', dcIsolator, 3, dcMcb, 1, '#334155', 'black', 6),
    createWire('w3_dc_spd_pe', dcSpd, 2, peBusbar, 0, '#22c55e', 'green_yellow', 6),

    // 2. Grid AC Infeed: 80A Grid MCB -> AC SPD 1 (parallel) -> AC Isolator -> VA Protector 1
    createWire('w3_grid80_to_spd1_l', acMcb80, 0, acSpd1, 0, '#f97316', 'red', 16, true),
    createWire('w3_grid80_to_spd1_n', acMcb80, 1, acSpd1, 1, '#3b82f6', 'blue', 16, true),
    createWire('w3_ac_spd1_pe', acSpd1, 2, peBusbar, 1, '#22c55e', 'green_yellow', 6),
    createWire('w3_grid80_to_iso_l', acMcb80, 2, acIsolator, 0, '#f97316', 'red', 16),
    createWire('w3_grid80_to_iso_n', acMcb80, 3, acIsolator, 1, '#3b82f6', 'blue', 16),
    createWire('w3_iso_to_prot_l', acIsolator, 2, digiProtector1, 0, '#f97316', 'red', 16),
    createWire('w3_iso_to_prot_n', acIsolator, 3, digiProtector1, 1, '#3b82f6', 'blue', 16),

    // 3. Grid Protected Feed: VA Protector 1 -> 100A ATS Source B (Utility Grid)
    createWire('w3_prot_to_ats_l', digiProtector1, 2, ats100, 2, '#f97316', 'white', 25),
    createWire('w3_prot_to_ats_n', digiProtector1, 3, ats100, 3, '#3b82f6', 'blue', 25),

    // 4. Inverter Feed: 63A Inverter MCB -> AC SPD 2 (parallel) -> 100A ATS Source A (Inverter)
    createWire('w3_inv_to_spd2_l', invMcb63, 0, acSpd2, 0, '#ef4444', 'red', 16, true),
    createWire('w3_inv_to_spd2_n', invMcb63, 1, acSpd2, 1, '#3b82f6', 'blue', 16, true),
    createWire('w3_ac_spd2_pe', acSpd2, 2, peBusbar, 2, '#22c55e', 'green_yellow', 6),
    createWire('w3_inv_to_ats_l', invMcb63, 2, ats100, 0, '#ef4444', 'red', 25),
    createWire('w3_inv_to_ats_n', invMcb63, 3, ats100, 1, '#3b82f6', 'blue', 25),

    // 5. 100A ATS Voltage Sensing Jumpers
    createWire('w3_ats_sense_al', ats100, 0, ats100, 4, '#eab308', 'yellow', 1.5, true),
    createWire('w3_ats_sense_an', ats100, 1, ats100, 5, '#eab308', 'yellow', 1.5, true),
    createWire('w3_ats_sense_bl', ats100, 2, ats100, 6, '#eab308', 'yellow', 1.5, true),
    createWire('w3_ats_sense_bn', ats100, 3, ats100, 7, '#eab308', 'yellow', 1.5, true),

    // 6. ATS Common Load Output -> VA Protector 2 -> Watt Meter -> 40A & 30A Sub-Load MCBs
    createWire('w3_ats_to_prot2_l', ats100, 8, digiProtector2, 0, '#ef4444', 'red', 25),
    createWire('w3_ats_to_prot2_n', ats100, 9, digiProtector2, 1, '#3b82f6', 'blue', 25),
    createWire('w3_prot2_to_meter_l', digiProtector2, 2, wattMeter, 0, '#ef4444', 'red', 25),
    createWire('w3_prot2_to_meter_n', digiProtector2, 3, wattMeter, 1, '#3b82f6', 'blue', 25),
    createWire('w3_meter_to_load1_l', wattMeter, 2, loadMcb1, 0, '#ef4444', 'white', 25),
    createWire('w3_meter_to_load1_n', wattMeter, 3, loadMcb1, 1, '#3b82f6', 'blue', 25),
    createWire('w3_load1_to_load2_l', loadMcb1, 0, loadMcb2, 0, '#ef4444', 'white', 10, true),
    createWire('w3_load1_to_load2_n', loadMcb1, 1, loadMcb2, 1, '#3b82f6', 'blue', 10, true),
  ];

  return {
    id: 'template_reference_diagram',
    name: 'Reference SLD Combiner Box (100A ATS, No Battery)',
    subtitle: 'Reference Diagram Replica (Photo-Matched)',
    description: 'Pure solar & AC combiner box matching the single-line reference diagram: 100A ATS, 80A/63A/40A/30A CHNT MCBs, 25A non-polarity DC MCB, DC rotary isolator, AC isolator, VA protectors, watt meter, and DC/AC SPDs.',
    components,
    wires,
  };
}

export const PREBUILT_TEMPLATES: PrebuiltTemplateData[] = [
  buildTemplate1JEsolar(),
  buildTemplate2MTC(),
  buildTemplate3ReferenceSLD(),
];
