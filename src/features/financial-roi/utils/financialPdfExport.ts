// src/features/financial-roi/utils/financialPdfExport.ts
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FinancialConfig,
  ScenarioSimulationResult,
  SystemSizingInput,
} from '../types/financialRoi';
import { UTILITY_PRESETS } from './utilityTariffPresets';

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

  const utility = UTILITY_PRESETS.find((u) => u.id === config.selectedUtilityId);
  const utilityName = utility?.name || 'Philippine Utility Grid';

  const COLOR_SLATE_900 = [15, 23, 42] as const;
  const COLOR_SLATE_700 = [51, 65, 85] as const;
  const COLOR_SLATE_500 = [100, 116, 139] as const;
  const COLOR_AMBER = [217, 119, 6] as const;
  const COLOR_LINE = [226, 232, 240] as const;

  const setDraw = (rgb: readonly [number, number, number]) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  const setText = (rgb: readonly [number, number, number]) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);

  const PAGE_WIDTH = 210;
  const MARGIN_X = 18;
  let currentY = 22;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  setText(COLOR_SLATE_900);
  doc.text('KITO SOLAR', MARGIN_X, currentY);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  setText(COLOR_SLATE_500);
  doc.text('FINANCIAL ROI, TARIFF & 25-YEAR CASHFLOW PROJECTION', MARGIN_X, currentY + 5.5);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  doc.text(`Date: ${dateStr}`, PAGE_WIDTH - MARGIN_X, currentY, { align: 'right' });
  if (userName || userEmail) {
    doc.text(`Prepared for: ${userName || userEmail}`, PAGE_WIDTH - MARGIN_X, currentY + 4.5, { align: 'right' });
  }

  currentY += 12;
  setDraw(COLOR_LINE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_X, currentY, PAGE_WIDTH - MARGIN_X, currentY);
  currentY += 8;

  // Executive Sizing & Tariff Baseline
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setText(COLOR_SLATE_900);
  doc.text('1. SIZING & TARIFF ASSUMPTIONS', MARGIN_X, currentY);
  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    head: [['PARAMETER', 'MODEL VALUE', 'TECHNICAL NOTES']],
    body: [
      ['Distribution Utility', utilityName, 'Local retail electric supplier'],
      ['Retail Tariff (Year 1)', `PHP ${config.retailRatePhp.toFixed(2)} / kWh`, 'Full retail rate offset by daytime solar'],
      ['ERC Export Credit Rate', `PHP ${config.exportCreditRatePhp.toFixed(2)} / kWh`, 'Blended generation charge for surplus exports'],
      ['Annual Tariff Inflation', `${config.annualTariffInflationPercent.toFixed(1)}% per year`, 'Historical Philippine utility compounding'],
      ['Annual Panel Degradation', `${config.annualPanelDegradationPercent.toFixed(2)}% per year`, 'Year 25 output remains ~89.2% of Year 1'],
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
    margin: { left: MARGIN_X, right: MARGIN_X },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Architecture Comparison Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setText(COLOR_SLATE_900);
  doc.text('2. ARCHITECTURE FINANCIAL COMPARISON', MARGIN_X, currentY);
  currentY += 5;

  const comparisonRows = [
    [
      'Grid-Tie + Zero-Export',
      `PHP ${allScenarios.zero_export?.initialCapexPhp.toLocaleString() || '0'}`,
      `PHP ${allScenarios.zero_export?.year1MonthlySavingsPhp.toLocaleString() || '0'}/mo`,
      allScenarios.zero_export?.paybackFormatted || '-',
      `PHP ${allScenarios.zero_export?.netProfit25YearsPhp.toLocaleString() || '0'}`,
      `PHP ${allScenarios.zero_export?.lcoePhpPerKwh.toFixed(2) || '0'}/kWh`,
    ],
    [
      'Grid-Tie + Net Metering',
      `PHP ${allScenarios.net_metering?.initialCapexPhp.toLocaleString() || '0'}`,
      `PHP ${allScenarios.net_metering?.year1MonthlySavingsPhp.toLocaleString() || '0'}/mo`,
      allScenarios.net_metering?.paybackFormatted || '-',
      `PHP ${allScenarios.net_metering?.netProfit25YearsPhp.toLocaleString() || '0'}`,
      `PHP ${allScenarios.net_metering?.lcoePhpPerKwh.toFixed(2) || '0'}/kWh`,
    ],
    [
      'Hybrid + LiFePO4 Battery',
      `PHP ${allScenarios.hybrid_battery?.initialCapexPhp.toLocaleString() || '0'}`,
      `PHP ${allScenarios.hybrid_battery?.year1MonthlySavingsPhp.toLocaleString() || '0'}/mo`,
      allScenarios.hybrid_battery?.paybackFormatted || '-',
      `PHP ${allScenarios.hybrid_battery?.netProfit25YearsPhp.toLocaleString() || '0'}`,
      `PHP ${allScenarios.hybrid_battery?.lcoePhpPerKwh.toFixed(2) || '0'}/kWh`,
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['ARCHITECTURE', 'INITIAL CAPEX', 'YEAR 1 SAVINGS', 'BREAKEVEN', '25-YR PROFIT', 'LCOE']],
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
    margin: { left: MARGIN_X, right: MARGIN_X },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Milestone 25-Year Cashflow Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setText(COLOR_SLATE_900);
  doc.text(`3. 25-YEAR CASHFLOW PROJECTION (${activeSim.label.toUpperCase()})`, MARGIN_X, currentY);
  currentY += 5;

  const milestoneYears = [1, 3, 5, 10, 12, 15, 20, 25];
  const milestoneRows = milestoneYears.map((yr) => {
    const pt = activeSim.cashflowSeries[yr] || activeSim.cashflowSeries[activeSim.cashflowSeries.length - 1];
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
    margin: { left: MARGIN_X, right: MARGIN_X },
  });

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    setDraw(COLOR_LINE);
    doc.setLineWidth(0.2);
    doc.line(MARGIN_X, 285, PAGE_WIDTH - MARGIN_X, 285);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    setText(COLOR_SLATE_500);
    doc.text('KitoSolar • Solar Engineering Studio & Financial ROI Simulator', MARGIN_X, 289.5);
    doc.text(`Page ${p} of ${totalPages}`, PAGE_WIDTH - MARGIN_X, 289.5, { align: 'right' });
  }

  return doc;
}

export function downloadFinancialProposalPdf(params: FinancialPdfParams): void {
  const doc = generateFinancialProposalPdf(params);
  const dateSlug = new Date().toISOString().split('T')[0];
  const strategySlug = params.activeSim.strategy;
  doc.save(`KitoSolar-Financial-ROI-${strategySlug}-${dateSlug}.pdf`);
}
