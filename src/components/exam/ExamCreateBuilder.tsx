import React, { useState } from 'react';
import { FileText, Plus, Trash2, ChevronRight, ChevronLeft, Sparkles, Layers, Sliders, KeyRound, Copy, CheckCircle2, ArrowRight, Printer, ListOrdered, FileSpreadsheet, Upload, Download } from 'lucide-react';
import { SubjectConfig, Exam, User } from '../../types';
import { storageService } from '../../services/storageService';
import * as XLSX from 'xlsx';

interface ExamCreateBuilderProps {
  currentUser?: User;
  onNavigateToOMR?: (examId: string) => void;
  onNavigateToExams?: () => void;
}

export const ExamCreateBuilder: React.FC<ExamCreateBuilderProps> = ({
  currentUser,
  onNavigateToOMR,
  onNavigateToExams
}) => {
  const activeUser = currentUser || storageService.getCurrentUser();
  const institutions = storageService.getInstitutions();
  const gradeLevels = storageService.getGradeLevels();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Exam Basic Info
  const [selectedInstId, setSelectedInstId] = useState<string>(
    activeUser.institutionId || (institutions[0] ? institutions[0].id : 'inst-1')
  );
  const [examTitle, setExamTitle] = useState<string>('');
  const [examCode, setExamCode] = useState<string>('');
  const [gradeLevel, setGradeLevel] = useState<string>(gradeLevels[0]?.name || '8. Sınıf');
  const [defaultOptionCount, setDefaultOptionCount] = useState<number>(4);
  const [netPenaltyRatio, setNetPenaltyRatio] = useState<number>(3); // 3 for LGS
  const [isStudentSpecific, setIsStudentSpecific] = useState<boolean>(true);
  const [hasBookletTypes, setHasBookletTypes] = useState<boolean>(false);
  const [activeBookletTab, setActiveBookletTab] = useState<'A' | 'B'>('A');

const getSampleOutcomesForSubject = (name: string, count: number): string[] => {
  const lower = name.toLowerCase();
  let pool = [
    'Temel Bilgi ve Kavrama', 'Problem Çözme', 'Analiz ve Çıkarım', 'Yorumlama Becerisi',
    'Kavramsal İlişkilendirme', 'Uygulama Becerisi'
  ];
  if (lower.includes('türkçe') || lower.includes('edebiyat')) {
    pool = [
      'Sözcükte Anlam', 'Cümlede Anlam', 'Paragrafta Anlam', 'Paragrafta Yapı ve Ana Düşünce',
      'Fiilimsiler', 'Cümlenin Ögeleri', 'Yazım Kuralları', 'Noktalama İşaretleri',
      'Metin Türleri', 'Sözel Mantık ve Muhakeme'
    ];
  } else if (lower.includes('matematik') || lower.includes('geometri')) {
    pool = [
      'Çarpanlar ve Katlar', 'Üslü İfadeler', 'Kareköklü İfadeler', 'Veri Analizi',
      'Basit Olayların Olasılığı', 'Cebirsel İfadeler ve Özdeşlikler', 'Doğrusal Denklemler', 'Eğim ve Doğru Grafikleri',
      'Eşitsizlikler', 'Üçgenler ve Pisagor Bağıntısı'
    ];
  } else if (lower.includes('fen') || lower.includes('fizik') || lower.includes('kimya') || lower.includes('biyoloji')) {
    pool = [
      'Mevsimlerin Oluşumu', 'İklim ve Hava Hareketleri', 'DNA ve Genetik Kod', 'Kalıtım ve Çaprazlama',
      'Mutasyon ve Modifikasyon', 'Basınç (Katı ve Sıvı)', 'Periyodik Sistem', 'Fiziksel ve Kimyasal Değişimler',
      'Asitler ve Bazlar', 'Basit Makineler'
    ];
  } else if (lower.includes('tarih') || lower.includes('inkılap') || lower.includes('sosyal')) {
    pool = [
      'Bir Kahraman Doğuyor', 'Milli Uyanış: Bağımsızlık Yolunda Adımlar', 'Milli Bir Destan: Ya İstiklal Ya Ölüm',
      'Atatürkçülük ve Çağdaşlaşan Türkiye', 'Demokratikleşme Çabaları', 'Dış Politika'
    ];
  } else if (lower.includes('ingilizce') || lower.includes('yabancı dil')) {
    pool = [
      'Friendship', 'Teen Life', 'In The Kitchen', 'On The Phone', 'The Internet',
      'Adventures', 'Tourism', 'Chores', 'Science'
    ];
  } else if (lower.includes('din')) {
    pool = [
      'Kader İnancı', 'Zekat ve Sadaka', 'Din ve Hayat', 'Hz. Muhammed’in Örnekliği', 'Kur’an-ı Kerim ve Özellikleri'
    ];
  }

  const outcomes: string[] = [];
  for (let i = 0; i < count; i++) {
    outcomes.push(pool[i % pool.length]);
  }
  return outcomes;
};

  // Step 2: Subjects & Question Counts
  const [subjects, setSubjects] = useState<SubjectConfig[]>([
    {
      id: 'sbj-1',
      name: 'Türkçe',
      questionCount: 20,
      optionCount: 4,
      correctAnswers: Array(20).fill('A'),
      learningOutcomes: getSampleOutcomesForSubject('Türkçe', 20)
    },
    {
      id: 'sbj-2',
      name: 'Matematik',
      questionCount: 20,
      optionCount: 4,
      correctAnswers: Array(20).fill('B'),
      learningOutcomes: getSampleOutcomesForSubject('Matematik', 20)
    },
    {
      id: 'sbj-3',
      name: 'Fen Bilimleri',
      questionCount: 20,
      optionCount: 4,
      correctAnswers: Array(20).fill('C'),
      learningOutcomes: getSampleOutcomesForSubject('Fen Bilimleri', 20)
    }
  ]);

  // Step 3: Quick Answer Key Paste State
  const [quickPasteText, setQuickPasteText] = useState<string>('');
  const [pasteSuccessMsg, setPasteSuccessMsg] = useState<string | null>(null);

  // Created Exam Result State
  const [createdExam, setCreatedExam] = useState<Exam | null>(null);

  const handleDefaultOptionChange = (count: number) => {
    setDefaultOptionCount(count);
    setSubjects(subjects.map(s => ({ ...s, optionCount: count })));
  };

  const handleAddSubject = (defaultName = '') => {
    const name = defaultName || `Ders ${subjects.length + 1}`;
    const newSubject: SubjectConfig = {
      id: `sbj-${Date.now()}-${subjects.length}`,
      name,
      questionCount: 15,
      optionCount: defaultOptionCount,
      correctAnswers: Array(15).fill('A'),
      learningOutcomes: getSampleOutcomesForSubject(name, 15)
    };
    setSubjects([...subjects, newSubject]);
  };

  const handleRemoveSubject = (id: string) => {
    if (subjects.length <= 1) {
      alert('En az 1 ders bulunmalıdır.');
      return;
    }
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const handleSubjectChange = (id: string, field: keyof SubjectConfig, value: any) => {
    setSubjects(subjects.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, [field]: value };
      if (field === 'questionCount') {
        const qCount = Math.max(1, Math.min(50, Number(value)));
        updated.questionCount = qCount;
        const currentAns = [...s.correctAnswers];
        if (currentAns.length < qCount) {
          while (currentAns.length < qCount) currentAns.push('A');
        } else {
          currentAns.length = qCount;
        }
        updated.correctAnswers = currentAns;

        const currentOutcomes = [...(s.learningOutcomes || [])];
        const samplePool = getSampleOutcomesForSubject(s.name, qCount);
        if (currentOutcomes.length < qCount) {
          while (currentOutcomes.length < qCount) {
            currentOutcomes.push(samplePool[currentOutcomes.length] || '');
          }
        } else {
          currentOutcomes.length = qCount;
        }
        updated.learningOutcomes = currentOutcomes;
      }
      return updated;
    }));
  };

  const handleAnswerSelect = (subjectId: string, qIndex: number, option: string) => {
    setSubjects(subjects.map(s => {
      if (s.id !== subjectId) return s;
      if (hasBookletTypes && activeBookletTab === 'B') {
        const newAnswersB = [...(s.correctAnswersB || [...s.correctAnswers])];
        newAnswersB[qIndex] = option;
        return { ...s, correctAnswersB: newAnswersB };
      } else {
        const newAnswers = [...s.correctAnswers];
        newAnswers[qIndex] = option;
        return { ...s, correctAnswers: newAnswers };
      }
    }));
  };

  const handleOutcomeChange = (subjectId: string, qIndex: number, outcome: string) => {
    setSubjects(subjects.map(s => {
      if (s.id !== subjectId) return s;
      const currentOutcomes = [...(s.learningOutcomes || Array(s.questionCount).fill(''))];
      currentOutcomes[qIndex] = outcome;
      return { ...s, learningOutcomes: currentOutcomes };
    }));
  };

  // Quick Paste Answer Key Parser
  const handleApplyQuickPaste = () => {
    if (!quickPasteText.trim()) return;

    const cleaned = quickPasteText.toUpperCase();
    const lettersMatch = cleaned.match(/[A-E]/g) || [];

    if (lettersMatch.length === 0) {
      alert('Yapıştırılan metinde geçerli şık harfleri (A, B, C, D, E) bulunamadı.');
      return;
    }

    let letterPointer = 0;
    const isTargetingB = hasBookletTypes && activeBookletTab === 'B';
    const updatedSubjects = subjects.map(s => {
      const answers = isTargetingB
        ? [...(s.correctAnswersB || [...s.correctAnswers])]
        : [...s.correctAnswers];
      for (let i = 0; i < answers.length; i++) {
        if (letterPointer < lettersMatch.length) {
          const char = lettersMatch[letterPointer];
          if (s.optionCount === 4 && char === 'E') {
            answers[i] = 'D';
          } else {
            answers[i] = char;
          }
          letterPointer++;
        }
      }
      return isTargetingB ? { ...s, correctAnswersB: answers } : { ...s, correctAnswers: answers };
    });

    setSubjects(updatedSubjects);
    setPasteSuccessMsg(`${isTargetingB ? 'B Kitapçığı için ' : ''}${letterPointer} adet soru cevabı otomatik olarak aktarıldı!`);
    setTimeout(() => setPasteSuccessMsg(null), 3500);
  };

  const handleRandomFillAnswers = () => {
    const options = defaultOptionCount === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];
    const updatedSubjects = subjects.map(s => ({
      ...s,
      correctAnswers: s.correctAnswers.map(() => options[Math.floor(Math.random() * options.length)]),
      correctAnswersB: hasBookletTypes
        ? s.correctAnswers.map(() => options[Math.floor(Math.random() * options.length)])
        : undefined,
      learningOutcomes: s.learningOutcomes && s.learningOutcomes.length === s.questionCount
        ? s.learningOutcomes
        : getSampleOutcomesForSubject(s.name, s.questionCount)
    }));
    setSubjects(updatedSubjects);
    setPasteSuccessMsg('Rastgele demo cevap anahtarı ve örnek kazanımlar başarıyla üretildi!');
    setTimeout(() => setPasteSuccessMsg(null), 3000);
  };

  // Download Sample Excel (.xlsx) Answer Key Template with Kazanım column
  const handleDownloadSampleExcelTemplate = () => {
    const headers = hasBookletTypes
      ? ['Ders Adı', 'Soru No', 'A Kitapçığı Cevabı', 'B Kitapçığı Cevabı', 'Kazanım / Konu']
      : ['Ders Adı', 'Soru No', 'Doğru Cevap', 'Kazanım / Konu'];
    const rows: (string | number)[][] = [headers];
    const sampleOptions = ['A', 'B', 'C', 'D', 'E'];

    if (subjects.length > 0) {
      subjects.forEach((sbj) => {
        const outcomes = sbj.learningOutcomes || getSampleOutcomesForSubject(sbj.name, sbj.questionCount);
        for (let i = 0; i < sbj.questionCount; i++) {
          const optA = sbj.correctAnswers[i] || sampleOptions[i % (sbj.optionCount || 4)];
          const optB = sbj.correctAnswersB?.[i] || sampleOptions[(i + 1) % (sbj.optionCount || 4)];
          const outcome = outcomes[i] || '';
          if (hasBookletTypes) {
            rows.push([sbj.name, i + 1, optA, optB, outcome]);
          } else {
            rows.push([sbj.name, i + 1, optA, outcome]);
          }
        }
      });
    } else {
      const turkceOutcomes = getSampleOutcomesForSubject('Türkçe', 20);
      for (let i = 1; i <= 20; i++) {
        if (hasBookletTypes) {
          rows.push(['Türkçe', i, sampleOptions[(i - 1) % 4], sampleOptions[i % 4], turkceOutcomes[i - 1]]);
        } else {
          rows.push(['Türkçe', i, sampleOptions[(i - 1) % 4], turkceOutcomes[i - 1]]);
        }
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = hasBookletTypes
      ? [{ wch: 18 }, { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 32 }]
      : [{ wch: 18 }, { wch: 10 }, { wch: 14 }, { wch: 32 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cevap Anahtarı');
    XLSX.writeFile(wb, `Opteno_Cevap_Anahtari_Sablonu_${examCode || 'SINAV'}.xlsx`);
  };

  // Upload and Parse Excel (.xlsx / .xls) or CSV Answer Key File
  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const processRows = (rawRows: (string | number)[][]) => {
      let count = 0;
      let letterArray: string[] = [];

      // Create a mutable copy of subjects
      const updatedSubjects = subjects.map(s => ({
        ...s,
        correctAnswers: [...s.correctAnswers],
        correctAnswersB: s.correctAnswersB ? [...s.correctAnswersB] : [...s.correctAnswers]
      }));

      for (let rIndex = 0; rIndex < rawRows.length; rIndex++) {
        const row = rawRows[rIndex];
        if (!row || row.length === 0) continue;

        // Skip header row if detected
        const col0Str = String(row[0] || '').trim().toLowerCase();
        if (
          rIndex === 0 &&
          (col0Str.includes('ders') ||
            col0Str.includes('soru') ||
            col0Str.includes('konu') ||
            col0Str.includes('subject') ||
            col0Str.includes('no'))
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
            if (['A', 'B', 'C', 'D', 'E'].includes(ansA)) targetSub.correctAnswers[qNo - 1] = ansA;
            if (['A', 'B', 'C', 'D', 'E'].includes(ansB)) {
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
          // Format standard: Subject, QuestionNo, Answer, [Outcome]
          const sbjName = String(row[0] || '').replace(/"/g, '').trim();
          const qNo = parseInt(String(row[1] || '').trim(), 10);
          const ans = String(row[2] || '').replace(/"/g, '').trim().toUpperCase();
          const outcome = row[3] !== undefined && row[3] !== null ? String(row[3]).replace(/"/g, '').trim() : '';

          if (ans && ['A', 'B', 'C', 'D', 'E'].includes(ans)) {
            const targetSub = updatedSubjects.find(s => s.name.toLowerCase() === sbjName.toLowerCase());
            if (targetSub && !isNaN(qNo) && qNo >= 1 && qNo <= targetSub.questionCount) {
              if (hasBookletTypes && activeBookletTab === 'B') {
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
          // Extract letters from cells if in compact format
          for (const cell of row) {
            const str = String(cell || '').toUpperCase();
            const matches = str.match(/[A-E]/g) || [];
            letterArray.push(...matches);
          }
        }
      }

      if (count > 0) {
        setSubjects(updatedSubjects);
        setPasteSuccessMsg(`Excel dosyasından ${count} adet soru cevabı başarıyla aktarıldı!`);
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
        setPasteSuccessMsg(`Excel dosyasındaki ${letterPointer} adet cevap aktarıldı!`);
      } else {
        alert('Yüklenen Excel/CSV dosyasında geçerli cevap anahtarı bulunamadı.');
      }

      setTimeout(() => setPasteSuccessMsg(null), 3500);
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
          alert('Excel dosyası okunurken hata oluştu. Lütfen dosya formatını kontrol ediniz.');
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

  const totalQuestions = subjects.reduce((sum, s) => sum + s.questionCount, 0);

  // Save Exam Function
  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim()) {
      alert('Lütfen sınav adını giriniz.');
      return;
    }

    const inst = institutions.find(i => i.id === selectedInstId) || institutions[0];
    const generatedCode = examCode.trim() || `EXAM-${Math.floor(100 + Math.random() * 900)}`;
    const examId = `exam-${Date.now()}`;

    const newExam: Exam = {
      id: examId,
      institutionId: selectedInstId,
      institutionName: inst ? inst.name : 'OpticOk Kurumu',
      title: examTitle.trim(),
      examCode: generatedCode,
      date: new Date().toISOString().split('T')[0],
      gradeLevel,
      netPenaltyRatio,
      defaultOptionCount,
      hasBookletTypes,
      subjects,
      totalQuestions,
      totalExamsScanned: 0,
      isStudentSpecific,
      createdAt: new Date().toISOString()
    };

    storageService.addExam(newExam);
    setCreatedExam(newExam);
  };

  return (
    <div className="mx-auto max-w-4xl px-2 sm:px-4 py-4 space-y-6">
      {/* Step Wizard Bar */}
      <div className="glass-panel p-4 rounded-2xl flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2 sm:gap-4 min-w-max">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              currentStep === 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white bg-slate-900/50'
            }`}
          >
            <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">1</span>
            Sınav Bilgileri & Kurallar
          </button>

          <ChevronRight className="h-4 w-4 text-slate-600" />

          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              currentStep === 2 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white bg-slate-900/50'
            }`}
          >
            <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">2</span>
            Dersler & Soru Sayıları ({subjects.length} Ders, {totalQuestions} Soru)
          </button>

          <ChevronRight className="h-4 w-4 text-slate-600" />

          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              currentStep === 3 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white bg-slate-900/50'
            }`}
          >
            <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">3</span>
            Cevap Anahtarı & Kaydet
          </button>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="glass-panel p-6 space-y-6">

        {/* STEP 1: EXAM BASIC INFO */}
        {currentStep === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); setCurrentStep(2); }} className="space-y-5 animate-fade-in">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="h-5 w-5 text-indigo-400" /> 1. Sınav Temel Bilgileri ve Kurallar
              </h2>
              <p className="text-xs text-slate-400 mt-1">Sınavın adını, hangi sınıflara uygulanacağını ve değerlendirme kurallarını belirleyin.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sınav Adı *</label>
                <input
                  type="text"
                  required
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="input-field text-xs"
                  placeholder="ör. 8. Sınıf LGS Kurumsal Deneme - 01"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sınav Kodu / Kısaltması</label>
                <input
                  type="text"
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value)}
                  className="input-field text-xs font-mono"
                  placeholder="LGS-2026-01"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Uygulanacağı Sınıf Seviyesi *</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="input-field text-xs bg-slate-900"
                >
                  {gradeLevels.map(gl => (
                    <option key={gl.id} value={gl.name}>{gl.name} ({gl.category})</option>
                  ))}
                  <option value="Tüm Seviyeler">Genel / Tüm Seviyeler</option>
                </select>
              </div>

              {activeUser.role === 'SUPER_ADMIN' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Hedef Kurum</label>
                  <select
                    value={selectedInstId}
                    onChange={(e) => setSelectedInstId(e.target.value)}
                    className="input-field text-xs bg-slate-900"
                  >
                    {institutions.map(inst => (
                      <option key={inst.id} value={inst.id}>{inst.name} ({inst.city})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Exam Rules & Options */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-indigo-400" /> Sınav Değerlendirme Kuralları
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Şık Sayısı Tercihi</label>
                  <select
                    value={defaultOptionCount}
                    onChange={(e) => handleDefaultOptionChange(Number(e.target.value))}
                    className="input-field text-xs bg-slate-950"
                  >
                    <option value={4}>4 Şıklı (A, B, C, D - LGS Standart)</option>
                    <option value={5}>5 Şıklı (A, B, C, D, E - TYT / YKS Standart)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Net Hesaplama Kuralı</label>
                  <select
                    value={netPenaltyRatio}
                    onChange={(e) => setNetPenaltyRatio(Number(e.target.value))}
                    className="input-field text-xs bg-slate-950"
                  >
                    <option value={3}>3 Yanlış 1 Doğruyu Götürür (LGS)</option>
                    <option value={4}>4 Yanlış 1 Doğruyu Götürür (TYT / YKS)</option>
                    <option value={0}>Yanlışlar Doğruyu Götürmez (Sadece Doğrular)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isStudentSpecific}
                    onChange={(e) => setIsStudentSpecific(e.target.checked)}
                    className="rounded accent-indigo-600 h-4 w-4 cursor-pointer"
                  />
                  Öğrenciye Özel İsimli ve Karekodlu (QR) Optik Basımı Açık Olacak
                </label>

                <label className="flex items-start gap-2 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasBookletTypes}
                    onChange={(e) => setHasBookletTypes(e.target.checked)}
                    className="rounded accent-indigo-600 h-4 w-4 cursor-pointer mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-white">Çoklu Kitapçık Türü (A ve B Kitapçığı) Kullanılsın</span>
                    <p className="text-[11px] text-slate-400">
                      Etkinleştirildiğinde optik formda A/B kodlama kutucukları çıkar ve 2 farklı cevap anahtarı tanımlanabilir.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="btn btn-primary text-xs py-2.5 px-5 flex items-center gap-2"
              >
                Sonraki Adım: Dersler & Soru Sayıları <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: SUBJECTS & QUESTION COUNTS */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-400" /> 2. Dersler ve Soru Sayıları
                </h2>
                <p className="text-xs text-slate-400 mt-1">Sınavda uygulanacak ders gruplarını ve soru sayılarını sırasıyla belirleyin.</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAddSubject('Türkçe')}
                  className="btn btn-secondary text-[11px] py-1 px-2.5"
                >
                  + Türkçe
                </button>
                <button
                  onClick={() => handleAddSubject('Matematik')}
                  className="btn btn-secondary text-[11px] py-1 px-2.5"
                >
                  + Matematik
                </button>
                <button
                  onClick={() => handleAddSubject('Fen Bilimleri')}
                  className="btn btn-secondary text-[11px] py-1 px-2.5"
                >
                  + Fen
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {subjects.map((sbj, idx) => (
                <div key={sbj.id} className="glass-card p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <span className="h-6 w-6 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={sbj.name}
                      onChange={(e) => handleSubjectChange(sbj.id, 'name', e.target.value)}
                      className="input-field text-xs font-bold"
                      placeholder="Ders Adı"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400 font-semibold">Soru Sayısı:</span>
                      <input
                        type="number"
                        value={sbj.questionCount}
                        onChange={(e) => handleSubjectChange(sbj.id, 'questionCount', e.target.value)}
                        className="input-field w-16 text-center text-xs py-1 font-bold text-indigo-300"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400 font-semibold">Şık:</span>
                      <select
                        value={sbj.optionCount}
                        onChange={(e) => handleSubjectChange(sbj.id, 'optionCount', Number(e.target.value))}
                        className="input-field text-xs py-1 bg-slate-950"
                      >
                        <option value={4}>4 (A-D)</option>
                        <option value={5}>5 (A-E)</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleRemoveSubject(sbj.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                      title="Dersi Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => handleAddSubject()}
                className="w-full py-3 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 text-xs font-bold flex items-center justify-center gap-2 transition-all bg-slate-900/30"
              >
                <Plus className="h-4 w-4" /> Yeni Ders Ekle
              </button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="btn btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" /> Önceki Adım
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="btn btn-primary text-xs py-2.5 px-5 flex items-center gap-2"
              >
                Sonraki Adım: Cevap Anahtarı <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ANSWER KEY & SAVE */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-indigo-400" /> 3. Cevap Anahtarı ve Sınavı Kaydetme
                </h2>
                <p className="text-xs text-slate-400 mt-1">Cevap anahtarını metin yapıştırarak veya matristen seçip sınavı kaydedin.</p>
              </div>

              <button
                type="button"
                onClick={handleRandomFillAnswers}
                className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 text-amber-400 border-amber-500/30"
              >
                <Sparkles className="h-3.5 w-3.5" /> Demo Cevap Üret
              </button>
            </div>

            {/* Multi-Booklet Tab Switcher (Visible only if hasBookletTypes is enabled) */}
            {hasBookletTypes && (
              <div className="flex flex-wrap items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950/60 border border-indigo-500/30 gap-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Kitapçık Seçimi</span>
                    <span className="text-[10px] text-slate-400">Şu an düzenlenen kitapçık: <strong className="text-indigo-300">{activeBookletTab} Kitapçığı</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveBookletTab('A')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                      activeBookletTab === 'A'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    📕 A Kitapçığı
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveBookletTab('B')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                      activeBookletTab === 'B'
                        ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    📘 B Kitapçığı
                  </button>
                </div>
              </div>
            )}

            {/* Excel / CSV Import & Sample Template Download Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box 1: Excel Import */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Excel / CSV'den Cevap Anahtarı Yükle
                  </label>
                  <span className="text-[10px] text-slate-400">.xlsx, .xls, .csv, .txt</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadSampleExcelTemplate}
                    className="btn btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 text-emerald-400 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 font-semibold transition-all"
                    title="Excel (.xlsx) formatında örnek cevap anahtarı şablonunu indir"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-400" /> Örnek Şablon İndir (.xlsx)
                  </button>

                  <label className="btn btn-primary text-xs py-2 px-3 cursor-pointer flex items-center gap-1.5 shrink-0">
                    <Upload className="h-3.5 w-3.5" /> Excel Yükle
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv,.txt,.tsv"
                      className="hidden"
                      onChange={handleExcelFileUpload}
                    />
                  </label>
                </div>
              </div>

              {/* Box 2: Quick Text Paste Input Box */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Copy className="h-3.5 w-3.5 text-indigo-400" /> Hızlı Metin Yapıştırma {hasBookletTypes && `(${activeBookletTab} Kitapçığı)`}
                  </label>
                  <span className="text-[10px] text-slate-400">ör. "1A2B3C4D..." veya "ABCDE..."</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={quickPasteText}
                    onChange={(e) => setQuickPasteText(e.target.value)}
                    className="input-field text-xs font-mono text-indigo-300"
                    placeholder="Yapıştırın: 1A2B3C4D5E... veya ABCDEABCDE..."
                  />
                  <button
                    type="button"
                    onClick={handleApplyQuickPaste}
                    className="btn btn-primary text-xs py-2 px-4 shrink-0"
                  >
                    Aktar
                  </button>
                </div>
              </div>
            </div>

            {pasteSuccessMsg && (
              <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 animate-fade-in">
                <CheckCircle2 className="h-4 w-4" /> {pasteSuccessMsg}
              </p>
            )}

            {/* Visual Answer Matrix per Subject */}
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {subjects.map((sbj) => {
                const activeAnswers = (hasBookletTypes && activeBookletTab === 'B')
                  ? (sbj.correctAnswersB || sbj.correctAnswers)
                  : sbj.correctAnswers;

                return (
                  <div key={sbj.id} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                      <span className="font-bold text-white flex items-center gap-2">
                        {sbj.name} Cevap Anahtarı
                        {hasBookletTypes && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            activeBookletTab === 'A' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40'
                          }`}>
                            {activeBookletTab} Kitapçığı
                          </span>
                        )}
                      </span>
                      <span className="text-slate-400">{sbj.questionCount} Soru • {sbj.optionCount} Şıklı</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 pt-1">
                      {activeAnswers.map((ans, qIdx) => {
                        const options = sbj.optionCount === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];
                        const outcomeVal = sbj.learningOutcomes?.[qIdx] || '';
                        return (
                          <div key={qIdx} className="flex flex-col bg-slate-950 p-2 rounded-xl border border-slate-800 hover:border-slate-700 transition-all gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 font-bold">Soru {qIdx + 1}</span>
                              <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                                {ans}
                              </span>
                            </div>

                            <div className="flex justify-center gap-1">
                              {options.map(opt => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleAnswerSelect(sbj.id, qIdx, opt)}
                                  className={`h-6 w-6 text-[10px] font-bold rounded-lg transition-all ${
                                    ans === opt
                                      ? activeBookletTab === 'B' && hasBookletTypes
                                        ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/40 scale-105'
                                        : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 scale-105'
                                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>

                            <input
                              type="text"
                              value={outcomeVal}
                              onChange={(e) => handleOutcomeChange(sbj.id, qIdx, e.target.value)}
                              placeholder="Kazanım / Konu..."
                              className="w-full text-[10.5px] px-2 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-lg text-slate-200 placeholder:text-slate-600 transition-all"
                              title={`Soru ${qIdx + 1} Kazanımı / Konusu`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save Exam Action Bar */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="btn btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" /> Önceki Adım
              </button>

              <button
                type="button"
                onClick={handleSaveExam}
                className="btn btn-primary py-3 px-8 text-sm font-bold shadow-xl shadow-indigo-600/30 flex items-center gap-2"
              >
                <FileText className="h-5 w-5" /> Sınavı Kaydet & Sisteme Ekle
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Created Exam Success Modal */}
      {createdExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border-emerald-500/40 text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h3 className="font-display text-xl font-bold text-white">Sınav Başarıyla Oluşturuldu!</h3>
              <p className="text-xs text-slate-300 mt-1">
                <strong>{createdExam.title}</strong> ({createdExam.examCode}) başarıyla kaydedildi. Şimdi doğrudan bu sınav için optik basabilirsiniz.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1 text-left">
              <div>Seviye: <strong className="text-indigo-300">{createdExam.gradeLevel}</strong></div>
              <div>Toplam Soru: <strong className="text-white">{createdExam.totalQuestions} Soru</strong> ({createdExam.subjects.length} Ders)</div>
              <div>Net Kuralı: <strong className="text-amber-300">{createdExam.netPenaltyRatio ? `${createdExam.netPenaltyRatio} Yanlış 1 Doğruyu Götürür` : 'Yanlış Doğruyu Götürmez'}</strong></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToOMR) {
                    onNavigateToOMR(createdExam.id);
                  }
                }}
                className="btn btn-primary text-xs py-2.5 flex items-center justify-center gap-1.5"
              >
                <Printer className="h-4 w-4" /> Optik Üret Paneline Git
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onNavigateToExams) {
                    onNavigateToExams();
                  }
                }}
                className="btn btn-secondary text-xs py-2.5 flex items-center justify-center gap-1.5"
              >
                <ListOrdered className="h-4 w-4" /> Sınavlar Listesine Git
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
