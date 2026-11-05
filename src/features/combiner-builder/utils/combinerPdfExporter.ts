// src/features/combiner-builder/utils/combinerPdfExporter.ts
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CombinerComponentInstance, CombinerWireConnection } from '../types';
import { calculateWireCutLengthMeters } from './wireRouting3D';

export interface CombinerExportData {
  components: CombinerComponentInstance[];
  wires: CombinerWireConnection[];
  enclosureType?: string;
  projectName?: string;
}

export function generateCombinerSchedulePdf({
  components,
  wires,
  enclosureType = '24-Way Metal Industrial Enclosure',
  projectName = 'Residential Solar PV Combiner & ATS Panel',
}: CombinerExportData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const dateStr = new Date().toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // --- Document Header ---
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(245, 158, 11); // #f59e0b Amber
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('KITO SOLAR ENGINEERING STUDIO', 14, 12);

  doc.setTextColor(241, 245, 249);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('3D Solar Combiner Box & ATS Wiring Schedule', 14, 18);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text(`Generated: ${dateStr} • Enclosure: ${enclosureType}`, 14, 23);

  let currentY = 36;

  // --- 1. Project Overview & Telemetry Card ---
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Enclosure Configuration & Technical Summary', 14, currentY);

  currentY += 4;
  const totalCost = components.reduce((sum, c) => sum + c.pricePhp, 0);
  const totalWireMeters = wires.reduce(
    (sum, w) => sum + calculateWireCutLengthMeters(w.waypoints3D || []),
    0,
  );

  autoTable(doc, {
    startY: currentY,
    head: [['Project Title', 'DIN Modules Placed', 'Total Installed Wires', 'Est. Box Hardware Cost']],
    body: [
      [
        projectName,
        `${components.length} Components`,
        `${wires.length} Connections (~${totalWireMeters.toFixed(1)}m total)`,
        `PHP ${totalCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // --- 2. Hardware Bill of Materials (BoM) ---
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Hardware Bill of Materials (BoM)', 14, currentY);

  currentY += 4;

  // Aggregate components
  const componentMap = new Map<
    string,
    { name: string; brand: string; rating: string; qty: number; unitPrice: number }
  >();

  components.forEach((c) => {
    const key = `${c.name}_${c.ratedVoltage}_${c.ratedAmps}`;
    const existing = componentMap.get(key);
    if (existing) {
      existing.qty += 1;
    } else {
      componentMap.set(key, {
        name: c.name,
        brand: c.brand,
        rating: c.ratedAmps > 0 ? `${c.ratedVoltage} / ${c.ratedAmps}A` : c.ratedVoltage,
        qty: 1,
        unitPrice: c.pricePhp,
      });
    }
  });

  const bomRows = Array.from(componentMap.values()).map((item, idx) => [
    `${idx + 1}`,
    item.name,
    item.brand,
    item.rating,
    `${item.qty}`,
    `PHP ${item.unitPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
    `PHP ${(item.qty * item.unitPrice).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
  ]);

  bomRows.push([
    '',
    'Total Estimated Hardware Cost',
    '',
    '',
    `${components.length}`,
    '',
    `PHP ${totalCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Component Description', 'Brand', 'Electrical Rating', 'Qty', 'Unit Price', 'Subtotal']],
    body: bomRows,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // --- 3. Wire & Ferrule Cut-List Summary ---
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Wire Cut-List & Bootlace Ferrule Requirements', 14, currentY);

  currentY += 4;

  // Aggregate wire meters by gauge
  const gaugeLengthMap = new Map<number, number>();
  // Aggregate ferrules by color
  const ferruleCountMap = new Map<string, number>();

  wires.forEach((w) => {
    const len = calculateWireCutLengthMeters(w.waypoints3D || []);
    gaugeLengthMap.set(w.gaugeMm2, (gaugeLengthMap.get(w.gaugeMm2) || 0) + len);

    const fKey = `${w.ferruleColor.toUpperCase()} (${w.gaugeMm2}mm²)`;
    ferruleCountMap.set(fKey, (ferruleCountMap.get(fKey) || 0) + 2); // 2 ferrules per wire
  });

  const wireCutRows = Array.from(gaugeLengthMap.entries()).map(([gauge, len]) => [
    `${gauge} mm²`,
    getStandardApplication(gauge),
    `${len.toFixed(2)} meters`,
    `${Math.ceil(len * 1.1)} meters (+10% slack)`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Conductor Gauge', 'Application Domain', 'Exact Length', 'Recommended Cut (+10%)']],
    body: wireCutRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // --- 4. Point-to-Point Terminal Wiring Schedule ---
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('4. Point-to-Point Step-by-Step Terminal Wiring Schedule', 14, currentY);

  currentY += 4;

  const portLookup = new Map<string, { compName: string; portLabel: string }>();
  components.forEach((c) => {
    c.ports.forEach((p) => {
      portLookup.set(p.id, { compName: c.name, portLabel: p.label });
    });
  });

  const wiringScheduleRows = wires.map((w, idx) => {
    const from = portLookup.get(w.fromPortId) || { compName: 'Terminal', portLabel: w.fromPortId };
    const to = portLookup.get(w.toPortId) || { compName: 'Terminal', portLabel: w.toPortId };
    const lenM = calculateWireCutLengthMeters(w.waypoints3D || []);

    return [
      `W-${String(idx + 1).padStart(2, '0')}`,
      `${from.compName}\n[${from.portLabel}]`,
      `${to.compName}\n[${to.portLabel}]`,
      `${w.gaugeMm2} mm²\n${w.wireColor === '#ef4444' ? 'Red' : w.wireColor === '#3b82f6' ? 'Blue' : w.wireColor === '#22c55e' ? 'Green' : 'Yellow/Black'}`,
      `${w.ferruleColor.toUpperCase()}`,
      `${Math.round(lenM * 100)} cm`,
      w.isJumperLoop ? 'Jumper Loop' : 'Conduit Run',
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Wire #', 'Origin Terminal', 'Destination Terminal', 'Gauge & Color', 'Ferrule', 'Cut Len', 'Type']],
    body: wiringScheduleRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
    margin: { left: 14, right: 14 },
  });

  // Footer Disclaimer on All Pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Kito Solar Engineering Studio • Page ${i} of ${totalPages} • Compliant with PEC 2017 & Philippine Electrical Code`,
      pageWidth / 2,
      290,
      { align: 'center' },
    );
  }

  return doc;
}

function getStandardApplication(gauge: number): string {
  switch (gauge) {
    case 1.5:
      return 'ATS Sensing, Meter Voltage Inputs & Relay Logic';
    case 2.5:
      return 'Auxiliary Circuits & Sub-Meter Sensing';
    case 4:
      return 'PV DC String (Light Arrays < 15A)';
    case 6:
      return 'Standard PV DC String (600V-1000V) & AC Inverter';
    case 10:
      return 'Main Inverter AC Feed & ATS Power Phase Lines';
    case 16:
      return 'Heavy AC Feeder & ATS Distribution Jumper';
    case 25:
      return 'Subpanel Main Bus Feed';
    case 35:
    case 50:
      return 'Battery Storage MCCB High-Current DC Busbar';
    default:
      return 'Power Conductor';
  }
}
