import React from 'react';
import { motion } from 'motion/react';
import { Users, BookOpen, FileText, Camera, BarChart3, ChevronRight, Shield, Megaphone } from 'lucide-react';
import { storageService } from '../../services/storageService';

interface Props {
  setActiveTab: (tab: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
  }
};

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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Announcement Banner */}
      {siteSettings.isAnnouncementActive && siteSettings.announcementText && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border border-indigo-500/40 text-white text-xs flex items-center gap-3 shadow-lg shadow-indigo-950/30 backdrop-blur-md"
        >
          <div className="h-9 w-9 rounded-xl bg-indigo-500/30 flex items-center justify-center shrink-0 text-amber-300">
            <Megaphone className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-indigo-300">Sistem Duyurusu: </span>
            {siteSettings.announcementText}
          </div>
        </motion.div>
      )}

      <div className="mb-2">
        <h2 className="font-display text-2xl font-bold text-white tracking-tight">Hoş Geldiniz, {currentUser.name}</h2>
        <p className="text-sm text-slate-400 mt-0.5">{currentUser.institutionName} • Kurum Yönetim Paneli</p>
      </div>

      {/* Stat Cards with Staggered Entrance */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="clay-card p-5 relative overflow-hidden group border border-indigo-500/30"
        >
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-semibold text-slate-400">Aktif Sınıf Sayısı</p>
              <h3 className="font-display text-3xl font-black text-white mt-1.5">{classes.length}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.25)] group-hover:scale-110 transition-transform">
              <BookOpen className="h-6 w-6" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="clay-card p-5 relative overflow-hidden group border border-emerald-500/30"
        >
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-semibold text-slate-400">Toplam Öğrenci</p>
              <h3 className="font-display text-3xl font-black text-white mt-1.5">{students.length}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.25)] group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="clay-card p-5 relative overflow-hidden group border border-amber-500/30"
        >
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-semibold text-slate-400">Kayıtlı Personel</p>
              <h3 className="font-display text-3xl font-black text-white mt-1.5">{personnel.length}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.25)] group-hover:scale-110 transition-transform">
              <Shield className="h-6 w-6" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="clay-card p-5 relative overflow-hidden group border border-fuchsia-500/30"
        >
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-semibold text-slate-400">Oluşturulan Sınav / Optik</p>
              <h3 className="font-display text-3xl font-black text-white mt-1.5">{exams.length} / {totalScanned}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.25)] group-hover:scale-110 transition-transform">
              <FileText className="h-6 w-6" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <motion.button 
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setActiveTab('create-exam')} 
          className="clay-card flex flex-col items-center justify-center p-6 gap-3 group rounded-[28px] cursor-pointer"
        >
          <div className="h-14 w-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-[inset_0_2px_4px_rgba(255,255,255,0.25),inset_0_-2px_4px_rgba(0,0,0,0.2)] group-hover:shadow-[0_8px_16px_rgba(79,70,229,0.45)]">
            <FileText className="h-7 w-7" />
          </div>
          <span className="text-sm font-bold text-slate-200">Sınav Oluştur</span>
        </motion.button>

        <motion.button 
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setActiveTab('scan')} 
          className="clay-card flex flex-col items-center justify-center p-6 gap-3 group rounded-[28px] cursor-pointer"
        >
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-[inset_0_2px_4px_rgba(255,255,255,0.25),inset_0_-2px_4px_rgba(0,0,0,0.2)] group-hover:shadow-[0_8px_16px_rgba(16,185,129,0.45)]">
            <Camera className="h-7 w-7" />
          </div>
          <span className="text-sm font-bold text-slate-200">Kamera ile Oku</span>
        </motion.button>

        <motion.button 
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setActiveTab('management')} 
          className="clay-card flex flex-col items-center justify-center p-6 gap-3 group rounded-[28px] cursor-pointer"
        >
          <div className="h-14 w-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-[inset_0_2px_4px_rgba(255,255,255,0.25),inset_0_-2px_4px_rgba(0,0,0,0.2)] group-hover:shadow-[0_8px_16px_rgba(245,158,11,0.45)]">
            <Users className="h-7 w-7" />
          </div>
          <span className="text-sm font-bold text-slate-200">Personel & Sınıf Yönetimi</span>
        </motion.button>

        <motion.button 
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setActiveTab('results')} 
          className="clay-card flex flex-col items-center justify-center p-6 gap-3 group rounded-[28px] cursor-pointer"
        >
          <div className="h-14 w-14 rounded-2xl bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 group-hover:bg-fuchsia-600 group-hover:text-white transition-all shadow-[inset_0_2px_4px_rgba(255,255,255,0.25),inset_0_-2px_4px_rgba(0,0,0,0.2)] group-hover:shadow-[0_8px_16px_rgba(217,70,239,0.45)]">
            <BarChart3 className="h-7 w-7" />
          </div>
          <span className="text-sm font-bold text-slate-200">Sınav Sonuçları</span>
        </motion.button>
      </motion.div>

      {/* Recent Exams */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="clay-panel p-6 rounded-[28px] shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-white">Son Sınavlar</h3>
          <motion.button 
            whileHover={{ x: 2 }}
            onClick={() => setActiveTab('results')} 
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
          >
            Tümünü Gör <ChevronRight className="h-3.5 w-3.5" />
          </motion.button>
        </div>

        <div className="space-y-3">
          {recentExams.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Henüz sınav oluşturulmamış.</p>
          ) : (
            recentExams.map(exam => (
              <motion.div 
                key={exam.id} 
                whileHover={{ scale: 1.01, x: 2 }}
                whileTap={{ scale: 0.99 }}
                className="flex items-center justify-between p-4 rounded-2xl clay-card hover:border-indigo-500/40 transition-all cursor-pointer" 
                onClick={() => setActiveTab('results')}
              >
                <div>
                  <h4 className="font-bold text-slate-100">{exam.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {exam.examCode} • {exam.date} • {exam.totalQuestions} Soru
                  </p>
                </div>
                <div className="text-right">
                  <span className="badge badge-primary">{exam.totalExamsScanned || 0} Optik Okundu</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
