import React, { useState, useEffect } from 'react';
import { FileText, Plus, Calendar, Printer, Camera, Trash2, Layers, Search, Sparkles, CheckCircle2, ChevronRight, User as UserIcon } from 'lucide-react';
import { Exam, User } from '../../types';
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
  const [exams, setExams] = useState<Exam[]>(storageService.getExams());
  const [searchTerm, setSearchTerm] = useState<string>('');

  const reloadExams = () => {
    setExams(storageService.getExams());
  };

  useEffect(() => {
    reloadExams();
    const handleUpdate = () => {
      reloadExams();
    };
    window.addEventListener('opticok-data-updated', handleUpdate);
    return () => window.removeEventListener('opticok-data-updated', handleUpdate);
  }, []);

  const handleDeleteExam = (examId: string, title: string) => {
    if (window.confirm(`"${title}" sınavını silmek istediğinize emin misiniz?`)) {
      storageService.deleteExam(examId);
      reloadExams();
    }
  };

  const filteredExams = exams.filter(e =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.examCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.gradeLevel && String(e.gradeLevel).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="mx-auto max-w-6xl px-2 sm:px-4 py-4 space-y-6">
      {/* Header Bar */}
      <div className="glass-panel p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-400" /> Sınavlar ve Optik Yönetimi
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sistemde tanımlı tüm sınavları görüntüleyin, optik form basımı yapın veya sonuçları inceleyin.
          </p>
        </div>

        {onNavigateToCreateExam && (
          <button
            onClick={onNavigateToCreateExam}
            className="btn btn-primary text-xs py-2.5 px-5 font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Yeni Sınav Oluştur
          </button>
        )}
      </div>

      {/* Search Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Sınav adı, kodu veya sınıf seviyesi ile ara..."
            className="input-field pl-10 text-xs py-2.5"
          />
        </div>
      </div>

      {/* Exam Cards Grid */}
      {filteredExams.length === 0 ? (
        <div className="glass-panel p-12 text-center space-y-3">
          <FileText className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Hiç Sınav Bulunamadı</h3>
          <p className="text-xs text-slate-400">Arama kriterlerinize uygun sınav bulunmuyor veya henüz yeni sınav oluşturulmadı.</p>
          {onNavigateToCreateExam && (
            <button
              onClick={onNavigateToCreateExam}
              className="btn btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 mt-2"
            >
              <Plus className="h-4 w-4" /> Sınav Oluştur
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExams.map((exam) => {
            const examResults = storageService.getResults(exam.id);
            const isHighlighted = exam.id === highlightedExamId;

            return (
              <div
                key={exam.id}
                className={`glass-card p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  isHighlighted
                    ? 'border-emerald-500 shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-500/40 bg-slate-900/90'
                    : 'border-slate-800 hover:border-indigo-500/50'
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
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {exam.date}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base text-white leading-snug">
                    {exam.title}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {exam.gradeLevel && (
                      <span className="badge badge-info text-[10px]">{exam.gradeLevel}</span>
                    )}
                    {exam.hasBookletTypes && (
                      <span className="badge badge-warning text-[10px] font-bold">A/B Kitapçıklı</span>
                    )}
                    <span className="text-xs text-slate-400 font-semibold">{exam.institutionName}</span>
                  </div>

                  {/* Exam Breakdown Badges */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Soru</div>
                      <div className="font-bold text-white text-sm">{exam.totalQuestions}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ders</div>
                      <div className="font-bold text-indigo-400 text-sm">{exam.subjects.length}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Okunan</div>
                      <div className="font-bold text-emerald-400 text-sm">{examResults.length}</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {examResults.length > 0 && (
                    <div className="mt-2.5 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800/70 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Tarama İlerlemesi:</span>
                        <span className="font-bold text-emerald-400">{examResults.length} Kağıt Hazır</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-400 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(15, examResults.length * 6))}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Scanned Student Results Drawer inside Exam Card */}
                  {examResults.length > 0 && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Okunan Öğrenci Kağıtları ({examResults.length})
                        </span>
                        {onNavigateToResults && (
                          <button
                            type="button"
                            onClick={() => onNavigateToResults(exam.id)}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline flex items-center gap-0.5"
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
                            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{res.studentName}</span>
                              <span className="text-[10px] text-slate-400">({res.className} - No: {res.studentNo})</span>
                            </div>
                            <div className="flex items-center gap-2 font-mono font-bold">
                              <span className="text-emerald-400">{res.totalNet} Net</span>
                              <span className="text-slate-300">({res.totalScore} Puan)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {onNavigateToResults && (
                    <button
                      onClick={() => onNavigateToResults(exam.id)}
                      className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-amber-400 border-amber-500/30"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Sonuçları Gör ({storageService.getResults(exam.id).length})
                    </button>
                  )}

                  {onNavigateToOMR && (
                    <button
                      onClick={() => onNavigateToOMR(exam.id)}
                      className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <Printer className="h-3.5 w-3.5" /> Optik Üret
                    </button>
                  )}

                  {onNavigateToScan && (
                    <button
                      onClick={onNavigateToScan}
                      className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-emerald-400 border-emerald-500/30"
                    >
                      <Camera className="h-3.5 w-3.5" /> Optik Oku
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteExam(exam.id, exam.title)}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                  title="Sınavı Sil"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};
