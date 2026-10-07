import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  BarChart3, 
  Users, 
  Building2, 
  Sparkles, 
  Download, 
  LogOut, 
  Printer, 
  ListOrdered, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  ChevronRight, 
  PlusCircle 
} from 'lucide-react';
import { User } from '../../types';
import { storageService } from '../../services/storageService';
import { Theme } from '../../services/themeService';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  onLogout: () => void;
  deferredPrompt: any;
  installApp: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  deferredPrompt,
  installApp,
  theme,
  onToggleTheme
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const siteSettings = storageService.getSiteSettings();
  const navRef = React.useRef<HTMLElement>(null);
  const [sliderStyle, setSliderStyle] = useState<{ left: number; width: number; visible: boolean }>({
    left: 0,
    width: 0,
    visible: false
  });

  const updateSlider = React.useCallback(() => {
    if (!navRef.current) return;
    const activeBtn = navRef.current.querySelector<HTMLButtonElement>('[data-active="true"]');
    if (activeBtn) {
      setSliderStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
        visible: true
      });
    } else {
      setSliderStyle(prev => ({ ...prev, visible: false }));
    }
  }, []);

  React.useEffect(() => {
    updateSlider();
    const t = setTimeout(updateSlider, 50);
    window.addEventListener('resize', updateSlider);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', updateSlider);
    };
  }, [activeTab, updateSlider]);

  return (
    <>
      <header className="clay-panel sticky top-0 z-40 mb-4 sm:mb-6 rounded-none border-x-0 border-t-0 px-3 sm:px-6 py-2.5 sm:py-3 shadow-md transition-colors backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          {/* Logo & Title */}
          <div 
            className="flex cursor-pointer items-center gap-2 sm:gap-3"
            onClick={() => setActiveTab('dashboard')}
          >
            <motion.div 
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="flex items-center rounded-2xl bg-white px-3 sm:px-4 py-1.5 shadow-[0_6px_16px_rgba(0,0,0,0.12),inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.06)] border border-slate-200/90 dark:border-white/20 transition-all"
            >
              <img 
                src="/opteno-logo.png" 
                alt="Opteno - Dijital Sınav Yönetim Sistemi" 
                className="h-8 sm:h-9 md:h-10 w-auto object-contain"
              />
            </motion.div>
            {siteSettings.maintenanceMode && (
              <span className="badge badge-warning text-[9px] px-1.5 py-0.5 animate-pulse">Bakım</span>
            )}
          </div>

          {/* Desktop & Tablet Navigation Tabs (md:flex) */}
          <nav 
            ref={navRef}
            className="hidden md:flex relative items-center gap-1.5 rounded-[22px] clay-sunken p-1.5 transition-colors"
          >
            {/* Kayar Mavi/Yeşil Arka Plan Hapı (Sliding Clay Pill Indicator) */}
            <div
              className={`absolute top-1.5 bottom-1.5 rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none ${
                sliderStyle.visible ? 'opacity-100' : 'opacity-0'
              } ${
                activeTab === 'scan'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_8px_18px_rgba(16,185,129,0.4),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.2)]'
                  : 'bg-gradient-to-r from-indigo-600 to-blue-600 shadow-[0_8px_18px_rgba(79,70,229,0.4),inset_0_2px_4px_rgba(255,255,255,0.35),inset_0_-2px_4px_rgba(0,0,0,0.2)]'
              }`}
              style={{
                transform: `translateX(${sliderStyle.left}px)`,
                width: `${sliderStyle.width}px`,
                left: 0,
              }}
            />

            <motion.button
              whileTap={{ scale: 0.95 }}
              data-active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
              className={`relative z-10 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors duration-200 ${
                activeTab === 'dashboard' ? 'text-white drop-shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="h-4 w-4" /> Paneller
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              data-active={activeTab === 'exams' || activeTab === 'results'}
              onClick={() => setActiveTab('exams')}
              className={`relative z-10 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors duration-200 ${
                activeTab === 'exams' || activeTab === 'results' ? 'text-white drop-shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <ListOrdered className="h-4 w-4" /> Sınavlar & Sonuçlar
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              data-active={activeTab === 'scan'}
              onClick={() => setActiveTab('scan')}
              className={`relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-colors duration-200 ${
                activeTab === 'scan'
                  ? 'text-white drop-shadow-sm'
                  : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300'
              }`}
            >
              <Camera className="h-4 w-4" /> Optik Oku
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              data-active={activeTab === 'generate-omr' || activeTab === 'generator'}
              onClick={() => setActiveTab('generate-omr')}
              className={`relative z-10 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors duration-200 ${
                activeTab === 'generate-omr' || activeTab === 'generator' ? 'text-white drop-shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Printer className="h-4 w-4" /> Optik Form Bas
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              data-active={activeTab === 'create-exam'}
              onClick={() => setActiveTab('create-exam')}
              className={`relative z-10 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors duration-200 ${
                activeTab === 'create-exam' ? 'text-white drop-shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <PlusCircle className="h-4 w-4" /> Yeni Sınav
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              data-active={activeTab === 'management'}
              onClick={() => setActiveTab('management')}
              className={`relative z-10 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors duration-200 ${
                activeTab === 'management' ? 'text-white drop-shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {currentUser.role === 'SUPER_ADMIN' ? <Building2 className="h-4 w-4" /> : <Users className="h-4 w-4" />}
              {currentUser.role === 'SUPER_ADMIN' ? 'Kurumlar' : 'Yönetim'}
            </motion.button>
          </nav>

          {/* Right Section: Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {deferredPrompt && (
              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={installApp}
                className="btn btn-primary text-xs py-1.5 px-3 hidden sm:inline-flex rounded-2xl"
              >
                <Download className="h-3.5 w-3.5" /> Yükle
              </motion.button>
            )}

            {/* Profile badge (clickable on mobile to open drawer) */}
            <motion.div 
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 350, damping: 22 }}
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex items-center gap-2.5 rounded-2xl clay-card px-2.5 sm:px-3.5 py-1.5 text-xs cursor-pointer hover:border-indigo-500/50 transition-all"
              title="Kullanıcı Menüsü"
            >
              <div className="h-7 w-7 rounded-xl bg-indigo-600/20 text-indigo-600 dark:bg-indigo-600/30 dark:text-indigo-400 flex items-center justify-center font-bold shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)]">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  {currentUser.role === 'SUPER_ADMIN' ? 'Sistem Yöneticisi' : currentUser.role === 'INSTITUTION_ADMIN' ? 'Kurum Yöneticisi' : 'Öğretmen'}
                </div>
              </div>
            </motion.div>

            {/* Theme Switcher Button (Dark / Light) */}
            <motion.button
              whileHover={{ scale: 1.08, y: -1 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              onClick={onToggleTheme}
              className="p-2.5 rounded-2xl clay-card text-amber-500 dark:text-amber-400 text-xs font-semibold flex items-center justify-center cursor-pointer shadow-sm hover:text-amber-600"
              title={theme === 'dark' ? 'Aydınlık Moda Geç' : 'Karanlık Moda Geç'}
              aria-label="Tema Değiştir"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-600" />
              )}
            </motion.button>

            {/* Desktop Logout Button */}
            <motion.button
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 350, damping: 22 }}
              onClick={onLogout}
              className="hidden sm:flex px-3 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 border border-rose-200/80 dark:border-rose-500/30 transition-all text-xs font-bold items-center gap-1.5 cursor-pointer shadow-[0_6px_14px_rgba(244,63,94,0.15),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.1)] active:translate-y-0.5"
              title="Oturumu Kapat"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Çıkış</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 📱 Mobile Bottom Navigation Bar (Phone view < md)              */}
      {/* ============================================================== */}
      {/* ============================================================== */}
      {/* 📱 Mobile Bottom Navigation Bar (Phone view < md)              */}
      {/* ============================================================== */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 clay-panel rounded-t-[30px] rounded-b-none border-x-0 border-b-0 px-2 py-2 flex items-center justify-around shadow-[0_-10px_25px_rgba(0,0,0,0.3)] safe-area-pb transition-colors"
        aria-label="Mobil Alt Gezinme Çubuğu"
      >
        {/* 1. Panel */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-bold transition-all ${
            activeTab === 'dashboard' 
              ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className={`h-5 w-5 mb-0.5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : ''}`} />
          <span>Panel</span>
        </button>

        {/* 2. Sınavlar & Sonuçlar */}
        <button
          onClick={() => setActiveTab('exams')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-bold transition-all ${
            activeTab === 'exams' || activeTab === 'results' 
              ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <ListOrdered className={`h-5 w-5 mb-0.5 ${activeTab === 'exams' || activeTab === 'results' ? 'stroke-[2.5]' : ''}`} />
          <span>Sınavlar</span>
        </button>

        {/* 3. OPTİK OKU (Ortada Büyük Yuvarlak Yüzen Buton - Clay FAB) */}
        <button
          onClick={() => setActiveTab('scan')}
          className="relative -mt-7 flex flex-col items-center justify-center group focus:outline-none"
          aria-label="Optik Form Oku"
        >
          <div className={`flex h-14 w-14 p-3.5 items-center justify-center rounded-full transition-transform transform active:scale-90 active:translate-y-1 ${
            activeTab === 'scan'
              ? 'bg-gradient-to-tr from-emerald-400 to-teal-500 ring-4 ring-emerald-500/30 shadow-[0_14px_28px_rgba(16,185,129,0.55),inset_0_3px_6px_rgba(255,255,255,0.45),inset_0_-3px_6px_rgba(0,0,0,0.25)]'
              : 'bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-[0_12px_24px_rgba(16,185,129,0.45),inset_0_3px_6px_rgba(255,255,255,0.4),inset_0_-3px_6px_rgba(0,0,0,0.2)] ring-4 ring-white dark:ring-slate-900'
          }`}>
            <Camera className="h-6 w-6 text-white drop-shadow-sm" />
          </div>
          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">Optik Oku</span>
        </button>

        {/* 4. Optik Bas */}
        <button
          onClick={() => setActiveTab('generate-omr')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-bold transition-all ${
            activeTab === 'generate-omr' || activeTab === 'generator' 
              ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Printer className={`h-5 w-5 mb-0.5 ${activeTab === 'generate-omr' || activeTab === 'generator' ? 'stroke-[2.5]' : ''}`} />
          <span>Optik Bas</span>
        </button>

        {/* 5. Menü (Daha Fazla) */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-bold transition-all ${
            isMobileMenuOpen || activeTab === 'management' || activeTab === 'create-exam' 
              ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Menu className="h-5 w-5 mb-0.5" />
          <span>Menü</span>
        </button>
      </nav>

      {/* ============================================================== */}
      {/* 📄 Mobile Slide-Up Action Sheet (Bottom Drawer)                */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
            {/* Karartma Arkalık with smooth fade */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Çekmece Gövdesi (Claymorphic Drawer Panel) */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="relative z-10 w-full max-h-[85vh] overflow-y-auto clay-panel rounded-t-[36px] rounded-b-none p-5 shadow-2xl transition-colors border-x-0 border-b-0"
            >
              {/* Tutamaç Çubuğu */}
              <div className="w-12 h-1.5 bg-slate-400/50 dark:bg-slate-600/70 rounded-full mx-auto mb-4" />

              {/* Profil Başlığı */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-fuchsia-600 text-white flex items-center justify-center font-bold text-lg shadow-[0_8px_16px_rgba(79,70,229,0.35),inset_0_2px_4px_rgba(255,255,255,0.4)] shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-base">{currentUser.name}</div>
                    <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                      {currentUser.role === 'SUPER_ADMIN' ? 'Sistem Yöneticisi' : currentUser.role === 'INSTITUTION_ADMIN' ? 'Kurum Yöneticisi' : 'Öğretmen'}
                    </div>
                  </div>
                </div>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl clay-card text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
                  aria-label="Kapat"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>

              {/* Menü Seçenekleri Listesi */}
              <div className="space-y-3 py-4">
                {/* 1. Yeni Sınav Hazırla */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveTab('create-exam');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl clay-card transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)]">
                      <PlusCircle className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">Yeni Sınav Oluştur</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-normal">Soru sayısı ve cevap anahtarı tanımla</div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0" />
                </motion.button>

                {/* 2. Yönetim */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveTab('management');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl clay-card transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 shrink-0 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)]">
                      {currentUser.role === 'SUPER_ADMIN' ? <Building2 className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {currentUser.role === 'SUPER_ADMIN' ? 'Kurum & Sistem Yönetimi' : 'Sınıf & Öğrenci Yönetimi'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-normal">Kayıtlı öğrenciler, sınıflar ve veriler</div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0" />
                </motion.button>

                {/* 3. Tema Değiştir */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onToggleTheme();
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl clay-card transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/20 text-amber-500 dark:text-amber-400 shrink-0 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)]">
                      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5 text-indigo-600" />}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">Görünüm Teması</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                        {theme === 'dark' ? 'Karanlık Mod (Aydınlığa geç)' : 'Aydınlık Mod (Karanlığa geç)'}
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-primary text-xs font-bold px-2 py-0.5">
                    {theme === 'dark' ? 'KOYU' : 'AÇIK'}
                  </span>
                </motion.button>

                {/* 4. Uygulamayı Yükle (PWA) */}
                {deferredPrompt && (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      installApp();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl clay-card transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shrink-0">
                        <Download className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">Telefona Uygulama Olarak Yükle</div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-300 font-normal">Ana ekrana uygulama kısayolu ekle (PWA)</div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                  </motion.button>
                )}

                {/* 5. Çıkış Yap */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 transition-all mt-4 shadow-[0_6px_14px_rgba(244,63,94,0.15),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.1)] active:translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
                      <LogOut className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-rose-700 dark:text-rose-300 text-sm">Güvenli Çıkış Yap</div>
                      <div className="text-xs text-rose-500 dark:text-rose-400/80 font-normal">Mevcut oturumu sonlandır</div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-rose-400 dark:text-rose-500 shrink-0" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
