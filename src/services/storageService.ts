import { Institution, SchoolClass, Student, Exam, ScanResult, User, SiteSettings, GlobalClassTemplate, SystemGradeLevel } from '../types';
import { initialInstitutions, initialClasses, initialStudents, initialExams, initialScanResults, initialUsers, initialSiteSettings } from './mockData';

const FIREBASE_DB_URL = 'https://opteno-aba91-default-rtdb.europe-west1.firebasedatabase.app/opteno';

const KEYS = {
  USERS: 'opticok_users',
  CURRENT_USER: 'opticok_current_user',
  INSTITUTIONS: 'opticok_institutions',
  CLASSES: 'opticok_classes',
  GRADE_LEVELS: 'opticok_grade_levels',
  GLOBAL_CLASSES: 'opticok_global_classes',
  STUDENTS: 'opticok_students',
  EXAMS: 'opticok_exams',
  RESULTS: 'opticok_results',
  SITE_SETTINGS: 'opticok_site_settings'
};

export const initialGradeLevels: SystemGradeLevel[] = [
  { id: 'grade-5', level: 5, name: '5. Sınıf', category: 'Ortaokul', description: 'Ortaokul 1. Kademe', isActive: true, order: 1 },
  { id: 'grade-6', level: 6, name: '6. Sınıf', category: 'Ortaokul', description: 'Ortaokul 2. Kademe', isActive: true, order: 2 },
  { id: 'grade-7', level: 7, name: '7. Sınıf', category: 'Ortaokul', description: 'Ortaokul 3. Kademe', isActive: true, order: 3 },
  { id: 'grade-8', level: 8, name: '8. Sınıf (LGS)', category: 'Ortaokul', description: 'LGS Sınav Hazırlık Kademesi', isActive: true, order: 4 },
  { id: 'grade-9', level: 9, name: '9. Sınıf', category: 'Lise', description: 'Lise 1. Kademe', isActive: true, order: 5 },
  { id: 'grade-10', level: 10, name: '10. Sınıf', category: 'Lise', description: 'Lise 2. Kademe', isActive: true, order: 6 },
  { id: 'grade-11', level: 11, name: '11. Sınıf', category: 'Lise', description: 'Lise Alan Seçimi Kademesi', isActive: true, order: 7 },
  { id: 'grade-12', level: 12, name: '12. Sınıf (YKS)', category: 'Lise', description: 'YKS (TYT - AYT) Sınav Hazırlık Kademesi', isActive: true, order: 8 },
  { id: 'grade-13', level: 13, name: 'Mezun (YKS)', category: 'Mezun / Diğer', description: 'Mezun YKS Hazırlık Grubu', isActive: true, order: 9 }
];

export const initialGlobalClasses: GlobalClassTemplate[] = [
  { id: 'gcls-5a', name: '5-A', gradeLevel: 5, description: '5. Sınıf Ortaokul Şubesi' },
  { id: 'gcls-5b', name: '5-B', gradeLevel: 5, description: '5. Sınıf Ortaokul Şubesi' },
  { id: 'gcls-5c', name: '5-C', gradeLevel: 5, description: '5. Sınıf Ortaokul Şubesi' },

  { id: 'gcls-6a', name: '6-A', gradeLevel: 6, description: '6. Sınıf Ortaokul Şubesi' },
  { id: 'gcls-6b', name: '6-B', gradeLevel: 6, description: '6. Sınıf Ortaokul Şubesi' },
  { id: 'gcls-6c', name: '6-C', gradeLevel: 6, description: '6. Sınıf Ortaokul Şubesi' },

  { id: 'gcls-7a', name: '7-A', gradeLevel: 7, description: '7. Sınıf Ortaokul Şubesi' },
  { id: 'gcls-7b', name: '7-B', gradeLevel: 7, description: '7. Sınıf Ortaokul Şubesi' },
  { id: 'gcls-7c', name: '7-C', gradeLevel: 7, description: '7. Sınıf Ortaokul Şubesi' },

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
  { id: 'gcls-mezun-say', name: 'Mezun Sayısal', gradeLevel: 13, description: 'Mezun YKS Sayısal Grubu' },
  { id: 'gcls-mezun-ea', name: 'Mezun Eşit Ağırlık', gradeLevel: 13, description: 'Mezun YKS Eşit Ağırlık Grubu' }
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
    // If quota exceeded, clean up old legacy images and retry
    if (key === KEYS.RESULTS && Array.isArray(value)) {
      try {
        const cleaned = (value as any[]).map(item => {
          if (item && item.rawImageBase64) {
            const copy = { ...item };
            delete copy.rawImageBase64;
            return copy;
          }
          return item;
        });
        localStorage.setItem(key, JSON.stringify(cleaned));
        console.warn('Successfully saved results after stripping image payloads');
      } catch (retryErr) {
        console.error('Retry saving results also failed:', retryErr);
      }
    }
  }
};

export const resetAllStorage = () => {
  localStorage.removeItem(KEYS.INSTITUTIONS);
  localStorage.removeItem(KEYS.CLASSES);
  localStorage.removeItem(KEYS.GRADE_LEVELS);
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
  setItem(KEYS.GRADE_LEVELS, initialGradeLevels);
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

// Push system configuration, exams, students, and institutions to Firebase
// IMPORTANT: Does NOT push results array, so scan results are NEVER overwritten or wiped out in bulk!
export const pushToServer = async () => {
  if (isPushing) return;
  isPushing = true;
  lastLocalWriteTime = Date.now();
  try {
    const exams = getItem<Exam[]>(KEYS.EXAMS, initialExams);
    const students = getItem<Student[]>(KEYS.STUDENTS, initialStudents);
    const classes = getItem<SchoolClass[]>(KEYS.CLASSES, initialClasses);
    const gradeLevels = getItem<SystemGradeLevel[]>(KEYS.GRADE_LEVELS, initialGradeLevels);
    const globalClasses = getItem<GlobalClassTemplate[]>(KEYS.GLOBAL_CLASSES, initialGlobalClasses);
    const institutions = getItem<Institution[]>(KEYS.INSTITUTIONS, initialInstitutions);
    const users = getItem<User[]>(KEYS.USERS, initialUsers);
    const siteSettings = getItem<SiteSettings>(KEYS.SITE_SETTINGS, initialSiteSettings);

    const res = await fetch(`${FIREBASE_DB_URL}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exams,
        students,
        classes,
        gradeLevels,
        globalClasses,
        institutions,
        users,
        siteSettings
      })
    });
    if (!res.ok) {
      console.error('Firebase PATCH returned non-OK status:', res.status);
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

// Directly push users array to Firebase users endpoint to avoid race conditions
export const pushUsersToServer = async (usersToPush?: User[]) => {
  try {
    const users = usersToPush || getItem<User[]>(KEYS.USERS, initialUsers);
    await fetch(`${FIREBASE_DB_URL}/users.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(users)
    });
  } catch (e) {
    console.error('Direct push users to Firebase failed:', e);
  }
};

// Directly push institutions array to Firebase institutions endpoint
export const pushInstitutionsToServer = async (instsToPush?: Institution[]) => {
  try {
    const insts = instsToPush || getItem<Institution[]>(KEYS.INSTITUTIONS, initialInstitutions);
    await fetch(`${FIREBASE_DB_URL}/institutions.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(insts)
    });
  } catch (e) {
    console.error('Direct push institutions to Firebase failed:', e);
  }
};

// Atomic Single Scan Result Cloud Push (Prevents race conditions & avoids full database overwrite)
export const pushSingleResultToServer = async (result: ScanResult) => {
  try {
    const resultToPush = { ...result };
    if (resultToPush.rawImageBase64) {
      delete resultToPush.rawImageBase64;
    }
    const res = await fetch(`${FIREBASE_DB_URL}/results/${encodeURIComponent(resultToPush.id)}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resultToPush)
    });
    if (!res.ok) {
      console.warn('Single result push returned non-OK status:', res.status);
    }
  } catch (e) {
    console.error('Direct push single result to Firebase failed:', e);
  }
};

// Atomic Single Scan Result Cloud Delete
export const deleteSingleResultFromServer = async (resultId: string) => {
  try {
    await fetch(`${FIREBASE_DB_URL}/results/${encodeURIComponent(resultId)}.json`, {
      method: 'DELETE'
    });
  } catch (e) {
    console.error('Direct delete result from Firebase failed:', e);
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

    const serverExams: Exam[] = (serverData.exams || []).map((e: Exam) => ({
      ...e,
      isSystemExam: e.isSystemExam !== undefined
        ? e.isSystemExam
        : (e.createdByRole === 'SUPER_ADMIN' || e.institutionId === 'ALL' || e.institutionId === 'SYSTEM')
    }));

    // Parse serverResults safely whether it is Array or Object/Map:
    let serverResultsRawList: ScanResult[] = [];
    if (Array.isArray(serverData.results)) {
      serverResultsRawList = serverData.results.filter(Boolean);
    } else if (serverData.results && typeof serverData.results === 'object') {
      serverResultsRawList = (Object.values(serverData.results) as ScanResult[]).filter(Boolean);
    }

    // Bidirectional Safe Merge for Scan Results:
    const localResults = getItem<ScanResult[]>(KEYS.RESULTS, initialScanResults);
    const resultMap = new Map<string, ScanResult>();

    // 1. Load server results
    serverResultsRawList.forEach(sr => {
      if (sr && sr.id) {
        if (sr.rawImageBase64) delete sr.rawImageBase64;
        resultMap.set(sr.id, sr);
      }
    });

    // 2. Preserve any local results not yet in cloud, and queue them to sync up
    const missingInCloud: ScanResult[] = [];
    localResults.forEach(lr => {
      if (!lr || !lr.id) return;
      if (lr.rawImageBase64) delete lr.rawImageBase64;
      if (!resultMap.has(lr.id)) {
        resultMap.set(lr.id, lr);
        missingInCloud.push(lr);
      }
    });

    // Fire-and-forget sync missing results to cloud
    if (missingInCloud.length > 0) {
      missingInCloud.forEach(r => pushSingleResultToServer(r));
    }

    const mergedResults = Array.from(resultMap.values());
    mergedResults.sort((a, b) => new Date(b.scannedAt || 0).getTime() - new Date(a.scannedAt || 0).getTime());

    const serverStudents: Student[] = serverData.students || [];
    const serverClasses: SchoolClass[] = serverData.classes || [];
    const serverGradeLevels: SystemGradeLevel[] = serverData.gradeLevels || [];
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
    const localGradeLevelsRaw = localStorage.getItem(KEYS.GRADE_LEVELS) || '[]';
    const localGlobalClassesRaw = localStorage.getItem(KEYS.GLOBAL_CLASSES) || '[]';
    const localInstRaw = localStorage.getItem(KEYS.INSTITUTIONS) || '[]';
    const localUsersRaw = localStorage.getItem(KEYS.USERS) || '[]';

    const serverExamsStr = JSON.stringify(serverExams);
    const mergedResultsStr = JSON.stringify(mergedResults);
    const serverStudentsStr = JSON.stringify(serverStudents);
    const serverClassesStr = JSON.stringify(serverClasses);
    const serverGradeLevelsStr = JSON.stringify(serverGradeLevels);
    const serverGlobalClassesStr = JSON.stringify(serverGlobalClasses);
    const serverInstStr = JSON.stringify(serverInstitutions);
    const serverUsersStr = JSON.stringify(serverUsers);

    let hasChanged = false;

    if (localExamsRaw !== serverExamsStr) {
      setItem(KEYS.EXAMS, serverExams);
      hasChanged = true;
    }
    if (localResultsRaw !== mergedResultsStr) {
      setItem(KEYS.RESULTS, mergedResults);
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
    if (serverGradeLevels.length > 0 && localGradeLevelsRaw !== serverGradeLevelsStr) {
      setItem(KEYS.GRADE_LEVELS, serverGradeLevels);
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
  if (!localStorage.getItem(KEYS.GRADE_LEVELS)) {
    setItem(KEYS.GRADE_LEVELS, initialGradeLevels);
  } else {
    // Ensure 5th, 6th, 7th grades are present in existing localStorage
    const currentGrades = getItem<SystemGradeLevel[]>(KEYS.GRADE_LEVELS, []);
    if (!currentGrades.some(g => g.level === 5)) {
      setItem(KEYS.GRADE_LEVELS, initialGradeLevels);
    }
  }
  if (!localStorage.getItem(KEYS.GLOBAL_CLASSES)) {
    setItem(KEYS.GLOBAL_CLASSES, initialGlobalClasses);
  } else {
    // Ensure 5th, 6th, 7th grade classes are present in existing localStorage
    const currentGlobalCls = getItem<GlobalClassTemplate[]>(KEYS.GLOBAL_CLASSES, []);
    if (!currentGlobalCls.some(g => g.gradeLevel === 5)) {
      setItem(KEYS.GLOBAL_CLASSES, initialGlobalClasses);
    }
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
  setAllUsers: (users: User[]) => {
    setItem(KEYS.USERS, users);
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },
  // Directly fetch users from Firebase with quick fallback to local storage
  fetchDirectUsers: async (): Promise<User[]> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${FIREBASE_DB_URL}/users.json`, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const cloudUsers = await res.json();
        if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
          setItem(KEYS.USERS, cloudUsers);
          window.dispatchEvent(new CustomEvent('opticok-data-updated'));
          return cloudUsers;
        }
      }
    } catch (e) {
      console.warn('Direct cloud users fetch failed, using local users cache:', e);
    }
    return storageService.getAllUsers();
  },
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
    pushUsersToServer(filtered);
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
    pushUsersToServer(list);
    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },
  deleteUser: (userId: string) => {
    const list = storageService.getAllUsers().filter(u => u.id !== userId);
    setItem(KEYS.USERS, list);
    pushUsersToServer(list);
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
    pushInstitutionsToServer(filtered);
    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },
  updateInstitution: (updated: Institution) => {
    const list = storageService.getInstitutions().map(i => i.id === updated.id ? updated : i);
    setItem(KEYS.INSTITUTIONS, list);
    pushInstitutionsToServer(list);
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

  // Grade Levels / Sınıf Kademeleri (Managed by Super Admin)
  getGradeLevels: (): SystemGradeLevel[] => {
    const list = getItem<SystemGradeLevel[]>(KEYS.GRADE_LEVELS, initialGradeLevels);
    return list.slice().sort((a, b) => (a.order || a.level) - (b.order || b.level));
  },
  addGradeLevel: (gradeLevel: SystemGradeLevel) => {
    const list = getItem<SystemGradeLevel[]>(KEYS.GRADE_LEVELS, initialGradeLevels);
    const filtered = list.filter(g => g.id !== gradeLevel.id && g.level !== gradeLevel.level);
    filtered.push(gradeLevel);
    setItem(KEYS.GRADE_LEVELS, filtered);
    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },
  updateGradeLevel: (gradeLevel: SystemGradeLevel) => {
    const list = getItem<SystemGradeLevel[]>(KEYS.GRADE_LEVELS, initialGradeLevels);
    const index = list.findIndex(g => g.id === gradeLevel.id);
    if (index >= 0) {
      list[index] = gradeLevel;
    } else {
      list.push(gradeLevel);
    }
    setItem(KEYS.GRADE_LEVELS, list);
    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },
  deleteGradeLevel: (gradeLevelId: string) => {
    const list = getItem<SystemGradeLevel[]>(KEYS.GRADE_LEVELS, initialGradeLevels).filter(g => g.id !== gradeLevelId);
    setItem(KEYS.GRADE_LEVELS, list);
    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },
  resetGradeLevelsToDefault: () => {
    setItem(KEYS.GRADE_LEVELS, initialGradeLevels);
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
    if (!institutionId) return list;
    return list.filter(e => 
      e.institutionId === institutionId || 
      e.isSystemExam === true || 
      e.createdByRole === 'SUPER_ADMIN' ||
      e.institutionId === 'ALL' ||
      e.institutionId === 'SYSTEM'
    );
  },
  getExamById: (examId: string): Exam | undefined => {
    const list = getItem<Exam[]>(KEYS.EXAMS, initialExams);
    return list.find(e => e.id === examId);
  },
  canDeleteExam: (exam: Exam, userOverride?: User): boolean => {
    const currentUser = userOverride || storageService.getCurrentUser();
    if (!currentUser) return false;
    // Super Admin has master authority to delete any exam
    if (currentUser.role === 'SUPER_ADMIN') return true;

    // System exams (created by Super Admin or marked as system exam) CANNOT be deleted by institutions
    const isSystemExam = exam.isSystemExam === true || 
      exam.createdByRole === 'SUPER_ADMIN' || 
      exam.institutionId === 'ALL' || 
      exam.institutionId === 'SYSTEM';

    if (isSystemExam) return false;

    // Institutions can only delete their own institution's exams
    return !!(currentUser.institutionId && exam.institutionId === currentUser.institutionId);
  },
  addExam: (exam: Exam) => {
    const list = getItem<Exam[]>(KEYS.EXAMS, initialExams);
    const currentUser = storageService.getCurrentUser();
    const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

    const enhancedExam: Exam = {
      ...exam,
      createdByRole: exam.createdByRole || currentUser.role,
      createdByUserId: exam.createdByUserId || currentUser.id,
      createdByName: exam.createdByName || currentUser.name,
      isSystemExam: exam.isSystemExam !== undefined 
        ? exam.isSystemExam 
        : (isSuperAdmin || exam.createdByRole === 'SUPER_ADMIN' || exam.institutionId === 'ALL' || exam.institutionId === 'SYSTEM')
    };

    const filtered = list.filter(e => e.id !== enhancedExam.id);
    filtered.unshift(enhancedExam);
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
  deleteExam: (examId: string, userOverride?: User): boolean => {
    const currentUser = userOverride || storageService.getCurrentUser();
    const exam = storageService.getExamById(examId);
    if (!exam) return false;

    if (!storageService.canDeleteExam(exam, currentUser)) {
      console.warn(`[Security] Unauthorized delete attempt by ${currentUser.name} (${currentUser.role}) on exam ${exam.title} (${exam.id})`);
      alert('Bu sınav Sistem Yöneticisi (Merkezi) tarafından oluşturulmuştur. Kurumlar sistem sınavlarını silemez; sadece optik form basabilir, optik okuyabilir ve sonuçlarını inceleyebilir.');
      return false;
    }

    const list = getItem<Exam[]>(KEYS.EXAMS, initialExams).filter(e => e.id !== examId);
    setItem(KEYS.EXAMS, list);
    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
    return true;
  },

  // Scan Results
  getAllScanResults: (): ScanResult[] => getItem<ScanResult[]>(KEYS.RESULTS, initialScanResults),
  getResults: (examId?: string, institutionId?: string): ScanResult[] => {
    let list = getItem<ScanResult[]>(KEYS.RESULTS, initialScanResults);
    if (examId) {
      list = list.filter(r => r.examId === examId);
    }
    if (institutionId) {
      const students = storageService.getStudents();
      const studentMap = new Map<string, Student>();
      students.forEach(s => studentMap.set(s.id, s));

      const exam = examId ? storageService.getExamById(examId) : undefined;
      const isExamOwnedByInstitution = Boolean(exam && exam.institutionId === institutionId);

      list = list.filter(r => {
        // 1. Eğer sınav zaten doğrudan bu kurumun kendi sınavıysa tüm okumalar kurumundur
        if (isExamOwnedByInstitution) return true;

        // 2. Sonucun kurumu doğrudan eşleşiyorsa
        if (r.institutionId === institutionId) return true;

        // 3. Sonuç merkezi/genel işaretlenmişse ama öğrencinin kayıtlı kurumu buysa
        if (r.studentId) {
          const st = studentMap.get(r.studentId);
          if (st && st.institutionId === institutionId) return true;
        }

        // 4. Kurum atanmamışsa veya varsayılan kalmışsa kurum adminine göster
        if (!r.institutionId || r.institutionId === 'inst-1' || r.institutionId === 'ALL' || r.institutionId === 'SYSTEM') {
          return true;
        }

        return false;
      });
    }
    return list;
  },
  saveScanResult: (result: ScanResult) => {
    // 1. Kurum ID Güvencesi: Eğer sonuçta kurum yoksa veya 'ALL'/'SYSTEM'/'inst-1' ise okuyan personelin kurumunu ata
    const currentUser = storageService.getCurrentUser();
    if (currentUser && currentUser.institutionId && (!result.institutionId || result.institutionId === 'ALL' || result.institutionId === 'SYSTEM' || result.institutionId === 'inst-1')) {
      result.institutionId = currentUser.institutionId;
    }

    // 2. Fotoğraf Yükünü Temizle (LocalStorage kotasını koru, JSON boyutunu ~1.5 KB'a indir)
    const resultToSave: ScanResult = { ...result };
    if (resultToSave.rawImageBase64) {
      delete resultToSave.rawImageBase64;
    }

    const list = getItem<ScanResult[]>(KEYS.RESULTS, initialScanResults);

    // 3. Güvenli Eşleşme Kontrolü:
    // Sadece AYNI ID'ye sahipse (örneğin doğrulama penceresinde şık değiştirilip tekrar kaydedilmişse)
    // VEYA gerçekten sistemde kayıtlı bir öğrencinin aynı sınavdaki önceki sonucunu güncellemek isteniyorsa:
    const registeredStudents = storageService.getStudents();
    const isRealRegisteredStudent = Boolean(
      resultToSave.studentId &&
      !resultToSave.studentId.startsWith('std-opt-') &&
      !resultToSave.studentId.startsWith('std-generic') &&
      registeredStudents.some(s => s.id === resultToSave.studentId)
    );

    let existingIndex = -1;
    if (isRealRegisteredStudent) {
      existingIndex = list.findIndex(r => 
        r.id === resultToSave.id || (
          r.examId === resultToSave.examId && 
          r.studentId === resultToSave.studentId
        )
      );
    } else {
      // Jenerik veya geçici isimlerde ASLA başka bir kağıdın üzerine yazma!
      existingIndex = list.findIndex(r => r.id === resultToSave.id);
    }

    if (existingIndex >= 0) {
      list[existingIndex] = resultToSave;
    } else {
      list.unshift(resultToSave);
    }
    setItem(KEYS.RESULTS, list);

    const exams = storageService.getExams();
    const exam = exams.find(e => e.id === resultToSave.examId);
    if (exam) {
      exam.totalExamsScanned = list.filter(r => r.examId === resultToSave.examId).length;
      setItem(KEYS.EXAMS, exams);
    }

    // 4. ATOMİK BULUT KAYDI:
    // Doğrudan Firebase'e tekil sonuç olarak gönder (PUT /results/{id}.json)
    // Bu sayede hiçbir cihaz diğerinin sonucunu EZEMEZ!
    pushSingleResultToServer(resultToSave);

    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },
  deleteScanResult: (resultId: string) => {
    const list = getItem<ScanResult[]>(KEYS.RESULTS, initialScanResults).filter(r => r.id !== resultId);
    setItem(KEYS.RESULTS, list);

    // Atomik bulut silmesi
    deleteSingleResultFromServer(resultId);

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
      gradeLevels: getItem(KEYS.GRADE_LEVELS, initialGradeLevels),
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
          if (Array.isArray(data.gradeLevels)) setItem(KEYS.GRADE_LEVELS, data.gradeLevels);
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
