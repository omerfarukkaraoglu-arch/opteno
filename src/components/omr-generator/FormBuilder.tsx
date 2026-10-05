import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Download, Printer, Check, ChevronRight, ChevronLeft, Sparkles, Layers, Sliders, KeyRound, Copy, HelpCircle, CheckCircle2, ArrowRight, Scissors } from 'lucide-react';
import { SubjectConfig, Exam, Student } from '../../types';
import { storageService } from '../../services/storageService';
import { pdfService, OMRPageFormat } from '../../services/pdfService';
import { qrService } from '../../services/qrService';

export const FormBuilder: React.FC = () => {
  const currentUser = storageService.getCurrentUser();
  const institutions = storageService.getInstitutions();
  const classes = storageService.getClasses(currentUser.institutionId);

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Exam Basic Info
  const [selectedInstId, setSelectedInstId] = useState<string>(
    currentUser.institutionId || (institutions[0] ? institutions[0].id : 'inst-1')
  );
  const [examTitle, setExamTitle] = useState<string>('8. Sınıf LGS Kurumsal Tarama - 01');
  const [examCode, setExamCode] = useState<string>('LGS-2026-01');
  const [gradeLevel, setGradeLevel] = useState<string>('8. Sınıf');
  const [defaultOptionCount, setDefaultOptionCount] = useState<number>(4);
  const [netPenaltyRatio, setNetPenaltyRatio] = useState<number>(3); // 3 for LGS
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [isStudentSpecific, setIsStudentSpecific] = useState<boolean>(true);
  const [pageFormat, setPageFormat] = useState<OMRPageFormat>('A4');

  // Step 2: Subjects & Questions
  const [subjects, setSubjects] = useState<SubjectConfig[]>([
    {
      id: 'sbj-1',
      name: 'Türkçe',
      questionCount: 20,
      optionCount: 4,
      correctAnswers: Array(20).fill('A')
    },
    {
      id: 'sbj-2',
      name: 'Matematik',
      questionCount: 20,
      optionCount: 4,
      correctAnswers: Array(20).fill('B')
    },
    {
      id: 'sbj-3',
      name: 'Fen Bilimleri',
      questionCount: 20,
      optionCount: 4,
      correctAnswers: Array(20).fill('C')
    }
  ]);

  // Step 3: Quick Answer Key Paste State
  const [quickPasteText, setQuickPasteText] = useState<string>('');
  const [pasteSuccessMsg, setPasteSuccessMsg] = useState<string | null>(null);

  // Preview & Export State
  const [previewQRUrl, setPreviewQRUrl] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [createdExamId, setCreatedExamId] = useState<string | null>(null);

  useEffect(() => {
    // Generate preview QR code
    qrService.generateOMRQRDataUrl('preview-exam-id', 'preview-student-id').then(url => {
      setPreviewQRUrl(url);
    });
  }, []);

  // Sync option count when defaultOptionCount changes in Step 1
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
      correctAnswers: Array(15).fill('A')
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
        // Adjust answers array size
        const currentAns = [...s.correctAnswers];
        if (currentAns.length < qCount) {
          while (currentAns.length < qCount) currentAns.push('A');
        } else {
          currentAns.length = qCount;
        }
        updated.correctAnswers = currentAns;
      }
      return updated;
    }));
  };

  const handleAnswerSelect = (subjectId: string, qIndex: number, option: string) => {
    setSubjects(subjects.map(s => {
      if (s.id !== subjectId) return s;
      const newAnswers = [...s.correctAnswers];
      newAnswers[qIndex] = option;
      return { ...s, correctAnswers: newAnswers };
    }));
  };

  // Quick Paste Answer Key Parser (Supports formats: "1A2B3C", "ABCDE...", "A B C D E")
  const handleApplyQuickPaste = () => {
    if (!quickPasteText.trim()) return;

    // Extract all option letters A-E or A-D
    const cleaned = quickPasteText.toUpperCase();
    const lettersMatch = cleaned.match(/[A-E]/g) || [];

    if (lettersMatch.length === 0) {
      alert('Yapıştırılan metinde geçerli şık harfleri (A, B, C, D, E) bulunamadı.');
      return;
    }

    let letterPointer = 0;
    const updatedSubjects = subjects.map(s => {
      const answers = [...s.correctAnswers];
      for (let i = 0; i < answers.length; i++) {
        if (letterPointer < lettersMatch.length) {
          const char = lettersMatch[letterPointer];
          // Limit to subject's optionCount
          if (s.optionCount === 4 && char === 'E') {
            answers[i] = 'D';
          } else {
            answers[i] = char;
          }
          letterPointer++;
        }
      }
      return { ...s, correctAnswers: answers };
    });

    setSubjects(updatedSubjects);
    setPasteSuccessMsg(`${letterPointer} adet soru cevabı otomatik olarak aktarıldı!`);
    setTimeout(() => setPasteSuccessMsg(null), 3500);
  };

  // Auto Generate Random Demo Answers
  const handleRandomFillAnswers = () => {
    const options = defaultOptionCount === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];
    const updatedSubjects = subjects.map(s => ({
      ...s,
      correctAnswers: s.correctAnswers.map(() => options[Math.floor(Math.random() * options.length)])
    }));
    setSubjects(updatedSubjects);
    setPasteSuccessMsg('Rastgele cevap anahtarı başarıyla üretildi!');
    setTimeout(() => setPasteSuccessMsg(null), 3000);
  };

  const totalQuestions = subjects.reduce((sum, s) => sum + s.questionCount, 0);

  // Save Exam & Generate Printable PDF
  const handleSaveAndExportPDF = async () => {
    setIsExporting(true);
    try {
      const inst = institutions.find(i => i.id === selectedInstId) || institutions[0];
      const examId = `exam-${Date.now()}`;

      const newExam: Exam = {
        id: examId,
        institutionId: selectedInstId,
        institutionName: inst ? inst.name : 'OpticOk Kurumu',
        title: examTitle,
        examCode,
        date: new Date().toISOString().split('T')[0],
        gradeLevel,
        netPenaltyRatio,
        defaultOptionCount,
        subjects,
        totalQuestions,
        totalExamsScanned: 0,
        isStudentSpecific,
        createdAt: new Date().toISOString()
      };

      // Save to Storage
      storageService.addExam(newExam);
      setCreatedExamId(examId);

      // Fetch students if student-specific
      let studentsList: Student[] = [];
      if (isStudentSpecific) {
        studentsList = storageService.getStudents(selectedInstId, selectedClassId || undefined);
      }

      // Generate PDF
      const pdf = await pdfService.generateOMRPDF(newExam, studentsList, pageFormat);
      const suffix = pageFormat === 'A5' ? '_A5_Tasarruf' : '_A4';
      pdf.save(`${examCode}_Optik_Form${suffix}.pdf`);

    } catch (err) {
      console.error('PDF export error:', err);
      alert('PDF oluşturulurken bir hata meydana geldi.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-2 sm:px-4 py-4 space-y-6">
      {/* Wizard Step Navigation Indicator */}
      <div className="glass-panel p-4 rounded-2xl flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2 sm:gap-4 min-w-max">
          <button
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
            onClick={() => setCurrentStep(3)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              currentStep === 3 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white bg-slate-900/50'
            }`}
          >
            <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">3</span>
            Cevap Anahtarı & Optik Üret
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Form Builder Wizard Panel */}
        <div className="lg:col-span-7 glass-panel p-6 space-y-6">

          {/* STEP 1: EXAM BASIC INFO */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-indigo-400" /> 1. Sınav Temel Bilgileri ve Kurallar
                </h2>
                <p className="text-xs text-slate-400 mt-1">Sınavın adını, uygulanacağı sınıf seviyesini ve değerlendirme kurallarını belirleyin.</p>
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
                    placeholder="ör. 8. Sınıf LGS Deneme Sınavı - 01"
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Uygulanacak Sınıf Seviyesi</label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="input-field text-xs bg-slate-900"
                  >
                    <option value="8. Sınıf">8. Sınıf (LGS)</option>
                    <option value="12. Sınıf">12. Sınıf (YKS / TYT / AYT)</option>
                    <option value="9. Sınıf">9. Sınıf</option>
                    <option value="10. Sınıf">10. Sınıf</option>
                    <option value="11. Sınıf">11. Sınıf</option>
                    <option value="Tüm Seviyeler">Genel / Tüm Seviyeler</option>
                  </select>
                </div>

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

                <div className="pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isStudentSpecific}
                      onChange={(e) => setIsStudentSpecific(e.target.checked)}
                      className="rounded accent-indigo-600 h-4 w-4 cursor-pointer"
                    />
                    Öğrenciye Özel İsimli ve Karekodlu (QR) Optik Form Üret
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="btn btn-primary text-xs py-2.5 px-5 flex items-center gap-2"
                >
                  Sonraki Adım: Dersler & Soru Sayıları <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SUBJECTS & QUESTION COUNTS */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                    <Layers className="h-5 w-5 text-indigo-400" /> 2. Dersler ve Soru Sayıları
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Sınavda yer alacak ders gruplarını ve soru sayılarını ayarlayın.</p>
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

          {/* STEP 3: ANSWER KEY & OPTICAL FORM GENERATION */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-indigo-400" /> 3. Pratik Cevap Anahtarı & Optik Üretim
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Cevap anahtarını metin yapıştırarak veya matrise tıklayarak hızlıca girin.</p>
                </div>

                <button
                  onClick={handleRandomFillAnswers}
                  className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 text-amber-400 border-amber-500/30"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Demo Cevap Doldur
                </button>
              </div>

              {/* Quick Text Paste Input Box */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Copy className="h-3.5 w-3.5 text-indigo-400" /> Hızlı Cevap Yapıştırma (Quick Paste)
                  </label>
                  <span className="text-[10px] text-slate-400">ör. "1A2B3C4D..." veya "ABCDA..."</span>
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
                    onClick={handleApplyQuickPaste}
                    className="btn btn-primary text-xs py-2 px-4 shrink-0"
                  >
                    Aktar
                  </button>
                </div>

                {pasteSuccessMsg && (
                  <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 animate-fade-in">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {pasteSuccessMsg}
                  </p>
                )}
              </div>

              {/* Visual Answer Matrix per Subject */}
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {subjects.map((sbj) => (
                  <div key={sbj.id} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                      <span className="font-bold text-white">{sbj.name} Cevap Anahtarı</span>
                      <span className="text-slate-400">{sbj.questionCount} Soru • {sbj.optionCount} Şıklı</span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-1">
                      {sbj.correctAnswers.map((ans, qIdx) => {
                        const options = sbj.optionCount === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];
                        return (
                          <div key={qIdx} className="flex flex-col items-center bg-slate-950 p-1.5 rounded border border-slate-800">
                            <span className="text-[10px] text-slate-500 font-bold">{qIdx + 1}</span>
                            <div className="flex gap-0.5 mt-1">
                              {options.map(opt => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleAnswerSelect(sbj.id, qIdx, opt)}
                                  className={`h-5 w-5 text-[10px] font-bold rounded transition-all ${
                                    ans === opt
                                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 scale-105'
                                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Paper Format Option (A4 vs A5) */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    Baskı & Kağıt Formatı
                  </label>
                  <span className={`badge text-[10px] font-bold ${pageFormat === 'A5' ? 'badge-success' : 'badge-primary'}`}>
                    {pageFormat === 'A5' ? 'A5 (%50 Kağıt Tasarrufu)' : 'A4 (Standart)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPageFormat('A4')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      pageFormat === 'A4'
                        ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-md'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">A4 Standart</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Her sayfada 1 tam boy optik</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPageFormat('A5')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      pageFormat === 'A5'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-md'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs text-emerald-400 flex items-center gap-1">
                      A5 Tasarruf <Scissors className="h-3 w-3" />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">1 A4'te 2 optik (Ortadan kesilir)</div>
                  </button>
                </div>
              </div>

              {/* Export Action Button */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="btn btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  <ChevronLeft className="h-4 w-4" /> Ders Düzenle
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndExportPDF}
                  disabled={isExporting}
                  className="btn btn-primary py-3 px-6 text-sm font-bold shadow-xl shadow-indigo-600/30 flex items-center gap-2"
                >
                  {isExporting ? <Printer className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                  {isExporting 
                    ? 'Optik Form PDF Üretiliyor...' 
                    : `Sınavı Kaydet & PDF İndir (${pageFormat === 'A5' ? 'A5 Tasarruf' : 'A4'})`}
                </button>
              </div>

              {createdExamId && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between gap-2 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    <span>Sınav başarıyla kaydedildi ve optik PDF indirildi!</span>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Printable OMR Live Preview Sheet */}
        <div className="lg:col-span-5">
          <div className="glass-panel p-5 sticky top-20 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-slate-200">A4 Baskı Önizleme</h3>
              <span className="badge badge-primary text-[10px]">4 Köşe Siyah Hizalama</span>
            </div>

            {/* SVG Live OMR Sheet Mockup */}
            <div className="bg-white text-slate-900 rounded-xl p-4 shadow-2xl border border-slate-200 aspect-[1/1.4] overflow-hidden flex flex-col justify-between relative">
              
              {/* 4 Corner Markers */}
              <div className="absolute top-3 left-3 w-4 h-4 bg-black" />
              <div className="absolute top-3 right-3 w-4 h-4 bg-black" />
              <div className="absolute bottom-3 left-3 w-4 h-4 bg-black" />
              <div className="absolute bottom-3 right-3 w-4 h-4 bg-black" />

              {/* Header Box */}
              <div>
                <div className="text-center mt-2">
                  <p className="font-extrabold text-xs tracking-wider uppercase text-slate-900">
                    {institutions.find(i => i.id === selectedInstId)?.name || 'KURUM ADI'}
                  </p>
                  <p className="font-bold text-[11px] text-indigo-950 mt-0.5">{examTitle}</p>
                  <p className="text-[9px] text-slate-600 font-semibold">
                    Seviye: {gradeLevel} | Kod: {examCode} | Toplam {totalQuestions} Soru
                  </p>
                </div>

                {/* Student Info & QR Box */}
                <div className="mt-3 flex items-center justify-between border border-slate-400 p-2 rounded bg-slate-50">
                  <div className="text-[9px] space-y-0.5">
                    <p className="font-bold text-slate-900">ÖĞRENCİ BİLGİLERİ</p>
                    <p>Ad Soyad: {isStudentSpecific ? 'Zeynep Demir' : '________________'}</p>
                    <p>No: {isStudentSpecific ? '1001' : '[   ][   ][   ]'}</p>
                  </div>
                  {previewQRUrl && (
                    <img src={previewQRUrl} alt="Optik QR" className="h-10 w-10 border border-slate-300 rounded" />
                  )}
                </div>
              </div>

              {/* Subject Bubble Preview Columns */}
              <div className="grid grid-cols-2 gap-2 my-2 flex-1">
                {subjects.slice(0, 2).map((sbj, idx) => (
                  <div key={idx} className="border border-slate-300 rounded p-1.5 bg-slate-50/50">
                    <p className="text-[9px] font-bold text-center bg-indigo-100 text-indigo-950 py-0.5 rounded">{sbj.name}</p>
                    <div className="space-y-1 mt-1 text-[8px]">
                      {Array.from({ length: Math.min(8, sbj.questionCount) }).map((_, q) => (
                        <div key={q} className="flex items-center justify-between">
                          <span className="font-bold text-slate-700">{q + 1}.</span>
                          <div className="flex gap-1">
                            {(sbj.optionCount === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D']).map(opt => (
                              <div key={opt} className="w-2.5 h-2.5 rounded-full border border-slate-600 flex items-center justify-center text-[6px]">
                                {opt}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[7px] text-center text-slate-400 italic">
                * Bu karekodlu optik A4 yüksek çözünürlüklü baskı formatında indirilir.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
