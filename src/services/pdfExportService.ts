import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SystemCalculationResult } from '@/types/calculator';
import { SolarInverterRecord, SolarModuleRecord, BatteryRecord } from '@/types/supabase';
import { DailySimulationSummary } from '@/features/yield-simulator/types/yieldSimulator';
import { isGridTieTopology } from '@/lib/systemType';
import {
  PDF_COLORS,
  PDF_CONTENT_WIDTH,
  PDF_MARGIN_X,
  PDF_PAGE_WIDTH,
  PLAIN_TABLE_BODY_STYLES,
  PLAIN_TABLE_HEAD_STYLES,
  addPdfPageFooters,
  getLastAutoTableFinalY,
  renderPdfSectionHeading,
  setPdfDrawColor,
  setPdfTextColor,
} from '@/lib/pdfLayoutUtils';

export interface ExportPdfParams {
  calculationResult: SystemCalculationResult;
  selectedInverter: SolarInverterRecord;
  selectedModule: SolarModuleRecord;
  selectedBattery: BatteryRecord | null;
  batteryCount: number;
  gridVoltageV: number;
  mainBreakerA: number | null;
  userEmail?: string;
  userName?: string;
  yieldSummary?: DailySimulationSummary;
}

export function generateSizingPdf({
  calculationResult,
  selectedInverter,
  selectedModule,
  selectedBattery,
  batteryCount,
  gridVoltageV,
  mainBreakerA,
  userEmail,
  userName,
  yieldSummary,
}: ExportPdfParams): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const { summary, dc, ac, battery, stringSizing, mounting, warnings } = calculationResult;
  const isHybrid = calculationResult.systemType === 'hybrid' && battery.hasBattery;

  let currentY = 22;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  setPdfTextColor(doc, PDF_COLORS.slate900);
  doc.text('KitoSolar', PDF_MARGIN_X, currentY);

  const timestampStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setPdfTextColor(doc, PDF_COLORS.slate500);
  doc.text('SIZING & SPECIFICATION REPORT', PDF_PAGE_WIDTH - PDF_MARGIN_X, currentY - 2, {
    align: 'right',
  });
  doc.setFont('helvetica', 'normal');
  setPdfTextColor(doc, PDF_COLORS.slate400);
  doc.text(`Issued ${timestampStr}`, PDF_PAGE_WIDTH - PDF_MARGIN_X, currentY + 3, {
    align: 'right',
  });

  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  setPdfTextColor(doc, PDF_COLORS.slate500);
  doc.text(
    'Engineering calculation schedules, electrical protection & hardware bill of materials',
    PDF_MARGIN_X,
    currentY
  );
  currentY += 6;

  setPdfDrawColor(doc, PDF_COLORS.line);
  doc.setLineWidth(0.2);
  doc.line(PDF_MARGIN_X, currentY, PDF_PAGE_WIDTH - PDF_MARGIN_X, currentY);
  currentY += 8;

  const userDisplay = userName || userEmail || 'Registered Engineer';
  const systemDisplay = isHybrid ? 'Hybrid Solar + Battery Storage (BESS)' : 'Grid-Tied Photovoltaic';
  const serviceDisplay = mainBreakerA
    ? `${gridVoltageV}V AC (${mainBreakerA}A Main)`
    : `${gridVoltageV}V AC`;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setPdfTextColor(doc, PDF_COLORS.slate400);
  doc.text('PREPARED FOR', PDF_MARGIN_X, currentY);
  doc.text('SYSTEM TOPOLOGY', PDF_MARGIN_X + 60, currentY);
  doc.text('GRID SERVICE', PDF_MARGIN_X + 130, currentY);

  currentY += 4.5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  setPdfTextColor(doc, PDF_COLORS.slate900);
  doc.text(userDisplay, PDF_MARGIN_X, currentY);
  doc.text(systemDisplay, PDF_MARGIN_X + 60, currentY);
  doc.text(serviceDisplay, PDF_MARGIN_X + 130, currentY);

  currentY += 12;

  const statColWidth = PDF_CONTENT_WIDTH / 5;
  const stats = [
    {
      value: `${summary.totalArrayPowerKw}`,
      unit: 'kWp',
      label: 'ARRAY PEAK',
      sub: `${summary.totalPanels}x ${summary.modulePowerW}W`,
    },
    {
      value: `${summary.inverterPowerKw}`,
      unit: 'kW',
      label: 'INVERTER',
      sub: selectedInverter.brand,
    },
    {
      value: `${summary.dcAcRatio}`,
      unit: '',
      label: 'DC / AC RATIO',
      sub: 'Design Factor',
    },
    {
      value: isHybrid ? `${(battery.totalEnergyWh / 1000).toFixed(1)}` : '—',
      unit: isHybrid ? 'kWh' : '',
      label: 'BATTERY BANK',
      sub: isHybrid ? `${battery.bankVoltageV}V Nominal` : 'Grid-Tied',
    },
    {
      value: `${stringSizing.recommendedStrings}`,
      unit: 'Str',
      label: 'STRING TOPOLOGY',
      sub: `${stringSizing.panelsPerString} Panels/Str`,
    },
  ];

  stats.forEach((st, idx) => {
    const x = PDF_MARGIN_X + idx * statColWidth;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    setPdfTextColor(doc, PDF_COLORS.slate900);
    doc.text(st.value, x, currentY);

    if (st.unit) {
      const valWidth = doc.getTextWidth(st.value);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      setPdfTextColor(doc, PDF_COLORS.amber);
      doc.text(` ${st.unit}`, x + valWidth, currentY - 0.5);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    setPdfTextColor(doc, PDF_COLORS.slate500);
    doc.text(st.label, x, currentY + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setPdfTextColor(doc, PDF_COLORS.slate400);
    doc.text(st.sub, x, currentY + 8.8);
  });

  currentY += 16;

  setPdfDrawColor(doc, PDF_COLORS.line);
  doc.setLineWidth(0.2);
  doc.line(PDF_MARGIN_X, currentY, PDF_PAGE_WIDTH - PDF_MARGIN_X, currentY);
  currentY += 10;

  currentY = renderPdfSectionHeading(doc, currentY, '01', 'MAJOR EQUIPMENT SPECIFICATIONS');

  const equipmentRows = [
    [
      'Solar Inverter',
      `${selectedInverter.brand} ${selectedInverter.model}`,
      `${summary.inverterPowerKw} kW (${calculationResult.systemType.toUpperCase()})`,
      `MPPT: ${selectedInverter.mppt_voltage_range}V | Max PV: ${selectedInverter.max_pv_input_voltage_v}V | Max AC: ${selectedInverter.max_ac_current_a}A`,
    ],
    [
      'PV Modules',
      `${selectedModule.brand} ${selectedModule.model}`,
      `${summary.totalPanels} Panels @ ${selectedModule.pv_wattage_w}W (${summary.totalArrayPowerKw} kWp)`,
      `Voc: ${selectedModule.voc_v}V | Vmp: ${selectedModule.vmp_v}V | Isc: ${selectedModule.isc_a}A | Imp: ${selectedModule.imp_a}A`,
    ],
  ];

  if (isHybrid && selectedBattery) {
    equipmentRows.push([
      'Battery Storage',
      selectedBattery.model,
      `${batteryCount}x Unit(s) (${(battery.totalEnergyWh / 1000).toFixed(1)} kWh)`,
      `${battery.bankVoltageV}V Nominal | ${battery.totalCapacityAh} Ah | Discharge: ${battery.dischargeCurrentA.toFixed(1)}A`,
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['EQUIPMENT', 'MODEL', 'RATING', 'OPERATING PARAMETERS']],
    body: equipmentRows,
    theme: 'plain',
    headStyles: PLAIN_TABLE_HEAD_STYLES,
    bodyStyles: {
      ...PLAIN_TABLE_BODY_STYLES,
      cellPadding: { top: 3.5, bottom: 3.5, left: 1, right: 1 },
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 32 },
      1: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 44 },
      2: { textColor: [217, 119, 6], fontStyle: 'bold', cellWidth: 38 },
      3: { textColor: [100, 116, 139] },
    },
    margin: { left: PDF_MARGIN_X, right: PDF_MARGIN_X },
  });

  currentY = getLastAutoTableFinalY(doc) + 12;

  if (currentY > 190) {
    doc.addPage();
    currentY = 22;
  }

  currentY = renderPdfSectionHeading(
    doc,
    currentY,
    '02',
    'ELECTRICAL PROTECTION & INTERCONNECTION SCHEDULE'
  );

  const electricalScheduleRows = [
    ['DC Circuit Breaker', `${dc.breakerRatingA} A`, 'NEC 690.8 continuous 1.25x design factor', dc.explanation.breaker],
    ['DC Conductor Spec', dc.wireSpec, 'Dedicated UV-resistant PV conductor', dc.wireNote || dc.explanation.wire],
    ['DC Isolator Switch', `${dc.isolatorRatingA} A`, 'Load break rated under full string Voc', dc.explanation.isolator],
    ['DC Surge Arrester (SPD)', `${dc.spdRating} (${dc.spdRatingV}V DC)`, 'Type 2 Din-rail PV surge suppression', dc.explanation.spd],
    ['AC Circuit Breaker', `${ac.breakerRatingA} A`, '1.25x Rated Continuous Inverter Output', ac.explanation.breaker],
    ['AC Conductor Spec', ac.wireSpec, '75°C / 90°C THHN copper conductor', ac.explanation.wire],
    ['AC Isolator Switch', `${ac.isolatorRatingA} A`, 'Lockable AC service disconnect', ac.explanation.isolator],
    ['AC Surge Arrester (SPD)', `${ac.spdRating} (${ac.spdRatingV}V AC)`, 'Mains transient voltage surge protection', ac.explanation.spd],
    ['Grounding & Electrode', dc.groundConductorSpec, 'Single-point solid copper bonded to busbar', dc.groundRodSpec],
  ];

  if (ac.atsConfigured && ac.atsRatingA) {
    electricalScheduleRows.push([
      'Transfer Switch (ATS)',
      `${ac.atsRatingA} A`,
      'Grid / Solar Auxiliary Power Transfer',
      ac.atsNote || 'Automated utility-to-inverter source isolation',
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['CIRCUIT', 'SPECIFIED RATING', 'STANDARDS BASIS', 'SIZING RATIONALE & NOTES']],
    body: electricalScheduleRows,
    theme: 'plain',
    headStyles: PLAIN_TABLE_HEAD_STYLES,
    bodyStyles: PLAIN_TABLE_BODY_STYLES,
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 38 },
      1: { fontStyle: 'bold', textColor: [217, 119, 6], cellWidth: 26 },
      2: { textColor: [71, 85, 105], cellWidth: 44 },
      3: { textColor: [100, 116, 139] },
    },
    margin: { left: PDF_MARGIN_X, right: PDF_MARGIN_X },
  });

  currentY = getLastAutoTableFinalY(doc) + 12;

  if (currentY > 210) {
    doc.addPage();
    currentY = 22;
  }

  currentY = renderPdfSectionHeading(doc, currentY, '03', 'MECHANICAL MOUNTING HARDWARE (BOM)');

  const bomRows = mounting.items.map((item) => [
    item.name,
    `${item.quantity} ${item.unit}`,
    item.specification,
    item.calculationBasis,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['HARDWARE COMPONENT', 'QTY', 'SPECIFICATION', 'ENGINEERING BASIS']],
    body: bomRows,
    theme: 'plain',
    headStyles: PLAIN_TABLE_HEAD_STYLES,
    bodyStyles: PLAIN_TABLE_BODY_STYLES,
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 42 },
      1: { fontStyle: 'bold', textColor: [217, 119, 6], cellWidth: 22 },
      2: { textColor: [71, 85, 105], cellWidth: 42 },
      3: { textColor: [100, 116, 139] },
    },
    margin: { left: PDF_MARGIN_X, right: PDF_MARGIN_X },
  });

  currentY = getLastAutoTableFinalY(doc) + 12;

  const custom3d = calculationResult.costSummary.custom3dSummary;
  if (custom3d && (custom3d.totalAddedComponents > 0 || custom3d.totalWireCount > 0)) {
    if (currentY > 210) {
      doc.addPage();
      currentY = 22;
    }

    currentY = renderPdfSectionHeading(
      doc,
      currentY,
      '03B',
      'CUSTOM 3D PLANT LAYOUT & WIRING ADDITIONS'
    );

    const customRows: string[][] = [
      [
        'Added 3D Plant Hardware',
        `${custom3d.totalAddedComponents} unit(s)`,
        'Breakers, batteries, switches, or arrays added in 3D space',
        `PHP ${calculationResult.costSummary.grandTotalPhp.toLocaleString()} Grand Total`,
      ],
      [
        'Positive (+) & Negative (-) Wiring',
        `${custom3d.totalWireCount} run(s)`,
        `${custom3d.positiveWireMeters}m (+) Red | ${custom3d.negativeWireMeters}m (-) Black`,
        `Added 3D Subtotal: PHP ${custom3d.addedSubtotalPhp.toLocaleString()}`,
      ],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['3D PLANT ITEM', 'COUNT', 'SPECIFICATION', 'COST IMPACT']],
      body: customRows,
      theme: 'plain',
      headStyles: PLAIN_TABLE_HEAD_STYLES,
      bodyStyles: PLAIN_TABLE_BODY_STYLES,
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 42 },
        1: { fontStyle: 'bold', textColor: [217, 119, 6], cellWidth: 22 },
        2: { textColor: [71, 85, 105], cellWidth: 62 },
        3: { textColor: [100, 116, 139] },
      },
      margin: { left: PDF_MARGIN_X, right: PDF_MARGIN_X },
    });

    currentY = getLastAutoTableFinalY(doc) + 12;
  }

  if (warnings.length > 0) {
    if (currentY > 210) {
      doc.addPage();
      currentY = 22;
    }

    currentY = renderPdfSectionHeading(doc, currentY, '04', 'CODE COMPLIANCE & ADVISORIES');

    const warningRows = warnings.map((w) => [
      w.severity.toUpperCase(),
      w.title,
      w.message,
      w.recommendation || 'Follow standard electrical installation practices.',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['SEVERITY', 'OBSERVATION', 'ANALYSIS', 'RECOMMENDED ACTION']],
      body: warningRows,
      theme: 'plain',
      headStyles: PLAIN_TABLE_HEAD_STYLES,
      bodyStyles: PLAIN_TABLE_BODY_STYLES,
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [217, 119, 6], cellWidth: 24 },
        1: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 40 },
        2: { textColor: [71, 85, 105], cellWidth: 54 },
        3: { textColor: [100, 116, 139] },
      },
      margin: { left: PDF_MARGIN_X, right: PDF_MARGIN_X },
    });

    currentY = getLastAutoTableFinalY(doc) + 12;
  }

  if (yieldSummary) {
    if (currentY > 205) {
      doc.addPage();
      currentY = 22;
    }

    currentY = renderPdfSectionHeading(
      doc,
      currentY,
      warnings.length > 0 ? '05' : '04',
      '24-HOUR SYSTEM DISPATCH & SELF-SUFFICIENCY SUMMARY'
    );

    const dispatchRows = [
      [
        'Daily Solar Harvest',
        `${yieldSummary.totalHarvestedPvKwh.toFixed(2)} kWh`,
        `Potential: ${yieldSummary.totalPotentialPvKwh.toFixed(2)} kWh`,
        `Clipped / Curtailed: ${yieldSummary.totalClippedPvKwh.toFixed(2)} kWh`,
      ],
      [
        'Household Energy Served',
        `${yieldSummary.totalLoadConsumedKwh.toFixed(2)} kWh`,
        `Direct Daytime PV: ${yieldSummary.directSolarToLoadKwh.toFixed(2)} kWh`,
        `Self-Sufficiency Ratio: ${yieldSummary.selfSufficiencyPercent.toFixed(1)}%`,
      ],
      [
        'LiFePO4 Battery Cycling',
        `+${yieldSummary.batteryChargedKwh.toFixed(2)} / -${yieldSummary.batteryDischargedKwh.toFixed(2)} kWh`,
        `SoC Range: ${yieldSummary.minBatterySocPercent.toFixed(0)}% to ${yieldSummary.maxBatterySocPercent.toFixed(0)}%`,
        yieldSummary.brownoutSurvived
          ? 'Outage Stress Test: Survived (0 min unmet)'
          : `Outage Unmet Window: ${yieldSummary.blackoutUnmetMinutes} mins`,
      ],
      [
        'Utility Grid Exchange',
        `${yieldSummary.gridImportedKwh.toFixed(2)} kWh Imported`,
        `${yieldSummary.gridExportedKwh.toFixed(2)} kWh Exported`,
        `Solar Local Use: ${yieldSummary.solarSelfConsumptionPercent.toFixed(1)}%`,
      ],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['DISPATCH METRIC', '24-HR TOTAL', 'PRIMARY BREAKDOWN', 'PERFORMANCE BENCHMARK']],
      body: dispatchRows,
      theme: 'plain',
      headStyles: PLAIN_TABLE_HEAD_STYLES,
      bodyStyles: PLAIN_TABLE_BODY_STYLES,
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 42 },
        1: { fontStyle: 'bold', textColor: [217, 119, 6], cellWidth: 36 },
        2: { textColor: [71, 85, 105], cellWidth: 46 },
        3: { textColor: [100, 116, 139] },
      },
      margin: { left: PDF_MARGIN_X, right: PDF_MARGIN_X },
    });
  }

  addPdfPageFooters(
    doc,
    'KitoSolar • Solar PV Engineering Sizing & Bill of Materials',
    PDF_COLORS.slate400
  );

  return doc;
}

export function downloadSizingPdf(params: ExportPdfParams): void {
  const doc = generateSizingPdf(params);
  const dateSlug = new Date().toISOString().split('T')[0];
  const systemSlug = isGridTieTopology(params.calculationResult.systemType) ? 'OnGrid' : 'Hybrid';
  doc.save(`KitoSolar-Sizing-${systemSlug}-${dateSlug}.pdf`);
}
