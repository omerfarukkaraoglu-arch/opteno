import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Compass, 
  Award,
  Layers,
  Sparkles
} from 'lucide-react';
import { ScanResult, Exam, OutcomeAnalysis } from '../../types';
import { computeOutcomeAnalyses } from '../../services/omrEngine';

interface Props {
  studentResult: ScanResult;
  allResults: ScanResult[];
  exam: Exam;
}

export const StudentReportCardCharts: React.FC<Props> = ({
  studentResult,
  allResults,
  exam
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'comparison' | 'distribution' | 'outcomes'>('comparison');

  // Filter peers
  const studentClass = studentResult.className;
  const classResults = allResults.filter(r => r.className === studentClass);
  const totalCount = allResults.length;
  const classCount = classResults.length;

  // Calculate Averages for Each Subject
  const subjectStats = exam.subjects.map(s => {
    const studentSub = studentResult.subjectResults.find(sr => sr.subjectName === s.name);
    const studentNet = studentSub ? studentSub.netCount : 0;
    const studentCorrect = studentSub ? studentSub.correctCount : 0;
    const studentWrong = studentSub ? studentSub.wrongCount : 0;
    const studentEmpty = studentSub ? studentSub.emptyCount : s.questionCount;
    const totalQ = s.questionCount;

    // Class average net
    const classAvgNet = classCount > 0
      ? classResults.reduce((sum, r) => {
          const sub = r.subjectResults.find(sr => sr.subjectName === s.name);
          return sum + (sub ? sub.netCount : 0);
        }, 0) / classCount
      : 0;

    // Institution average net
    const instAvgNet = totalCount > 0
      ? allResults.reduce((sum, r) => {
          const sub = r.subjectResults.find(sr => sr.subjectName === s.name);
          return sum + (sub ? sub.netCount : 0);
        }, 0) / totalCount
      : 0;

    const diffFromClass = parseFloat((studentNet - classAvgNet).toFixed(2));
    const accuracyRate = totalQ > 0 ? Math.round((studentCorrect / totalQ) * 100) : 0;

    return {
      name: s.name,
      totalQuestions: totalQ,
      studentNet,
      studentCorrect,
      studentWrong,
      studentEmpty,
      classAvgNet: parseFloat(classAvgNet.toFixed(2)),
      instAvgNet: parseFloat(instAvgNet.toFixed(2)),
      diffFromClass,
      accuracyRate
    };
  });

  // Total Net Averages
  const classAvgTotalNet = classCount > 0
    ? classResults.reduce((sum, r) => sum + r.totalNet, 0) / classCount
    : 0;
  const instAvgTotalNet = totalCount > 0
    ? allResults.reduce((sum, r) => sum + r.totalNet, 0) / totalCount
    : 0;

  // Outcomes analysis
  const outcomes: OutcomeAnalysis[] = studentResult.outcomeAnalyses && studentResult.outcomeAnalyses.length > 0
    ? studentResult.outcomeAnalyses
    : computeOutcomeAnalyses(exam, studentResult.answers);

  const totalOutcomesCount = outcomes.length;
  const successOutcomes = outcomes.filter(o => o.status === 'SUCCESS');
  const warningOutcomes = outcomes.filter(o => o.status === 'WARNING');
  const dangerOutcomes = outcomes.filter(o => o.status === 'DANGER');

  const successPct = totalOutcomesCount > 0 ? Math.round((successOutcomes.length / totalOutcomesCount) * 100) : 0;
  const warningPct = totalOutcomesCount > 0 ? Math.round((warningOutcomes.length / totalOutcomesCount) * 100) : 0;
  const dangerPct = totalOutcomesCount > 0 ? Math.round((dangerOutcomes.length / totalOutcomesCount) * 100) : 0;

  // Max net possible for relative scaling
  const maxNetPossible = Math.max(...subjectStats.map(s => s.totalQuestions), 1);

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/80 p-4 space-y-4 shadow-xl">
      {/* Chart Sub-Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-400" />
            <span>Görsel Performans & Karşılaştırma Grafikleri</span>
          </h4>
          <p className="text-[11px] text-slate-400">
            Sınıf ({classCount} öğrenci) ve Kurum ({totalCount} öğrenci) ortalamalarıyla kıyaslama
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveChartTab('comparison')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
              activeChartTab === 'comparison'
                ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Net Kıyaslama
          </button>
          <button
            type="button"
            onClick={() => setActiveChartTab('distribution')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
              activeChartTab === 'distribution'
                ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Soru Dağılımı
          </button>
          {totalOutcomesCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveChartTab('outcomes')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                activeChartTab === 'outcomes'
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Kazanım Hakimiyeti
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. GRAFİK SEKME: ÖĞRENCİ VS SINIF VS KURUM NET KARŞILAŞTIRMASI */}
      {/* ============================================================== */}
      {activeChartTab === 'comparison' && (
        <div className="space-y-4 animate-fade-in">
          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 gap-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-gradient-to-r from-indigo-500 to-fuchsia-500 shadow-sm" />
                <span className="font-semibold text-slate-200">Öğrenci Neti</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-sky-500" />
                <span>Sınıf Ortalaması ({studentClass})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-amber-500" />
                <span>Kurum Ortalaması</span>
              </div>
            </div>
            <div className="text-[11px] text-indigo-300 font-medium">
              Toplam Net Farkı:{' '}
              <span className={`font-bold ${studentResult.totalNet >= classAvgTotalNet ? 'text-emerald-400' : 'text-rose-400'}`}>
                {studentResult.totalNet >= classAvgTotalNet ? '+' : ''}
                {(studentResult.totalNet - classAvgTotalNet).toFixed(2)} Net
              </span>
            </div>
          </div>

          {/* Comparative Subject Bars */}
          <div className="space-y-3.5">
            {subjectStats.map((sub, sIdx) => {
              const maxScale = Math.max(sub.totalQuestions, 1);
              const studentPct = Math.min(100, Math.max(0, (sub.studentNet / maxScale) * 100));
              const classPct = Math.min(100, Math.max(0, (sub.classAvgNet / maxScale) * 100));
              const instPct = Math.min(100, Math.max(0, (sub.instAvgNet / maxScale) * 100));

              const isAboveClass = sub.diffFromClass >= 0;

              return (
                <div key={sIdx} className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{sub.name}</span>
                      <span className="text-[10.5px] text-slate-500">({sub.totalQuestions} Soru)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                        isAboveClass
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}>
                        {isAboveClass ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        Sınıftan {isAboveClass ? `+${sub.diffFromClass}` : sub.diffFromClass} Net
                      </span>
                      <span className="font-mono font-bold text-indigo-300 text-sm">
                        {sub.studentNet} Net
                      </span>
                    </div>
                  </div>

                  {/* Multi-tier horizontal bar comparison */}
                  <div className="space-y-1.5 pt-0.5">
                    {/* Student Bar */}
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="w-14 text-slate-400 font-medium text-[10px] shrink-0">Öğrenci:</span>
                      <div className="flex-1 bg-slate-800/80 rounded-full h-3 overflow-hidden p-0.5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all duration-500"
                          style={{ width: `${studentPct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right font-mono font-bold text-white text-[11px] shrink-0">
                        {sub.studentNet}
                      </span>
                    </div>

                    {/* Class Average Bar */}
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="w-14 text-slate-400 text-[10px] shrink-0">Sınıf Ort:</span>
                      <div className="flex-1 bg-slate-800/80 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-sky-500/80 transition-all duration-500"
                          style={{ width: `${classPct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right font-mono text-sky-300 text-[10.5px] shrink-0">
                        {sub.classAvgNet}
                      </span>
                    </div>

                    {/* Institution Average Bar */}
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="w-14 text-slate-400 text-[10px] shrink-0">Kurum Ort:</span>
                      <div className="flex-1 bg-slate-800/80 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500/80 transition-all duration-500"
                          style={{ width: `${instPct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right font-mono text-amber-300 text-[10.5px] shrink-0">
                        {sub.instAvgNet}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. GRAFİK SEKME: DERS İÇİ SORU DAĞILIMI (STACKED BAR)          */}
      {/* ============================================================== */}
      {activeChartTab === 'distribution' && (
        <div className="space-y-4 animate-fade-in">
          {/* Legend */}
          <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-emerald-500" />
                <span className="text-slate-200">Doğru</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-rose-500" />
                <span className="text-slate-200">Yanlış</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-slate-600" />
                <span className="text-slate-200">Boş</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400">Toplam {exam.totalQuestions} Soru Dağılımı</span>
          </div>

          <div className="space-y-3">
            {subjectStats.map((sub, sIdx) => {
              const totalQ = sub.totalQuestions || 1;
              const correctPct = (sub.studentCorrect / totalQ) * 100;
              const wrongPct = (sub.studentWrong / totalQ) * 100;
              const emptyPct = (sub.studentEmpty / totalQ) * 100;

              return (
                <div key={sIdx} className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{sub.name}</span>
                      <span className="text-[11px] text-slate-400">({sub.totalQuestions} Soru)</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-emerald-400 font-bold">{sub.studentCorrect}D</span>
                      <span className="text-rose-400 font-bold">{sub.studentWrong}Y</span>
                      <span className="text-slate-400">{sub.studentEmpty}B</span>
                      <span className="text-indigo-300 font-bold ml-1">%{sub.accuracyRate} Başarı</span>
                    </div>
                  </div>

                  {/* Stacked Bar */}
                  <div className="w-full h-4 rounded-lg bg-slate-900 border border-slate-800 flex overflow-hidden">
                    {sub.studentCorrect > 0 && (
                      <div
                        className="bg-emerald-500 h-full flex items-center justify-center text-[9px] font-bold text-slate-950 transition-all duration-500"
                        style={{ width: `${correctPct}%` }}
                        title={`Doğru: ${sub.studentCorrect}`}
                      >
                        {correctPct >= 10 && sub.studentCorrect}
                      </div>
                    )}
                    {sub.studentWrong > 0 && (
                      <div
                        className="bg-rose-500 h-full flex items-center justify-center text-[9px] font-bold text-white transition-all duration-500"
                        style={{ width: `${wrongPct}%` }}
                        title={`Yanlış: ${sub.studentWrong}`}
                      >
                        {wrongPct >= 10 && sub.studentWrong}
                      </div>
                    )}
                    {sub.studentEmpty > 0 && (
                      <div
                        className="bg-slate-700 h-full flex items-center justify-center text-[9px] font-medium text-slate-300 transition-all duration-500"
                        style={{ width: `${emptyPct}%` }}
                        title={`Boş: ${sub.studentEmpty}`}
                      >
                        {emptyPct >= 10 && sub.studentEmpty}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. GRAFİK SEKME: KAZANIM HAKİMİYETİ ORANLARI                  */}
      {/* ============================================================== */}
      {activeChartTab === 'outcomes' && totalOutcomesCount > 0 && (
        <div className="space-y-4 animate-fade-in">
          {/* Summary Overview Cards */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="h-4 w-4" />
                <span>Kavrandı</span>
              </div>
              <div className="text-xl font-bold text-emerald-300 mt-1">
                {successOutcomes.length}{' '}
                <span className="text-xs font-normal text-emerald-400/80">({successPct}%)</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">%80 ve üzeri kavrama</div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-xs">
                <AlertTriangle className="h-4 w-4" />
                <span>Tekrar Edilmeli</span>
              </div>
              <div className="text-xl font-bold text-amber-300 mt-1">
                {warningOutcomes.length}{' '}
                <span className="text-xs font-normal text-amber-400/80">({warningPct}%)</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">%50 - %79 arası kavrama</div>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
              <div className="flex items-center justify-center gap-1.5 text-rose-400 font-bold text-xs">
                <XCircle className="h-4 w-4" />
                <span>Destek Gerekli</span>
              </div>
              <div className="text-xl font-bold text-rose-300 mt-1">
                {dangerOutcomes.length}{' '}
                <span className="text-xs font-normal text-rose-400/80">({dangerPct}%)</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">%50 altı kavrama düzeyi</div>
            </div>
          </div>

          {/* Segmented Progress Distribution Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Genel Kazanım Hakimiyet Dağılımı</span>
              <span className="font-semibold text-white">{totalOutcomesCount} Kazanım</span>
            </div>
            <div className="w-full h-3.5 rounded-full bg-slate-950 border border-slate-800 flex overflow-hidden p-0.5 gap-0.5">
              {successPct > 0 && (
                <div
                  className="bg-emerald-500 rounded-sm h-full transition-all duration-500"
                  style={{ width: `${successPct}%` }}
                  title={`Kavrandı: %${successPct}`}
                />
              )}
              {warningPct > 0 && (
                <div
                  className="bg-amber-500 rounded-sm h-full transition-all duration-500"
                  style={{ width: `${warningPct}%` }}
                  title={`Tekrar Edilmeli: %${warningPct}`}
                />
              )}
              {dangerPct > 0 && (
                <div
                  className="bg-rose-500 rounded-sm h-full transition-all duration-500"
                  style={{ width: `${dangerPct}%` }}
                  title={`Destek Gerekli: %${dangerPct}`}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
