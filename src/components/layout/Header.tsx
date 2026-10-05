import React, { useState } from 'react';
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
      <header className="glass-panel sticky top-0 z-40 mb-4 sm:mb-6 rounded-none border-x-0 border-t-0 px-3 sm:px-6 py-2.5 sm:py-3 shadow-sm dark:shadow-md transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          {/* Logo & Title */}
          <div 
            className="flex cursor-pointer items-center gap-2 sm:gap-3"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="flex items-center rounded-2xl bg-white px-3 sm:px-4 py-1.5 shadow-sm hover:shadow-md border border-slate-200/90 dark:border-white/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <img 
                src="/opteno-logo.png" 
                alt="Opteno - Dijital Sınav Yönetim Sistemi" 
                className="h-8 sm:h-9 md:h-10 w-auto object-contain"
              />
            </div>
            {siteSettings.maintenanceMode && (
              <span className="badge badge-warning text-[9px] px-1.5 py-0.5">Bakım</span>
            )}
          </div>

          {/* Desktop & Tablet Navigation Tabs (md:flex) */}
          <nav 
            ref={navRef}
            className="hidden md:flex relative items-center gap-1 rounded-xl bg-slate-100/90 dark:bg-slate-900/70 p-1 border border-slate-200 dark:border-slate-800/80 shadow-inner transition-colors"
          >
            {/* Kayar Mavi/Yeşil Arka Plan Hapı (Sliding Indicator) */}
            <div
              className={`absolute top-1 bottom-1 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none shadow-md ${
                sliderStyle.visible ? 'opacity-100' : 'opacity-0'
              } ${
                activeTab === 'scan'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/30'
                  : 'bg-indigo-600 shadow-indigo-600/30'
              }`}
              style={{
                transform: `translateX(${sliderStyle.left}px)`,
                width: `${sliderStyle.width}px`,
                left: 0,
              }}
            />

            <button
              data-active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 ${
                activeTab === 'dashboard' ? 'text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="h-4 w-4" /> Paneller
            </button>

            <button
              data-active={activeTab === 'exams' || activeTab === 'results'}
              onClick={() => setActiveTab('exams')}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 ${
                activeTab === 'exams' || activeTab === 'results' ? 'text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <ListOrdered className="h-4 w-4" /> Sınavlar & Sonuçlar
            </button>

            <button
              data-active={activeTab === 'scan'}
              onClick={() => setActiveTab('scan')}
              className={`relative z-10 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors duration-200 ${
                activeTab === 'scan'
                  ? 'text-white'
                  : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300'
              }`}
            >
              <Camera className="h-4 w-4" /> Optik Oku
            </button>

            <button
              data-active={activeTab === 'generate-omr' || activeTab === 'generator'}
              onClick={() => setActiveTab('generate-omr')}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 ${
                activeTab === 'generate-omr' || activeTab === 'generator' ? 'text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Printer className="h-4 w-4" /> Optik Form Bas
            </button>

            <button
              data-active={activeTab === 'create-exam'}
              onClick={() => setActiveTab('create-exam')}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 ${
                activeTab === 'create-exam' ? 'text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <PlusCircle className="h-4 w-4" /> Yeni Sınav
            </button>

            <button
              data-active={activeTab === 'management'}
              onClick={() => setActiveTab('management')}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 ${
                activeTab === 'management' ? 'text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {currentUser.role === 'SUPER_ADMIN' ? <Building2 className="h-4 w-4" /> : <Users className="h-4 w-4" />}
              {currentUser.role === 'SUPER_ADMIN' ? 'Kurumlar' : 'Yönetim'}
            </button>
          </nav>

          {/* Right Section: Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {deferredPrompt && (
              <button
                onClick={installApp}
                className="btn btn-primary text-xs py-1.5 px-2.5 sm:px-3 hidden sm:inline-flex"
              >
                <Download className="h-3.5 w-3.5" /> Yükle
              </button>
            )}

            {/* Profile badge (clickable on mobile to open drawer) */}
            <div 
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-900/80 px-2 sm:px-3 py-1.5 border border-slate-200 dark:border-slate-700/60 text-xs cursor-pointer hover:border-indigo-500/50 transition-colors shadow-sm"
              title="Kullanıcı Menüsü"
            >
              <div className="h-7 w-7 rounded-lg bg-indigo-600/20 text-indigo-600 dark:bg-indigo-600/30 dark:text-indigo-400 flex items-center justify-center font-bold">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  {currentUser.role === 'SUPER_ADMIN' ? 'Sistem Yöneticisi' : currentUser.role === 'INSTITUTION_ADMIN' ? 'Kurum Yöneticisi' : 'Öğretmen'}
                </div>
              </div>
            </div>

            {/* Theme Switcher Button (Dark / Light) */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-amber-500 dark:text-amber-400 border border-slate-200 dark:border-slate-700 transition-all text-xs font-semibold flex items-center justify-center cursor-pointer shadow-sm"
              title={theme === 'dark' ? 'Aydınlık Moda Geç' : 'Karanlık Moda Geç'}
              aria-label="Tema Değiştir"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-600" />
              )}
            </button>

            {/* Desktop Logout Button */}
            <button
              onClick={onLogout}
              className="hidden sm:flex p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 border border-rose-200 dark:border-red-500/30 transition-all text-xs font-semibold items-center gap-1.5 cursor-pointer shadow-sm"
              title="Oturumu Kapat"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Çıkış</span>
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 📱 Mobile Bottom Navigation Bar (Phone view < md)              */}
      {/* ============================================================== */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-t border-slate-200/90 dark:border-slate-800/90 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-pb transition-colors"
        aria-label="Mobil Alt Gezinme Çubuğu"
      >
        {/* 1. Panel */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold transition-all ${
            activeTab === 'dashboard' 
              ? 'text-indigo-600 dark:text-indigo-400 font-bold' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className={`h-5 w-5 mb-0.5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : ''}`} />
          <span>Panel</span>
        </button>

        {/* 2. Sınavlar & Sonuçlar */}
        <button
          onClick={() => setActiveTab('exams')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold transition-all ${
            activeTab === 'exams' || activeTab === 'results' 
              ? 'text-indigo-600 dark:text-indigo-400 font-bold' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <ListOrdered className={`h-5 w-5 mb-0.5 ${activeTab === 'exams' || activeTab === 'results' ? 'stroke-[2.5]' : ''}`} />
          <span>Sınavlar</span>
        </button>

        {/* 3. OPTİK OKU (Ortada Büyük Yuvarlak Yüzen Buton - FAB) */}
        <button
          onClick={() => setActiveTab('scan')}
          className="relative -mt-6 flex flex-col items-center justify-center group focus:outline-none"
          aria-label="Optik Form Oku"
        >
          <div className={`flex h-13 w-13 p-3 items-center justify-center rounded-full shadow-lg transition-transform transform active:scale-90 ${
            activeTab === 'scan'
              ? 'bg-gradient-to-tr from-emerald-400 to-teal-500 ring-4 ring-emerald-500/30 shadow-emerald-500/50'
              : 'bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-emerald-500/40 ring-4 ring-white dark:ring-slate-950'
          }`}>
            <Camera className="h-6 w-6 text-white" />
          </div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">Optik Oku</span>
        </button>

        {/* 4. Optik Bas */}
        <button
          onClick={() => setActiveTab('generate-omr')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold transition-all ${
            activeTab === 'generate-omr' || activeTab === 'generator' 
              ? 'text-indigo-600 dark:text-indigo-400 font-bold' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Printer className={`h-5 w-5 mb-0.5 ${activeTab === 'generate-omr' || activeTab === 'generator' ? 'stroke-[2.5]' : ''}`} />
          <span>Optik Bas</span>
        </button>

        {/* 5. Menü (Daha Fazla) */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold transition-all ${
            isMobileMenuOpen || activeTab === 'management' || activeTab === 'create-exam' 
              ? 'text-indigo-600 dark:text-indigo-400 font-bold' 
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
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
          {/* Karartma Arkalık */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Çekmece Gövdesi (Açık ve Koyu Tema Desteği) */}
          <div className="relative z-10 w-full max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700/80 p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 transition-colors">
            {/* Tutamaç Çubuğu */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />

            {/* Profil Başlığı */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-fuchsia-600 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-base">{currentUser.name}</div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    {currentUser.role === 'SUPER_ADMIN' ? 'Sistem Yöneticisi' : currentUser.role === 'INSTITUTION_ADMIN' ? 'Kurum Yöneticisi' : 'Öğretmen'}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Menü Seçenekleri Listesi */}
            <div className="space-y-2.5 py-4">
              {/* 1. Yeni Sınav Hazırla */}
              <button
                onClick={() => {
                  setActiveTab('create-exam');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 transition-all active:scale-[0.98] shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <PlusCircle className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">Yeni Sınav Oluştur</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-normal">Soru sayısı ve cevap anahtarı tanımla</div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0" />
              </button>

              {/* 2. Yönetim */}
              <button
                onClick={() => {
                  setActiveTab('management');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 transition-all active:scale-[0.98] shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 shrink-0">
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
              </button>

              {/* 3. Tema Değiştir */}
              <button
                onClick={() => {
                  onToggleTheme();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 transition-all active:scale-[0.98] shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/20 text-amber-500 dark:text-amber-400 shrink-0">
                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5 text-indigo-600" />}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">Görünüm Teması</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                      {theme === 'dark' ? 'Karanlık Mod (Aydınlığa geç)' : 'Aydınlık Mod (Karanlığa geç)'}
                    </div>
                  </div>
                </div>
                <span className="bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-xs font-bold px-2 py-0.5 rounded-lg">
                  {theme === 'dark' ? 'KOYU' : 'AÇIK'}
                </span>
              </button>

              {/* 4. Uygulamayı Yükle (PWA) */}
              {deferredPrompt && (
                <button
                  onClick={() => {
                    installApp();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/80 hover:bg-indigo-100 dark:bg-gradient-to-r dark:from-indigo-900/40 dark:to-fuchsia-900/40 border border-indigo-200 dark:border-indigo-500/30 transition-all active:scale-[0.98] shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shrink-0">
                      <Download className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">Telefona Uygulama Olarak Yükle</div>
                      <div className="text-xs text-indigo-600 dark:text-indigo-300 font-normal">Ana ekrana uygulama kısayolu ekle (PWA)</div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                </button>
              )}

              {/* 5. Çıkış Yap */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100/80 dark:bg-red-950/20 dark:hover:bg-red-950/40 border border-rose-200 dark:border-red-500/30 transition-all mt-4 active:scale-[0.98] shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-100 dark:bg-red-500/20 text-rose-600 dark:text-red-400 shrink-0">
                    <LogOut className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-rose-700 dark:text-red-300 text-sm">Güvenli Çıkış Yap</div>
                    <div className="text-xs text-rose-500 dark:text-red-400/80 font-normal">Mevcut oturumu sonlandır</div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-rose-400 dark:text-red-500 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
