// src/engine/calculateMounting.ts
import { MountingCalculationResult, MountingItem } from '@/types/calculator';

export function calculateMounting(
  panelCount: number,
  stringCount: number = 2
): MountingCalculationResult {
  const N = Math.max(1, panelCount);
  const rows = Math.min(N, Math.max(1, stringCount));

  // 1. End-clamps: 4 per independent panel row (2 rails × 2 outer edges)
  const totalEndClamps = rows * 4;

  // 2. Mid-clamps: 2 clamps per internal gap between panels
  const totalMidClamps = Math.max(0, 2 * (N - rows));

  // 3. 2.2m Roof Rails: Standard 550W+ module is ~1.134m wide. 
  // Dual rails (top and bottom) per row = 2.27m of rail per module width.
  // Total rail segments of 2.2m length:
  const totalRails = Math.max(2, Math.ceil((N * 1.134 * 2) / 2.2));

  // 4. Rail Splices: Joins between adjacent rail pieces along each rail run
  const totalSplices = Math.max(0, totalRails - (rows * 2));

  // 5. L-Feet Roof Brackets: Spaced every 1.0–1.2m along each rail run
  const totalLFeet = Math.max(4, Math.round(totalRails * 2.5));

  // 6. MC4 Male/Female Connectors: String homerun connections (positive + negative) plus junction jumpers
  const totalMc4Pairs = Math.max(2, stringCount * 2);

  const items: MountingItem[] = [
    {
      key: 'roof_rail',
      name: '2.2 m Anodized Aluminum Roof Rail',
      quantity: totalRails,
      unit: 'pcs',
      specification: '2200 mm length, 6005-T5 high-tensile structural aluminum alloy',
      explanation: 'Provides structural mounting beams running horizontally across roof purlins beneath panel rows.',
      calculationBasis: `Sized for ${N} modules (dual rails @ 1.13 m module width = ${(N * 1.134 * 2).toFixed(1)} m total rail run / 2.2 m per rail piece).`,
      imagePath: '/assets/accessories/roof-rail.webp',
    },
    {
      key: 'l_foot',
      name: 'Stainless/Aluminum L-Foot Bracket',
      quantity: totalLFeet,
      unit: 'pcs',
      specification: '84 × 40 × 40 mm with EPDM waterproof rubber isolation pad and M8 hardware',
      explanation: 'Secures aluminum rails to metal roofing purlins or wood rafters with weather-sealed penetration.',
      calculationBasis: `Calculated at ~1.0 m to 1.2 m rafter span intervals across ${totalRails} rail segments.`,
      imagePath: '/assets/accessories/l-foot.webp',
    },
    {
      key: 'mid_clamp',
      name: 'Solar Module Mid-Clamp Assembly',
      quantity: totalMidClamps,
      unit: 'pcs',
      specification: '30–40 mm adjustable clamp with grounded star washer and hex socket bolt',
      explanation: 'Securely binds adjacent solar module frames together against wind lift and thermal movement.',
      calculationBasis: `2 clamps per internal module interface across ${rows} array rows (2 × (${N} - ${rows})).`,
      imagePath: '/assets/accessories/mid-clamp.webp',
    },
    {
      key: 'end_clamp',
      name: 'Solar Module End-Clamp Assembly',
      quantity: totalEndClamps,
      unit: 'pcs',
      specification: '30–40 mm anodized clamp matching solar module frame profile',
      explanation: 'Terminates and firmly locks the outer module frames at the start and finish of each rail row.',
      calculationBasis: `4 end-clamps per row (2 top + 2 bottom outer rail ends) × ${rows} active rows.`,
      imagePath: '/assets/accessories/end-clamp.webp',
    },
    {
      key: 'rail_splice',
      name: 'Aluminum Rail Splice Connector Kit',
      quantity: totalSplices,
      unit: 'pcs',
      specification: '150 mm internal slide-in splice bar with self-tapping fasteners',
      explanation: 'Bridges abutting 2.2 m rail sections into unified structural lengths.',
      calculationBasis: `Provides mechanical continuity for ${totalRails} rail segments spanning ${rows} continuous rows.`,
      imagePath: '/assets/accessories/rail-splice.webp',
    },
    {
      key: 'mc4',
      name: 'MC4 Solar Cable Connectors (Male + Female)',
      quantity: totalMc4Pairs,
      unit: 'pairs',
      specification: 'IP68 waterproof, 1000–1500 V DC, 30–80 A rated with snap-in lock',
      explanation: 'Low-resistance, weatherproof string homerun terminations connecting PV strings to DC disconnect.',
      calculationBasis: `2 connector pairs per string circuit (${stringCount} strings) for positive and negative homerun leads.`,
      imagePath: '/assets/accessories/mc4.webp',
    },
  ];

  return {
    items,
    panelCount: N,
    totalRails,
    totalLFeet,
    totalMidClamps,
    totalSplices,
    totalMc4Pairs,
    totalEndClamps,
  };
}
