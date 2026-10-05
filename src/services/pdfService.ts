import { jsPDF } from 'jspdf';
import { Exam, Student } from '../types';
import { qrService } from './qrService';

/**
 * Sanitizes Turkish characters for standard PDF fonts (Helvetica)
 * to prevent corrupted character substitutions like "1", "0", "_", or abnormal spacing.
 */
function cleanPDFText(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
    .replace(/Ü/g, 'U').replace(/ü/g, 'u')
    .replace(/Ş/g, 'S').replace(/ş/g, 's')
    .replace(/İ/g, 'I').replace(/ı/g, 'i')
    .replace(/Ö/g, 'O').replace(/ö/g, 'o')
    .replace(/Ç/g, 'C').replace(/ç/g, 'c');
}

export type OMRPageFormat = 'A4' | 'A5';

export const pdfService = {
  /**
   * Generates a printable PDF for an exam, either generic or customized per student.
   * Supports:
   * - 'A4': 1 full-size optical form per A4 page.
   * - 'A5': 2 optical forms per A4 sheet (Top & Bottom) separated by a dashed cutting line,
   *         allowing 50% paper savings when cut across the middle.
   */
  generateOMRPDF: async (
    exam: Exam,
    students: Student[] = [],
    pageFormat: OMRPageFormat = 'A4'
  ): Promise<jsPDF> => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    if (pageFormat === 'A4') {
      const studentList = students.length > 0 ? students : [null];
      for (let i = 0; i < studentList.length; i++) {
        if (i > 0) {
          doc.addPage();
        }
        await drawOMRSheet(doc, exam, studentList[i], 0, 0, 1.0);
      }
    } else {
      // --- A5 MODE (2 Forms per A4 sheet, Top & Bottom with Center Cutting Line) ---
      const a4ContentHeight = getExamAnswerBottom(exam) + 4;
      const a5Scale = Math.min(0.66, 134 / Math.max(150, a4ContentHeight));
      const a5ScaledWidth = 210 * a5Scale;
      const a5OffsetX = (210 - a5ScaledWidth) / 2;
      const a5ScaledHeight = a4ContentHeight * a5Scale;
      const topOffsetY = Math.max(3, (148.5 - a5ScaledHeight) / 2);
      const bottomOffsetY = 148.5 + Math.max(3, (148.5 - a5ScaledHeight) / 2);

      // If generic blank requested, create 2 blank forms per page
      const studentList = students.length > 0 ? [...students] : [null, null];

      // Pair students: 2 per page
      for (let i = 0; i < studentList.length; i += 2) {
        if (i > 0) {
          doc.addPage();
        }

        const topStudent = studentList[i];
        // If odd number of students, the bottom slot gets a spare generic form so the half-page isn't wasted
        const bottomStudent = (i + 1 < studentList.length) ? studentList[i + 1] : null;

        // 1. Draw Top Optical Form
        await drawOMRSheet(doc, exam, topStudent, a5OffsetX, topOffsetY, a5Scale);

        // 2. Draw Center Cutting Guideline (at Y = 148.5mm)
        drawCuttingGuide(doc);

        // 3. Draw Bottom Optical Form
        await drawOMRSheet(doc, exam, bottomStudent, a5OffsetX, bottomOffsetY, a5Scale);
      }
    }

    return doc;
  }
};

function drawCuttingGuide(doc: jsPDF) {
  doc.setDrawColor(160, 174, 192);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([3, 2.5], 0);
  doc.line(6, 148.5, 204, 148.5);
  doc.setLineDashPattern([], 0); // reset line dash

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(130, 140, 155);
  doc.text('✂ - - - - - - - - - - - - - - - - - - - - - - - KESİM ÇİZGİSİ (A5 KESİM) - - - - - - - - - - - - - - - - - - - - - - - ✂', 105, 148.5 - 1.2, { align: 'center' });
}

async function drawOMRSheet(
  doc: jsPDF,
  exam: Exam,
  student: Student | null,
  originX: number = 0,
  originY: number = 0,
  scale: number = 1.0
) {
  // Coordinate and dimension scaling helpers
  const sx = (x: number) => originX + x * scale;
  const sy = (y: number) => originY + y * scale;
  const dim = (v: number) => v * scale;
  const fnt = (fs: number) => fs * scale;

  // 1. Top Left Header Box (OGRENCI BILGILERI)
  const headerX = 12;
  const headerY = 10;
  const headerWidth = 142;
  const headerHeight = 30;

  doc.setLineWidth(dim(0.5));
  doc.setDrawColor(0, 0, 0);
  doc.rect(sx(headerX), sy(headerY), dim(headerWidth), dim(headerHeight));

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fnt(10));
  doc.text(cleanPDFText('OGRENCI BILGILERI'), sx(headerX + 4), sy(headerY + 6));

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fnt(8.5));
  if (student) {
    doc.text(`Adi Soyadi: ${cleanPDFText(student.firstName)} ${cleanPDFText(student.lastName)}`, sx(headerX + 4), sy(headerY + 14));
    doc.text(`Ogrenci No: ${cleanPDFText(student.studentNo)}`, sx(headerX + 4), sy(headerY + 22));
    doc.text(`Sinifi: ${cleanPDFText(student.className)}`, sx(headerX + 65), sy(headerY + 22));
  } else {
    doc.text('Adi Soyadi: _________________________________', sx(headerX + 4), sy(headerY + 14));
    doc.text('Ogrenci No: [   ][   ][   ][   ]', sx(headerX + 4), sy(headerY + 22));
    doc.text('Sinifi: _________', sx(headerX + 65), sy(headerY + 22));
  }

  // Draw Optional Booklet Type (Kitapçık Türü A / B) if configured for this exam
  if (exam.hasBookletTypes) {
    const bkBoxX = headerX + 104;
    const bkBoxY = headerY + 4;
    doc.setLineWidth(dim(0.3));
    doc.setDrawColor(80, 80, 80);
    doc.roundedRect(sx(bkBoxX), sy(bkBoxY), dim(33), dim(22), dim(2), dim(2));

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fnt(7.5));
    doc.setTextColor(50, 50, 50);
    doc.text(cleanPDFText('KITAPCIK TURU'), sx(bkBoxX + 16.5), sy(bkBoxY + 5.5), { align: 'center' });

    // Bubble A
    doc.circle(sx(bkBoxX + 9), sy(bkBoxY + 14), dim(2.8));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fnt(7.5));
    doc.setTextColor(0, 0, 0);
    doc.text('A', sx(bkBoxX + 9), sy(bkBoxY + 15.2), { align: 'center' });

    // Bubble B
    doc.circle(sx(bkBoxX + 24), sy(bkBoxY + 14), dim(2.8));
    doc.text('B', sx(bkBoxX + 24), sy(bkBoxY + 15.2), { align: 'center' });
  }

  // 2. Top Right QR Code (Aligned cleanly at top right header)
  const qrBoxSize = 30; // 30x30mm
  const qrX = 168;
  const qrY = 10;

  const qrDataUrl = await qrService.generateOMRQRDataUrl(
    exam.id,
    student ? student.id : undefined,
    {
      examCode: exam.examCode,
      studentNo: student?.studentNo,
      instId: exam.institutionId,
      studentName: student ? `${student.firstName} ${student.lastName}` : undefined,
      layout: qrService.buildLayout(exam)
    }
  );
  doc.addImage(qrDataUrl, 'PNG', sx(qrX), sy(qrY), dim(qrBoxSize), dim(qrBoxSize));

  // Define Answer Section Geometry
  const answerLeft = 10;
  const answerRight = 200;
  const answerTop = 52;

  // 4. Instructions Text (Centered between Top L-Brackets)
  doc.setFontSize(fnt(7.5));
  doc.setTextColor(100, 100, 100);
  doc.text(
    cleanPDFText('DIKKAT: Cevaplarinizi yumusak kursun kalemle, baloncuklarin disina tasirmadan doldurunuz. Formu katlamayiniz.'),
    sx(105),
    sy(answerTop + 3.5),
    { align: 'center' }
  );
  doc.setTextColor(0, 0, 0);

  // 5. Draw Subject Columns & Question Grid Inside Answer Section
  const bodyStartY = answerTop + 8; // 60mm
  const availableWidth = answerRight - answerLeft - 16; // 174mm (from X=18 to X=192)
  const startX = answerLeft + 8; // 18mm

  const maxOptions = Math.max(...exam.subjects.map(s => s.optionCount || 5), 4);
  const minColWidth = maxOptions === 5 ? 43 : 38;
  const maxColsPerRow = Math.min(4, Math.max(1, Math.floor(availableWidth / minColWidth)));

  interface RenderColumn {
    subjectName: string;
    startQ: number;
    endQ: number;
    optionCount: number;
    totalQ: number;
    isSubCol: boolean;
    subColIndex: number;
    totalSubCols: number;
  }

  const renderColumns: RenderColumn[] = [];

  exam.subjects.forEach(sbj => {
    const optCount = sbj.optionCount || 5;
    const maxQPerCol = 20;
    if (sbj.questionCount <= maxQPerCol) {
      renderColumns.push({
        subjectName: sbj.name,
        startQ: 1,
        endQ: sbj.questionCount,
        optionCount: optCount,
        totalQ: sbj.questionCount,
        isSubCol: false,
        subColIndex: 0,
        totalSubCols: 1
      });
    } else {
      const numSubCols = Math.ceil(sbj.questionCount / maxQPerCol);
      for (let c = 0; c < numSubCols; c++) {
        const start = c * maxQPerCol + 1;
        const end = Math.min(sbj.questionCount, (c + 1) * maxQPerCol);
        renderColumns.push({
          subjectName: sbj.name,
          startQ: start,
          endQ: end,
          optionCount: optCount,
          totalQ: sbj.questionCount,
          isSubCol: true,
          subColIndex: c,
          totalSubCols: numSubCols
        });
      }
    }
  });

  const rows: RenderColumn[][] = [];
  for (let i = 0; i < renderColumns.length; i += maxColsPerRow) {
    rows.push(renderColumns.slice(i, i + maxColsPerRow));
  }

  let currentY = bodyStartY;

  rows.forEach((rowCols) => {
    const colsInThisRow = rowCols.length;
    const colWidth = availableWidth / colsInThisRow;

    const maxQuestionsInRow = Math.max(...rowCols.map(c => (c.endQ - c.startQ + 1)));
    const rowHeight = 7 + (maxQuestionsInRow * 6.5) + 6;

    rowCols.forEach((col, colIdx) => {
      const colX = startX + colIdx * colWidth;

      // Draw Subject Header Bar
      doc.setFillColor(238, 242, 248);
      doc.rect(sx(colX + 1), sy(currentY), dim(colWidth - 2), dim(6.5), 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fnt(8.5));

      const headerTitle = col.isSubCol
        ? `${cleanPDFText(col.subjectName)} (${col.startQ}-${col.endQ})`
        : cleanPDFText(col.subjectName);

      doc.text(headerTitle, sx(colX + colWidth / 2), sy(currentY + 4.5), { align: 'center' });

      // Draw Questions & Options
      let qY = currentY + 11.5;
      const optionLabels = col.optionCount === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];

      for (let q = col.startQ; q <= col.endQ; q++) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fnt(8));
        doc.text(`${q.toString().padStart(2, '0')}.`, sx(colX + 2), sy(qY + 1));

        const firstBubbleX = colX + 10;
        const bubbleSpacing = Math.min(6.2, (colWidth - 14) / col.optionCount);

        optionLabels.forEach((opt, optIdx) => {
          const bubbleX = firstBubbleX + optIdx * bubbleSpacing;

          doc.setLineWidth(dim(0.35));
          doc.setDrawColor(50, 50, 50);
          doc.circle(sx(bubbleX), sy(qY), dim(2.1), 'S');

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(fnt(6.5));
          doc.setTextColor(60, 60, 60);
          doc.text(opt, sx(bubbleX), sy(qY + 0.8), { align: 'center' });
        });

        qY += 6.5;
      }
    });

    currentY += rowHeight;
  });

  // 6. Draw 4 Solid Black Square Anchors (6x6 mm) for corners
  const answerBottom = currentY + 3;
  const squareSize = 6.0;

  doc.setFillColor(0, 0, 0);

  // Top-Left Anchor
  doc.rect(sx(answerLeft), sy(answerTop), dim(squareSize), dim(squareSize), 'F');
  // Top-Right Anchor
  doc.rect(sx(answerRight - squareSize), sy(answerTop), dim(squareSize), dim(squareSize), 'F');
  // Bottom-Left Anchor
  doc.rect(sx(answerLeft), sy(answerBottom - squareSize), dim(squareSize), dim(squareSize), 'F');
  // Bottom-Right Anchor
  doc.rect(sx(answerRight - squareSize), sy(answerBottom - squareSize), dim(squareSize), dim(squareSize), 'F');
}

/**
 * Utility to calculate the dynamic bottom Y position of the answer grid.
 * Shared with omrEngine to know where the fiducials should be mapped.
 */
export function getExamAnswerBottom(exam?: Exam): number {
  if (!exam) return 285;
  const answerTop = 52;
  const answerLeft = 10;
  const answerRight = 200;
  const bodyStartY = answerTop + 8; // 60mm
  const availableWidth = answerRight - answerLeft - 16;
  const maxOptions = Math.max(...exam.subjects.map(s => s.optionCount || 5), 4);
  const minColWidth = maxOptions === 5 ? 43 : 38;
  const maxColsPerRow = Math.min(4, Math.max(1, Math.floor(availableWidth / minColWidth)));

  const renderColumns: {startQ: number, endQ: number}[] = [];
  exam.subjects.forEach(sbj => {
    const maxQPerCol = 20;
    if (sbj.questionCount <= maxQPerCol) {
      renderColumns.push({ startQ: 1, endQ: sbj.questionCount });
    } else {
      const numSubCols = Math.ceil(sbj.questionCount / maxQPerCol);
      for (let c = 0; c < numSubCols; c++) {
        renderColumns.push({
          startQ: c * maxQPerCol + 1,
          endQ: Math.min(sbj.questionCount, (c + 1) * maxQPerCol)
        });
      }
    }
  });

  const rows: {startQ: number, endQ: number}[][] = [];
  for (let i = 0; i < renderColumns.length; i += maxColsPerRow) {
    rows.push(renderColumns.slice(i, i + maxColsPerRow));
  }

  let currentY = bodyStartY;
  rows.forEach((rowCols) => {
    const maxQuestionsInRow = Math.max(...rowCols.map(c => (c.endQ - c.startQ + 1)));
    currentY += 7 + (maxQuestionsInRow * 6.5) + 6;
  });

  return currentY + 3;
}
