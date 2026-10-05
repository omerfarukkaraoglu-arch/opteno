import React, { useState } from 'react';
import { Settings, Megaphone, Sliders, Camera, ShieldAlert, CheckCircle, Save, RefreshCw, Database, Download, Upload } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { SiteSettings as ISiteSettings } from '../../types';

interface SiteSettingsProps {
  onSettingsUpdated?: () => void;
}

export const SiteSettings: React.FC<SiteSettingsProps> = ({ onSettingsUpdated }) => {
  const [settings, setSettings] = useState<ISiteSettings>(storageService.getSiteSettings());
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const handleExportBackup = () => {
    try {
      storageService.exportFullBackup();
      setBackupMsg('Tam sistem yedeği başarıyla indirildi (.json)!');
      setTimeout(() => setBackupMsg(null), 4000);
    } catch (err: any) {
      setBackupError('Yedek alınırken bir hata oluştu: ' + err.message);
      setTimeout(() => setBackupError(null), 4000);
    }
  };

  const handleImportBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('Seçilen yedek dosyası geri yüklenecektir. Mevcut verilerin üzerine yazılmasını onaylıyor musunuz?')) {
      e.target.value = '';
      return;
    }

    setIsImporting(true);
    setBackupMsg(null);
    setBackupError(null);

    const res = await storageService.importFullBackup(file);
    setIsImporting(false);
    e.target.value = '';

    if (res.success) {
      setBackupMsg(res.message);
      setSettings(storageService.getSiteSettings());
      if (onSettingsUpdated) onSettingsUpdated();
      setTimeout(() => setBackupMsg(null), 5000);
    } else {
      setBackupError(res.message);
      setTimeout(() => setBackupError(null), 5000);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSiteSettings(settings);
    setSavedMessage('Site ayarları başarıyla kaydedildi!');
    if (onSettingsUpdated) {
      onSettingsUpdated();
    }
    setTimeout(() => {
      setSavedMessage(null);
    }, 3500);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Tüm site ayarlarını fabrika varsayılanlarına döndürmek istediğinizden emin misiniz?')) {
      const defaults: ISiteSettings = {
        siteTitle: 'OpticOk',
        siteSubtitle: 'Kameralı Akıllı Optik Okuma Sistemi',
        logoText: 'OpticOk',
        announcementText: '📢 Sistemimiz 2026-2027 Eğitim Öğretim Yılı Güncellemeleri ile Yayındadır!',
        isAnnouncementActive: true,
        netPenaltyRatio: 4,
        defaultOptionCount: 5,
        cameraResolution: 'HD',
        enableAutoScan: true,
        maintenanceMode: false,
      };
      setSettings(defaults);
      storageService.saveSiteSettings(defaults);
      setSavedMessage('Ayarlar varsayılan değerlere sıfırlandı.');
      if (onSettingsUpdated) onSettingsUpdated();
      setTimeout(() => setSavedMessage(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-indigo-400" /> Site Yapılandırma & Ayarlar
          </h2>
          <p className="text-xs text-slate-400">
            Sistem geneli varsayılan kuralları, marka bilgilerini, duyuru yayınlarını ve kamera ayarlarını yönetin.
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          className="btn btn-secondary text-xs flex items-center gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Varsayılanlara Dön
        </button>
      </div>

      {savedMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          {savedMessage}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Marka ve Başlık Ayarları */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="font-display text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-indigo-400" /> Marka & Başlık Özelleştirmeleri
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Site Ana Başlığı</label>
              <input
                type="text"
                value={settings.siteTitle}
                onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                className="input-field text-xs"
                placeholder="ör. OpticOk"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Logo Metni</label>
              <input
                type="text"
                value={settings.logoText}
                onChange={(e) => setSettings({ ...settings, logoText: e.target.value })}
                className="input-field text-xs"
                placeholder="ör. OpticOk"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Site Alt Başlığı / Slogan</label>
              <input
                type="text"
                value={settings.siteSubtitle}
                onChange={(e) => setSettings({ ...settings, siteSubtitle: e.target.value })}
                className="input-field text-xs"
                placeholder="ör. Kameralı Akıllı Optik Okuma Sistemi"
              />
            </div>
          </div>
        </div>

        {/* 2. Duyuru Yayınlama */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-amber-400" /> Genel Duyuru Yayınlama
            </h3>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={settings.isAnnouncementActive}
                onChange={(e) => setSettings({ ...settings, isAnnouncementActive: e.target.checked })}
                className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
              />
              Duyuruyu Göster
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Duyuru Mesajı</label>
            <textarea
              rows={2}
              value={settings.announcementText}
              onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
              className="input-field text-xs resize-none"
              placeholder="Tüm kurum adminleri ve öğretmenlerin göreceği duyuru mesajı..."
            />
          </div>
        </div>

        {/* 3. Sınav Değerlendirme Kuralları */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="font-display text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-emerald-400" /> Sınav & Net Hesaplama Standartları
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Yanlış-Doğru Götürme Oranı (Net Kuralı)</label>
              <select
                value={settings.netPenaltyRatio}
                onChange={(e) => setSettings({ ...settings, netPenaltyRatio: Number(e.target.value) })}
                className="input-field text-xs bg-slate-900"
              >
                <option value={4}>4 Yanlış 1 Doğruyu Götürür (TYT / YKS Standart)</option>
                <option value={3}>3 Yanlış 1 Doğruyu Götürür (LGS / Ortaokul Standart)</option>
                <option value={0}>Yanlışlar Doğruyu Götürmez (Sadece Doğrular Sayılır)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Varsayılan Şık Sayısı</label>
              <select
                value={settings.defaultOptionCount}
                onChange={(e) => setSettings({ ...settings, defaultOptionCount: Number(e.target.value) })}
                className="input-field text-xs bg-slate-900"
              >
                <option value={4}>4 Şıklı (A, B, C, D)</option>
                <option value={5}>5 Şıklı (A, B, C, D, E)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Kamera & Optik Okuma Ayarları */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="font-display text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
            <Camera className="h-4 w-4 text-fuchsia-400" /> Kamera & Tarayıcı Motoru Ayarları
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Varsayılan Çözünürlük Hassasiyeti</label>
              <select
                value={settings.cameraResolution}
                onChange={(e) => setSettings({ ...settings, cameraResolution: e.target.value as any })}
                className="input-field text-xs bg-slate-900"
              >
                <option value="AUTO">Otomatik (Cihaz Performansına Göre)</option>
                <option value="HD">HD (1280 x 720) - Dengeli Hız</option>
                <option value="FHD">Full HD (1920 x 1080) - Yüksek Hassasiyet</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.enableAutoScan}
                  onChange={(e) => setSettings({ ...settings, enableAutoScan: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                />
                Otomatik Hizalama ve Anlık Tarama Açık
              </label>
            </div>
          </div>
        </div>

        {/* 5. Bakım Modu */}
        <div className="glass-panel p-6 space-y-4 border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-400" /> Bakım & Erişim Modu
              </h3>
              <p className="text-xs text-slate-400">
                Bakım moduna alındığında sadece SuperAdmin sisteme erişebilir. Kurum adminleri bilgilendirilir.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="rounded bg-slate-900 border-slate-700 text-amber-600 focus:ring-amber-500 h-4 w-4 cursor-pointer"
              />
              {settings.maintenanceMode ? 'Bakım Modu AKTİF' : 'Bakım Modu Kapalı'}
            </label>
          </div>
        </div>

        {/* 6. Sistem Yedekleme & Geri Yükleme (Full Backup & Restore) */}
        <div className="glass-panel p-6 space-y-4 border-l-4 border-indigo-500">
          <div className="border-b border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-400" /> Sistem Yedekleme & Geri Yükleme (Veri Güvenliği)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tüm sınavları, öğrenci listelerini, optik okuma sonuçlarını ve sistem ayarlarını tek tıkla dışa aktarın veya geri yükleyin.
              </p>
            </div>
          </div>

          {backupMsg && (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              {backupMsg}
            </div>
          )}

          {backupError && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
              {backupError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Download className="h-4 w-4 text-indigo-400" /> Sistem Yedeğini İndir
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Tüm veri tabanınızı (sınavlar, optik okuma kayıtları, kurum ve öğrenciler) tek bir JSON dosyası olarak bilgisayarınıza yedekler.
              </p>
              <button
                type="button"
                onClick={handleExportBackup}
                className="btn btn-secondary text-xs py-2 px-4 flex items-center gap-2 text-indigo-300 border-indigo-500/30 hover:bg-indigo-950/40 font-bold cursor-pointer transition-all"
              >
                <Download className="h-3.5 w-3.5" /> Tam Yedeği İndir (.json)
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Upload className="h-4 w-4 text-emerald-400" /> Yedekten Geri Yükle
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Daha önce indirdiğiniz bir `.json` yedek dosyasını seçerek sistemdeki tüm verileri eksiksiz geri yükleyin.
              </p>
              <label className="btn btn-primary text-xs py-2 px-4 inline-flex items-center gap-2 font-bold cursor-pointer transition-all">
                <Upload className="h-3.5 w-3.5" /> {isImporting ? 'Yükleniyor...' : 'Yedek Dosyası Seç (.json)'}
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportBackupFile}
                  disabled={isImporting}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <button type="submit" className="btn btn-primary text-sm px-6 py-2.5 flex items-center gap-2">
            <Save className="h-4 w-4" /> Tüm Değişiklikleri Kaydet
          </button>
        </div>
      </form>
    </div>
  );
};
