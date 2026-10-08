import React, { useState } from 'react';
import { Users, UserPlus, Search, Shield, Key, Copy, Check, Trash2, Edit3, Building2, Eye, EyeOff, Lock } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { User, UserRole, Institution } from '../../types';

interface PersonnelManagementProps {
  currentUser: User;
  onPersonnelUpdated?: () => void;
}

export const PersonnelManagement: React.FC<PersonnelManagementProps> = ({ currentUser, onPersonnelUpdated }) => {
  const [users, setUsers] = useState<User[]>(storageService.getAllUsers());
  const [institutions] = useState<Institution[]>(storageService.getInstitutions());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstId, setSelectedInstId] = useState<string>(
    currentUser.role === 'SUPER_ADMIN' ? 'ALL' : (currentUser.institutionId || '')
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('TEACHER');
  const [targetInstId, setTargetInstId] = useState<string>(
    currentUser.role === 'SUPER_ADMIN' ? (institutions[0]?.id || '') : (currentUser.institutionId || '')
  );
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal displaying credentials after creation
  const [createdCredential, setCreatedCredential] = useState<{ username: string; password: string; name: string } | null>(null);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';
    let result = '';
    for (let i = 0; i < 9; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPhone('');
    setRole('TEACHER');
    const defaultInst = currentUser.role === 'SUPER_ADMIN' ? (institutions[0]?.id || '') : (currentUser.institutionId || '');
    setTargetInstId(defaultInst);
    setUsername('');
    generateRandomPassword();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone || '');
    setRole(user.role);
    setTargetInstId(user.institutionId || (institutions[0]?.id || ''));
    setUsername(user.username || '');
    setPassword(user.password || '');
    setShowAddModal(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingUser && !username) {
      // Auto generate username suggestion
      const cleanName = val.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanName.length > 2) {
        setUsername(`${cleanName}_${Math.floor(10 + Math.random() * 89)}`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const selectedInst = institutions.find(i => i.id === targetInstId);

    if (editingUser) {
      const updated: User = {
        ...editingUser,
        name,
        email,
        phone,
        role,
        institutionId: role === 'SUPER_ADMIN' ? undefined : targetInstId,
        institutionName: role === 'SUPER_ADMIN' ? undefined : selectedInst?.name,
        username: username || editingUser.username,
        password: password || editingUser.password,
      };
      storageService.updateUser(updated);
    } else {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        phone,
        role,
        institutionId: role === 'SUPER_ADMIN' ? undefined : targetInstId,
        institutionName: role === 'SUPER_ADMIN' ? undefined : selectedInst?.name,
        username: username || `user_${Date.now().toString().slice(-4)}`,
        password: password || '12345678',
        status: 'ACTIVE',
        createdAt: new Date().toISOString().split('T')[0]
      };
      storageService.addUser(newUser);
      setCreatedCredential({
        name: newUser.name,
        username: newUser.username!,
        password: newUser.password!
      });
    }

    setUsers(storageService.getAllUsers());
    setShowAddModal(false);
    if (onPersonnelUpdated) onPersonnelUpdated();
  };

  const handleDelete = (userId: string) => {
    if (window.confirm('Bu personeli ve kullanıcı hesabını silmek istediğinize emin misiniz?')) {
      storageService.deleteUser(userId);
      setUsers(storageService.getAllUsers());
      if (onPersonnelUpdated) onPersonnelUpdated();
    }
  };

  const handleCopyCredentials = (user: User) => {
    const text = `OpticOk Giriş Bilgileri:\nKullanıcı Adı: ${user.username || user.email}\nŞifre: ${user.password || '******'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filter users based on role and selected institution
  const filteredUsers = users.filter(u => {
    // Institution filtering
    if (currentUser.role !== 'SUPER_ADMIN') {
      if (u.institutionId !== currentUser.institutionId) return false;
    } else if (selectedInstId !== 'ALL') {
      if (u.institutionId !== selectedInstId) return false;
    }

    // Search query
    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.institutionName && u.institutionName.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-400" /> Kurum Personelleri & Kullanıcı Girişleri
          </h2>
          <p className="text-xs text-slate-400">
            Kurum yöneticisi ve öğretmen hesaplarını oluşturun, kullanıcı adı ve şifrelerini yönetin.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          {currentUser.role === 'SUPER_ADMIN' && (
            <div className="relative w-full sm:w-auto">
              <select
                value={selectedInstId}
                onChange={(e) => setSelectedInstId(e.target.value)}
                className="input-field text-xs py-2 bg-slate-900 border-slate-700 pr-8 w-full sm:w-44"
              >
                <option value="ALL">Tüm Kurumlar</option>
                {institutions.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="relative w-full sm:w-auto flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Personel veya Kullanıcı Adı Ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 text-xs py-2 w-full sm:w-60"
            />
          </div>

          <button
            onClick={handleOpenAddModal}
            className="btn btn-primary text-xs py-2 px-3 sm:px-4 flex items-center justify-center gap-1.5 w-full sm:w-auto shrink-0"
          >
            <UserPlus className="h-4 w-4 shrink-0" /> <span>Yeni Personel / Kullanıcı Ekle</span>
          </button>
        </div>
      </div>

      {/* Personnel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((u) => (
          <div key={u.id} className="glass-card p-5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className={`badge text-[10px] ${
                  u.role === 'SUPER_ADMIN' ? 'badge-primary' : u.role === 'INSTITUTION_ADMIN' ? 'badge-warning' : 'badge-secondary'
                }`}>
                  {u.role === 'SUPER_ADMIN' ? 'Sistem Yöneticisi' : u.role === 'INSTITUTION_ADMIN' ? 'Kurum Yöneticisi' : 'Öğretmen'}
                </span>
                <span className="badge badge-success text-[10px]">AKTİF</span>
              </div>

              <h3 className="font-display font-bold text-base text-white">{u.name}</h3>

              {u.institutionName && (
                <p className="text-xs text-indigo-400 font-semibold mt-1 flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" /> {u.institutionName}
                </p>
              )}

              {/* Login Credentials Box */}
              <div className="mt-4 p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400 font-semibold flex items-center gap-1">
                    <Shield className="h-3 w-3 text-indigo-400" /> Kullanıcı Adı:
                  </span>
                  <span className="font-mono text-indigo-300 font-bold">{u.username || u.email.split('@')[0]}</span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400 font-semibold flex items-center gap-1">
                    <Key className="h-3 w-3 text-amber-400" /> Şifre:
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">{u.password || '••••••••'}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <button
                onClick={() => handleCopyCredentials(u)}
                className="text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer py-1"
              >
                {copiedId === u.id ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> <span className="text-emerald-400 font-semibold">Kopyalandı</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-400 shrink-0" /> <span>Bilgileri Kopyala</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => handleOpenEditModal(u)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
                  title="Düzenle"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                {u.id !== currentUser.id && (
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                    title="Sil"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Personnel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel max-w-lg w-full p-6 rounded-2xl border-slate-700">
            <h3 className="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-indigo-400" />
              {editingUser ? 'Personel Hesabını Düzenle' : 'Yeni Personel / Kullanıcı Tanımla'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ad Soyad *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="input-field text-xs"
                    placeholder="ör. Mustafa Öğretmen"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">E-posta Adresi *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field text-xs"
                    placeholder="ornek@kurum.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Hesap Rolü</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="input-field text-xs bg-slate-900"
                  >
                    <option value="TEACHER">Öğretmen</option>
                    <option value="INSTITUTION_ADMIN">Kurum Yöneticisi</option>
                    {currentUser.role === 'SUPER_ADMIN' && (
                      <option value="SUPER_ADMIN">Sistem Yöneticisi (SuperAdmin)</option>
                    )}
                  </select>
                </div>

                {currentUser.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Bağlı Kurum</label>
                    <select
                      value={targetInstId}
                      onChange={(e) => setTargetInstId(e.target.value)}
                      className="input-field text-xs bg-slate-900"
                    >
                      {institutions.map(inst => (
                        <option key={inst.id} value={inst.id}>{inst.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Telefon</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field text-xs"
                    placeholder="0555 000 0000"
                  />
                </div>
              </div>

              {/* Login Credentials Setup Box */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-indigo-400" /> Giriş Kimlik Bilgileri (Kullanıcı Adı & Şifre)
                  </h4>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] font-semibold text-amber-400 hover:underline flex items-center gap-1"
                  >
                    Rastgele Şifre Üret
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Kullanıcı Adı</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="input-field text-xs font-mono text-indigo-300"
                      placeholder="kullanici_adi"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Giriş Şifresi</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field text-xs font-mono text-emerald-300 pr-8"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-2.5 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  İptal
                </button>
                <button type="submit" className="btn btn-primary text-xs">
                  {editingUser ? 'Güncelle' : 'Personeli Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Created Credential Pop-up Banner / Modal */}
      {createdCredential && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border-emerald-500/40 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="h-6 w-6" />
            </div>

            <div>
              <h3 className="font-display text-lg font-bold text-white">Personel Hesabı Oluşturuldu!</h3>
              <p className="text-xs text-slate-300 mt-1">
                <strong>{createdCredential.name}</strong> için giriş kimlik bilgileri üretildi. Bu bilgileri kullanıcıya iletebilirsiniz.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-left text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Kullanıcı Adı:</span>
                <span className="text-indigo-400 font-bold">{createdCredential.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Şifre:</span>
                <span className="text-emerald-400 font-bold">{createdCredential.password}</span>
              </div>
            </div>

            <button
              onClick={() => {
                const text = `OpticOk Giriş Bilgileriniz:\nKullanıcı Adı: ${createdCredential.username}\nŞifre: ${createdCredential.password}`;
                navigator.clipboard.writeText(text);
                setCreatedCredential(null);
              }}
              className="btn btn-primary w-full text-xs py-2 flex items-center justify-center gap-2"
            >
              <Copy className="h-4 w-4" /> Bilgileri Kopyala & Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
