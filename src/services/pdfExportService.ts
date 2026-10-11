// src/services/pdfExportService.ts
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SystemCalculationResult } from '@/types/calculator';
import { SolarInverterRecord, SolarModuleRecord, BatteryRecord } from '@/types/supabase';

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
}: ExportPdfParams): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const { summary, dc, ac, battery, stringSizing, mounting, warnings } = calculationResult;
  const isHybrid = calculationResult.systemType === 'hybrid' && battery.hasBattery;

  // Modern Minimal Design Tokens (KitoSolar Palette: Slate, Solar Amber & Clean Whitespace)
  const COLOR_SLATE_900 = [15, 23, 42] as const; // #0F172A - Dominant high-contrast text
  const COLOR_SLATE_700 = [51, 65, 85] as const; // #334155 - Mid-tone technical spec text
  const COLOR_SLATE_500 = [100, 116, 139] as const; // #64748B - Quiet labels & secondary text
  const COLOR_SLATE_400 = [148, 163, 184] as const; // #94A3B8 - De-emphasized metadata
  const COLOR_AMBER = [217, 119, 6] as const; // #D97706 - Signature Solar Amber accent
  const COLOR_LINE = [226, 232, 240] as const; // #E2E8F0 - Delicate divider rule
  const COLOR_LINE_LIGHT = [241, 245, 249] as const; // #F1F5F9 - Row separator hairline

  const setDraw = (rgb: readonly [number, number, number]) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  const setText = (rgb: readonly [number, number, number]) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);

  const PAGE_WIDTH = 210;
  const MARGIN_X = 18; // Generous 18mm margin for breathing room
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2; // 174mm

  let currentY = 22;

  // 1. MINIMAL HEADER
  // Brand logotype
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  setText(COLOR_SLATE_900);
  doc.text('KitoSolar', MARGIN_X, currentY);

  // Document status & timestamp (Right Aligned, Quiet & Crisp)
  const timestampStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setText(COLOR_SLATE_500);
  doc.text('SIZING & SPECIFICATION REPORT', PAGE_WIDTH - MARGIN_X, currentY - 2, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  setText(COLOR_SLATE_400);
  doc.text(`Issued ${timestampStr}`, PAGE_WIDTH - MARGIN_X, currentY + 3, { align: 'right' });

  currentY += 5;

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  setText(COLOR_SLATE_500);
  doc.text('Engineering calculation schedules, electrical protection & hardware bill of materials', MARGIN_X, currentY);
  currentY += 6;

  // Single razor-thin hairline divider
  setDraw(COLOR_LINE);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_X, currentY, PAGE_WIDTH - MARGIN_X, currentY);
  currentY += 8;

  // 2. PROJECT METADATA (Clean Inline Text, No Heavy Box Cage)
  const userDisplay = userName || userEmail || 'Registered Engineer';
  const systemDisplay = isHybrid ? 'Hybrid Solar + Battery Storage (BESS)' : 'Grid-Tied Photovoltaic';
  const serviceDisplay = mainBreakerA ? `${gridVoltageV}V AC (${mainBreakerA}A Main)` : `${gridVoltageV}V AC`;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setText(COLOR_SLATE_400);
  doc.text('PREPARED FOR', MARGIN_X, currentY);
  doc.text('SYSTEM TOPOLOGY', MARGIN_X + 60, currentY);
  doc.text('GRID SERVICE', MARGIN_X + 130, currentY);

  currentY += 4.5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  setText(COLOR_SLATE_900);
  doc.text(userDisplay, MARGIN_X, currentY);
  doc.text(systemDisplay, MARGIN_X + 60, currentY);
  doc.text(serviceDisplay, MARGIN_X + 130, currentY);

  currentY += 12;

  // 3. STAT COUNTERS (Open Minimalist Typography, Zero Heavy Box Cards)
  // 5 elegant columns with big numbers and quiet labels
  const statColWidth = CONTENT_WIDTH / 5;
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
    const x = MARGIN_X + idx * statColWidth;

    // Metric Value + Unit
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    setText(COLOR_SLATE_900);
    doc.text(st.value, x, currentY);

    if (st.unit) {
      const valWidth = doc.getTextWidth(st.value);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      setText(COLOR_AMBER);
      doc.text(` ${st.unit}`, x + valWidth, currentY - 0.5);
    }

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    setText(COLOR_SLATE_500);
    doc.text(st.label, x, currentY + 4.8);

    // Subtext
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setText(COLOR_SLATE_400);
    doc.text(st.sub, x, currentY + 8.8);
  });

  currentY += 16;

  // Thin separator under stats
  setDraw(COLOR_LINE);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_X, currentY, PAGE_WIDTH - MARGIN_X, currentY);
  currentY += 10;

  // Section Header Helper (Clean Uppercase, No Yellow Rectangles)
  const renderSectionHeading = (num: string, title: string) => {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    setText(COLOR_AMBER);
    doc.text(num, MARGIN_X, currentY);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    setText(COLOR_SLATE_900);
    doc.text(title, MARGIN_X + 8, currentY);
    currentY += 4;
  };

  // 4. MAJOR EQUIPMENT SPECIFICATIONS
  renderSectionHeading('01', 'MAJOR EQUIPMENT SPECIFICATIONS');

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
    headStyles: {
      textColor: [100, 116, 139],
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: { top: 3, bottom: 3, left: 1, right: 1 },
      lineColor: [226, 232, 240],
      lineWidth: { bottom: 0.25 },
    },
    bodyStyles: {
      textColor: [51, 65, 85],
      fontSize: 8.5,
      cellPadding: { top: 3.5, bottom: 3.5, left: 1, right: 1 },
      lineColor: [241, 245, 249],
      lineWidth: { bottom: 0.15 },
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 32 },
      1: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 44 },
      2: { textColor: [217, 119, 6], fontStyle: 'bold', cellWidth: 38 },
      3: { textColor: [100, 116, 139] },
    },
    margin: { left: MARGIN_X, right: MARGIN_X },
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // 5. ELECTRICAL PROTECTION & CONDUIT SCHEDULE
  if (currentY > 190) {
    doc.addPage();
    currentY = 22;
  }

  renderSectionHeading('02', 'ELECTRICAL PROTECTION & INTERCONNECTION SCHEDULE');

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
    headStyles: {
      textColor: [100, 116, 139],
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: { top: 3, bottom: 3, left: 1, right: 1 },
      lineColor: [226, 232, 240],
      lineWidth: { bottom: 0.25 },
    },
    bodyStyles: {
      textColor: [51, 65, 85],
      fontSize: 8.5,
      cellPadding: { top: 3.2, bottom: 3.2, left: 1, right: 1 },
      lineColor: [241, 245, 249],
      lineWidth: { bottom: 0.15 },
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 38 },
      1: { fontStyle: 'bold', textColor: [217, 119, 6], cellWidth: 26 },
      2: { textColor: [71, 85, 105], cellWidth: 44 },
      3: { textColor: [100, 116, 139] },
    },
    margin: { left: MARGIN_X, right: MARGIN_X },
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // 6. MECHANICAL MOUNTING HARDWARE BILL OF MATERIALS (BOM)
  if (currentY > 210) {
    doc.addPage();
    currentY = 22;
  }

  renderSectionHeading('03', 'MECHANICAL MOUNTING HARDWARE (BOM)');

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
    headStyles: {
      textColor: [100, 116, 139],
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: { top: 3, bottom: 3, left: 1, right: 1 },
      lineColor: [226, 232, 240],
      lineWidth: { bottom: 0.25 },
    },
    bodyStyles: {
      textColor: [51, 65, 85],
      fontSize: 8.5,
      cellPadding: { top: 3.2, bottom: 3.2, left: 1, right: 1 },
      lineColor: [241, 245, 249],
      lineWidth: { bottom: 0.15 },
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 42 },
      1: { fontStyle: 'bold', textColor: [217, 119, 6], cellWidth: 22 },
      2: { textColor: [71, 85, 105], cellWidth: 42 },
      3: { textColor: [100, 116, 139] },
    },
    margin: { left: MARGIN_X, right: MARGIN_X },
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // 7. CODE COMPLIANCE & SAFETY ADVISORIES
  if (warnings.length > 0) {
    if (currentY > 210) {
      doc.addPage();
      currentY = 22;
    }

    renderSectionHeading('04', 'CODE COMPLIANCE & ADVISORIES');

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
      headStyles: {
        textColor: [100, 116, 139],
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: { top: 3, bottom: 3, left: 1, right: 1 },
        lineColor: [226, 232, 240],
        lineWidth: { bottom: 0.25 },
      },
      bodyStyles: {
        textColor: [51, 65, 85],
        fontSize: 8.5,
        cellPadding: { top: 3.2, bottom: 3.2, left: 1, right: 1 },
        lineColor: [241, 245, 249],
        lineWidth: { bottom: 0.15 },
      },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [217, 119, 6], cellWidth: 24 },
        1: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 40 },
        2: { textColor: [71, 85, 105], cellWidth: 54 },
        3: { textColor: [100, 116, 139] },
      },
      margin: { left: MARGIN_X, right: MARGIN_X },
    });
  }

  // 8. ELEGANT RUNNING FOOTER ON ALL PAGES
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Subtle hairline
    setDraw(COLOR_LINE);
    doc.setLineWidth(0.2);
    doc.line(MARGIN_X, 285, PAGE_WIDTH - MARGIN_X, 285);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    setText(COLOR_SLATE_400);
    doc.text('KitoSolar • Solar PV Engineering Sizing & Bill of Materials', MARGIN_X, 289.5);
    doc.text(`Page ${p} of ${totalPages}`, PAGE_WIDTH - MARGIN_X, 289.5, { align: 'right' });
  }

  return doc;
}

export function downloadSizingPdf(params: ExportPdfParams): void {
  const doc = generateSizingPdf(params);
  const dateSlug = new Date().toISOString().split('T')[0];
  const systemSlug = params.calculationResult.systemType === 'hybrid' ? 'Hybrid' : 'OnGrid';
  const filename = `KitoSolar-Sizing-${systemSlug}-${dateSlug}.pdf`;
  doc.save(filename);
}
