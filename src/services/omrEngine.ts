import { Exam, ScanResult, ScannedAnswer, SubjectResult, Student, OMRQRData, OutcomeAnalysis } from '../types';
import { storageService } from './storageService';
import { qrService } from './qrService';
import { getExamAnswerBottom } from './pdfService';

export interface OMRScanResult {
  success: boolean;
  qrDetected: boolean;
  cornersAligned: boolean;
  qrData?: OMRQRData;
  detectedExam?: Exam;
  detectedStudent?: Student;
  result?: ScanResult;
  error?: string;
}

export const omrEngine = {
  /**
   * Performs lightweight, ultra-strict 4 L-corner alignment evaluation for real-time auto-scanning.
   * Requires ALL 4 L-corners to be explicitly verified on white paper.
   */
  checkAlignmentQuick: (grayData: Uint8Array, width: number, height: number, exam?: Exam): { aligned: boolean; corners: { TL: { x: number; y: number }; TR: { x: number; y: number }; BL: { x: number; y: number }; BR: { x: number; y: number } } } => {
    return findCornerFiducials(grayData, width, height, exam);
  },

  /**
   * Processes a video frame / canvas snapshot with shadow-resistant local contrast template matching:
   * 1. Detects white paper boundaries within the camera frame (ignoring table background/bezels).
   * 2. Locates physical 4 L-shaped black corner fiducials using solid ink centroid search.
   * 3. Maps optical paper grid using 4-point bilinear perspective transformation onto virtual template.
   * 4. Evaluates bubble marking using Shadow-Proof Local Relative Contrast (Local Paper vs. Bubble Core).
   * 5. Calculates correct, wrong, blank counts and total scores against the exam answer key.
   */
  processCanvas: async (
    canvas: HTMLCanvasElement,
    overrideExamId?: string,
    overrideStudentId?: string,
    preScannedQRData?: OMRQRData
  ): Promise<OMRScanResult> => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { success: false, qrDetected: false, cornersAligned: false, error: 'Canvas context not available' };
    }

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);

    // Convert Canvas RGBA image data to Grayscale Array
    const grayData = new Uint8Array(width * height);
    const pixels = imageData.data;
    let totalLuminance = 0;
    for (let i = 0; i < grayData.length; i++) {
      const r = pixels[i * 4];
      const g = pixels[i * 4 + 1];
      const b = pixels[i * 4 + 2];
      const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      grayData[i] = lum;
      totalLuminance += lum;
    }

    const avgLuminance = totalLuminance / grayData.length;

    // Validation 1: Paper Whiteness Check
    if (avgLuminance < 80) {
      return {
        success: false,
        qrDetected: false,
        cornersAligned: false,
        error: 'Optik kağıt algılanamadı. Kamera görüntüsü karanlık veya kağıt kadrajda değil.'
      };
    }

    // Step 1: Decode QR Code Payload (or fallback to preScannedQRData / overrideExamId)
    const decodedQR = qrService.decodeQRCodeFromImageData(imageData);
    const qrData = decodedQR || preScannedQRData || (overrideExamId ? {
      examId: overrideExamId,
      studentId: overrideStudentId || 'GENERIC',
      timestamp: Date.now(),
      version: '2.0'
    } : null);

    const qrDetected = !!decodedQR || !!preScannedQRData;

    if (!qrData || !qrData.examId) {
      return {
        success: false,
        qrDetected: false,
        cornersAligned: false,
        error: 'Sınav bilgisi doğrulanamadı. Lütfen Stage 1\'de karekodu tarayın veya dikey optik çerçevesini hizalayın.'
      };
    }

    const examId = qrData.examId;
    const studentId = qrData.studentId || overrideStudentId;

    const allExams = storageService.getExams();
    let exam = storageService.getExamById(examId) ||
      allExams.find(e => e.examCode === qrData.examCode || e.id === examId) ||
      (overrideExamId ? storageService.getExamById(overrideExamId) : undefined) ||
      (qrData.examId ? qrService.examFromQR(qrData) : undefined);

    if (!exam) {
      return {
        success: false,
        qrDetected,
        cornersAligned: false,
        qrData: qrData || undefined,
        error: `Sınav bilgisi sistemde bulunamadı (ID: ${examId})`
      };
    }

    // Ensure the exam is registered in storage so it always appears in Exams and Results lists
    if (!storageService.getExamById(exam.id)) {
      storageService.addExam(exam);
    }

    // Step 2: Detect the 4 solid black corner anchor squares
    const cornerResult = findCornerFiducials(grayData, width, height, exam);
    const cornersAligned = cornerResult.aligned;

    if (!cornersAligned) {
      return {
        success: false,
        qrDetected,
        cornersAligned: false,
        qrData: qrData || undefined,
        detectedExam: exam,
        error: 'Cevap alanının 4 köşesindeki siyah kareler bulunamadı. Kağıdın tamamını kadraja alıp sabit tutun.'
      };
    }

    // Resolve Student from QR code studentId, studentNo or institution
    let student: Student | undefined;
    const currentUser = storageService.getCurrentUser();
    const effectiveInstId = (currentUser && currentUser.institutionId) 
      ? currentUser.institutionId 
      : (qrData?.instId && qrData.instId !== 'ALL' && qrData.instId !== 'SYSTEM'
          ? qrData.instId
          : (exam.institutionId !== 'ALL' && exam.institutionId !== 'SYSTEM' ? exam.institutionId : undefined));

    const instStudents = storageService.getStudents(effectiveInstId);
    const globalStudents = storageService.getStudents();

    if (studentId && studentId !== 'GENERIC') {
      student = instStudents.find(s => s.id === studentId) || globalStudents.find(s => s.id === studentId);
    }
    if (!student && qrData?.studentNo) {
      student = instStudents.find(s => s.studentNo === qrData.studentNo) || globalStudents.find(s => s.studentNo === qrData.studentNo);
    }
    if (!student && (qrData?.studentName || qrData?.studentNo)) {
      const finalInst = effectiveInstId || (qrData?.instId && qrData.instId !== 'ALL' && qrData.instId !== 'SYSTEM' ? qrData.instId : exam.institutionId) || 'inst-1';
      student = {
        id: qrData.studentId || `std-${qrData.studentNo || Date.now()}`,
        institutionId: finalInst,
        classId: 'cls-101',
        className: 'Genel',
        studentNo: qrData.studentNo || '101',
        firstName: qrData.studentName ? qrData.studentName.split(' ')[0] : 'Öğrenci',
        lastName: qrData.studentName ? qrData.studentName.split(' ').slice(1).join(' ') || '' : (qrData.studentNo || '101')
      };
      storageService.addStudent(student);
    }

    if (!student) {
      const existingResults = storageService.getAllScanResults().filter(r => r.examId === exam.id);
      const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
      const scanCount = existingResults.length + 1;
      const finalInst = effectiveInstId || (qrData?.instId && qrData.instId !== 'ALL' && qrData.instId !== 'SYSTEM' ? qrData.instId : exam.institutionId) || 'inst-1';
      student = {
        id: `std-opt-${Date.now()}-${uniqueSuffix}`,
        institutionId: finalInst,
        classId: 'cls-101',
        className: 'Genel',
        studentNo: `${scanCount}-${uniqueSuffix}`,
        firstName: 'Öğrenci',
        lastName: `#${scanCount}`
      };
    }

    // Helper: Exact Homography Matrix mapping from a theoretical quad (TL, TR, BR, BL) to camera pixels
    const createPerspectiveTransform = (TL: {x:number, y:number}, TR: {x:number, y:number}, BR: {x:number, y:number}, BL: {x:number, y:number}) => {
      const x0 = TL.x, y0 = TL.y;
      const x1 = TR.x, y1 = TR.y;
      const x2 = BR.x, y2 = BR.y;
      const x3 = BL.x, y3 = BL.y;
      const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
      const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
      const det = dx1 * dy2 - dy1 * dx2;
      let a, b, c, d, e, f, g, h;
      if (det === 0) {
        a = x1 - x0; b = x3 - x0; c = x0;
        d = y1 - y0; e = y3 - y0; f = y0;
        g = 0; h = 0;
      } else {
        g = (dx3 * dy2 - dy3 * dx2) / det;
        h = (dx1 * dy3 - dy1 * dx3) / det;
        a = x1 - x0 + g * x1;
        b = x3 - x0 + h * x3;
        c = x0;
        d = y1 - y0 + g * y1;
        e = y3 - y0 + h * y3;
        f = y0;
      }
      return (u: number, v: number) => {
        const den = g * u + h * v + 1;
        return { x: Math.round((a * u + b * v + c) / den), y: Math.round((d * u + e * v + f) / den) };
      };
    };

    // Step 3: Virtual OMR Grid Overlay & Perspective Map using Homography
    const corners = cornerResult.corners;
    const perspectiveMap = createPerspectiveTransform(corners.TL, corners.TR, corners.BR, corners.BL);
    const dist = (p: { x: number; y: number }, q: { x: number; y: number }) => Math.hypot(p.x - q.x, p.y - q.y);
    // Anchor centroids are 184mm apart horizontally (x=13mm → x=197mm)
    const pixelsPerMm = (dist(corners.TL, corners.TR) + dist(corners.BL, corners.BR)) / 2 / 184;

    const answers: ScannedAnswer[] = [];
    const subjectResults: SubjectResult[] = [];

    let totalCorrect = 0;
    let totalWrong = 0;
    let totalEmpty = 0;

    const penaltyRatio = exam.netPenaltyRatio !== undefined ? exam.netPenaltyRatio : 4;

    ctx.lineWidth = 2.5;

    // Answer Section Canonical Geometry Parameters (pdfService.ts match)
    const startX = 18; // 18mm
    const availableWidth = 174; // 174mm (from X=18 to X=192)
    const bodyStartY = 60; // 60mm

    const maxOptions = Math.max(...exam.subjects.map(s => s.optionCount || 5), 4);
    const minColWidth = maxOptions === 5 ? 43 : 38;
    const maxColsPerRow = Math.min(4, Math.max(1, Math.floor(availableWidth / minColWidth)));

    interface RenderColumn {
      subjectIndex: number;
      subjectName: string;
      startQ: number;
      endQ: number;
      optionCount: number;
    }

    const renderColumns: RenderColumn[] = [];
    exam.subjects.forEach((sbj, subIdx) => {
      const optCount = sbj.optionCount || 5;
      const maxQPerCol = 20;
      if (sbj.questionCount <= maxQPerCol) {
        renderColumns.push({
          subjectIndex: subIdx,
          subjectName: sbj.name,
          startQ: 1,
          endQ: sbj.questionCount,
          optionCount: optCount
        });
      } else {
        const numSubCols = Math.ceil(sbj.questionCount / maxQPerCol);
        for (let c = 0; c < numSubCols; c++) {
          renderColumns.push({
            subjectIndex: subIdx,
            subjectName: sbj.name,
            startQ: c * maxQPerCol + 1,
            endQ: Math.min(sbj.questionCount, (c + 1) * maxQPerCol),
            optionCount: optCount
          });
        }
      }
    });

    const rows: RenderColumn[][] = [];
    for (let i = 0; i < renderColumns.length; i += maxColsPerRow) {
      rows.push(renderColumns.slice(i, i + maxColsPerRow));
    }

    exam.subjects.forEach((subject, subIdx) => {
      let subCorrect = 0;
      let subWrong = 0;
      let subEmpty = 0;

      const subjectCols = renderColumns.filter(c => c.subjectIndex === subIdx);

      subjectCols.forEach(col => {
        let rowIdx = 0;
        let colIdxInRow = 0;
        rows.forEach((r, rIndex) => {
          const foundIndex = r.indexOf(col);
          if (foundIndex !== -1) {
            rowIdx = rIndex;
            colIdxInRow = foundIndex;
          }
        });

        let rowY_mm = bodyStartY;
        for (let r = 0; r < rowIdx; r++) {
          const maxQ = Math.max(...rows[r].map(c => (c.endQ - c.startQ + 1)));
          rowY_mm += 7 + (maxQ * 6.5) + 6;
        }

        const colsInThisRow = rows[rowIdx].length;
        const colWidth_mm = availableWidth / colsInThisRow;
        const colX_mm = startX + colIdxInRow * colWidth_mm;

        const optionCount = col.optionCount;
        const optionLabels = optionCount === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];
        const firstBubbleX_mm = colX_mm + 10;
        const bubbleSpacing_mm = Math.min(6.2, (colWidth_mm - 14) / optionCount);

        for (let q = col.startQ; q <= col.endQ; q++) {
          const qNum = q;
          const qY_mm = rowY_mm + 11.5 + (q - col.startQ) * 6.5;
          const isBookletB = qrData?.bookletType === 'B';
          const correctAnswer = (isBookletB && subject.correctAnswersB?.[q - 1])
            ? subject.correctAnswersB[q - 1]
            : (subject.correctAnswers[q - 1] || 'A');

          const optionContrasts: { opt: string; contrast: number; inner: number; outer: number; ratio: number; fill: number; px: number; py: number }[] = [];

          optionLabels.forEach((opt, optIdx) => {
            const bubbleX_mm = firstBubbleX_mm + optIdx * bubbleSpacing_mm;

            // Solid 6x6mm square theoretical centroids are offset by +3mm from their top-left edges.
            // TL outer corner is (10, 52), so centroid is (13, 55).
            // TR outer corner is (194, 52), so centroid is (197, 55).
            const answerBottom = getExamAnswerBottom(exam);
            const u = (bubbleX_mm - 13) / (197 - 13);
            const v = (qY_mm - 55) / ((answerBottom - 3) - 55);

            // True Homography projection resolves all non-linear perspective warping!
            const { x: px, y: py } = perspectiveMap(u, v);

            // Measure how much of the bubble interior is dark relative to the local paper brightness
            const result = measureBubbleContrast(grayData, width, height, px, py, pixelsPerMm);
            const ratio = result.outer > 0 ? result.inner / result.outer : 1.0;
            optionContrasts.push({ opt, contrast: result.contrast, inner: result.inner, outer: result.outer, ratio, fill: result.fill, px, py });
          });

          // Rank options in this row by fill fraction
          const sorted = [...optionContrasts].sort((a, b) => b.fill - a.fill);
          const top1 = sorted[0];
          const top2 = sorted[1];

          // Row baseline: median fill of the options (empty bubbles only contain the printed letter, ~0.05 - 0.13)
          const fills = optionContrasts.map(o => o.fill).sort((a, b) => a - b);
          const medianFill = fills[Math.floor(fills.length / 2)];

          // Solid mark: fill >= 0.38
          // Faint mark: fill >= 0.17 AND at least 1.55x the median of empty bubbles
          const isSolid = (f: number) => f >= 0.38;
          const isFaint = (f: number) => f >= 0.17 && f >= medianFill * 1.55 + 0.03;
          const isCandidate = (f: number) => isSolid(f) || isFaint(f);

          const filledOptions: string[] = [];
          let isUncertain = false;

          if (isCandidate(top1.fill)) {
            // Flag as uncertain if the mark is faint (< 0.38)
            if (!isSolid(top1.fill)) {
              isUncertain = true;
            }

            if (isCandidate(top2.fill)) {
              // Erasure distinction: if top1 is noticeably darker than top2, top2 is an erased mark
              if (top1.fill >= top2.fill * 1.45 || (top1.fill - top2.fill) >= 0.16) {
                filledOptions.push(top1.opt);
                // Also flag as uncertain because of the erasure trace
                isUncertain = true;
              } else {
                // Genuine double mark
                filledOptions.push(top1.opt);
                filledOptions.push(top2.opt);
                isUncertain = true;
              }
            } else {
              filledOptions.push(top1.opt);
            }
          }

          optionContrasts.forEach(item => {
            const isFilled = filledOptions.includes(item.opt);

            if (isFilled) {
              const isWarning = isUncertain || filledOptions.length > 1;
              ctx.strokeStyle = isWarning ? '#f59e0b' : '#10b981'; // Amber for faint/uncertain/multiple, Emerald for solid mark
              ctx.fillStyle = isWarning ? 'rgba(245, 158, 11, 0.45)' : 'rgba(16, 185, 129, 0.45)';
            } else {
              ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)'; // Red ring for empty
              ctx.fillStyle = 'rgba(239, 68, 68, 0.0)';
            }

            // Visual debug rings: show EXACTLY where the engine looked
            ctx.lineWidth = Math.max(1.5, pixelsPerMm * 0.35);
            ctx.beginPath();
            ctx.arc(item.px, item.py, Math.max(4, pixelsPerMm * 2.3), 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
          });

          let selectedOption: string | null = null;
          let isCorrect = false;
          let isBlank = false;

          if (filledOptions.length === 0) {
            isBlank = true;
            subEmpty++;
          } else if (filledOptions.length === 1) {
            selectedOption = filledOptions[0];
            if (selectedOption === correctAnswer) {
              isCorrect = true;
              subCorrect++;
            } else {
              subWrong++;
            }
          } else {
            selectedOption = 'MULTIPLE';
            subWrong++;
          }

          const outcome = subject.learningOutcomes?.[q - 1] || '';

          answers.push({
            subjectName: subject.name,
            questionNumber: qNum,
            selectedOption,
            correctAnswer,
            isCorrect,
            isBlank,
            isUncertain,
            learningOutcome: outcome
          });
        }
      });

      const subNet = penaltyRatio > 0
        ? Math.max(0, parseFloat((subCorrect - subWrong / penaltyRatio).toFixed(2)))
        : subCorrect;

      totalCorrect += subCorrect;
      totalWrong += subWrong;
      totalEmpty += subEmpty;

      subjectResults.push({
        subjectName: subject.name,
        correctCount: subCorrect,
        wrongCount: subWrong,
        emptyCount: subEmpty,
        netCount: subNet
      });
    });

    const totalNet = penaltyRatio > 0
      ? Math.max(0, parseFloat((totalCorrect - totalWrong / penaltyRatio).toFixed(2)))
      : totalCorrect;

    const totalMaxQuestions = exam.totalQuestions || 40;
    const totalScore = parseFloat(((totalNet / totalMaxQuestions) * 500).toFixed(2));

    const outcomeAnalyses = computeOutcomeAnalyses(exam, answers);

    const finalResultInstId = (currentUser && currentUser.institutionId)
      ? currentUser.institutionId
      : (qrData?.instId && qrData.instId !== 'ALL' && qrData.instId !== 'SYSTEM'
          ? qrData.instId
          : (student.institutionId || (exam.institutionId !== 'ALL' && exam.institutionId !== 'SYSTEM' ? exam.institutionId : 'inst-1')));

    // Generate optimized lightweight preview thumbnail (max 480px width, JPEG 0.5)
    // to prevent browser localStorage quota exceeded and Firebase payload timeouts
    let previewThumbnail = '';
    try {
      const thumbCanvas = document.createElement('canvas');
      const thumbWidth = Math.min(480, canvas.width);
      const thumbHeight = Math.round((thumbWidth / canvas.width) * canvas.height);
      thumbCanvas.width = thumbWidth;
      thumbCanvas.height = thumbHeight;
      const thumbCtx = thumbCanvas.getContext('2d');
      if (thumbCtx) {
        thumbCtx.drawImage(canvas, 0, 0, thumbWidth, thumbHeight);
        previewThumbnail = thumbCanvas.toDataURL('image/jpeg', 0.5);
      }
    } catch {
      // fallback without blocking scan
    }

    const resultData: ScanResult = {
      id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      examId: exam.id,
      examTitle: exam.title,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      studentNo: student.studentNo,
      className: student.className,
      institutionId: finalResultInstId,
      scannedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      bookletType: (qrData?.bookletType as 'A' | 'B') || 'A',
      totalCorrect,
      totalWrong,
      totalEmpty,
      totalNet,
      totalScore,
      subjectResults,
      answers,
      outcomeAnalyses,
      rawImageBase64: previewThumbnail
    };

    return {
      success: true,
      qrDetected,
      cornersAligned: true,
      qrData: qrData || undefined,
      detectedExam: exam,
      detectedStudent: student,
      result: resultData
    };
  }
};

type Pt = { x: number; y: number };

interface DarkBlob {
  area: number;
  cx: number;
  cy: number;
  bw: number;
  bh: number;
}

/**
 * Locates the 4 solid black 6x6mm anchor squares around the answer area.
 *
 * Robust approach (independent of lighting and of what is around the paper):
 * 1. Downscale + adaptive (local-mean) threshold → dark pixels relative to their neighbourhood.
 * 2. Connected components → keep only solid, roughly square blobs surrounded by bright paper.
 * 3. Try every combination of 4 candidates and keep the largest quad whose geometry matches the
 *    printed form (similar anchor sizes, parallel-ish sides, expected aspect ratio, anchor size
 *    relative to quad width). Bubbles, text, QR modules and timing marks are rejected.
 * Returned corners are the anchor CENTROIDS (paper coords: (13,55) (197,55) (13,B-3) (197,B-3)).
 */
function findCornerFiducials(grayData: Uint8Array, width: number, height: number, exam?: Exam) {
  const answerBottom = getExamAnswerBottom(exam);
  const notFound = {
    aligned: false,
    corners: {
      TL: { x: 0, y: 0 },
      TR: { x: width - 1, y: 0 },
      BL: { x: 0, y: height - 1 },
      BR: { x: width - 1, y: height - 1 }
    }
  };

  // 1. Box-average downscale so the longest side is ~800px
  const scale = Math.max(1, Math.round(Math.max(width, height) / 800));
  const w = Math.floor(width / scale);
  const h = Math.floor(height / scale);
  if (w < 50 || h < 50) return notFound;

  const small = new Uint8Array(w * h);
  const s2 = scale * scale;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      const baseY = y * scale;
      const baseX = x * scale;
      for (let dy = 0; dy < scale; dy++) {
        const row = (baseY + dy) * width + baseX;
        for (let dx = 0; dx < scale; dx++) sum += grayData[row + dx];
      }
      small[y * w + x] = sum / s2;
    }
  }

  // 2. Integral image → adaptive threshold (pixel darker than 60% of its local mean)
  const W1 = w + 1;
  const integral = new Uint32Array(W1 * (h + 1));
  for (let y = 0; y < h; y++) {
    let rowSum = 0;
    for (let x = 0; x < w; x++) {
      rowSum += small[y * w + x];
      integral[(y + 1) * W1 + x + 1] = integral[y * W1 + x + 1] + rowSum;
    }
  }
  const boxMean = (x0: number, y0: number, x1: number, y1: number) => {
    // inclusive-exclusive box [x0,x1) x [y0,y1)
    const s = integral[y1 * W1 + x1] - integral[y0 * W1 + x1] - integral[y1 * W1 + x0] + integral[y0 * W1 + x0];
    return s / Math.max(1, (x1 - x0) * (y1 - y0));
  };

  const half = Math.max(8, Math.round(Math.min(w, h) / 16));
  const binary = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - half);
    const y1 = Math.min(h, y + half + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - half);
      const x1 = Math.min(w, x + half + 1);
      const mean = boxMean(x0, y0, x1, y1);
      if (mean > 50 && small[y * w + x] < mean * 0.6) binary[y * w + x] = 1;
    }
  }

  // 3. Connected components (4-connectivity)
  const visited = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  const maxSide = Math.max(w, h) / 8;
  const candidates: DarkBlob[] = [];

  for (let start = 0; start < w * h; start++) {
    if (!binary[start] || visited[start]) continue;
    let sp = 0;
    stack[sp++] = start;
    visited[start] = 1;
    let area = 0, sumX = 0, sumY = 0;
    let minX = w, maxX = 0, minY = h, maxY = 0;

    while (sp > 0) {
      const idx = stack[--sp];
      const px = idx % w;
      const py = (idx - px) / w;
      area++;
      sumX += px;
      sumY += py;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;

      if (px > 0 && binary[idx - 1] && !visited[idx - 1]) { visited[idx - 1] = 1; stack[sp++] = idx - 1; }
      if (px < w - 1 && binary[idx + 1] && !visited[idx + 1]) { visited[idx + 1] = 1; stack[sp++] = idx + 1; }
      if (py > 0 && binary[idx - w] && !visited[idx - w]) { visited[idx - w] = 1; stack[sp++] = idx - w; }
      if (py < h - 1 && binary[idx + w] && !visited[idx + w]) { visited[idx + w] = 1; stack[sp++] = idx + w; }
    }

    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    if (area < 9 || bw < 3 || bh < 3 || bw > maxSide || bh > maxSide) continue;
    const aspect = bw / bh;
    if (aspect < 0.55 || aspect > 1.8) continue;
    if (area / (bw * bh) < 0.6) continue; // must be a SOLID blob (rejects text, rings, QR clusters)

    // Must be surrounded by bright paper: check a ring around the bounding box
    const m = Math.max(2, Math.round(Math.max(bw, bh) * 0.6));
    const rx0 = Math.max(0, minX - m), ry0 = Math.max(0, minY - m);
    const rx1 = Math.min(w, maxX + 1 + m), ry1 = Math.min(h, maxY + 1 + m);
    if (rx0 === 0 || ry0 === 0 || rx1 === w || ry1 === h) continue; // touching frame edge
    const outerSum = boxMean(rx0, ry0, rx1, ry1) * (rx1 - rx0) * (ry1 - ry0);
    const innerSum = boxMean(minX, minY, maxX + 1, maxY + 1) * bw * bh;
    const ringArea = (rx1 - rx0) * (ry1 - ry0) - bw * bh;
    const ringMean = (outerSum - innerSum) / Math.max(1, ringArea);
    const blobMean = innerSum / (bw * bh);
    if (ringMean < 90 || ringMean - blobMean < 45) continue;

    candidates.push({ area, cx: sumX / area + 0.5, cy: sumY / area + 0.5, bw, bh });
  }

  if (candidates.length < 4) return notFound;

  // 4. Pick the best geometric combination of 4 candidates
  candidates.sort((a, b) => b.area - a.area);
  const pool = candidates.slice(0, 14);
  const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
  const expectedAspect = (answerBottom - 3 - 55) / 184; // vertical / horizontal centroid spacing
  const expectedSizeRatio = 6 / 184;

  let best: { score: number; TL: DarkBlob; TR: DarkBlob; BL: DarkBlob; BR: DarkBlob } | null = null;
  const n = pool.length;

  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      for (let c = b + 1; c < n; c++) {
        for (let d = c + 1; d < n; d++) {
          const quad = [pool[a], pool[b], pool[c], pool[d]];
          const areas = quad.map(q => q.area);
          if (Math.max(...areas) / Math.min(...areas) > 2.5) continue;

          const byY = [...quad].sort((p, q) => p.cy - q.cy);
          const [TL, TR] = byY[0].cx <= byY[1].cx ? [byY[0], byY[1]] : [byY[1], byY[0]];
          const [BL, BR] = byY[2].cx <= byY[3].cx ? [byY[2], byY[3]] : [byY[3], byY[2]];
          const pTL = { x: TL.cx, y: TL.cy }, pTR = { x: TR.cx, y: TR.cy };
          const pBL = { x: BL.cx, y: BL.cy }, pBR = { x: BR.cx, y: BR.cy };

          const wT = dist(pTL, pTR), wB = dist(pBL, pBR);
          const hL = dist(pTL, pBL), hR = dist(pTR, pBR);
          if (wT < 20 || wB < 20 || hL < 20 || hR < 20) continue;
          if (wT / wB < 0.7 || wT / wB > 1.45 || hL / hR < 0.7 || hL / hR > 1.45) continue;

          // Parallelism checks: opposing edges must point in roughly the same direction
          const vTop = { x: pTR.x - pTL.x, y: pTR.y - pTL.y };
          const vBottom = { x: pBR.x - pBL.x, y: pBR.y - pBL.y };
          const dotTB = (vTop.x * vBottom.x + vTop.y * vBottom.y) / (wT * wB);
          if (dotTB < 0.85) continue;

          const vLeft = { x: pBL.x - pTL.x, y: pBL.y - pTL.y };
          const vRight = { x: pBR.x - pTR.x, y: pBR.y - pTR.y };
          const dotLR = (vLeft.x * vRight.x + vLeft.y * vRight.y) / (hL * hR);
          if (dotLR < 0.85) continue;

          // Corner angles should be roughly perpendicular (within ~25 degrees of 90°)
          const dotCorner = Math.abs(vTop.x * vLeft.x + vTop.y * vLeft.y) / (wT * hL);
          if (dotCorner > 0.42) continue;

          const measuredAspect = ((hL + hR) / 2) / ((wT + wB) / 2);
          const aspectRel = measuredAspect / expectedAspect;
          if (aspectRel < 0.8 || aspectRel > 1.25) continue;

          const meanSide = Math.sqrt(areas.reduce((s, v) => s + v, 0) / 4);
          const sizeRatio = meanSide / ((wT + wB) / 2);
          const sizeRel = sizeRatio / expectedSizeRatio;
          if (sizeRel < 0.6 || sizeRel > 1.6) continue;

          // Convexity: TL → TR → BR → BL must turn consistently
          const pts = [pTL, pTR, pBR, pBL];
          let sign = 0, convex = true;
          for (let i = 0; i < 4; i++) {
            const p0 = pts[i], p1 = pts[(i + 1) % 4], p2 = pts[(i + 2) % 4];
            const cross = (p1.x - p0.x) * (p2.y - p1.y) - (p1.y - p0.y) * (p2.x - p1.x);
            const s = Math.sign(cross);
            if (s === 0) { convex = false; break; }
            if (sign === 0) sign = s; else if (s !== sign) { convex = false; break; }
          }
          if (!convex) continue;

          // Geometric fitness score: high area, penalized heavily if aspect ratio or size ratio deviates
          const geoError = Math.abs(Math.log(aspectRel)) * 4 +
                           Math.abs(Math.log(sizeRel)) * 2 +
                           Math.abs(Math.log(wT / wB)) +
                           Math.abs(Math.log(hL / hR)) +
                           (1 - dotTB) * 3 +
                           (1 - dotLR) * 3 +
                           dotCorner * 2;

          const areaScore = (wT + wB) * (hL + hR);
          const score = areaScore / (1 + geoError * 3);

          if (!best || score > best.score) best = { score, TL, TR, BL, BR };
        }
      }
    }
  }

  if (!best) return notFound;

  const toFull = (bl: DarkBlob): Pt => ({ x: bl.cx * scale, y: bl.cy * scale });
  return {
    aligned: true,
    corners: {
      TL: toFull(best.TL),
      TR: toFull(best.TR),
      BL: toFull(best.BL),
      BR: toFull(best.BR)
    }
  };
}

/**
 * Measures how much of a bubble's interior is filled.
 * - outer: mean brightness of the paper ring just outside the printed bubble (2.7–3.1mm)
 * - fill:  fraction of interior pixels (r ≤ 1.4mm) darker than 63% of that local paper brightness
 * Fixed geometric probing prevents false positive latching on empty printed letters.
 */
function measureBubbleContrast(
  grayData: Uint8Array,
  width: number,
  height: number,
  cx: number,
  cy: number,
  pixelsPerMm: number
): { contrast: number; inner: number; outer: number; fill: number } {
  const ppm = Math.max(1, pixelsPerMm);
  const innerR = Math.max(2, ppm * 1.4);
  const outerMinR = Math.max(innerR + 2, ppm * 2.7);
  const outerMaxR = Math.max(outerMinR + 1, ppm * 3.1);

  let outerSum = 0, outerCount = 0;
  const R = Math.ceil(outerMaxR);
  for (let dy = -R; dy <= R; dy++) {
    for (let dx = -R; dx <= R; dx++) {
      const r2 = dx * dx + dy * dy;
      if (r2 < outerMinR * outerMinR || r2 > outerMaxR * outerMaxR) continue;
      const px = Math.round(cx + dx), py = Math.round(cy + dy);
      if (px < 0 || px >= width || py < 0 || py >= height) continue;
      outerSum += grayData[py * width + px];
      outerCount++;
    }
  }
  const outer = outerCount > 0 ? outerSum / outerCount : 255;
  const darkThreshold = outer * 0.63;

  let innerSum = 0, innerCount = 0, darkCount = 0;
  const r = Math.ceil(innerR);
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > innerR * innerR) continue;
      const px = Math.round(cx + dx), py = Math.round(cy + dy);
      if (px < 0 || px >= width || py < 0 || py >= height) continue;
      const v = grayData[py * width + px];
      innerSum += v;
      innerCount++;
      if (v < darkThreshold) darkCount++;
    }
  }
  const inner = innerCount > 0 ? innerSum / innerCount : 255;

  return {
    contrast: Math.max(0, outer - inner),
    inner,
    outer,
    fill: innerCount > 0 ? darkCount / innerCount : 0
  };
}

/**
 * Computes outcome analysis metrics from answers and exam configuration.
 */
export function computeOutcomeAnalyses(exam: Exam, answers: ScannedAnswer[]): OutcomeAnalysis[] {
  const outcomeMap = new Map<string, {
    subjectName: string;
    outcome: string;
    total: number;
    correct: number;
    wrong: number;
    empty: number;
  }>();

  answers.forEach(ans => {
    let outcome = ans.learningOutcome;
    if (!outcome) {
      const sub = exam.subjects?.find(s => s.name === ans.subjectName);
      if (sub && sub.learningOutcomes && sub.learningOutcomes[ans.questionNumber - 1]) {
        outcome = sub.learningOutcomes[ans.questionNumber - 1];
      }
    }
    if (!outcome || !outcome.trim()) return;

    const key = `${ans.subjectName}:::${outcome.trim()}`;
    if (!outcomeMap.has(key)) {
      outcomeMap.set(key, {
        subjectName: ans.subjectName,
        outcome: outcome.trim(),
        total: 0,
        correct: 0,
        wrong: 0,
        empty: 0
      });
    }
    const item = outcomeMap.get(key)!;
    item.total++;
    if (ans.isCorrect) item.correct++;
    else if (ans.isBlank) item.empty++;
    else item.wrong++;
  });

  const list: OutcomeAnalysis[] = [];
  outcomeMap.forEach(item => {
    const rate = item.total > 0 ? parseFloat(((item.correct / item.total) * 100).toFixed(1)) : 0;
    let status: 'SUCCESS' | 'WARNING' | 'DANGER' = 'SUCCESS';
    if (rate < 50) status = 'DANGER';
    else if (rate < 80) status = 'WARNING';

    list.push({
      subjectName: item.subjectName,
      outcome: item.outcome,
      totalQuestions: item.total,
      correctCount: item.correct,
      wrongCount: item.wrong,
      emptyCount: item.empty,
      successRate: rate,
      status
    });
  });

  return list;
}

