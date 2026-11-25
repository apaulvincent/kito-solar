import { SystemCalculationResult } from '@/types/calculator';
import { calculateCarbonOffset } from '@/engine/carbonOffset';

/**
 * Escapes an individual field according to RFC 4180 rules:
 * - If value contains a comma, double quote, or newline, wraps in double quotes
 * - Doubles any inner double quotes
 */
export function escapeCsvField(field: string | number | null | undefined): string {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates an RFC 4180 compliant CSV string representing the full Bill of Materials (BOM)
 * and technical financial summary for the current solar PV design.
 */
export function generateBomCsv(
  result: SystemCalculationResult,
  projectName = 'Kito Solar Project'
): string {
  const { costSummary, summary, systemType } = result;
  const isHybrid = systemType === 'hybrid';
  const topologyLabel = isHybrid ? 'Hybrid Solar Storage' : 'Grid-Tied Solar PV';

  const rows: string[][] = [
    ['KITO SOLAR - BILL OF MATERIALS (BOM) & FINANCIAL SCHEDULE'],
    ['Project Name', projectName],
    ['System Architecture', topologyLabel],
    ['Standards Reference', 'Philippine Electrical Code (PEC 2017)'],
    ['Generated Via', 'Kito Solar (https://kitosolar.pvdeo.com)'],
    ['Export Date', new Date().toISOString().split('T')[0]],
    [],
    ['LINE ITEM SPECIFICATIONS'],
    [
      'Category',
      'Item Description',
      'Quantity',
      'Unit',
      'Unit Price (PHP)',
      'Total Price (PHP)',
      'Status',
    ],
  ];

  for (const item of costSummary.items) {
    const categoryLabel = item.category.charAt(0).toUpperCase() + item.category.slice(1);
    const unitPrice =
      item.unitPricePhp !== null && item.unitPricePhp !== undefined
        ? item.unitPricePhp.toFixed(2)
        : 'TBD';
    const totalPrice =
      item.totalPricePhp !== null && item.totalPricePhp !== undefined
        ? item.totalPricePhp.toFixed(2)
        : 'TBD';
    const status = item.isTbd ? 'TBD' : item.isCustomPrice ? 'Custom Price' : 'Standard Pricing';

    rows.push([
      categoryLabel,
      item.name,
      String(item.quantity),
      item.unit,
      unitPrice,
      totalPrice,
      status,
    ]);
  }

  rows.push([]);
  rows.push(['DISCIPLINE SUB-TOTALS & ESTIMATED TOTAL']);
  rows.push(['Discipline', 'Subtotal (PHP)', 'Notes']);
  rows.push([
    'Major Equipment (Panels, Inverter, Battery)',
    costSummary.equipmentSubtotalPhp.toFixed(2),
    `${summary.totalPanels} panels (${summary.totalArrayPowerKw} kWp), ${summary.inverterModel}`,
  ]);
  rows.push([
    'Roof Mounting & Structural Hardware',
    costSummary.mountingSubtotalPhp.toFixed(2),
    'AL6005-T5 Aluminum Railing & SUS304 Hardware',
  ]);
  rows.push([
    'Switchgear, Protection & Cabling',
    costSummary.switchgearSubtotalPhp.toFixed(2),
    'DC/AC Breakers, SPDs, Isolators, Solar Cable, THHN',
  ]);

  if (costSummary.custom3dSummary && costSummary.custom3dSummary.addedSubtotalPhp > 0) {
    rows.push([
      'Custom 3D CAD Additions',
      costSummary.custom3dSummary.addedSubtotalPhp.toFixed(2),
      `+${costSummary.custom3dSummary.totalAddedComponents} units, ${costSummary.custom3dSummary.totalWireCount} wires`,
    ]);
  }

  rows.push([
    'Grand Total Investment',
    costSummary.grandTotalPhp.toFixed(2),
    costSummary.isFullyEstimated ? 'Fully Estimated' : `Includes ${costSummary.tbdItemCount} TBD item(s)`,
  ]);

  const carbon = calculateCarbonOffset({
    totalArrayPowerKw: summary.totalArrayPowerKw,
  });

  rows.push([]);
  rows.push(['ENVIRONMENTAL & CARBON OFFSET METRICS (PHILIPPINE DOE GEF 0.7122 kg CO2/kWh)']);
  rows.push(['Metric', 'Value', 'Unit / Basis']);
  rows.push(['Annual Clean Energy Yield', String(carbon.annualGenerationKwh), 'kWh/year']);
  rows.push(['Annual CO2 Avoided', String(carbon.annualCo2AvoidedTons), 'Metric Tons CO2e/year']);
  rows.push(['Lifetime (25-Yr) CO2 Avoided', String(carbon.lifetimeCo2AvoidedTons), 'Metric Tons CO2e']);
  rows.push(['Equivalent Trees Seedlings Grown 10-Yr', String(carbon.treesSeedlingsGrown10Yr), 'Trees']);
  rows.push(['Fossil Fuel Coal Avoided', String(carbon.coalAvoidedMetricTons), 'Metric Tons coal']);

  return rows.map((row) => row.map(escapeCsvField).join(',')).join('\r\n');
}

/**
 * Triggers a browser download of the Bill of Materials CSV with UTF-8 BOM encoding.
 */
export function downloadBomCsv(
  result: SystemCalculationResult,
  projectName = 'Kito Solar Project'
): void {
  if (typeof window === 'undefined') return;

  const csvContent = generateBomCsv(result, projectName);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const safeSlug =
    projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'project';
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${safeSlug}-bom-${dateStr}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
