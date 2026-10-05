import React, { useState } from 'react';
import { Camera, Lock, User as UserIcon, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles, AlertCircle, Building2, KeyRound, Sun, Moon } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { User } from '../../types';
import { Theme } from '../../services/themeService';

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
  theme?: Theme;
  onToggleTheme?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, theme, onToggleTheme }) => {
  const siteSettings = storageService.getSiteSettings();
  const allUsers = storageService.getAllUsers();

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const targetUser = allUsers.find(
      u => (u.username?.toLowerCase() === usernameInput.trim().toLowerCase() ||
            u.email.toLowerCase() === usernameInput.trim().toLowerCase())
    );

    if (!targetUser) {
      setErrorMessage('Kullanıcı adı veya e-posta adresi sistemde bulunamadı.');
      return;
    }

    if (targetUser.password && targetUser.password !== passwordInput) {
      setErrorMessage('Girdiğiniz şifre hatalı. Lütfen tekrar deneyiniz.');
      return;
    }

    // Login successful
    storageService.setCurrentUser(targetUser);
    onLoginSuccess(targetUser);
  };

  const handleQuickDemoLogin = (user: User) => {
    storageService.setCurrentUser(user);
    onLoginSuccess(user);
  };

  const superAdminUser = allUsers.find(u => u.role === 'SUPER_ADMIN');
  const instAdminUser = allUsers.find(u => u.role === 'INSTITUTION_ADMIN');
  const teacherUser = allUsers.find(u => u.role === 'TEACHER');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Top Right Theme Toggle */}
      {onToggleTheme && (
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={onToggleTheme}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-amber-400 border border-slate-700 transition-all text-xs font-semibold flex items-center justify-center cursor-pointer shadow-lg"
            title={theme === 'dark' ? 'Aydınlık Moda Geç' : 'Karanlık Moda Geç'}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-indigo-600" />}
          </button>
        </div>
      )}

      {/* Background Decorative Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center bg-white rounded-2xl px-5 py-2.5 shadow-2xl border border-white/20 mb-2">
            <img 
              src="/opteno-logo.png" 
              alt="Opteno - Dijital Sınav Yönetim Sistemi" 
              className="h-14 sm:h-16 w-auto object-contain"
            />
          </div>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-indigo-400" /> Kullanıcı Girişi
            </h2>
            <p className="text-xs text-slate-400 mt-1">Lütfen kullanıcı adı ve şifrenizi girerek oturum açın.</p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kullanıcı Adı veya E-posta
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="input-field pl-9 text-xs py-2.5 font-mono text-indigo-300"
                  placeholder="superadmin veya admin@opticok.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Giriş Şifresi
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="input-field pl-9 pr-9 text-xs py-2.5 font-mono text-emerald-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 group shadow-lg shadow-indigo-600/30"
            >
              Giriş Yap <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Quick Demo Access Section */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Hızlı Demo Girişi:
              </span>
              <span className="text-[10px] text-slate-500">Tek tıkla giriş yapın</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {superAdminUser && (
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin(superAdminUser)}
                  className="p-2.5 rounded-xl bg-slate-900 border border-indigo-500/30 hover:border-indigo-500 text-left transition-all group"
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-400">
                    <ShieldCheck className="h-3.5 w-3.5" /> SuperAdmin
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">superadmin</div>
                </button>
              )}

              {instAdminUser && (
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin(instAdminUser)}
                  className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/30 hover:border-amber-500 text-left transition-all group"
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                    <Building2 className="h-3.5 w-3.5" /> Kurum Admini
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">ataturk_admin</div>
                </button>
              )}

              {teacherUser && (
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin(teacherUser)}
                  className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 hover:border-emerald-500 text-left transition-all group"
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <UserIcon className="h-3.5 w-3.5" /> Öğretmen
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">mustafa_mat</div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Opteno • Dijital Sınav Yönetim Sistemi • Tüm Hakları Saklıdır
        </p>
      </div>
    </div>
  );
};
