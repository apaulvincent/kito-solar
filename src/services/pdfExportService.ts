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

  // Design Tokens (ui-ux-pro-max: Exaggerated Minimalism & Nature Green / Slate High-Contrast)
  const COLOR_PRIMARY_DARK = [15, 23, 42] as const; // Slate 900 #0F172A
  const COLOR_PRIMARY_GREEN = [5, 150, 105] as const; // Emerald 600 #059669
  const COLOR_TEXT_MUTED = [100, 116, 139] as const; // Slate 500 #64748B
  const COLOR_BORDER_LIGHT = [226, 232, 240] as const; // Slate 200 #E2E8F0
  const COLOR_BG_SUBTLE = [248, 250, 252] as const; // Slate 50 #F8FAFC

  const setFill = (rgb: readonly [number, number, number]) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  const setText = (rgb: readonly [number, number, number]) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  const setDraw = (rgb: readonly [number, number, number]) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);

  const PAGE_WIDTH = 210;
  const MARGIN_X = 14;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2; // 182mm

  let currentY = 14;

  // 1. BRAND HEADER & DOCUMENT TITLE
  // Emerald top decorative brand accent line
  setFill(COLOR_PRIMARY_GREEN);
  doc.rect(MARGIN_X, currentY, CONTENT_WIDTH, 3, 'F');
  currentY += 10;

  // Brand Name (KitoSolar)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  setText(COLOR_PRIMARY_DARK);
  doc.text('KitoSolar', MARGIN_X, currentY);

  // Issued Date on Right
  const timestampStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  setText(COLOR_TEXT_MUTED);
  doc.text(`Issued: ${timestampStr}`, PAGE_WIDTH - MARGIN_X, currentY, { align: 'right' });
  currentY += 6;

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  setText(COLOR_TEXT_MUTED);
  doc.text('Solar PV Sizing Details & Code Compliance Report', MARGIN_X, currentY);
  currentY += 8;

  // Horizontal Divider Line
  setDraw(COLOR_BORDER_LIGHT);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_X, currentY, PAGE_WIDTH - MARGIN_X, currentY);
  currentY += 8;

  // 2. PROJECT & USER METADATA ROW
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  setText(COLOR_TEXT_MUTED);
  doc.text('CLIENT / USER:', MARGIN_X, currentY);
  doc.setFont('helvetica', 'normal');
  setText(COLOR_PRIMARY_DARK);
  const userDisplay = userName || userEmail || 'Registered Engineer';
  doc.text(userDisplay, MARGIN_X + 32, currentY);

  doc.setFont('helvetica', 'bold');
  setText(COLOR_TEXT_MUTED);
  doc.text('SYSTEM TOPOLOGY:', MARGIN_X + 96, currentY);
  doc.setFont('helvetica', 'normal');
  setText(COLOR_PRIMARY_DARK);
  doc.text(isHybrid ? 'Hybrid Solar + Battery (BESS)' : 'Grid-Tied On-Grid', MARGIN_X + 138, currentY);
  currentY += 9;

  // 3. EXECUTIVE TELEMETRY HUD (6 Metric Cards with generous breathing room)
  const cardWidth = (CONTENT_WIDTH - 10) / 3; // 3 columns, 2 rows
  const cardHeight = 19;
  const metrics = [
    { label: 'ARRAY CAPACITY', value: `${summary.totalArrayPowerKw} kWp`, sub: `${summary.totalPanels}x Panels` },
    { label: 'INVERTER RATING', value: `${summary.inverterPowerKw} kW`, sub: selectedInverter.brand },
    { label: 'DC / AC RATIO', value: `${summary.dcAcRatio}`, sub: 'Continuous Factor' },
    {
      label: 'BATTERY STORAGE',
      value: isHybrid ? `${(battery.totalEnergyWh / 1000).toFixed(1)} kWh` : 'None',
      sub: isHybrid ? `${battery.bankVoltageV}V Bank` : 'Grid-Tied',
    },
    { label: 'SERVICE VOLTAGE', value: `${gridVoltageV} V`, sub: mainBreakerA ? `${mainBreakerA}A Main` : 'Standard AC' },
    { label: 'STRING CONFIG', value: `${stringSizing.recommendedStrings} String(s)`, sub: `${stringSizing.panelsPerString} Panels/Str` },
  ];

  metrics.forEach((metric, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = MARGIN_X + col * (cardWidth + 5);
    const y = currentY + row * (cardHeight + 4);

    // Card background & rounded border
    setFill(COLOR_BG_SUBTLE);
    setDraw(COLOR_BORDER_LIGHT);
    doc.roundedRect(x, y, cardWidth, cardHeight, 1.8, 1.8, 'FD');

    // Label
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    setText(COLOR_TEXT_MUTED);
    doc.text(metric.label, x + 4, y + 5.2);

    // Metric Value (Large and readable)
    doc.setFontSize(13.5);
    doc.setFont('helvetica', 'bold');
    setText(COLOR_PRIMARY_DARK);
    doc.text(metric.value, x + 4, y + 11.8);

    // Subtext
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    setText(COLOR_PRIMARY_GREEN);
    doc.text(metric.sub, x + 4, y + 16.2);
  });

  currentY += cardHeight * 2 + 12;

  // 4. EQUIPMENT SPECIFICATION SUMMARY TABLE
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  setText(COLOR_PRIMARY_DARK);
  doc.text('1. Major Equipment Specifications', MARGIN_X, currentY);
  currentY += 4;

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
    head: [['Role', 'Selected Equipment', 'Capacity / Rating', 'Operating Parameters']],
    body: equipmentRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      cellPadding: 3.2,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [15, 23, 42],
      cellPadding: 3.0,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: MARGIN_X, right: MARGIN_X },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // 5. SCHEDULES: DC PROTECTION & AC INTERCONNECTION
  // If approaching bottom of first page, start cleanly on next page
  if (currentY > 195) {
    doc.addPage();
    currentY = 18;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  setText(COLOR_PRIMARY_DARK);
  doc.text('2. Electrical Schedules & Protection Sizing', MARGIN_X, currentY);
  currentY += 4;

  const electricalScheduleRows = [
    ['DC Circuit Breaker', `${dc.breakerRatingA} A`, 'NEC 690.8 continuous 1.25x design factor', dc.explanation.breaker],
    ['DC Wire Spec', dc.wireSpec, 'Dedicated UV-resistant PV conductor', dc.wireNote || dc.explanation.wire],
    ['DC Isolator Switch', `${dc.isolatorRatingA} A`, 'Load break rated under full string Voc', dc.explanation.isolator],
    ['DC Surge Arrester (SPD)', `${dc.spdRating} (${dc.spdRatingV}V DC)`, 'Type 2 Din-rail PV surge suppression', dc.explanation.spd],
    ['AC Circuit Breaker', `${ac.breakerRatingA} A`, '1.25x Rated Continuous Inverter Output', ac.explanation.breaker],
    ['AC Wire Spec', ac.wireSpec, '75°C / 90°C THHN copper conductor', ac.explanation.wire],
    ['AC Isolator Switch', `${ac.isolatorRatingA} A`, 'Lockable AC service disconnect', ac.explanation.isolator],
    ['AC Surge Arrester (SPD)', `${ac.spdRating} (${ac.spdRatingV}V AC)`, 'Mains transient voltage surge protection', ac.explanation.spd],
    ['Grounding & Rod', dc.groundConductorSpec, 'Single-point solid copper bonded to busbar', dc.groundRodSpec],
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
    head: [['Electrical Circuit', 'Specified Rating', 'Engineering Basis', 'Notes & Sizing Rationale']],
    body: electricalScheduleRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      cellPadding: 3.2,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [15, 23, 42],
      cellPadding: 2.8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: MARGIN_X, right: MARGIN_X },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // 6. MECHANICAL MOUNTING HARDWARE BILL OF MATERIALS (BOM)
  if (currentY > 210) {
    doc.addPage();
    currentY = 18;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  setText(COLOR_PRIMARY_DARK);
  doc.text('3. Mechanical Mounting Hardware Bill of Materials (BOM)', MARGIN_X, currentY);
  currentY += 4;

  const bomRows = mounting.items.map((item) => [
    item.name,
    `${item.quantity} ${item.unit}`,
    item.specification,
    item.calculationBasis,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Item Description', 'Quantity', 'Specification', 'Calculation Basis']],
    body: bomRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      cellPadding: 3.2,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [15, 23, 42],
      cellPadding: 2.8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: MARGIN_X, right: MARGIN_X },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // 7. CODE WARNINGS & COMPLIANCE
  if (warnings.length > 0) {
    if (currentY > 210) {
      doc.addPage();
      currentY = 18;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    setText(COLOR_PRIMARY_DARK);
    doc.text('4. Code Compliance & Engineering Advisories', MARGIN_X, currentY);
    currentY += 4;

    const warningRows = warnings.map((w) => [
      w.severity.toUpperCase(),
      w.title,
      w.message,
      w.recommendation || 'Follow standard electrical installation practices.',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Severity', 'Category', 'Observation', 'Recommendation']],
      body: warningRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        cellPadding: 3.2,
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [15, 23, 42],
        cellPadding: 2.8,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 26 },
      },
      margin: { left: MARGIN_X, right: MARGIN_X },
    });
  }

  // 8. PAGE FOOTER ON ALL PAGES
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    setDraw(COLOR_BORDER_LIGHT);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_X, 285, PAGE_WIDTH - MARGIN_X, 285);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    setText(COLOR_TEXT_MUTED);
    doc.text(
      'KitoSolar CAD & Engineering Suite • Sizing report for planning purposes • Comply with local PEC/NEC regulations',
      MARGIN_X,
      289
    );
    doc.text(`Page ${p} of ${totalPages}`, PAGE_WIDTH - MARGIN_X, 289, { align: 'right' });
  }

  return doc;
}

export function downloadSizingPdf(params: ExportPdfParams): void {
  const doc = generateSizingPdf(params);
  const dateSlug = new Date().toISOString().split('T')[0];
  const systemSlug = params.calculationResult.systemType === 'hybrid' ? 'Hybrid' : 'OnGrid';
  const filename = `KitoSolar-Sizing-Details-${systemSlug}-${dateSlug}.pdf`;
  doc.save(filename);
}
