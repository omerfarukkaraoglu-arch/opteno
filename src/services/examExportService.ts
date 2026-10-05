import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Exam, ScanResult } from '../types';
import { storageService } from './storageService';
import { computeOutcomeAnalyses } from './omrEngine';

export type ExportType = 'INSTITUTION_RANKING' | 'CLASS_RANKING' | 'STUDENT_REPORT_CARD';
export type ExportFormat = 'PDF' | 'EXCEL';

function getInstitutionInfo(exam: Exam): { name: string; logoUrl?: string } {
  try {
    const institutions = storageService.getInstitutions();
    const inst = institutions.find(i => 
      (exam.institutionId && i.id === exam.institutionId) || 
      (exam.institutionName && i.name.trim().toLowerCase() === exam.institutionName.trim().toLowerCase())
    );
    return {
      name: inst?.name || exam.institutionName || 'OPTENO',
      logoUrl: inst?.logoUrl
    };
  } catch (e) {
    return {
      name: exam.institutionName || 'OPTENO',
      logoUrl: undefined
    };
  }
}

function cleanText(text?: string): string {
  if (!text) return '';
  return text
    .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
    .replace(/Ü/g, 'U').replace(/ü/g, 'u')
    .replace(/Ş/g, 'S').replace(/ş/g, 's')
    .replace(/İ/g, 'I').replace(/ı/g, 'i')
    .replace(/Ö/g, 'O').replace(/ö/g, 'o')
    .replace(/Ç/g, 'C').replace(/ç/g, 'c');
}

export const examExportService = {
  /**
   * Main Dispatcher for Exam Exports
   */
  exportData: async (params: {
    exam: Exam;
    results: ScanResult[];
    type: ExportType;
    format: ExportFormat;
    targetClass?: string; // 'ALL' or specific class name
    targetStudentId?: string; // 'ALL' or specific studentId
  }) => {
    const { exam, results, type, format, targetClass, targetStudentId } = params;

    if (results.length === 0) {
      alert('İndirilecek okunmuş sınav sonucu bulunamadı.');
      return;
    }

    // Sort all results by score & net descending for general ranking
    const sortedAll = [...results].sort((a, b) => b.totalScore !== a.totalScore ? b.totalScore - a.totalScore : b.totalNet - a.totalNet);

    if (type === 'INSTITUTION_RANKING') {
      if (format === 'EXCEL') {
        exportInstitutionRankingExcel(exam, sortedAll);
      } else {
        exportInstitutionRankingPDF(exam, sortedAll);
      }
    } else if (type === 'CLASS_RANKING') {
      const filtered = targetClass && targetClass !== 'ALL'
        ? sortedAll.filter(r => r.className === targetClass)
        : sortedAll;
      
      if (format === 'EXCEL') {
        exportClassRankingExcel(exam, filtered, sortedAll, targetClass);
      } else {
        exportClassRankingPDF(exam, filtered, sortedAll, targetClass);
      }
    } else if (type === 'STUDENT_REPORT_CARD') {
      const studentResults = targetStudentId && targetStudentId !== 'ALL'
        ? sortedAll.filter(r => r.studentId === targetStudentId)
        : sortedAll;

      if (studentResults.length === 0) {
        alert('Seçilen öğrenciye ait sonuç bulunamadı.');
        return;
      }

      if (format === 'EXCEL') {
        exportStudentReportCardsExcel(exam, studentResults, sortedAll);
      } else {
        exportStudentReportCardsPDF(exam, studentResults, sortedAll);
      }
    }
  }
};

// ==========================================
// 1. EXCEL EXPORTS (TEK DOSYADA NET + İSİM SIRALI)
// ==========================================

function buildExcelRows(exam: Exam, list: ScanResult[], rankLookup?: Map<string, number>, isNameSorted: boolean = false) {
  return list.map((r, idx) => {
    const generalRank = rankLookup?.get(r.id) ?? (idx + 1);

    const row: any[] = isNameSorted ? [
      idx + 1,
      r.studentName,
      r.studentNo,
      r.className,
      generalRank
    ] : [
      generalRank,
      r.studentNo,
      r.studentName,
      r.className
    ];

    exam.subjects.forEach(s => {
      const sub = r.subjectResults.find(sr => sr.subjectName === s.name);
      row.push(sub ? sub.correctCount : 0);
      row.push(sub ? sub.wrongCount : 0);
      row.push(sub ? sub.emptyCount : 0);
      row.push(sub ? sub.netCount : 0);
    });

    row.push(
      r.totalCorrect,
      r.totalWrong,
      r.totalEmpty,
      r.totalNet,
      parseFloat(r.totalScore.toFixed(2))
    );

    return row;
  });
}

function exportInstitutionRankingExcel(exam: Exam, results: ScanResult[]) {
  const wb = XLSX.utils.book_new();

  // Create General Rank Lookup
  const rankMap = new Map<string, number>();
  results.forEach((r, idx) => rankMap.set(r.id, idx + 1));

  // --- SHEET 1: NET SIRALI LİSTE ---
  const headersNet = ['Genel Sıra', 'Öğrenci No', 'Adı Soyadı', 'Sınıfı'];
  exam.subjects.forEach(s => {
    headersNet.push(`${s.name} D`, `${s.name} Y`, `${s.name} B`, `${s.name} Net`);
  });
  headersNet.push('Top. Doğru', 'Top. Yanlış', 'Top. Boş', 'Top. Net', 'Puan');

  const rowsNet = buildExcelRows(exam, results, rankMap, false);

  const wsNetData = [
    [`${exam.title} - GENEL KURUM DERECELİ LİSTE (NET SIRALI)`],
    [`Tarih: ${exam.date}`, `Kurum: ${exam.institutionName}`, `Toplam Katılım: ${results.length} Öğrenci`],
    [],
    headersNet,
    ...rowsNet
  ];
  const wsNet = XLSX.utils.aoa_to_sheet(wsNetData);
  XLSX.utils.book_append_sheet(wb, wsNet, '1- Net Sıralı Liste');

  // --- SHEET 2: İSİM SIRALI LİSTE (A - Z) ---
  const nameSorted = [...results].sort((a, b) => a.studentName.localeCompare(b.studentName, 'tr', { sensitivity: 'base' }));

  const headersName = ['No', 'Adı Soyadı', 'Öğrenci No', 'Sınıfı', 'Kurum Sırası'];
  exam.subjects.forEach(s => {
    headersName.push(`${s.name} D`, `${s.name} Y`, `${s.name} B`, `${s.name} Net`);
  });
  headersName.push('Top. Doğru', 'Top. Yanlış', 'Top. Boş', 'Top. Net', 'Puan');

  const rowsName = buildExcelRows(exam, nameSorted, rankMap, true);

  const wsNameData = [
    [`${exam.title} - GENEL KURUM İSİM SIRALI LİSTE (A - Z)`],
    [`Tarih: ${exam.date}`, `Kurum: ${exam.institutionName}`, `Toplam Katılım: ${results.length} Öğrenci`],
    [],
    headersName,
    ...rowsName
  ];
  const wsName = XLSX.utils.aoa_to_sheet(wsNameData);
  XLSX.utils.book_append_sheet(wb, wsName, '2- İsim Sıralı Liste');

  const filename = `${exam.title.replace(/\s+/g, '_')}_Kurum_Listeleri_(Net_ve_Isim_Sirali).xlsx`;
  XLSX.writeFile(wb, filename);
}

function exportClassRankingExcel(exam: Exam, results: ScanResult[], allResults: ScanResult[], targetClass?: string) {
  const wb = XLSX.utils.book_new();

  // Create General Rank Lookup
  const rankMap = new Map<string, number>();
  allResults.forEach((r, idx) => rankMap.set(r.id, idx + 1));

  // Group results by class
  const classMap = new Map<string, ScanResult[]>();
  results.forEach(r => {
    const c = r.className || 'Genel';
    if (!classMap.has(c)) classMap.set(c, []);
    classMap.get(c)!.push(r);
  });

  // If specific class selected
  if (targetClass && targetClass !== 'ALL') {
    const classResults = classMap.get(targetClass) || [];
    const netSorted = [...classResults].sort((a, b) => b.totalScore !== a.totalScore ? b.totalScore - a.totalScore : b.totalNet - a.totalNet);
    const nameSorted = [...classResults].sort((a, b) => a.studentName.localeCompare(b.studentName, 'tr', { sensitivity: 'base' }));

    // Sheet 1: Net
    const headersNet = ['Sınıf Sıra', 'Öğrenci No', 'Adı Soyadı', 'Sınıfı'];
    exam.subjects.forEach(s => headersNet.push(`${s.name} D`, `${s.name} Y`, `${s.name} B`, `${s.name} Net`));
    headersNet.push('Top. D', 'Top. Y', 'Top. B', 'Top. Net', 'Puan');
    const rowsNet = buildExcelRows(exam, netSorted, undefined, false);
    const wsNet = XLSX.utils.aoa_to_sheet([
      [`${exam.title} - ${targetClass} SINIFI (NET SIRALI LİSTE)`],
      [`Tarih: ${exam.date}`, `Mevcut: ${classResults.length} Öğrenci`],
      [],
      headersNet,
      ...rowsNet
    ]);
    XLSX.utils.book_append_sheet(wb, wsNet, `${targetClass.substring(0, 20)} - Net`);

    // Sheet 2: Name
    const headersName = ['No', 'Adı Soyadı', 'Öğrenci No', 'Sınıfı', 'Kurum Sırası'];
    exam.subjects.forEach(s => headersName.push(`${s.name} D`, `${s.name} Y`, `${s.name} B`, `${s.name} Net`));
    headersName.push('Top. D', 'Top. Y', 'Top. B', 'Top. Net', 'Puan');
    const rowsName = buildExcelRows(exam, nameSorted, rankMap, true);
    const wsName = XLSX.utils.aoa_to_sheet([
      [`${exam.title} - ${targetClass} SINIFI (İSİM SIRALI LİSTE A-Z)`],
      [`Tarih: ${exam.date}`, `Mevcut: ${classResults.length} Öğrenci`],
      [],
      headersName,
      ...rowsName
    ]);
    XLSX.utils.book_append_sheet(wb, wsName, `${targetClass.substring(0, 20)} - İsim`);
  } else {
    // ALL CLASSES: First add overall tabs, then class tabs
    const netSortedAll = [...results].sort((a, b) => b.totalScore !== a.totalScore ? b.totalScore - a.totalScore : b.totalNet - a.totalNet);
    const nameSortedAll = [...results].sort((a, b) => a.studentName.localeCompare(b.studentName, 'tr', { sensitivity: 'base' }));

    // Overall Net
    const headersNet = ['Genel Sıra', 'Öğrenci No', 'Adı Soyadı', 'Sınıfı'];
    exam.subjects.forEach(s => headersNet.push(`${s.name} D`, `${s.name} Y`, `${s.name} B`, `${s.name} Net`));
    headersNet.push('Top. D', 'Top. Y', 'Top. B', 'Top. Net', 'Puan');
    const wsNetAll = XLSX.utils.aoa_to_sheet([
      [`${exam.title} - TÜM SINIFLAR (NET SIRALI DERECE LİSTESİ)`],
      [`Tarih: ${exam.date}`, `Toplam Öğrenci: ${results.length}`],
      [],
      headersNet,
      ...buildExcelRows(exam, netSortedAll, rankMap, false)
    ]);
    XLSX.utils.book_append_sheet(wb, wsNetAll, 'Tüm Sınıflar (Net)');

    // Overall Name
    const headersName = ['No', 'Adı Soyadı', 'Öğrenci No', 'Sınıfı', 'Kurum Sırası'];
    exam.subjects.forEach(s => headersName.push(`${s.name} D`, `${s.name} Y`, `${s.name} B`, `${s.name} Net`));
    headersName.push('Top. D', 'Top. Y', 'Top. B', 'Top. Net', 'Puan');
    const wsNameAll = XLSX.utils.aoa_to_sheet([
      [`${exam.title} - TÜM SINIFLAR (İSİM SIRALI LİSTE A-Z)`],
      [`Tarih: ${exam.date}`, `Toplam Öğrenci: ${results.length}`],
      [],
      headersName,
      ...buildExcelRows(exam, nameSortedAll, rankMap, true)
    ]);
    XLSX.utils.book_append_sheet(wb, wsNameAll, 'Tüm Sınıflar (İsim)');

    // Each individual class tabs
    classMap.forEach((classResults, className) => {
      const clsNet = [...classResults].sort((a, b) => b.totalScore !== a.totalScore ? b.totalScore - a.totalScore : b.totalNet - a.totalNet);
      const safeName = className.substring(0, 22);

      const wsClsNet = XLSX.utils.aoa_to_sheet([
        [`${exam.title} - ${className} SINIFI (NET SIRALI)`],
        [`Mevcut: ${classResults.length} Öğrenci`],
        [],
        headersNet,
        ...buildExcelRows(exam, clsNet, rankMap, false)
      ]);
      XLSX.utils.book_append_sheet(wb, wsClsNet, `${safeName} Net`);
    });
  }

  const suffix = targetClass && targetClass !== 'ALL' ? `_${targetClass}` : '_Tum_Siniflar';
  const filename = `${exam.title.replace(/\s+/g, '_')}_Sinif_Listeleri_(Net_ve_Isim_Sirali)${suffix}.xlsx`;
  XLSX.writeFile(wb, filename);
}

function exportStudentReportCardsExcel(exam: Exam, results: ScanResult[], allResults: ScanResult[]) {
  const wb = XLSX.utils.book_new();

  const headers = [
    'Öğrenci No',
    'Adı Soyadı',
    'Sınıfı',
    'Kurum Sırası',
    'Sınıf Sırası',
    'Toplam Puan',
    'Toplam Net',
    'Toplam Doğru',
    'Toplam Yanlış',
    'Toplam Boş'
  ];

  exam.subjects.forEach(s => {
    headers.push(`${s.name} Net`);
  });

  const rows = results.map(r => {
    const generalRank = allResults.findIndex(ar => ar.id === r.id) + 1;
    const sameClass = allResults.filter(ar => ar.className === r.className);
    const classRank = sameClass.findIndex(sc => sc.id === r.id) + 1;

    const row: any[] = [
      r.studentNo,
      r.studentName,
      r.className,
      generalRank > 0 ? `${generalRank} / ${allResults.length}` : '-',
      classRank > 0 ? `${classRank} / ${sameClass.length}` : '-',
      parseFloat(r.totalScore.toFixed(2)),
      r.totalNet,
      r.totalCorrect,
      r.totalWrong,
      r.totalEmpty
    ];

    exam.subjects.forEach(s => {
      const sub = r.subjectResults.find(sr => sr.subjectName === s.name);
      row.push(sub ? sub.netCount : 0);
    });

    return row;
  });

  const wsData = [
    [`${exam.title} - ÖĞRENCİ SINAV KARNELERİ ÖZETİ`],
    [`Tarih: ${exam.date}`, `Kurum: ${exam.institutionName}`],
    [],
    headers,
    ...rows
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Öğrenci Karneleri');

  // Sheet 2: Kazanım Detayları
  const outcomeHeaders = ['Öğrenci No', 'Adı Soyadı', 'Sınıfı', 'Ders', 'Kazanım / Konu', 'Soru', 'Doğru', 'Yanlış', 'Boş', 'Başarı %', 'Durum'];
  const outcomeRows: (string | number)[][] = [];

  results.forEach(r => {
    const outcomes = r.outcomeAnalyses && r.outcomeAnalyses.length > 0
      ? r.outcomeAnalyses
      : computeOutcomeAnalyses(exam, r.answers);

    outcomes.forEach(o => {
      const statusText = o.status === 'SUCCESS' ? 'Kavrandı' : o.status === 'WARNING' ? 'Pekiştirilmeli' : 'Destek Gerekli';
      outcomeRows.push([
        r.studentNo,
        r.studentName,
        r.className,
        o.subjectName,
        o.outcome,
        o.totalQuestions,
        o.correctCount,
        o.wrongCount,
        o.emptyCount,
        o.successRate,
        statusText
      ]);
    });
  });

  if (outcomeRows.length > 0) {
    const wsOutcomes = XLSX.utils.aoa_to_sheet([
      [`${exam.title} - KAZANIM BAZLI ÖĞRENCİ BAŞARI DETAYI`],
      [],
      outcomeHeaders,
      ...outcomeRows
    ]);
    XLSX.utils.book_append_sheet(wb, wsOutcomes, 'Kazanım Analizleri');
  }

  const filename = `${exam.title.replace(/\s+/g, '_')}_Ogrenci_Karneleri.xlsx`;
  XLSX.writeFile(wb, filename);
}

// ==========================================
// 2. PDF EXPORTS (TEK DOSYADA NET + İSİM SIRALI)
// ==========================================

function drawRankingTablePDF(
  doc: jsPDF,
  exam: Exam,
  list: ScanResult[],
  title: string,
  subtitle: string,
  isNameSorted: boolean,
  rankMap?: Map<string, number>,
  institutionLogo?: string
) {
  const studentCount = list.length;

  // 1. Calculate Statistics & Averages
  const subAverages = exam.subjects.map(s => {
    const totalNet = list.reduce((sum, r) => {
      const sub = r.subjectResults.find(sr => sr.subjectName === s.name);
      return sum + (sub ? sub.netCount : 0);
    }, 0);
    const avgNet = studentCount > 0 ? parseFloat((totalNet / studentCount).toFixed(2)) : 0;
    const accuracy = (s.questionCount > 0 && studentCount > 0)
      ? Math.round((avgNet / s.questionCount) * 100)
      : 0;
    return { name: s.name, questionCount: s.questionCount, avgNet, accuracy };
  });

  const totalNetSum = list.reduce((sum, r) => sum + r.totalNet, 0);
  const avgTotalNet = studentCount > 0 ? parseFloat((totalNetSum / studentCount).toFixed(2)) : 0;

  const totalScoreSum = list.reduce((sum, r) => sum + r.totalScore, 0);
  const avgScore = studentCount > 0 ? parseFloat((totalScoreSum / studentCount).toFixed(1)) : 0;

  const scores = list.map(r => r.totalScore);
  const maxScore = scores.length > 0 ? Math.max(...scores).toFixed(1) : '0';
  const minScore = scores.length > 0 ? Math.min(...scores).toFixed(1) : '0';

  const overallAccuracy = exam.totalQuestions > 0 ? Math.round((avgTotalNet / exam.totalQuestions) * 100) : 0;

  // 2. Executive Corporate Header
  doc.setFillColor(15, 23, 42); // Deep Midnight Slate
  doc.rect(12, 10, 4, 13, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(cleanText(title), 18, 15.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(cleanText(subtitle), 18, 21.5);

  // Institution Logo at top right if available (Landscape A4: width 297mm)
  if (institutionLogo) {
    try {
      doc.addImage(institutionLogo, 252, 7, 33, 16);
    } catch (err) {
      console.warn('PDF Institution Logo draw error:', err);
    }
  }

  // 3. TABLE 1: KURUMSAL GENEL ORTALAMALAR TABLOSU (SUMMARY KPI TABLE)
  const summaryHeaders = [
    'DEGERLENDIRME KRITERI',
    ...exam.subjects.map(s => cleanText(`${s.name} Ort.`)),
    'TOPLAM NET ORT.',
    'ORTALAMA PUAN',
    'EN YUKSEK / DUSUK'
  ];

  const summaryRowNet = [
    'Katilimci / Sinif Ortalamasi (Net)',
    ...subAverages.map(a => `${a.avgNet} Net`),
    `${avgTotalNet} Net`,
    `${avgScore} Puan`,
    `${maxScore} / ${minScore}`
  ];

  const summaryRowAcc = [
    'Ders Basari Orani (%)',
    ...subAverages.map(a => `%${a.accuracy}`),
    `%${overallAccuracy}`,
    `Mevcut: ${studentCount} Ogrenci`,
    `500 Uzerinden`
  ];

  const summaryColStyles: { [key: number]: any } = {
    0: { halign: 'left', fontStyle: 'bold', cellWidth: 55 }
  };
  let sColIdx = 1;
  exam.subjects.forEach(() => {
    summaryColStyles[sColIdx] = { halign: 'center', fontStyle: 'bold' };
    sColIdx++;
  });
  summaryColStyles[sColIdx] = { halign: 'center', fontStyle: 'bold', textColor: [16, 185, 129] };
  summaryColStyles[sColIdx + 1] = { halign: 'center', fontStyle: 'bold', textColor: [79, 70, 229] };
  summaryColStyles[sColIdx + 2] = { halign: 'center', fontStyle: 'normal' };

  autoTable(doc, {
    startY: 26,
    head: [summaryHeaders.map(cleanText)],
    body: [summaryRowNet.map(cleanText), summaryRowAcc.map(cleanText)],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: { top: 2, bottom: 2, left: 2.5, right: 2.5 },
      valign: 'middle',
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [30, 41, 59], // Dark Slate Corporate Header
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      fontSize: 8,
      lineColor: [15, 23, 42],
      lineWidth: 0.2,
    },
    columnStyles: summaryColStyles,
    margin: { left: 12, right: 12 },
    didParseCell: (data) => {
      if (data.section === 'body') {
        if (data.row.index === 0) {
          data.cell.styles.fillColor = [240, 249, 255]; // Soft ice blue
        } else {
          data.cell.styles.fillColor = [255, 255, 255];
        }
      }
    }
  });

  const mainTableStartY = ((doc as any).lastAutoTable?.finalY || 45) + 5;

  // 4. TABLE 2: ANA OGRENCI SIRALAMA LISTESI (MAIN RANKING TABLE)
  const headers: string[] = [];
  const rows: (string | number)[][] = [];
  const columnStyles: { [key: number]: any } = {};

  if (isNameSorted) {
    // İsim Sıralı Liste (A-Z)
    headers.push('No', 'Ogrenci Adi Soyadi (A-Z)', 'Okul No', 'Sinifi', 'Kurum Sirasi');
    exam.subjects.forEach(s => headers.push(cleanText(s.name)));
    headers.push('Top. Net', 'Puan');

    columnStyles[0] = { halign: 'center', cellWidth: 14 };
    columnStyles[1] = { halign: 'left', fontStyle: 'bold' };
    columnStyles[2] = { halign: 'center', cellWidth: 18 };
    columnStyles[3] = { halign: 'center', cellWidth: 20 };
    columnStyles[4] = { halign: 'center', fontStyle: 'bold', cellWidth: 22 };

    let cIdx = 5;
    exam.subjects.forEach(() => {
      columnStyles[cIdx] = { halign: 'center' };
      cIdx++;
    });
    columnStyles[cIdx] = { halign: 'center', fontStyle: 'bold', cellWidth: 20, textColor: [16, 185, 129] };
    columnStyles[cIdx + 1] = { halign: 'center', fontStyle: 'bold', cellWidth: 20, textColor: [79, 70, 229] };

    list.forEach((r, idx) => {
      const gRank = rankMap?.get(r.id) ?? (idx + 1);
      const row: (string | number)[] = [
        idx + 1,
        cleanText(r.studentName),
        r.studentNo,
        cleanText(r.className || '-'),
        `${gRank}.`
      ];
      exam.subjects.forEach(s => {
        const sub = r.subjectResults.find(sr => sr.subjectName === s.name);
        row.push(sub ? sub.netCount : 0);
      });
      row.push(r.totalNet, r.totalScore.toFixed(1));
      rows.push(row);
    });
  } else {
    // Net Sıralı Liste
    headers.push('Sıra', 'No', 'Öğrenci Adı Soyadı', 'Sınıfı');
    exam.subjects.forEach(s => headers.push(cleanText(s.name)));
    headers.push('Top. Net', 'Puan');

    columnStyles[0] = { halign: 'center', fontStyle: 'bold', cellWidth: 14 };
    columnStyles[1] = { halign: 'center', cellWidth: 18 };
    columnStyles[2] = { halign: 'left', fontStyle: 'bold' };
    columnStyles[3] = { halign: 'center', cellWidth: 20 };

    let cIdx = 4;
    exam.subjects.forEach(() => {
      columnStyles[cIdx] = { halign: 'center' };
      cIdx++;
    });
    columnStyles[cIdx] = { halign: 'center', fontStyle: 'bold', cellWidth: 20, textColor: [16, 185, 129] };
    columnStyles[cIdx + 1] = { halign: 'center', fontStyle: 'bold', cellWidth: 20, textColor: [79, 70, 229] };

    list.forEach((r, idx) => {
      const row: (string | number)[] = [
        idx + 1,
        r.studentNo,
        cleanText(r.studentName),
        cleanText(r.className || '-')
      ];
      exam.subjects.forEach(s => {
        const sub = r.subjectResults.find(sr => sr.subjectName === s.name);
        row.push(sub ? sub.netCount : 0);
      });
      row.push(r.totalNet, r.totalScore.toFixed(1));
      rows.push(row);
    });
  }

  // Bottom Average Row in Main Table
  const bottomAvgRow: (string | number)[] = [
    'ORT.',
    '-',
    'SINIF / GENEL ORTALAMA',
    '-'
  ];
  if (isNameSorted) {
    bottomAvgRow.push('-');
  }
  exam.subjects.forEach(s => {
    const subAvg = subAverages.find(sa => sa.name === s.name);
    bottomAvgRow.push(subAvg ? subAvg.avgNet : 0);
  });
  bottomAvgRow.push(avgTotalNet, avgScore);
  rows.push(bottomAvgRow);

  autoTable(doc, {
    startY: mainTableStartY,
    head: [headers.map(cleanText)],
    body: rows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: { top: 2.2, bottom: 2.2, left: 2, right: 2 },
      valign: 'middle',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: isNameSorted ? [49, 46, 129] : [15, 23, 42], // Deep Navy
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      fontSize: 8.5,
      lineColor: [15, 23, 42],
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles,
    margin: { left: 12, right: 12, top: 12, bottom: 12 },
    didParseCell: (data) => {
      // Highlight bottom average row
      if (data.section === 'body' && data.row.index === rows.length - 1) {
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [15, 23, 42];
      }
      // Top 3 ranks subtle indicator
      if (data.section === 'body' && !isNameSorted && data.column.index === 0 && data.row.index < 3) {
        data.cell.styles.fontStyle = 'bold';
        if (data.row.index === 0) data.cell.styles.textColor = [180, 83, 9]; // Gold
        else if (data.row.index === 1) data.cell.styles.textColor = [71, 85, 105]; // Silver
        else if (data.row.index === 2) data.cell.styles.textColor = [180, 83, 9]; // Bronze
      }
    }
  });
}

function exportInstitutionRankingPDF(exam: Exam, results: ScanResult[]) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const instInfo = getInstitutionInfo(exam);

  // Rank lookup for students
  const rankMap = new Map<string, number>();
  results.forEach((r, idx) => rankMap.set(r.id, idx + 1));

  // 1. BÖLÜM: NET SIRALI DERECE LİSTESİ
  const netSorted = [...results].sort((a, b) => b.totalScore !== a.totalScore ? b.totalScore - a.totalScore : b.totalNet - a.totalNet);
  drawRankingTablePDF(
    doc,
    exam,
    netSorted,
    `${exam.title} - GENEL KURUM DERECELİ LİSTE (NET SIRALI)`,
    `Kurum: ${instInfo.name}  |  Tarih: ${exam.date}  |  Toplam Katilim: ${results.length} Ogrenci`,
    false,
    rankMap,
    instInfo.logoUrl
  );

  // 2. BÖLÜM: İSİM SIRALI LİSTE (A - Z) (YENİ SAYFADA)
  doc.addPage();
  const nameSorted = [...results].sort((a, b) => a.studentName.localeCompare(b.studentName, 'tr', { sensitivity: 'base' }));
  drawRankingTablePDF(
    doc,
    exam,
    nameSorted,
    `${exam.title} - GENEL KURUM İSİM SIRALI LİSTE (A - Z)`,
    `Kurum: ${instInfo.name}  |  Tarih: ${exam.date}  |  Alfabetik Ogrenci Listesi ve Kurum Dereceleri`,
    true,
    rankMap,
    instInfo.logoUrl
  );

  // Sayfa Numaralandırma
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      cleanText(`Sayfa ${i} / ${totalPages}`),
      297 / 2,
      204,
      { align: 'center' }
    );
  }

  const filename = `${exam.title.replace(/\s+/g, '_')}_Kurum_Listeleri_(Net_ve_Isim_Sirali).pdf`;
  doc.save(filename);
}

function exportClassRankingPDF(exam: Exam, results: ScanResult[], allResults: ScanResult[], targetClass?: string) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const instInfo = getInstitutionInfo(exam);

  const rankMap = new Map<string, number>();
  allResults.forEach((r, idx) => rankMap.set(r.id, idx + 1));

  // Group by class
  const classMap = new Map<string, ScanResult[]>();
  results.forEach(r => {
    const c = r.className || 'Genel';
    if (!classMap.has(c)) classMap.set(c, []);
    classMap.get(c)!.push(r);
  });

  let isFirstSection = true;

  classMap.forEach((classResults, className) => {
    const netSorted = [...classResults].sort((a, b) => b.totalScore !== a.totalScore ? b.totalScore - a.totalScore : b.totalNet - a.totalNet);
    const nameSorted = [...classResults].sort((a, b) => a.studentName.localeCompare(b.studentName, 'tr', { sensitivity: 'base' }));

    // Bölüm 1: Sınıf Net Sıralı Liste
    if (!isFirstSection) {
      doc.addPage();
    }
    isFirstSection = false;

    drawRankingTablePDF(
      doc,
      exam,
      netSorted,
      `${exam.title} - ${className} SINIFI DERECE LİSTESİ (NET SIRALI)`,
      `Kurum: ${instInfo.name}  |  Sinif: ${className}  |  Mevcut: ${classResults.length} Ogrenci  |  Tarih: ${exam.date}`,
      false,
      rankMap,
      instInfo.logoUrl
    );

    // Bölüm 2: Sınıf İsim Sıralı Liste (A-Z)
    doc.addPage();

    drawRankingTablePDF(
      doc,
      exam,
      nameSorted,
      `${exam.title} - ${className} SINIFI İSİM SIRALI LİSTE (A - Z)`,
      `Kurum: ${instInfo.name}  |  Sinif: ${className}  |  Mevcut: ${classResults.length} Ogrenci  |  Alfabetik Liste ve Dereceler`,
      true,
      rankMap,
      instInfo.logoUrl
    );
  });

  // Sayfa Numaralandırma
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      cleanText(`Sayfa ${i} / ${totalPages}`),
      297 / 2,
      204,
      { align: 'center' }
    );
  }

  const suffix = targetClass && targetClass !== 'ALL' ? `_${targetClass}` : '_Tum_Siniflar';
  const filename = `${exam.title.replace(/\s+/g, '_')}_Sinif_Listeleri_(Net_ve_Isim_Sirali)${suffix}.pdf`;
  doc.save(filename);
}

function exportStudentReportCardsPDF(exam: Exam, studentResults: ScanResult[], allResults: ScanResult[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;

  const instInfo = getInstitutionInfo(exam);

  studentResults.forEach((studentRes, index) => {
    if (index > 0) {
      doc.addPage();
    }

    const generalRank = allResults.findIndex(ar => ar.id === studentRes.id) + 1;
    const sameClass = allResults.filter(ar => ar.className === studentRes.className);
    const classRank = sameClass.findIndex(sc => sc.id === studentRes.id) + 1;

    // Header Card
    doc.setFillColor(238, 242, 255); // Indigo light
    doc.rect(margin, 12, pageWidth - (margin * 2), 26, 'F');
    doc.setDrawColor(199, 210, 254);
    doc.setLineWidth(0.4);
    doc.rect(margin, 12, pageWidth - (margin * 2), 26, 'D');

    // Institution Logo if available
    if (instInfo.logoUrl) {
      try {
        // Draw crisp white background badge for logo
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(pageWidth - margin - 34, 14, 30, 22, 2, 2, 'F');
        doc.setDrawColor(224, 231, 255);
        doc.setLineWidth(0.3);
        doc.roundedRect(pageWidth - margin - 34, 14, 30, 22, 2, 2, 'D');
        doc.addImage(instInfo.logoUrl, pageWidth - margin - 32, 15, 26, 20);
      } catch (err) {
        console.warn('PDF Student Report Card logo draw error:', err);
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text(cleanText(instInfo.name || exam.institutionName || 'OPTENO SINAV MERKEZI'), margin + 5, 20);

    doc.setFontSize(10);
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text(cleanText(`${exam.title} - OGRENCI SINAV SONUC BELGESI`), margin + 5, 27);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(cleanText(`Sinav Kodu: ${exam.examCode}  |  Tarih: ${exam.date}`), margin + 5, 34);

    // Student Info Box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, 42, pageWidth - (margin * 2), 22, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Ogrenci Adi Soyadi:', margin + 4, 49);
    doc.setFont('helvetica', 'normal');
    doc.text(cleanText(studentRes.studentName), margin + 40, 49);

    doc.setFont('helvetica', 'bold');
    doc.text('Ogrenci Numarasi:', margin + 4, 57);
    doc.setFont('helvetica', 'normal');
    doc.text(cleanText(studentRes.studentNo), margin + 40, 57);

    doc.setFont('helvetica', 'bold');
    doc.text('Sinifi / Grubu:', margin + 105, 49);
    doc.setFont('helvetica', 'normal');
    doc.text(cleanText(studentRes.className), margin + 135, 49);

    doc.setFont('helvetica', 'bold');
    doc.text('Kurum Derecesi:', margin + 105, 57);
    doc.setFont('helvetica', 'normal');
    doc.text(`${generalRank} / ${allResults.length}`, margin + 135, 57);

    doc.setFont('helvetica', 'bold');
    doc.text('Sinif Derecesi:', margin + 155, 57);
    doc.setFont('helvetica', 'normal');
    doc.text(`${classRank} / ${sameClass.length}`, margin + 178, 57);

    // KPI Summary Score Cards
    const kpiY = 68;
    const kpiW = (pageWidth - (margin * 2) - 9) / 4;
    const kpiH = 18;

    // 1. Puan
    doc.setFillColor(238, 242, 255);
    doc.rect(margin, kpiY, kpiW, kpiH, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('TOPLAM PUAN (500)', margin + (kpiW / 2), kpiY + 6, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(79, 70, 229);
    doc.text(studentRes.totalScore.toFixed(2), margin + (kpiW / 2), kpiY + 14, { align: 'center' });

    // 2. Net
    doc.setFillColor(236, 253, 245);
    doc.rect(margin + kpiW + 3, kpiY, kpiW, kpiH, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('TOPLAM NET', margin + kpiW + 3 + (kpiW / 2), kpiY + 6, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(16, 185, 129);
    doc.text(String(studentRes.totalNet), margin + kpiW + 3 + (kpiW / 2), kpiY + 14, { align: 'center' });

    // 3. Dogru
    doc.setFillColor(240, 253, 244);
    doc.rect(margin + (kpiW * 2) + 6, kpiY, kpiW, kpiH, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('DOGRU / YANLIS', margin + (kpiW * 2) + 6 + (kpiW / 2), kpiY + 6, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(34, 197, 94);
    doc.text(`${studentRes.totalCorrect} D / ${studentRes.totalWrong} Y`, margin + (kpiW * 2) + 6 + (kpiW / 2), kpiY + 14, { align: 'center' });

    // 4. Bos
    doc.setFillColor(254, 243, 199);
    doc.rect(margin + (kpiW * 3) + 9, kpiY, kpiW, kpiH, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('BOS SAYISI', margin + (kpiW * 3) + 9 + (kpiW / 2), kpiY + 6, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(217, 119, 6);
    doc.text(String(studentRes.totalEmpty), margin + (kpiW * 3) + 9 + (kpiW / 2), kpiY + 14, { align: 'center' });

    // Section 1: Subject Breakdown Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text('DERS BAZLI BASARI ANALIZI', margin, 92);

    const subjectHeaders = ['Ders Adi', 'Soru', 'Dogru', 'Yanlis', 'Bos', 'Net', 'Basari Grafigi (D/Y/B)'];
    const subjectRows: (string | number)[][] = exam.subjects.map(s => {
      const sub = studentRes.subjectResults.find(sr => sr.subjectName === s.name);
      const totalQ = s.questionCount || 1;
      const c = sub ? sub.correctCount : 0;
      const pct = Math.round((c / totalQ) * 100);
      return [
        cleanText(s.name),
        s.questionCount,
        sub ? sub.correctCount : 0,
        sub ? sub.wrongCount : 0,
        sub ? sub.emptyCount : s.questionCount,
        sub ? sub.netCount : 0,
        `%${pct}`
      ];
    });

    // Total row
    const totalAccuracy = exam.totalQuestions > 0 ? Math.round((studentRes.totalCorrect / exam.totalQuestions) * 100) : 0;
    subjectRows.push([
      'TOPLAM',
      exam.totalQuestions,
      studentRes.totalCorrect,
      studentRes.totalWrong,
      studentRes.totalEmpty,
      studentRes.totalNet,
      `%${totalAccuracy}`
    ]);

    autoTable(doc, {
      startY: 96,
      head: [subjectHeaders],
      body: subjectRows,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
        valign: 'middle',
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [30, 41, 59],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        fontSize: 8,
        lineColor: [203, 213, 225],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 42 },
        1: { halign: 'center', cellWidth: 16 },
        2: { halign: 'center', cellWidth: 16 },
        3: { halign: 'center', cellWidth: 16 },
        4: { halign: 'center', cellWidth: 16 },
        5: { halign: 'center', fontStyle: 'bold', cellWidth: 18 },
        6: { halign: 'right', fontStyle: 'bold', cellWidth: 58 },
      },
      margin: { left: margin, right: margin },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 6) {
          const rowIdx = data.row.index;
          const isTotalRow = rowIdx >= exam.subjects.length;
          
          let totalQ = 1;
          let c = 0;
          let w = 0;
          let b = 0;

          if (!isTotalRow) {
            const s = exam.subjects[rowIdx];
            const sub = studentRes.subjectResults.find(sr => sr.subjectName === s.name);
            totalQ = s.questionCount || 1;
            c = sub ? sub.correctCount : 0;
            w = sub ? sub.wrongCount : 0;
            b = sub ? sub.emptyCount : 0;
          } else {
            totalQ = exam.totalQuestions || 1;
            c = studentRes.totalCorrect;
            w = studentRes.totalWrong;
            b = studentRes.totalEmpty;
          }

          const cellX = data.cell.x + 2;
          const barW = data.cell.width - 18; // Leave space for percentage text on right
          const cellY = data.cell.y + (data.cell.height / 2) - 1.8;
          const barH = 3.6;

          const cW = (c / totalQ) * barW;
          const wW = (w / totalQ) * barW;
          const bW = (b / totalQ) * barW;

          // Background track
          doc.setFillColor(241, 245, 249);
          doc.rect(cellX, cellY, barW, barH, 'F');

          // Green (Correct)
          if (cW > 0) {
            doc.setFillColor(34, 197, 94);
            doc.rect(cellX, cellY, cW, barH, 'F');
          }
          // Red (Wrong)
          if (wW > 0) {
            doc.setFillColor(239, 68, 68);
            doc.rect(cellX + cW, cellY, wW, barH, 'F');
          }
          // Slate (Empty)
          if (bW > 0) {
            doc.setFillColor(148, 163, 184);
            doc.rect(cellX + cW + wW, cellY, bW, barH, 'F');
          }
        }
      }
    });

    let currentY = ((doc as any).lastAutoTable?.finalY || 135) + 6;

    // Section 2: Kazanım ve Konu Bazlı Başarı Analizi
    const outcomes = studentRes.outcomeAnalyses && studentRes.outcomeAnalyses.length > 0
      ? studentRes.outcomeAnalyses
      : computeOutcomeAnalyses(exam, studentRes.answers);

    if (outcomes.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text('KAZANIM VE KONU BAZLI BASARI ANALIZI', margin, currentY);

      const outcomeHeaders = ['Ders', 'Kazanim / Konu', 'Soru', 'D / Y / B', 'Basari %', 'Durum'];
      const outcomeRows = outcomes.map(o => {
        const statusStr = o.status === 'SUCCESS' ? 'Kavrandi' : o.status === 'WARNING' ? 'Pekistirilmeli' : 'Destek Gerekli';
        return [
          cleanText(o.subjectName),
          cleanText(o.outcome),
          o.totalQuestions,
          `${o.correctCount}D ${o.wrongCount}Y ${o.emptyCount}B`,
          `%${o.successRate}`,
          cleanText(statusStr)
        ];
      });

      autoTable(doc, {
        startY: currentY + 3,
        head: [outcomeHeaders],
        body: outcomeRows,
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 7,
          cellPadding: { top: 1.5, bottom: 1.5, left: 2, right: 2 },
          valign: 'middle',
          textColor: [30, 41, 59],
          lineColor: [226, 232, 240],
          lineWidth: 0.15,
        },
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [30, 41, 59],
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          fontSize: 7.5,
          lineColor: [203, 213, 225],
          lineWidth: 0.2,
        },
        columnStyles: {
          0: { halign: 'left', cellWidth: 32 },
          1: { halign: 'left', cellWidth: 70 },
          2: { halign: 'center', cellWidth: 14 },
          3: { halign: 'center', cellWidth: 28 },
          4: { halign: 'center', fontStyle: 'bold', cellWidth: 18 },
          5: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
        },
        margin: { left: margin, right: margin },
      });

      currentY = ((doc as any).lastAutoTable?.finalY || currentY + 20) + 5;

      // Smart Guidance Recommendation Box in PDF
      const weakOutcomes = outcomes.filter(o => o.status === 'DANGER' || o.status === 'WARNING');
      if (weakOutcomes.length > 0 && currentY < pageHeight - 35) {
        doc.setFillColor(254, 243, 199);
        doc.rect(margin, currentY, pageWidth - (margin * 2), 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(180, 83, 9);
        doc.text('ONCELIKLI TEKRAR EDILMESI GEREKEN KONULAR:', margin + 3, currentY + 4);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(71, 85, 105);
        const weakListStr = cleanText(weakOutcomes.map(w => `${w.subjectName} (${w.outcome})`).join(' - '));
        const splitWeak = doc.splitTextToSize(weakListStr, pageWidth - (margin * 2) - 6);
        doc.text(splitWeak[0] || '', margin + 3, currentY + 8);
        currentY += 13;
      }
    }

    // Section 3: Question Answer Details Grid
    if (currentY < pageHeight - 25) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text('SORU BAZLI CEVAP DETAYI', margin, currentY);
      currentY += 3;

      const qCols = 5;
      const colW = (pageWidth - (margin * 2)) / qCols;
      const qRowH = 4.2;

      studentRes.answers.forEach((ans, aIdx) => {
        const cIdx = aIdx % qCols;
        const rIdx = Math.floor(aIdx / qCols);
        const qX = margin + (cIdx * colW);
        const qY = currentY + (rIdx * qRowH);

        if (qY > pageHeight - 16) return;

        const isC = ans.isCorrect;
        const isB = ans.isBlank;
        const statusIcon = isC ? '[D]' : isB ? '[-]' : '[Y]';

        doc.setFont('helvetica', isC ? 'bold' : 'normal');
        doc.setFontSize(6.8);
        if (isC) doc.setTextColor(22, 163, 74);
        else if (isB) doc.setTextColor(148, 163, 184);
        else doc.setTextColor(225, 29, 72);

        const qText = `${ans.questionNumber}. ${ans.selectedOption || '-'}/${ans.correctAnswer} ${statusIcon}`;
        doc.text(qText, qX + 1, qY + 3.2);
      });
    }

    // Footer
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      cleanText(`Bu karne Opteno Dijital Sinav Yonetim Sistemi tarafindan ${new Date().toLocaleDateString('tr-TR')} tarihinde uretilmistir.`),
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  });

  const singleName = studentResults.length === 1 ? `_${cleanText(studentResults[0].studentName).replace(/\s+/g, '_')}` : '_Tum_Karneler';
  const filename = `${exam.title.replace(/\s+/g, '_')}_Karneler${singleName}.pdf`;
  doc.save(filename);
}
