import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Users, FileText, CheckCircle, Plus, Search, MapPin, Phone, Mail, ChevronRight, Settings, UserPlus, Shield, Trash2, Eye, Calendar, Sparkles, Download, Upload, FileSpreadsheet, CheckCircle2, GraduationCap, RotateCcw, BookOpen, Layers, X, Copy, Key, Check } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { studentExcelService } from '../../services/studentExcelService';
import { pdfService } from '../../services/pdfService';
import { Institution, Student, Exam, User, GlobalClassTemplate, SystemGradeLevel } from '../../types';
import { PersonnelManagement } from '../management/PersonnelManagement';
import { SiteSettings } from '../management/SiteSettings';
import { StudentCumulativeReport } from '../results/StudentCumulativeReport';

interface SuperAdminDashProps {
  currentUser?: User;
  onNavigateToTab?: (tab: string) => void;
}

export const SuperAdminDash: React.FC<SuperAdminDashProps> = ({ currentUser, onNavigateToTab }) => {
  const [activeSubTab, setActiveSubTab] = useState<'INSTITUTIONS' | 'PERSONNEL' | 'GLOBAL_CLASSES' | 'STUDENTS' | 'EXAMS' | 'SITE_SETTINGS'>('INSTITUTIONS');

  const [institutions, setInstitutions] = useState<Institution[]>(storageService.getInstitutions());
  const [students, setStudents] = useState<Student[]>(storageService.getStudents());
  const [exams, setExams] = useState<Exam[]>(storageService.getExams());
  const [gradeLevels, setGradeLevels] = useState<SystemGradeLevel[]>(storageService.getGradeLevels());
  const [globalClasses, setGlobalClasses] = useState<GlobalClassTemplate[]>(storageService.getGlobalClasses());
  const [globalGradeFilter, setGlobalGradeFilter] = useState<number | 'ALL'>('ALL');
  const [globalClassSearch, setGlobalClassSearch] = useState('');
  const [showAddGlobalClassModal, setShowAddGlobalClassModal] = useState(false);
  const [showAddGradeLevelModal, setShowAddGradeLevelModal] = useState(false);

  // New Grade Level Form State
  const [newGradeLevelNum, setNewGradeLevelNum] = useState<number>(5);
  const [newGradeLevelName, setNewGradeLevelName] = useState('');
  const [newGradeLevelCategory, setNewGradeLevelCategory] = useState<'İlkokul' | 'Ortaokul' | 'Lise' | 'Mezun / Diğer'>('Ortaokul');
  const [newGradeLevelDesc, setNewGradeLevelDesc] = useState('');

  // New Global Class Form State
  const [newGlobalName, setNewGlobalName] = useState('');
  const [newGlobalGrade, setNewGlobalGrade] = useState<number>(5);
  const [newGlobalDesc, setNewGlobalDesc] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentInstId, setSelectedStudentInstId] = useState<string>('ALL');
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');
  const [studentImportSuccessMsg, setStudentImportSuccessMsg] = useState<string | null>(null);
  const [selectedCumulativeStudentId, setSelectedCumulativeStudentId] = useState<string | null>(null);
  const [examSearchTerm, setExamSearchTerm] = useState('');
  const [examInstFilter, setExamInstFilter] = useState<string>('ALL');

  // Single Student Creation State for Super Admin
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [studentFormInstId, setStudentFormInstId] = useState<string>('');
  const [studentFormFirstName, setStudentFormFirstName] = useState('');
  const [studentFormLastName, setStudentFormLastName] = useState('');
  const [studentFormNo, setStudentFormNo] = useState('');
  const [studentFormClassId, setStudentFormClassId] = useState('');

  const handleSuperAdminAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const targetInstId = studentFormInstId || (institutions[0]?.id || 'inst-1');
    const targetInst = institutions.find(i => i.id === targetInstId);
    if (!targetInst) {
      alert('Lütfen geçerli bir kurum seçiniz.');
      return;
    }

    if (!studentFormFirstName.trim() || !studentFormLastName.trim() || !studentFormNo.trim()) {
      alert('Lütfen öğrenci adı, soyadı ve numarasını eksiksiz doldurunuz.');
      return;
    }

    const instClasses = storageService.getClasses(targetInstId);
    let selectedClass = instClasses.find(c => c.id === studentFormClassId);

    // If selected from global classes pool
    if (!selectedClass) {
      const globalCls = globalClasses.find(g => g.id === studentFormClassId || g.name === studentFormClassId);
      if (globalCls) {
        // Auto-create or find existing class with same name in institution
        const existingClassWithName = instClasses.find(c => c.name.toLowerCase() === globalCls.name.toLowerCase());
        if (existingClassWithName) {
          selectedClass = existingClassWithName;
        } else {
          const newCls = {
            id: `cls-${Date.now()}`,
            institutionId: targetInstId,
            name: globalCls.name,
            gradeLevel: globalCls.gradeLevel,
            studentCount: 1
          };
          storageService.addClass(newCls);
          selectedClass = newCls;
        }
      } else {
        alert('Lütfen bir sınıf seçiniz.');
        return;
      }
    }

    // Check duplicate studentNo in that institution
    const instStudents = storageService.getStudents(targetInstId);
    if (instStudents.some(s => s.studentNo.trim() === studentFormNo.trim())) {
      alert(`"${studentFormNo.trim()}" numaralı öğrenci ${targetInst.name} kurumunda zaten kayıtlıdır.`);
      return;
    }

    const newStudent: Student = {
      id: `std-${Date.now()}`,
      institutionId: targetInstId,
      classId: selectedClass.id,
      className: selectedClass.name,
      studentNo: studentFormNo.trim(),
      firstName: studentFormFirstName.trim(),
      lastName: studentFormLastName.trim()
    };

    storageService.addStudent(newStudent);
    reloadData();
    setShowAddStudentModal(false);
    setStudentFormFirstName('');
    setStudentFormLastName('');
    setStudentFormNo('');
    setStudentFormClassId('');
    setStudentImportSuccessMsg(`"${newStudent.firstName} ${newStudent.lastName}" (${selectedClass.name}) başarıyla ${targetInst.name} kurumuna eklendi.`);
    setTimeout(() => setStudentImportSuccessMsg(null), 4000);
  };

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
  const [editingAdminUser, setEditingAdminUser] = useState<User | null>(null);
  const [editingAdminUsername, setEditingAdminUsername] = useState('');
  const [editingAdminPassword, setEditingAdminPassword] = useState('');
  const [copiedInfoMsg, setCopiedInfoMsg] = useState<string | null>(null);
  const [newAdminForInstModal, setNewAdminForInstModal] = useState<Institution | null>(null);
  const [assignAdminName, setAssignAdminName] = useState('');
  const [assignAdminUsername, setAssignAdminUsername] = useState('');
  const [assignAdminPassword, setAssignAdminPassword] = useState('');

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
    setGradeLevels(storageService.getGradeLevels());
    setGlobalClasses(storageService.getGlobalClasses());
  };

  const handleAddGradeLevel = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newGradeLevelName.trim();
    if (!trimmed) return;

    if (gradeLevels.some(g => g.level === newGradeLevelNum)) {
      alert(`${newGradeLevelNum}. sınıf kademesi sistemde zaten tanımlıdır!`);
      return;
    }

    const newLevel: SystemGradeLevel = {
      id: `grade-${newGradeLevelNum}`,
      level: newGradeLevelNum,
      name: trimmed,
      category: newGradeLevelCategory,
      description: newGradeLevelDesc.trim() || undefined,
      isActive: true,
      order: newGradeLevelNum
    };

    storageService.addGradeLevel(newLevel);
    setGradeLevels(storageService.getGradeLevels());
    setShowAddGradeLevelModal(false);
    setNewGradeLevelName('');
    setNewGradeLevelDesc('');
  };

  const handleDeleteGradeLevel = (id: string, name: string) => {
    if (window.confirm(`"${name}" kademesini sistemden silmek istediğinize emin misiniz?`)) {
      storageService.deleteGradeLevel(id);
      setGradeLevels(storageService.getGradeLevels());
    }
  };

  const handleResetGradeLevels = () => {
    if (window.confirm('Tüm sınıf kademelerini ve standart sınıfları MEB/ÖSYM varsayılanlarına (5, 6, 7, 8, 9, 10, 11, 12, Mezun) sıfırlamak istiyor musunuz?')) {
      storageService.resetGradeLevelsToDefault();
      storageService.resetGlobalClassesToDefault();
      setGradeLevels(storageService.getGradeLevels());
      setGlobalClasses(storageService.getGlobalClasses());
    }
  };

  const handleAddGlobalClass = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newGlobalName.trim();
    if (!trimmed) return;

    if (globalClasses.some(g => g.name.toLowerCase() === trimmed.toLowerCase())) {
      alert(`"${trimmed}" isimli standart sınıf havuzda zaten mevcut!`);
      return;
    }

    const newTemplate: GlobalClassTemplate = {
      id: `gcls-${Date.now()}`,
      name: trimmed,
      gradeLevel: newGlobalGrade,
      description: newGlobalDesc.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    storageService.addGlobalClass(newTemplate);
    setGlobalClasses(storageService.getGlobalClasses());
    setShowAddGlobalClassModal(false);
    setNewGlobalName('');
    setNewGlobalDesc('');
  };

  const handleDeleteGlobalClass = (id: string, name: string) => {
    if (window.confirm(`"${name}" sınıf şablonunu sistem havuzundan kaldırmak istediğinize emin misiniz?`)) {
      storageService.deleteGlobalClass(id);
      setGlobalClasses(storageService.getGlobalClasses());
    }
  };

  const handleResetGlobalClasses = () => {
    if (window.confirm('Sistem sınıf havuzunu MEB/ÖSYM standart sınıflarına sıfırlamak istediğinize emin misiniz?')) {
      storageService.resetGlobalClassesToDefault();
      setGlobalClasses(storageService.getGlobalClasses());
    }
  };

  const totalStudentsCount = institutions.reduce((sum, i) => sum + i.studentCount, 0);
  const totalExamsCount = institutions.reduce((sum, i) => sum + i.examCount, 0);

  // Create Institution & Guaranteed Admin Account
  const handleAddInstitution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instName.trim()) return;

    const instId = `inst-${Date.now()}`;
    const newInst: Institution = {
      id: instId,
      name: instName.trim(),
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

    // GUARANTEED ADMIN CREATION: Always generate valid admin credentials
    const cleanSlug = instName.toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '');
    const uName = (adminUsername || `admin_${cleanSlug || 'kurum'}`).trim();
    const uPass = (adminPassword || `${cleanSlug || 'kurum'}123`).trim();

    const newAdmin: User = {
      id: `user-${Date.now()}`,
      name: (adminName || `${instName} Yöneticisi`).trim(),
      username: uName,
      password: uPass,
      email: instEmail?.trim() || `${uName}@opteno.com`,
      phone: instPhone?.trim(),
      role: 'INSTITUTION_ADMIN',
      institutionId: instId,
      institutionName: instName.trim(),
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0]
    };
    storageService.addUser(newAdmin);

    reloadData();
    setShowAddInstModal(false);
    setInstName('');
    setInstPhone('');
    setInstEmail('');
    setInstLogo(undefined);
    setAdminName('');
    setAdminUsername('');
    setAdminPassword('');

    alert(`"${newInst.name}" ve Kurum Yöneticisi başarıyla kaydedildi!\n\nGiriş Bilgileri:\nKullanıcı Adı: ${uName}\nŞifre: ${uPass}`);
  };

  const handleSaveAdminCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdminUser || !editingAdminPassword.trim()) return;
    const updated = {
      ...editingAdminUser,
      username: editingAdminUsername.trim() || editingAdminUser.username,
      password: editingAdminPassword.trim()
    };
    storageService.updateUser(updated);
    setEditingAdminUser(null);
    reloadData();
    alert('Kurum yöneticisi giriş bilgileri başarıyla güncellendi.');
  };

  const handleCreateAdminForInstitution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminForInstModal || !assignAdminUsername.trim() || !assignAdminPassword.trim()) {
      alert('Lütfen kullanıcı adı ve şifreyi eksiksiz giriniz.');
      return;
    }
    const adminUser: User = {
      id: `user-${Date.now()}`,
      name: (assignAdminName || `${newAdminForInstModal.name} Yöneticisi`).trim(),
      username: assignAdminUsername.trim(),
      password: assignAdminPassword.trim(),
      email: `${assignAdminUsername.trim()}@opteno.com`,
      role: 'INSTITUTION_ADMIN',
      institutionId: newAdminForInstModal.id,
      institutionName: newAdminForInstModal.name,
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0]
    };
    storageService.addUser(adminUser);
    setNewAdminForInstModal(null);
    setAssignAdminName('');
    setAssignAdminUsername('');
    setAssignAdminPassword('');
    reloadData();
    alert(`"${newAdminForInstModal.name}" için yönetici hesabı başarıyla oluşturuldu!`);
  };

  const copyCredentials = (username: string, pass: string, instName: string) => {
    const text = `Opteno Giriş Bilgileri (${instName}):\nKullanıcı Adı: ${username}\nŞifre: ${pass}\nGiriş Adresi: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedInfoMsg(`"${instName}" giriş bilgileri panoya kopyalandı!`);
    setTimeout(() => setCopiedInfoMsg(null), 3500);
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
      institutionName: examInstId === 'ALL' ? 'Tüm Kurumlar (Merkezi Sınav)' : (targetInst?.name || 'Merkezi Sistem Sınavı'),
      title: examTitle,
      examCode: examCode || `EXAM-${Math.floor(100 + Math.random() * 900)}`,
      date: examDate,
      totalQuestions: 40,
      totalExamsScanned: 0,
      isStudentSpecific: true,
      createdAt: new Date().toISOString().split('T')[0],
      createdByRole: 'SUPER_ADMIN',
      createdByUserId: currentUser?.id || 'user-admin',
      createdByName: currentUser?.name || 'Sistem Yöneticisi',
      isSystemExam: true,
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
      <div className="clay-panel p-2 rounded-2xl flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max p-1.5 clay-sunken rounded-2xl">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveSubTab('INSTITUTIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'INSTITUTIONS' 
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-[0_6px_14px_rgba(79,70,229,0.4),inset_0_2px_4px_rgba(255,255,255,0.35),inset_0_-2px_4px_rgba(0,0,0,0.2)]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="h-4 w-4" /> Kurumlar Paneli
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveSubTab('PERSONNEL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'PERSONNEL' 
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-[0_6px_14px_rgba(79,70,229,0.4),inset_0_2px_4px_rgba(255,255,255,0.35),inset_0_-2px_4px_rgba(0,0,0,0.2)]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="h-4 w-4 text-amber-400" /> Kurum Personelleri & Girişler
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveSubTab('GLOBAL_CLASSES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'GLOBAL_CLASSES' 
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-[0_6px_14px_rgba(79,70,229,0.4),inset_0_2px_4px_rgba(255,255,255,0.35),inset_0_-2px_4px_rgba(0,0,0,0.2)]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="h-4 w-4 text-amber-400" /> Sistem Sınıf Havuzu ({globalClasses.length})
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveSubTab('STUDENTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'STUDENTS' 
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-[0_6px_14px_rgba(79,70,229,0.4),inset_0_2px_4px_rgba(255,255,255,0.35),inset_0_-2px_4px_rgba(0,0,0,0.2)]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4 text-emerald-400" /> Tüm Öğrenciler
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveSubTab('EXAMS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'EXAMS' 
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-[0_6px_14px_rgba(79,70,229,0.4),inset_0_2px_4px_rgba(255,255,255,0.35),inset_0_-2px_4px_rgba(0,0,0,0.2)]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="h-4 w-4 text-fuchsia-400" /> Sınav Açma & Yönetimi
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveSubTab('SITE_SETTINGS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'SITE_SETTINGS' 
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-[0_6px_14px_rgba(79,70,229,0.4),inset_0_2px_4px_rgba(255,255,255,0.35),inset_0_-2px_4px_rgba(0,0,0,0.2)]' 
                : 'text-slate-400 hover:text-white'
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
            <div className="clay-card p-5 border border-indigo-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Toplam Kayıtlı Kurum</p>
                  <h3 className="font-display text-2xl font-black text-white mt-1">{institutions.length}</h3>
                </div>
                <div className="h-11 w-11 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.25)]">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="clay-card p-5 border border-emerald-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Toplam Kayıtlı Öğrenci</p>
                  <h3 className="font-display text-2xl font-black text-white mt-1">{totalStudentsCount}</h3>
                </div>
                <div className="h-11 w-11 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.25)]">
                  <Users className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="clay-card p-5 border border-fuchsia-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Toplam Sınav & Optik Okuma</p>
                  <h3 className="font-display text-2xl font-black text-white mt-1">{totalExamsCount}</h3>
                </div>
                <div className="h-11 w-11 rounded-2xl bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.25)]">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="clay-card p-5 border border-amber-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Sistem Durumu</p>
                  <h3 className="font-display text-lg font-black text-emerald-400 mt-1 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4" /> Çevrimiçi & Aktif
                  </h3>
                </div>
                <div className="h-11 w-11 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.25)]">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Toast for copied credentials */}
          {copiedInfoMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 mb-3 shadow-lg"
            >
              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{copiedInfoMsg}</span>
            </motion.div>
          )}

          {/* Institutions Panel Header & Search */}
          <div className="clay-panel p-6 rounded-[28px]">
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
                  <div key={inst.id} className="clay-card p-5 rounded-[24px] border border-slate-700/50 flex flex-col justify-between hover:border-indigo-500/40">
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
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-bold text-base text-white truncate">{inst.name}</h3>
                          {instAdmin ? (
                            <div className="mt-1.5 flex items-center justify-between gap-1 bg-slate-900/90 px-2 py-1 rounded-xl border border-indigo-500/20">
                              <div className="text-[11px] font-mono leading-tight truncate">
                                <span className="text-amber-300 font-bold">👤 {instAdmin.username}</span>
                                <span className="text-slate-500 mx-1">•</span>
                                <span className="text-emerald-400 font-bold">🔑 {instAdmin.password}</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyCredentials(instAdmin.username || '', instAdmin.password || '', inst.name);
                                }}
                                className="p-1 rounded-md bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 transition-colors shrink-0"
                                title="Giriş Bilgilerini Kopyala"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className="text-[10px] text-rose-400 font-semibold">⚠️ Yönetici Yok</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNewAdminForInstModal(inst);
                                  setAssignAdminName(`${inst.name} Yöneticisi`);
                                  const clean = inst.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                                  setAssignAdminUsername(`admin_${clean || 'kurum'}`);
                                  setAssignAdminPassword(`${clean || 'kurum'}123`);
                                }}
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 underline font-bold"
                              >
                                Yönetici Ata
                              </button>
                            </div>
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
              {/* Single Student Add Button */}
              <button
                type="button"
                onClick={() => {
                  const targetInst = selectedStudentInstId !== 'ALL' ? selectedStudentInstId : (institutions[0]?.id || '');
                  setStudentFormInstId(targetInst);
                  setStudentFormFirstName('');
                  setStudentFormLastName('');
                  setStudentFormNo('');
                  setStudentFormClassId('');
                  setShowAddStudentModal(true);
                }}
                className="btn btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer"
                title="Yeni Tekil Öğrenci Ekle"
              >
                <Plus className="h-4 w-4" />
                <span>+ Yeni Öğrenci (Tekli)</span>
              </button>

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

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3">Öğrenci No</th>
                        <th className="p-3">Ad Soyad</th>
                        <th className="p-3">Sınıf</th>
                        <th className="p-3">Kurum Adı</th>
                        <th className="p-3 text-right">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {filteredStudents.map(s => {
                        const inst = institutions.find(i => i.id === s.institutionId);
                        return (
                          <tr key={s.id} className="hover:bg-slate-100/70 dark:hover:bg-slate-900/40 transition-colors">
                            <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{s.studentNo}</td>
                            <td className="p-3 font-semibold text-slate-900 dark:text-white">{s.firstName} {s.lastName}</td>
                            <td className="p-3"><span className="badge badge-primary">{s.className}</span></td>
                            <td className="p-3 text-slate-600 dark:text-slate-400 font-semibold">{inst?.name || 'Bilinmiyor'}</td>
                            <td className="p-3 text-right whitespace-nowrap">
                              <button
                                onClick={() => setSelectedCumulativeStudentId(s.id)}
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 p-1 mr-2 transition-colors cursor-pointer inline-flex items-center gap-1"
                                title="Çoklu Deneme Gelişim Karnesi"
                              >
                                <GraduationCap className="h-4 w-4" />
                                <span className="text-[11px] font-semibold hidden sm:inline">Gelişim</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`${s.firstName} ${s.lastName} adlı öğrenciyi silmek istiyor musunuz?`)) {
                                    storageService.deleteStudent(s.id);
                                    setStudents(storageService.getStudents());
                                  }
                                }}
                                className="text-rose-500 hover:text-rose-600 dark:text-red-400 dark:hover:text-red-300 p-1 cursor-pointer transition-colors"
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

          {/* Sınav Filtreleme ve Arama Çubuğu */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={examSearchTerm}
                onChange={(e) => setExamSearchTerm(e.target.value)}
                placeholder="Sınav adı, kodu veya kurum ile ara..."
                className="input-field pl-10 text-xs py-2.5 w-full bg-slate-900/80 border-slate-700/80 text-white placeholder-slate-500 rounded-xl"
              />
              {examSearchTerm && (
                <button
                  onClick={() => setExamSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="relative sm:w-72">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <select
                value={examInstFilter}
                onChange={(e) => setExamInstFilter(e.target.value)}
                className="input-field pl-9 text-xs py-2.5 w-full bg-slate-900/80 border-slate-700/80 text-white font-medium cursor-pointer rounded-xl"
              >
                <option value="ALL">🏢 Tüm Kurumlar ({exams.length} Sınav)</option>
                <option value="SYSTEM">🛡️ Sadece Merkezi Sistem</option>
                {institutions.map(inst => {
                  const count = exams.filter(e => e.institutionId === inst.id).length;
                  return (
                    <option key={inst.id} value={inst.id}>
                      🏫 {inst.name} ({count} Sınav)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {(() => {
            const filteredDashExams = exams.filter(e => {
              const isSys = e.isSystemExam === true || e.createdByRole === 'SUPER_ADMIN' || e.institutionId === 'ALL' || e.institutionId === 'SYSTEM';
              if (examInstFilter === 'SYSTEM' && !isSys) return false;
              if (examInstFilter !== 'ALL' && examInstFilter !== 'SYSTEM' && e.institutionId !== examInstFilter) return false;
              if (examSearchTerm) {
                const term = examSearchTerm.toLowerCase();
                return e.title.toLowerCase().includes(term) || e.examCode.toLowerCase().includes(term) || (e.institutionName && e.institutionName.toLowerCase().includes(term));
              }
              return true;
            });

            if (filteredDashExams.length === 0) {
              return (
                <div className="p-10 text-center text-slate-400 bg-slate-800/40 rounded-2xl border border-slate-700/40 space-y-2">
                  <FileText className="h-8 w-8 text-slate-500 mx-auto" />
                  <p className="text-xs font-semibold">Filtrelere uygun sınav bulunamadı.</p>
                  {(examSearchTerm || examInstFilter !== 'ALL') && (
                    <button
                      onClick={() => { setExamSearchTerm(''); setExamInstFilter('ALL'); }}
                      className="text-xs text-indigo-400 hover:underline inline-block mt-1"
                    >
                      Filtreleri Temizle
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDashExams.map(e => (
                  <div key={e.id} className="clay-card p-5 rounded-2xl border border-slate-700/60 flex flex-col justify-between overflow-hidden shadow-sm">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="badge badge-primary text-[10px]">{e.examCode}</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> {e.date}
                        </span>
                      </div>

                      <h3 className="font-display font-bold text-base text-white">{e.title}</h3>
                      <p className="text-xs text-indigo-400 mt-1 font-semibold">{e.institutionName}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-300">
                        <div><strong>{e.totalQuestions}</strong> Soru</div>
                        <div><strong>{e.subjects.length}</strong> Ders</div>
                        <div><strong>{e.totalExamsScanned || 0}</strong> Okunan Optik</div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                        <button
                          onClick={async () => {
                            const studentsList = storageService.getStudents(e.institutionId);
                            const pdf = await pdfService.generateOMRPDF(e, studentsList, 'A4');
                            pdf.save(`${e.examCode}_Optik_Form_A4.pdf`);
                          }}
                          className="btn btn-secondary py-1.5 px-3 text-[11px] font-bold flex items-center justify-center gap-1.5 text-indigo-300 border-indigo-500/30 flex-1 sm:flex-initial rounded-xl whitespace-nowrap min-w-[85px]"
                          title="1 Sayfada 1 Tam Boy Optik Form"
                        >
                          <Download className="h-3.5 w-3.5 shrink-0" />
                          <span>A4 İndir</span>
                        </button>
                        <button
                          onClick={async () => {
                            const studentsList = storageService.getStudents(e.institutionId);
                            const pdf = await pdfService.generateOMRPDF(e, studentsList, 'A5');
                            pdf.save(`${e.examCode}_Optik_Form_A5_Tasarruf.pdf`);
                          }}
                          className="btn btn-secondary py-1.5 px-3 text-[11px] font-bold flex items-center justify-center gap-1.5 text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 flex-1 sm:flex-initial rounded-xl whitespace-nowrap min-w-[85px]"
                          title="1 Sayfada Altlı Üstlü 2 Optik Form (A5 Kesimli, %50 Kağıt Tasarrufu)"
                        >
                          <Download className="h-3.5 w-3.5 shrink-0" />
                          <span>A5 İndir (2'li)</span>
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          if (window.confirm(`"${e.title}" sınavını silmek istiyor musunuz?`)) {
                            storageService.deleteExam(e.id);
                            setExams(storageService.getExams());
                          }
                        }}
                        className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all flex items-center gap-1 text-xs shrink-0 cursor-pointer ml-auto sm:ml-0"
                        title="Sınavı Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Sil</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* SUB-TAB: GLOBAL CLASSES & GRADE LEVELS MANAGEMENT */}
      {activeSubTab === 'GLOBAL_CLASSES' && (
        <div className="space-y-6">
          {/* SECTION 1: SYSTEM GRADE LEVELS (KADEMELER: 5, 6, 7, 8, 9, 10, 11, 12, MEZUN) */}
          <div className="clay-panel p-6 rounded-3xl border border-indigo-500/20 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Eğitim Kademeleri & Düzeyleri
                  </span>
                  <span className="text-xs text-slate-400">• Toplam {gradeLevels.length} Aktif Kademe</span>
                </div>
                <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="h-6 w-6 text-indigo-400" /> Sistem Sınıf Kademeleri (Seviyeler)
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Sistemde geçerli sınıf düzeylerini (5. Sınıf, 6. Sınıf, 7. Sınıf, 8. Sınıf, Lise, Mezun vb.) buradan tanımlayabilirsiniz. Eklediğiniz her kademe otomatik olarak sınav oluşturma, optik form ve şube listelerinde kullanılabilir hale gelir.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleResetGradeLevels}
                  className="btn btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 text-slate-300 border-slate-700 hover:border-amber-500/50 rounded-xl"
                  title="5-12. Sınıf ve Mezun varsayılan kademelerine geri döndür"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-amber-400" /> Kademeleri Sıfırla
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    const nextLevel = Math.max(...gradeLevels.map(g => g.level), 4) + 1;
                    setNewGradeLevelNum(nextLevel);
                    setNewGradeLevelName(`${nextLevel}. Sınıf`);
                    setShowAddGradeLevelModal(true);
                  }}
                  className="btn btn-primary text-xs py-2 px-4 flex items-center gap-2 rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  <Plus className="h-4 w-4" /> + Yeni Kademe / Seviye Ekle
                </motion.button>
              </div>
            </div>

            {/* Grade Levels Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-800/80">
              {gradeLevels.map(gl => {
                const classCount = globalClasses.filter(c => c.gradeLevel === gl.level).length;
                return (
                  <motion.div
                    key={gl.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="clay-card p-3.5 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          gl.category === 'Ortaokul' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          gl.category === 'Lise' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                          gl.category === 'İlkokul' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30'
                        }`}>
                          {gl.category}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleDeleteGradeLevel(gl.id, gl.name)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded-lg opacity-60 group-hover:opacity-100 transition-opacity"
                          title="Kademeyi Sil"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="mt-2">
                        <h4 className="font-display text-sm sm:text-base font-bold text-white tracking-tight">{gl.name}</h4>
                        {gl.description && (
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{gl.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-800/70 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Düzey No: <strong className="text-white font-mono">{gl.level}</strong></span>
                      <span className="text-indigo-300 font-semibold">{classCount} Şube</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: GLOBAL CLASS TEMPLATES POOL */}
          <div className="clay-panel p-6 rounded-3xl border border-indigo-500/20 relative overflow-hidden space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Standart Şube Havuzu
                  </span>
                  <span className="text-xs text-slate-400">• Toplam {globalClasses.length} Standart Sınıf / Şube</span>
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-amber-400" /> Kademelere Göre Standart Şubeler
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Kurumların şube açarken doğrudan tek tıkla ekleyebileceği standart şubeleri buradan yönetin.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowAddGlobalClassModal(true)}
                  className="btn btn-primary text-xs py-2.5 px-4 flex items-center gap-2 rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  <Plus className="h-4 w-4" /> Yeni Standart Şube Ekle
                </motion.button>
              </div>
            </div>

            {/* Dynamic Level Filters & Search */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setGlobalGradeFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    globalGradeFilter === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                      : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Tümü ({globalClasses.length})
                </button>

                {gradeLevels.map(gl => {
                  const count = globalClasses.filter(g => g.gradeLevel === gl.level).length;
                  return (
                    <button
                      key={gl.id}
                      type="button"
                      onClick={() => setGlobalGradeFilter(gl.level)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        globalGradeFilter === gl.level
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                          : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {gl.name}
                      <span className="ml-1.5 text-[10px] opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Şube veya sınıf ara..."
                  value={globalClassSearch}
                  onChange={(e) => setGlobalClassSearch(e.target.value)}
                  className="input-field pl-9 py-1.5 text-xs rounded-xl w-56 bg-slate-950/60"
                />
              </div>
            </div>

            {/* Classes Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pt-2">
              {globalClasses
                .filter(g => globalGradeFilter === 'ALL' || g.gradeLevel === globalGradeFilter)
                .filter(g => !globalClassSearch || g.name.toLowerCase().includes(globalClassSearch.toLowerCase()) || (g.description && g.description.toLowerCase().includes(globalClassSearch.toLowerCase())))
                .map(cls => {
                  const matchingLevel = gradeLevels.find(gl => gl.level === cls.gradeLevel);
                  return (
                    <motion.div
                      key={cls.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="clay-card p-4 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wide uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {matchingLevel?.name || `${cls.gradeLevel}. Sınıf`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteGlobalClass(cls.id, cls.name)}
                            className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition-colors opacity-70 group-hover:opacity-100"
                            title="Havuzdan Kaldır"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div>
                          <h4 className="font-display text-lg font-black text-white tracking-tight">{cls.name}</h4>
                          {cls.description && (
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{cls.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-mono">ID: {cls.id}</span>
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="h-3 w-3" /> Standart Şube
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
            </div>

            {globalClasses.length === 0 && (
              <div className="p-10 text-center rounded-2xl border border-slate-800 space-y-2">
                <GraduationCap className="h-10 w-10 text-slate-600 mx-auto" />
                <h4 className="font-display text-sm font-bold text-white">Standart Şube Bulunamadı</h4>
                <p className="text-xs text-slate-400">Bu kademe için henüz şube eklenmedi. Yukarıdaki butondan ekleyebilirsiniz.</p>
              </div>
            )}
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
              className="glass-panel relative z-10 max-w-2xl w-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-slate-700/80 space-y-4 shadow-2xl bg-slate-900/90 max-h-[90vh] overflow-y-auto"
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
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Kurum Resmi Logosu</h4>
                  <p className="text-[11px] text-slate-400">Sınav derece listeleri ve öğrenci karnesi PDF çıktılarında kullanılır.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <label className="btn btn-primary text-xs py-1.5 px-3 flex-1 sm:flex-initial flex items-center justify-center gap-1.5 cursor-pointer rounded-xl">
                    <Upload className="h-3.5 w-3.5 shrink-0" />
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
                      className="btn btn-secondary text-xs py-1.5 px-2.5 text-rose-400 hover:text-rose-300 border-rose-500/30 flex items-center justify-center gap-1 rounded-xl shrink-0"
                      title="Logoyu Kaldır"
                    >
                      <Trash2 className="h-3.5 w-3.5 shrink-0" /> <span>Kaldır</span>
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Institution Personnel & Admin Credentials */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-indigo-400">Kurum Yöneticileri ve Giriş Bilgileri</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setNewAdminForInstModal(selectedInstDetails);
                      setAssignAdminName(`${selectedInstDetails.name} Yöneticisi`);
                      const clean = selectedInstDetails.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                      setAssignAdminUsername(`admin_${clean || 'kurum'}`);
                      setAssignAdminPassword(`${clean || 'kurum'}123`);
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="h-3 w-3" /> Yeni Yönetici Ekle
                  </button>
                </div>
                
                {storageService.getUsersByInstitution(selectedInstDetails.id).length === 0 ? (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
                    <p className="text-xs text-amber-300 font-semibold">Bu kuruma henüz tanımlı bir yönetici hesabı bulunmuyor.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setNewAdminForInstModal(selectedInstDetails);
                        setAssignAdminName(`${selectedInstDetails.name} Yöneticisi`);
                        const clean = selectedInstDetails.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                        setAssignAdminUsername(`admin_${clean || 'kurum'}`);
                        setAssignAdminPassword(`${clean || 'kurum'}123`);
                      }}
                      className="btn btn-primary text-xs py-1.5 px-3 mx-auto flex items-center gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" /> Hemen Yönetici Hesabı Oluştur
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {storageService.getUsersByInstitution(selectedInstDetails.id).map(p => (
                      <div key={p.id} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {p.name && <span className="font-bold text-white truncate">{p.name}</span>}
                            <span className="badge badge-primary text-[10px] shrink-0">{p.role === 'INSTITUTION_ADMIN' ? 'Kurum Yöneticisi' : 'Öğretmen'}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="break-all">Kullanıcı Adı: <strong className="text-amber-300">{p.username || p.email}</strong></span>
                            <span className="hidden sm:inline text-slate-600">|</span>
                            <span className="break-all">Şifre: <strong className="text-emerald-400">{p.password || '******'}</strong></span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 shrink-0">
                          <button
                            type="button"
                            onClick={() => copyCredentials(p.username || '', p.password || '', selectedInstDetails.name)}
                            className="btn btn-secondary text-[11px] py-1.5 px-3 flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl whitespace-nowrap"
                            title="Giriş Bilgilerini Kopyala"
                          >
                            <Copy className="h-3 w-3 text-indigo-400 shrink-0" /> <span>Kopyala</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAdminUser(p);
                              setEditingAdminUsername(p.username || '');
                              setEditingAdminPassword(p.password || '');
                            }}
                            className="btn btn-primary text-[11px] py-1.5 px-3 flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl whitespace-nowrap"
                            title="Şifreyi Değiştir"
                          >
                            <Key className="h-3 w-3 shrink-0" /> <span>Şifre Düzenle</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delete Institution Footer Action */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500">Bu işlem kurumu ve bağlı tüm kayıtları buluttan kalıcı olarak siler.</span>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => handleDeleteInstitution(selectedInstDetails)}
                  className="btn btn-secondary text-xs py-2 px-3.5 text-red-400 hover:bg-red-500/20 border-red-500/30 flex items-center justify-center gap-1.5 cursor-pointer rounded-xl w-full sm:w-auto shrink-0"
                >
                  <Trash2 className="h-4 w-4 shrink-0" /> <span>Kurumu Tamamen Sil</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Admin Credentials Modal */}
      <AnimatePresence>
        {editingAdminUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingAdminUser(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel relative z-10 max-w-sm w-full p-6 rounded-3xl border border-indigo-500/30 bg-slate-900 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <Key className="h-4 w-4 text-amber-400" /> Şifre & Kullanıcı Adı Düzenle
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingAdminUser(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveAdminCredentials} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Yönetici Adı</label>
                  <input
                    type="text"
                    disabled
                    value={editingAdminUser.name}
                    className="input-field text-xs bg-slate-800/50 opacity-70"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Kullanıcı Adı</label>
                  <input
                    type="text"
                    value={editingAdminUsername}
                    onChange={(e) => setEditingAdminUsername(e.target.value)}
                    className="input-field text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Yeni Şifre</label>
                  <input
                    type="text"
                    value={editingAdminPassword}
                    onChange={(e) => setEditingAdminPassword(e.target.value)}
                    className="input-field text-xs font-mono text-emerald-300"
                    placeholder="Yeni şifre giriniz"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingAdminUser(null)}
                    className="btn btn-secondary text-xs rounded-xl"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary text-xs rounded-xl"
                  >
                    Kaydet ve Güncelle
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign New Admin to Institution Modal */}
      <AnimatePresence>
        {newAdminForInstModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNewAdminForInstModal(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel relative z-10 max-w-sm w-full p-6 rounded-3xl border border-indigo-500/30 bg-slate-900 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-indigo-400" /> Kuruma Yönetici Ata
                </h3>
                <button
                  type="button"
                  onClick={() => setNewAdminForInstModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateAdminForInstitution} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Kurum</label>
                  <input
                    type="text"
                    disabled
                    value={newAdminForInstModal.name}
                    className="input-field text-xs bg-slate-800/50 opacity-70"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Yönetici Ad Soyad</label>
                  <input
                    type="text"
                    value={assignAdminName}
                    onChange={(e) => setAssignAdminName(e.target.value)}
                    className="input-field text-xs"
                    placeholder="ör. Müdür Ahmet"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Kullanıcı Adı</label>
                  <input
                    type="text"
                    value={assignAdminUsername}
                    onChange={(e) => setAssignAdminUsername(e.target.value)}
                    className="input-field text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Giriş Şifresi</label>
                  <input
                    type="text"
                    value={assignAdminPassword}
                    onChange={(e) => setAssignAdminPassword(e.target.value)}
                    className="input-field text-xs font-mono text-emerald-300"
                    placeholder="Şifre belirleyin"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewAdminForInstModal(null)}
                    className="btn btn-secondary text-xs rounded-xl"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary text-xs rounded-xl"
                  >
                    Yöneticiyi Oluştur
                  </button>
                </div>
              </form>
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

      {/* Student Cumulative Multi-Exam Report Modal */}
      {selectedCumulativeStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 animate-fade-in overflow-y-auto">
          <div className="max-w-5xl w-full my-auto max-h-[92vh] overflow-y-auto">
            <StudentCumulativeReport
              initialStudentId={selectedCumulativeStudentId}
              onClose={() => setSelectedCumulativeStudentId(null)}
            />
          </div>
        </div>
      )}

      {/* Modal: Add Global Standard Class */}
      <AnimatePresence>
        {showAddGlobalClassModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddGlobalClassModal(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="glass-panel relative z-10 max-w-md w-full p-6 sm:p-7 rounded-3xl border border-indigo-500/30 bg-slate-900/95 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 shrink-0 text-indigo-400">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">Yeni Standart Sınıf Ekle</h3>
                  <p className="text-xs text-slate-400">Tüm kurumların seçebileceği merkezi şube şablonu</p>
                </div>
              </div>

              <form onSubmit={handleAddGlobalClass} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sınıf / Şube Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={newGlobalName}
                    onChange={(e) => setNewGlobalName(e.target.value)}
                    placeholder="ör. 8-E, 11-DİL, 12-SAY-3 veya Mezun Sayısal"
                    className="input-field text-xs rounded-xl"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Kurum adminleri sınıf açarken bu ismi doğrudan liste üzerinden seçecektir.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sınıf Kademesi / Düzeyi *
                  </label>
                  <select
                    value={newGlobalGrade}
                    onChange={(e) => setNewGlobalGrade(Number(e.target.value))}
                    className="input-field text-xs rounded-xl bg-slate-900"
                  >
                    {gradeLevels.map(gl => (
                      <option key={gl.id} value={gl.level}>
                        {gl.name} ({gl.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Açıklama (İsteğe Bağlı)
                  </label>
                  <input
                    type="text"
                    value={newGlobalDesc}
                    onChange={(e) => setNewGlobalDesc(e.target.value)}
                    placeholder="ör. YKS Eşit Ağırlık Şubesi"
                    className="input-field text-xs rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={() => setShowAddGlobalClassModal(false)}
                    className="btn btn-secondary text-xs rounded-xl py-2.5 px-4 cursor-pointer"
                  >
                    İptal
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    className="btn btn-primary text-xs rounded-xl py-2.5 px-5 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/30"
                  >
                    <Plus className="h-4 w-4" /> Standart Sınıfı Ekle
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Add Grade Level */}
      <AnimatePresence>
        {showAddGradeLevelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddGradeLevelModal(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="glass-panel relative z-10 max-w-md w-full p-6 sm:p-7 rounded-3xl border border-indigo-500/30 bg-slate-900/95 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 shrink-0 text-indigo-400">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">Yeni Sınıf Kademesi / Seviyesi Ekle</h3>
                  <p className="text-xs text-slate-400">5. Sınıf, 6. Sınıf, 7. Sınıf vb. sisteme yeni bir kademe tanımlayın</p>
                </div>
              </div>

              <form onSubmit={handleAddGradeLevel} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Kademe No (Sayı) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={20}
                      value={newGradeLevelNum}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setNewGradeLevelNum(val);
                        if (!newGradeLevelName || newGradeLevelName.includes('. Sınıf')) {
                          setNewGradeLevelName(`${val}. Sınıf`);
                        }
                      }}
                      className="input-field text-xs rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Kategori / Okul Türü *
                    </label>
                    <select
                      value={newGradeLevelCategory}
                      onChange={(e) => setNewGradeLevelCategory(e.target.value as any)}
                      className="input-field text-xs rounded-xl bg-slate-900"
                    >
                      <option value="Ortaokul">Ortaokul (5, 6, 7, 8)</option>
                      <option value="Lise">Lise (9, 10, 11, 12)</option>
                      <option value="İlkokul">İlkokul (1, 2, 3, 4)</option>
                      <option value="Mezun / Diğer">Mezun / Diğer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kademe Adı / Başlığı *
                  </label>
                  <input
                    type="text"
                    required
                    value={newGradeLevelName}
                    onChange={(e) => setNewGradeLevelName(e.target.value)}
                    placeholder="ör. 5. Sınıf veya 6. Sınıf"
                    className="input-field text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Açıklama (İsteğe Bağlı)
                  </label>
                  <input
                    type="text"
                    value={newGradeLevelDesc}
                    onChange={(e) => setNewGradeLevelDesc(e.target.value)}
                    placeholder="ör. Ortaokul Kademesi"
                    className="input-field text-xs rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={() => setShowAddGradeLevelModal(false)}
                    className="btn btn-secondary text-xs rounded-xl py-2.5 px-4 cursor-pointer"
                  >
                    İptal
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    className="btn btn-primary text-xs rounded-xl py-2.5 px-5 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/30"
                  >
                    <Plus className="h-4 w-4" /> Kademeyi Sisteme Ekle
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* ADD SINGLE STUDENT MODAL (SUPER ADMIN) */}
        {showAddStudentModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-panel p-6 w-full max-w-lg space-y-4 border border-slate-700/60 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-white text-base">Yeni Öğrenci Ekle (Tekli)</h3>
                    <p className="text-xs text-slate-400">Sistem Admini olarak kuruma manuel tekil öğrenci kaydı yapın</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSuperAdminAddStudent} className="space-y-4">
                {/* Institution Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Öğrencinin Ekleneceği Kurum *
                  </label>
                  <select
                    required
                    value={studentFormInstId || (institutions[0]?.id || '')}
                    onChange={(e) => {
                      setStudentFormInstId(e.target.value);
                      setStudentFormClassId('');
                    }}
                    className="input-field text-xs rounded-xl bg-slate-900 border-slate-700"
                  >
                    {institutions.map(inst => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.city})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Class Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sınıf / Şube Seçimi *
                  </label>
                  {(() => {
                    const currentInstId = studentFormInstId || institutions[0]?.id || '';
                    const instClasses = storageService.getClasses(currentInstId);
                    return (
                      <select
                        required
                        value={studentFormClassId}
                        onChange={(e) => setStudentFormClassId(e.target.value)}
                        className="input-field text-xs rounded-xl bg-slate-900 border-slate-700"
                      >
                        <option value="">-- Sınıf Seçiniz --</option>
                        {instClasses.length > 0 && (
                          <optgroup label="Kurumun Mevcut Sınıfları">
                            {instClasses.map(cls => (
                              <option key={cls.id} value={cls.id}>
                                {cls.name} {cls.gradeLevel ? `(${cls.gradeLevel}. Sınıf)` : ''}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label="Sistem Standart Şablonları (Kuruma Otomatik Tanımlanır)">
                          {globalClasses.map(gcls => (
                            <option key={`gcls-${gcls.id}`} value={gcls.id}>
                              ⭐ {gcls.name} ({gcls.gradeLevel}. Sınıf Şablonu)
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    );
                  })()}
                  <p className="text-[11px] text-slate-500 mt-1">
                    Kurumun mevcut sınıflarından birini seçebilir veya sistem standart şablonlarından seçerek kuruma otomatik sınıf tanımlayabilirsiniz.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Öğrenci Adı *
                    </label>
                    <input
                      type="text"
                      required
                      value={studentFormFirstName}
                      onChange={(e) => setStudentFormFirstName(e.target.value)}
                      placeholder="ör. Ahmet"
                      className="input-field text-xs rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Öğrenci Soyadı *
                    </label>
                    <input
                      type="text"
                      required
                      value={studentFormLastName}
                      onChange={(e) => setStudentFormLastName(e.target.value)}
                      placeholder="ör. Yılmaz"
                      className="input-field text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Okul / Öğrenci Numarası *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentFormNo}
                    onChange={(e) => setStudentFormNo(e.target.value)}
                    placeholder="ör. 1042"
                    className="input-field text-xs rounded-xl font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Bu numara optik form okumalarında öğrenci eşleştirmesi için kullanılacaktır.
                  </p>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={() => setShowAddStudentModal(false)}
                    className="btn btn-secondary text-xs rounded-xl py-2.5 px-4 cursor-pointer"
                  >
                    İptal
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    className="btn btn-primary text-xs rounded-xl py-2.5 px-5 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/30"
                  >
                    <Plus className="h-4 w-4" /> Öğrenciyi Kaydet
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
