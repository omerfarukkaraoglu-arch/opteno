import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950 selection:bg-indigo-500 selection:text-white">
      {/* Top Right Theme Toggle with micro-interaction */}
      {onToggleTheme && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute top-4 right-4 z-20"
        >
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={onToggleTheme}
            className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-amber-400 border border-slate-700/80 backdrop-blur-md transition-colors text-xs font-semibold flex items-center justify-center cursor-pointer shadow-lg shadow-black/30"
            title={theme === 'dark' ? 'Aydınlık Moda Geç' : 'Karanlık Moda Geç'}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-indigo-400" />}
          </motion.button>
        </motion.div>
      )}

      {/* Floating Animated Ambient Glow Blobs */}
      <motion.div 
        animate={{ 
          x: [0, 25, 0, -25, 0],
          y: [0, -30, 0, 30, 0],
          scale: [1, 1.1, 0.95, 1.05, 1]
        }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/4 w-[420px] h-[420px] bg-indigo-600/20 rounded-full blur-[110px] pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          x: [0, -30, 0, 30, 0],
          y: [0, 35, 0, -35, 0],
          scale: [1, 0.95, 1.1, 0.9, 1]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-1/4 right-1/4 w-[460px] h-[460px] bg-fuchsia-600/18 rounded-full blur-[120px] pointer-events-none" 
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Brand Header with Spring entrance */}
        <motion.div 
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="text-center space-y-2"
        >
          <motion.div 
            whileHover={{ scale: 1.03, y: -2 }}
            transition={{ type: 'spring', stiffness: 350, damping: 20 }}
            className="inline-flex items-center justify-center bg-white rounded-3xl px-6 py-3 shadow-2xl shadow-indigo-950/40 border border-white/40 mb-1"
          >
            <img 
              src="/opteno-logo.png" 
              alt="Opteno - Dijital Sınav Yönetim Sistemi" 
              className="h-14 sm:h-16 w-auto object-contain filter drop-shadow-sm"
            />
          </motion.div>
        </motion.div>

        {/* Login Card with Spring scale-in */}
        <motion.div 
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.08 }}
          className="glass-panel p-8 sm:p-9 rounded-3xl border border-slate-700/60 shadow-2xl shadow-black/50 space-y-6 backdrop-blur-2xl bg-slate-900/75 relative overflow-hidden"
        >
          {/* Subtle top card glow line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/70 to-transparent" />

          <div className="border-b border-slate-800/90 pb-4">
            <h2 className="font-display text-xl font-bold text-white flex items-center gap-2.5">
              <span className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <KeyRound className="h-4 w-4" />
              </span>
              Güvenli Kullanıcı Girişi
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Lütfen yetkili kullanıcı adı ve şifrenizi girerek oturum açın.
            </p>
          </div>

          {/* Error Message with Shake Animation */}
          <AnimatePresence mode="wait">
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  x: [-8, 8, -6, 6, -3, 3, 0] 
                }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-medium flex items-center gap-2.5 shadow-lg shadow-rose-950/20"
              >
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kullanıcı Adı veya E-posta
              </label>
              <div className="relative group">
                <UserIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="input-field pl-10 text-xs py-3 font-mono text-indigo-200 bg-slate-950/60 border-slate-700/80 rounded-2xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-500"
                  placeholder="Kullanıcı adınız veya e-posta"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Giriş Şifresi
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="input-field pl-10 pr-10 text-xs py-3 font-mono text-emerald-200 bg-slate-950/60 border-slate-700/80 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-500"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  title={showPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={!isLoading ? { scale: 1.02, y: -1 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="btn btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 group shadow-xl shadow-indigo-600/30 rounded-2xl cursor-pointer disabled:opacity-60 relative overflow-hidden"
            >
              <span>{isLoading ? 'Doğrulanıyor...' : 'Giriş Yap'}</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
            </motion.button>
          </form>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <Shield className="h-3.5 w-3.5 text-indigo-400" />
            <span>Opteno Güvenli Oturum & Bulut Doğrulaması</span>
          </div>
        </motion.div>

        {/* Footer info with subtle fade-in */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-slate-500"
        >
          © {new Date().getFullYear()} Opteno • Dijital Sınav Yönetim Sistemi • Tüm Hakları Saklıdır
        </motion.p>
      </div>
    </div>
  );
};
