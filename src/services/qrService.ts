import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { Exam, OMRQRData, OMRQRLayoutSubject } from '../types';

export const qrService = {
  /**
   * Generates a Data URL string (PNG) for an OMR QR code containing exam and student identifiers.
   * The payload uses short keys and also embeds the exam LAYOUT (subjects, question/option counts
   * and answer key) so that any device can rebuild the exact answer grid, even if the exam is not
   * stored in that device's local storage.
   */
  generateOMRQRDataUrl: async (
    examId: string,
    studentId?: string,
    extraInfo?: {
      examCode?: string;
      studentNo?: string;
      instId?: string;
      studentName?: string;
      layout?: OMRQRLayoutSubject[];
    }
  ): Promise<string> => {
    const payload: Record<string, unknown> = { e: examId };
    if (studentId) payload.s = studentId;
    if (extraInfo?.examCode) payload.c = extraInfo.examCode;
    if (extraInfo?.studentNo) payload.sn = extraInfo.studentNo;
    if (extraInfo?.instId) payload.i = extraInfo.instId;
    if (extraInfo?.studentName) payload.n = extraInfo.studentName;
    if (extraInfo?.layout && extraInfo.layout.length > 0) {
      payload.L = extraInfo.layout.map(l => [l.n, l.q, l.o, l.k]);
    }

    const jsonString = JSON.stringify(payload);
    try {
      return await QRCode.toDataURL(jsonString, {
        errorCorrectionLevel: 'L',
        margin: 2,
        width: 500,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    } catch (err) {
      console.error('QR code generation error:', err);
      throw err;
    }
  },

  /** Builds the compact layout description of an exam for embedding into the QR code. */
  buildLayout: (exam: Exam): OMRQRLayoutSubject[] =>
    exam.subjects.map(s => ({
      n: s.name,
      q: s.questionCount,
      o: s.optionCount || 5,
      k: Array.from({ length: s.questionCount }, (_, i) => (s.correctAnswers?.[i] || '-').charAt(0) || '-').join('')
    })),

  /**
   * Reconstructs an Exam object from QR data (used when the exam is not in local storage).
   * Uses the embedded layout when available; otherwise falls back to a generic 2x20 layout.
   */
  examFromQR: (qrData: OMRQRData): Exam => {
    const subjects = qrData.layout && qrData.layout.length > 0
      ? qrData.layout.map((l, idx) => ({
          id: `sbj-${idx + 1}`,
          name: l.n,
          questionCount: l.q,
          optionCount: l.o || 5,
          correctAnswers: Array.from({ length: l.q }, (_, i) => {
            const ch = (l.k || '').charAt(i);
            return ch && ch !== '-' ? ch : '';
          })
        }))
      : [
          { id: 'sbj-1', name: 'Türkçe', questionCount: 20, optionCount: 5, correctAnswers: Array(20).fill('A') },
          { id: 'sbj-2', name: 'Matematik', questionCount: 20, optionCount: 5, correctAnswers: Array(20).fill('A') }
        ];

    return {
      id: qrData.examId,
      institutionId: qrData.instId || 'inst-1',
      institutionName: 'Genel Kurum',
      title: qrData.examTitle || `Sınav (${qrData.examCode || qrData.examId})`,
      examCode: qrData.examCode || 'OPT-001',
      date: new Date().toISOString().split('T')[0],
      totalQuestions: subjects.reduce((sum, s) => sum + s.questionCount, 0),
      netPenaltyRatio: 4,
      totalExamsScanned: 0,
      isStudentSpecific: false,
      createdAt: new Date().toISOString(),
      subjects
    };
  },

  /**
   * Scans image pixel buffer (RGBA ImageData) to detect OMR QR Code.
   * Supports both full JSON payload and compact/legacy formats.
   */
  decodeQRCodeFromImageData: (imageData: ImageData): OMRQRData | null => {
    if (!imageData || !imageData.data || imageData.width === 0 || imageData.height === 0) {
      return null;
    }

    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth'
    });

    if (code && code.data) {
      try {
        const parsed = JSON.parse(code.data);
        if (parsed) {
          const examId = parsed.examId || parsed.e || parsed.id;
          if (examId) {
            let layout: OMRQRLayoutSubject[] | undefined;
            if (Array.isArray(parsed.L)) {
              layout = parsed.L
                .filter((x: unknown) => Array.isArray(x) && x.length >= 3)
                .map((x: [string, number, number, string?]) => ({
                  n: String(x[0]),
                  q: Number(x[1]) || 0,
                  o: Number(x[2]) || 5,
                  k: String(x[3] || '')
                }));
            }
            const studentId = parsed.studentId || parsed.s;
            return {
              examId,
              studentId: studentId && studentId !== 'GENERIC' ? studentId : 'GENERIC',
              examCode: parsed.examCode || parsed.c,
              studentNo: parsed.studentNo || parsed.sn,
              instId: parsed.instId || parsed.i,
              studentName: parsed.studentName || parsed.n,
              layout,
              timestamp: parsed.timestamp || Date.now(),
              version: parsed.version || '3.0'
            };
          }
        }
      } catch {
        // Plain string fallback
        if (code.data.startsWith('OOK:')) {
          const parts = code.data.split(':');
          return {
            examId: parts[1],
            studentId: parts[2] || 'GENERIC',
            examCode: parts[3],
            timestamp: Date.now(),
            version: '2.0'
          };
        }
      }
    }
    return null;
  }
};
