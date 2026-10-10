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

  // 6. Grounding Lugs & Rail Bonding Jumpers: 2 grounding lugs per panel row + 1 jumper per splice
  const totalGroundingLugs = Math.max(2, rows * 2);
  const totalBondingJumpers = totalSplices;

  // 7. MC4 Connectors tally preserved for electrical stringing integration
  const totalMc4Pairs = Math.max(2, stringCount * 2);

  const items: MountingItem[] = [
    {
      key: 'roof_rail',
      name: '2.2 m Anodized Aluminum Roof Rail',
      quantity: totalRails,
      unit: 'pcs',
      specification: '2200 mm length, 6005-T5 high-tensile structural aluminum alloy, 40×28 mm profile',
      explanation: 'Provides structural mounting beams running horizontally across roof purlins beneath panel rows.',
      calculationBasis: `Sized for ${N} modules (dual rails @ 1.13 m module width = ${(N * 1.134 * 2).toFixed(1)} m total rail run / 2.2 m per rail piece).`,
      imagePath: '/assets/accessories/roof-rail.svg',
      material: 'Alloy 6005-T5 Anodized Aluminum',
      finish: 'Clear Anodized (10–15 µm)',
      standards: ['UL 2703', 'AS/NZS 1170.2', 'Eurocode 9'],
      dimensions: {
        lengthMm: 2200,
        widthMm: 28,
        heightMm: 40,
        thicknessMm: 1.3,
        fastenerSpec: 'Top M8 T-Slot, Side M8 Channel',
        torqueNm: '15–18 N·m',
      },
    },
    {
      key: 'rail_splice',
      name: 'Aluminum Rail Splice Kit with Grounding Pins',
      quantity: totalSplices,
      unit: 'pcs',
      specification: '150 mm internal slide-in bar with self-grounding stainless bonding pins and M6 fasteners',
      explanation: 'Bridges abutting 2.2 m rail sections into unified structural and electrically continuous lengths.',
      calculationBasis: `Provides mechanical continuity for ${totalRails} rail segments spanning ${rows} continuous rows.`,
      imagePath: '/assets/accessories/rail-splice.svg',
      material: 'Alloy 6005-T5 Aluminum & SS304 Pins',
      finish: 'Mill Finish / Anti-Corrosion Treated',
      standards: ['UL 2703', 'IEC 61215'],
      dimensions: {
        lengthMm: 150,
        widthMm: 22,
        heightMm: 32,
        thicknessMm: 2.0,
        fastenerSpec: '2× M6 SS304 Hex Socket Bolts + Grounding Pins',
        torqueNm: '9–12 N·m',
      },
    },
    {
      key: 'l_foot',
      name: 'L-Foot Mounting Bracket (EPDM Gasket & Lag Bolt)',
      quantity: totalLFeet,
      unit: 'pcs',
      specification: '84 × 40 × 40 mm 6005-T5 bracket with 50×40×3 mm EPDM gasket and 6.3×80 mm SS304 lag bolt',
      explanation: 'Secures aluminum rails to metal roofing purlins or wood rafters with weather-sealed penetration.',
      calculationBasis: `Calculated at ~1.0 m to 1.2 m rafter span intervals across ${totalRails} rail segments.`,
      imagePath: '/assets/accessories/l-foot.svg',
      material: 'Alloy 6005-T5 Aluminum & SS304 Fasteners',
      finish: 'Shot-blasted Anodized + EPDM UV Pad',
      standards: ['UL 2703', 'AS/NZS 1170.2'],
      dimensions: {
        lengthMm: 40,
        widthMm: 40,
        heightMm: 84,
        thicknessMm: 5.0,
        holeDiameterMm: 8.5,
        fastenerSpec: 'M8 T-Bolt to Rail, 6.3×80 mm SS304 Lag Bolt to Rafter',
        torqueNm: '15–18 N·m (M8) / 10 N·m (Lag)',
      },
    },
    {
      key: 'mid_clamp',
      name: 'Adjustable Module Mid-Clamp Assembly',
      quantity: totalMidClamps,
      unit: 'pcs',
      specification: '30–40 mm adjustable clamp with grounded star washer and M8×45 mm SS304 hex socket bolt',
      explanation: 'Securely binds adjacent solar module frames together against wind lift and thermal movement.',
      calculationBasis: `2 clamps per internal module interface across ${rows} array rows (2 × (${N} - ${rows})).`,
      imagePath: '/assets/accessories/mid-clamp.svg',
      material: 'Alloy 6005-T5 & SS304 Hardware',
      finish: 'Clear Anodized + Grounding Star Washer',
      standards: ['UL 2703 Class A', 'IEC 61730'],
      dimensions: {
        lengthMm: 40,
        widthMm: 35,
        heightMm: 28,
        thicknessMm: 3.5,
        fastenerSpec: 'M8×45 mm Hex Socket Cap Bolt + Channel Nut',
        torqueNm: '15–18 N·m',
      },
    },
    {
      key: 'end_clamp',
      name: 'Anodized Solar Module End-Clamp Assembly',
      quantity: totalEndClamps,
      unit: 'pcs',
      specification: '30–40 mm anodized clamp with channel nut and M8×30 mm SS304 hex socket bolt',
      explanation: 'Terminates and firmly locks the outer module frames at the start and finish of each rail row.',
      calculationBasis: `4 end-clamps per row (2 top + 2 bottom outer rail ends) × ${rows} active rows.`,
      imagePath: '/assets/accessories/end-clamp.svg',
      material: 'Alloy 6005-T5 & SS304 Hardware',
      finish: 'Clear Anodized',
      standards: ['UL 2703 Class A', 'IEC 61730'],
      dimensions: {
        lengthMm: 40,
        widthMm: 35,
        heightMm: 38,
        thicknessMm: 3.5,
        fastenerSpec: 'M8×30 mm Hex Socket Cap Bolt + Channel Nut',
        torqueNm: '15–18 N·m',
      },
    },
    {
      key: 'grounding_lug',
      name: 'Grounding Lugs & Rail Bonding Jumpers',
      quantity: totalGroundingLugs + totalBondingJumpers,
      unit: 'sets',
      specification: 'Tin-plated copper/aluminum lugs (14–4 AWG wire) with 150 mm braided stainless bonding jumpers',
      explanation: 'Ensures continuous equipotential bonding across all mounting rails and connects array to earth ground rod.',
      calculationBasis: `${totalGroundingLugs} grounding lugs (2 per row) + ${totalBondingJumpers} bonding jumpers across rail splices.`,
      imagePath: '/assets/accessories/grounding-lug.svg',
      material: 'Tin-plated Copper / SS304 Braided Strap',
      finish: 'Electro-tin Plated Anti-Galvanic',
      standards: ['UL 467', 'UL 2703', 'NEC 690.43'],
      dimensions: {
        lengthMm: 32,
        widthMm: 16,
        heightMm: 24,
        thicknessMm: 4.0,
        holeDiameterMm: 8.5,
        fastenerSpec: 'M8 SS304 Hex Bolt & Serrated Nut (Lug), M6 Bolt (Jumper)',
        torqueNm: '8–10 N·m (Lug wire), 15 N·m (M8 Rail bolt)',
      },
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
