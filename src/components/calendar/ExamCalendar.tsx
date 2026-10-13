import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Printer,
  Camera,
  BarChart3,
  PlusCircle,
  Filter,
  Search,
  Building2,
  GraduationCap,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  List,
  Edit,
  X,
  ArrowRight,
  Sliders,
  Layers,
  ChevronDown
} from 'lucide-react';
import { Exam, Institution, SystemGradeLevel, User } from '../../types';
import { storageService } from '../../services/storageService';

interface ExamCalendarProps {
  currentUser?: User | null;
  onNavigateToCreateExam?: (presetDate?: string) => void;
  onNavigateToOMR?: (examId: string) => void;
  onNavigateToScan?: (examId?: string) => void;
  onNavigateToResults?: (examId: string) => void;
}

const WEEKDAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const SHORT_WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export const ExamCalendar: React.FC<ExamCalendarProps> = ({
  currentUser,
  onNavigateToCreateExam,
  onNavigateToOMR,
  onNavigateToScan,
  onNavigateToResults
}) => {
  const activeUser = currentUser || storageService.getCurrentUser();
  const isSuperAdmin = activeUser?.role === 'SUPER_ADMIN';

  // Core Data States
  const [exams, setExams] = useState<Exam[]>(() => {
    return storageService.getExams(isSuperAdmin ? undefined : activeUser?.institutionId);
  });
  const [institutions, setInstitutions] = useState<Institution[]>(() => storageService.getInstitutions());
  const [gradeLevels, setGradeLevels] = useState<SystemGradeLevel[]>(() => storageService.getGradeLevels());

  // Calendar Navigation States (Defaults to current date)
  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');

  // Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('ALL');
  const [selectedInstId, setSelectedInstId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED'>('ALL');

  // Modal States
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [quickScheduleDate, setQuickScheduleDate] = useState<string | null>(null);
  const [quickExamTitle, setQuickExamTitle] = useState<string>('');
  const [quickExamGrade, setQuickExamGrade] = useState<string>('8. Sınıf');

  // Live Refresh on Storage Events
  useEffect(() => {
    const handleReload = () => {
      const u = storageService.getCurrentUser();
      setExams(storageService.getExams(u?.role === 'SUPER_ADMIN' ? undefined : u?.institutionId));
      setInstitutions(storageService.getInstitutions());
      setGradeLevels(storageService.getGradeLevels());
    };
    window.addEventListener('opticok-data-updated', handleReload);
    return () => window.removeEventListener('opticok-data-updated', handleReload);
  }, []);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Navigation Handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filtered Exams
  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      if (exam.isDeleted) return false;

      // Search Filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesTitle = exam.title.toLowerCase().includes(q);
        const matchesCode = (exam.examCode || '').toLowerCase().includes(q);
        const matchesInst = (exam.institutionName || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCode && !matchesInst) return false;
      }

      // Grade Level Filter
      if (selectedGradeLevel !== 'ALL') {
        const examGradeStr = String(exam.gradeLevel || '');
        if (examGradeStr !== selectedGradeLevel && !examGradeStr.includes(selectedGradeLevel)) {
          return false;
        }
      }

      // Institution Filter (for SuperAdmin)
      if (isSuperAdmin && selectedInstId !== 'ALL') {
        if (exam.institutionId !== selectedInstId && exam.institutionId !== 'ALL') {
          return false;
        }
      }

      // Status Filter
      if (statusFilter !== 'ALL') {
        const examDate = new Date(exam.date);
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const isPast = examDate < todayDateOnly;
        if (statusFilter === 'UPCOMING' && isPast && exam.totalExamsScanned > 0) return false;
        if (statusFilter === 'COMPLETED' && exam.totalExamsScanned === 0 && !isPast) return false;
      }

      return true;
    });
  }, [exams, searchTerm, selectedGradeLevel, selectedInstId, statusFilter, isSuperAdmin, today]);

  // Calendar Grid Calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Monday is 0 in Turkish calendar: (day + 6) % 7
    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = lastDayOfMonth.getDate();

    // Days from previous month
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    const days: { date: Date; isCurrentMonth: boolean; dateString: string }[] = [];

    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
      const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({ date: d, isCurrentMonth: false, dateString });
    }

    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(currentYear, currentMonth, i);
      const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({ date: d, isCurrentMonth: true, dateString });
    }

    // Days for next month to complete the 35 or 42 grid
    const remaining = (7 - (days.length % 7)) % 7;
    const targetLength = days.length + remaining < 35 ? 35 : days.length + remaining;
    const nextMonthDaysToAdd = targetLength - days.length;

    for (let i = 1; i <= nextMonthDaysToAdd; i++) {
      const d = new Date(currentYear, currentMonth + 1, i);
      const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({ date: d, isCurrentMonth: false, dateString });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Map exams to dates for O(1) cell lookup
  const examsByDate = useMemo(() => {
    const map = new Map<string, Exam[]>();
    filteredExams.forEach(exam => {
      // Normalize date to YYYY-MM-DD
      const dateKey = (exam.date || '').split('T')[0];
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(exam);
    });
    return map;
  }, [filteredExams]);

  // Next Nearest Upcoming Exam for Hero Countdown Widget
  const nextUpcomingExam = useMemo(() => {
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const futureExams = exams
      .filter(e => !e.isDeleted && e.date >= todayStr)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return futureExams[0] || null;
  }, [exams, today]);

  // Days left calculation
  const daysUntilNextExam = useMemo(() => {
    if (!nextUpcomingExam) return null;
    const examDate = new Date(nextUpcomingExam.date);
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffTime = examDate.getTime() - todayDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [nextUpcomingExam, today]);

  // Reschedule Exam Date Handler
  const handleSaveReschedule = () => {
    if (!selectedExam || !rescheduleDate) return;
    const updatedExam: Exam = {
      ...selectedExam,
      date: rescheduleDate
    };
    storageService.updateExam(updatedExam);
    setSelectedExam(updatedExam);
    setIsRescheduling(false);
  };

  // Quick Plan Exam Handler
  const handleQuickCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickScheduleDate || !quickExamTitle.trim()) {
      alert('Lütfen sınav adını girin.');
      return;
    }

    if (onNavigateToCreateExam) {
      onNavigateToCreateExam(quickScheduleDate);
      setQuickScheduleDate(null);
      return;
    }

    const newExamId = `exam-${Date.now()}`;
    const inst = institutions[0];
    const newExam: Exam = {
      id: newExamId,
      institutionId: activeUser.institutionId || (inst ? inst.id : 'inst-1'),
      institutionName: inst ? inst.name : 'Opteno Kurumu',
      title: quickExamTitle.trim(),
      examCode: `DNM-${Math.floor(100 + Math.random() * 900)}`,
      date: quickScheduleDate,
      gradeLevel: quickExamGrade,
      totalQuestions: 40,
      totalExamsScanned: 0,
      isStudentSpecific: true,
      createdAt: new Date().toISOString(),
      createdByRole: activeUser.role,
      createdByUserId: activeUser.id,
      createdByName: activeUser.name,
      subjects: [
        {
          id: `sbj-${Date.now()}-1`,
          name: 'Türkçe',
          questionCount: 20,
          optionCount: 4,
          coefficient: 4,
          correctAnswers: Array(20).fill('A')
        },
        {
          id: `sbj-${Date.now()}-2`,
          name: 'Matematik',
          questionCount: 20,
          optionCount: 4,
          coefficient: 4,
          correctAnswers: Array(20).fill('B')
        }
      ]
    };

    storageService.addExam(newExam);
    setQuickScheduleDate(null);
    setQuickExamTitle('');
  };

  // Badge Color Helper by Grade Level
  const getGradeBadgeStyle = (gradeLevel?: number | string) => {
    const str = String(gradeLevel || '').toLowerCase();
    if (str.includes('8') || str.includes('lgs')) {
      return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
    }
    if (str.includes('12') || str.includes('yks') || str.includes('tyt') || str.includes('ayt')) {
      return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
    }
    if (str.includes('5') || str.includes('6') || str.includes('7')) {
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    }
    return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
  };

  const monthName = currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  const todayDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="mx-auto max-w-7xl px-2 sm:px-4 py-4 space-y-6">
      
      {/* 1. TOP HEADER & ACTION BAR */}
      <div className="glass-panel p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-600/30 shrink-0">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Sınav Takvimi & Planlayıcı
              </h1>
              <span className="badge badge-primary text-[10px] hidden sm:inline-flex">Dönem 2026</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Planlanan deneme sınavları, uygulama tarihleri ve doğrudan optik basım/okuma kısayolları
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="clay-sunken p-1 rounded-2xl flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" /> Ay Görünümü
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="h-3.5 w-3.5" /> Ajanda Akışı
            </button>
          </div>

          {/* New Exam Plan Button */}
          {onNavigateToCreateExam && (
            <button
              onClick={() => onNavigateToCreateExam()}
              className="btn btn-primary text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 font-bold shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" /> Yeni Sınav Planla
            </button>
          )}
        </div>
      </div>

      {/* 2. UPCOMING EXAM HERO COUNTDOWN BANNER (Akıllı Geri Sayım & Durum) */}
      {nextUpcomingExam && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-slate-900/80 to-blue-950/40 border border-indigo-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  En Yakın Sınav
                </span>
                {daysUntilNextExam === 0 ? (
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 animate-pulse">
                    🟢 BUGÜN UYGULANIYOR
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-300">
                    ⏱️ {daysUntilNextExam} Gün Kaldı
                  </span>
                )}
              </div>
              <h3 className="font-display text-sm sm:text-base font-extrabold text-white mt-1">
                {nextUpcomingExam.title}
              </h3>
              <p className="text-xs text-slate-400">
                Tarih: <strong className="text-slate-200">{nextUpcomingExam.date}</strong> | Seviye: <strong className="text-slate-200">{nextUpcomingExam.gradeLevel || 'Genel'}</strong> | Soru: <strong className="text-slate-200">{nextUpcomingExam.totalQuestions}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onNavigateToOMR && (
              <button
                onClick={() => onNavigateToOMR(nextUpcomingExam.id)}
                className="btn btn-secondary text-xs py-2 px-3 font-semibold flex items-center gap-1.5"
                title="Optik Form Bas"
              >
                <Printer className="h-3.5 w-3.5 text-indigo-400" /> Optik Bas
              </button>
            )}
            {onNavigateToScan && (
              <button
                onClick={() => onNavigateToScan(nextUpcomingExam.id)}
                className="btn btn-primary text-xs py-2 px-3 font-semibold bg-emerald-600 hover:bg-emerald-500 border-none text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
                title="Kamera ile Oku"
              >
                <Camera className="h-3.5 w-3.5 text-white" /> Oku
              </button>
            )}
            <button
              onClick={() => setSelectedExam(nextUpcomingExam)}
              className="btn btn-secondary text-xs py-2 px-3 font-semibold flex items-center gap-1"
            >
              Detay <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. CALENDAR CONTROLS & FILTER BAR */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Month Selector Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl clay-card text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
              title="Önceki Ay"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl text-xs font-bold clay-card text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition-all cursor-pointer"
            >
              Bugün
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl clay-card text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
              title="Sonraki Ay"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <h2 className="font-display font-black text-base sm:text-lg text-slate-900 dark:text-white capitalize">
            {monthName}
          </h2>
        </div>

        {/* Filter Controls: Search & Grade Level */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative min-w-[160px] flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Sınav ara..."
              className="input-field text-xs py-1.5 pl-8 pr-2 w-full"
            />
          </div>

          {/* Grade Level Select */}
          <select
            value={selectedGradeLevel}
            onChange={(e) => setSelectedGradeLevel(e.target.value)}
            className="select-field text-xs py-1.5 px-3 min-w-[130px]"
          >
            <option value="ALL">Tüm Sınıflar</option>
            {gradeLevels.map(gl => (
              <option key={gl.id} value={gl.name}>{gl.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="select-field text-xs py-1.5 px-3"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="UPCOMING">Yaklaşan Sınavlar</option>
            <option value="COMPLETED">Uygulanmış Sınavlar</option>
          </select>
        </div>
      </div>

      {/* 4. VIEW RENDERING: MONTH GRID OR AGENDA STREAM */}
      {viewMode === 'month' ? (
        /* ============================================================== */
        /* 📅 MONTH CALENDAR GRID                                         */
        /* ============================================================== */
        <div className="glass-panel p-2 sm:p-4 rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
          {/* Weekday Column Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {WEEKDAYS.map((dayName, idx) => (
              <div
                key={dayName}
                className="py-2 text-center text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider"
              >
                <span className="hidden sm:inline">{dayName}</span>
                <span className="sm:hidden">{SHORT_WEEKDAYS[idx]}</span>
              </div>
            ))}
          </div>

          {/* 35/42 Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((dayObj, dIdx) => {
              const dayExams = examsByDate.get(dayObj.dateString) || [];
              const isToday = dayObj.dateString === todayDateString;

              return (
                <div
                  key={dIdx}
                  onClick={() => {
                    if (dayExams.length === 0) {
                      setQuickScheduleDate(dayObj.dateString);
                    }
                  }}
                  className={`min-h-[85px] sm:min-h-[120px] p-1.5 sm:p-2 rounded-2xl border transition-all flex flex-col justify-between group cursor-pointer ${
                    isToday
                      ? 'bg-indigo-600/10 border-indigo-500/60 dark:bg-indigo-950/30 dark:border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                      : dayObj.isCurrentMonth
                      ? 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-600/50'
                      : 'bg-slate-50/30 dark:bg-slate-950/20 border-slate-200/40 dark:border-slate-900/40 opacity-40'
                  }`}
                >
                  {/* Day Header: Day Number + Quick Add Button */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center rounded-lg text-[11px] sm:text-xs font-black ${
                        isToday
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : dayObj.isCurrentMonth
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-400'
                      }`}
                    >
                      {dayObj.date.getDate()}
                    </span>

                    {/* Quick Add Plus Pill (Visible on hover on desktop) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickScheduleDate(dayObj.dateString);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 sm:p-1 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-opacity"
                      title="Bu güne sınav planla"
                    >
                      <PlusCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </button>
                  </div>

                  {/* Day Exams List */}
                  <div className="flex-1 space-y-1 overflow-y-auto max-h-[80px] no-scrollbar">
                    {dayExams.slice(0, 3).map((exam) => (
                      <motion.div
                        key={exam.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedExam(exam);
                        }}
                        className={`px-1.5 py-1 rounded-lg text-[9.5px] sm:text-[10px] font-bold border truncate cursor-pointer transition-all ${getGradeBadgeStyle(exam.gradeLevel)}`}
                        title={`${exam.title} (${exam.totalQuestions} Soru)`}
                      >
                        <div className="truncate font-semibold">{exam.title}</div>
                        <div className="flex items-center justify-between text-[8px] opacity-80 mt-0.5">
                          <span>{exam.gradeLevel || 'Genel'}</span>
                          <span>{exam.totalExamsScanned > 0 ? `✓ ${exam.totalExamsScanned}` : 'Bekliyor'}</span>
                        </div>
                      </motion.div>
                    ))}

                    {dayExams.length > 3 && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewMode('agenda');
                        }}
                        className="text-[9px] font-bold text-center text-indigo-500 hover:underline cursor-pointer"
                      >
                        +{dayExams.length - 3} Sınav Daha
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* 📋 AGENDA & STREAM VIEW (Mobile Friendly Timeline)             */
        /* ============================================================== */
        <div className="space-y-4">
          {filteredExams.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-3xl">
              <CalendarIcon className="h-12 w-12 text-slate-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Seçilen Kriterlerde Planlanmış Sınav Bulunamadı
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Filtreleri temizleyebilir veya yeni bir sınav planlayarak takvime ekleyebilirsiniz.
              </p>
            </div>
          ) : (
            filteredExams
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((exam) => {
                const isExamToday = exam.date === todayDateString;
                const isPast = new Date(exam.date) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

                return (
                  <motion.div
                    key={exam.id}
                    whileHover={{ y: -2 }}
                    onClick={() => setSelectedExam(exam)}
                    className={`glass-panel p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border cursor-pointer transition-all ${
                      isExamToday
                        ? 'border-indigo-500/60 bg-indigo-500/5 shadow-md shadow-indigo-500/10'
                        : 'hover:border-indigo-400 dark:hover:border-indigo-600'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className={`h-12 w-12 rounded-2xl flex flex-col items-center justify-center shrink-0 border font-display ${
                        isExamToday
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}>
                        <span className="text-[10px] uppercase font-bold leading-none">
                          {new Date(exam.date).toLocaleDateString('tr-TR', { month: 'short' })}
                        </span>
                        <span className="text-lg font-black leading-none mt-0.5">
                          {new Date(exam.date).getDate()}
                        </span>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                            {exam.title}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getGradeBadgeStyle(exam.gradeLevel)}`}>
                            {exam.gradeLevel || 'Genel'}
                          </span>
                          {isExamToday && (
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full animate-pulse">
                              Bugün
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span>Kod: <strong className="font-mono text-slate-700 dark:text-slate-300">{exam.examCode}</strong></span>
                          <span>•</span>
                          <span>Soru Sayısı: <strong className="text-slate-700 dark:text-slate-300">{exam.totalQuestions}</strong></span>
                          <span>•</span>
                          <span>Okunan Kağıt: <strong className="text-emerald-500">{exam.totalExamsScanned}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons in Agenda View */}
                    <div className="flex flex-wrap items-center gap-2 self-end md:self-auto shrink-0" onClick={(e) => e.stopPropagation()}>
                      {onNavigateToOMR && (
                        <button
                          onClick={() => onNavigateToOMR(exam.id)}
                          className="btn btn-secondary text-xs py-2 px-3 font-semibold flex items-center gap-1.5"
                          title="Optik Form Bas"
                        >
                          <Printer className="h-3.5 w-3.5 text-indigo-400" /> Optik Bas
                        </button>
                      )}
                      {onNavigateToScan && (
                        <button
                          onClick={() => onNavigateToScan(exam.id)}
                          className="btn btn-primary text-xs py-2 px-3 font-semibold bg-emerald-600 hover:bg-emerald-500 border-none text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
                          title="Kamera ile Oku"
                        >
                          <Camera className="h-3.5 w-3.5 text-white" /> Oku
                        </button>
                      )}
                      {onNavigateToResults && exam.totalExamsScanned > 0 && (
                        <button
                          onClick={() => onNavigateToResults(exam.id)}
                          className="btn btn-secondary text-xs py-2 px-3 font-semibold flex items-center gap-1.5"
                          title="Sonuçları Gör"
                        >
                          <BarChart3 className="h-3.5 w-3.5 text-blue-400" /> Sonuçlar
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 🔍 EXAM DETAIL & QUICK ACTION MODAL                           */}
      {/* ============================================================== */}
      <AnimatePresence>
        {selectedExam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 space-y-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getGradeBadgeStyle(selectedExam.gradeLevel)}`}>
                    {selectedExam.gradeLevel || 'Genel'} Seviye
                  </span>
                  <h3 className="font-display font-black text-lg sm:text-xl text-white mt-1">
                    {selectedExam.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sınav Kodu: <strong className="font-mono text-indigo-300">{selectedExam.examCode}</strong>
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedExam(null);
                    setIsRescheduling(false);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Exam Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div>
                  <span className="text-slate-400 block text-[11px]">Uygulama Tarihi:</span>
                  <strong className="text-slate-200 text-sm font-semibold">{selectedExam.date}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Okunan Kağıt:</span>
                  <strong className="text-emerald-400 text-sm font-semibold">{selectedExam.totalExamsScanned} Adet</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Toplam Soru:</span>
                  <strong className="text-slate-200">{selectedExam.totalQuestions} Soru</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Ders Sayısı:</span>
                  <strong className="text-slate-200">{selectedExam.subjects?.length || 0} Ders</strong>
                </div>
              </div>

              {/* Reschedule Date Area */}
              {isRescheduling ? (
                <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-3">
                  <label className="block text-xs font-bold text-indigo-300">Yeni Uygulama Tarihini Seçin:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="input-field text-xs py-2 px-3 flex-1"
                    />
                    <button
                      onClick={handleSaveReschedule}
                      className="btn btn-primary text-xs py-2 px-4 font-bold"
                    >
                      Kaydet
                    </button>
                    <button
                      onClick={() => setIsRescheduling(false)}
                      className="btn btn-secondary text-xs py-2 px-3"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setRescheduleDate(selectedExam.date);
                    setIsRescheduling(true);
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit className="h-3.5 w-3.5" /> Sınav Tarihini Değiştir / Ertele
                </button>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                {onNavigateToOMR && (
                  <button
                    onClick={() => {
                      onNavigateToOMR(selectedExam.id);
                      setSelectedExam(null);
                    }}
                    className="btn btn-secondary text-xs py-2.5 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="h-4 w-4 text-indigo-400" /> Optik Bas
                  </button>
                )}

                {onNavigateToScan && (
                  <button
                    onClick={() => {
                      onNavigateToScan(selectedExam.id);
                      setSelectedExam(null);
                    }}
                    className="btn btn-primary text-xs py-2.5 font-bold bg-emerald-600 hover:bg-emerald-500 text-white border-none flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/30"
                  >
                    <Camera className="h-4 w-4" /> Optik Oku
                  </button>
                )}

                {onNavigateToResults && (
                  <button
                    onClick={() => {
                      onNavigateToResults(selectedExam.id);
                      setSelectedExam(null);
                    }}
                    className="btn btn-secondary text-xs py-2.5 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <BarChart3 className="h-4 w-4 text-blue-400" /> Sonuçlar
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* ⚡ QUICK SCHEDULE EXAM MODAL                                   */}
      {/* ============================================================== */}
      <AnimatePresence>
        {quickScheduleDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-white">Bu Güne Sınav Planla</h3>
                    <p className="text-xs text-indigo-300 font-semibold">{quickScheduleDate}</p>
                  </div>
                </div>

                <button
                  onClick={() => setQuickScheduleDate(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleQuickCreateExam} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sınav Adı *</label>
                  <input
                    type="text"
                    required
                    value={quickExamTitle}
                    onChange={(e) => setQuickExamTitle(e.target.value)}
                    placeholder="ör. 8. Sınıf Haftalık Kazanım Denemesi - 4"
                    className="input-field text-xs py-2 w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sınıf Seviyesi</label>
                  <select
                    value={quickExamGrade}
                    onChange={(e) => setQuickExamGrade(e.target.value)}
                    className="select-field text-xs py-2 w-full"
                  >
                    {gradeLevels.map(gl => (
                      <option key={gl.id} value={gl.name}>{gl.name}</option>
                    ))}
                    <option value="Tüm Seviyeler">Genel / Tüm Seviyeler</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setQuickScheduleDate(null)}
                    className="btn btn-secondary text-xs py-2 px-3"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary text-xs py-2 px-4 font-bold"
                  >
                    Planla & Kaydet
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
