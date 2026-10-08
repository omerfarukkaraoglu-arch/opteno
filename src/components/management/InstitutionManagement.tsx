import React, { useState } from 'react';
import { Users, BookOpen, Plus, Trash2, Edit2, Search, Shield, UserPlus, FileSpreadsheet, Upload, Download, CheckCircle2, Building2, Image as ImageIcon, MapPin, Phone, Mail, Save, GraduationCap } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { studentExcelService } from '../../services/studentExcelService';
import { SchoolClass, Student, User, Institution, GlobalClassTemplate } from '../../types';
import { PersonnelManagement } from './PersonnelManagement';
import { StudentCumulativeReport } from '../results/StudentCumulativeReport';

export const InstitutionManagement: React.FC = () => {
  const currentUser = storageService.getCurrentUser();
  const instId = currentUser.institutionId || 'inst-1';

  const [activeTab, setActiveTab] = useState<'personnel' | 'classes' | 'students' | 'profile'>('personnel');
  const [classes, setClasses] = useState<SchoolClass[]>(storageService.getClasses(instId));
  const [students, setStudents] = useState<Student[]>(storageService.getStudents(instId));
  const [globalClasses, setGlobalClasses] = useState<GlobalClassTemplate[]>(storageService.getGlobalClasses());
  const [cumulativeStudentId, setCumulativeStudentId] = useState<string | null>(null);

  const [institution, setInstitution] = useState<Institution | undefined>(() => {
    return storageService.getInstitutions().find(i => i.id === instId) || {
      id: instId,
      name: currentUser.institutionName || 'Kurum',
      code: 'INST-001',
      city: 'İstanbul',
      phone: '',
      email: '',
      studentCount: 0,
      examCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'ACTIVE'
    };
  });

  const [logoPreview, setLogoPreview] = useState<string | undefined>(institution?.logoUrl);
  const [instNameInput, setInstNameInput] = useState(institution?.name || currentUser.institutionName || '');
  const [instCityInput, setInstCityInput] = useState(institution?.city || '');
  const [instPhoneInput, setInstPhoneInput] = useState(institution?.phone || '');
  const [instEmailInput, setInstEmailInput] = useState(institution?.email || '');
  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  // Add Class Form State
  const [showAddClass, setShowAddClass] = useState(false);
  const [classModalMode, setClassModalMode] = useState<'standard' | 'custom'>('standard');
  const [templateGradeFilter, setTemplateGradeFilter] = useState<number | 'ALL'>('ALL');
  const [newClassName, setNewClassName] = useState('');
  const [newGradeLevel, setNewGradeLevel] = useState(12);

  // Add Student Form & Excel Import State
  const [newStudent, setNewStudent] = useState({ firstName: '', lastName: '', studentNo: '', classId: '' });
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // Sync with background updates
  React.useEffect(() => {
    const handleUpdate = () => reloadData();
    window.addEventListener('opticok-data-updated', handleUpdate);
    return () => window.removeEventListener('opticok-data-updated', handleUpdate);
  }, [instId]);

  const reloadData = () => {
    setClasses(storageService.getClasses(instId));
    setStudents(storageService.getStudents(instId));
    setGlobalClasses(storageService.getGlobalClasses());
    const inst = storageService.getInstitutions().find(i => i.id === instId);
    if (inst) {
      setInstitution(inst);
      setLogoPreview(inst.logoUrl);
      setInstNameInput(inst.name);
      setInstCityInput(inst.city);
      setInstPhoneInput(inst.phone);
      setInstEmailInput(inst.email);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo dosya boyutu en fazla 2 MB olmalıdır.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      setLogoPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const currentInstList = storageService.getInstitutions();
    const existing = currentInstList.find(i => i.id === instId);

    const updated: Institution = {
      ...(existing || {
        id: instId,
        code: 'INST-001',
        studentCount: students.length,
        examCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'ACTIVE'
      }),
      name: instNameInput || existing?.name || 'Kurum',
      city: instCityInput,
      phone: instPhoneInput,
      email: instEmailInput,
      logoUrl: logoPreview
    };

    if (existing) {
      storageService.updateInstitution(updated);
    } else {
      storageService.addInstitution(updated);
    }

    if (currentUser.institutionName !== updated.name) {
      storageService.updateUser({ ...currentUser, institutionName: updated.name });
    }

    setInstitution(updated);
    setProfileSavedMsg('Kurum bilgileri ve logo başarıyla kaydedildi! Sınav PDF çıktılarınızda görüntülenecektir.');
    setTimeout(() => setProfileSavedMsg(null), 4000);
  };

  const handleStudentExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { importedCount, createdClassesCount } = await studentExcelService.importStudentsFromFile(file, instId);
      if (importedCount > 0) {
        reloadData();
        const classMsg = createdClassesCount > 0 ? ` (${createdClassesCount} yeni sınıf oluşturuldu)` : '';
        setImportSuccessMsg(`Excel'den ${importedCount} adet öğrenci başarıyla yüklendi!${classMsg}`);
      } else {
        alert('Yüklenen dosyada geçerli öğrenci verisi bulunamadı. Lütfen örnek şablonu inceleyiniz.');
      }
      setTimeout(() => setImportSuccessMsg(null), 4000);
    } catch (err) {
      console.error(err);
      alert('Dosya okunurken bir hata oluştu.');
    }
    e.target.value = '';
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newClassName.trim();
    if (!trimmed) return;

    if (classes.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      alert(`"${trimmed}" isimli sınıf kurumunuzda zaten tanımlıdır.`);
      return;
    }

    const newCls: SchoolClass = {
      id: `cls-${Date.now()}`,
      institutionId: instId,
      name: trimmed,
      gradeLevel: newGradeLevel,
      studentCount: 0
    };

    storageService.addClass(newCls);
    reloadData();
    setShowAddClass(false);
    setNewClassName('');
  };

  const handleQuickAddTemplateClass = (template: GlobalClassTemplate) => {
    if (classes.some(c => c.name.toLowerCase() === template.name.toLowerCase())) {
      alert(`"${template.name}" sınıfı kurumunuzda zaten tanımlıdır.`);
      return;
    }

    const newCls: SchoolClass = {
      id: `cls-${Date.now()}`,
      institutionId: instId,
      name: template.name,
      gradeLevel: template.gradeLevel,
      studentCount: 0
    };

    storageService.addClass(newCls);
    reloadData();
  };

  const handleDeleteClass = (classId: string) => {
    if (window.confirm('Bu sınıfı silmek istediğinize emin misiniz?')) {
      storageService.deleteClass(classId);
      reloadData();
    }
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedClass = classes.find(c => c.id === newStudent.classId);
    if (!selectedClass || !newStudent.firstName || !newStudent.lastName || !newStudent.studentNo) return;

    const student: Student = {
      id: `std-${Date.now()}`,
      institutionId: instId,
      classId: selectedClass.id,
      className: selectedClass.name,
      studentNo: newStudent.studentNo,
      firstName: newStudent.firstName,
      lastName: newStudent.lastName,
    };

    storageService.addStudent(student);
    reloadData();
    setShowAddStudent(false);
    setNewStudent({ firstName: '', lastName: '', studentNo: '', classId: '' });
  };

  const handleDeleteStudent = (studentId: string) => {
    if (window.confirm('Bu öğrenciyi silmek istediğinize emin misiniz?')) {
      storageService.deleteStudent(studentId);
      reloadData();
    }
  };

  const filteredStudents = students.filter(s =>
    s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentNo.includes(searchTerm)
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 space-y-6">
      <div className="glass-panel p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <Users className="h-6 w-6 text-indigo-400" /> {currentUser.institutionName || 'Kurum'} Yönetim Paneli
            </h2>
            <p className="text-xs text-slate-400 mt-1">Okulunuza bağlı yetkili personelleri, sınıfları ve öğrencileri yönetin.</p>
          </div>

          <div className="flex bg-slate-900/80 rounded-xl p-1 border border-slate-700/60 overflow-x-auto">
            <button
              onClick={() => setActiveTab('personnel')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'personnel' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="h-4 w-4 text-amber-400" /> Personeller & Girişler
            </button>

            <button
              onClick={() => setActiveTab('classes')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'classes' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="h-4 w-4" /> Sınıflar ({classes.length})
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'students' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" /> Öğrenciler ({students.length})
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'profile' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="h-4 w-4 text-emerald-400" /> Kurum Profili & Logo
            </button>
          </div>
        </div>

        {/* TAB 1: PERSONNEL MANAGEMENT */}
        {activeTab === 'personnel' && (
          <PersonnelManagement currentUser={currentUser} onPersonnelUpdated={reloadData} />
        )}

        {/* TAB 2: CLASSES MANAGEMENT */}
        {activeTab === 'classes' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-200">Kayıtlı Sınıf Listesi</h3>
              <button
                onClick={() => setShowAddClass(true)}
                className="btn btn-primary text-xs py-2 flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Yeni Sınıf Ekle
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {classes.map(cls => {
                const countInClass = students.filter(s => s.classId === cls.id).length;
                const isStandard = globalClasses.some(g => g.name.toLowerCase() === cls.name.toLowerCase());
                return (
                  <div key={cls.id} className="glass-card p-4 flex items-center justify-between border border-slate-800 rounded-xl hover:border-slate-700 transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-lg">{cls.name}</h4>
                        {isStandard && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            Standart
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{cls.gradeLevel}. Sınıf Seviyesi • {countInClass} Kayıtlı Öğrenci</p>
                    </div>
                    <button
                      onClick={() => handleDeleteClass(cls.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Sınıfı Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
              {classes.length === 0 && (
                <div className="col-span-full p-8 text-center glass-card border border-slate-800 rounded-2xl space-y-2">
                  <p className="text-xs text-slate-400">Henüz kurumunuza ait sınıf bulunmamaktadır.</p>
                  <button
                    onClick={() => setShowAddClass(true)}
                    className="btn btn-primary text-xs py-2 px-3 inline-flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" /> Standart Sınıflardan Seç ve Ekle
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: STUDENTS MANAGEMENT */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="İsim veya Okul No Ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10 text-xs py-2 w-64"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => studentExcelService.downloadSampleTemplate(currentUser.institutionName || 'Kurum')}
                  className="btn btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 text-slate-200 border-slate-700 hover:border-emerald-500"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-400" /> Örnek Şablon İndir (.xlsx)
                </button>

                <label className="btn btn-secondary text-xs py-2 px-3 cursor-pointer flex items-center gap-1.5 text-emerald-400 border-emerald-500/30 shrink-0">
                  <Upload className="h-3.5 w-3.5" /> Excel İle Toplu Yükle
                  <input
                    type="file"
                    accept=".csv,.txt,.tsv,.xlsx"
                    className="hidden"
                    onChange={handleStudentExcelUpload}
                  />
                </label>

                <button
                  onClick={() => setShowAddStudent(true)}
                  className="btn btn-primary text-xs py-2 px-3 flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Yeni Öğrenci (Tekli)
                </button>
              </div>
            </div>

            {importSuccessMsg && (
              <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 animate-fade-in mb-3">
                <CheckCircle2 className="h-4 w-4" /> {importSuccessMsg}
              </p>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-900/60 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Öğrenci No</th>
                    <th className="px-4 py-3">Adı Soyadı</th>
                    <th className="px-4 py-3">Sınıfı</th>
                    <th className="px-4 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-slate-800/40 transition-colors text-xs">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-400">{student.studentNo}</td>
                      <td className="px-4 py-3 font-semibold text-white">{student.firstName} {student.lastName}</td>
                      <td className="px-4 py-3"><span className="badge badge-primary">{student.className}</span></td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setCumulativeStudentId(student.id)}
                          className="text-indigo-400 hover:text-indigo-300 p-1 mr-2 transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Çoklu Deneme Gelişim Karnesi"
                        >
                          <GraduationCap className="h-4 w-4" />
                          <span className="text-[11px] font-semibold hidden sm:inline">Gelişim</span>
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student.id)}
                          className="text-slate-400 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic text-xs">Kayıtlı öğrenci bulunamadı.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: INSTITUTION PROFILE & LOGO */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {profileSavedMsg && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-400 text-xs shadow-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span className="font-semibold">{profileSavedMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Section */}
              <div className="lg:col-span-6 space-y-5">
                <form onSubmit={handleSaveProfile} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Building2 className="h-5 w-5 text-indigo-400" /> Kurum Bilgileri & Resmi Logo
                  </h3>

                  {/* Logo Upload Section */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Kurum Logosu (PDF Sınav Sonuçlarında Görünecek)
                    </label>

                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/60">
                      {/* Logo Preview Box */}
                      <div className="w-28 h-28 rounded-xl border border-slate-700 bg-slate-950 flex items-center justify-center p-2 relative overflow-hidden shrink-0 shadow-inner">
                        {logoPreview ? (
                          <img
                            src={logoPreview}
                            alt="Kurum Logosu"
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <div className="text-center p-2">
                            <ImageIcon className="h-8 w-8 text-slate-600 mx-auto mb-1" />
                            <span className="text-[10px] text-slate-500 font-medium block">Logo Yok</span>
                          </div>
                        )}
                      </div>

                      {/* Upload Controls */}
                      <div className="flex-1 space-y-2 text-center sm:text-left">
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                          <label className="btn btn-primary text-xs py-2 px-3 flex items-center gap-1.5 cursor-pointer">
                            <Upload className="h-3.5 w-3.5" />
                            <span>{logoPreview ? 'Logoyu Değiştir' : 'Logo Yükle'}</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/svg+xml"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                          </label>

                          {logoPreview && (
                            <button
                              type="button"
                              onClick={() => setLogoPreview(undefined)}
                              className="btn btn-secondary text-xs py-2 px-3 text-rose-400 hover:text-rose-300 border-rose-500/30 flex items-center gap-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Kaldır
                            </button>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400">
                          PNG veya JPG formatında, şeffaf arkaplanlı logo önerilir. Max: 2 MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Form Inputs */}
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Kurum / Okul Adı *</label>
                      <input
                        type="text"
                        required
                        value={instNameInput}
                        onChange={e => setInstNameInput(e.target.value)}
                        className="input-field text-xs"
                        placeholder="ör. Özel Bilim Koleji"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Şehir</label>
                        <input
                          type="text"
                          value={instCityInput}
                          onChange={e => setInstCityInput(e.target.value)}
                          className="input-field text-xs"
                          placeholder="İstanbul"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Telefon</label>
                        <input
                          type="text"
                          value={instPhoneInput}
                          onChange={e => setInstPhoneInput(e.target.value)}
                          className="input-field text-xs"
                          placeholder="0212 555 0000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">E-posta</label>
                      <input
                        type="email"
                        value={instEmailInput}
                        onChange={e => setInstEmailInput(e.target.value)}
                        className="input-field text-xs"
                        placeholder="info@kurum.com"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-end">
                    <button
                      type="submit"
                      className="btn btn-primary text-xs py-2.5 px-5 flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                      <Save className="h-4 w-4" /> Değişiklikleri & Logoyu Kaydet
                    </button>
                  </div>
                </form>
              </div>

              {/* Live PDF Mockup / Preview Section */}
              <div className="lg:col-span-6 space-y-4">
                <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-indigo-400" /> Sınav PDF Çıktılarında Canlı Önizleme
                    </h3>
                    <span className="badge badge-primary text-[10px]">Canlı Simülasyon</span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Yüklediğiniz logo kurumunuza ait tüm <strong>Genel Derece Listeleri</strong>, <strong>Sınıf Listeleri</strong> ve <strong>Öğrenci Sınav Sonuç Belgelerinde (PDF)</strong> sağ üst köşede otomatik olarak yer alır.
                  </p>

                  {/* Mockup 1: Ranking List Header (Landscape PDF) */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                      1. Kurum / Sınıf Dereceli Liste Başlığı (Yatay A4 PDF)
                    </span>

                    <div className="p-3.5 rounded-xl bg-white border border-slate-300 shadow-md text-slate-900 space-y-2">
                      <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 tracking-tight">
                            TYT DENEME SINAVI - GENEL DERECE LİSTESİ
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Kurum: <strong className="text-slate-700">{instNameInput || 'KURUM ADI'}</strong> | Tarih: {new Date().toISOString().split('T')[0]} | Toplam Katılım: 120 Öğrenci
                          </p>
                        </div>

                        {/* Top-Right Logo Frame */}
                        <div className="w-20 h-10 border border-slate-200 rounded bg-slate-50 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
                          ) : (
                            <span className="text-[9px] text-slate-400 font-semibold uppercase">Kurum Logo</span>
                          )}
                        </div>
                      </div>

                      {/* Mini Table Rows Preview */}
                      <div className="text-[9px] text-slate-600 space-y-1">
                        <div className="grid grid-cols-6 gap-1 font-bold bg-slate-800 text-white px-1.5 py-1 rounded text-center">
                          <span className="text-left col-span-2">Öğrenci Adı</span>
                          <span>No</span>
                          <span>Sınıf</span>
                          <span>Toplam Net</span>
                          <span>Puan</span>
                        </div>
                        <div className="grid grid-cols-6 gap-1 px-1.5 py-0.5 border-b border-slate-100 text-center">
                          <span className="text-left col-span-2 font-medium">1. Ali Yılmaz</span>
                          <span>101</span>
                          <span>12-A</span>
                          <span className="font-semibold text-emerald-600">104.50</span>
                          <span className="font-bold text-indigo-600">468.25</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mockup 2: Student Report Card Header (Portrait PDF) */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
                      2. Öğrenci Sınav Sonuç Belgesi Başlığı (Dikey A4 PDF)
                    </span>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-indigo-200 shadow-md text-slate-900 space-y-2">
                      <div className="p-3 rounded-lg bg-indigo-50/80 border border-indigo-200 flex items-center justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase">
                            {instNameInput || 'KURUM ADI'}
                          </h4>
                          <div className="text-[10px] font-bold text-indigo-700 mt-0.5">
                            TYT DENEME - ÖĞRENCİ SINAV SONUÇ BELGESİ
                          </div>
                          <div className="text-[9px] text-slate-500 mt-0.5">
                            Sınav Kodu: TYT-01 | Tarih: {new Date().toISOString().split('T')[0]}
                          </div>
                        </div>

                        {/* Top-Right Logo Card */}
                        <div className="w-16 h-12 rounded-lg bg-white border border-indigo-200 p-1 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
                          ) : (
                            <span className="text-[8px] text-slate-400 font-semibold uppercase">Logo</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Class Modal */}
      {showAddClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="glass-panel max-w-xl w-full p-6 sm:p-7 rounded-3xl border border-indigo-500/30 bg-slate-900/95 space-y-5 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-white">Kuruma Sınıf / Şube Tanımla</h3>
                  <p className="text-xs text-slate-400">Sistem standart sınıflarından seçin veya özel sınıf oluşturun</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddClass(false);
                  setNewClassName('');
                }}
                className="text-slate-400 hover:text-white p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Mode Selector Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setClassModalMode('standard')}
                className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                  classModalMode === 'standard'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                <span>Standart Sistem Sınıfları ({globalClasses.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setClassModalMode('custom')}
                className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                  classModalMode === 'custom'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Plus className="h-3.5 w-3.5 text-indigo-400" />
                <span>Özel Sınıf Adı Tanımla</span>
              </button>
            </div>

            {/* MODE 1: Standard System Classes Pool */}
            {classModalMode === 'standard' && (
              <div className="space-y-4">
                {/* Grade Level Filter Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: 'Tümü', value: 'ALL' },
                    { label: '8. Sınıf', value: 8 },
                    { label: '9. Sınıf', value: 9 },
                    { label: '10. Sınıf', value: 10 },
                    { label: '11. Sınıf', value: 11 },
                    { label: '12 & Mezun', value: 12 }
                  ].map(flt => (
                    <button
                      key={String(flt.value)}
                      type="button"
                      onClick={() => setTemplateGradeFilter(flt.value as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        templateGradeFilter === flt.value
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
                      }`}
                    >
                      {flt.label}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Sistem Yöneticisi tarafından onaylanmış resmi sınıflar:</span>
                  <span className="text-emerald-400 font-semibold">{classes.length} sınıfınız mevcut</span>
                </div>

                {/* Templates Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {globalClasses
                    .filter(g => templateGradeFilter === 'ALL' || g.gradeLevel === templateGradeFilter)
                    .map(tpl => {
                      const isAlreadyAdded = classes.some(c => c.name.toLowerCase() === tpl.name.toLowerCase());
                      return (
                        <div
                          key={tpl.id}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            isAlreadyAdded
                              ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                              : 'bg-slate-900/80 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm tracking-wide">{tpl.name}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                {tpl.gradeLevel}. Snf
                              </span>
                            </div>
                            {tpl.description && (
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">{tpl.description}</p>
                            )}
                          </div>

                          <div>
                            {isAlreadyAdded ? (
                              <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 whitespace-nowrap flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Ekli
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleQuickAddTemplateClass(tpl)}
                                className="btn btn-primary text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 shrink-0 whitespace-nowrap"
                              >
                                <Plus className="h-3.5 w-3.5" /> Ekle
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Listede aradığınız şube yok mu?</span>
                  <button
                    type="button"
                    onClick={() => setClassModalMode('custom')}
                    className="text-indigo-400 hover:underline font-semibold"
                  >
                    Özel İsimle Tanımlayın →
                  </button>
                </div>
              </div>
            )}

            {/* MODE 2: Custom Class Name Creation */}
            {classModalMode === 'custom' && (
              <form onSubmit={handleAddClass} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Özel Sınıf / Şube Adı *</label>
                  <input
                    required
                    type="text"
                    placeholder="ör. 8-VIP, 11-DİL-1 veya 12-ÖZEL-SAY"
                    value={newClassName}
                    onChange={e => setNewClassName(e.target.value)}
                    className="input-field py-2 text-xs rounded-xl"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Standart listede bulunmayan kurumunuza has şubeler için serbest metin girebilirsiniz.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sınıf Seviyesi / Kademesi *</label>
                  <select
                    value={newGradeLevel}
                    onChange={e => setNewGradeLevel(Number(e.target.value))}
                    className="input-field py-2 text-xs rounded-xl bg-slate-900"
                  >
                    <option value={8}>8. Sınıf (LGS)</option>
                    <option value={9}>9. Sınıf</option>
                    <option value={10}>10. Sınıf</option>
                    <option value={11}>11. Sınıf</option>
                    <option value={12}>12. Sınıf & Mezun (YKS / TYT / AYT)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddClass(false);
                      setNewClassName('');
                    }}
                    className="btn btn-secondary text-xs rounded-xl py-2 px-4"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary text-xs rounded-xl py-2 px-5 flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                  >
                    <Plus className="h-4 w-4" /> Özel Sınıfı Kaydet
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel max-w-sm w-full p-6 rounded-2xl border-slate-700 space-y-4">
            <h3 className="font-display text-lg font-bold text-white">Yeni Öğrenci Kaydet</h3>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Adı *</label>
                <input required type="text" value={newStudent.firstName} onChange={e => setNewStudent({...newStudent, firstName: e.target.value})} className="input-field py-2 text-xs" placeholder="ör. Zeynep" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Soyadı *</label>
                <input required type="text" value={newStudent.lastName} onChange={e => setNewStudent({...newStudent, lastName: e.target.value})} className="input-field py-2 text-xs" placeholder="ör. Demir" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Öğrenci Okul No *</label>
                <input required type="text" value={newStudent.studentNo} onChange={e => setNewStudent({...newStudent, studentNo: e.target.value})} className="input-field py-2 text-xs font-mono" placeholder="ör. 1001" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sınıfı *</label>
                <select required value={newStudent.classId} onChange={e => setNewStudent({...newStudent, classId: e.target.value})} className="input-field py-2 text-xs bg-slate-900">
                  <option value="">Sınıf Seçiniz...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddStudent(false)} className="btn btn-secondary text-xs">İptal</button>
                <button type="submit" className="btn btn-primary text-xs">Öğrenciyi Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Cumulative Multi-Exam Report Modal */}
      {cumulativeStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 animate-fade-in overflow-y-auto">
          <div className="max-w-5xl w-full my-auto max-h-[92vh] overflow-y-auto">
            <StudentCumulativeReport
              initialStudentId={cumulativeStudentId}
              onClose={() => setCumulativeStudentId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
