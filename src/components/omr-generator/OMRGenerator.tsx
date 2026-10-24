import React, { useState, useEffect, useMemo } from 'react';
import { 
  Printer, Download, Sparkles, Layers, Sliders, CheckCircle2, ChevronRight, 
  PlusCircle, ArrowLeft, Eye, HelpCircle, Scissors, Users, Search, X, 
  Building2, AlertTriangle, CheckSquare, Square, KeyRound 
} from 'lucide-react';
import { Exam, Student } from '../../types';
import { storageService } from '../../services/storageService';
import { pdfService, OMRPageFormat } from '../../services/pdfService';
import { qrService } from '../../services/qrService';
import { EditAnswerKeyModal } from '../exam/EditAnswerKeyModal';

interface OMRGeneratorProps {
  initialExamId?: string;
  onNavigateToExams?: () => void;
  onNavigateToCreateExam?: () => void;
}

export const OMRGenerator: React.FC<OMRGeneratorProps> = ({
  initialExamId,
  onNavigateToExams,
  onNavigateToCreateExam
}) => {
  const currentUser = storageService.getCurrentUser();
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const institutions = storageService.getInstitutions();
  const exams = storageService.getExams();

  // Selected Exam State
  const [selectedExamId, setSelectedExamId] = useState<string>(() => {
    if (initialExamId && exams.some(e => e.id === initialExamId)) {
      return initialExamId;
    }
    return exams.length > 0 ? exams[0].id : '';
  });

  const selectedExam = exams.find(e => e.id === selectedExamId) || null;

  // Selected Institution State (for Super Admin to choose institution freely)
  const [selectedInstId, setSelectedInstId] = useState<string>(() => {
    if (isSuperAdmin) {
      if (selectedExam && selectedExam.institutionId && selectedExam.institutionId !== 'ALL' && selectedExam.institutionId !== 'SYSTEM') {
        return selectedExam.institutionId;
      }
      return 'ALL';
    }
    return currentUser.institutionId || '';
  });

  // When selected exam changes, update institution filter if it belongs to a specific institution
  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    const ex = exams.find(e => e.id === examId);
    if (isSuperAdmin && ex && ex.institutionId && ex.institutionId !== 'ALL' && ex.institutionId !== 'SYSTEM') {
      setSelectedInstId(ex.institutionId);
    }
  };

  // Available classes and students based on user role and selected institution
  const availableClasses = useMemo(() => {
    const instId = isSuperAdmin ? (selectedInstId === 'ALL' ? undefined : selectedInstId) : currentUser.institutionId;
    return storageService.getClasses(instId);
  }, [isSuperAdmin, selectedInstId, currentUser.institutionId]);

  const availableStudents = useMemo(() => {
    const instId = isSuperAdmin ? (selectedInstId === 'ALL' ? undefined : selectedInstId) : currentUser.institutionId;
    return storageService.getStudents(instId);
  }, [isSuperAdmin, selectedInstId, currentUser.institutionId]);

  // Selected Class Filter State
  const [selectedClassId, setSelectedClassId] = useState<string>('GENERIC');
  const [pageFormat, setPageFormat] = useState<OMRPageFormat>('A4');
  const [previewQRUrl, setPreviewQRUrl] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isEditAnswerKeyOpen, setIsEditAnswerKeyOpen] = useState<boolean>(false);
  const [updatedBanner, setUpdatedBanner] = useState<string | null>(null);

  // Candidate students based on class selection
  const candidateStudents = useMemo(() => {
    if (selectedClassId === 'GENERIC') {
      return [];
    }
    if (selectedClassId === 'ALL') {
      return availableStudents;
    }
    return availableStudents.filter(s => s.classId === selectedClassId);
  }, [availableStudents, selectedClassId]);

  // Selected student IDs (Set) for individual student inclusion / exclusion
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Search filter query inside student list
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');

  // Whenever candidate students list changes (class / inst change), default to selecting all candidates
  useEffect(() => {
    if (candidateStudents.length > 0) {
      setSelectedStudentIds(new Set(candidateStudents.map(s => s.id)));
    } else {
      setSelectedStudentIds(new Set());
    }
    setStudentSearchQuery('');
  }, [candidateStudents]);

  // Filtered candidate students by search query
  const filteredCandidateStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return candidateStudents;
    const q = studentSearchQuery.toLowerCase().trim();
    return candidateStudents.filter(s => 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      (s.studentNo && s.studentNo.toLowerCase().includes(q)) ||
      (s.className && s.className.toLowerCase().includes(q))
    );
  }, [candidateStudents, studentSearchQuery]);

  // Toggle single student selection
  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all candidate students
  const handleSelectAll = () => {
    setSelectedStudentIds(new Set(candidateStudents.map(s => s.id)));
  };

  // Deselect all candidate students
  const handleDeselectAll = () => {
    setSelectedStudentIds(new Set());
  };

  // Target students to generate OMR forms for
  const getTargetStudents = (): Student[] => {
    if (selectedClassId === 'GENERIC') {
      return []; // Return empty list to generate 1 generic blank form
    }
    return candidateStudents.filter(s => selectedStudentIds.has(s.id));
  };

  // First and second selected students for realistic preview
  const firstSelectedStudent = useMemo(() => {
    return candidateStudents.find(s => selectedStudentIds.has(s.id)) || null;
  }, [candidateStudents, selectedStudentIds]);

  const secondSelectedStudent = useMemo(() => {
    return candidateStudents.filter(s => selectedStudentIds.has(s.id))[1] || null;
  }, [candidateStudents, selectedStudentIds]);

  // Generate live preview QR code when selected exam or selected student changes
  useEffect(() => {
    if (selectedExam) {
      const sampleStudent = firstSelectedStudent;
      qrService.generateOMRQRDataUrl(
        selectedExam.id,
        sampleStudent ? sampleStudent.id : 'PREVIEW-STUDENT',
        {
          examCode: selectedExam.examCode,
          studentNo: sampleStudent ? sampleStudent.studentNo : '1042',
          instId: selectedExam.institutionId,
          studentName: sampleStudent ? `${sampleStudent.firstName} ${sampleStudent.lastName}` : 'Örnek Öğrenci'
        }
      ).then(url => {
        setPreviewQRUrl(url);
      });
    }
  }, [selectedExamId, firstSelectedStudent]);

  // Generate and download PDF
  const handleExportPDF = async () => {
    if (!selectedExam) {
      alert('Lütfen optik formunu üretmek istediğiniz sınavı seçin.');
      return;
    }

    if (selectedClassId !== 'GENERIC' && selectedStudentIds.size === 0) {
      alert('Lütfen optik form basılacak en az 1 öğrenci seçin.');
      return;
    }

    setIsExporting(true);
    try {
      const targetStudents = getTargetStudents();
      const pdfDoc = await pdfService.generateOMRPDF(selectedExam, targetStudents, pageFormat);
      const suffix = pageFormat === 'A5' ? '_A5_Tasarruf' : '_A4';
      const countLabel = selectedClassId === 'GENERIC' ? '_Bos_Form' : `_${targetStudents.length}_Ogrenci`;
      const filename = `${selectedExam.examCode || 'Opteno'}_Optik_Formlar${countLabel}${suffix}.pdf`;
      pdfDoc.save(filename);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF oluşturulurken bir hata oluştu.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-2 sm:px-4 py-4 space-y-6">
      {/* Top Header Card */}
      <div className="glass-panel p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-lg sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Printer className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-500 dark:text-indigo-400 shrink-0" /> 
              <span>Optik Form Üretme & Yazdırma Paneli</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sistemde kayıtlı sınavınız için yüksek çözünürlüklü A4 optik cevap formları üretin ve yazdırın.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          {onNavigateToCreateExam && (
            <button
              onClick={onNavigateToCreateExam}
              className="btn btn-secondary text-xs py-2 px-2.5 sm:px-3 flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" /> 
              <span className="truncate">Sınav Oluştur</span>
            </button>
          )}

          {onNavigateToExams && (
            <button
              onClick={onNavigateToExams}
              className="btn btn-secondary text-xs py-2 px-2.5 sm:px-3 flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" /> 
              <span className="truncate">Sınavlar Listesi</span>
            </button>
          )}
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="glass-panel p-12 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
            <Printer className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-white">Henüz Kayıtlı Bir Sınav Bulunamadı</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Optik form basabilmek için öncelikle "Sınav Oluştur" panelinden sınavınızı ve ders soru sayılarını tanımlamanız gerekmektedir.
          </p>
          {onNavigateToCreateExam && (
            <button
              onClick={onNavigateToCreateExam}
              className="btn btn-primary text-xs py-2.5 px-6 font-bold shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" /> Hemen Yeni Sınav Oluştur
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column (Left) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Exam Picker Box */}
            <div className="glass-panel p-5 space-y-4">
              <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-indigo-400" /> 1. Sınav & Kurum Seçimi
              </h2>

              {/* Kurum Filtresi (Sadece Sistem Admini için görünür) */}
              {isSuperAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-indigo-500" /> Kurum Filtresi (Sistem Yöneticisi)
                  </label>
                  <select
                    value={selectedInstId}
                    onChange={(e) => {
                      setSelectedInstId(e.target.value);
                      setSelectedClassId('ALL');
                    }}
                    className="input-field text-xs bg-white dark:bg-slate-900 font-medium py-2"
                  >
                    <option value="ALL">Tüm Kurumlar (Hepsi)</option>
                    {institutions.map(inst => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.city})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Sınavı Seçiniz *
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <select
                    value={selectedExamId}
                    onChange={(e) => handleExamChange(e.target.value)}
                    className="input-field text-xs bg-white dark:bg-slate-900 font-medium py-2.5 flex-1"
                  >
                    {exams.map(exam => (
                      <option key={exam.id} value={exam.id}>
                        {exam.title} ({exam.examCode}) - {exam.gradeLevel || 'Genel'}
                      </option>
                    ))}
                  </select>

                  {selectedExam && (
                    <button
                      type="button"
                      onClick={() => setIsEditAnswerKeyOpen(true)}
                      className="btn btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 shrink-0 cursor-pointer"
                      title="Optik basmadan önce veya bastıktan sonra cevap anahtarını inceleyin ya da düzenleyin"
                    >
                      <KeyRound className="h-4 w-4 text-amber-500" />
                      <span>Cevap Anahtarı</span>
                    </button>
                  )}
                </div>

                {selectedExam && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="badge badge-info text-[10px]">
                      {selectedExam.subjects.length} Ders • {selectedExam.totalQuestions} Soru
                    </span>
                    {selectedExam.hasBookletTypes && (
                      <span className="badge badge-warning text-[10px] font-bold">
                        A/B Kitapçıklı
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      (Optik form basıldıktan sonra da cevap anahtarı dilediğiniz zaman güncellenebilir)
                    </span>
                  </div>
                )}

                {updatedBanner && (
                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-fade-in shadow-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{updatedBanner}</span>
                    </div>
                    <button onClick={() => setUpdatedBanner(null)} className="text-emerald-600 dark:text-emerald-400">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Class & Printing Options */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Basım Modu / Sınıf Seçimi
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="input-field text-xs bg-white dark:bg-slate-900"
                >
                  <option value="GENERIC">İsimsiz Boş Form (Genel Basım)</option>
                  <option value="ALL">Tüm Sınıflar (Öğrenciye Özel İsimli & QR Kodlu)</option>
                  {availableClasses.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} Sınıfı ({availableStudents.filter(s => s.classId === cls.id).length} Öğrenci)
                    </option>
                  ))}
                </select>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {selectedClassId === 'GENERIC' ? (
                    '💡 Öğrencilerin isimlerini ve numaralarını optik form üzerinde kurşun kalemle kodlayacakları boş form üretilir.'
                  ) : (
                    `💡 Seçilen sınıfta toplam ${candidateStudents.length} öğrenci bulunuyor. Aşağıdaki listeden sınava katılacak öğrencileri seçebilirsiniz.`
                  )}
                </p>
              </div>

              {/* INTERACTIVE STUDENT SELECTION LIST (İsme Özel Modda Öğrenci Seçimi) */}
              {selectedClassId !== 'GENERIC' && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
                        Sınava Girecek Öğrenciler
                      </span>
                    </div>
                    <span className={`badge text-[10px] font-bold ${
                      selectedStudentIds.size > 0 ? 'badge-primary' : 'badge-warning'
                    }`}>
                      {selectedStudentIds.size} / {candidateStudents.length} Seçili
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sınava sokmayacağınız öğrencilerin işaretini kaldırabilirsiniz. Yalnızca işaretli öğrencilere form basılacaktır.
                  </p>

                  {/* Search and Bulk Action Buttons */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Öğrenci ara (Ad, No, Sınıf)..."
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        className="input-field text-xs pl-8 py-1.5 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      />
                      {studentSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setStudentSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="btn btn-secondary text-[11px] py-1.5 px-2.5 rounded-lg whitespace-nowrap hover:text-indigo-600 dark:hover:text-indigo-400"
                      title="Tüm Öğrencileri Seç"
                    >
                      Tümünü Seç
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="btn btn-secondary text-[11px] py-1.5 px-2.5 rounded-lg whitespace-nowrap hover:text-rose-600 dark:hover:text-rose-400"
                      title="Tüm Seçimleri Kaldır"
                    >
                      Kaldır
                    </button>
                  </div>

                  {/* Scrollable Student Checklist */}
                  <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-inner">
                    {candidateStudents.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 italic">
                        Bu sınıfta veya kurumda henüz kayıtlı öğrenci bulunmuyor.
                      </div>
                    ) : filteredCandidateStudents.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 italic">
                        Arama kriterine uygun öğrenci bulunamadı.
                      </div>
                    ) : (
                      filteredCandidateStudents.map((st) => {
                        const isChecked = selectedStudentIds.has(st.id);
                        return (
                          <div
                            key={st.id}
                            onClick={() => toggleStudent(st.id)}
                            className={`px-3 py-2 flex items-center justify-between gap-2.5 cursor-pointer select-none transition-colors ${
                              isChecked 
                                ? 'bg-indigo-50/60 dark:bg-indigo-950/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/40' 
                                : 'hover:bg-slate-50 dark:hover:bg-slate-900/60 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}} // Row onClick manages toggle
                                className="rounded accent-indigo-600 h-4 w-4 cursor-pointer shrink-0"
                              />
                              <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/60 px-1.5 py-0.5 rounded shrink-0">
                                {st.studentNo || '---'}
                              </span>
                              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                {st.firstName} {st.lastName}
                              </span>
                            </div>

                            <span className="badge text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                              {st.className || 'Sınıf Yok'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {selectedStudentIds.size === 0 && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>Hiçbir öğrenci seçilmedi. Lütfen optik form basılacak en az 1 öğrenci seçin.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Paper Format Option (A4 vs A5) */}
              <div className="pt-3 border-t border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    Kağıt Boyutu & Yerleşim Düzeni *
                  </label>
                  <span className={`badge text-[10px] font-bold ${pageFormat === 'A5' ? 'badge-success' : 'badge-primary'}`}>
                    {pageFormat === 'A5' ? 'A5 (%50 Kağıt Tasarrufu)' : 'A4 (Standart)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* A4 Option Button */}
                  <button
                    type="button"
                    onClick={() => setPageFormat('A4')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      pageFormat === 'A4'
                        ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-md ring-1 ring-indigo-500/50'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">A4 Standart</span>
                      <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-semibold">1 Optik</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Her A4 sayfasına 1 adet tam sayfa optik form basılır.
                    </p>
                  </button>

                  {/* A5 Option Button */}
                  <button
                    type="button"
                    onClick={() => setPageFormat('A5')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      pageFormat === 'A5'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-md ring-1 ring-emerald-500/50'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-emerald-400 flex items-center gap-1">
                        A5 Tasarruf <Scissors className="h-3 w-3" />
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded">2 Optik ✂</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      1 A4'te altlı üstlü 2 optik. Ortadan kesilince 2 adet A5 olur.
                    </p>
                  </button>
                </div>

                {pageFormat === 'A5' && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] flex items-center gap-2">
                    <Scissors className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>
                      <strong>%50 Kağıt Tasarrufu:</strong> 1 kağıda 2 optik form basılır. Yazdırdıktan sonra sayfayı tam ortadaki kesim çizgisinden kestiğinizde 2 adet A5 optik elde edersiniz.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Exam Summary Details */}
            {selectedExam && (
              <div className="glass-panel p-5 space-y-4">
                <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Sınav Parametreleri Özeti
                </h2>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Sınav Adı:</span>
                    <span className="font-bold text-white text-right max-w-[200px] truncate">{selectedExam.title}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Sınav Kodu:</span>
                    <span className="font-mono text-indigo-300">{selectedExam.examCode}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Sınıf Seviyesi:</span>
                    <span className="text-slate-200">{selectedExam.gradeLevel || 'Belirtilmedi'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Toplam Soru:</span>
                    <span className="font-bold text-indigo-400">{selectedExam.totalQuestions} Soru</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Şık Sayısı:</span>
                    <span className="text-slate-200">{selectedExam.defaultOptionCount || 4} Şıklı ({selectedExam.defaultOptionCount === 5 ? 'A-E' : 'A-D'})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Net Kuralı:</span>
                    <span className="text-amber-400 font-semibold">
                      {selectedExam.netPenaltyRatio ? `${selectedExam.netPenaltyRatio} Yanlış 1 Doğruyu Götürür` : 'Yanlış Doğruyu Götürmez'}
                    </span>
                  </div>
                </div>

                {/* Subject List Breakdown */}
                <div className="pt-2">
                  <label className="text-[11px] font-bold text-slate-400 block mb-2">Ders Dağılımı:</label>
                  <div className="space-y-1.5">
                    {selectedExam.subjects.map((sbj, idx) => (
                      <div key={sbj.id || idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                        <span className="font-medium text-slate-200">{idx + 1}. {sbj.name}</span>
                        <span className="badge badge-info text-[10px]">{sbj.questionCount} Soru</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Print & Download Button */}
            <div className="glass-panel p-5">
              <button
                onClick={handleExportPDF}
                disabled={isExporting || !selectedExam || (selectedClassId !== 'GENERIC' && selectedStudentIds.size === 0)}
                className="w-full btn btn-primary py-3.5 px-6 text-sm font-bold shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    PDF Optik Form Hazırlanıyor...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" /> 
                    <span>
                      {selectedClassId === 'GENERIC'
                        ? `Optik Form İndir (PDF - Boş Form)`
                        : `Optik Form İndir (PDF - ${selectedStudentIds.size} Öğrenci)`
                      }
                    </span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-2">
                {pageFormat === 'A5'
                  ? '1 A4 sayfasına altlı üstlü 2 optik form basılır, ortadan kesildiğinde 2 adet A5 form olur.'
                  : 'Yüksek çözünürlüklü A4 formatında hizalama işaretli (Fiducial) optik form üretilir.'}
              </p>
            </div>
          </div>

          {/* Live Optical Sheet Preview Column (Right) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-indigo-400" /> Canlı Optik Form Önizlemesi
              </h2>
              <span className={`badge text-[10px] font-bold ${pageFormat === 'A5' ? 'badge-success' : 'badge-indigo'}`}>
                {pageFormat === 'A5' ? 'A5 Tasarruf Modu (1 Sayfada 2 Optik)' : 'A4 Standart (1 Sayfada 1 Optik)'}
              </span>
            </div>

            {selectedExam ? (
              pageFormat === 'A5' ? (
                /* --- A5 PREVIEW: 2 Optik Altlı Üstlü, Ortadan Kesim Çizgili --- */
                <div className="bg-white text-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-300 space-y-3 font-sans relative overflow-hidden text-[10px]">
                  {/* TOP OPTICAL FORM */}
                  <div className="p-3 border border-slate-300 rounded-xl bg-slate-50/60 relative overflow-hidden space-y-2">
                    {/* 4 Corner Markers */}
                    <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 bg-black"></div>
                    <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-black"></div>
                    <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 bg-black"></div>
                    <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 bg-black"></div>

                    <div className="flex items-center justify-between gap-2 border-b border-slate-300 pb-1.5 px-3">
                      <div>
                        <div className="font-extrabold text-[11px] text-slate-900 uppercase">
                          {selectedExam.institutionName || currentUser.institutionName || 'OPTENO SINAV MERKEZİ'}
                        </div>
                        <div className="text-[10px] font-bold text-indigo-900">
                          {selectedExam.title} • {selectedExam.examCode}
                        </div>
                      </div>
                      <div className="text-right text-[9px] text-slate-600">
                        {selectedClassId !== 'GENERIC' ? (firstSelectedStudent ? `${firstSelectedStudent.firstName} ${firstSelectedStudent.lastName}` : 'Öğrenci 1') : 'Boş Form 1'} • 1. A5 Parçası
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 px-3">
                      <div className="text-[9px] text-slate-700 space-y-0.5">
                        <div>Ad Soyad: {selectedClassId !== 'GENERIC' ? (firstSelectedStudent ? `${firstSelectedStudent.firstName} ${firstSelectedStudent.lastName}` : 'Öğrenci Seçilmedi') : '__________________'}</div>
                        <div>Öğrenci No: {selectedClassId !== 'GENERIC' ? (firstSelectedStudent?.studentNo || '---') : '[  ][  ][  ]'} | Sınıf: {firstSelectedStudent?.className || '---'}</div>
                        {selectedExam.hasBookletTypes && (
                          <div className="flex items-center gap-1.5 text-[8.5px] font-bold text-slate-900 pt-0.5">
                            <span>KİTAPÇIK:</span>
                            <span className="w-3 h-3 rounded-full border border-black inline-flex items-center justify-center text-[7px]">A</span>
                            <span className="w-3 h-3 rounded-full border border-black inline-flex items-center justify-center text-[7px]">B</span>
                          </div>
                        )}
                      </div>
                      {/* Mini QR */}
                      <div className="w-10 h-10 border border-slate-300 bg-white p-0.5 flex items-center justify-center shrink-0">
                        {previewQRUrl ? <img src={previewQRUrl} alt="QR" className="w-full h-full object-contain" /> : <span className="text-[7px]">QR</span>}
                      </div>
                    </div>

                    {/* Mini Bubbles */}
                    <div className="grid grid-cols-2 gap-2 px-3 pt-1">
                      {selectedExam.subjects.slice(0, 2).map((sbj, i) => (
                        <div key={i} className="border border-slate-200 rounded p-1.5 bg-white text-[8px]">
                          <div className="font-bold bg-slate-100 px-1 py-0.5 rounded text-slate-800 flex justify-between">
                            <span>{sbj.name}</span>
                            <span>{sbj.questionCount} Soru</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-[8px] text-slate-500">
                            <span>01.</span>
                            <span className="w-3 h-3 rounded-full border border-slate-500 inline-flex items-center justify-center font-bold text-[7px]">A</span>
                            <span className="w-3 h-3 rounded-full border border-slate-500 inline-flex items-center justify-center font-bold text-[7px]">B</span>
                            <span className="w-3 h-3 rounded-full border border-slate-500 inline-flex items-center justify-center font-bold text-[7px]">C</span>
                            <span className="w-3 h-3 rounded-full border border-slate-500 inline-flex items-center justify-center font-bold text-[7px]">D</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CENTER CUTTING GUIDELINE */}
                  <div className="relative py-2 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t-2 border-dashed border-emerald-500"></div>
                    </div>
                    <div className="relative bg-emerald-50 border border-emerald-400 text-emerald-800 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                      <Scissors className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                      <span>BURADAN KESİNİZ (A4 ORTADAN İKİYE BÖLÜNÜR → 2 ADET A5 OPTİK)</span>
                      <Scissors className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                    </div>
                  </div>

                  {/* BOTTOM OPTICAL FORM */}
                  <div className="p-3 border border-slate-300 rounded-xl bg-slate-50/60 relative overflow-hidden space-y-2">
                    {/* 4 Corner Markers */}
                    <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 bg-black"></div>
                    <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-black"></div>
                    <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 bg-black"></div>
                    <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 bg-black"></div>

                    <div className="flex items-center justify-between gap-2 border-b border-slate-300 pb-1.5 px-3">
                      <div>
                        <div className="font-extrabold text-[11px] text-slate-900 uppercase">
                          {selectedExam.institutionName || currentUser.institutionName || 'OPTENO SINAV MERKEZİ'}
                        </div>
                        <div className="text-[10px] font-bold text-indigo-900">
                          {selectedExam.title} • {selectedExam.examCode}
                        </div>
                      </div>
                      <div className="text-right text-[9px] text-slate-600">
                        {selectedClassId !== 'GENERIC' ? (secondSelectedStudent ? `${secondSelectedStudent.firstName} ${secondSelectedStudent.lastName}` : (firstSelectedStudent ? '2. Form' : 'Öğrenci 2')) : 'Boş Form 2'} • 2. A5 Parçası
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 px-3">
                      <div className="text-[9px] text-slate-700 space-y-0.5">
                        <div>Ad Soyad: {selectedClassId !== 'GENERIC' ? (secondSelectedStudent ? `${secondSelectedStudent.firstName} ${secondSelectedStudent.lastName}` : (selectedStudentIds.size > 1 ? 'Örnek Öğrenci 2' : '2. Öğrenci')) : '__________________'}</div>
                        <div>Öğrenci No: {selectedClassId !== 'GENERIC' ? (secondSelectedStudent?.studentNo || '---') : '[  ][  ][  ]'} | Sınıf: {secondSelectedStudent?.className || '---'}</div>
                      </div>
                      {/* Mini QR */}
                      <div className="w-10 h-10 border border-slate-300 bg-white p-0.5 flex items-center justify-center shrink-0">
                        {previewQRUrl ? <img src={previewQRUrl} alt="QR" className="w-full h-full object-contain" /> : <span className="text-[7px]">QR</span>}
                      </div>
                    </div>

                    {/* Mini Bubbles */}
                    <div className="grid grid-cols-2 gap-2 px-3 pt-1">
                      {selectedExam.subjects.slice(0, 2).map((sbj, i) => (
                        <div key={i} className="border border-slate-200 rounded p-1.5 bg-white text-[8px]">
                          <div className="font-bold bg-slate-100 px-1 py-0.5 rounded text-slate-800 flex justify-between">
                            <span>{sbj.name}</span>
                            <span>{sbj.questionCount} Soru</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-[8px] text-slate-500">
                            <span>01.</span>
                            <span className="w-3 h-3 rounded-full border border-slate-500 inline-flex items-center justify-center font-bold text-[7px]">A</span>
                            <span className="w-3 h-3 rounded-full border border-slate-500 inline-flex items-center justify-center font-bold text-[7px]">B</span>
                            <span className="w-3 h-3 rounded-full border border-slate-500 inline-flex items-center justify-center font-bold text-[7px]">C</span>
                            <span className="w-3 h-3 rounded-full border border-slate-500 inline-flex items-center justify-center font-bold text-[7px]">D</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* --- A4 STANDARD PREVIEW --- */
                <div className="bg-white text-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-300 space-y-4 font-sans min-h-[680px] relative overflow-hidden text-[11px] selection:bg-indigo-100">
                  {/* 4 Corner Alignment Fiducial Markers */}
                  <div className="absolute top-3 left-3 w-4 h-4 bg-black"></div>
                  <div className="absolute top-3 right-3 w-4 h-4 bg-black"></div>
                  <div className="absolute bottom-3 left-3 w-4 h-4 bg-black"></div>
                  <div className="absolute bottom-3 right-3 w-4 h-4 bg-black"></div>

                  {/* Header Section */}
                  <div className="text-center pt-2 pb-1 border-b border-slate-300">
                    <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">
                      {selectedExam.institutionName || currentUser.institutionName || 'OPTENO SINAV MERKEZİ'}
                    </h3>
                    <div className="font-semibold text-xs text-indigo-900">
                      {selectedExam.title} {selectedExam.gradeLevel ? `[${selectedExam.gradeLevel}]` : ''}
                    </div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      Kod: <strong className="font-mono text-black">{selectedExam.examCode}</strong> | Tarih: {selectedExam.date} | Toplam {selectedExam.totalQuestions} Soru
                    </div>
                  </div>

                  {/* Student Info & QR Code Row */}
                  <div className="flex items-stretch justify-between gap-3 border border-slate-400 p-2.5 rounded bg-slate-50">
                    <div className="space-y-1 flex-1">
                      <div className="font-bold text-[10px] uppercase text-indigo-900 border-b border-slate-300 pb-0.5">
                        ÖĞRENCİ BİLGİLERİ
                      </div>
                      {selectedClassId !== 'GENERIC' ? (
                        <div className="space-y-0.5 text-[10px]">
                          <div>Adı Soyadı: <strong className="text-black font-bold">{firstSelectedStudent ? `${firstSelectedStudent.firstName} ${firstSelectedStudent.lastName}` : (selectedStudentIds.size === 0 ? 'Öğrenci Seçilmedi' : 'Örnek Öğrenci')}</strong></div>
                          <div>Öğrenci No: <strong className="font-mono text-black">{firstSelectedStudent?.studentNo || '1042'}</strong></div>
                          <div>Sınıfı: <strong className="text-black">{firstSelectedStudent?.className || '8/A Sınıfı'}</strong></div>
                        </div>
                      ) : (
                        <div className="space-y-0.5 text-[10px] text-slate-700">
                          <div>Adı Soyadı: ___________________________</div>
                          <div>Öğrenci No: [   ][   ][   ][   ]</div>
                          <div>Sınıfı: _________</div>
                        </div>
                      )}

                      {selectedExam.hasBookletTypes && (
                        <div className="pt-1 mt-1 border-t border-slate-200 flex items-center gap-2 text-[10px]">
                          <span className="font-bold text-slate-900">KİTAPÇIK TÜRÜ:</span>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full border border-black inline-flex items-center justify-center font-bold text-[8.5px]">A</span>
                            <span className="w-4 h-4 rounded-full border border-black inline-flex items-center justify-center font-bold text-[8.5px]">B</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* QR Code Container */}
                    <div className="w-20 h-20 bg-white border border-slate-400 p-1 flex flex-col items-center justify-center shrink-0">
                      {previewQRUrl ? (
                        <img src={previewQRUrl} alt="QR Code Preview" className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-[8px] text-slate-400 text-center">QR Kod</div>
                      )}
                    </div>
                  </div>

                  {/* Simulated Timing Track Marker Strip */}
                  <div className="flex justify-between items-center px-1 my-1">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-slate-900 rounded-xs"></div>
                    ))}
                  </div>

                  {/* Subjects & Question Grids */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {selectedExam.subjects.map((sbj, sIdx) => (
                      <div key={sbj.id || sIdx} className="border border-slate-300 rounded p-2 bg-slate-50/50 space-y-1.5">
                        <div className="font-bold text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-800 flex justify-between">
                          <span>{sIdx + 1}. {sbj.name}</span>
                          <span>{sbj.questionCount} Soru</span>
                        </div>

                        <div className="space-y-1">
                          {Array.from({ length: Math.min(10, sbj.questionCount) }).map((_, qIdx) => {
                            const options = (sbj.optionCount || selectedExam.defaultOptionCount || 4) === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];
                            return (
                              <div key={qIdx} className="flex items-center gap-1.5 text-[9px]">
                                <span className="w-4 font-bold text-right text-slate-600">{qIdx + 1}</span>
                                <div className="flex items-center gap-1">
                                  {options.map(opt => (
                                    <div
                                      key={opt}
                                      className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center font-bold text-[8px] text-slate-700 bg-white"
                                    >
                                      {opt}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                          {sbj.questionCount > 10 && (
                            <div className="text-[9px] text-slate-500 italic text-center pt-1 border-t border-slate-200">
                              + {sbj.questionCount - 10} soru daha PDF'te yazdırılacak
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer Note */}
                  <div className="absolute bottom-4 left-0 right-0 text-center text-[9px] text-slate-500 italic">
                    Opteno Akıllı Optik Sınav Sistemi • Lütfen işaretlemeleri kurşun kalem ile yapınız.
                  </div>
                </div>
              )
            ) : (
              <div className="glass-panel p-8 text-center text-xs text-slate-400">
                Lütfen önizlemek istediğiniz sınavı soldan seçin.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Answer Key Modal */}
      {selectedExam && (
        <EditAnswerKeyModal
          isOpen={isEditAnswerKeyOpen}
          examId={selectedExam.id}
          currentUser={currentUser}
          onClose={() => setIsEditAnswerKeyOpen(false)}
          onSuccess={(recalculatedCount) => {
            setUpdatedBanner(
              recalculatedCount > 0 
                ? `Cevap anahtarı başarıyla güncellendi! Okunmuş ${recalculatedCount} öğrencinin sınav sonuçları ve sıralamaları güncellendi.`
                : 'Cevap anahtarı başarıyla güncellendi! Yeni optik formlar ve okumalar güncel anahtara göre değerlendirilecektir.'
            );
            setTimeout(() => setUpdatedBanner(null), 5000);
          }}
        />
      )}
    </div>
  );
};
