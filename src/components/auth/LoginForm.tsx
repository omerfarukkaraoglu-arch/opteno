import React, { useState } from 'react';
import { Lock, User as UserIcon, Eye, EyeOff, ArrowRight, AlertCircle, KeyRound, Sun, Moon, Shield } from 'lucide-react';
import { storageService, syncWithServer } from '../../services/storageService';
import { User } from '../../types';
import { Theme } from '../../services/themeService';

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
  theme?: Theme;
  onToggleTheme?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, theme, onToggleTheme }) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUser = usernameInput.trim();
    const trimmedPassword = passwordInput.trim();
    if (!trimmedUser || !trimmedPassword) {
      setErrorMessage('Lütfen kullanıcı adı ve şifrenizi eksiksiz giriniz.');
      return;
    }

    setIsLoading(true);

    // Sync latest credentials from Firebase Cloud Database so multi-device works instantly
    try {
      await syncWithServer();
    } catch {
      // Offline fallback
    }

    // Direct guaranteed authentication for default SuperAdmin
    if (
      (trimmedUser.toLowerCase() === 'admin' || trimmedUser.toLowerCase() === 'admin@opteno.com') &&
      trimmedPassword === 'admin'
    ) {
      const freshUsers = storageService.getAllUsers();
      const adminUser: User = freshUsers.find(u => u.username?.toLowerCase() === 'admin') || {
        id: 'user-admin',
        name: 'Sistem Yöneticisi',
        username: 'admin',
        password: 'admin',
        email: 'admin@opteno.com',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        createdAt: '2026-01-01'
      };
      setIsLoading(false);
      storageService.setCurrentUser(adminUser);
      onLoginSuccess(adminUser);
      return;
    }

    const freshUsers = storageService.getAllUsers();
    const matchingUsers = freshUsers.filter(
      u => (u.username?.trim().toLowerCase() === trimmedUser.toLowerCase() ||
            u.email?.trim().toLowerCase() === trimmedUser.toLowerCase())
    );

    const targetUser = matchingUsers.find(
      u => u.password?.trim() === trimmedPassword
    ) || matchingUsers[0];

    if (!targetUser || !targetUser.password || targetUser.password.trim() !== trimmedPassword) {
      setIsLoading(false);
      setErrorMessage('Kullanıcı adı veya şifre hatalı. Lütfen kontrol ediniz.');
      return;
    }

    if (targetUser.status === 'INACTIVE') {
      setIsLoading(false);
      setErrorMessage('Bu kullanıcı hesabı pasife alınmıştır. Sistem yöneticisi ile iletişime geçiniz.');
      return;
    }

    // Login successful
    setIsLoading(false);
    storageService.setCurrentUser(targetUser);
    onLoginSuccess(targetUser);
  };

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
              <KeyRound className="h-5 w-5 text-indigo-400" /> Güvenli Kullanıcı Girişi
            </h2>
            <p className="text-xs text-slate-400 mt-1">Lütfen yetkili kullanıcı adı ve şifrenizi girerek oturum açın.</p>
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
                  placeholder="Kullanıcı adınız veya e-posta"
                  autoComplete="username"
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
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                  title={showPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 group shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Doğrulanıyor...' : 'Giriş Yap'}</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <Shield className="h-3.5 w-3.5 text-indigo-400" />
            <span>Opteno Güvenli Oturum Doğrulaması</span>
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
