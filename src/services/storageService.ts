import { Institution, SchoolClass, Student, Exam, ScanResult, User, SiteSettings } from '../types';
import { initialInstitutions, initialClasses, initialStudents, initialExams, initialScanResults, initialUsers, initialSiteSettings } from './mockData';

const FIREBASE_DB_URL = 'https://opteno-aba91-default-rtdb.europe-west1.firebasedatabase.app/opteno';

const KEYS = {
  USERS: 'opticok_users',
  CURRENT_USER: 'opticok_current_user',
  INSTITUTIONS: 'opticok_institutions',
  CLASSES: 'opticok_classes',
  STUDENTS: 'opticok_students',
  EXAMS: 'opticok_exams',
  RESULTS: 'opticok_results',
  SITE_SETTINGS: 'opticok_site_settings'
};

// Helper for local storage
const getItem = <T>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
};

const setItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
};

export const resetAllStorage = () => {
  localStorage.removeItem(KEYS.INSTITUTIONS);
  localStorage.removeItem(KEYS.CLASSES);
  localStorage.removeItem(KEYS.STUDENTS);
  localStorage.removeItem(KEYS.EXAMS);
  localStorage.removeItem(KEYS.RESULTS);
  localStorage.removeItem(KEYS.USERS);
  localStorage.removeItem(KEYS.CURRENT_USER);
  localStorage.removeItem(KEYS.SITE_SETTINGS);

  setItem(KEYS.USERS, initialUsers);
  setItem(KEYS.INSTITUTIONS, initialInstitutions);
  setItem(KEYS.CLASSES, initialClasses);
  setItem(KEYS.STUDENTS, initialStudents);
  setItem(KEYS.EXAMS, initialExams);
  setItem(KEYS.RESULTS, initialScanResults);
  setItem(KEYS.SITE_SETTINGS, initialSiteSettings);
  localStorage.setItem('opticok_v3_clean', 'true');
};

let isSyncing = false;
let syncStarted = false;

// Push entire application state to Firebase Cloud Database
export const pushToServer = async () => {
  try {
    const results = getItem<ScanResult[]>(KEYS.RESULTS, initialScanResults);
    const exams = getItem<Exam[]>(KEYS.EXAMS, initialExams);
    const students = getItem<Student[]>(KEYS.STUDENTS, initialStudents);
    const classes = getItem<SchoolClass[]>(KEYS.CLASSES, initialClasses);
    const institutions = getItem<Institution[]>(KEYS.INSTITUTIONS, initialInstitutions);
    const users = getItem<User[]>(KEYS.USERS, initialUsers);
    const siteSettings = getItem<SiteSettings>(KEYS.SITE_SETTINGS, initialSiteSettings);

    await fetch(`${FIREBASE_DB_URL}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        results,
        exams,
        students,
        classes,
        institutions,
        users,
        siteSettings
      })
    });
  } catch (err) {
    console.error('Firebase push failed:', err);
  }
};

// Two-way synchronization with Firebase Cloud Database
export const syncWithServer = async () => {
  if (isSyncing) return;
  isSyncing = true;
  try {
    const res = await fetch(`${FIREBASE_DB_URL}.json`);
    if (!res.ok) {
      isSyncing = false;
      return;
    }
    const serverData = await res.json();

    if (!serverData) {
      // Cloud database empty: push our current baseline
      await pushToServer();
      isSyncing = false;
      return;
    }

    const localExams = getItem<Exam[]>(KEYS.EXAMS, initialExams);
    const localResults = getItem<ScanResult[]>(KEYS.RESULTS, initialScanResults);
    const localStudents = getItem<Student[]>(KEYS.STUDENTS, initialStudents);
    const localClasses = getItem<SchoolClass[]>(KEYS.CLASSES, initialClasses);
    const localInstitutions = getItem<Institution[]>(KEYS.INSTITUTIONS, initialInstitutions);
    const localUsers = getItem<User[]>(KEYS.USERS, initialUsers);

    const serverExams: Exam[] = serverData.exams || [];
    const serverResults: ScanResult[] = serverData.results || [];
    const serverStudents: Student[] = serverData.students || [];
    const serverClasses: SchoolClass[] = serverData.classes || [];
    const serverInstitutions: Institution[] = serverData.institutions || [];
    const serverUsers: User[] = serverData.users || [];

    let hasNewDataForLocal = false;
    let hasLocalDataForServer = false;

    // 1. Merge Results
    const allResultMap = new Map<string, ScanResult>();
    localResults.forEach(r => allResultMap.set(r.id, r));
    serverResults.forEach(r => {
      if (!allResultMap.has(r.id)) {
        allResultMap.set(r.id, r);
        hasNewDataForLocal = true;
      }
    });
    if (allResultMap.size > serverResults.length) hasLocalDataForServer = true;
    const mergedResults = Array.from(allResultMap.values());

    // 2. Merge Exams
    const allExamMap = new Map<string, Exam>();
    localExams.forEach(e => allExamMap.set(e.id, e));
    serverExams.forEach(e => {
      if (!allExamMap.has(e.id)) {
        allExamMap.set(e.id, e);
        hasNewDataForLocal = true;
      }
    });
    if (allExamMap.size > serverExams.length) hasLocalDataForServer = true;
    const mergedExams = Array.from(allExamMap.values());

    // 3. Merge Students
    const allStudentMap = new Map<string, Student>();
    localStudents.forEach(s => allStudentMap.set(s.id, s));
    serverStudents.forEach(s => {
      if (!allStudentMap.has(s.id)) {
        allStudentMap.set(s.id, s);
        hasNewDataForLocal = true;
      }
    });
    if (allStudentMap.size > serverStudents.length) hasLocalDataForServer = true;
    const mergedStudents = Array.from(allStudentMap.values());

    // 4. Merge Classes
    const allClassMap = new Map<string, SchoolClass>();
    localClasses.forEach(c => allClassMap.set(c.id, c));
    serverClasses.forEach(c => {
      if (!allClassMap.has(c.id)) {
        allClassMap.set(c.id, c);
        hasNewDataForLocal = true;
      }
    });
    if (allClassMap.size > serverClasses.length) hasLocalDataForServer = true;
    const mergedClasses = Array.from(allClassMap.values());

    // 5. Merge Institutions
    const allInstMap = new Map<string, Institution>();
    localInstitutions.forEach(i => allInstMap.set(i.id, i));
    serverInstitutions.forEach(i => {
      if (!allInstMap.has(i.id)) {
        allInstMap.set(i.id, i);
        hasNewDataForLocal = true;
      }
    });
    if (allInstMap.size > serverInstitutions.length) hasLocalDataForServer = true;
    const mergedInstitutions = Array.from(allInstMap.values());

    // 6. Merge Users
    const allUserMap = new Map<string, User>();
    localUsers.forEach(u => allUserMap.set(u.id, u));
    serverUsers.forEach(u => {
      if (!allUserMap.has(u.id)) {
        allUserMap.set(u.id, u);
        hasNewDataForLocal = true;
      }
    });
    if (allUserMap.size > serverUsers.length) hasLocalDataForServer = true;
    const mergedUsers = Array.from(allUserMap.values());
    if (!mergedUsers.some(u => u.username?.toLowerCase() === 'admin')) {
      mergedUsers.unshift(initialUsers[0]);
      hasNewDataForLocal = true;
      hasLocalDataForServer = true;
    }

    // 7. Site Settings
    if (serverData.siteSettings) {
      setItem(KEYS.SITE_SETTINGS, serverData.siteSettings);
    }

    if (hasNewDataForLocal) {
      setItem(KEYS.RESULTS, mergedResults);
      setItem(KEYS.EXAMS, mergedExams);
      setItem(KEYS.STUDENTS, mergedStudents);
      setItem(KEYS.CLASSES, mergedClasses);
      setItem(KEYS.INSTITUTIONS, mergedInstitutions);
      setItem(KEYS.USERS, mergedUsers);
      window.dispatchEvent(new CustomEvent('opticok-data-updated'));
    }

    if (hasLocalDataForServer) {
      await pushToServer();
    }
  } catch (err) {
    // Offline or server not responding, keep working locally
  } finally {
    isSyncing = false;
  }
};

// Initialize default data if empty or purge old mock data
export const initStorage = () => {
  // Clear any legacy auto-login session so all users must log in with username & password
  if (!localStorage.getItem('opteno_auth_strict_v1')) {
    localStorage.removeItem(KEYS.CURRENT_USER);
    localStorage.setItem('opteno_auth_strict_v1', 'true');
  }

  if (!localStorage.getItem('opticok_v3_clean')) {
    resetAllStorage();
  }
  if (!localStorage.getItem(KEYS.INSTITUTIONS)) {
    setItem(KEYS.INSTITUTIONS, initialInstitutions);
  }
  if (!localStorage.getItem(KEYS.CLASSES)) {
    setItem(KEYS.CLASSES, initialClasses);
  }
  if (!localStorage.getItem(KEYS.STUDENTS)) {
    setItem(KEYS.STUDENTS, initialStudents);
  }
  if (!localStorage.getItem(KEYS.EXAMS)) {
    setItem(KEYS.EXAMS, initialExams);
  }
  if (!localStorage.getItem(KEYS.RESULTS)) {
    setItem(KEYS.RESULTS, initialScanResults);
  }
  if (!localStorage.getItem(KEYS.USERS)) {
    setItem(KEYS.USERS, initialUsers);
  } else {
    // Ensure default admin user is always present with password 'admin'
    const currentUsers = getItem<User[]>(KEYS.USERS, initialUsers);
    const hasAdmin = currentUsers.some(u => u.username?.toLowerCase() === 'admin');
    if (!hasAdmin) {
      currentUsers.unshift(initialUsers[0]);
      setItem(KEYS.USERS, currentUsers);
    } else {
      const updatedUsers = currentUsers.map(u => {
        if (u.username?.toLowerCase() === 'admin') {
          return { ...u, password: 'admin', status: 'ACTIVE' as const };
        }
        return u;
      });
      setItem(KEYS.USERS, updatedUsers);
    }
  }

  if (!localStorage.getItem(KEYS.SITE_SETTINGS)) {
    setItem(KEYS.SITE_SETTINGS, initialSiteSettings);
  }

  // Start two-way real-time sync with Firebase Cloud Database
  if (!syncStarted && typeof window !== 'undefined') {
    syncStarted = true;
    syncWithServer();
    setInterval(syncWithServer, 3000);
    window.addEventListener('focus', syncWithServer);
    window.addEventListener('online', syncWithServer);

    // Optional SSE listener for instantaneous cloud updates
    try {
      if (typeof EventSource !== 'undefined') {
        const sse = new EventSource(`${FIREBASE_DB_URL}.json`);
        sse.addEventListener('put', () => syncWithServer());
        sse.addEventListener('patch', () => syncWithServer());
      }
    } catch {
      // EventSource fallback handled by interval
    }
  }
};

export const storageService = {
  // Site Settings
  getSiteSettings: (): SiteSettings => {
    const s = getItem<SiteSettings>(KEYS.SITE_SETTINGS, initialSiteSettings);
    if (!s || s.siteTitle === 'OpticOk' || s.logoText === 'OpticOk') {
      const updated: SiteSettings = {
        ...initialSiteSettings,
        ...s,
        siteTitle: 'Opteno',
        logoText: 'Opteno',
        siteSubtitle: 'Dijital Sınav Yönetim Sistemi'
      };
      setItem(KEYS.SITE_SETTINGS, updated);
      pushToServer();
      return updated;
    }
    return s;
  },
  saveSiteSettings: (settings: SiteSettings) => {
    setItem(KEYS.SITE_SETTINGS, settings);
    pushToServer();
  },

  // Current User & Users Management
  getSessionUser: (): User | null => getItem<User | null>(KEYS.CURRENT_USER, null),
  getCurrentUser: (): User => getItem<User | null>(KEYS.CURRENT_USER, null) || initialUsers[0],
  setCurrentUser: (user: User | null) => {
    if (user) {
      setItem(KEYS.CURRENT_USER, user);
    } else {
      localStorage.removeItem(KEYS.CURRENT_USER);
    }
  },
  logoutUser: () => {
    localStorage.removeItem(KEYS.CURRENT_USER);
  },
  getAllUsers: (): User[] => getItem<User[]>(KEYS.USERS, initialUsers),
  getUsersByInstitution: (institutionId: string): User[] => {
    return storageService.getAllUsers().filter(u => u.institutionId === institutionId);
  },
  addUser: (newUser: User) => {
    const list = storageService.getAllUsers();
    // Prevent duplicate user IDs
    const filtered = list.filter(u => u.id !== newUser.id);
    filtered.unshift(newUser);
    setItem(KEYS.USERS, filtered);
    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },
  updateUser: (updatedUser: User) => {
    const list = storageService.getAllUsers().map(u => u.id === updatedUser.id ? updatedUser : u);
    setItem(KEYS.USERS, list);
    const current = storageService.getSessionUser();
    if (current && current.id === updatedUser.id) {
      setItem(KEYS.CURRENT_USER, updatedUser);
    }
    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },
  deleteUser: (userId: string) => {
    const list = storageService.getAllUsers().filter(u => u.id !== userId);
    setItem(KEYS.USERS, list);
    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },

  // Institutions
  getInstitutions: (): Institution[] => getItem<Institution[]>(KEYS.INSTITUTIONS, initialInstitutions),
  addInstitution: (institution: Institution) => {
    const list = storageService.getInstitutions();
    const filtered = list.filter(i => i.id !== institution.id);
    filtered.unshift(institution);
    setItem(KEYS.INSTITUTIONS, filtered);
    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },
  updateInstitution: (updated: Institution) => {
    const list = storageService.getInstitutions().map(i => i.id === updated.id ? updated : i);
    setItem(KEYS.INSTITUTIONS, list);
    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },
  deleteInstitution: (institutionId: string) => {
    const list = storageService.getInstitutions().filter(i => i.id !== institutionId);
    setItem(KEYS.INSTITUTIONS, list);
    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },

  // Classes
  getClasses: (institutionId?: string): SchoolClass[] => {
    const list = getItem<SchoolClass[]>(KEYS.CLASSES, initialClasses);
    return institutionId ? list.filter(c => c.institutionId === institutionId) : list;
  },
  addClass: (newClass: SchoolClass) => {
    const list = getItem<SchoolClass[]>(KEYS.CLASSES, initialClasses);
    const filtered = list.filter(c => c.id !== newClass.id);
    filtered.unshift(newClass);
    setItem(KEYS.CLASSES, filtered);
    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },
  deleteClass: (classId: string) => {
    const list = getItem<SchoolClass[]>(KEYS.CLASSES, initialClasses).filter(c => c.id !== classId);
    setItem(KEYS.CLASSES, list);
    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },

  // Students
  getStudents: (institutionId?: string, classId?: string): Student[] => {
    let list = getItem<Student[]>(KEYS.STUDENTS, initialStudents);
    if (institutionId) list = list.filter(s => s.institutionId === institutionId);
    if (classId) list = list.filter(s => s.classId === classId);
    return list;
  },
  addStudent: (student: Student) => {
    const list = getItem<Student[]>(KEYS.STUDENTS, initialStudents);
    const filtered = list.filter(s => s.id !== student.id);
    filtered.unshift(student);
    setItem(KEYS.STUDENTS, filtered);
    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },
  addStudentsBatch: (students: Student[]) => {
    const list = getItem<Student[]>(KEYS.STUDENTS, initialStudents);
    const newIds = new Set(students.map(s => s.id));
    const kept = list.filter(s => !newIds.has(s.id));
    const combined = [...students, ...kept];
    setItem(KEYS.STUDENTS, combined);
    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },
  deleteStudent: (studentId: string) => {
    const list = getItem<Student[]>(KEYS.STUDENTS, initialStudents).filter(s => s.id !== studentId);
    setItem(KEYS.STUDENTS, list);
    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },

  // Exams
  getExams: (institutionId?: string): Exam[] => {
    const list = getItem<Exam[]>(KEYS.EXAMS, initialExams);
    return institutionId ? list.filter(e => e.institutionId === institutionId) : list;
  },
  getExamById: (examId: string): Exam | undefined => {
    const list = getItem<Exam[]>(KEYS.EXAMS, initialExams);
    return list.find(e => e.id === examId);
  },
  addExam: (exam: Exam) => {
    const list = getItem<Exam[]>(KEYS.EXAMS, initialExams);
    const filtered = list.filter(e => e.id !== exam.id);
    filtered.unshift(exam);
    setItem(KEYS.EXAMS, filtered);
    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },
  updateExam: (exam: Exam) => {
    const list = getItem<Exam[]>(KEYS.EXAMS, initialExams).map(e => e.id === exam.id ? exam : e);
    setItem(KEYS.EXAMS, list);
    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },
  deleteExam: (examId: string) => {
    const list = getItem<Exam[]>(KEYS.EXAMS, initialExams).filter(e => e.id !== examId);
    setItem(KEYS.EXAMS, list);
    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },

  // Scan Results
  getAllScanResults: (): ScanResult[] => getItem<ScanResult[]>(KEYS.RESULTS, initialScanResults),
  getResults: (examId?: string): ScanResult[] => {
    const list = getItem<ScanResult[]>(KEYS.RESULTS, initialScanResults);
    return examId ? list.filter(r => r.examId === examId) : list;
  },
  saveScanResult: (result: ScanResult) => {
    const list = getItem<ScanResult[]>(KEYS.RESULTS, initialScanResults);
    const existingIndex = list.findIndex(r => r.id === result.id || (r.examId === result.examId && r.studentId === result.studentId && result.studentId !== 'std-guest'));
    if (existingIndex >= 0) {
      list[existingIndex] = result;
    } else {
      list.unshift(result);
    }
    setItem(KEYS.RESULTS, list);

    const exams = storageService.getExams();
    const exam = exams.find(e => e.id === result.examId);
    if (exam) {
      exam.totalExamsScanned = list.filter(r => r.examId === result.examId).length;
      setItem(KEYS.EXAMS, exams);
    }

    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },
  deleteScanResult: (resultId: string) => {
    const list = getItem<ScanResult[]>(KEYS.RESULTS, initialScanResults).filter(r => r.id !== resultId);
    setItem(KEYS.RESULTS, list);
    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },

  // Full System Backup & Restore
  exportFullBackup: () => {
    const backupData = {
      system: 'Opteno / OpticOk OMR',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      siteSettings: getItem(KEYS.SITE_SETTINGS, initialSiteSettings),
      institutions: getItem(KEYS.INSTITUTIONS, initialInstitutions),
      classes: getItem(KEYS.CLASSES, initialClasses),
      students: getItem(KEYS.STUDENTS, initialStudents),
      exams: getItem(KEYS.EXAMS, initialExams),
      results: getItem(KEYS.RESULTS, initialScanResults),
      users: getItem(KEYS.USERS, initialUsers)
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `Opteno_Tam_Sistem_Yedegi_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  importFullBackup: async (file: File): Promise<{ success: boolean; message: string; stats?: any }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          if (!data || (!data.institutions && !data.exams && !data.students)) {
            resolve({ success: false, message: 'Geçersiz yedek dosyası formatı. Opteno yedek JSON dosyası seçilmelidir.' });
            return;
          }

          if (data.siteSettings) setItem(KEYS.SITE_SETTINGS, data.siteSettings);
          if (Array.isArray(data.institutions)) setItem(KEYS.INSTITUTIONS, data.institutions);
          if (Array.isArray(data.classes)) setItem(KEYS.CLASSES, data.classes);
          if (Array.isArray(data.students)) setItem(KEYS.STUDENTS, data.students);
          if (Array.isArray(data.exams)) setItem(KEYS.EXAMS, data.exams);
          if (Array.isArray(data.results)) setItem(KEYS.RESULTS, data.results);
          if (Array.isArray(data.users)) setItem(KEYS.USERS, data.users);

          pushToServer();
          window.dispatchEvent(new Event('opticok-data-updated'));

          const stats = {
            exams: data.exams?.length || 0,
            students: data.students?.length || 0,
            classes: data.classes?.length || 0,
            results: data.results?.length || 0
          };

          resolve({
            success: true,
            message: `Yedek başarıyla yüklendi: ${stats.exams} Sınav, ${stats.students} Öğrenci, ${stats.results} Okunmuş Sonuç aktarıldı.`,
            stats
          });
        } catch (err: any) {
          resolve({ success: false, message: `Yedek dosyası okunamadı: ${err.message || 'Bilinmeyen hata'}` });
        }
      };
      reader.onerror = () => {
        resolve({ success: false, message: 'Dosya okunurken bir hata oluştu.' });
      };
      reader.readAsText(file);
    });
  },

  resetAllStorage
};
