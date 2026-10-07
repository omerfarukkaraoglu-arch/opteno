import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Users, FileText, CheckCircle, Plus, Search, MapPin, Phone, Mail, ChevronRight, Settings, UserPlus, Shield, Trash2, Eye, Calendar, Sparkles, Download, Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { studentExcelService } from '../../services/studentExcelService';
import { pdfService } from '../../services/pdfService';
import { Institution, Student, Exam, User } from '../../types';
import { PersonnelManagement } from '../management/PersonnelManagement';
import { SiteSettings } from '../management/SiteSettings';

interface SuperAdminDashProps {
  currentUser?: User;
  onNavigateToTab?: (tab: string) => void;
}

export const SuperAdminDash: React.FC<SuperAdminDashProps> = ({ currentUser, onNavigateToTab }) => {
  const [activeSubTab, setActiveSubTab] = useState<'INSTITUTIONS' | 'PERSONNEL' | 'STUDENTS' | 'EXAMS' | 'SITE_SETTINGS'>('INSTITUTIONS');

  const [institutions, setInstitutions] = useState<Institution[]>(storageService.getInstitutions());
  const [students, setStudents] = useState<Student[]>(storageService.getStudents());
  const [exams, setExams] = useState<Exam[]>(storageService.getExams());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentInstId, setSelectedStudentInstId] = useState<string>('ALL');
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');
  const [studentImportSuccessMsg, setStudentImportSuccessMsg] = useState<string | null>(null);

  const handleSuperAdminStudentExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const targetInstId = selectedStudentInstId !== 'ALL' ? selectedStudentInstId : (institutions[0]?.id || 'inst-1');
    const targetInst = institutions.find(i => i.id === targetInstId);

    try {
      const { importedCount, createdClassesCount } = await studentExcelService.importStudentsFromFile(file, targetInstId);
      if (importedCount > 0) {
        reloadData();
        const classMsg = createdClassesCount > 0 ? ` (${createdClassesCount} yeni sınıf oluşturuldu)` : '';
        setStudentImportSuccessMsg(`"${targetInst?.name || 'Kurum'}" için ${importedCount} adet öğrenci Excel'den yüklendi!${classMsg}`);
      } else {
        alert('Yüklenen dosyada geçerli öğrenci verisi bulunamadı.');
      }
      setTimeout(() => setStudentImportSuccessMsg(null), 4000);
    } catch (err) {
      console.error(err);
      alert('Dosya okunurken bir hata oluştu.');
    }
    e.target.value = '';
  };

  // Modals
  const [showAddInstModal, setShowAddInstModal] = useState(false);
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [selectedInstDetails, setSelectedInstDetails] = useState<Institution | null>(null);
  const [instToDelete, setInstToDelete] = useState<Institution | null>(null);
  const [isDeletingInst, setIsDeletingInst] = useState(false);

  // Auto-refresh when background sync or direct storage updates occur
  React.useEffect(() => {
    const handleUpdate = () => {
      reloadData();
    };
    window.addEventListener('opticok-data-updated', handleUpdate);
    return () => window.removeEventListener('opticok-data-updated', handleUpdate);
  }, []);

  // New Institution Form State
  const [instName, setInstName] = useState('');
  const [instCity, setInstCity] = useState('İstanbul');
  const [instPhone, setInstPhone] = useState('');
  const [instEmail, setInstEmail] = useState('');
  const [instLogo, setInstLogo] = useState<string | undefined>(undefined);
  const [adminName, setAdminName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // New Exam Form State
  const [examInstId, setExamInstId] = useState<string>(institutions[0]?.id || '');
  const [examTitle, setExamTitle] = useState('');
  const [examCode, setExamCode] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);

  const activeUser = currentUser || storageService.getCurrentUser();

  const reloadData = () => {
    setInstitutions(storageService.getInstitutions());
    setStudents(storageService.getStudents());
    setExams(storageService.getExams());
  };

  const totalStudentsCount = institutions.reduce((sum, i) => sum + i.studentCount, 0);
  const totalExamsCount = institutions.reduce((sum, i) => sum + i.examCount, 0);

  // Create Institution & Admin Account
  const handleAddInstitution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instName) return;

    const instId = `inst-${Date.now()}`;
    const newInst: Institution = {
      id: instId,
      name: instName,
      code: `INST-${Math.floor(100 + Math.random() * 900)}`,
      city: instCity,
      phone: instPhone || '0212 000 0000',
      email: instEmail || `info@${instName.toLowerCase().replace(/\s+/g, '')}.com`,
      logoUrl: instLogo,
      studentCount: 0,
      examCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'ACTIVE'
    };

    storageService.addInstitution(newInst);

    // Create default Institution Admin if any admin field provided
    if (adminName || adminUsername || adminPassword) {
      const uName = (adminUsername || `admin_${instName.toLowerCase().replace(/[^a-z0-9]/g, '')}`).trim();
      const uPass = (adminPassword || 'kurum123pass').trim();
      const newAdmin: User = {
        id: `user-${Date.now()}`,
        name: (adminName || adminUsername || `${instName} Yöneticisi`).trim(),
        username: uName,
        password: uPass,
        email: instEmail?.trim() || `${uName}@opteno.com`,
        phone: instPhone?.trim(),
        role: 'INSTITUTION_ADMIN',
        institutionId: instId,
        institutionName: instName,
        status: 'ACTIVE',
        createdAt: new Date().toISOString().split('T')[0]
      };
      storageService.addUser(newAdmin);
    }

    reloadData();
    setShowAddInstModal(false);
    setInstName('');
    setInstPhone('');
    setInstEmail('');
    setInstLogo(undefined);
    setAdminName('');
    setAdminUsername('');
    setAdminPassword('');
  };

  // Delete Institution Trigger
  const handleDeleteInstitution = (inst: Institution) => {
    setInstToDelete(inst);
  };

  const handleConfirmDeleteInstitution = async () => {
    if (!instToDelete) return;
    setIsDeletingInst(true);
    try {
      await storageService.deleteInstitution(instToDelete.id);
      if (selectedInstDetails?.id === instToDelete.id) {
        setSelectedInstDetails(null);
      }
      reloadData();
    } catch (err) {
      console.error('Kurum silinirken hata oluştu:', err);
    } finally {
      setIsDeletingInst(false);
      setInstToDelete(null);
    }
  };

  // Create Exam
  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle) return;

    const targetInst = institutions.find(i => i.id === examInstId);
    const newExam: Exam = {
      id: `exam-${Date.now()}`,
      institutionId: examInstId,
      institutionName: targetInst?.name || 'Genel Sınav',
      title: examTitle,
      examCode: examCode || `EXAM-${Math.floor(100 + Math.random() * 900)}`,
      date: examDate,
      totalQuestions: 40,
      totalExamsScanned: 0,
      isStudentSpecific: true,
      createdAt: new Date().toISOString().split('T')[0],
      subjects: [
        {
          id: `sbj-${Date.now()}-1`,
          name: 'Türkçe',
          questionCount: 20,
          optionCount: 5,
          correctAnswers: ['A', 'B', 'C', 'D', 'E', 'A', 'B', 'C', 'D', 'E', 'A', 'B', 'C', 'D', 'E', 'A', 'B', 'C', 'D', 'E']
        },
        {
          id: `sbj-${Date.now()}-2`,
          name: 'Matematik',
          questionCount: 20,
          optionCount: 5,
          correctAnswers: ['C', 'D', 'A', 'B', 'E', 'C', 'D', 'A', 'B', 'E', 'C', 'D', 'A', 'B', 'E', 'C', 'D', 'A', 'B', 'E']
        }
      ]
    };

    storageService.addExam(newExam);
    reloadData();
    setShowAddExamModal(false);
    setExamTitle('');
    setExamCode('');
  };

  const filteredInstitutions = institutions.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Sub Navigation Bar for SuperAdmin */}
      <div className="glass-panel p-2 rounded-xl flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max p-1 bg-slate-900/60 rounded-2xl border border-slate-800">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveSubTab('INSTITUTIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'INSTITUTIONS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="h-4 w-4" /> Kurumlar Paneli
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveSubTab('PERSONNEL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'PERSONNEL' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="h-4 w-4 text-amber-400" /> Kurum Personelleri & Girişler
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveSubTab('STUDENTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'STUDENTS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4 text-emerald-400" /> Tüm Öğrenciler
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveSubTab('EXAMS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'EXAMS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="h-4 w-4 text-fuchsia-400" /> Sınav Açma & Yönetimi
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveSubTab('SITE_SETTINGS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'SITE_SETTINGS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="h-4 w-4 text-cyan-400" /> Site Düzenlemeleri
          </motion.button>
        </div>
      </div>

      {/* SUB-TAB 1: INSTITUTIONS */}
      {activeSubTab === 'INSTITUTIONS' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 border-l-4 border-indigo-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Toplam Kayıtlı Kurum</p>
                  <h3 className="font-display text-2xl font-extrabold text-white mt-1">{institutions.length}</h3>
                </div>
                <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="glass-panel p-5 border-l-4 border-emerald-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Toplam Kayıtlı Öğrenci</p>
                  <h3 className="font-display text-2xl font-extrabold text-white mt-1">{totalStudentsCount}</h3>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Users className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="glass-panel p-5 border-l-4 border-fuchsia-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Toplam Sınav & Optik Okuma</p>
                  <h3 className="font-display text-2xl font-extrabold text-white mt-1">{totalExamsCount}</h3>
                </div>
                <div className="h-10 w-10 rounded-xl bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-400">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="glass-panel p-5 border-l-4 border-amber-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Sistem Durumu</p>
                  <h3 className="font-display text-lg font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4" /> %99.9 Aktif
                  </h3>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Institutions Panel Header & Search */}
          <div className="glass-panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display text-lg font-bold text-white">Tüm Kurumlar Paneli</h2>
                <p className="text-xs text-slate-400">Sisteme tanımlı okul, dershane ve özel kurumların genel yönetimi</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Kurum veya Şehir Ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10 text-xs py-2 w-60"
                  />
                </div>

                <button
                  onClick={() => setShowAddInstModal(true)}
                  className="btn btn-primary text-xs py-2 flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Yeni Kurum & Admin Ekle
                </button>
              </div>
            </div>

            {/* Institutions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInstitutions.map((inst) => {
                const instPersonnel = storageService.getUsersByInstitution(inst.id);
                const instAdmin = instPersonnel.find(u => u.role === 'INSTITUTION_ADMIN');
                return (
                  <div key={inst.id} className="glass-card p-5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="badge badge-primary text-[10px]">{inst.code}</span>
                        <span className="badge badge-success text-[10px]">AKTİF</span>
                      </div>

                      <div className="flex items-center gap-3">
                        {inst.logoUrl ? (
                          <div className="w-10 h-10 rounded-lg bg-white p-1 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                            <img src={inst.logoUrl} alt={inst.name} className="max-w-full max-h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-800 p-2 border border-slate-700 flex items-center justify-center shrink-0 text-slate-400">
                            <Building2 className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-display font-bold text-base text-white">{inst.name}</h3>
                          {instAdmin && (
                            <p className="text-xs text-amber-300 font-semibold mt-0.5">
                              Yönetici: {instAdmin.name} ({instAdmin.username})
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                        <p className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" /> {inst.city}
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-slate-400" /> {inst.phone}
                        </p>
                        <p className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-slate-400" /> {inst.email}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-400">{inst.studentCount} Öğrenci | {instPersonnel.length} Personel</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedInstDetails(inst)}
                          className="text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          Detaylar <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteInstitution(inst)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all cursor-pointer border border-red-500/20"
                          title="Kurumu Sil"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PERSONNEL MANAGEMENT */}
      {activeSubTab === 'PERSONNEL' && (
        <PersonnelManagement currentUser={activeUser} onPersonnelUpdated={reloadData} />
      )}

      {/* SUB-TAB 3: STUDENTS MANAGEMENT */}
      {activeSubTab === 'STUDENTS' && (
        <div className="glass-panel p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-white">Öğrenci Yönetimi & Listesi</h2>
              <p className="text-xs text-slate-400">Kurum seçimi yaparak veya arama kriteri belirterek öğrencileri listeleyin</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Sample Template Download */}
              <button
                onClick={() => {
                  const selectedInst = institutions.find(i => i.id === selectedStudentInstId);
                  studentExcelService.downloadSampleTemplate(selectedInst?.name || 'OpticOk');
                }}
                className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 cursor-pointer text-emerald-400 hover:text-white border-emerald-500/30"
                title="Excel Örnek Şablonu İndir (.xlsx)"
              >
                <Download className="h-3.5 w-3.5 text-emerald-400" />
                <span>Örnek Şablon İndir (.xlsx)</span>
              </button>

              {/* Excel Batch Upload Button */}
              <label className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 cursor-pointer text-emerald-400 hover:text-emerald-300 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20">
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                <span>Excel İle Toplu Yükle</span>
                <input
                  type="file"
                  accept=".csv,.txt,.xls,.xlsx"
                  onChange={handleSuperAdminStudentExcelUpload}
                  className="hidden"
                />
              </label>

              {/* Institution Filter Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-400">Kurum Filtresi:</label>
                <select
                  value={selectedStudentInstId}
                  onChange={(e) => setSelectedStudentInstId(e.target.value)}
                  className="input-field text-xs py-2 bg-slate-900 border-slate-700 min-w-[200px]"
                >
                  <option value="ALL">Tüm Kurumlar (Hepsi)</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name} ({inst.city})</option>
                  ))}
                </select>
              </div>

              {/* Student Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Öğrenci Adı, No veya Sınıf Ara..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  className="input-field pl-10 text-xs py-2 w-64"
                />
              </div>
            </div>
          </div>

          {studentImportSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-400 text-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{studentImportSuccessMsg}</span>
            </div>
          )}

          {/* Filtered Students Summary */}
          {(() => {
            const filteredStudents = students.filter(s => {
              if (selectedStudentInstId !== 'ALL' && s.institutionId !== selectedStudentInstId) {
                return false;
              }
              const term = studentSearchTerm.trim().toLowerCase();
              if (!term) return true;
              return (
                s.firstName.toLowerCase().includes(term) ||
                s.lastName.toLowerCase().includes(term) ||
                s.studentNo.includes(term) ||
                s.className.toLowerCase().includes(term)
              );
            });

            return (
              <>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>
                    Gösterilen: <strong className="text-indigo-400">{filteredStudents.length}</strong> / Toplam {students.length} Öğrenci
                  </span>
                  {selectedStudentInstId !== 'ALL' && (
                    <button
                      onClick={() => setSelectedStudentInstId('ALL')}
                      className="text-amber-400 hover:underline"
                    >
                      Filtreyi Temizle
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold">
                      <tr>
                        <th className="p-3">Öğrenci No</th>
                        <th className="p-3">Ad Soyad</th>
                        <th className="p-3">Sınıf</th>
                        <th className="p-3">Kurum Adı</th>
                        <th className="p-3 text-right">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredStudents.map(s => {
                        const inst = institutions.find(i => i.id === s.institutionId);
                        return (
                          <tr key={s.id} className="hover:bg-slate-900/40">
                            <td className="p-3 font-mono font-bold text-indigo-400">{s.studentNo}</td>
                            <td className="p-3 font-semibold text-white">{s.firstName} {s.lastName}</td>
                            <td className="p-3"><span className="badge badge-primary">{s.className}</span></td>
                            <td className="p-3 text-slate-400 font-semibold">{inst?.name || 'Bilinmiyor'}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => {
                                  if (window.confirm(`${s.firstName} ${s.lastName} adlı öğrenciyi silmek istiyor musunuz?`)) {
                                    storageService.deleteStudent(s.id);
                                    setStudents(storageService.getStudents());
                                  }
                                }}
                                className="text-red-400 hover:text-red-300 p-1"
                                title="Öğrenciyi Sil"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500 italic">
                            Seçilen kurum veya filtreye uygun öğrenci bulunamadı.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* SUB-TAB 4: EXAMS MANAGEMENT & CREATION */}
      {activeSubTab === 'EXAMS' && (
        <div className="glass-panel p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-fuchsia-400" /> Sınav Tanımlama & Genel Yönetim
              </h2>
              <p className="text-xs text-slate-400">SuperAdmin yetkisiyle istenen kuruma özel optik deneme sınavı açın.</p>
            </div>

            <button
              onClick={() => setShowAddExamModal(true)}
              className="btn btn-primary text-xs py-2 flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Yeni Sınav Aç
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map(e => (
              <div key={e.id} className="glass-card p-5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="badge badge-primary text-[10px]">{e.examCode}</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {e.date}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base text-white">{e.title}</h3>
                  <p className="text-xs text-indigo-400 mt-1 font-semibold">{e.institutionName}</p>

                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-300">
                    <div><strong>{e.totalQuestions}</strong> Soru</div>
                    <div><strong>{e.subjects.length}</strong> Ders</div>
                    <div><strong>{e.totalExamsScanned || 0}</strong> Okunan Optik</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={async () => {
                        const studentsList = storageService.getStudents(e.institutionId);
                        const pdf = await pdfService.generateOMRPDF(e, studentsList, 'A4');
                        pdf.save(`${e.examCode}_Optik_Form_A4.pdf`);
                      }}
                      className="btn btn-secondary py-1 px-2 text-[10.5px] flex items-center gap-1 text-indigo-300 border-indigo-500/30"
                      title="1 Sayfada 1 Tam Boy Optik Form"
                    >
                      <Download className="h-3 w-3" /> A4 İndir
                    </button>
                    <button
                      onClick={async () => {
                        const studentsList = storageService.getStudents(e.institutionId);
                        const pdf = await pdfService.generateOMRPDF(e, studentsList, 'A5');
                        pdf.save(`${e.examCode}_Optik_Form_A5_Tasarruf.pdf`);
                      }}
                      className="btn btn-secondary py-1 px-2 text-[10.5px] flex items-center gap-1 text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
                      title="1 Sayfada Altlı Üstlü 2 Optik Form (A5 Kesimli, %50 Kağıt Tasarrufu)"
                    >
                      <Download className="h-3 w-3" /> A5 İndir (2'li Tasarruf)
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (window.confirm(`"${e.title}" sınavını silmek istiyor musunuz?`)) {
                        storageService.deleteExam(e.id);
                        setExams(storageService.getExams());
                      }
                    }}
                    className="text-red-400 hover:text-red-300 p-1 flex items-center gap-1"
                    title="Sınavı Sil"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: SITE SETTINGS */}
      {activeSubTab === 'SITE_SETTINGS' && (
        <SiteSettings />
      )}

      {/* Add New Institution Modal */}
      <AnimatePresence>
        {showAddInstModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddInstModal(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 26, stiffness: 340 }}
              className="glass-panel relative z-10 max-w-md w-full p-6 sm:p-7 rounded-3xl border-slate-700/80 space-y-4 shadow-2xl bg-slate-900/90 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="font-display text-lg font-bold text-white">Yeni Kurum & Yönetici Hesabı Tanımla</h3>
              
              <form onSubmit={handleAddInstitution} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kurum / Okul Adı *</label>
                  <input
                    type="text"
                    required
                    value={instName}
                    onChange={(e) => setInstName(e.target.value)}
                    className="input-field text-xs rounded-xl"
                    placeholder="ör. Özel Çözüm Koleji"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Şehir</label>
                    <input
                      type="text"
                      value={instCity}
                      onChange={(e) => setInstCity(e.target.value)}
                      className="input-field text-xs rounded-xl"
                      placeholder="İstanbul"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Telefon</label>
                    <input
                      type="text"
                      value={instPhone}
                      onChange={(e) => setInstPhone(e.target.value)}
                      className="input-field text-xs rounded-xl"
                      placeholder="0212 555 0000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kurum E-posta</label>
                  <input
                    type="email"
                    value={instEmail}
                    onChange={(e) => setInstEmail(e.target.value)}
                    className="input-field text-xs rounded-xl"
                    placeholder="info@kurum.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kurum Logosu (İsteğe Bağlı)</label>
                  <div className="flex items-center gap-3">
                    {instLogo && (
                      <div className="w-12 h-12 rounded-xl bg-white p-1 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow">
                        <img src={instLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                    <label className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer rounded-xl">
                      <Upload className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{instLogo ? 'Logoyu Değiştir' : 'Logo Yükle'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => setInstLogo(evt.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    {instLogo && (
                      <button
                        type="button"
                        onClick={() => setInstLogo(undefined)}
                        className="text-xs text-rose-400 hover:underline"
                      >
                        Kaldır
                      </button>
                    )}
                  </div>
                </div>

                {/* Default Admin Info */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-2">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    <UserPlus className="h-3.5 w-3.5" /> Kurum Admin Hesabı
                  </h4>
                  <div>
                    <input
                      type="text"
                      placeholder="Yönetici Ad Soyad (ör. Ahmet Müdür)"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="input-field text-xs rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Kullanıcı Adı"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      className="input-field text-xs font-mono rounded-xl"
                    />
                    <input
                      type="text"
                      placeholder="Şifre"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="input-field text-xs font-mono text-emerald-300 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setShowAddInstModal(false)}
                    className="btn btn-secondary text-xs rounded-xl"
                  >
                    İptal
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    type="submit" 
                    className="btn btn-primary text-xs rounded-xl"
                  >
                    Kurumu & Hesabı Kaydet
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add New Exam Modal */}
      <AnimatePresence>
        {showAddExamModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddExamModal(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 26, stiffness: 340 }}
              className="glass-panel relative z-10 max-w-md w-full p-6 sm:p-7 rounded-3xl border-slate-700/80 space-y-4 shadow-2xl bg-slate-900/90"
            >
              <h3 className="font-display text-lg font-bold text-white">SuperAdmin Yetkisiyle Sınav Tanımla</h3>

              <form onSubmit={handleAddExam} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Hedef Kurum</label>
                  <select
                    value={examInstId}
                    onChange={(e) => setExamInstId(e.target.value)}
                    className="input-field text-xs bg-slate-900 rounded-xl"
                  >
                    {institutions.map(i => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sınav Adı *</label>
                  <input
                    type="text"
                    required
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    className="input-field text-xs rounded-xl"
                    placeholder="ör. 12. Sınıf TYT Deneme - 02"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Sınav Kodu</label>
                    <input
                      type="text"
                      value={examCode}
                      onChange={(e) => setExamCode(e.target.value)}
                      className="input-field text-xs font-mono rounded-xl"
                      placeholder="TYT-2026-02"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Tarih</label>
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="input-field text-xs bg-slate-900 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setShowAddExamModal(false)}
                    className="btn btn-secondary text-xs rounded-xl"
                  >
                    İptal
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    type="submit" 
                    className="btn btn-primary text-xs rounded-xl"
                  >
                    Sınavı Oluştur
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Institution Details Modal */}
      <AnimatePresence>
        {selectedInstDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInstDetails(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 26, stiffness: 340 }}
              className="glass-panel relative z-10 max-w-2xl w-full p-6 sm:p-7 rounded-3xl border-slate-700/80 space-y-4 shadow-2xl bg-slate-900/90 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  {selectedInstDetails.logoUrl ? (
                    <div className="w-12 h-12 rounded-2xl bg-white p-1 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow">
                      <img src={selectedInstDetails.logoUrl} alt={selectedInstDetails.name} className="max-w-full max-h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 p-2 border border-slate-700 flex items-center justify-center shrink-0 text-slate-400">
                      <Building2 className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-display text-lg font-bold text-white">{selectedInstDetails.name}</h3>
                    <p className="text-xs text-slate-400">{selectedInstDetails.city} | Kod: {selectedInstDetails.code}</p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedInstDetails(null)}
                  className="btn btn-secondary text-xs rounded-xl"
                >
                  Kapat
                </motion.button>
              </div>

              {/* Institution Logo Management in Details Modal */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Kurum Resmi Logosu</h4>
                  <p className="text-[11px] text-slate-400">Sınav derece listeleri ve öğrenci karnesi PDF çıktılarında kullanılır.</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer rounded-xl">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{selectedInstDetails.logoUrl ? 'Logoyu Güncelle' : 'Logo Yükle'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            const updatedLogo = evt.target?.result as string;
                            const updated = { ...selectedInstDetails, logoUrl: updatedLogo };
                            storageService.updateInstitution(updated);
                            setSelectedInstDetails(updated);
                            reloadData();
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {selectedInstDetails.logoUrl && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const updated = { ...selectedInstDetails, logoUrl: undefined };
                        storageService.updateInstitution(updated);
                        setSelectedInstDetails(updated);
                        reloadData();
                      }}
                      className="btn btn-secondary text-xs py-1.5 px-2.5 text-rose-400 hover:text-rose-300 border-rose-500/30 flex items-center gap-1 rounded-xl"
                      title="Logoyu Kaldır"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Kaldır
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Institution Personnel */}
              <div>
                <h4 className="text-xs font-bold text-indigo-400 mb-2">Kurum Yöneticileri ve Personeller</h4>
                <div className="space-y-2">
                  {storageService.getUsersByInstitution(selectedInstDetails.id).map(p => (
                    <div key={p.id} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">{p.name}</span> ({p.role === 'INSTITUTION_ADMIN' ? 'Kurum Yöneticisi' : 'Öğretmen'})
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Kullanıcı Adı: <strong className="text-indigo-300">{p.username || p.email}</strong> | Şifre: <strong className="text-emerald-400">{p.password || '******'}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delete Institution Footer Action */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Bu işlem kurumu ve bağlı tüm kayıtları buluttan kalıcı olarak siler.</span>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => handleDeleteInstitution(selectedInstDetails)}
                  className="btn btn-secondary text-xs py-2 px-3 text-red-400 hover:bg-red-500/20 border-red-500/30 flex items-center gap-1.5 cursor-pointer rounded-xl"
                >
                  <Trash2 className="h-4 w-4" /> Kurumu Tamamen Sil
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal for Institution Deletion */}
      <AnimatePresence>
        {instToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeletingInst && setInstToDelete(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="glass-panel relative z-10 max-w-md w-full p-6 sm:p-7 rounded-3xl border border-rose-500/30 bg-slate-900/95 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/25 shrink-0">
                  <Trash2 className="h-6 w-6 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">Kurumu Kalıcı Olarak Sil</h3>
                  <p className="text-xs text-rose-300 font-medium">Bu işlem geri alınamaz!</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/20 text-xs text-slate-300 space-y-2">
                <p>
                  <strong className="text-white font-bold font-display text-sm">"{instToDelete.name}"</strong> adlı kurumu silmek üzeresiniz.
                </p>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Bu işlem kurumu, kuruma ait tüm yönetici/öğretmen hesaplarını, sınıfları, öğrencileri ve sınav kayıtlarını hem yerel cihazdan hem de <strong>Firebase bulut veritabanından kalıcı olarak silecektir</strong>.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  disabled={isDeletingInst}
                  onClick={() => setInstToDelete(null)}
                  className="btn btn-secondary text-xs rounded-xl py-2.5 px-4 cursor-pointer"
                >
                  İptal
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  disabled={isDeletingInst}
                  onClick={handleConfirmDeleteInstitution}
                  className="btn btn-danger text-xs rounded-xl py-2.5 px-4 flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/30 disabled:opacity-50"
                >
                  {isDeletingInst ? (
                    <>
                      <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Buluttan Siliniyor...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Evet, Kalıcı Olarak Sil</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
