import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  PDF_COLORS,
  PDF_MARGIN_X,
  PDF_PAGE_WIDTH,
  addPdfPageFooters,
  getLastAutoTableFinalY,
  setPdfDrawColor,
  setPdfTextColor,
} from '@/lib/pdfLayoutUtils';
import {
  FinancialConfig,
  ScenarioSimulationResult,
  SystemSizingInput,
} from '../types/financialRoi';
import { CAPEX_BENCHMARKS, UTILITY_PRESETS } from './utilityTariffPresets';

export interface FinancialPdfParams {
  activeSim: ScenarioSimulationResult;
  allScenarios: Record<string, ScenarioSimulationResult>;
  config: FinancialConfig;
  sizingInput: SystemSizingInput;
  userEmail?: string;
  userName?: string;
}

export function generateFinancialProposalPdf({
  activeSim,
  allScenarios,
  config,
  sizingInput,
  userEmail,
  userName,
}: FinancialPdfParams): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const horizonYears = CAPEX_BENCHMARKS.simulationHorizonYears;
  const utility = UTILITY_PRESETS.find((u) => u.id === config.selectedUtilityId);
  const utilityName = utility?.name || 'Philippine Utility Grid';
  const retainedFactor = Math.pow(
    1 - config.annualPanelDegradationPercent / 100,
    horizonYears - 1
  );

  let currentY = 22;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  setPdfTextColor(doc, PDF_COLORS.slate900);
  doc.text('KITO SOLAR', PDF_MARGIN_X, currentY);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  setPdfTextColor(doc, PDF_COLORS.slate500);
  doc.text(
    `FINANCIAL ROI, TARIFF & ${horizonYears}-YEAR CASHFLOW PROJECTION`,
    PDF_MARGIN_X,
    currentY + 5.5
  );

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  doc.text(`Date: ${dateStr}`, PDF_PAGE_WIDTH - PDF_MARGIN_X, currentY, { align: 'right' });
  if (userName || userEmail) {
    doc.text(`Prepared for: ${userName || userEmail}`, PDF_PAGE_WIDTH - PDF_MARGIN_X, currentY + 4.5, {
      align: 'right',
    });
  }

  currentY += 12;
  setPdfDrawColor(doc, PDF_COLORS.line);
  doc.setLineWidth(0.3);
  doc.line(PDF_MARGIN_X, currentY, PDF_PAGE_WIDTH - PDF_MARGIN_X, currentY);
  currentY += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setPdfTextColor(doc, PDF_COLORS.slate900);
  doc.text('1. SIZING & TARIFF ASSUMPTIONS', PDF_MARGIN_X, currentY);
  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    head: [['PARAMETER', 'MODEL VALUE', 'TECHNICAL NOTES']],
    body: [
      ['Distribution Utility', utilityName, 'Local retail electric supplier'],
      ['Retail Tariff (Year 1)', `PHP ${config.retailRatePhp.toFixed(2)} / kWh`, 'Full retail rate offset by daytime solar'],
      ['ERC Export Credit Rate', `PHP ${config.exportCreditRatePhp.toFixed(2)} / kWh`, 'Blended generation charge for surplus exports'],
      ['Annual Tariff Inflation', `${config.annualTariffInflationPercent.toFixed(1)}% per year`, 'Historical Philippine utility compounding'],
      [
        'Annual Panel Degradation',
        `${config.annualPanelDegradationPercent.toFixed(2)}% per year`,
        `Year ${horizonYears} output remains ~${(retainedFactor * 100).toFixed(1)}% of Year 1`,
      ],
      ['Solar PV Sizing Basis', `${sizingInput.pvKwp} kWp PV / ${sizingInput.inverterKw} kW Inverter`, `${sizingInput.dailyTotalKwh.toFixed(1)} kWh/day total consumption`],
    ],
    theme: 'plain',
    headStyles: { textColor: [100, 116, 139], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { textColor: [51, 65, 85], fontSize: 8.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 45 },
      2: { textColor: [100, 116, 139] },
    },
    margin: { left: PDF_MARGIN_X, right: PDF_MARGIN_X },
  });

  currentY = getLastAutoTableFinalY(doc) + 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setPdfTextColor(doc, PDF_COLORS.slate900);
  doc.text('2. ARCHITECTURE FINANCIAL COMPARISON', PDF_MARGIN_X, currentY);
  currentY += 5;

  const comparisonRows = (
    [
      ['Grid-Tie + Zero-Export', allScenarios.zero_export],
      ['Grid-Tie + Net Metering', allScenarios.net_metering],
      ['Hybrid + LiFePO4 Battery', allScenarios.hybrid_battery],
    ] as const
  ).map(([title, sim]) => [
    title,
    `PHP ${sim?.initialCapexPhp.toLocaleString() || '0'}`,
    `PHP ${sim?.year1MonthlySavingsPhp.toLocaleString() || '0'}/mo`,
    sim?.paybackFormatted || '-',
    `PHP ${sim?.netProfit10YearsPhp.toLocaleString() || '0'}`,
    `PHP ${sim?.lcoePhpPerKwh.toFixed(2) || '0'}/kWh`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['ARCHITECTURE', 'INITIAL CAPEX', 'YEAR 1 SAVINGS', 'BREAKEVEN', `${horizonYears}-YR PROFIT`, 'LCOE']],
    body: comparisonRows,
    theme: 'plain',
    headStyles: { textColor: [100, 116, 139], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { textColor: [51, 65, 85], fontSize: 8.5 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 46 },
      1: { fontStyle: 'bold' },
      2: { textColor: [5, 150, 105], fontStyle: 'bold' },
      3: { textColor: [217, 119, 6], fontStyle: 'bold' },
      4: { fontStyle: 'bold' },
      5: { textColor: [15, 23, 42] },
    },
    margin: { left: PDF_MARGIN_X, right: PDF_MARGIN_X },
  });

  currentY = getLastAutoTableFinalY(doc) + 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setPdfTextColor(doc, PDF_COLORS.slate900);
  doc.text(
    `3. ${horizonYears}-YEAR CASHFLOW PROJECTION (${activeSim.label.toUpperCase()})`,
    PDF_MARGIN_X,
    currentY
  );
  currentY += 5;

  const milestoneRows = Array.from({ length: horizonYears }, (_, idx) => {
    const yr = idx + 1;
    const pt =
      activeSim.cashflowSeries[yr] ||
      activeSim.cashflowSeries[activeSim.cashflowSeries.length - 1];
    return [
      `Year ${yr}`,
      `PHP ${pt.inflatedRetailRatePhp.toFixed(2)}/kWh`,
      `${pt.annualGenerationKwh.toLocaleString()} kWh`,
      `PHP ${pt.grossAnnualSavingsPhp.toLocaleString()}`,
      pt.replacementCostPhp > 0 ? `-PHP ${pt.replacementCostPhp.toLocaleString()}` : 'PHP 0',
      `PHP ${pt.cumulativeCashflowPhp.toLocaleString()}`,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['TIMELINE', 'TARIFF RATE', 'GENERATION', 'ANNUAL SAVINGS', 'MAINTENANCE', 'NET POSITION']],
    body: milestoneRows,
    theme: 'plain',
    headStyles: { textColor: [100, 116, 139], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { textColor: [51, 65, 85], fontSize: 8.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 26 },
      1: { textColor: [100, 116, 139] },
      2: { textColor: [51, 65, 85] },
      3: { textColor: [5, 150, 105], fontStyle: 'bold' },
      4: { textColor: [217, 119, 6] },
      5: { fontStyle: 'bold', textColor: [15, 23, 42] },
    },
    margin: { left: PDF_MARGIN_X, right: PDF_MARGIN_X },
  });

  addPdfPageFooters(
    doc,
    'KitoSolar • Solar Engineering Studio & Financial ROI Simulator',
    PDF_COLORS.slate500
  );

  return doc;
}

export function downloadFinancialProposalPdf(params: FinancialPdfParams): void {
  const doc = generateFinancialProposalPdf(params);
  const dateSlug = new Date().toISOString().split('T')[0];
  doc.save(`KitoSolar-Financial-ROI-${params.activeSim.strategy}-${dateSlug}.pdf`);
}
