import React from 'react';
import { Users, BookOpen, FileText, Camera, BarChart3, ChevronRight, Shield, Megaphone } from 'lucide-react';
import { storageService } from '../../services/storageService';

interface Props {
  setActiveTab: (tab: string) => void;
}

export const InstitutionAdminDash: React.FC<Props> = ({ setActiveTab }) => {
  const currentUser = storageService.getCurrentUser();
  const siteSettings = storageService.getSiteSettings();
  const instId = currentUser.institutionId;

  const classes = storageService.getClasses(instId);
  const students = storageService.getStudents(instId);
  const exams = storageService.getExams(instId);
  const personnel = storageService.getUsersByInstitution(instId || '');
  const recentExams = [...exams].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);

  const totalScanned = exams.reduce((sum, exam) => sum + (exam.totalExamsScanned || 0), 0);

  return (
    <div className="space-y-6">
      {/* Announcement Banner */}
      {siteSettings.isAnnouncementActive && siteSettings.announcementText && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border border-indigo-500/40 text-white text-xs flex items-center gap-3 animate-fade-in shadow-lg">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/30 flex items-center justify-center shrink-0 text-amber-300">
            <Megaphone className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-indigo-300">Sistem Duyurusu: </span>
            {siteSettings.announcementText}
          </div>
        </div>
      )}

      <div className="mb-2">
        <h2 className="font-display text-2xl font-bold text-white">Hoş Geldiniz, {currentUser.name}</h2>
        <p className="text-sm text-slate-400">{currentUser.institutionName} - Kurum Yönetim Paneli</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Aktif Sınıf Sayısı</p>
              <h3 className="font-display text-2xl font-extrabold text-white mt-1">{classes.length}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Toplam Öğrenci</p>
              <h3 className="font-display text-2xl font-extrabold text-white mt-1">{students.length}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Kayıtlı Personel</p>
              <h3 className="font-display text-2xl font-extrabold text-white mt-1">{personnel.length}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Shield className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 border-l-4 border-fuchsia-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Oluşturulan Sınav / Optik</p>
              <h3 className="font-display text-2xl font-extrabold text-white mt-1">{exams.length} / {totalScanned}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-400">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => setActiveTab('create-exam')} className="glass-card flex flex-col items-center justify-center p-6 gap-3 group">
          <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
            <FileText className="h-6 w-6" />
          </div>
          <span className="text-sm font-semibold text-slate-200">Sınav Oluştur</span>
        </button>

        <button onClick={() => setActiveTab('scan')} className="glass-card flex flex-col items-center justify-center p-6 gap-3 group">
          <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <Camera className="h-6 w-6" />
          </div>
          <span className="text-sm font-semibold text-slate-200">Kamera ile Oku</span>
        </button>

        <button onClick={() => setActiveTab('management')} className="glass-card flex flex-col items-center justify-center p-6 gap-3 group">
          <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
            <Users className="h-6 w-6" />
          </div>
          <span className="text-sm font-semibold text-slate-200">Personel & Sınıf Yönetimi</span>
        </button>

        <button onClick={() => setActiveTab('results')} className="glass-card flex flex-col items-center justify-center p-6 gap-3 group">
          <div className="h-12 w-12 rounded-full bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 group-hover:bg-fuchsia-500 group-hover:text-white transition-colors">
            <BarChart3 className="h-6 w-6" />
          </div>
          <span className="text-sm font-semibold text-slate-200">Sınav Sonuçları</span>
        </button>
      </div>

      {/* Recent Exams */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-white">Son Sınavlar</h3>
          <button onClick={() => setActiveTab('results')} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            Tümünü Gör <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {recentExams.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Henüz sınav oluşturulmamış.</p>
          ) : (
            recentExams.map(exam => (
              <div key={exam.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setActiveTab('results')}>
                <div>
                  <h4 className="font-semibold text-slate-200">{exam.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {exam.examCode} • {exam.date} • {exam.totalQuestions} Soru
                  </p>
                </div>
                <div className="text-right">
                  <span className="badge badge-primary">{exam.totalExamsScanned || 0} Optik Okundu</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
