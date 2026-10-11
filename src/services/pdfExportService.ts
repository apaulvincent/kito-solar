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

  // Site Color Scheme Tokens (from tailwind.config.js & Header.tsx)
  // Solar Amber (Site Primary Brand)
  const COLOR_SOLAR_AMBER = [217, 119, 6] as const; // #D97706 (solar.600 / solar.DEFAULT)
  const COLOR_SOLAR_LIGHT = [245, 158, 11] as const; // #F59E0B (solar.500 / Amber badge)
  const COLOR_SOLAR_TINT = [254, 243, 199] as const; // #FEF3C7 (solar.100 badge bg)
  const COLOR_SOLAR_DARK = [180, 83, 9] as const; // #B45309 (solar.700 text)

  // Technical Surfaces & Neutrals
  const COLOR_SLATE_DARK = [15, 23, 42] as const; // #0F172A (surface.dark2 / Deep Navy)
  const COLOR_SLATE_BODY = [30, 41, 59] as const; // #1E293B (surface.dark3 / High-contrast text)
  const COLOR_SLATE_MUTED = [100, 116, 139] as const; // #64748B (Muted secondary text)
  const COLOR_BORDER = [226, 232, 240] as const; // #E2E8F0 (surface.border)
  const COLOR_SURFACE = [248, 250, 252] as const; // #F8FAFC (surface.2 / Table alternate)

  // Circuit Semantics (from 3D scene & HUD)
  const COLOR_CIRCUIT_AC = [2, 132, 199] as const; // #0284C7 (Sky blue / AC)
  const COLOR_CIRCUIT_BATTERY = [5, 150, 105] as const; // #059669 (Emerald / Battery)

  const setFill = (rgb: readonly [number, number, number]) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  const setText = (rgb: readonly [number, number, number]) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  const setDraw = (rgb: readonly [number, number, number]) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);

  const PAGE_WIDTH = 210;
  const MARGIN_X = 14;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2; // 182mm

  let currentY = 14;

  // 1. BRAND HEADER & DOCUMENT TITLE
  // Solar Amber top brand accent bar (matching site identity)
  setFill(COLOR_SOLAR_AMBER);
  doc.rect(MARGIN_X, currentY, CONTENT_WIDTH, 3, 'F');
  currentY += 10;

  // Site Brand Badge [⚡] Square
  setFill(COLOR_SOLAR_LIGHT);
  doc.roundedRect(MARGIN_X, currentY - 5.5, 7.2, 7.2, 1.4, 1.4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  setText([9, 13, 22]); // Deep black symbol
  doc.text('⚡', MARGIN_X + 1.6, currentY - 0.5);

  // Brand Name (KitoSolar)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  setText(COLOR_SLATE_DARK);
  doc.text('KitoSolar', MARGIN_X + 10, currentY);

  // STUDIO Pill Badge (exact replica of website header badge)
  setFill(COLOR_SOLAR_TINT);
  setDraw(COLOR_SOLAR_AMBER);
  doc.setLineWidth(0.2);
  doc.roundedRect(MARGIN_X + 48, currentY - 4.8, 17, 5.2, 1.2, 1.2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  setText(COLOR_SOLAR_DARK);
  doc.text('STUDIO', MARGIN_X + 50.8, currentY - 1.1);

  // Document Type & Issued Date on Right
  const timestampStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  setText(COLOR_SLATE_MUTED);
  doc.text('ENGINEERING SPECIFICATION', PAGE_WIDTH - MARGIN_X, currentY - 2, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Issued: ${timestampStr}`, PAGE_WIDTH - MARGIN_X, currentY + 3.5, { align: 'right' });
  currentY += 7;

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  setText(COLOR_SLATE_MUTED);
  doc.text('Solar PV System Sizing, Electrical Schedules & Hardware BOM', MARGIN_X, currentY);
  currentY += 7;

  // Horizontal Divider Line with Solar Amber accent pip
  setDraw(COLOR_BORDER);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_X, currentY, PAGE_WIDTH - MARGIN_X, currentY);
  setFill(COLOR_SOLAR_AMBER);
  doc.rect(MARGIN_X, currentY - 0.4, 24, 0.8, 'F');
  currentY += 7;

  // 2. PROJECT & USER METADATA CARD (Site Surface 2 styled box)
  setFill(COLOR_SURFACE);
  setDraw(COLOR_BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN_X, currentY, CONTENT_WIDTH, 9.5, 1.6, 1.6, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  setText(COLOR_SLATE_MUTED);
  doc.text('CLIENT / USER:', MARGIN_X + 4, currentY + 6.2);
  doc.setFont('helvetica', 'bold');
  setText(COLOR_SLATE_DARK);
  const userDisplay = userName || userEmail || 'Registered Engineer';
  doc.text(userDisplay, MARGIN_X + 31, currentY + 6.2);

  doc.setFont('helvetica', 'bold');
  setText(COLOR_SLATE_MUTED);
  doc.text('SYSTEM TOPOLOGY:', MARGIN_X + 96, currentY + 6.2);
  doc.setFont('helvetica', 'bold');
  setText(isHybrid ? COLOR_SOLAR_DARK : COLOR_CIRCUIT_AC);
  doc.text(isHybrid ? 'Hybrid Solar + Battery (BESS)' : 'Grid-Tied On-Grid', MARGIN_X + 138, currentY + 6.2);
  currentY += 15;

  // 3. EXECUTIVE TELEMETRY HUD (6 Metric Cards styled after SystemSummary.tsx)
  const cardWidth = (CONTENT_WIDTH - 10) / 3; // 3 columns, 2 rows
  const cardHeight = 20;
  const metrics = [
    {
      label: 'ARRAY CAPACITY',
      value: `${summary.totalArrayPowerKw} kWp`,
      sub: `${summary.totalPanels}x Panels`,
      accentColor: COLOR_SOLAR_AMBER,
    },
    {
      label: 'INVERTER RATING',
      value: `${summary.inverterPowerKw} kW`,
      sub: selectedInverter.brand,
      accentColor: COLOR_SOLAR_AMBER,
    },
    {
      label: 'DC / AC RATIO',
      value: `${summary.dcAcRatio}`,
      sub: 'Continuous Factor',
      accentColor: COLOR_SLATE_BODY,
    },
    {
      label: 'BATTERY STORAGE',
      value: isHybrid ? `${(battery.totalEnergyWh / 1000).toFixed(1)} kWh` : 'None',
      sub: isHybrid ? `${battery.bankVoltageV}V Bank` : 'Grid-Tied',
      accentColor: isHybrid ? COLOR_CIRCUIT_BATTERY : COLOR_SLATE_MUTED,
    },
    {
      label: 'SERVICE VOLTAGE',
      value: `${gridVoltageV} V`,
      sub: mainBreakerA ? `${mainBreakerA}A Main Breaker` : 'Standard AC Interconnect',
      accentColor: COLOR_CIRCUIT_AC,
    },
    {
      label: 'STRING CONFIG',
      value: `${stringSizing.recommendedStrings} String(s)`,
      sub: `${stringSizing.panelsPerString} Panels/String`,
      accentColor: COLOR_SOLAR_AMBER,
    },
  ];

  metrics.forEach((metric, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = MARGIN_X + col * (cardWidth + 5);
    const y = currentY + row * (cardHeight + 4);

    // Card background & rounded border
    setFill(COLOR_SURFACE);
    setDraw(COLOR_BORDER);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, cardWidth, cardHeight, 1.8, 1.8, 'FD');

    // Left color indicator bar (matching circuit / telemetry identity)
    setFill(metric.accentColor);
    doc.roundedRect(x, y, 2.2, cardHeight, 0.8, 0.8, 'F');

    // Metric Label
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    setText(COLOR_SLATE_MUTED);
    doc.text(metric.label, x + 5, y + 5.5);

    // Metric Value (Clean high contrast)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    setText(COLOR_SLATE_DARK);
    doc.text(metric.value, x + 5, y + 12.5);

    // Subtext with contextual color accent
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    setText(metric.accentColor);
    doc.text(metric.sub, x + 5, y + 17.2);
  });

  currentY += cardHeight * 2 + 13;

  // Helper for Section Headings with Solar Amber accent bar
  const renderSectionHeader = (title: string) => {
    setFill(COLOR_SOLAR_AMBER);
    doc.rect(MARGIN_X, currentY - 4.2, 2.6, 5.2, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    setText(COLOR_SLATE_DARK);
    doc.text(title, MARGIN_X + 6, currentY);
    currentY += 4.5;
  };

  // 4. EQUIPMENT SPECIFICATION SUMMARY TABLE
  renderSectionHeader('1. Major Equipment Specifications');

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
      cellPadding: 3.4,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
      cellPadding: 3.0,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 32 },
      1: { fontStyle: 'bold', cellWidth: 46 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: MARGIN_X, right: MARGIN_X },
  });

  currentY = (doc as any).lastAutoTable.finalY + 11;

  // 5. SCHEDULES: DC PROTECTION & AC INTERCONNECTION
  if (currentY > 195) {
    doc.addPage();
    currentY = 18;
  }

  renderSectionHeader('2. Electrical Schedules & Protection Sizing');

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
      cellPadding: 3.4,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
      cellPadding: 2.8,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 36 },
      1: { fontStyle: 'bold', cellWidth: 28 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: MARGIN_X, right: MARGIN_X },
  });

  currentY = (doc as any).lastAutoTable.finalY + 11;

  // 6. MECHANICAL MOUNTING HARDWARE BILL OF MATERIALS (BOM)
  if (currentY > 210) {
    doc.addPage();
    currentY = 18;
  }

  renderSectionHeader('3. Mechanical Mounting Hardware Bill of Materials (BOM)');

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
      cellPadding: 3.4,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
      cellPadding: 2.8,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 38 },
      1: { fontStyle: 'bold', cellWidth: 26 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: MARGIN_X, right: MARGIN_X },
  });

  currentY = (doc as any).lastAutoTable.finalY + 11;

  // 7. CODE WARNINGS & COMPLIANCE
  if (warnings.length > 0) {
    if (currentY > 210) {
      doc.addPage();
      currentY = 18;
    }

    renderSectionHeader('4. Code Compliance & Engineering Advisories');

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
        cellPadding: 3.4,
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [30, 41, 59],
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

    // Subtle divider rule
    setDraw(COLOR_BORDER);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_X, 284, PAGE_WIDTH - MARGIN_X, 284);

    // Solar Amber center pip
    setFill(COLOR_SOLAR_AMBER);
    doc.rect(PAGE_WIDTH / 2 - 6, 283.6, 12, 0.8, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    setText(COLOR_SLATE_MUTED);
    doc.text(
      'KitoSolar Studio • Solar PV Sizing & Equipment Schedules • Compliant with PEC/NEC standards',
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
