import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Trophy,
  Download,
  Search,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  MinusCircle,
  FileText,
  Eye,
  X,
  FileSpreadsheet,
  Layers,
  GraduationCap,
  Check,
  Target,
  AlertTriangle,
  Sparkles,
  MessageSquare,
  Share2,
  Copy,
  Percent,
  BookOpen
} from 'lucide-react';
import { storageService, syncWithServer } from '../../services/storageService';
import { Exam, ScanResult } from '../../types';
import { examExportService, ExportType, ExportFormat } from '../../services/examExportService';
import { computeOutcomeAnalyses } from '../../services/omrEngine';
import { StudentReportCardCharts } from './StudentReportCardCharts';
import { StudentCumulativeReport } from './StudentCumulativeReport';
import {
  calculateStudentRankings,
  calculateQuestionAnalytics,
  calculateAggregateOutcomes,
  QuestionStat,
  AggregateOutcomeStat
} from '../../services/analyticsService';

interface ExamResultsListProps {
  initialExamId?: string;
}

export const ExamResultsList: React.FC<ExamResultsListProps> = ({ initialExamId }) => {
  const currentUser = storageService.getCurrentUser();
  const instId = currentUser?.role === 'SUPER_ADMIN' ? undefined : currentUser?.institutionId;

  const exams = storageService.getExams(instId);

  const [selectedExamId, setSelectedExamId] = useState<string>(() => {
    if (initialExamId && exams.some(e => e.id === initialExamId)) {
      return initialExamId;
    }
    return exams.length > 0 ? exams[0].id : '';
  });

  const [activeTab, setActiveTab] = useState<'leaderboard' | 'question_analysis' | 'outcomes_report' | 'cumulative_report'>('leaderboard');
  const [cumulativeStudentId, setCumulativeStudentId] = useState<string | undefined>(undefined);
  const [analysisClassFilter, setAnalysisClassFilter] = useState<string>('ALL');
  const [copiedResultId, setCopiedResultId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentResult, setSelectedStudentResult] = useState<ScanResult | null>(null);

  // Export Modal States
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<ExportType>('INSTITUTION_RANKING');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('PDF');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('ALL');
  const [isExporting, setIsExporting] = useState(false);

  const [syncTick, setSyncTick] = useState(0);

  useEffect(() => {
    if (initialExamId && exams.some(e => e.id === initialExamId)) {
      setSelectedExamId(initialExamId);
    }
  }, [initialExamId]);

  useEffect(() => {
    syncWithServer();
    const handleSync = () => {
      setSyncTick(t => t + 1);
    };
    window.addEventListener('opticok-data-updated', handleSync);
    return () => window.removeEventListener('opticok-data-updated', handleSync);
  }, []);

  const selectedExam = exams.find(e => e.id === selectedExamId);
  const rawResults = useMemo(() => {
    return storageService.getResults(selectedExamId, instId);
  }, [selectedExamId, instId, syncTick]);

  // Rankings and percentiles for every student
  const rankingMap = useMemo(() => calculateStudentRankings(rawResults), [rawResults]);

  // Unique classes for filtering
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    rawResults.forEach(r => { if (r.className) set.add(r.className); });
    return Array.from(set).sort();
  }, [rawResults]);

  // Question item analytics
  const questionStats = useMemo(() => {
    if (!selectedExam || rawResults.length === 0) return [];
    return calculateQuestionAnalytics(selectedExam, rawResults, analysisClassFilter);
  }, [selectedExam, rawResults, analysisClassFilter]);

  // Aggregate outcomes analytics
  const aggregateOutcomes = useMemo(() => {
    if (!selectedExam || rawResults.length === 0) return [];
    return calculateAggregateOutcomes(selectedExam, rawResults, analysisClassFilter);
  }, [selectedExam, rawResults, analysisClassFilter]);

  // Sort results by totalScore descending to create Ranked Leaderboard
  const rankedResults = [...rawResults].sort((a, b) => b.totalScore - a.totalScore);

  const filteredResults = rankedResults.filter(r =>
    r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.studentNo.includes(searchTerm)
  );

  // WhatsApp Message Composer
  const buildWhatsAppMessage = (res: ScanResult) => {
    const rankInfo = rankingMap.get(res.id);
    const outcomes = res.outcomeAnalyses && res.outcomeAnalyses.length > 0
      ? res.outcomeAnalyses
      : (selectedExam ? computeOutcomeAnalyses(selectedExam, res.answers) : []);
    const weakOutcomes = outcomes.filter(o => o.status === 'DANGER' || o.status === 'WARNING');

    let msg = `*Sayın Velimiz,*\n`;
    msg += `Öğrencimiz *${res.studentName}* (No: ${res.studentNo}, Sınıf: ${res.className}), *${res.examTitle}* sonuç raporu:\n\n`;
    msg += `📊 *GENEL BAŞARI DURUMU*\n`;
    msg += `• Toplam Puan: *${res.totalScore.toFixed(1)}* (500 üzerinden)\n`;
    msg += `• Toplam Net: *${res.totalNet}* Net (Doğru: ${res.totalCorrect}, Yanlış: ${res.totalWrong}, Boş: ${res.totalEmpty})\n`;
    if (rankInfo) {
      msg += `• Sınıf Derecesi: *${rankInfo.classRank} / ${rankInfo.classTotal}*\n`;
      msg += `• Kurum Sıralaması: *${rankInfo.institutionRank} / ${rankInfo.institutionTotal}* (%${rankInfo.percentile} Dilim)\n`;
    }
    if (res.bookletType) {
      msg += `• Kitapçık Türü: *${res.bookletType}*\n`;
    }
    msg += `\n📚 *DERS BAZLI NETLER*\n`;
    res.subjectResults.forEach(sr => {
      msg += `• ${sr.subjectName}: *${sr.netCount} Net* (${sr.correctCount}D, ${sr.wrongCount}Y, ${sr.emptyCount}B)\n`;
    });

    if (weakOutcomes.length > 0) {
      msg += `\n🎯 *EKSİK / TEKRAR EDİLMESİ GEREKEN KAZANIMLAR*\n`;
      weakOutcomes.slice(0, 5).forEach(wo => {
        msg += `• ${wo.subjectName} - ${wo.outcome} (%${wo.successRate} Başarı)\n`;
      });
    }

    msg += `\nÖğrencimizi tebrik eder, başarılarının devamını dileriz.\n`;
    msg += `_Opteno Sınav Değerlendirme Sistemi_`;
    return msg;
  };

  const handleShareWhatsApp = (res: ScanResult) => {
    const text = buildWhatsAppMessage(res);
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleCopyKarneText = (res: ScanResult) => {
    const text = buildWhatsAppMessage(res);
    navigator.clipboard.writeText(text);
    setCopiedResultId(res.id);
    setTimeout(() => setCopiedResultId(null), 2500);
  };

  return (
    <div className="mx-auto max-w-6xl px-2 sm:px-4 py-4 space-y-6">
      <div className="glass-panel p-4 sm:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-500 dark:text-amber-400" /> Sınav Sonuçları & Derece Listesi
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Okunan optik form puanları, net analizi ve derece sıralaması</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="input-field text-xs py-2 w-60 font-semibold text-indigo-600 dark:text-indigo-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            >
              {exams.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.title} ({ex.examCode})</option>
              ))}
            </select>

            {selectedExam && rawResults.length > 0 && (
              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="btn btn-primary text-xs py-2 px-4 font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white"
              >
                <Download className="h-4 w-4" /> Sonuçları İndir
              </button>
            )}
          </div>
        </div>

        {!selectedExam ? (
          <p className="text-slate-500 dark:text-slate-400 italic text-center py-8 text-xs">Lütfen sonuçlarını incelemek istediğiniz sınavı seçin.</p>
        ) : (
          <div className="space-y-6">
            {/* Exam Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4 rounded-xl border border-indigo-500/20 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-900/10 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 mb-1">Katılım / Okunan</p>
                <p className="text-2xl font-display font-extrabold text-slate-900 dark:text-white">{rawResults.length} Öğrenci</p>
              </div>
              <div className="glass-card p-4 rounded-xl border border-emerald-500/20 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 mb-1">Ortalama Puan</p>
                <p className="text-2xl font-display font-extrabold text-emerald-600 dark:text-emerald-400">
                  {rawResults.length > 0 ? (rawResults.reduce((s, r) => s + r.totalScore, 0) / rawResults.length).toFixed(1) : 0}
                </p>
              </div>
              <div className="glass-card p-4 rounded-xl border border-amber-500/20 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 mb-1">Ortalama Net</p>
                <p className="text-2xl font-display font-extrabold text-amber-600 dark:text-amber-400">
                  {rawResults.length > 0 ? (rawResults.reduce((s, r) => s + r.totalNet, 0) / rawResults.length).toFixed(2) : 0}
                </p>
              </div>
              <div className="glass-card p-4 rounded-xl border border-fuchsia-500/20 dark:border-fuchsia-500/30 bg-fuchsia-50/50 dark:bg-fuchsia-900/10 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 mb-1">Net Kuralı</p>
                <p className="text-base font-display font-bold text-fuchsia-600 dark:text-fuchsia-300 mt-1">
                  {selectedExam.netPenaltyRatio ? `${selectedExam.netPenaltyRatio} Y = 1 D` : 'Yanlış Götürmez'}
                </p>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('leaderboard')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'leaderboard'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Trophy className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" /> Derece Sıralaması
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('question_analysis')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'question_analysis'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" /> Soru & Çeldirici Analizi
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('outcomes_report')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'outcomes_report'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Target className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> Sınıf & Kurum Kazanım Raporu
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('cumulative_report')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'cumulative_report'
                      ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <GraduationCap className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-400" /> Öğrenci Gelişim & Çoklu Karne
                </button>
              </div>

              {/* Class Filter Selector (For Question & Outcome Analysis) */}
              {(activeTab === 'question_analysis' || activeTab === 'outcomes_report') && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">Sınıf Filtresi:</span>
                  <select
                    value={analysisClassFilter}
                    onChange={(e) => setAnalysisClassFilter(e.target.value)}
                    className="input-field text-xs py-1 px-3 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 font-semibold border border-slate-200 dark:border-slate-700"
                  >
                    <option value="ALL">Tüm Sınıflar / Genel Kurum</option>
                    {availableClasses.map(cls => (
                      <option key={cls} value={cls}>{cls} Sınıfı</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* TAB 1: LEADERBOARD & RANKINGS */}
            {activeTab === 'leaderboard' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Derece ve Başarı Sıralaması</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Öğrenci veya Sınıf Ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-field pl-9 text-xs py-1.5 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Executive Summary Cards */}
                {filteredResults.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                      <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-semibold block uppercase tracking-wider">Mevcut Katılım</span>
                      <span className="text-lg font-bold text-slate-900 dark:text-white">{filteredResults.length} Öğrenci</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                      <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-semibold block uppercase tracking-wider">Ortalama Net</span>
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {(filteredResults.reduce((acc, r) => acc + r.totalNet, 0) / filteredResults.length).toFixed(2)} Net
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                      <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-semibold block uppercase tracking-wider">Ortalama Puan</span>
                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        {(filteredResults.reduce((acc, r) => acc + r.totalScore, 0) / filteredResults.length).toFixed(1)} Puan
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                      <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-semibold block uppercase tracking-wider">En Yüksek Puan</span>
                      <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                        {Math.max(...filteredResults.map(r => r.totalScore)).toFixed(1)} Puan
                      </span>
                    </div>
                  </div>
                )}

                {/* Leaderboard Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left text-xs whitespace-nowrap text-slate-700 dark:text-slate-300">
                    <thead className="uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-3 py-3 text-center w-12">Kurum Sıra</th>
                        <th className="px-4 py-3">Öğrenci Bilgisi</th>
                        <th className="px-3 py-3 text-center">Sınıf & Derece</th>
                        {selectedExam.subjects.map(s => (
                          <th key={s.id} className="px-3 py-3 text-center border-l border-slate-200 dark:border-slate-700/50">
                            {s.name} <br/><span className="text-[9px] font-normal">({s.questionCount} Soru)</span>
                          </th>
                        ))}
                        <th className="px-3 py-3 text-center border-l border-slate-200 dark:border-slate-700/50 text-indigo-600 dark:text-indigo-300">Top. Net</th>
                        <th className="px-3 py-3 text-right text-emerald-600 dark:text-emerald-400">Puan</th>
                        <th className="px-3 py-3 text-center">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                      {filteredResults.map((res, index) => {
                        const rankInfo = rankingMap.get(res.id);
                        const instRank = rankInfo ? rankInfo.institutionRank : index + 1;
                        return (
                          <tr
                            key={res.id}
                            className="hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                            onClick={() => setSelectedStudentResult(res)}
                          >
                            <td className="px-3 py-3 text-center font-display font-bold">
                              {instRank === 1 ? <span className="text-amber-500 dark:text-amber-400">🥇 1</span> :
                               instRank === 2 ? <span className="text-slate-600 dark:text-slate-300">🥈 2</span> :
                               instRank === 3 ? <span className="text-amber-700">🥉 3</span> : instRank}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-slate-900 dark:text-white text-sm">{res.studentName}</p>
                                {res.bookletType && (
                                  <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                                    res.bookletType === 'A' ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300' : 'bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-300'
                                  }`}>
                                    {res.bookletType}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">No: {res.studentNo}</p>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="badge badge-primary">{res.className}</span>
                              {rankInfo && (
                                <p className="text-[9.5px] text-slate-400 mt-0.5">
                                  {rankInfo.classRank}/{rankInfo.classTotal} • %{rankInfo.percentile}
                                </p>
                              )}
                            </td>

                            {/* Dynamic Subject Net Columns */}
                            {selectedExam.subjects.map(s => {
                              const subRes = res.subjectResults.find(sr => sr.subjectName === s.name);
                              return (
                                <td key={s.id} className="px-3 py-3 text-center border-l border-slate-200 dark:border-slate-700/50">
                                  {subRes ? (
                                    <div>
                                      <span className="font-bold text-slate-800 dark:text-slate-200">{subRes.netCount}</span>
                                      <div className="flex justify-center gap-1 text-[9px] mt-0.5">
                                        <span className="text-emerald-600 dark:text-emerald-400">{subRes.correctCount}D</span>
                                        <span className="text-rose-600 dark:text-rose-400">{subRes.wrongCount}Y</span>
                                      </div>
                                    </div>
                                  ) : '-'}
                                </td>
                              );
                            })}

                            <td className="px-3 py-3 text-center border-l border-slate-200 dark:border-slate-700/50 font-display font-bold text-indigo-600 dark:text-indigo-300 text-sm">
                              {res.totalNet}
                            </td>
                            <td className="px-3 py-3 text-right font-display font-extrabold text-emerald-600 dark:text-emerald-400 text-base">
                              {res.totalScore.toFixed(1)}
                            </td>
                            <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedStudentResult(res)}
                                  className="btn btn-secondary py-1 px-2 text-[11px] flex items-center gap-1 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50"
                                  title="Karneyi İncele"
                                >
                                  <Eye className="h-3.5 w-3.5" /> İncele
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleShareWhatsApp(res)}
                                  className="p-1.5 rounded-lg bg-emerald-600/10 dark:bg-emerald-600/20 hover:bg-emerald-600/20 dark:hover:bg-emerald-600/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 dark:border-emerald-500/40 transition-colors"
                                  title="WhatsApp ile Veliye Gönder"
                                >
                                  <MessageSquare className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredResults.length === 0 && (
                        <tr>
                          <td colSpan={7 + selectedExam.subjects.length} className="px-4 py-12 text-center text-slate-500 italic">
                            Bu sınava ait henüz okunmuş optik form bulunamadı.
                          </td>
                        </tr>
                      )}
                    </tbody>

                    {filteredResults.length > 0 && (
                      <tfoot className="bg-slate-100 dark:bg-slate-900/90 font-bold border-t-2 border-indigo-500/40 text-slate-800 dark:text-slate-100">
                        <tr>
                          <td className="px-3 py-3 text-center text-indigo-600 dark:text-indigo-400">ORT.</td>
                          <td className="px-4 py-3">
                            <span className="font-extrabold text-slate-900 dark:text-white text-xs">GENEL ORTALAMA</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-normal">{filteredResults.length} Öğrenci Ortalaması</span>
                          </td>
                          <td className="px-3 py-3 text-center text-slate-400">-</td>
                          {selectedExam.subjects.map(s => {
                            const sumNet = filteredResults.reduce((acc, r) => {
                              const sub = r.subjectResults.find(sr => sr.subjectName === s.name);
                              return acc + (sub ? sub.netCount : 0);
                            }, 0);
                            const avgNet = (sumNet / filteredResults.length).toFixed(2);
                            return (
                              <td key={s.id} className="px-3 py-3 text-center border-l border-slate-200 dark:border-slate-700/50 text-indigo-600 dark:text-indigo-300 font-mono text-xs">
                                {avgNet}
                              </td>
                            );
                          })}
                          <td className="px-3 py-3 text-center border-l border-slate-200 dark:border-slate-700/50 text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                            {(filteredResults.reduce((acc, r) => acc + r.totalNet, 0) / filteredResults.length).toFixed(2)}
                          </td>
                          <td className="px-3 py-3 text-right text-indigo-600 dark:text-indigo-400 font-mono text-sm">
                            {(filteredResults.reduce((acc, r) => acc + r.totalScore, 0) / filteredResults.length).toFixed(1)}
                          </td>
                          <td className="px-3 py-3 text-center">-</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: QUESTION & DISTRACTOR ITEM ANALYSIS (MADDE GÜÇLÜĞÜ) */}
            {activeTab === 'question_analysis' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-indigo-400" /> Soru & Çeldirici Analizi (Madde Güçlüğü)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Her sorunun doğru çözülme oranı, şık dağılımları ve öğrencileri en çok yanıltan çeldiriciler
                    </p>
                  </div>
                  <span className="badge badge-indigo text-xs">
                    {questionStats.length} Soru Analiz Edildi
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/60">
                  <table className="w-full text-left text-xs whitespace-nowrap text-slate-300">
                    <thead className="uppercase bg-slate-800 text-slate-400 font-bold">
                      <tr>
                        <th className="px-3 py-3">Ders</th>
                        <th className="px-3 py-3 text-center">Soru No</th>
                        <th className="px-3 py-3 text-center">Doğru Cevap</th>
                        <th className="px-4 py-3">Kazanım / Konu</th>
                        <th className="px-3 py-3 text-center">Madde Güçlüğü</th>
                        <th className="px-4 py-3">Başarı Oranı (D / Y / B)</th>
                        <th className="px-4 py-3 text-center">Şık Dağılımı (A - B - C - D - E)</th>
                        <th className="px-3 py-3 text-center">En Güçlü Çeldirici</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {questionStats.map((qs, qIdx) => (
                        <tr key={qIdx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-3 py-3 font-bold text-white text-[11.5px]">{qs.subjectName}</td>
                          <td className="px-3 py-3 text-center font-bold text-indigo-300">Soru {qs.questionNumber}</td>
                          <td className="px-3 py-3 text-center">
                            <span className="px-2 py-0.5 rounded font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40">
                              {qs.correctAnswer}
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-xs truncate text-slate-200" title={qs.learningOutcome || ''}>
                            {qs.learningOutcome || <span className="text-slate-500 italic">Belirtilmedi</span>}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {qs.difficultyLevel === 'EASY' && (
                              <span className="badge badge-success text-[10px]">🟢 Kolay (%{qs.correctRate})</span>
                            )}
                            {qs.difficultyLevel === 'MEDIUM' && (
                              <span className="badge badge-warning text-[10px]">🟡 Orta (%{qs.correctRate})</span>
                            )}
                            {qs.difficultyLevel === 'HARD' && (
                              <span className="badge badge-danger text-[10px]">🔴 Zor (%{qs.correctRate})</span>
                            )}
                          </td>
                          <td className="px-4 py-3 min-w-[170px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden flex">
                                <div className="bg-emerald-500 h-full" style={{ width: `${qs.correctRate}%` }} title={`Doğru: %${qs.correctRate}`} />
                                <div className="bg-rose-500 h-full" style={{ width: `${Math.round((qs.wrongCount / Math.max(1, qs.totalStudents)) * 100)}%` }} title="Yanlış" />
                              </div>
                              <span className="text-[10px] font-mono whitespace-nowrap text-slate-300">
                                <strong className="text-emerald-400">%{qs.correctRate}</strong> D
                              </span>
                            </div>
                            <div className="flex gap-2 text-[9.5px] text-slate-400 mt-0.5">
                              <span>{qs.correctCount} Doğru</span>
                              <span>•</span>
                              <span>{qs.wrongCount} Yanlış</span>
                              <span>•</span>
                              <span>{qs.emptyCount} Boş</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1 font-mono text-[10px]">
                              {['A', 'B', 'C', 'D', 'E'].map(opt => {
                                const isCorrect = opt === qs.correctAnswer;
                                const isDistractor = qs.primaryDistractor?.option === opt;
                                const pct = qs.optionPercentages[opt] || 0;
                                return (
                                  <span
                                    key={opt}
                                    className={`px-1.5 py-0.5 rounded border text-[9.5px] ${
                                      isCorrect
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                                        : isDistractor && pct > 10
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                                        : 'bg-slate-950 text-slate-400 border-slate-800'
                                    }`}
                                    title={`${opt} Şıkkı: %${pct}`}
                                  >
                                    {opt}:%{pct}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            {qs.primaryDistractor ? (
                              <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                                <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                                {qs.primaryDistractor.option} (%{qs.primaryDistractor.percentage})
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px]">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: AGGREGATE OUTCOMES REPORT (ORTAK EKSİK KAZANIMLAR) */}
            {activeTab === 'outcomes_report' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                      <Target className="h-4 w-4 text-emerald-400" /> Sınıf & Kurum Genel Kazanım Raporu
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Sınavdaki tüm konuların kavranma düzeyleri ve telafi/etüt dersi önerilen ortak eksikler
                    </p>
                  </div>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Tam Kavranan Konular (%75+)</span>
                      <span className="text-xl font-bold text-emerald-400">
                        {aggregateOutcomes.filter(o => o.status === 'SUCCESS').length} Kazanım
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Pekiştirilmeli (%50 - %74)</span>
                      <span className="text-xl font-bold text-amber-400">
                        {aggregateOutcomes.filter(o => o.status === 'WARNING').length} Kazanım
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Kritik / Telafi Gerekli (&lt;%50)</span>
                      <span className="text-xl font-bold text-rose-400">
                        {aggregateOutcomes.filter(o => o.status === 'DANGER').length} Kazanım
                      </span>
                    </div>
                  </div>
                </div>

                {/* Aggregate Outcomes Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/60">
                  <table className="w-full text-left text-xs whitespace-nowrap text-slate-300">
                    <thead className="uppercase bg-slate-800 text-slate-400 font-bold">
                      <tr>
                        <th className="px-4 py-3">Ders Adı</th>
                        <th className="px-4 py-3">Kazanım / Konu</th>
                        <th className="px-3 py-3 text-center">İlgili Soru(lar)</th>
                        <th className="px-3 py-3 text-center">Toplam Cevap (D / Y / B)</th>
                        <th className="px-4 py-3">Kurum Başarı Yüzdesi</th>
                        <th className="px-4 py-3 text-center">Değerlendirme & Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {aggregateOutcomes.map((ao, aoIdx) => (
                        <tr key={aoIdx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-bold text-white text-[11.5px]">{ao.subjectName}</td>
                          <td className="px-4 py-3 font-semibold text-slate-200 text-xs">{ao.outcome}</td>
                          <td className="px-3 py-3 text-center text-indigo-300 font-mono">
                            {ao.questionNumbers.map(n => `S${n}`).join(', ')}
                          </td>
                          <td className="px-3 py-3 text-center font-mono text-[11px]">
                            <span className="text-emerald-400 font-bold">{ao.correctCount}D</span>
                            {' / '}
                            <span className="text-rose-400 font-bold">{ao.wrongCount}Y</span>
                            {' / '}
                            <span className="text-slate-400">{ao.emptyCount}B</span>
                          </td>
                          <td className="px-4 py-3 min-w-[180px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    ao.status === 'SUCCESS' ? 'bg-emerald-500' :
                                    ao.status === 'WARNING' ? 'bg-amber-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${ao.successRate}%` }}
                                />
                              </div>
                              <span className="font-bold font-mono text-xs text-white">%{ao.successRate}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {ao.status === 'SUCCESS' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Tam Kavrandı
                              </span>
                            )}
                            {ao.status === 'WARNING' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                <AlertTriangle className="h-3 w-3 text-amber-400" /> Pekiştirilmeli
                              </span>
                            )}
                            {ao.status === 'DANGER' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                <XCircle className="h-3 w-3 text-rose-400" /> ⚠️ Telafi Dersi Gerekli
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {aggregateOutcomes.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic">
                            Bu sınavda kazanım tanımlanmamıştır. (Sınav kazanımsız olarak değerlendirilmiştir)
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: STUDENT CUMULATIVE & MULTI-EXAM REPORT */}
            {activeTab === 'cumulative_report' && (
              <StudentCumulativeReport
                initialStudentId={cumulativeStudentId}
                onOpenSingleReportCard={(result) => setSelectedStudentResult(result)}
              />
            )}

          </div>
        )}
      </div>

      {/* Student Scorecard Modal (Karne Modal) */}
      {selectedStudentResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel max-w-2xl w-full p-6 rounded-2xl border-indigo-500/40 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="badge badge-indigo text-[10px]">{selectedStudentResult.examTitle}</span>
                <h3 className="font-display text-xl font-bold text-white mt-1">
                  {selectedStudentResult.studentName}
                </h3>
                <p className="text-xs text-slate-400">
                  Okul No: <strong className="text-indigo-300">{selectedStudentResult.studentNo}</strong> | Sınıf: {selectedStudentResult.className}
                </p>
              </div>

              <button
                onClick={() => setSelectedStudentResult(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Total Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Toplam Doğru</div>
                <div className="text-lg font-bold text-emerald-400">{selectedStudentResult.totalCorrect}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Toplam Yanlış</div>
                <div className="text-lg font-bold text-rose-400">{selectedStudentResult.totalWrong}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Toplam Net</div>
                <div className="text-lg font-bold text-amber-400">{selectedStudentResult.totalNet}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Puan (500)</div>
                <div className="text-lg font-bold text-indigo-400">{selectedStudentResult.totalScore}</div>
              </div>
            </div>

            {/* Rank, Class Rank and Percentile Banner */}
            {(() => {
              const rankInfo = rankingMap.get(selectedStudentResult.id);
              if (!rankInfo) return null;
              return (
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-purple-950/70 border border-indigo-500/30 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Sınıf Derecesi</span>
                    <span className="font-bold text-amber-400 text-sm">{rankInfo.classRank} / {rankInfo.classTotal}</span>
                  </div>
                  <div className="border-x border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">Kurum Sıralaması</span>
                    <span className="font-bold text-indigo-300 text-sm">{rankInfo.institutionRank} / {rankInfo.institutionTotal}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Yüzdelik Dilim</span>
                    <span className="font-bold text-emerald-400 text-sm">%{rankInfo.percentile}</span>
                  </div>
                </div>
              );
            })()}

            {/* View Multi-Exam Cumulative Report for this student */}
            <button
              type="button"
              onClick={() => {
                setCumulativeStudentId(selectedStudentResult.studentId);
                setActiveTab('cumulative_report');
                setSelectedStudentResult(null);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-900/60 to-fuchsia-900/60 hover:from-indigo-800/80 hover:to-fuchsia-800/80 border border-indigo-500/40 text-white font-bold text-xs flex items-center justify-between transition-all shadow-sm cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>Bu Öğrencinin Tüm Deneme Geçmişi & Çoklu Gelişim Karnesi</span>
              </div>
              <ChevronRight className="h-4 w-4 text-indigo-300 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Visual Charts & Comparison Component */}
            {selectedExam && (
              <StudentReportCardCharts
                studentResult={selectedStudentResult}
                allResults={rawResults}
                exam={selectedExam}
              />
            )}

            {/* Subject Net Breakdown Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-indigo-300">Ders Bazlı Başarı Analizi</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Ders Adı</th>
                      <th className="p-2.5 text-center">Doğru</th>
                      <th className="p-2.5 text-center">Yanlış</th>
                      <th className="p-2.5 text-center">Boş</th>
                      <th className="p-2.5 text-center font-bold text-white">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {selectedStudentResult.subjectResults.map((sbj, sIdx) => (
                      <tr key={sIdx}>
                        <td className="p-2.5 font-bold text-slate-200">{sbj.subjectName}</td>
                        <td className="p-2.5 text-center font-bold text-emerald-400">{sbj.correctCount}</td>
                        <td className="p-2.5 text-center font-bold text-rose-400">{sbj.wrongCount}</td>
                        <td className="p-2.5 text-center text-slate-400">{sbj.emptyCount}</td>
                        <td className="p-2.5 text-center font-bold text-indigo-300">{sbj.netCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Outcome / Learning Objective Analysis Section */}
            {(() => {
              const outcomes = selectedStudentResult.outcomeAnalyses && selectedStudentResult.outcomeAnalyses.length > 0
                ? selectedStudentResult.outcomeAnalyses
                : (selectedExam ? computeOutcomeAnalyses(selectedExam, selectedStudentResult.answers) : []);

              if (outcomes.length === 0) return null;

              const weakOutcomes = outcomes.filter(o => o.status === 'DANGER' || o.status === 'WARNING');

              return (
                <div className="space-y-3 pt-1">
                  {/* Smart Guidance / Study Recommendations Banner */}
                  {weakOutcomes.length > 0 ? (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                        <span>🎯 Öncelikli Tekrar Edilmesi & Pekiştirilmesi Gereken Konular</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Öğrencinin bu sınavda hata yaptığı veya boş bıraktığı kazanımlar tespit edildi. Aşağıdaki konularda etüt ve konu tekrarı önerilir:
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {weakOutcomes.map((wo, wIdx) => (
                          <span
                            key={wIdx}
                            className={`px-2 py-0.5 rounded-md text-[10.5px] font-semibold border ${
                              wo.status === 'DANGER'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            {wo.subjectName}: <strong>{wo.outcome}</strong> (%{wo.successRate} Başarı)
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
                      <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span><strong>Tebrikler!</strong> Öğrenci sınavdaki tüm kazanımlarda %80 ve üzeri kavrama düzeyine ulaştı.</span>
                    </div>
                  )}

                  {/* Outcomes Breakdown Table */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-indigo-400" /> Kazanım / Konu Bazlı Başarı Analizi
                      </h4>
                      <span className="text-[10px] text-slate-400">{outcomes.length} Kazanım Değerlendirildi</span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 max-h-56 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800 sticky top-0">
                          <tr>
                            <th className="p-2.5">Ders</th>
                            <th className="p-2.5">Kazanım / Konu</th>
                            <th className="p-2.5 text-center">Soru</th>
                            <th className="p-2.5 text-center">D / Y / B</th>
                            <th className="p-2.5 text-center">Başarı %</th>
                            <th className="p-2.5 text-center">Durum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {outcomes.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                              <td className="p-2.5 font-bold text-slate-300 text-[11px] whitespace-nowrap">{item.subjectName}</td>
                              <td className="p-2.5 font-semibold text-white text-[11.5px]">{item.outcome}</td>
                              <td className="p-2.5 text-center text-slate-400">{item.totalQuestions}</td>
                              <td className="p-2.5 text-center font-mono text-[11px] whitespace-nowrap">
                                <span className="text-emerald-400 font-bold">{item.correctCount}D</span>
                                {' / '}
                                <span className="text-rose-400 font-bold">{item.wrongCount}Y</span>
                                {' / '}
                                <span className="text-slate-400">{item.emptyCount}B</span>
                              </td>
                              <td className="p-2.5 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-14 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        item.status === 'SUCCESS' ? 'bg-emerald-500' :
                                        item.status === 'WARNING' ? 'bg-amber-500' : 'bg-rose-500'
                                      }`}
                                      style={{ width: `${Math.min(100, item.successRate)}%` }}
                                    />
                                  </div>
                                  <span className="font-bold text-[11px] text-slate-200">%{item.successRate}</span>
                                </div>
                              </td>
                              <td className="p-2.5 text-center whitespace-nowrap">
                                {item.status === 'SUCCESS' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Kavrandı
                                  </span>
                                )}
                                {item.status === 'WARNING' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Tekrar Edilmeli
                                  </span>
                                )}
                                {item.status === 'DANGER' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Destek Gerekli
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Question Answers Analysis Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-indigo-300">Soru Soru Cevap Detayları</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                {selectedStudentResult.answers.map((ans, aIdx) => (
                  <div key={aIdx} className={`p-2 rounded-lg border text-[11px] flex items-center justify-between ${
                    ans.isCorrect ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' :
                    ans.isBlank ? 'bg-slate-900 border-slate-800 text-slate-400' :
                    'bg-rose-950/30 border-rose-500/30 text-rose-300'
                  }`}>
                    <span>Soru {ans.questionNumber}</span>
                    <span className="font-mono font-bold">
                      İşaretlenen: {ans.selectedOption || '-'} (Doğru: {ans.correctAnswer})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(selectedStudentResult)}
                  className="btn text-xs py-2 px-3.5 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 font-bold cursor-pointer transition-all"
                  title="Öğrencinin karnesini ve eksik kazanımlarını WhatsApp ile veliye gönderin"
                >
                  <MessageSquare className="h-4 w-4" /> WhatsApp ile Gönder
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyKarneText(selectedStudentResult)}
                  className={`btn btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 font-semibold cursor-pointer transition-all ${
                    copiedResultId === selectedStudentResult.id ? 'border-emerald-500 text-emerald-400' : 'text-slate-300'
                  }`}
                  title="Karne özet metnini panoya kopyala"
                >
                  {copiedResultId === selectedStudentResult.id ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" /> Kopyalandı!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-slate-400" /> Metni Kopyala
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedExam) {
                      examExportService.exportData({
                        exam: selectedExam,
                        results: rawResults,
                        type: 'STUDENT_REPORT_CARD',
                        format: 'PDF',
                        targetStudentId: selectedStudentResult.studentId
                      });
                    }
                  }}
                  className="btn btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 text-rose-400 border-rose-500/30 hover:bg-rose-950/40 font-semibold cursor-pointer"
                >
                  <FileText className="h-4 w-4 text-rose-400" /> PDF İndir
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedExam) {
                      examExportService.exportData({
                        exam: selectedExam,
                        results: rawResults,
                        type: 'STUDENT_REPORT_CARD',
                        format: 'EXCEL',
                        targetStudentId: selectedStudentResult.studentId
                      });
                    }
                  }}
                  className="btn btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/40 font-semibold cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Excel
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudentResult(null)}
                className="btn btn-secondary text-xs py-2 px-5 cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Export & Download Modal */}
      {isExportModalOpen && selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel max-w-2xl w-full p-6 rounded-2xl border-indigo-500/40 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                  <Download className="h-5 w-5 text-indigo-400" /> Sınav Sonuçlarını İndir & Dışa Aktar
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  <strong className="text-indigo-300">{selectedExam.title}</strong> ({rawResults.length} Öğrenci Sonucu)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 1. Rapor Türü Seçimi */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                1. Rapor Türünü Seçin
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setExportType('INSTITUTION_RANKING')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    exportType === 'INSTITUTION_RANKING'
                      ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500/50'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Trophy className={`h-5 w-5 ${exportType === 'INSTITUTION_RANKING' ? 'text-amber-400' : 'text-slate-400'}`} />
                    {exportType === 'INSTITUTION_RANKING' && <Check className="h-4 w-4 text-indigo-400" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">Kurum Sıralı Liste</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Tüm kurum genel başarı ve derece sıralaması</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportType('CLASS_RANKING')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    exportType === 'CLASS_RANKING'
                      ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500/50'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Layers className={`h-5 w-5 ${exportType === 'CLASS_RANKING' ? 'text-indigo-400' : 'text-slate-400'}`} />
                    {exportType === 'CLASS_RANKING' && <Check className="h-4 w-4 text-indigo-400" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">Sınıf Sıralı Liste</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Sınıf bazında ayrılmış derece sıralamaları</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportType('STUDENT_REPORT_CARD')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    exportType === 'STUDENT_REPORT_CARD'
                      ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500/50'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <GraduationCap className={`h-5 w-5 ${exportType === 'STUDENT_REPORT_CARD' ? 'text-fuchsia-400' : 'text-slate-400'}`} />
                    {exportType === 'STUDENT_REPORT_CARD' && <Check className="h-4 w-4 text-indigo-400" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">Öğrenci Karneleri</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Ders ve soru analizli bireysel karneler</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Ekstra Filtreler (Sınıf veya Öğrenci Seçimi) */}
            {exportType === 'CLASS_RANKING' && (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-indigo-300 block">Sınıf Seçimi</label>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="input-field text-xs py-2 w-full bg-slate-850"
                >
                  <option value="ALL">Tüm Sınıflar (Ayrı Sayfalar / Sekmeler)</option>
                  {Array.from(new Set(rawResults.map(r => r.className).filter(Boolean))).map(cls => (
                    <option key={cls} value={cls}>{cls} Sınıfı ({rawResults.filter(r => r.className === cls).length} Öğrenci)</option>
                  ))}
                </select>
              </div>
            )}

            {exportType === 'STUDENT_REPORT_CARD' && (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-indigo-300 block">Karne Kapsamı</label>
                <select
                  value={selectedStudentFilter}
                  onChange={(e) => setSelectedStudentFilter(e.target.value)}
                  className="input-field text-xs py-2 w-full bg-slate-850"
                >
                  <option value="ALL">Tüm Öğrenciler (Toplu Karneler - {rawResults.length} Sayfa)</option>
                  {rawResults.map(st => (
                    <option key={st.id} value={st.studentId}>
                      {st.studentName} ({st.className} - No: {st.studentNo})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 2. Format Seçimi */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                2. Çıktı Formatını Seçin
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportFormat('PDF')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    exportFormat === 'PDF'
                      ? 'bg-rose-500/10 border-rose-500/60 ring-1 ring-rose-500/40'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="h-10 w-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-white">PDF Belgesi (.pdf)</h4>
                      {exportFormat === 'PDF' && <Check className="h-4 w-4 text-rose-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Yazdırmaya hazır resmi A4 formatı</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat('EXCEL')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    exportFormat === 'EXCEL'
                      ? 'bg-emerald-500/10 border-emerald-500/60 ring-1 ring-emerald-500/40'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="h-10 w-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-white">Excel Tablosu (.xlsx)</h4>
                      {exportFormat === 'EXCEL' && <Check className="h-4 w-4 text-emerald-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Düzenlenebilir elektronik tablo</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="btn btn-secondary text-xs py-2.5 px-5 cursor-pointer"
              >
                Vazgeç
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={async () => {
                  setIsExporting(true);
                  try {
                    await examExportService.exportData({
                      exam: selectedExam,
                      results: rawResults,
                      type: exportType,
                      format: exportFormat,
                      targetClass: selectedClassFilter,
                      targetStudentId: selectedStudentFilter
                    });
                    setIsExportModalOpen(false);
                  } catch (err) {
                    console.error('Export error:', err);
                    alert('Dosya oluşturulurken bir hata meydana geldi.');
                  } finally {
                    setIsExporting(false);
                  }
                }}
                className="btn btn-primary text-xs py-2.5 px-6 font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white"
              >
                <Download className="h-4 w-4" />
                {isExporting ? 'Hazırlanıyor...' : 'Seçilen Raporu İndir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
