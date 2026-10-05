import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-slate-200/80 dark:border-slate-800/80 py-6 px-4 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        {/* Left: Brand Logo & Slogan */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-white px-2.5 py-1 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center">
              <img 
                src="/opteno-logo.png" 
                alt="Opteno Logo" 
                className="h-5 w-auto object-contain"
              />
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Dijital Sınav Yönetim Sistemi
            </span>
          </div>
        </div>

        {/* Right: Copyright & Protection Text */}
        <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>© {currentYear} Opteno. Tüm hakları saklıdır.</span>
          </div>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
            <Sparkles className="h-3 w-3 text-indigo-500" />
            <span>Akıllı Optik Okuma & Sonuç Analiz Sistemi</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
