import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Plus, Calendar, Printer, Camera, Trash2, Layers, Search, 
  Sparkles, CheckCircle2, ChevronRight, ChevronDown, ChevronUp, 
  User as UserIcon, Shield, Building2, Lock, FolderKanban, Filter, X,
  GraduationCap
} from 'lucide-react';
import { Exam, User, Institution, SystemGradeLevel } from '../../types';
import { storageService } from '../../services/storageService';

interface ExamsListProps {
  currentUser?: User;
  highlightedExamId?: string;
  onNavigateToCreateExam?: () => void;
  onNavigateToOMR?: (examId: string) => void;
  onNavigateToScan?: () => void;
  onNavigateToResults?: (examId: string) => void;
}

export const ExamsList: React.FC<ExamsListProps> = ({
  currentUser,
  highlightedExamId,
  onNavigateToCreateExam,
  onNavigateToOMR,
  onNavigateToScan,
  onNavigateToResults
}) => {
  const activeUser = currentUser || storageService.getCurrentUser();
  const isSuperAdmin = activeUser.role === 'SUPER_ADMIN';

  const [exams, setExams] = useState<Exam[]>(() => {
    return storageService.getExams(isSuperAdmin ? undefined : activeUser.institutionId);
  });
  const [institutions, setInstitutions] = useState<Institution[]>(() => storageService.getInstitutions());
  const [gradeLevels, setGradeLevels] = useState<SystemGradeLevel[]>(() => storageService.getGradeLevels());

  // Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'SYSTEM' | 'INSTITUTION'>('ALL');
  const [selectedInstId, setSelectedInstId] = useState<string>('ALL');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('ALL');
  
  // Grouping & Collapse States (Default grouped for SuperAdmin to eliminate clutter)
  const [groupByInstitution, setGroupByInstitution] = useState<boolean>(isSuperAdmin);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const reloadExams = () => {
    const user = currentUser || storageService.getCurrentUser();
    setExams(storageService.getExams(user.role === 'SUPER_ADMIN' ? undefined : user.institutionId));
    setInstitutions(storageService.getInstitutions());
    setGradeLevels(storageService.getGradeLevels());
  };

  useEffect(() => {
    reloadExams();
    const handleUpdate = () => {
      reloadExams();
    };
    window.addEventListener('opticok-data-updated', handleUpdate);
    return () => window.removeEventListener('opticok-data-updated', handleUpdate);
  }, [currentUser]);

  const handleDeleteExam = (examId: string, title: string) => {
    const user = currentUser || storageService.getCurrentUser();
    const targetExam = exams.find(e => e.id === examId);
    if (targetExam && !storageService.canDeleteExam(targetExam, user)) {
      alert('Bu sınav Sistem Yöneticisi tarafından oluşturulmuş merkezi bir sınavdır. Kurumlar sistem sınavlarını silemez; sadece optik basımı yapabilir, optik okuyabilir ve sonuçlarını inceleyebilir.');
      return;
    }
    if (window.confirm(`"${title}" sınavını silmek istediğinize emin misiniz?`)) {
      const deleted = storageService.deleteExam(examId, user);
      if (deleted) {
        reloadExams();
      }
    }
  };

  const isSystemExam = (exam: Exam): boolean => {
    return exam.isSystemExam === true || exam.createdByRole === 'SUPER_ADMIN' || exam.institutionId === 'ALL' || exam.institutionId === 'SYSTEM';
  };

  // Counts for Scope Tabs
  const totalCount = exams.length;
  const systemCount = exams.filter(isSystemExam).length;
  const instCount = exams.filter(e => !isSystemExam(e)).length;

  // Filtered Exams
  const filteredExams = useMemo(() => {
    return exams.filter(e => {
      // 1. Search filter
      const matchesSearch = 
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.examCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.institutionName && e.institutionName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.gradeLevel && String(e.gradeLevel).toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // 2. Scope filter (Tümü / Merkezi / Kurum)
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

  const hasActiveFilters = searchTerm !== '' || scopeFilter !== 'ALL' || selectedInstId !== 'ALL' || selectedGradeLevel !== 'ALL';

  const clearFilters = () => {
    setSearchTerm('');
    setScopeFilter('ALL');
    setSelectedInstId('ALL');
    setSelectedGradeLevel('ALL');
  };

  // Render Single Exam Card
  const renderExamCard = (exam: Exam) => {
    const examResults = storageService.getResults(exam.id);
    const isHighlighted = exam.id === highlightedExamId;
    const isSys = isSystemExam(exam);
    const canDelete = storageService.canDeleteExam(exam, activeUser);

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

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {onNavigateToResults && (
              <button
                onClick={() => onNavigateToResults(exam.id)}
                className="btn btn-secondary text-xs py-1.5 px-2.5 sm:px-3 flex items-center justify-center gap-1.5 text-amber-500 dark:text-amber-400 border-amber-500/30 flex-1 sm:flex-initial rounded-xl"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0" /> 
                <span>Sonuçlar ({examResults.length})</span>
              </button>
            )}

            {onNavigateToOMR && (
              <button
                onClick={() => onNavigateToOMR(exam.id)}
                className="btn btn-primary text-xs py-1.5 px-2.5 sm:px-3 flex items-center justify-center gap-1.5 flex-1 sm:flex-initial rounded-xl"
              >
                <Printer className="h-3.5 w-3.5 shrink-0" /> 
                <span>Optik Üret</span>
              </button>
            )}

            {onNavigateToScan && (
              <button
                onClick={onNavigateToScan}
                className="btn btn-secondary text-xs py-1.5 px-2.5 sm:px-3 flex items-center justify-center gap-1.5 text-emerald-500 dark:text-emerald-400 border-emerald-500/30 flex-1 sm:flex-initial rounded-xl"
              >
                <Camera className="h-3.5 w-3.5 shrink-0" /> 
                <span>Optik Oku</span>
              </button>
            )}
          </div>

          {canDelete ? (
            <button
              onClick={() => handleDeleteExam(exam.id, exam.title)}
              className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer shrink-0 ml-auto sm:ml-0"
              title="Sınavı Sil"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : (
            <div
              className="p-1.5 px-2.5 text-slate-400 bg-slate-100 dark:bg-slate-900/80 rounded-xl shrink-0 ml-auto sm:ml-0 flex items-center gap-1.5 text-[11px] border border-slate-200 dark:border-slate-800"
              title="Bu sınav Sistem Yöneticisi tarafından oluşturulmuştur. Kurumlar sistem sınavlarını silemez; sadece optik basabilir, okuyabilir ve sonuçlarını görebilir."
            >
              <Shield className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Merkezi Sınav (Korumalı)</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-2 sm:px-4 py-4 space-y-6">
      {/* Header Bar */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-500 dark:text-indigo-400" /> Sınavlar ve Optik Yönetimi
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isSuperAdmin
              ? 'Tüm kurumlara ait sınavları filtreleyin, kurum bazında gruplayın veya yeni merkezi sınav oluşturun.'
              : 'Sistemde tanımlı tüm sınavları görüntüleyin, optik form basımı yapın veya sonuçları inceleyin.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <button
              onClick={() => setGroupByInstitution(!groupByInstitution)}
              className={`btn text-xs py-2.5 px-4 font-bold flex items-center gap-2 rounded-xl border transition-all ${
                groupByInstitution
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title="Sınavları kurum bazında katlanabilir kutular şeklinde gruplandırır"
            >
              <FolderKanban className="h-4 w-4" />
              <span>{groupByInstitution ? 'Gruplu Görünüm (Açık)' : 'Kurumlara Göre Grupla'}</span>
            </button>
          )}

          {onNavigateToCreateExam && (
            <button
              onClick={onNavigateToCreateExam}
              className="btn btn-primary text-xs py-2.5 px-5 font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 shrink-0"
            >
              <Plus className="h-4 w-4" /> Yeni Sınav Oluştur
            </button>
          )}
        </div>
      </div>

      {/* Control Panel: Scope Tabs + Filters */}
      <div className="glass-panel p-4 space-y-4">
        {/* Scope Tabs (Tümü / Merkezi Sınavlar / Kurum Sınavları) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setScopeFilter('ALL')}
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
              onClick={() => setScopeFilter('SYSTEM')}
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
              onClick={() => setScopeFilter('INSTITUTION')}
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
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-rose-500 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" /> Filtreleri Temizle
            </button>
          )}
        </div>

        {/* Filter Inputs Grid: Search, Institution Dropdown, Grade Level */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Sınav adı, kodu veya kurum ile ara..."
              className="input-field pl-10 text-xs py-2.5 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
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
                onChange={(e) => setSelectedInstId(e.target.value)}
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
              onChange={(e) => setSelectedGradeLevel(e.target.value)}
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
      ) : groupByInstitution && isSuperAdmin ? (
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
      ) : (
        /* FLAT GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExams.map(exam => renderExamCard(exam))}
        </div>
      )}
    </div>
  );
};
