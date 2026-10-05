import React, { useState, useEffect } from 'react';
import { Printer, Download, Sparkles, Layers, Sliders, CheckCircle2, ChevronRight, PlusCircle, ArrowLeft, Eye, HelpCircle, Scissors } from 'lucide-react';
import { Exam, Student } from '../../types';
import { storageService } from '../../services/storageService';
import { pdfService, OMRPageFormat } from '../../services/pdfService';
import { qrService } from '../../services/qrService';

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
  const exams = storageService.getExams();
  const classes = storageService.getClasses(currentUser.institutionId);
  const allStudents = storageService.getStudents(currentUser.institutionId);

  // Selected Exam State
  const [selectedExamId, setSelectedExamId] = useState<string>(() => {
    if (initialExamId && exams.some(e => e.id === initialExamId)) {
      return initialExamId;
    }
    return exams.length > 0 ? exams[0].id : '';
  });

  // Selected Class Filter State
  const [selectedClassId, setSelectedClassId] = useState<string>('GENERIC');
  const [pageFormat, setPageFormat] = useState<OMRPageFormat>('A4');
  const [previewQRUrl, setPreviewQRUrl] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Get active selected exam object
  const selectedExam = exams.find(e => e.id === selectedExamId) || null;

  // Generate live preview QR code when selected exam changes
  useEffect(() => {
    if (selectedExam) {
      qrService.generateOMRQRDataUrl(
        selectedExam.id,
        'PREVIEW-STUDENT',
        {
          examCode: selectedExam.examCode,
          studentNo: '1042',
          instId: selectedExam.institutionId,
          studentName: 'Örnek Öğrenci'
        }
      ).then(url => {
        setPreviewQRUrl(url);
      });
    }
  }, [selectedExamId]);

  // Determine students to generate OMR forms for
  const getTargetStudents = (): Student[] => {
    if (selectedClassId === 'GENERIC') {
      return []; // Return empty list to generate 1 generic blank form
    }
    if (selectedClassId === 'ALL') {
      return allStudents;
    }
    return allStudents.filter(s => s.classId === selectedClassId);
  };

  // Generate and download PDF
  const handleExportPDF = async () => {
    if (!selectedExam) {
      alert('Lütfen optik formunu üretmek istediğiniz sınavı seçin.');
      return;
    }

    setIsExporting(true);
    try {
      const targetStudents = getTargetStudents();
      const pdfDoc = await pdfService.generateOMRPDF(selectedExam, targetStudents, pageFormat);
      const suffix = pageFormat === 'A5' ? '_A5_Tasarruf' : '_A4';
      const filename = `${selectedExam.examCode || 'Opteno'}_Optik_Formlar${suffix}.pdf`;
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
              <h2 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-indigo-400" /> 1. Sınav Seçimi
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Sınavı Seçiniz *
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="input-field text-xs bg-slate-900 font-medium py-2.5"
                >
                  {exams.map(exam => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title} ({exam.examCode}) - {exam.gradeLevel || 'Genel'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class & Printing Options */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Basım Modu / Öğrenci Seçimi
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="input-field text-xs bg-slate-900"
                >
                  <option value="GENERIC">İsimsiz Boş Form (Genel Basım)</option>
                  <option value="ALL">Tüm Sınıflar (Öğrenciye Özel İsimli & QR Kodlu)</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} Sınıfı ({allStudents.filter(s => s.classId === cls.id).length} Öğrenci)
                    </option>
                  ))}
                </select>

                <p className="text-[11px] text-slate-400">
                  {selectedClassId === 'GENERIC' ? (
                    '💡 Öğrencilerin isimlerini ve numaralarını kalemle doldurabilecekleri boş optik form üretilir.'
                  ) : (
                    `💡 Seçilen sınıftaki ${getTargetStudents().length} öğrenci için ad-soyad ve özel karekod içeren optik sayfaları toplu üretilir.`
                  )}
                </p>
              </div>

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
                disabled={isExporting || !selectedExam}
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
                    <span>Optik Form İndir (PDF - {pageFormat === 'A5' ? 'A5 Kağıt Tasarrufu' : 'A4 Standart'})</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-2">
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
                        {selectedClassId !== 'GENERIC' ? 'Öğrenci 1 (Önizleme)' : 'Boş Form 1'} • 1. A5 Parçası
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 px-3">
                      <div className="text-[9px] text-slate-700 space-y-0.5">
                        <div>Ad Soyad: {selectedClassId !== 'GENERIC' ? 'Örnek Öğrenci 1' : '__________________'}</div>
                        <div>Öğrenci No: {selectedClassId !== 'GENERIC' ? '1042' : '[  ][  ][  ]'} | Sınıf: 8/A</div>
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
                        {selectedClassId !== 'GENERIC' ? 'Öğrenci 2 (Önizleme)' : 'Boş Form 2'} • 2. A5 Parçası
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 px-3">
                      <div className="text-[9px] text-slate-700 space-y-0.5">
                        <div>Ad Soyad: {selectedClassId !== 'GENERIC' ? 'Örnek Öğrenci 2' : '__________________'}</div>
                        <div>Öğrenci No: {selectedClassId !== 'GENERIC' ? '1043' : '[  ][  ][  ]'} | Sınıf: 8/A</div>
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
                          <div>Adı Soyadı: <strong className="text-black font-bold">Örnek Öğrenci (Önizleme)</strong></div>
                          <div>Öğrenci No: <strong className="font-mono text-black">1042</strong></div>
                          <div>Sınıfı: <strong className="text-black">8/A Sınıfı</strong></div>
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
    </div>
  );
};
