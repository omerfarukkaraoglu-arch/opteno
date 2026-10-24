import React, { useState, useEffect } from 'react';
import { 
  X, Check, Sparkles, KeyRound, Copy, CheckCircle2, 
  FileSpreadsheet, Upload, Download, AlertTriangle, Layers, RefreshCw
} from 'lucide-react';
import { Exam, SubjectConfig, User } from '../../types';
import { storageService } from '../../services/storageService';
import * as XLSX from 'xlsx';

interface EditAnswerKeyModalProps {
  isOpen: boolean;
  examId: string;
  currentUser?: User;
  onClose: () => void;
  onSuccess?: (recalculatedCount: number) => void;
}

export const EditAnswerKeyModal: React.FC<EditAnswerKeyModalProps> = ({
  isOpen,
  examId,
  currentUser,
  onClose,
  onSuccess
}) => {
  const [exam, setExam] = useState<Exam | null>(null);
  const [subjects, setSubjects] = useState<SubjectConfig[]>([]);
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState<number>(0);
  const [hasBookletTypes, setHasBookletTypes] = useState<boolean>(false);
  const [activeBooklet, setActiveBooklet] = useState<'A' | 'B'>('A');

  // Quick Paste
  const [quickPasteText, setQuickPasteText] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [scannedResultsCount, setScannedResultsCount] = useState<number>(0);

  useEffect(() => {
    if (!isOpen || !examId) return;

    const currentExam = storageService.getExamById(examId);
    if (currentExam) {
      setExam(currentExam);
      setHasBookletTypes(Boolean(
        currentExam.hasBookletTypes || 
        currentExam.subjects?.some(s => s.correctAnswersB && s.correctAnswersB.length > 0)
      ));
      
      // Clone subjects deep copy
      const clonedSubjects: SubjectConfig[] = (currentExam.subjects || []).map(s => ({
        ...s,
        correctAnswers: [...(s.correctAnswers || Array(s.questionCount).fill('A'))],
        correctAnswersB: s.correctAnswersB ? [...s.correctAnswersB] : Array(s.questionCount).fill('A'),
        learningOutcomes: s.learningOutcomes ? [...s.learningOutcomes] : undefined
      }));
      setSubjects(clonedSubjects);
      setSelectedSubjectIndex(0);

      const results = storageService.getResults(examId);
      setScannedResultsCount(results.length);
    }
  }, [isOpen, examId]);

  if (!isOpen || !exam) return null;

  const currentSubject = subjects[selectedSubjectIndex] || subjects[0];
  const optionLabels = (currentSubject?.optionCount || exam.defaultOptionCount || 4) === 5
    ? ['A', 'B', 'C', 'D', 'E']
    : ['A', 'B', 'C', 'D'];

  const showStatus = (text: string, type: 'success' | 'error' | 'info' = 'info', duration = 3500) => {
    setStatusMessage({ text, type });
    if (duration > 0) {
      setTimeout(() => setStatusMessage(null), duration);
    }
  };

  // Change answer for a specific question
  const handleAnswerChange = (qIndex: number, answer: string) => {
    setSubjects(prev => {
      const updated = [...prev];
      const targetSub = { ...updated[selectedSubjectIndex] };

      if (activeBooklet === 'B') {
        const answersB = targetSub.correctAnswersB ? [...targetSub.correctAnswersB] : [...targetSub.correctAnswers];
        answersB[qIndex] = answer;
        targetSub.correctAnswersB = answersB;
      } else {
        const answersA = [...targetSub.correctAnswers];
        answersA[qIndex] = answer;
        targetSub.correctAnswers = answersA;
      }

      updated[selectedSubjectIndex] = targetSub;
      return updated;
    });
  };

  // Set outcome for a specific question
  const handleOutcomeChange = (qIndex: number, outcomeText: string) => {
    setSubjects(prev => {
      const updated = [...prev];
      const targetSub = { ...updated[selectedSubjectIndex] };
      const outcomes = targetSub.learningOutcomes 
        ? [...targetSub.learningOutcomes] 
        : Array(targetSub.questionCount).fill('');
      outcomes[qIndex] = outcomeText;
      targetSub.learningOutcomes = outcomes;
      updated[selectedSubjectIndex] = targetSub;
      return updated;
    });
  };

  // Quick Paste text into current subject or across subjects
  const handleQuickPaste = () => {
    if (!quickPasteText.trim()) return;

    // Filter valid chars: A-E, *, X
    const letters = quickPasteText.toUpperCase().match(/[A-E\*X]/g) || [];
    if (letters.length === 0) {
      showStatus('Geçerli bir cevap anahtarı harfi bulunamadı (A, B, C, D, E veya *).', 'error');
      return;
    }

    setSubjects(prev => {
      const updated = [...prev];
      const targetSub = { ...updated[selectedSubjectIndex] };

      if (activeBooklet === 'B') {
        const answersB = targetSub.correctAnswersB ? [...targetSub.correctAnswersB] : [...targetSub.correctAnswers];
        for (let i = 0; i < Math.min(letters.length, targetSub.questionCount); i++) {
          answersB[i] = letters[i];
        }
        targetSub.correctAnswersB = answersB;
      } else {
        const answersA = [...targetSub.correctAnswers];
        for (let i = 0; i < Math.min(letters.length, targetSub.questionCount); i++) {
          answersA[i] = letters[i];
        }
        targetSub.correctAnswers = answersA;
      }

      updated[selectedSubjectIndex] = targetSub;
      return updated;
    });

    const appliedCount = Math.min(letters.length, currentSubject.questionCount);
    showStatus(`${currentSubject.name} dersine ${appliedCount} adet soru cevabı aktarıldı.`, 'success');
    setQuickPasteText('');
  };

  // Excel / CSV File Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const processRows = (rows: (string | number)[][]) => {
      if (!rows || rows.length === 0) {
        showStatus('Yüklenen dosya boş.', 'error');
        return;
      }

      const updatedSubjects = subjects.map(s => ({
        ...s,
        correctAnswers: [...s.correctAnswers],
        correctAnswersB: s.correctAnswersB ? [...s.correctAnswersB] : undefined,
        learningOutcomes: s.learningOutcomes ? [...s.learningOutcomes] : undefined
      }));

      let count = 0;
      const letterArray: string[] = [];

      for (const row of rows) {
        if (!row || row.length === 0) continue;

        const col0Str = String(row[0] || '').toLowerCase().trim();
        // Skip header lines
        if (
          col0Str.includes('ders') || 
          col0Str.includes('soru') || 
          col0Str.includes('subject') || 
          col0Str.includes('no')
        ) {
          continue;
        }

        if (row.length >= 4 && hasBookletTypes) {
          // Format with Booklet: Subject, QuestionNo, AnswerA, AnswerB, [Outcome]
          const sbjName = String(row[0] || '').replace(/"/g, '').trim();
          const qNo = parseInt(String(row[1] || '').trim(), 10);
          const ansA = String(row[2] || '').replace(/"/g, '').trim().toUpperCase();
          const ansB = String(row[3] || '').replace(/"/g, '').trim().toUpperCase();
          const outcome = row[4] !== undefined && row[4] !== null ? String(row[4]).replace(/"/g, '').trim() : '';

          const targetSub = updatedSubjects.find(s => s.name.toLowerCase() === sbjName.toLowerCase());
          if (targetSub && !isNaN(qNo) && qNo >= 1 && qNo <= targetSub.questionCount) {
            if (['A', 'B', 'C', 'D', 'E', '*', 'X'].includes(ansA)) targetSub.correctAnswers[qNo - 1] = ansA;
            if (['A', 'B', 'C', 'D', 'E', '*', 'X'].includes(ansB)) {
              if (!targetSub.correctAnswersB) targetSub.correctAnswersB = [...targetSub.correctAnswers];
              targetSub.correctAnswersB[qNo - 1] = ansB;
            }
            if (outcome) {
              if (!targetSub.learningOutcomes) targetSub.learningOutcomes = Array(targetSub.questionCount).fill('');
              targetSub.learningOutcomes[qNo - 1] = outcome;
            }
            count++;
          }
        } else if (row.length >= 3) {
          // Format: Subject, QuestionNo, Answer, [Outcome]
          const sbjName = String(row[0] || '').replace(/"/g, '').trim();
          const qNo = parseInt(String(row[1] || '').trim(), 10);
          const ans = String(row[2] || '').replace(/"/g, '').trim().toUpperCase();
          const outcome = row[3] !== undefined && row[3] !== null ? String(row[3]).replace(/"/g, '').trim() : '';

          if (ans && ['A', 'B', 'C', 'D', 'E', '*', 'X'].includes(ans)) {
            const targetSub = updatedSubjects.find(s => s.name.toLowerCase() === sbjName.toLowerCase());
            if (targetSub && !isNaN(qNo) && qNo >= 1 && qNo <= targetSub.questionCount) {
              if (hasBookletTypes && activeBooklet === 'B') {
                if (!targetSub.correctAnswersB) targetSub.correctAnswersB = [...targetSub.correctAnswers];
                targetSub.correctAnswersB[qNo - 1] = ans;
              } else {
                targetSub.correctAnswers[qNo - 1] = ans;
              }
              if (outcome) {
                if (!targetSub.learningOutcomes) {
                  targetSub.learningOutcomes = Array(targetSub.questionCount).fill('');
                }
                targetSub.learningOutcomes[qNo - 1] = outcome;
              }
              count++;
            }
          }
        } else {
          // Extract letters from cells if in compact stream format
          for (const cell of row) {
            const str = String(cell || '').toUpperCase();
            const matches = str.match(/[A-E\*X]/g) || [];
            letterArray.push(...matches);
          }
        }
      }

      if (count > 0) {
        setSubjects(updatedSubjects);
        showStatus(`Excel dosyasından ${count} adet soru cevabı başarıyla aktarıldı!`, 'success');
      } else if (letterArray.length > 0) {
        let letterPointer = 0;
        const autoSubjects = subjects.map(s => {
          const answers = [...s.correctAnswers];
          for (let i = 0; i < answers.length; i++) {
            if (letterPointer < letterArray.length) {
              answers[i] = letterArray[letterPointer];
              letterPointer++;
            }
          }
          return { ...s, correctAnswers: answers };
        });
        setSubjects(autoSubjects);
        showStatus(`Excel dosyasındaki ${letterPointer} adet cevap sırasıyla aktarıldı!`, 'success');
      } else {
        showStatus('Yüklenen Excel/CSV dosyasında geçerli cevap anahtarı bulunamadı.', 'error');
      }
    };

    const isExcelBinary = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (isExcelBinary) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number)[][];
          processRows(rawRows);
        } catch (err) {
          console.error(err);
          showStatus('Excel dosyası okunurken hata oluştu. Formatı kontrol ediniz.', 'error');
        }
        e.target.value = '';
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (!text) return;
        const lines = text.split(/\r?\n/);
        const rawRows = lines.map(line => line.split(/[,;\t]/).map(p => p.trim()));
        processRows(rawRows);
        e.target.value = '';
      };
      reader.readAsText(file, 'UTF-8');
    }
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const data: (string | number)[][] = [];

    if (hasBookletTypes) {
      data.push(['Ders Adı', 'Soru No', 'A Kitapçığı Cevap', 'B Kitapçığı Cevap', 'Kazanım / Konu (İsteğe Bağlı)']);
      subjects.forEach(s => {
        for (let q = 1; q <= s.questionCount; q++) {
          data.push([
            s.name,
            q,
            s.correctAnswers[q - 1] || 'A',
            s.correctAnswersB?.[q - 1] || s.correctAnswers[q - 1] || 'A',
            s.learningOutcomes?.[q - 1] || ''
          ]);
        }
      });
    } else {
      data.push(['Ders Adı', 'Soru No', 'Doğru Cevap', 'Kazanım / Konu (İsteğe Bağlı)']);
      subjects.forEach(s => {
        for (let q = 1; q <= s.questionCount; q++) {
          data.push([
            s.name,
            q,
            s.correctAnswers[q - 1] || 'A',
            s.learningOutcomes?.[q - 1] || ''
          ]);
        }
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cevap Anahtarı');
    XLSX.writeFile(wb, `${exam.examCode || 'Sinav'}_Cevap_Anahtari_Sablonu.xlsx`);
  };

  // Save changes and recalculate all exam results
  const handleSaveAndRecalculate = () => {
    setIsSaving(true);

    try {
      const sanitizedSubjects = subjects.map(s => {
        const hasAnyOutcome = Boolean(s.learningOutcomes && s.learningOutcomes.some(o => o && o.trim().length > 0));
        return {
          ...s,
          correctAnswersB: hasBookletTypes ? (s.correctAnswersB || [...s.correctAnswers]) : undefined,
          learningOutcomes: hasAnyOutcome
            ? (s.learningOutcomes || []).map(o => (o ? o.trim() : ''))
            : undefined
        };
      });

      const updatedExam: Exam = {
        ...exam,
        hasBookletTypes,
        subjects: sanitizedSubjects
      };

      // Update exam in storage and recalculate all existing scan results
      storageService.updateExam(updatedExam, true);
      const recalculatedCount = storageService.recalculateResultsForExam(updatedExam);

      showStatus(`Cevap anahtarı kaydedildi! Okunmuş ${recalculatedCount} öğrenci sonucu güncellendi.`, 'success', 2500);

      setTimeout(() => {
        setIsSaving(false);
        if (onSuccess) {
          onSuccess(recalculatedCount);
        }
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error saving answer key:', err);
      showStatus('Cevap anahtarı kaydedilirken bir hata oluştu.', 'error');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="glass-panel w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-gradient-to-r from-indigo-50/50 via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-900/90 dark:to-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-lg sm:text-xl text-slate-900 dark:text-white">
                  Cevap Anahtarını Düzenle
                </h2>
                <span className="badge badge-indigo text-xs font-mono font-bold">
                  {exam.examCode}
                </span>
                {hasBookletTypes && (
                  <span className="badge badge-warning text-[10px] font-bold">
                    A/B Kitapçıklı
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {exam.title} • {exam.totalQuestions} Soru • {subjects.length} Ders
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Warning / Notice Banner */}
        <div className="px-4 sm:px-6 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
            <Sparkles className="h-4 w-4 shrink-0 text-indigo-500 animate-pulse" />
            <span>
              {scannedResultsCount > 0 ? (
                <>
                  Bu sınava ait <strong>{scannedResultsCount} adet okunmuş öğrenci kağıdı</strong> bulunmaktadır. Yeni cevap anahtarını kaydettiğinizde tüm sonuçlar ve sıralamalar anında otomatik güncellenecektir.
                </>
              ) : (
                <>
                  Sınav optik formu basılmadan önce veya okuma yapılmadan önce cevap anahtarını dilediğiniz gibi güncelleyebilirsiniz.
                </>
              )}
            </span>
          </div>

          {/* Toggle Booklet Support */}
          <button
            type="button"
            onClick={() => {
              const nextState = !hasBookletTypes;
              setHasBookletTypes(nextState);
              if (nextState) {
                // Ensure all subjects have B answers initialized
                setSubjects(prev => prev.map(s => ({
                  ...s,
                  correctAnswersB: s.correctAnswersB || [...s.correctAnswers]
                })));
              }
            }}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
              hasBookletTypes 
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-500/50'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>{hasBookletTypes ? '✓ A / B Kitapçığı Aktif' : '+ B Kitapçığı Ekle'}</span>
          </button>
        </div>

        {/* Feedback Message Alert */}
        {statusMessage && (
          <div className={`px-4 sm:px-6 py-2 text-xs font-semibold flex items-center justify-between animate-fade-in ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-b border-emerald-200 dark:border-emerald-800'
              : statusMessage.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-b border-rose-200 dark:border-rose-800'
                : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-b border-indigo-200 dark:border-indigo-800'
          }`}>
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Top Control Bar: Booklet tabs & Quick Import Tools */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            {/* A/B Booklet Tabs */}
            {hasBookletTypes ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Kitapçık:</span>
                <button
                  type="button"
                  onClick={() => setActiveBooklet('A')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeBooklet === 'A'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  A Kitapçığı
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBooklet('B')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeBooklet === 'B'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  B Kitapçığı
                </button>
              </div>
            ) : (
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <KeyRound className="h-4 w-4 text-indigo-500" />
                <span>Tek Kitapçık (Standart Cevap Anahtarı)</span>
              </div>
            )}

            {/* Quick Upload / Download Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <label className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                <Upload className="h-3.5 w-3.5 text-emerald-500" />
                <span>Excel/CSV'den Yükle</span>
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv, text/csv, text/plain" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Sınav ders ve soru yapısına uygun Excel şablonu indirir"
              >
                <Download className="h-3.5 w-3.5 text-indigo-500" />
                <span>Şablon İndir</span>
              </button>
            </div>
          </div>

          {/* Quick Paste Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">
              Hızlı Harf Yapıştır:
            </div>
            <input
              type="text"
              value={quickPasteText}
              onChange={(e) => setQuickPasteText(e.target.value)}
              placeholder={`Örn: ABCDACBED... (${currentSubject.name} dersi için ${hasBookletTypes ? activeBooklet + ' Kitapçığı' : ''})`}
              className="input-field text-xs py-1.5 px-3 font-mono flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleQuickPaste();
                }
              }}
            />
            <button
              type="button"
              onClick={handleQuickPaste}
              className="btn btn-primary text-xs py-1.5 px-3 flex items-center justify-center gap-1.5 rounded-xl cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" /> Aktar
            </button>
          </div>

          {/* Subject Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
            {subjects.map((sub, idx) => (
              <button
                key={sub.id || idx}
                type="button"
                onClick={() => setSelectedSubjectIndex(idx)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  selectedSubjectIndex === idx
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>{sub.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedSubjectIndex === idx 
                    ? 'bg-white/20 text-white' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}>
                  {sub.questionCount} Soru
                </span>
              </button>
            ))}
          </div>

          {/* Question Bubbles Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-white">
                {currentSubject.name} — {hasBookletTypes ? `${activeBooklet} Kitapçığı ` : ''}Cevap Anahtarı ({currentSubject.questionCount} Soru)
              </span>
              <span className="text-[11px] text-amber-600 dark:text-amber-400">
                * İptal soru için <strong>[*]</strong> butonuna basabilirsiniz. İptal edilen sorular tüm öğrencilerde doğru sayılır.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {Array.from({ length: currentSubject.questionCount }, (_, qIdx) => {
                const qNum = qIdx + 1;
                const activeAnswers = activeBooklet === 'B' 
                  ? (currentSubject.correctAnswersB || currentSubject.correctAnswers)
                  : currentSubject.correctAnswers;
                const currentAnswer = activeAnswers[qIdx] || 'A';
                const currentOutcome = currentSubject.learningOutcomes?.[qIdx] || '';

                const isCancelled = currentAnswer === '*' || currentAnswer === 'X';

                return (
                  <div
                    key={qNum}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                      isCancelled
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-indigo-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {qNum}
                      </span>

                      {/* Optical Option Buttons */}
                      <div className="flex items-center gap-1">
                        {optionLabels.map(opt => {
                          const isSelected = currentAnswer === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleAnswerChange(qIdx, opt)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center ${
                                isSelected
                                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 ring-2 ring-emerald-500/40 scale-105'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}

                        {/* Cancel / Free Point Button */}
                        <button
                          type="button"
                          onClick={() => handleAnswerChange(qIdx, isCancelled ? 'A' : '*')}
                          className={`px-2 h-7 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer flex items-center justify-center ${
                            isCancelled
                              ? 'bg-amber-500 text-slate-950 font-extrabold ring-2 ring-amber-500/50 scale-105'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-amber-500/20 hover:text-amber-500'
                          }`}
                          title="Soruyu İptal Et (Herkes Doğru Sayılır)"
                        >
                          {isCancelled ? 'İPTAL (*)' : '* İptal'}
                        </button>
                      </div>
                    </div>

                    {/* Learning Outcome Input */}
                    <input
                      type="text"
                      value={currentOutcome}
                      onChange={(e) => handleOutcomeChange(qIdx, e.target.value)}
                      placeholder="Konu / Kazanım (Opsiyonel)"
                      className="input-field text-[11px] py-1 px-2 w-32 sm:w-44 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            {scannedResultsCount > 0 ? (
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Kaydedildiğinde {scannedResultsCount} öğrencinin karne netleri ve puanları anında yenilenecektir.
              </span>
            ) : (
              <span>Cevap anahtarı güncellenmeye hazır.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="btn btn-secondary text-xs py-2.5 px-4 rounded-xl flex-1 sm:flex-initial cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleSaveAndRecalculate}
              disabled={isSaving}
              className="btn btn-primary text-xs py-2.5 px-6 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 flex-1 sm:flex-initial cursor-pointer bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Sonuçlar Hesaplanıyor...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Cevap Anahtarını Kaydet & Sonuçları Güncelle</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
