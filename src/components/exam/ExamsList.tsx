import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Plus, Calendar, Printer, Camera, Trash2, Layers, Search, 
  Sparkles, CheckCircle2, ChevronRight, ChevronDown, ChevronUp, 
  User as UserIcon, Shield, Building2, Lock, FolderKanban, Filter, X,
  GraduationCap, RotateCcw, AlertTriangle, Edit3, MoreVertical, KeyRound
} from 'lucide-react';
import { Exam, User, Institution, SystemGradeLevel } from '../../types';
import { storageService } from '../../services/storageService';
import { EditAnswerKeyModal } from './EditAnswerKeyModal';
import { Pagination } from '../common/Pagination';
import { ViewModeToggle } from '../common/ViewModeToggle';

interface ExamsListProps {
  currentUser?: User;
  highlightedExamId?: string;
  onNavigateToCreateExam?: () => void;
  onNavigateToEditExam?: (examId: string, step?: 1 | 2 | 3) => void;
  onNavigateToOMR?: (examId: string) => void;
  onNavigateToScan?: () => void;
  onNavigateToResults?: (examId: string) => void;
  onNavigateToCalendar?: () => void;
}

const formatGradeLevel = (gl?: string | number) => {
  if (!gl) return '-';
  const str = String(gl).trim();
  if (str.toLowerCase().includes('sınıf') || str.toLowerCase().includes('mezun')) {
    return str;
  }
  return `${str}. Sınıf`;
};

export const ExamsList: React.FC<ExamsListProps> = ({
  currentUser,
  highlightedExamId,
  onNavigateToCreateExam,
  onNavigateToEditExam,
  onNavigateToOMR,
  onNavigateToScan,
  onNavigateToResults,
  onNavigateToCalendar
}) => {
  const activeUser = currentUser || storageService.getCurrentUser();
  const isSuperAdmin = activeUser.role === 'SUPER_ADMIN';

  const [exams, setExams] = useState<Exam[]>(() => {
    return storageService.getExams(isSuperAdmin ? undefined : activeUser.institutionId);
  });
  const [trashExams, setTrashExams] = useState<Exam[]>(() => {
    return storageService.getTrashExams(isSuperAdmin ? undefined : activeUser.institutionId);
  });
  const [institutions, setInstitutions] = useState<Institution[]>(() => storageService.getInstitutions());
  const [gradeLevels, setGradeLevels] = useState<SystemGradeLevel[]>(() => storageService.getGradeLevels());

  // Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'SYSTEM' | 'INSTITUTION' | 'TRASH'>('ALL');
  const [selectedInstId, setSelectedInstId] = useState<string>('ALL');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('ALL');

  // Confirmation Modal States
  const [examToDelete, setExamToDelete] = useState<{ exam: Exam; scanCount: number; isPermanent: boolean } | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState<string>('');

  // Quick Answer Key Edit Modal State
  const [answerKeyModalExamId, setAnswerKeyModalExamId] = useState<string | null>(null);
  const [actionSuccessBanner, setActionSuccessBanner] = useState<string | null>(null);
  
  // View Mode & Pagination States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('opteno_exams_view_mode') as 'grid' | 'list') || 'list';
  });
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(() => {
    const saved = localStorage.getItem('opteno_exams_page_size');
    return saved ? Number(saved) : 10;
  });

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('opteno_exams_view_mode', mode);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    localStorage.setItem('opteno_exams_page_size', String(size));
  };

  // Grouping & Collapse States (Default grouped for SuperAdmin to eliminate clutter)
  const [groupByInstitution, setGroupByInstitution] = useState<boolean>(isSuperAdmin);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const reloadExams = () => {
    const user = currentUser || storageService.getCurrentUser();
    setExams(storageService.getExams(user.role === 'SUPER_ADMIN' ? undefined : user.institutionId));
    setTrashExams(storageService.getTrashExams(user.role === 'SUPER_ADMIN' ? undefined : user.institutionId));
    setInstitutions(storageService.getInstitutions());
    setGradeLevels(storageService.getGradeLevels());
  };

  // Active Dropdown Action Menu Exam ID
  const [activeMenuExamId, setActiveMenuExamId] = useState<string | null>(null);

  useEffect(() => {
    reloadExams();
    const handleUpdate = () => {
      reloadExams();
    };
    const handleGlobalClick = (e: MouseEvent) => {
      // Close dropdown if clicking outside
      const target = e.target as HTMLElement | null;
      if (!target?.closest('.exam-action-menu-container')) {
        setActiveMenuExamId(null);
      }
    };
    window.addEventListener('opticok-data-updated', handleUpdate);
    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('opticok-data-updated', handleUpdate);
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [currentUser]);

  // Sınavı Silmeye Başla (Güvenli Onay Modalı Açar)
  const handleInitiateDelete = (exam: Exam, isPermanent: boolean = false) => {
    const user = currentUser || storageService.getCurrentUser();
    if (!storageService.canDeleteExam(exam, user)) {
      alert('Bu sınav Sistem Yöneticisi tarafından oluşturulmuş merkezi bir sınavdır. Kurumlar sistem sınavlarını silemez; sadece optik basımı yapabilir, optik okuyabilir ve sonuçlarını inceleyebilir.');
      return;
    }
    const results = storageService.getResults(exam.id);
    setExamToDelete({ exam, scanCount: results.length, isPermanent });
    setDeleteConfirmationText('');
  };

  // Onaylandıktan Sonra Silme İşlemini Gerçekleştir
  const handleConfirmDelete = () => {
    if (!examToDelete) return;
    const user = currentUser || storageService.getCurrentUser();
    
    // Eğer sınavda taranmış optik form varsa veya kalıcı siliniyorsa "SİL" yazılması zorunludur
    if (examToDelete.scanCount > 0 || examToDelete.isPermanent) {
      if (deleteConfirmationText.trim().toUpperCase() !== 'SİL') {
        alert('Lütfen silme işlemini onaylamak için kutuya büyük harflerle SİL yazın.');
        return;
      }
    }

    if (examToDelete.isPermanent) {
      storageService.permanentlyDeleteExam(examToDelete.exam.id, user);
    } else {
      storageService.deleteExam(examToDelete.exam.id, user);
    }
    setExamToDelete(null);
    setDeleteConfirmationText('');
    reloadExams();
  };

  // Çöp Kutusundan Geri Yükle
  const handleRestoreExam = (exam: Exam) => {
    const user = currentUser || storageService.getCurrentUser();
    storageService.restoreExam(exam.id, user);
    reloadExams();
  };

  const isSystemExam = (exam: Exam): boolean => {
    return exam.isSystemExam === true || exam.createdByRole === 'SUPER_ADMIN' || exam.institutionId === 'ALL' || exam.institutionId === 'SYSTEM';
  };

  // Counts for Scope Tabs
  const totalCount = exams.length;
  const systemCount = exams.filter(isSystemExam).length;
  const instCount = exams.filter(e => !isSystemExam(e)).length;
  const trashCount = trashExams.length;

  // Filtered Exams (Active or Trash depending on scopeFilter)
  const filteredExams = useMemo(() => {
    const listToFilter = scopeFilter === 'TRASH' ? trashExams : exams;

    return listToFilter.filter(e => {
      // 1. Search filter
      const matchesSearch = 
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.examCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.institutionName && e.institutionName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.gradeLevel && String(e.gradeLevel).toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // 2. Scope filter (Tümü / Merkezi / Kurum / Çöp Kutusu)
      if (scopeFilter === 'TRASH') return true;

      const isSys = isSystemExam(e);
      if (scopeFilter === 'SYSTEM' && !isSys) return false;
      if (scopeFilter === 'INSTITUTION' && isSys) return false;

      // 3. Institution dropdown filter
      if (selectedInstId === 'SYSTEM' && !isSys) return false;
      if (selectedInstId !== 'ALL' && selectedInstId !== 'SYSTEM' && e.institutionId !== selectedInstId) return false;

      // 4. Grade level filter
      if (selectedGradeLevel !== 'ALL' && String(e.gradeLevel) !== selectedGradeLevel) return false;

      return true;
    });
  }, [exams, searchTerm, scopeFilter, selectedInstId, selectedGradeLevel]);

  // Grouped Exams by Institution
  const groupedExams = useMemo(() => {
    const groups: { id: string; name: string; type: 'SYSTEM' | 'INSTITUTION'; exams: Exam[] }[] = [];

    // Group 1: Merkezi Sistem Sınavları
    const systemExams = filteredExams.filter(isSystemExam);
    if (systemExams.length > 0) {
      groups.push({
        id: 'group-system',
        name: '🛡️ Merkezi Sistem Sınavları (Tüm Kurumlar)',
        type: 'SYSTEM',
        exams: systemExams
      });
    }

    // Group 2..N: Kurum Sınavları
    const instExamMap = new Map<string, Exam[]>();
    filteredExams.filter(e => !isSystemExam(e)).forEach(e => {
      const key = e.institutionId || 'other';
      if (!instExamMap.has(key)) instExamMap.set(key, []);
      instExamMap.get(key)!.push(e);
    });

    instExamMap.forEach((instExams, instId) => {
      const instObj = institutions.find(i => i.id === instId);
      const instName = instObj ? instObj.name : (instExams[0]?.institutionName || 'Kurum Sınavları');
      groups.push({
        id: `group-${instId}`,
        name: `🏫 ${instName}`,
        type: 'INSTITUTION',
        exams: instExams
      });
    });

    return groups;
  }, [filteredExams, institutions]);

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const paginatedExams = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredExams.slice(start, start + pageSize);
  }, [filteredExams, page, pageSize]);

  const hasActiveFilters = searchTerm !== '' || scopeFilter !== 'ALL' || selectedInstId !== 'ALL' || selectedGradeLevel !== 'ALL';

  const clearFilters = () => {
    setSearchTerm('');
    setScopeFilter('ALL');
    setSelectedInstId('ALL');
    setSelectedGradeLevel('ALL');
    setPage(1);
  };

  // Render Single Exam Card
  const renderExamCard = (exam: Exam) => {
    const examResults = storageService.getResults(exam.id);
    const isHighlighted = exam.id === highlightedExamId;
    const isSys = isSystemExam(exam);
    const canDelete = storageService.canDeleteExam(exam, activeUser);
    const canEdit = storageService.canEditExam(exam, activeUser);

    return (
      <div
        key={exam.id}
        className={`glass-card p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 bg-white/80 dark:bg-slate-900/80 ${
          isHighlighted
            ? 'border-emerald-500 shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-500/40 bg-white/95 dark:bg-slate-900/90'
            : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 shadow-sm'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="badge badge-indigo text-[10px] font-mono font-bold">
                {exam.examCode}
              </span>
              {isHighlighted && (
                <span className="badge badge-success text-[10px] animate-pulse">
                  ✨ Son Okunan Sınav
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> {exam.date}
            </span>
          </div>

          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white leading-snug">
            {exam.title}
          </h3>
          
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {exam.gradeLevel && (
              <span className="badge badge-info text-[10px]">{exam.gradeLevel}</span>
            )}
            {exam.hasBookletTypes && (
              <span className="badge badge-warning text-[10px] font-bold">A/B Kitapçıklı</span>
            )}
            {isSys ? (
              <span className="badge badge-primary text-[10px] font-bold flex items-center gap-1 shadow-sm">
                <Shield className="h-3 w-3 text-indigo-500 dark:text-indigo-300" /> Merkezi Sistem Sınavı
              </span>
            ) : (
              <span className="badge badge-secondary text-[10px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Building2 className="h-3 w-3 text-emerald-500 dark:text-emerald-400" /> Kurum Sınavı
              </span>
            )}
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{exam.institutionName}</span>
          </div>

          {/* Exam Breakdown Badges */}
          <div className="mt-4 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Soru</div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">{exam.totalQuestions}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Ders</div>
              <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{exam.subjects.length}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Okunan</div>
              <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{examResults.length}</div>
            </div>
          </div>

          {/* Progress Bar */}
          {examResults.length > 0 && (
            <div className="mt-2.5 px-3 py-2 rounded-xl bg-slate-100/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/70 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Tarama İlerlemesi:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{examResults.length} Kağıt Hazır</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(15, examResults.length * 6))}%` }}
                />
              </div>
            </div>
          )}

          {/* Scanned Student Results Drawer inside Exam Card */}
          {examResults.length > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/90 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Okunan Öğrenci Kağıtları ({examResults.length})
                </span>
                {onNavigateToResults && (
                  <button
                    type="button"
                    onClick={() => onNavigateToResults(exam.id)}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-semibold cursor-pointer underline flex items-center gap-0.5"
                  >
                    Tüm Sıralama →
                  </button>
                )}
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {examResults.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => onNavigateToResults && onNavigateToResults(exam.id)}
                    className="p-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{res.studentName}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">({res.className} - No: {res.studentNo})</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono font-bold">
                      <span className="text-emerald-600 dark:text-emerald-400">{res.totalNet} Net</span>
                      <span className="text-slate-600 dark:text-slate-300">({res.totalScore} Puan)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons: Sonuçlar + Cevap Anahtarı + ⋯ Menü */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {onNavigateToResults && (
              <button
                onClick={() => onNavigateToResults(exam.id)}
                className="btn btn-secondary text-xs py-1.5 px-2.5 flex items-center justify-center gap-1.5 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10 rounded-xl"
                title="Sınav Sonuçları ve Derece Sıralaması"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0" /> 
                <span>Sonuçlar ({examResults.length})</span>
              </button>
            )}

            {scopeFilter !== 'TRASH' && (
              <button
                type="button"
                onClick={() => setAnswerKeyModalExamId(exam.id)}
                className="btn btn-secondary text-xs py-1.5 px-2.5 flex items-center justify-center gap-1.5 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 rounded-xl cursor-pointer"
                title="Cevap anahtarını görüntüle / düzenle; sonuçları anında yeniden hesapla"
              >
                <KeyRound className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span>Cevap Anahtarı</span>
              </button>
            )}
          </div>

          {scopeFilter === 'TRASH' ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleRestoreExam(exam)}
                className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 rounded-xl cursor-pointer"
                title="Sınavı ve sonuçlarını çöp kutusundan geri yükle"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Geri Yükle
              </button>
              {canDelete && (
                <button
                  onClick={() => handleInitiateDelete(exam, true)}
                  className="btn text-xs py-1.5 px-3 flex items-center gap-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-500 dark:text-rose-400 border border-rose-500/30 rounded-xl cursor-pointer"
                  title="Sınavı kalıcı olarak sil (Geri alınamaz)"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Kalıcı Sil
                </button>
              )}
            </div>
          ) : (
            /* ⋯ İşlemler Açılır Menü (Dropdown) */
            <div className="relative exam-action-menu-container inline-block text-left">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuExamId(activeMenuExamId === exam.id ? null : exam.id);
                }}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                  activeMenuExamId === exam.id
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80'
                }`}
                title="Diğer İşlemler (Optik Bas, Oku, Cevap Anahtarı, Sil)"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {/* Açılır Menü Kutusu */}
              {activeMenuExamId === exam.id && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 bottom-full mb-1.5 sm:bottom-auto sm:top-full sm:mt-1.5 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 text-left animate-fade-in divide-y divide-slate-100 dark:divide-slate-800/80"
                >
                  <div className="p-1">
                    {onNavigateToOMR && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuExamId(null);
                          onNavigateToOMR(exam.id);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-colors cursor-pointer"
                      >
                        <Printer className="h-4 w-4 text-indigo-500 shrink-0" />
                        <span>Optik Form Bas</span>
                      </button>
                    )}

                    {onNavigateToScan && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuExamId(null);
                          onNavigateToScan();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition-colors cursor-pointer"
                      >
                        <Camera className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>Optik Oku (Kamera)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenuExamId(null);
                        setAnswerKeyModalExamId(exam.id);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 rounded-xl transition-colors cursor-pointer"
                    >
                      <KeyRound className="h-4 w-4 text-amber-500 shrink-0" />
                      <span>Cevap Anahtarını Düzenle</span>
                    </button>

                    {canEdit && onNavigateToEditExam && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuExamId(null);
                          onNavigateToEditExam(exam.id, 1);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      >
                        <Edit3 className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>Tüm Sınav Ayarlarını Düzenle</span>
                      </button>
                    )}
                  </div>

                  <div className="p-1">
                    {canDelete ? (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuExamId(null);
                          handleInitiateDelete(exam, false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 text-rose-500 shrink-0" />
                        <span>Çöp Kutusuna Gönder</span>
                      </button>
                    ) : (
                      <div className="px-3 py-2 text-[11px] text-slate-400 flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        <span>Merkezi Sınav (Silinemez)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-2 sm:px-4 py-4 space-y-6">
      {/* Header Bar */}
      <div className="glass-panel p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-500 dark:text-indigo-400 shrink-0" /> Sınavlar ve Optik Yönetimi
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isSuperAdmin
              ? 'Tüm kurumlara ait sınavları filtreleyin, kurum bazında gruplayın veya yeni merkezi sınav oluşturun.'
              : 'Sistemde tanımlı tüm sınavları görüntüleyin, optik form basımı yapın veya sonuçları inceleyin.'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          {isSuperAdmin && (
            <button
              onClick={() => setGroupByInstitution(!groupByInstitution)}
              className={`btn text-xs py-2 px-2.5 sm:px-4 font-bold flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl border transition-all ${
                groupByInstitution
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title="Sınavları kurum bazında katlanabilir kutular şeklinde gruplandırır"
            >
              <FolderKanban className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">{groupByInstitution ? 'Gruplu Görünüm' : 'Kurum Grupla'}</span>
            </button>
          )}

          {onNavigateToCalendar && (
            <button
              onClick={onNavigateToCalendar}
              className="btn text-xs py-2 px-2.5 sm:px-4 font-bold flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
              title="Sınav takvimini ve ajanda planlayıcısını açar"
            >
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500 shrink-0" />
              <span className="truncate">Sınav Takvimi</span>
            </button>
          )}

          {onNavigateToCreateExam && (
            <button
              onClick={onNavigateToCreateExam}
              className={`btn btn-primary text-xs py-2 px-2.5 sm:px-5 font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 sm:gap-2 ${
                !isSuperAdmin && !onNavigateToCalendar ? 'col-span-2 sm:w-auto' : ''
              }`}
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" /> 
              <span className="truncate">Yeni Sınav Oluştur</span>
            </button>
          )}
        </div>
      </div>

      {actionSuccessBanner && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{actionSuccessBanner}</span>
          </div>
          <button onClick={() => setActionSuccessBanner(null)} className="text-emerald-600 dark:text-emerald-400 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Control Panel: Scope Tabs + Filters */}
      <div className="glass-panel p-4 space-y-4">
        {/* Scope Tabs (Tümü / Merkezi Sınavlar / Kurum Sınavları) & View Mode */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => { setScopeFilter('ALL'); setPage(1); }}
              className={`text-xs py-1.5 px-3 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                scopeFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Tüm Sınavlar</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${scopeFilter === 'ALL' ? 'bg-indigo-500/40 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                {totalCount}
              </span>
            </button>

            <button
              onClick={() => { setScopeFilter('SYSTEM'); setPage(1); }}
              className={`text-xs py-1.5 px-3 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                scopeFilter === 'SYSTEM'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Merkezi Sınavlar</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${scopeFilter === 'SYSTEM' ? 'bg-indigo-500/40 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                {systemCount}
              </span>
            </button>

            <button
              onClick={() => { setScopeFilter('INSTITUTION'); setPage(1); }}
              className={`text-xs py-1.5 px-3 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                scopeFilter === 'INSTITUTION'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Kurum Sınavları</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${scopeFilter === 'INSTITUTION' ? 'bg-indigo-500/40 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                {instCount}
              </span>
            </button>

            <button
              onClick={() => { setScopeFilter('TRASH'); setPage(1); }}
              className={`text-xs py-1.5 px-3 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                scopeFilter === 'TRASH'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Silinen sınavları görün ve geri yükleyin"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-400" />
              <span>Çöp Kutusu</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${scopeFilter === 'TRASH' ? 'bg-rose-500/40 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                {trashCount}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <ViewModeToggle mode={viewMode} onChange={handleViewModeChange} />

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-semibold text-rose-500 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" /> Filtreleri Temizle
              </button>
            )}
          </div>
        </div>

        {/* Filter Inputs Grid: Search, Institution Dropdown, Grade Level */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              placeholder="Sınav adı, kodu veya kurum ile ara..."
              className="input-field pl-10 text-xs py-2.5 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Institution Selector (Only for Super Admin) */}
          {isSuperAdmin && (
            <div className="relative lg:col-span-4">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <select
                value={selectedInstId}
                onChange={(e) => { setSelectedInstId(e.target.value); setPage(1); }}
                className="input-field pl-9 text-xs py-2.5 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-medium cursor-pointer"
              >
                <option value="ALL">🏢 Tüm Kurumlar ({exams.length} Sınav)</option>
                <option value="SYSTEM">🛡️ Merkezi Sistem ({systemCount} Sınav)</option>
                {institutions.map(inst => {
                  const count = exams.filter(e => e.institutionId === inst.id).length;
                  return (
                    <option key={inst.id} value={inst.id}>
                      🏫 {inst.name} ({count} Sınav)
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Grade Level Selector */}
          <div className={`relative ${isSuperAdmin ? 'lg:col-span-3' : 'lg:col-span-7'}`}>
            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={selectedGradeLevel}
              onChange={(e) => { setSelectedGradeLevel(e.target.value); setPage(1); }}
              className="input-field pl-9 text-xs py-2.5 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-medium cursor-pointer"
            >
              <option value="ALL">📚 Tüm Kademeler</option>
              {gradeLevels.map(gl => (
                <option key={gl.id} value={String(gl.level)}>
                  {gl.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredExams.length === 0 ? (
        <div className="glass-panel p-12 text-center space-y-3">
          <FileText className="h-10 w-10 text-slate-400 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Hiç Sınav Bulunamadı</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Arama veya filtre kriterlerinize uygun sınav bulunmuyor.
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="btn btn-secondary text-xs py-2 px-4 inline-flex items-center gap-1.5 mt-2"
            >
              <X className="h-4 w-4" /> Filtreleri Sıfırla
            </button>
          )}
        </div>
      ) : groupByInstitution && isSuperAdmin && viewMode === 'grid' ? (
        /* ACCORDION / GROUPED VIEW BY INSTITUTION */
        <div className="space-y-4">
          {groupedExams.map((group) => {
            const isCollapsed = Boolean(collapsedGroups[group.id]);

            return (
              <div 
                key={group.id} 
                className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-4 shadow-sm"
              >
                {/* Group Header Button */}
                <button
                  type="button"
                  onClick={() => toggleGroupCollapse(group.id)}
                  className="w-full flex items-center justify-between text-left cursor-pointer group select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      group.type === 'SYSTEM' 
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' 
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {group.type === 'SYSTEM' ? <Shield className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {group.name}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {group.exams.length} adet kayıtlı sınav bulunuyor
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="badge badge-primary text-xs font-bold px-2.5 py-1">
                      {group.exams.length} Sınav
                    </span>
                    <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                    </div>
                  </div>
                </button>

                {/* Group Body: Exam Cards */}
                {!isCollapsed && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    {group.exams.map(exam => renderExamCard(exam))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : viewMode === 'list' ? (
        /* COMPACT LIST (TABLE) VIEW - FITS ON SCREEN WITHOUT HORIZONTAL SCROLL */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="uppercase bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 text-[11px]">
                <tr>
                  <th className="px-3.5 py-3">Sınav Bilgisi</th>
                  <th className="px-3 py-3 hidden md:table-cell">Kurum</th>
                  <th className="px-3 py-3 text-center hidden sm:table-cell">Kademe & Soru</th>
                  <th className="px-3 py-3 text-center">Okunan</th>
                  <th className="px-3.5 py-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedExams.map((exam) => {
                  const examResults = storageService.getResults(exam.id);
                  const canDelete = storageService.canDeleteExam(exam, activeUser);
                  const canEdit = storageService.canEditExam(exam, activeUser);
                  return (
                    <tr key={exam.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Sınav Bilgisi (Adı, Kodu, Tarihi, Dersler) */}
                      <td className="px-3.5 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="badge badge-primary text-[10px] font-mono shrink-0">{exam.examCode}</span>
                          {isSystemExam(exam) && (
                            <span className="badge bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold shrink-0">
                              MERKEZİ
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
                            <Calendar className="h-3 w-3" /> {exam.date}
                          </span>
                        </div>
                        <div className="font-display font-bold text-sm text-slate-900 dark:text-white mt-1 leading-snug">
                          {exam.title}
                        </div>
                        {/* Mobilde Kurum Adı ve Kademe burada gösterilir */}
                        <div className="flex md:hidden items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="truncate max-w-[130px] font-medium">{exam.institutionName}</span>
                          <span>•</span>
                          <span>{formatGradeLevel(exam.gradeLevel)}</span>
                        </div>
                        {exam.subjects && exam.subjects.length > 0 && (
                          <div className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate max-w-xs lg:max-w-md mt-0.5">
                            {exam.subjects.map(s => s.name).join(', ')}
                          </div>
                        )}
                      </td>

                      {/* Kurum (Masaüstü) */}
                      <td className="px-3 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200 text-xs">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px] lg:max-w-[190px]" title={exam.institutionName}>
                            {exam.institutionName}
                          </span>
                        </div>
                      </td>

                      {/* Kademe & Soru (Tablet/Masaüstü) */}
                      <td className="px-3 py-3 text-center hidden sm:table-cell whitespace-nowrap">
                        <span className="font-bold text-slate-900 dark:text-white text-xs block">
                          {formatGradeLevel(exam.gradeLevel)}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          {exam.totalQuestions} Soru • {exam.subjects.length} Ders
                        </span>
                      </td>

                      {/* Okunan Optik */}
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          examResults.length > 0
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          {examResults.length} {exam.totalExamsScanned ? `/ ${exam.totalExamsScanned}` : ''} Adet
                        </span>
                      </td>

                      {/* İşlemler: Sonuçlar + Cevap Anahtarı + ⋯ Menü */}
                      <td className="px-3.5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {onNavigateToResults && (
                            <button
                              onClick={() => onNavigateToResults(exam.id)}
                              className="btn btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10 rounded-xl cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
                              title="Sonuçlar ve Derece Sıralaması"
                            >
                              <Sparkles className="h-3.5 w-3.5 shrink-0" />
                              <span>Sonuçlar ({examResults.length})</span>
                            </button>
                          )}

                          {scopeFilter !== 'TRASH' && (
                            <button
                              type="button"
                              onClick={() => setAnswerKeyModalExamId(exam.id)}
                              className="btn btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1.5 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 rounded-xl cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
                              title="Cevap anahtarını görüntüle / düzenle; sonuçları anında yeniden hesapla"
                            >
                              <KeyRound className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                              <span>Cevap Anahtarı</span>
                            </button>
                          )}

                          {scopeFilter === 'TRASH' ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleRestoreExam(exam)}
                                className="btn btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 rounded-xl cursor-pointer whitespace-nowrap shrink-0"
                                title="Sınavı ve sonuçlarını çöp kutusundan geri yükle"
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Geri Yükle
                              </button>
                              {canDelete && (
                                <button
                                  onClick={() => handleInitiateDelete(exam, true)}
                                  className="btn text-xs py-1.5 px-2.5 flex items-center gap-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-500 dark:text-rose-400 border border-rose-500/30 rounded-xl cursor-pointer whitespace-nowrap shrink-0"
                                  title="Sınavı kalıcı olarak sil"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Kalıcı Sil
                                </button>
                              )}
                            </div>
                          ) : (
                            /* ⋯ İşlemler Açılır Menü (Dropdown) */
                            <div className="relative exam-action-menu-container inline-block text-left">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuExamId(activeMenuExamId === exam.id ? null : exam.id);
                                }}
                                className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                                  activeMenuExamId === exam.id
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80'
                                }`}
                                title="Diğer İşlemler (Optik Bas, Oku, Cevap Anahtarı, Sil)"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {/* Açılır Menü Kutusu */}
                              {activeMenuExamId === exam.id && (
                                <div 
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 text-left animate-fade-in divide-y divide-slate-100 dark:divide-slate-800/80"
                                >
                                  <div className="p-1">
                                    {onNavigateToOMR && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuExamId(null);
                                          onNavigateToOMR(exam.id);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-colors cursor-pointer"
                                      >
                                        <Printer className="h-4 w-4 text-indigo-500 shrink-0" />
                                        <span>Optik Form Bas</span>
                                      </button>
                                    )}

                                    {onNavigateToScan && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuExamId(null);
                                          onNavigateToScan();
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition-colors cursor-pointer"
                                      >
                                        <Camera className="h-4 w-4 text-emerald-500 shrink-0" />
                                        <span>Optik Oku (Kamera)</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuExamId(null);
                                        setAnswerKeyModalExamId(exam.id);
                                      }}
                                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 rounded-xl transition-colors cursor-pointer"
                                    >
                                      <KeyRound className="h-4 w-4 text-amber-500 shrink-0" />
                                      <span>Cevap Anahtarını Düzenle</span>
                                    </button>

                                    {canEdit && onNavigateToEditExam && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuExamId(null);
                                          onNavigateToEditExam(exam.id, 1);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                                      >
                                        <Edit3 className="h-4 w-4 text-slate-400 shrink-0" />
                                        <span>Tüm Sınav Ayarlarını Düzenle</span>
                                      </button>
                                    )}
                                  </div>

                                  <div className="p-1">
                                    {canDelete ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuExamId(null);
                                          handleInitiateDelete(exam, false);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                                      >
                                        <Trash2 className="h-4 w-4 text-rose-500 shrink-0" />
                                        <span>Çöp Kutusuna Gönder</span>
                                      </button>
                                    ) : (
                                      <div className="px-3 py-2 text-[11px] text-slate-400 flex items-center gap-2">
                                        <Shield className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                        <span>Merkezi Sınav (Silinemez)</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* FLAT GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedExams.map(exam => renderExamCard(exam))}
        </div>
      )}

      {/* Pagination Bar */}
      {filteredExams.length > 0 && (
        <Pagination
          currentPage={page}
          totalItems={filteredExams.length}
          pageSize={pageSize}
          pageSizeOptions={[10, 15, 25, 50, 100]}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          itemLabel="sınav"
          className="glass-panel p-4 rounded-2xl"
        />
      )}

      {/* Güvenli Silme Onay Modalı */}
      {examToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel max-w-lg w-full p-6 rounded-2xl border-rose-500/40 space-y-5 bg-white dark:bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="font-display text-lg font-bold">
                  {examToDelete.isPermanent ? 'Sınavı Kalıcı Olarak Sil' : 'Sınavı Çöp Kutusuna Gönder'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => { setExamToDelete(null); setDeleteConfirmationText(''); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-white text-base">
                  {examToDelete.exam.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Kod: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{examToDelete.exam.examCode}</strong> • {examToDelete.exam.institutionName}
                </p>
              </div>

              {examToDelete.scanCount > 0 ? (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    DİKKAT: Bu sınava ait {examToDelete.scanCount} öğrencinin okunmuş optik form sonucu bulunuyor!
                  </p>
                  <p className="text-xs">
                    {examToDelete.isPermanent
                      ? 'Bu sınav kalıcı olarak silindiğinde, öğrencilerin karneleri ve sonuçları da tamamen yok edilecek ve bir daha geri getirilemeyecektir.'
                      : 'Sınav çöp kutusuna gönderilecek. Dilediğiniz zaman Çöp Kutusu sekmesinden tüm sonuçlarıyla birlikte geri yükleyebilirsiniz.'}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {examToDelete.isPermanent
                    ? 'Bu sınav sistemden ve veritabanından kalıcı olarak silinecektir.'
                    : 'Bu sınav çöp kutusuna taşınacak. İhtiyaç halinde geri yükleyebilirsiniz.'}
                </p>
              )}

              {(examToDelete.scanCount > 0 || examToDelete.isPermanent) && (
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Silme işlemini onaylamak için aşağıdaki kutucuğa büyük harflerle <strong className="text-rose-600 dark:text-rose-400 font-mono">SİL</strong> yazın:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    placeholder="SİL"
                    className="input-field text-sm font-mono tracking-wider text-center uppercase font-bold border-rose-300 dark:border-rose-800 focus:border-rose-500"
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => { setExamToDelete(null); setDeleteConfirmationText(''); }}
                className="btn btn-secondary text-xs py-2 px-4 cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={
                  (examToDelete.scanCount > 0 || examToDelete.isPermanent) &&
                  deleteConfirmationText.trim().toUpperCase() !== 'SİL'
                }
                className="btn text-xs py-2 px-5 font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg shadow-rose-600/30 cursor-pointer transition-all"
              >
                {examToDelete.isPermanent ? 'Kalıcı Olarak Sil' : 'Çöp Kutusuna Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Answer Key Edit Modal */}
      {answerKeyModalExamId && (
        <EditAnswerKeyModal
          isOpen={Boolean(answerKeyModalExamId)}
          examId={answerKeyModalExamId}
          currentUser={currentUser}
          onClose={() => setAnswerKeyModalExamId(null)}
          onSuccess={(recalculatedCount) => {
            reloadExams();
            setActionSuccessBanner(
              recalculatedCount > 0 
                ? `Cevap anahtarı güncellendi! Okunmuş ${recalculatedCount} öğrencinin sınav sonuçları ve sıralamaları başarıyla yeniden hesaplandı.`
                : 'Cevap anahtarı başarıyla güncellendi!'
            );
            setTimeout(() => setActionSuccessBanner(null), 5000);
          }}
        />
      )}
    </div>
  );
};
