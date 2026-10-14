import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  LogOut,
  UserCog,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Building2,
  Save,
  Download
} from 'lucide-react';
import { User } from '../../types';
import { storageService } from '../../services/storageService';

export const getRoleLabel = (role: User['role']) =>
  role === 'SUPER_ADMIN' ? 'Sistem Yöneticisi' : role === 'INSTITUTION_ADMIN' ? 'Kurum Yöneticisi' : 'Öğretmen';

const getInitials = (name: string) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p.charAt(0).toLocaleUpperCase('tr-TR'))
    .join('');

/* ------------------------------------------------------------------ */
/* Profil Ayarları Penceresi                                          */
/* ------------------------------------------------------------------ */
interface ProfileSettingsModalProps {
  open: boolean;
  currentUser: User;
  onClose: () => void;
  onUserUpdated?: (user: User) => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  open,
  currentUser,
  onClose,
  onUserUpdated
}) => {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newPass2, setNewPass2] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pencere her açıldığında güncel bilgilerle doldur
  useEffect(() => {
    if (open) {
      setName(currentUser.name);
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setCurrentPass('');
      setNewPass('');
      setNewPass2('');
      setShowPass(false);
      setError(null);
      setSuccess(null);
    }
  }, [open, currentUser]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Ad Soyad alanı boş bırakılamaz.');
      return;
    }

    const wantsPasswordChange = newPass.length > 0 || newPass2.length > 0 || currentPass.length > 0;
    let password = currentUser.password;

    if (wantsPasswordChange) {
      const stored = (currentUser.password || '').trim();
      if (stored && currentPass.trim() !== stored) {
        setError('Mevcut şifreniz hatalı.');
        return;
      }
      if (newPass.trim().length < 4) {
        setError('Yeni şifre en az 4 karakter olmalıdır.');
        return;
      }
      if (newPass !== newPass2) {
        setError('Yeni şifreler birbiriyle eşleşmiyor.');
        return;
      }
      password = newPass.trim();
    }

    const updated: User = {
      ...currentUser,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      password
    };

    const exists = storageService.getAllUsers().some(u => u.id === updated.id);
    if (exists) {
      storageService.updateUser(updated);
    } else {
      storageService.addUser(updated);
    }
    storageService.setCurrentUser(updated);
    onUserUpdated?.(updated);

    setCurrentPass('');
    setNewPass('');
    setNewPass2('');
    setSuccess(wantsPasswordChange ? 'Profil bilgileriniz ve şifreniz güncellendi.' : 'Profil bilgileriniz güncellendi.');
  };

  const inputCls =
    'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition';
  const labelCls = 'block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            className="relative z-10 w-full sm:max-w-lg max-h-[92vh] overflow-y-auto clay-panel rounded-t-[28px] sm:rounded-[28px] p-5 sm:p-6 shadow-2xl"
          >
            {/* Başlık */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-tr from-indigo-600 to-fuchsia-600 text-white flex items-center justify-center font-black text-lg shadow-[0_8px_16px_rgba(79,70,229,0.35),inset_0_2px_4px_rgba(255,255,255,0.4)]">
                  {getInitials(currentUser.name)}
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white truncate">Profil Ayarları</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {getRoleLabel(currentUser.role)}
                    {currentUser.username ? ` · @${currentUser.username}` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl clay-card text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 pt-5">
              {currentUser.institutionName && (
                <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800/70 px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                  <Building2 className="h-4 w-4 shrink-0 text-indigo-500" />
                  <span className="truncate">Kurum: <b>{currentUser.institutionName}</b></span>
                </div>
              )}

              {/* Kişisel Bilgiler */}
              <div className="space-y-3">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Kişisel Bilgiler</div>
                <div>
                  <label className={labelCls}>Ad Soyad</label>
                  <input className={inputCls} value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>E-posta</label>
                    <input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Telefon</label>
                    <input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} placeholder="05xx xxx xx xx" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Kullanıcı Adı</label>
                  <input className={`${inputCls} opacity-60 cursor-not-allowed`} value={currentUser.username || '-'} disabled />
                  <p className="mt-1 text-[11px] text-slate-400">Kullanıcı adı yalnızca yönetici tarafından değiştirilebilir.</p>
                </div>
              </div>

              {/* Şifre Değiştir */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Şifre Değiştir</div>
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400"
                  >
                    {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showPass ? 'Gizle' : 'Göster'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 -mt-1">Şifrenizi değiştirmek istemiyorsanız bu alanları boş bırakın.</p>
                <div>
                  <label className={labelCls}>Mevcut Şifre</label>
                  <input type={showPass ? 'text' : 'password'} className={inputCls} value={currentPass} onChange={e => setCurrentPass(e.target.value)} autoComplete="current-password" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Yeni Şifre</label>
                    <input type={showPass ? 'text' : 'password'} className={inputCls} value={newPass} onChange={e => setNewPass(e.target.value)} autoComplete="new-password" />
                  </div>
                  <div>
                    <label className={labelCls}>Yeni Şifre (Tekrar)</label>
                    <input type={showPass ? 'text' : 'password'} className={inputCls} value={newPass2} onChange={e => setNewPass2(e.target.value)} autoComplete="new-password" />
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> {success}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
                <button type="button" onClick={onClose} className="btn btn-secondary text-sm py-2.5 px-4 rounded-xl">
                  Kapat
                </button>
                <button type="submit" className="btn btn-primary text-sm py-2.5 px-5 rounded-xl flex items-center justify-center gap-2">
                  <Save className="h-4 w-4" /> Kaydet
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/* ------------------------------------------------------------------ */
/* Sağ Üst Profil Menüsü                                              */
/* ------------------------------------------------------------------ */
interface ProfileMenuProps {
  currentUser: User;
  onLogout: () => void;
  onOpenMobileMenu: () => void;
  onOpenProfileSettings: () => void;
  deferredPrompt?: any;
  installApp?: () => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  currentUser,
  onLogout,
  onOpenMobileMenu,
  onOpenProfileSettings,
  deferredPrompt,
  installApp
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const handleClick = () => {
    // Telefonda alt çekmece, masaüstünde açılır menü
    if (window.matchMedia('(max-width: 767px)').matches) {
      onOpenMobileMenu();
    } else {
      setOpen(o => !o);
    }
  };

  return (
    <div className="relative">
      <motion.button
        type="button"
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleClick}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Profil Menüsü"
        className={`flex items-center gap-2.5 rounded-2xl clay-card pl-1.5 pr-2.5 sm:pr-3 py-1.5 text-xs cursor-pointer transition-all ${
          open ? 'ring-2 ring-indigo-500/40' : 'hover:border-indigo-500/50'
        }`}
      >
        <div className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-tr from-indigo-600 to-fuchsia-600 text-white flex items-center justify-center font-black text-[11px] shadow-[0_4px_10px_rgba(79,70,229,0.35),inset_0_2px_4px_rgba(255,255,255,0.35)]">
          {getInitials(currentUser.name)}
        </div>
        <div className="hidden 2xl:block text-left min-w-0 max-w-[150px]">
          <div className="font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">{currentUser.name}</div>
          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold truncate">{getRoleLabel(currentUser.role)}</div>
        </div>
        <ChevronDown
          className={`hidden md:block h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* Dışarı tıklayınca kapat */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 w-72 origin-top-right clay-panel rounded-2xl p-2 shadow-2xl"
            >
              {/* Kullanıcı Bilgisi */}
              <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-200 dark:border-slate-800 mb-1.5">
                <div className="h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-tr from-indigo-600 to-fuchsia-600 text-white flex items-center justify-center font-black text-sm">
                  {getInitials(currentUser.name)}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-slate-900 dark:text-white truncate">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {currentUser.email || (currentUser.username ? `@${currentUser.username}` : '')}
                  </div>
                  <span className="mt-1 inline-block rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    {getRoleLabel(currentUser.role)}
                  </span>
                </div>
              </div>

              {deferredPrompt && installApp && (
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    installApp();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Uygulamayı Yükle
                </button>
              )}

              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenProfileSettings();
                }}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <UserCog className="h-4 w-4 text-indigo-500" />
                Profil Ayarları
              </button>

              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Oturumu Kapat
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
