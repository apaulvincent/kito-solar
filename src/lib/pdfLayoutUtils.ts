import { jsPDF } from 'jspdf';

export const PDF_PAGE_WIDTH = 210;
export const PDF_MARGIN_X = 18;
export const PDF_CONTENT_WIDTH = PDF_PAGE_WIDTH - PDF_MARGIN_X * 2;

export const PDF_COLORS = {
  slate900: [15, 23, 42] as const,
  slate700: [51, 65, 85] as const,
  slate500: [100, 116, 139] as const,
  slate400: [148, 163, 184] as const,
  amber: [217, 119, 6] as const,
  line: [226, 232, 240] as const,
  lineLight: [241, 245, 249] as const,
};

export interface JsPdfWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}

export function getLastAutoTableFinalY(doc: JsPdfWithAutoTable, fallbackY = 40): number {
  return doc.lastAutoTable?.finalY ?? fallbackY;
}

export function setPdfDrawColor(doc: jsPDF, rgb: readonly [number, number, number]): void {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}

export function setPdfTextColor(doc: jsPDF, rgb: readonly [number, number, number]): void {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

export const PLAIN_TABLE_HEAD_STYLES = {
  textColor: [100, 116, 139] as [number, number, number],
  fontSize: 7.5,
  fontStyle: 'bold' as const,
  cellPadding: { top: 3, bottom: 3, left: 1, right: 1 },
  lineColor: [226, 232, 240] as [number, number, number],
  lineWidth: { bottom: 0.25 },
};

export const PLAIN_TABLE_BODY_STYLES = {
  textColor: [51, 65, 85] as [number, number, number],
  fontSize: 8.5,
  cellPadding: { top: 3.2, bottom: 3.2, left: 1, right: 1 },
  lineColor: [241, 245, 249] as [number, number, number],
  lineWidth: { bottom: 0.15 },
};

export function renderPdfSectionHeading(
  doc: jsPDF,
  currentY: number,
  num: string,
  title: string
): number {
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  setPdfTextColor(doc, PDF_COLORS.amber);
  doc.text(num, PDF_MARGIN_X, currentY);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  setPdfTextColor(doc, PDF_COLORS.slate900);
  doc.text(title, PDF_MARGIN_X + 8, currentY);
  return currentY + 4;
}

export function addPdfPageFooters(
  doc: jsPDF,
  footerLabel: string,
  textColor: readonly [number, number, number] = PDF_COLORS.slate400
): void {
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    setPdfDrawColor(doc, PDF_COLORS.line);
    doc.setLineWidth(0.2);
    doc.line(PDF_MARGIN_X, 285, PDF_PAGE_WIDTH - PDF_MARGIN_X, 285);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    setPdfTextColor(doc, textColor);
    doc.text(footerLabel, PDF_MARGIN_X, 289.5);
    doc.text(`Page ${p} of ${totalPages}`, PDF_PAGE_WIDTH - PDF_MARGIN_X, 289.5, { align: 'right' });
  }
}
