import { Institution, SchoolClass, Student, Exam, ScanResult, User, SiteSettings, GlobalClassTemplate } from '../types';
import { initialInstitutions, initialClasses, initialStudents, initialExams, initialScanResults, initialUsers, initialSiteSettings } from './mockData';

const FIREBASE_DB_URL = 'https://opteno-aba91-default-rtdb.europe-west1.firebasedatabase.app/opteno';

const KEYS = {
  USERS: 'opticok_users',
  CURRENT_USER: 'opticok_current_user',
  INSTITUTIONS: 'opticok_institutions',
  CLASSES: 'opticok_classes',
  GLOBAL_CLASSES: 'opticok_global_classes',
  STUDENTS: 'opticok_students',
  EXAMS: 'opticok_exams',
  RESULTS: 'opticok_results',
  SITE_SETTINGS: 'opticok_site_settings'
};

export const initialGlobalClasses: GlobalClassTemplate[] = [
  { id: 'gcls-8a', name: '8-A', gradeLevel: 8, description: '8. Sınıf LGS Şubesi' },
  { id: 'gcls-8b', name: '8-B', gradeLevel: 8, description: '8. Sınıf LGS Şubesi' },
  { id: 'gcls-8c', name: '8-C', gradeLevel: 8, description: '8. Sınıf LGS Şubesi' },
  { id: 'gcls-8d', name: '8-D', gradeLevel: 8, description: '8. Sınıf LGS Şubesi' },

  { id: 'gcls-9a', name: '9-A', gradeLevel: 9, description: '9. Sınıf Şubesi' },
  { id: 'gcls-9b', name: '9-B', gradeLevel: 9, description: '9. Sınıf Şubesi' },
  { id: 'gcls-9c', name: '9-C', gradeLevel: 9, description: '9. Sınıf Şubesi' },

  { id: 'gcls-10a', name: '10-A', gradeLevel: 10, description: '10. Sınıf Şubesi' },
  { id: 'gcls-10b', name: '10-B', gradeLevel: 10, description: '10. Sınıf Şubesi' },
  { id: 'gcls-10c', name: '10-C', gradeLevel: 10, description: '10. Sınıf Şubesi' },

  { id: 'gcls-11a', name: '11-A', gradeLevel: 11, description: '11. Sınıf Genel' },
  { id: 'gcls-11say', name: '11-SAY', gradeLevel: 11, description: '11. Sınıf Sayısal' },
  { id: 'gcls-11ea', name: '11-EA', gradeLevel: 11, description: '11. Sınıf Eşit Ağırlık' },
  { id: 'gcls-11soz', name: '11-SÖZ', gradeLevel: 11, description: '11. Sınıf Sözel' },

  { id: 'gcls-12a', name: '12-A', gradeLevel: 12, description: '12. Sınıf Genel' },
  { id: 'gcls-12say1', name: '12-SAY-1', gradeLevel: 12, description: '12. Sınıf YKS Sayısal - 1' },
  { id: 'gcls-12say2', name: '12-SAY-2', gradeLevel: 12, description: '12. Sınıf YKS Sayısal - 2' },
  { id: 'gcls-12ea1', name: '12-EA-1', gradeLevel: 12, description: '12. Sınıf YKS Eşit Ağırlık - 1' },
  { id: 'gcls-12soz', name: '12-SÖZ', gradeLevel: 12, description: '12. Sınıf YKS Sözel' },
  { id: 'gcls-mezun-say', name: 'Mezun Sayısal', gradeLevel: 12, description: 'Mezun YKS Sayısal Grubu' },
  { id: 'gcls-mezun-ea', name: 'Mezun Eşit Ağırlık', gradeLevel: 12, description: 'Mezun YKS Eşit Ağırlık Grubu' }
];

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
  localStorage.removeItem(KEYS.GLOBAL_CLASSES);
  localStorage.removeItem(KEYS.STUDENTS);
  localStorage.removeItem(KEYS.EXAMS);
  localStorage.removeItem(KEYS.RESULTS);
  localStorage.removeItem(KEYS.USERS);
  localStorage.removeItem(KEYS.CURRENT_USER);
  localStorage.removeItem(KEYS.SITE_SETTINGS);

  setItem(KEYS.USERS, initialUsers);
  setItem(KEYS.INSTITUTIONS, initialInstitutions);
  setItem(KEYS.CLASSES, initialClasses);
  setItem(KEYS.GLOBAL_CLASSES, initialGlobalClasses);
  setItem(KEYS.STUDENTS, initialStudents);
  setItem(KEYS.EXAMS, initialExams);
  setItem(KEYS.RESULTS, initialScanResults);
  setItem(KEYS.SITE_SETTINGS, initialSiteSettings);
  localStorage.setItem('opticok_v3_clean', 'true');
};

let isSyncing = false;
let isPushing = false;
let syncStarted = false;
let lastLocalWriteTime = 0;

// Push entire application state to Firebase Cloud Database
export const pushToServer = async () => {
  isPushing = true;
  lastLocalWriteTime = Date.now();
  try {
    const results = getItem<ScanResult[]>(KEYS.RESULTS, initialScanResults);
    const exams = getItem<Exam[]>(KEYS.EXAMS, initialExams);
    const students = getItem<Student[]>(KEYS.STUDENTS, initialStudents);
    const classes = getItem<SchoolClass[]>(KEYS.CLASSES, initialClasses);
    const globalClasses = getItem<GlobalClassTemplate[]>(KEYS.GLOBAL_CLASSES, initialGlobalClasses);
    const institutions = getItem<Institution[]>(KEYS.INSTITUTIONS, initialInstitutions);
    const users = getItem<User[]>(KEYS.USERS, initialUsers);
    const siteSettings = getItem<SiteSettings>(KEYS.SITE_SETTINGS, initialSiteSettings);

    const res = await fetch(`${FIREBASE_DB_URL}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        results,
        exams,
        students,
        classes,
        globalClasses,
        institutions,
        users,
        siteSettings
      })
    });
    if (!res.ok) {
      console.error('Firebase push returned non-OK status:', res.status);
    }
  } catch (err) {
    console.error('Firebase push failed:', err);
  } finally {
    // Keep lock active briefly so background GET requests cannot overwrite fresh local push
    setTimeout(() => {
      isPushing = false;
    }, 1500);
  }
};

// Synchronization with Firebase Cloud Database (Authoritative Single Source of Truth)
export const syncWithServer = async () => {
  // If pushing or recent local write happened within 3.5 seconds, don't overwrite with stale server cache
  if (isSyncing || isPushing || (Date.now() - lastLocalWriteTime < 3500)) return;
  isSyncing = true;
  try {
    const res = await fetch(`${FIREBASE_DB_URL}.json`);
    if (!res.ok) {
      isSyncing = false;
      return;
    }
    const serverData = await res.json();

    // Re-check after network response in case a user mutation occurred while awaiting
    if (isPushing || (Date.now() - lastLocalWriteTime < 3500)) {
      isSyncing = false;
      return;
    }

    if (!serverData) {
      // Cloud database empty: push our current baseline
      await pushToServer();
      isSyncing = false;
      return;
    }

    const serverExams: Exam[] = serverData.exams || [];
    const serverResults: ScanResult[] = serverData.results || [];
    const serverStudents: Student[] = serverData.students || [];
    const serverClasses: SchoolClass[] = serverData.classes || [];
    const serverGlobalClasses: GlobalClassTemplate[] = serverData.globalClasses || [];
    const serverInstitutions: Institution[] = serverData.institutions || [];
    const serverUsers: User[] = serverData.users || [];

    // Ensure default admin user always exists
    if (!serverUsers.some(u => u.username?.toLowerCase() === 'admin')) {
      serverUsers.unshift(initialUsers[0]);
    }

    // Check if anything has changed compared to current localStorage
    const localExamsRaw = localStorage.getItem(KEYS.EXAMS) || '[]';
    const localResultsRaw = localStorage.getItem(KEYS.RESULTS) || '[]';
    const localStudentsRaw = localStorage.getItem(KEYS.STUDENTS) || '[]';
    const localClassesRaw = localStorage.getItem(KEYS.CLASSES) || '[]';
    const localGlobalClassesRaw = localStorage.getItem(KEYS.GLOBAL_CLASSES) || '[]';
    const localInstRaw = localStorage.getItem(KEYS.INSTITUTIONS) || '[]';
    const localUsersRaw = localStorage.getItem(KEYS.USERS) || '[]';

    const serverExamsStr = JSON.stringify(serverExams);
    const serverResultsStr = JSON.stringify(serverResults);
    const serverStudentsStr = JSON.stringify(serverStudents);
    const serverClassesStr = JSON.stringify(serverClasses);
    const serverGlobalClassesStr = JSON.stringify(serverGlobalClasses);
    const serverInstStr = JSON.stringify(serverInstitutions);
    const serverUsersStr = JSON.stringify(serverUsers);

    let hasChanged = false;

    if (localExamsRaw !== serverExamsStr) {
      setItem(KEYS.EXAMS, serverExams);
      hasChanged = true;
    }
    if (localResultsRaw !== serverResultsStr) {
      setItem(KEYS.RESULTS, serverResults);
      hasChanged = true;
    }
    if (localStudentsRaw !== serverStudentsStr) {
      setItem(KEYS.STUDENTS, serverStudents);
      hasChanged = true;
    }
    if (localClassesRaw !== serverClassesStr) {
      setItem(KEYS.CLASSES, serverClasses);
      hasChanged = true;
    }
    if (serverGlobalClasses.length > 0 && localGlobalClassesRaw !== serverGlobalClassesStr) {
      setItem(KEYS.GLOBAL_CLASSES, serverGlobalClasses);
      hasChanged = true;
    }
    if (localInstRaw !== serverInstStr) {
      setItem(KEYS.INSTITUTIONS, serverInstitutions);
      hasChanged = true;
    }
    if (localUsersRaw !== serverUsersStr) {
      setItem(KEYS.USERS, serverUsers);
      hasChanged = true;
    }
    if (serverData.siteSettings) {
      setItem(KEYS.SITE_SETTINGS, serverData.siteSettings);
    }

    if (hasChanged) {
      window.dispatchEvent(new CustomEvent('opticok-data-updated'));
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
  if (!localStorage.getItem(KEYS.GLOBAL_CLASSES)) {
    setItem(KEYS.GLOBAL_CLASSES, initialGlobalClasses);
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
    // Prevent duplicate user IDs or same usernames
    const filtered = list.filter(
      u => u.id !== newUser.id && u.username?.trim().toLowerCase() !== newUser.username?.trim().toLowerCase()
    );
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
  deleteInstitution: async (institutionId: string) => {
    isPushing = true;
    lastLocalWriteTime = Date.now();

    // 1. Remove institution
    const currentInst = storageService.getInstitutions();
    const instList = currentInst.filter(i => i.id !== institutionId);
    setItem(KEYS.INSTITUTIONS, instList);

    // 2. Remove associated users (preserve SuperAdmin)
    const currentUserList = storageService.getAllUsers();
    const userList = currentUserList.filter(
      u => u.institutionId !== institutionId || u.role === 'SUPER_ADMIN'
    );
    setItem(KEYS.USERS, userList);

    // 3. Remove associated classes
    const currentClasses = storageService.getClasses();
    const classList = currentClasses.filter(c => c.institutionId !== institutionId);
    setItem(KEYS.CLASSES, classList);

    // 4. Remove associated students
    const currentStudents = storageService.getStudents();
    const studentList = currentStudents.filter(s => s.institutionId !== institutionId);
    setItem(KEYS.STUDENTS, studentList);

    // 5. Remove associated exams
    const currentExams = storageService.getExams();
    const examList = currentExams.filter(e => e.institutionId !== institutionId);
    setItem(KEYS.EXAMS, examList);

    window.dispatchEvent(new CustomEvent('opticok-data-updated'));

    // 6. Direct authoritative push to Firebase Cloud Database
    try {
      const siteSettings = getItem<SiteSettings>(KEYS.SITE_SETTINGS, initialSiteSettings);
      const results = getItem<ScanResult[]>(KEYS.RESULTS, initialScanResults);

      await fetch(`${FIREBASE_DB_URL}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          results,
          exams: examList,
          students: studentList,
          classes: classList,
          institutions: instList,
          users: userList,
          siteSettings
        })
      });
      lastLocalWriteTime = Date.now();
    } catch (err) {
      console.error('Direct Firebase delete push failed:', err);
    } finally {
      setTimeout(() => {
        isPushing = false;
      }, 2000);
    }
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

  // Global Standard Classes (Managed by Super Admin)
  getGlobalClasses: (gradeLevel?: number): GlobalClassTemplate[] => {
    const list = getItem<GlobalClassTemplate[]>(KEYS.GLOBAL_CLASSES, initialGlobalClasses);
    return gradeLevel !== undefined ? list.filter(c => c.gradeLevel === gradeLevel) : list;
  },
  addGlobalClass: (template: GlobalClassTemplate) => {
    const list = getItem<GlobalClassTemplate[]>(KEYS.GLOBAL_CLASSES, initialGlobalClasses);
    const filtered = list.filter(c => c.id !== template.id);
    filtered.push(template);
    setItem(KEYS.GLOBAL_CLASSES, filtered);
    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },
  deleteGlobalClass: (templateId: string) => {
    const list = getItem<GlobalClassTemplate[]>(KEYS.GLOBAL_CLASSES, initialGlobalClasses).filter(c => c.id !== templateId);
    setItem(KEYS.GLOBAL_CLASSES, list);
    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },
  resetGlobalClassesToDefault: () => {
    setItem(KEYS.GLOBAL_CLASSES, initialGlobalClasses);
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
      globalClasses: getItem(KEYS.GLOBAL_CLASSES, initialGlobalClasses),
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
          if (Array.isArray(data.globalClasses)) setItem(KEYS.GLOBAL_CLASSES, data.globalClasses);
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
