import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  Calendar,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  BarChart3,
  Search,
  Printer,
  Share2,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronRight,
  BookOpen,
  Sparkles,
  Phone,
  Building2,
  Layers,
  ArrowRight,
  X,
  Eye,
  Filter
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { Student, Exam, ScanResult, SubjectResult } from '../../types';

interface StudentCumulativeReportProps {
  initialStudentId?: string;
  onClose?: () => void;
  onOpenSingleReportCard?: (result: ScanResult) => void;
}

export const StudentCumulativeReport: React.FC<StudentCumulativeReportProps> = ({
  initialStudentId,
  onClose,
  onOpenSingleReportCard
}) => {
  const currentUser = storageService.getCurrentUser();
  const instId = currentUser?.role === 'SUPER_ADMIN' ? undefined : currentUser?.institutionId;

  // Data Sources
  const allStudents = useMemo(() => storageService.getStudents(instId), [instId]);
  const allExams = useMemo(() => storageService.getExams(instId), [instId]);
  const allScanResults = useMemo(() => storageService.getAllScanResults(), []);

  // Filter & Selection State
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    if (initialStudentId && allStudents.some(s => s.id === initialStudentId)) {
      return initialStudentId;
    }
    return allStudents.length > 0 ? allStudents[0].id : '';
  });

  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');

  // Date Range Filter State
  const [datePreset, setDatePreset] = useState<'ALL' | 'LAST_30' | 'LAST_90' | 'LAST_180' | 'THIS_YEAR' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Selected Student
  const currentStudent = useMemo(() => {
    return allStudents.find(s => s.id === selectedStudentId);
  }, [allStudents, selectedStudentId]);

  // Available classes for filtering
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    allStudents.forEach(s => {
      if (s.className) set.add(s.className);
    });
    return Array.from(set).sort();
  }, [allStudents]);

  // Filtered Students Dropdown list
  const filteredStudents = useMemo(() => {
    return allStudents.filter(s => {
      const matchClass = selectedClassFilter === 'ALL' || s.className === selectedClassFilter;
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
      const matchSearch = !studentSearchTerm || 
        fullName.includes(studentSearchTerm.toLowerCase()) || 
        s.studentNo.includes(studentSearchTerm);
      return matchClass && matchSearch;
    });
  }, [allStudents, selectedClassFilter, studentSearchTerm]);

  // Apply Quick Date Presets
  const handleDatePresetChange = (preset: 'ALL' | 'LAST_30' | 'LAST_90' | 'LAST_180' | 'THIS_YEAR') => {
    setDatePreset(preset);
    const today = new Date();
    const endStr = today.toISOString().split('T')[0];
    setEndDate(endStr);

    if (preset === 'ALL') {
      setStartDate('');
    } else if (preset === 'LAST_30') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setStartDate(d.toISOString().split('T')[0]);
    } else if (preset === 'LAST_90') {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      setStartDate(d.toISOString().split('T')[0]);
    } else if (preset === 'LAST_180') {
      const d = new Date();
      d.setDate(d.getDate() - 180);
      setStartDate(d.toISOString().split('T')[0]);
    } else if (preset === 'THIS_YEAR') {
      const currentYear = today.getFullYear();
      // Academic year starts around September of last year or Jan 1
      setStartDate(`${currentYear}-01-01`);
    }
  };

  // Student's Exam Results across entire system
  const studentResults = useMemo(() => {
    if (!currentStudent) return [];

    // Filter results belonging to this student (by ID or studentNo)
    const matches = allScanResults.filter(r => 
      r.studentId === currentStudent.id ||
      (r.studentNo === currentStudent.studentNo && (instId ? r.institutionId === instId : true))
    );

    // Map each result with actual Exam date
    const mapped = matches.map(result => {
      const exam = allExams.find(e => e.id === result.examId);
      const examDate = exam?.date || result.scannedAt?.split('T')[0] || '';
      return {
        ...result,
        examDate,
        examTitle: exam?.title || result.examTitle || 'Deneme Sınavı',
        examCode: exam?.examCode || 'EXAM'
      };
    });

    // Date filtering
    const dateFiltered = mapped.filter(r => {
      if (!r.examDate) return true;
      if (startDate && r.examDate < startDate) return false;
      if (endDate && r.examDate > endDate) return false;
      return true;
    });

    // Sort chronologically (oldest to newest for progression graphs)
    return dateFiltered.sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
  }, [currentStudent, allScanResults, allExams, instId, startDate, endDate]);

  // Derived Performance Metrics
  const stats = useMemo(() => {
    if (studentResults.length === 0) {
      return {
        totalExams: 0,
        avgScore: 0,
        maxScore: 0,
        avgNet: 0,
        maxNet: 0,
        netTrend: 0,
        scoreTrend: 0,
        accuracyRate: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        totalWrong: 0,
        totalEmpty: 0
      };
    }

    const totalExams = studentResults.length;
    const scores = studentResults.map(r => r.totalScore || 0);
    const nets = studentResults.map(r => r.totalNet || 0);

    const avgScore = Number((scores.reduce((a, b) => a + b, 0) / totalExams).toFixed(2));
    const maxScore = Number(Math.max(...scores).toFixed(2));

    const avgNet = Number((nets.reduce((a, b) => a + b, 0) / totalExams).toFixed(2));
    const maxNet = Number(Math.max(...nets).toFixed(2));

    const firstExam = studentResults[0];
    const lastExam = studentResults[studentResults.length - 1];

    const netTrend = Number((lastExam.totalNet - firstExam.totalNet).toFixed(2));
    const scoreTrend = Number((lastExam.totalScore - firstExam.totalScore).toFixed(2));

    const totalCorrect = studentResults.reduce((sum, r) => sum + (r.totalCorrect || 0), 0);
    const totalWrong = studentResults.reduce((sum, r) => sum + (r.totalWrong || 0), 0);
    const totalEmpty = studentResults.reduce((sum, r) => sum + (r.totalEmpty || 0), 0);
    const totalQuestions = totalCorrect + totalWrong + totalEmpty;

    const attempted = totalCorrect + totalWrong;
    const accuracyRate = attempted > 0 ? Number(((totalCorrect / attempted) * 100).toFixed(1)) : 0;

    return {
      totalExams,
      avgScore,
      maxScore,
      avgNet,
      maxNet,
      netTrend,
      scoreTrend,
      accuracyRate,
      totalQuestions,
      totalCorrect,
      totalWrong,
      totalEmpty
    };
  }, [studentResults]);

  // Dynamic Unique Subjects across these exams
  const distinctSubjects = useMemo(() => {
    const names = new Set<string>();
    studentResults.forEach(r => {
      r.subjectResults?.forEach(s => names.add(s.subjectName));
    });
    return Array.from(names);
  }, [studentResults]);

  // Subject-by-Subject Averages & Trajectory
  const subjectTrajectories = useMemo(() => {
    return distinctSubjects.map(subName => {
      const records = studentResults.map(r => {
        const found = r.subjectResults?.find(sr => sr.subjectName === subName);
        return {
          examTitle: r.examTitle,
          examDate: r.examDate,
          net: found ? found.netCount : 0,
          correct: found ? found.correctCount : 0,
          wrong: found ? found.wrongCount : 0,
          empty: found ? found.emptyCount : 0
        };
      });

      const netValues = records.map(rec => rec.net);
      const avgNet = netValues.length > 0 
        ? Number((netValues.reduce((a, b) => a + b, 0) / netValues.length).toFixed(2))
        : 0;
      const maxNet = netValues.length > 0 ? Math.max(...netValues) : 0;

      const firstNet = netValues.length > 0 ? netValues[0] : 0;
      const lastNet = netValues.length > 0 ? netValues[netValues.length - 1] : 0;
      const trend = Number((lastNet - firstNet).toFixed(2));

      return {
        subjectName: subName,
        avgNet,
        maxNet,
        trend,
        records
      };
    });
  }, [distinctSubjects, studentResults]);

  // WhatsApp Share Text Generation
  const handleShareWhatsApp = () => {
    if (!currentStudent || studentResults.length === 0) return;

    const phone = currentStudent.parentPhone?.replace(/[^0-9]/g, '') || '';
    const dateRangeText = startDate ? `${startDate} ile ${endDate}` : `Tüm zamanlar (${endDate} itibarıyla)`;

    let message = `📊 *OPTENO - ÖĞRENCİ ÇOKLU DENEME GELİŞİM KARNESİ*\n`;
    message += `👤 *Öğrenci:* ${currentStudent.firstName} ${currentStudent.lastName}\n`;
    message += `🏫 *Sınıf:* ${currentStudent.className} | *Okul No:* ${currentStudent.studentNo}\n`;
    message += `📅 *Rapor Dönemi:* ${dateRangeText}\n`;
    message += `📝 *Toplam Girilen Deneme:* ${stats.totalExams}\n\n`;

    message += `📈 *GENEL BAŞARI ÖZETİ:*\n`;
    message += `⭐ *Ortalama Net:* ${stats.avgNet} (En Yüksek: ${stats.maxNet})\n`;
    message += `🏆 *Ortalama Puan:* ${stats.avgScore} (En Yüksek: ${stats.maxScore})\n`;
    message += `🚀 *Gelişim Durumu:* ${stats.netTrend >= 0 ? `+${stats.netTrend} Net Artış 📈` : `${stats.netTrend} Net Düşüş 📉`}\n`;
    message += `🎯 *Genel Doğruluk Oranı:* %${stats.accuracyRate}\n\n`;

    message += `📋 *SINAV NETLERİ SIRALAMASI:*\n`;
    studentResults.forEach((r, idx) => {
      message += `${idx + 1}. ${r.examDate} - ${r.examTitle}: *${r.totalNet} Net* (${r.totalScore} Puan)\n`;
    });

    message += `\n_Detaylı karne Opteno Dijital Sınav Yönetim Sistemi tarafından hazırlanmıştır._`;

    const encoded = encodeURIComponent(message);
    const url = phone ? `https://api.whatsapp.com/send?phone=90${phone.replace(/^0/, '')}&text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  // CSV / Excel Export
  const handleExportCSV = () => {
    if (!currentStudent || studentResults.length === 0) return;

    let csv = `\uFEFFÖğrenci:;${currentStudent.firstName} ${currentStudent.lastName};Okul No:;${currentStudent.studentNo};Sınıf:;${currentStudent.className}\n`;
    csv += `Rapor Tarihi:;${new Date().toLocaleDateString('tr-TR')};Toplam Sınav:;${stats.totalExams};Ortalama Net:;${stats.avgNet};Ortalama Puan:;${stats.avgScore}\n\n`;

    // Headers
    const headers = ['Sınav Tarihi', 'Sınav Kodu', 'Sınav Adı', ...distinctSubjects.map(s => `${s} Net`), 'Toplam Net', 'Toplam Puan'];
    csv += headers.join(';') + '\n';

    // Rows
    studentResults.forEach(r => {
      const row = [
        r.examDate,
        r.examCode,
        `"${r.examTitle.replace(/"/g, '""')}"`,
        ...distinctSubjects.map(s => {
          const found = r.subjectResults?.find(sr => sr.subjectName === s);
          return found ? found.netCount : 0;
        }),
        r.totalNet,
        r.totalScore
      ];
      csv += row.join(';') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentStudent.firstName}_${currentStudent.lastName}_Gelisim_Karnesi.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Print Trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="clay-panel p-5 sm:p-6 rounded-[28px] border border-slate-700/50 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-fuchsia-600 text-white flex items-center justify-center font-black text-xl shadow-[0_8px_16px_rgba(79,70,229,0.35),inset_0_2px_4px_rgba(255,255,255,0.4)] shrink-0">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl sm:text-2xl font-black text-white tracking-tight">
                  Öğrenci Gelişim & Çoklu Deneme Karnesi
                </h2>
                <span className="badge badge-primary text-[10px] hidden sm:inline-flex">Kümülatif</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Belirli tarih aralığında girilen tüm denemelerin net, puan ve konu bazlı gelişim analizi
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handlePrint}
              disabled={studentResults.length === 0}
              className="btn btn-secondary text-xs py-2 px-3.5 rounded-2xl flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              title="A4 Resmi Karne Yazdır / PDF İndir"
            >
              <Printer className="h-4 w-4 text-indigo-400" />
              <span>Yazdır / PDF</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={studentResults.length === 0}
              className="btn btn-secondary text-xs py-2 px-3.5 rounded-2xl flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              title="Excel Olarak Dışa Aktar"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              disabled={studentResults.length === 0}
              className="btn btn-success text-xs py-2 px-3.5 rounded-2xl flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              title="Veliye WhatsApp Mesajı Olarak Gönder"
            >
              <Share2 className="h-4 w-4" />
              <span>Veliye İlet</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-2xl clay-card text-slate-400 hover:text-white transition-all ml-1"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Row: Class Select + Student Search & Select */}
        <div className="mt-5 pt-5 border-t border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Sınıf Seçimi */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
              1. Sınıf Filtresi
            </label>
            <select
              value={selectedClassFilter}
              onChange={(e) => {
                setSelectedClassFilter(e.target.value);
                // Auto select first student in new filtered list
                const matches = allStudents.filter(s => e.target.value === 'ALL' || s.className === e.target.value);
                if (matches.length > 0 && !matches.some(m => m.id === selectedStudentId)) {
                  setSelectedStudentId(matches[0].id);
                }
              }}
              className="select-field text-xs py-2"
            >
              <option value="ALL">Tüm Sınıflar ({allStudents.length} Öğrenci)</option>
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          {/* 2. Öğrenci Arama & Seçim */}
          <div className="lg:col-span-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
              2. Öğrenci Seçimi
            </label>
            <div className="flex gap-2">
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="select-field text-xs py-2 flex-1 font-semibold"
              >
                {filteredStudents.length === 0 ? (
                  <option value="">Öğrenci bulunamadı</option>
                ) : (
                  filteredStudents.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.firstName} {st.lastName} (No: {st.studentNo} • {st.className})
                    </option>
                  ))
                )}
              </select>

              <div className="relative w-44 hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="İsimle ara..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  className="input-field text-xs py-2 pl-9"
                />
              </div>
            </div>
          </div>

          {/* 3. Seçilen Öğrenci Bilgi Rozeti */}
          {currentStudent && (
            <div className="clay-card p-2.5 rounded-2xl flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0 shadow-[inset_0_2px_4px_rgba(255,255,255,0.25)]">
                {currentStudent.firstName.charAt(0)}{currentStudent.lastName.charAt(0)}
              </div>
              <div className="overflow-hidden leading-tight">
                <div className="font-bold text-xs text-white truncate">{currentStudent.firstName} {currentStudent.lastName}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  No: {currentStudent.studentNo} • {currentStudent.className}
                  {currentStudent.parentPhone && ` • 📞 ${currentStudent.parentPhone}`}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Date Filter Bar */}
        <div className="mt-4 pt-4 border-t border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Quick Preset Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Tarih Aralığı:
            </span>
            <button
              onClick={() => handleDatePresetChange('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                datePreset === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'clay-card text-slate-400 hover:text-white'
              }`}
            >
              Tüm Zamanlar
            </button>
            <button
              onClick={() => handleDatePresetChange('LAST_30')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                datePreset === 'LAST_30'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'clay-card text-slate-400 hover:text-white'
              }`}
            >
              Son 30 Gün
            </button>
            <button
              onClick={() => handleDatePresetChange('LAST_90')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                datePreset === 'LAST_90'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'clay-card text-slate-400 hover:text-white'
              }`}
            >
              Son 3 Ay
            </button>
            <button
              onClick={() => handleDatePresetChange('LAST_180')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                datePreset === 'LAST_180'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'clay-card text-slate-400 hover:text-white'
              }`}
            >
              Son 6 Ay
            </button>
            <button
              onClick={() => handleDatePresetChange('THIS_YEAR')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                datePreset === 'THIS_YEAR'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'clay-card text-slate-400 hover:text-white'
              }`}
            >
              Bu Yıl
            </button>
          </div>

          {/* Date Pickers */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('CUSTOM');
              }}
              className="input-field text-xs py-1.5 px-2.5 w-36"
              title="Başlangıç Tarihi"
            />
            <span className="text-slate-500 text-xs font-bold">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('CUSTOM');
              }}
              className="input-field text-xs py-1.5 px-2.5 w-36"
              title="Bitiş Tarihi"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {!currentStudent ? (
        <div className="clay-panel p-12 text-center rounded-[28px]">
          <GraduationCap className="h-12 w-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Lütfen bir öğrenci seçin</h3>
          <p className="text-xs text-slate-500 mt-1">Öğrenci seçildiğinde tüm sınav dökümü ve gelişim grafikleri burada listelenecektir.</p>
        </div>
      ) : studentResults.length === 0 ? (
        <div className="clay-panel p-12 text-center rounded-[28px]">
          <AlertTriangle className="h-12 w-12 text-amber-500/80 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Bu Tarih Aralığında Kayıtlı Deneme Bulunamadı</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            <strong>{currentStudent.firstName} {currentStudent.lastName}</strong> adlı öğrencinin belirtilen tarihler arasında sisteme işlenmiş optik okuma sonucu bulunmuyor.
          </p>
          <button
            onClick={() => handleDatePresetChange('ALL')}
            className="btn btn-primary text-xs py-2 px-4 rounded-xl mt-4 inline-flex items-center gap-1.5"
          >
            Tüm Zamanların Sonuçlarını Göster
          </button>
        </div>
      ) : (
        <>
          {/* 4'lü 3D KPI İstatistik Podları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Ortalama Puan */}
            <motion.div
              whileHover={{ y: -3 }}
              className="clay-card p-5 relative overflow-hidden group border border-indigo-500/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400">Ortalama Sınav Puanı</p>
                  <h3 className="font-display text-3xl font-black text-white mt-1.5">
                    {stats.avgScore}
                  </h3>
                  <div className="text-[11px] text-indigo-400 font-semibold mt-1 flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-amber-400" /> En Yüksek: {stats.maxScore}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)]">
                  <Award className="h-6 w-6" />
                </div>
              </div>
            </motion.div>

            {/* 2. Ortalama Net */}
            <motion.div
              whileHover={{ y: -3 }}
              className="clay-card p-5 relative overflow-hidden group border border-emerald-500/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400">Ortalama Toplam Net</p>
                  <h3 className="font-display text-3xl font-black text-white mt-1.5">
                    {stats.avgNet}
                  </h3>
                  <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                    <Target className="h-3.5 w-3.5" /> En Yüksek Net: {stats.maxNet}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)]">
                  <Target className="h-6 w-6" />
                </div>
              </div>
            </motion.div>

            {/* 3. Net Gelişim Trendi */}
            <motion.div
              whileHover={{ y: -3 }}
              className="clay-card p-5 relative overflow-hidden group border border-cyan-500/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400">Net Gelişim Trendi</p>
                  <h3 className="font-display text-3xl font-black text-white mt-1.5 flex items-center gap-1.5">
                    {stats.netTrend >= 0 ? `+${stats.netTrend}` : stats.netTrend}
                    <span className="text-xs font-bold text-slate-400">Net</span>
                  </h3>
                  <div className={`text-[11px] font-semibold mt-1 flex items-center gap-1 ${
                    stats.netTrend >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {stats.netTrend >= 0 ? (
                      <>
                        <TrendingUp className="h-3.5 w-3.5" /> İlk Sınava Göre Artış
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3.5 w-3.5" /> İlk Sınava Göre Azalış
                      </>
                    )}
                  </div>
                </div>
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)] ${
                  stats.netTrend >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {stats.netTrend >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                </div>
              </div>
            </motion.div>

            {/* 4. Toplam Sınav & Doğruluk */}
            <motion.div
              whileHover={{ y: -3 }}
              className="clay-card p-5 relative overflow-hidden group border border-fuchsia-500/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400">Girilen Sınav / Doğruluk</p>
                  <h3 className="font-display text-3xl font-black text-white mt-1.5">
                    {stats.totalExams} <span className="text-base text-slate-400 font-bold">Sınav</span>
                  </h3>
                  <div className="text-[11px] text-fuchsia-400 font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> %{stats.accuracyRate} Doğruluk Oranı
                  </div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)]">
                  <BarChart3 className="h-6 w-6" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sınavlar Arası Gelişim Grafiği (Timeline Trend Chart) */}
          <div className="clay-panel p-6 rounded-[28px] border border-slate-700/50 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-400" /> Sınavlar Arası Net & Puan Seyri
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Öğrencinin kronolojik olarak girdiği denemelerdeki gelişim eğrisi
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="badge badge-primary text-[10px]">{stats.totalExams} Deneme Kaydı</span>
              </div>
            </div>

            {/* Visual SVG Line / Bar Progression */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Net İlerleme Çubukları */}
                <div className="clay-card p-4 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-emerald-400" /> Deneme Başına Toplam Netler
                  </h4>
                  <div className="space-y-3">
                    {studentResults.map((r, idx) => {
                      const maxNetRef = Math.max(stats.maxNet, 1);
                      const percent = Math.min(100, Math.max(5, (r.totalNet / maxNetRef) * 100));
                      return (
                        <div key={r.id || idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-200 truncate max-w-[220px]" title={r.examTitle}>
                              {idx + 1}. {r.examTitle}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400">{r.examDate}</span>
                              <span className="font-black text-emerald-400">{r.totalNet} Net</span>
                            </div>
                          </div>
                          <div className="h-3 w-full bg-slate-900/80 rounded-full overflow-hidden p-0.5 clay-sunken">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 0.8, delay: idx * 0.08 }}
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Puan İlerleme Çubukları */}
                <div className="clay-card p-4 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-indigo-400" /> Deneme Başına Sınav Puanları
                  </h4>
                  <div className="space-y-3">
                    {studentResults.map((r, idx) => {
                      const maxScoreRef = Math.max(stats.maxScore, 100);
                      const percent = Math.min(100, Math.max(5, (r.totalScore / maxScoreRef) * 100));
                      return (
                        <div key={r.id || idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-200 truncate max-w-[220px]" title={r.examTitle}>
                              {idx + 1}. {r.examTitle}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400">{r.examDate}</span>
                              <span className="font-black text-indigo-400">{r.totalScore} Puan</span>
                            </div>
                          </div>
                          <div className="h-3 w-full bg-slate-900/80 rounded-full overflow-hidden p-0.5 clay-sunken">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 0.8, delay: idx * 0.08 }}
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-400 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Ders Bazlı Kümülatif Ortalama Netler Podları */}
              {subjectTrajectories.length > 0 && (
                <div className="mt-6 pt-5 border-t border-slate-700/60">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-cyan-400" /> Ders Bazlı Ortalama Netler & Gelişim
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {subjectTrajectories.map(st => (
                      <div key={st.subjectName} className="clay-card p-3 rounded-2xl text-center">
                        <div className="text-[11px] font-bold text-slate-400 truncate" title={st.subjectName}>
                          {st.subjectName}
                        </div>
                        <div className="font-black text-lg text-white mt-1">
                          {st.avgNet} <span className="text-[10px] font-normal text-slate-400">Net</span>
                        </div>
                        <div className="text-[10px] font-semibold mt-1 flex items-center justify-center gap-1">
                          <span className="text-slate-400">Maks: {st.maxNet}</span>
                          <span className={st.trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {st.trend >= 0 ? `+${st.trend}` : st.trend}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Kronolojik Deneme Karşılaştırma Matrisi (Detaylı Tablo) */}
          <div className="clay-panel p-6 rounded-[28px] border border-slate-700/50 shadow-xl overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-fuchsia-400" /> Çoklu Deneme Karşılaştırma Tablosu
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tarih sırasına göre tüm denemelerin ders netleri, toplam net ve tekil karne bağlantıları
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-700/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Tarih</th>
                    <th className="py-3 px-3">Sınav Adı</th>
                    {distinctSubjects.map(s => (
                      <th key={s} className="py-3 px-2 text-center">{s}</th>
                    ))}
                    <th className="py-3 px-3 text-center">Doğru / Yanlış</th>
                    <th className="py-3 px-3 text-center">Toplam Net</th>
                    <th className="py-3 px-3 text-center">Puan</th>
                    <th className="py-3 px-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {studentResults.map((result, idx) => {
                    return (
                      <tr 
                        key={result.id || idx}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="py-3 px-3 font-semibold text-slate-300 whitespace-nowrap">
                          {result.examDate}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-white max-w-[200px] truncate" title={result.examTitle}>
                            {result.examTitle}
                          </div>
                          <div className="text-[10px] text-slate-500">{result.examCode}</div>
                        </td>

                        {/* Subject net columns */}
                        {distinctSubjects.map(s => {
                          const sub = result.subjectResults?.find(sr => sr.subjectName === s);
                          const netVal = sub ? sub.netCount : 0;
                          return (
                            <td key={s} className="py-3 px-2 text-center font-bold">
                              {sub ? (
                                <span className={`px-2 py-0.5 rounded-lg text-xs ${
                                  netVal > 15 ? 'text-emerald-400 bg-emerald-500/10' :
                                  netVal > 8 ? 'text-indigo-300 bg-indigo-500/10' :
                                  netVal > 0 ? 'text-amber-400 bg-amber-500/10' :
                                  'text-slate-500'
                                }`}>
                                  {netVal}
                                </span>
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                            </td>
                          );
                        })}

                        <td className="py-3 px-3 text-center text-slate-400 font-semibold whitespace-nowrap">
                          <span className="text-emerald-400 font-bold">{result.totalCorrect} D</span>
                          {' / '}
                          <span className="text-rose-400 font-bold">{result.totalWrong} Y</span>
                        </td>

                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="font-black text-sm text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                            {result.totalNet}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="font-black text-sm text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-xl">
                            {result.totalScore}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {onOpenSingleReportCard && (
                            <button
                              onClick={() => onOpenSingleReportCard(result)}
                              className="btn btn-secondary text-[11px] py-1 px-2.5 rounded-xl inline-flex items-center gap-1 cursor-pointer"
                              title="Bu sınavın tekil karnesini aç"
                            >
                              <Eye className="h-3.5 w-3.5 text-indigo-400" />
                              <span>Karne</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* 🖨️ A4 PRINTABLE REPORT TEMPLATE (Hidden until print)             */}
      {/* ============================================================== */}
      {currentStudent && studentResults.length > 0 && (
        <div className="hidden print:block fixed inset-0 bg-white text-black p-8 z-50 omr-paper" data-printable="true">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                {currentUser?.institutionName || 'OPTENO DİJİTAL SINAV YÖNETİM SİSTEMİ'}
              </h1>
              <h2 className="text-base font-bold text-slate-700 mt-1">
                ÖĞRENCİ KÜMÜLATİF GELİŞİM & ÇOKLU DENEME KARNESİ
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Rapor Dönemi: {startDate ? `${startDate} - ${endDate}` : `Tüm Sınavlar (${endDate})`}
              </p>
            </div>
            <div className="text-right text-xs">
              <div className="font-bold text-slate-900">Tarih: {new Date().toLocaleDateString('tr-TR')}</div>
              <div className="text-slate-600">Toplam Sınav: {stats.totalExams}</div>
            </div>
          </div>

          {/* Student Info Box */}
          <div className="grid grid-cols-4 gap-4 p-4 rounded-lg border border-slate-300 bg-slate-50 mb-6 text-xs">
            <div>
              <span className="text-slate-500 font-semibold block">Öğrenci Adı Soyadı:</span>
              <strong className="text-sm text-slate-900">{currentStudent.firstName} {currentStudent.lastName}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block">Okul Numarası:</span>
              <strong className="text-sm text-slate-900">{currentStudent.studentNo}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block">Sınıfı:</span>
              <strong className="text-sm text-slate-900">{currentStudent.className}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block">Veli İletişim:</span>
              <strong className="text-sm text-slate-900">{currentStudent.parentPhone || '-'}</strong>
            </div>
          </div>

          {/* KPI Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6 text-center">
            <div className="p-3 border rounded-lg bg-indigo-50/50 border-indigo-200">
              <div className="text-[11px] font-bold text-indigo-900">ORTALAMA NET</div>
              <div className="text-xl font-black text-indigo-700 mt-1">{stats.avgNet}</div>
              <div className="text-[10px] text-indigo-600 mt-0.5">En Yüksek: {stats.maxNet}</div>
            </div>
            <div className="p-3 border rounded-lg bg-emerald-50/50 border-emerald-200">
              <div className="text-[11px] font-bold text-emerald-900">ORTALAMA PUAN</div>
              <div className="text-xl font-black text-emerald-700 mt-1">{stats.avgScore}</div>
              <div className="text-[10px] text-emerald-600 mt-0.5">En Yüksek: {stats.maxScore}</div>
            </div>
            <div className="p-3 border rounded-lg bg-amber-50/50 border-amber-200">
              <div className="text-[11px] font-bold text-amber-900">NET GELİŞİM TRENDİ</div>
              <div className="text-xl font-black text-amber-700 mt-1">
                {stats.netTrend >= 0 ? `+${stats.netTrend}` : stats.netTrend} Net
              </div>
              <div className="text-[10px] text-amber-600 mt-0.5">İlk sınava göre değişim</div>
            </div>
            <div className="p-3 border rounded-lg bg-purple-50/50 border-purple-200">
              <div className="text-[11px] font-bold text-purple-900">DOĞRULUK ORANI</div>
              <div className="text-xl font-black text-purple-700 mt-1">%{stats.accuracyRate}</div>
              <div className="text-[10px] text-purple-600 mt-0.5">Toplam {stats.totalQuestions} Soru</div>
            </div>
          </div>

          {/* Exam Table */}
          <table className="w-full text-left border-collapse text-xs mb-8">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-slate-100 font-bold">
                <th className="py-2 px-2">Tarih</th>
                <th className="py-2 px-2">Sınav Adı</th>
                {distinctSubjects.map(s => (
                  <th key={s} className="py-2 px-1 text-center">{s} Net</th>
                ))}
                <th className="py-2 px-2 text-center">D / Y</th>
                <th className="py-2 px-2 text-center">Toplam Net</th>
                <th className="py-2 px-2 text-center">Puan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {studentResults.map((r, i) => (
                <tr key={i}>
                  <td className="py-2 px-2 font-medium">{r.examDate}</td>
                  <td className="py-2 px-2 font-bold">{r.examTitle}</td>
                  {distinctSubjects.map(s => {
                    const sub = r.subjectResults?.find(sr => sr.subjectName === s);
                    return <td key={s} className="py-2 px-1 text-center font-bold">{sub ? sub.netCount : '-'}</td>;
                  })}
                  <td className="py-2 px-2 text-center">{r.totalCorrect} / {r.totalWrong}</td>
                  <td className="py-2 px-2 text-center font-black">{r.totalNet}</td>
                  <td className="py-2 px-2 text-center font-black">{r.totalScore}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer Signature */}
          <div className="grid grid-cols-2 gap-12 mt-12 pt-6 border-t border-slate-400 text-xs">
            <div className="text-center">
              <div className="font-bold text-slate-800">Sınıf Rehber Öğretmeni</div>
              <div className="h-14"></div>
              <div className="text-slate-500">İmza</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-slate-800">Okul Müdürü / Kurum Yöneticisi</div>
              <div className="h-14"></div>
              <div className="text-slate-500">İmza & Mühür</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
