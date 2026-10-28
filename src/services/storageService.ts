import { Institution, SchoolClass, Student, Exam, ScanResult, User, SiteSettings, GlobalClassTemplate, SystemGradeLevel, SubjectConfig } from '../types';
import { initialInstitutions, initialClasses, initialStudents, initialExams, initialScanResults, initialUsers, initialSiteSettings } from './mockData';
import { calculateTotalExamScore } from './scoreCalculationService';

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
  DELETED_RESULT_IDS: 'opticok_deleted_result_ids',
  DELETED_STUDENT_IDS: 'opticok_deleted_student_ids',
  DELETED_CLASS_IDS: 'opticok_deleted_class_ids',
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

// High-performance In-Memory Cache to prevent expensive repeated JSON.parse calls on large payloads
const memoryCache: Record<string, any> = {};

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && memoryCache[e.key] !== undefined) {
      delete memoryCache[e.key];
    }
  });
}

// Helper for local storage with in-memory caching
const getItem = <T>(key: string, fallback: T): T => {
  if (memoryCache[key] !== undefined) {
    return memoryCache[key] as T;
  }
  try {
    const data = localStorage.getItem(key);
    const parsed = data ? JSON.parse(data) : fallback;
    memoryCache[key] = parsed;
    return parsed;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
};

const setItem = <T>(key: string, value: T): void => {
  memoryCache[key] = value;
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
        memoryCache[key] = cleaned;
        localStorage.setItem(key, JSON.stringify(cleaned));
        console.warn('Successfully saved results after stripping image payloads');
      } catch (retryErr) {
        console.error('Retry saving results also failed:', retryErr);
      }
    }
  }
};

export const resetAllStorage = () => {
  Object.keys(memoryCache).forEach(k => delete memoryCache[k]);
  localStorage.removeItem(KEYS.INSTITUTIONS);
  localStorage.removeItem(KEYS.CLASSES);
  localStorage.removeItem(KEYS.GRADE_LEVELS);
  localStorage.removeItem(KEYS.GLOBAL_CLASSES);
  localStorage.removeItem(KEYS.STUDENTS);
  localStorage.removeItem(KEYS.EXAMS);
  localStorage.removeItem(KEYS.RESULTS);
  localStorage.removeItem(KEYS.USERS);
  localStorage.removeItem(KEYS.SITE_SETTINGS);
  localStorage.removeItem(KEYS.DELETED_RESULT_IDS);
  localStorage.removeItem(KEYS.DELETED_STUDENT_IDS);
  localStorage.removeItem(KEYS.DELETED_CLASS_IDS);

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
let pendingPush = false;
let syncStarted = false;
let lastLocalWriteTime = 0;

// Push system configuration, exams, students, and institutions to Firebase
// IMPORTANT: Does NOT push results array, so scan results are NEVER overwritten or wiped out in bulk!
export const pushToServer = async () => {
  if (isPushing) {
    pendingPush = true;
    return;
  }
  isPushing = true;
  pendingPush = false;
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
    isPushing = false;
    if (pendingPush) {
      pendingPush = false;
      setTimeout(() => {
        pushToServer();
      }, 100);
    }
  }
};

// Directly push students array to Firebase students endpoint
export const pushStudentsToServer = async (studentsToPush?: Student[]) => {
  try {
    const students = studentsToPush || getItem<Student[]>(KEYS.STUDENTS, initialStudents);
    await fetch(`${FIREBASE_DB_URL}/students.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(students)
    });
  } catch (e) {
    console.error('Direct push students to Firebase failed:', e);
  }
};

// Directly push classes array to Firebase classes endpoint
export const pushClassesToServer = async (classesToPush?: SchoolClass[]) => {
  try {
    const classes = classesToPush || getItem<SchoolClass[]>(KEYS.CLASSES, initialClasses);
    await fetch(`${FIREBASE_DB_URL}/classes.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(classes)
    });
  } catch (e) {
    console.error('Direct push classes to Firebase failed:', e);
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

// Helper to normalize strings for comparison (case-insensitive, trimmed, single spaces, turkish char map)
const normalizeStudentString = (s?: string): string => {
  if (!s) return '';
  return s
    .trim()
    .toLowerCase()
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/\s+/g, ' ');
};

export const isGenericStudentName = (name?: string): boolean => {
  if (!name) return true;
  const n = normalizeStudentString(name);
  if (!n) return true;
  // Matches "ogrenci", "ogrenci #1", "ogrenci 12", "misafir", "misafir ogrenci", "ornek ogrenci", "isimsiz", "genel"
  if (/^ogrenci(\s*#?\d*|\s*misafir)?$/i.test(n)) return true;
  if (/^misafir(\s*ogrenci)?$/i.test(n)) return true;
  if (n === 'ornek ogrenci' || n === 'genel' || n === 'isimsiz') return true;
  return false;
};

export const isValidStudentNo = (no?: string): boolean => {
  if (!no) return false;
  const clean = no.trim();
  if (!clean) return false;
  // Exclude generated random suffixes like "1-4829" or generic fallback "101" / "1042" when auto-generated
  if (/^\d+-\d{4,}$/.test(clean)) return false;
  if (clean === '101' || clean === '1042') return false;
  return true;
};

export const isSameStudentScanResult = (a: ScanResult, b: ScanResult): boolean => {
  // If exam IDs differ, they are definitely different exams
  if (a.examId !== b.examId) return false;

  // 1. Exact scan record ID match
  if (a.id && b.id && a.id === b.id) return true;

  // 2. Same studentId (if valid and not generic)
  if (
    a.studentId &&
    b.studentId &&
    a.studentId === b.studentId &&
    !a.studentId.startsWith('std-generic') &&
    a.studentId !== 'GENERIC' &&
    !a.studentId.startsWith('std-opt-') // std-opt- is generated for anonymous scans
  ) {
    return true;
  }

  // 3. Same student name (if not generic/anonymous)
  const aNameValid = !isGenericStudentName(a.studentName);
  const bNameValid = !isGenericStudentName(b.studentName);
  if (aNameValid && bNameValid) {
    const aNorm = normalizeStudentString(a.studentName);
    const bNorm = normalizeStudentString(b.studentName);
    if (aNorm === bNorm) {
      // If both have student numbers, they must not conflict
      if (isValidStudentNo(a.studentNo) && isValidStudentNo(b.studentNo) && a.studentNo.trim() !== b.studentNo.trim()) {
        return false;
      }
      return true;
    }
  }

  // 4. Same student number (if valid and not generic)
  if (
    isValidStudentNo(a.studentNo) &&
    isValidStudentNo(b.studentNo) &&
    a.studentNo.trim() === b.studentNo.trim()
  ) {
    // If both have different non-generic names, they are different students with the same number
    if (aNameValid && bNameValid) {
      const aNorm = normalizeStudentString(a.studentName);
      const bNorm = normalizeStudentString(b.studentName);
      if (aNorm !== bNorm) return false;
    }
    // If classes exist and differ, they are different students
    if (a.className && b.className && a.className.trim() !== b.className.trim()) {
      return false;
    }
    return true;
  }

  return false;
};

let lastSyncTime = 0;

// Synchronization with Firebase Cloud Database (Authoritative Single Source of Truth)
export const syncWithServer = async (force: boolean = false) => {
  const now = Date.now();
  // If pushing or recent local write happened within 3.5 seconds, don't overwrite with stale server cache
  if (isSyncing || isPushing || (now - lastLocalWriteTime < 3500)) return;
  // Enforce cooldown unless explicitly forced (minimum 10s cooldown to keep main thread free)
  if (!force && (now - lastSyncTime < 10000)) return;
  lastSyncTime = now;
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

    // Load deleted result IDs to prevent deleted results from resurrecting
    const deletedIds = new Set<string>(getItem<string[]>(KEYS.DELETED_RESULT_IDS, []));

    // Bidirectional Safe Merge for Scan Results:
    const localResults = getItem<ScanResult[]>(KEYS.RESULTS, initialScanResults);
    const resultMap = new Map<string, ScanResult>();

    // 1. Load server results (ignoring any that were deleted locally)
    serverResultsRawList.forEach(sr => {
      if (sr && sr.id) {
        if (deletedIds.has(sr.id)) {
          // If server still has it, ensure it's deleted from cloud
          deleteSingleResultFromServer(sr.id);
          return;
        }
        if (sr.rawImageBase64) delete sr.rawImageBase64;
        resultMap.set(sr.id, sr);
      }
    });

    // 2. Preserve any local results not yet in cloud, and queue them to sync up (unless marked as deleted)
    const missingInCloud: ScanResult[] = [];
    localResults.forEach(lr => {
      if (!lr || !lr.id || deletedIds.has(lr.id)) return;
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

    // 3. Deduplicate across server & local for same student in same exam:
    // If multiple results exist for the same student in the same exam (from past rescans),
    // keep only the newest one and purge older stale duplicates from Firebase!
    const allCandidates = Array.from(resultMap.values());
    allCandidates.sort((a, b) => new Date(b.scannedAt || 0).getTime() - new Date(a.scannedAt || 0).getTime());

    const deduplicatedResults: ScanResult[] = [];
    const staleCloudIdsToDelete: string[] = [];

    for (const item of allCandidates) {
      const alreadyHas = deduplicatedResults.some(existing => isSameStudentScanResult(existing, item));
      if (!alreadyHas) {
        deduplicatedResults.push(item);
      } else {
        staleCloudIdsToDelete.push(item.id);
      }
    }

    if (staleCloudIdsToDelete.length > 0) {
      staleCloudIdsToDelete.forEach(id => deleteSingleResultFromServer(id));
    }

    const mergedResults = deduplicatedResults;
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

    // Bidirectional Safe Merge for Students:
    const deletedStudentIds = new Set<string>(getItem<string[]>(KEYS.DELETED_STUDENT_IDS, []));
    const localStudents = getItem<Student[]>(KEYS.STUDENTS, initialStudents);
    const studentMap = new Map<string, Student>();

    // 1. Add server students (ignoring locally deleted ones)
    serverStudents.forEach(st => {
      if (st && st.id && !deletedStudentIds.has(st.id)) {
        studentMap.set(st.id, st);
      }
    });

    // 2. Preserve any local students not yet in cloud, and queue them to sync up
    let hasLocalStudentsMissingInCloud = false;
    localStudents.forEach(ls => {
      if (!ls || !ls.id || deletedStudentIds.has(ls.id)) return;
      if (!studentMap.has(ls.id)) {
        studentMap.set(ls.id, ls);
        hasLocalStudentsMissingInCloud = true;
      }
    });

    const mergedStudents = Array.from(studentMap.values());
    const mergedStudentsStr = JSON.stringify(mergedStudents);

    // Bidirectional Safe Merge for Classes:
    const deletedClassIds = new Set<string>(getItem<string[]>(KEYS.DELETED_CLASS_IDS, []));
    const localClasses = getItem<SchoolClass[]>(KEYS.CLASSES, initialClasses);
    const classMap = new Map<string, SchoolClass>();

    // 1. Add server classes (ignoring locally deleted ones)
    serverClasses.forEach(cls => {
      if (cls && cls.id && !deletedClassIds.has(cls.id)) {
        classMap.set(cls.id, cls);
      }
    });

    // 2. Preserve any local classes not yet in cloud
    let hasLocalClassesMissingInCloud = false;
    localClasses.forEach(lc => {
      if (!lc || !lc.id || deletedClassIds.has(lc.id)) return;
      if (!classMap.has(lc.id)) {
        classMap.set(lc.id, lc);
        hasLocalClassesMissingInCloud = true;
      }
    });

    const mergedClasses = Array.from(classMap.values());
    const mergedClassesStr = JSON.stringify(mergedClasses);

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
    if (localStudentsRaw !== mergedStudentsStr) {
      setItem(KEYS.STUDENTS, mergedStudents);
      hasChanged = true;
    }
    if (hasLocalStudentsMissingInCloud) {
      pushStudentsToServer(mergedStudents);
    }
    if (localClassesRaw !== mergedClassesStr) {
      setItem(KEYS.CLASSES, mergedClasses);
      hasChanged = true;
    }
    if (hasLocalClassesMissingInCloud) {
      pushClassesToServer(mergedClasses);
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

  // One-time cleanup: strip any legacy camera image base64 strings from local results to free up memory
  try {
    const localRes = getItem<ScanResult[]>(KEYS.RESULTS, []);
    let cleanedLocal = false;
    localRes.forEach(r => {
      if (r && r.rawImageBase64) {
        delete r.rawImageBase64;
        cleanedLocal = true;
      }
    });
    if (cleanedLocal) {
      setItem(KEYS.RESULTS, localRes);
    }
  } catch {
    // Ignore
  }

  // Start two-way real-time sync with Firebase Cloud Database
  if (!syncStarted && typeof window !== 'undefined') {
    syncStarted = true;
    syncWithServer(true);

    // Background polling: Every 45 seconds (was 3s, which choked the main thread and caused high INP)
    setInterval(() => syncWithServer(false), 45000);
    window.addEventListener('focus', () => syncWithServer(false));
    window.addEventListener('online', () => syncWithServer(true));

    // SSE listener with debounce to avoid continuous CPU loops
    let sseTimeout: any = null;
    const triggerDebouncedSync = () => {
      if (sseTimeout) clearTimeout(sseTimeout);
      sseTimeout = setTimeout(() => syncWithServer(false), 4000);
    };

    try {
      if (typeof EventSource !== 'undefined') {
        const sse = new EventSource(`${FIREBASE_DB_URL}.json`);
        sse.addEventListener('put', triggerDebouncedSync);
        sse.addEventListener('patch', triggerDebouncedSync);
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
    const deletedClassIds = getItem<string[]>(KEYS.DELETED_CLASS_IDS, []);
    if (deletedClassIds.includes(newClass.id)) {
      setItem(KEYS.DELETED_CLASS_IDS, deletedClassIds.filter(id => id !== newClass.id));
    }
    const list = getItem<SchoolClass[]>(KEYS.CLASSES, initialClasses);
    const filtered = list.filter(c => c.id !== newClass.id);
    filtered.unshift(newClass);
    setItem(KEYS.CLASSES, filtered);
    pushToServer();
    pushClassesToServer(filtered);
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },
  deleteClass: (classId: string) => {
    const deletedClassIds = getItem<string[]>(KEYS.DELETED_CLASS_IDS, []);
    if (!deletedClassIds.includes(classId)) {
      setItem(KEYS.DELETED_CLASS_IDS, [...deletedClassIds, classId]);
    }
    const list = getItem<SchoolClass[]>(KEYS.CLASSES, initialClasses).filter(c => c.id !== classId);
    setItem(KEYS.CLASSES, list);
    pushToServer();
    pushClassesToServer(list);
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
    const deletedStudentIds = getItem<string[]>(KEYS.DELETED_STUDENT_IDS, []);
    if (deletedStudentIds.includes(student.id)) {
      setItem(KEYS.DELETED_STUDENT_IDS, deletedStudentIds.filter(id => id !== student.id));
    }
    const list = getItem<Student[]>(KEYS.STUDENTS, initialStudents);
    const filtered = list.filter(s => s.id !== student.id);
    filtered.unshift(student);
    setItem(KEYS.STUDENTS, filtered);
    pushToServer();
    pushStudentsToServer(filtered);
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },
  updateStudent: (student: Student) => {
    const list = getItem<Student[]>(KEYS.STUDENTS, initialStudents);
    const index = list.findIndex(s => s.id === student.id);
    if (index >= 0) {
      list[index] = student;
    } else {
      list.unshift(student);
    }
    setItem(KEYS.STUDENTS, list);
    pushToServer();
    pushStudentsToServer(list);
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },
  addStudentsBatch: (students: Student[]) => {
    const newIds = new Set(students.map(s => s.id));
    const deletedStudentIds = getItem<string[]>(KEYS.DELETED_STUDENT_IDS, []);
    if (deletedStudentIds.some(id => newIds.has(id))) {
      setItem(KEYS.DELETED_STUDENT_IDS, deletedStudentIds.filter(id => !newIds.has(id)));
    }
    const list = getItem<Student[]>(KEYS.STUDENTS, initialStudents);
    const kept = list.filter(s => !newIds.has(s.id));
    const combined = [...students, ...kept];
    setItem(KEYS.STUDENTS, combined);
    pushToServer();
    pushStudentsToServer(combined);
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },
  deleteStudent: (studentId: string) => {
    const deletedStudentIds = getItem<string[]>(KEYS.DELETED_STUDENT_IDS, []);
    if (!deletedStudentIds.includes(studentId)) {
      setItem(KEYS.DELETED_STUDENT_IDS, [...deletedStudentIds, studentId]);
    }
    const list = getItem<Student[]>(KEYS.STUDENTS, initialStudents).filter(s => s.id !== studentId);
    setItem(KEYS.STUDENTS, list);
    pushToServer();
    pushStudentsToServer(list);
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },

  // Exams
  getExams: (institutionId?: string, includeDeleted: boolean = false): Exam[] => {
    let list = getItem<Exam[]>(KEYS.EXAMS, initialExams);
    if (!includeDeleted) {
      list = list.filter(e => !e.isDeleted);
    }
    if (!institutionId) return list;
    return list.filter(e => 
      e.institutionId === institutionId || 
      e.isSystemExam === true || 
      e.createdByRole === 'SUPER_ADMIN' ||
      e.institutionId === 'ALL' ||
      e.institutionId === 'SYSTEM'
    );
  },
  getTrashExams: (institutionId?: string): Exam[] => {
    const list = getItem<Exam[]>(KEYS.EXAMS, initialExams).filter(e => e.isDeleted === true);
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
  canEditExam: (exam: Exam, userOverride?: User): boolean => {
    const currentUser = userOverride || storageService.getCurrentUser();
    if (!currentUser) return false;
    // Super Admin has master authority to edit any exam
    if (currentUser.role === 'SUPER_ADMIN') return true;

    // Kurumlar ve öğretmenler kendi kurumlarının sınavlarını tam düzenleyebilir.
    // Merkezi sistem sınavlarında dahi cevap anahtarı düzenleme hakkına sahiptir.
    const isSystemExam = exam.isSystemExam === true || 
      exam.createdByRole === 'SUPER_ADMIN' || 
      exam.institutionId === 'ALL' || 
      exam.institutionId === 'SYSTEM';

    if (isSystemExam) {
      // Kurumlar merkezi sınavların genel iskeletini silmese bile cevap anahtarını düzeltebilir
      return true;
    }

    if (!currentUser.institutionId) return true;
    return exam.institutionId === currentUser.institutionId || !exam.institutionId;
  },
  canEditAnswerKey: (exam: Exam, userOverride?: User): boolean => {
    const currentUser = userOverride || storageService.getCurrentUser();
    if (!currentUser) return false;
    // Super Admin, Kurum Yöneticisi ve Öğretmenlerin tümü sınavların cevap anahtarını güncelleyebilir
    return true;
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
  updateExam: (exam: Exam, recalculateResults: boolean = true) => {
    const list = getItem<Exam[]>(KEYS.EXAMS, initialExams).map(e => e.id === exam.id ? exam : e);
    setItem(KEYS.EXAMS, list);
    
    // Sınavın cevap anahtarı veya kuralları güncellendiğinde daha önce okunmuş tüm optik sonuçları otomatik yeniden hesapla
    if (recalculateResults) {
      storageService.recalculateResultsForExam(exam);
    }

    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },
  updateExamAnswerKey: (examId: string, updatedSubjects: SubjectConfig[], hasBookletTypes?: boolean): { success: boolean; recalculatedCount: number } => {
    const exam = storageService.getExamById(examId);
    if (!exam) return { success: false, recalculatedCount: 0 };

    const updatedExam: Exam = {
      ...exam,
      hasBookletTypes: hasBookletTypes !== undefined ? hasBookletTypes : exam.hasBookletTypes,
      subjects: updatedSubjects
    };

    storageService.updateExam(updatedExam, true);
    const count = storageService.recalculateResultsForExam(updatedExam);
    return { success: true, recalculatedCount: count };
  },
  // Verilen sınava ait mevcut tüm taranmış optik form sonuçlarını güncellenen cevap anahtarına göre yeniden hesaplar
  recalculateResultsForExam: (exam: Exam): number => {
    const allResults = getItem<ScanResult[]>(KEYS.RESULTS, initialScanResults);
    const examResults = allResults.filter(r => r.examId === exam.id);
    if (examResults.length === 0) return 0;

    const penaltyRatio = exam.netPenaltyRatio !== undefined 
      ? exam.netPenaltyRatio 
      : (exam.scoringStandard === 'LGS' ? 3 : 4);

    const updatedAllResults = allResults.map(res => {
      if (res.examId !== exam.id) return res;

      let totalCorrect = 0;
      let totalWrong = 0;
      let totalEmpty = 0;

      const updatedSubjectResults = (exam.subjects || []).map(subject => {
        let subCorrect = 0;
        let subWrong = 0;
        let subEmpty = 0;

        for (let q = 1; q <= subject.questionCount; q++) {
          const isBookletB = res.bookletType === 'B';
          const correctAnswer = (isBookletB && subject.correctAnswersB?.[q - 1])
            ? subject.correctAnswersB[q - 1]
            : (subject.correctAnswers[q - 1] || 'A');

          // Öğrencinin bu soruya vermiş olduğu işaretlemeyi bul
          const existingAns = res.answers?.find(
            a => a.subjectName === subject.name && a.questionNumber === q
          );
          const selectedOption = existingAns ? existingAns.selectedOption : null;

          const isCancelled = correctAnswer === '*' || correctAnswer === 'X' || correctAnswer === 'IPTAL';

          if (isCancelled) {
            // İptal edilen soru tüm öğrencilerde doğru kabul edilir
            subCorrect++;
          } else if (!selectedOption || selectedOption.trim() === '') {
            subEmpty++;
          } else if (selectedOption === 'MULTIPLE') {
            subWrong++;
          } else if (selectedOption === correctAnswer) {
            subCorrect++;
          } else {
            subWrong++;
          }
        }

        const subNet = penaltyRatio > 0
          ? Math.max(0, parseFloat((subCorrect - subWrong / penaltyRatio).toFixed(2)))
          : subCorrect;

        totalCorrect += subCorrect;
        totalWrong += subWrong;
        totalEmpty += subEmpty;

        return {
          subjectName: subject.name,
          correctCount: subCorrect,
          wrongCount: subWrong,
          emptyCount: subEmpty,
          netCount: subNet
        };
      });

      const totalNet = penaltyRatio > 0
        ? Math.max(0, parseFloat((totalCorrect - totalWrong / penaltyRatio).toFixed(2)))
        : totalCorrect;

      const totalScore = calculateTotalExamScore(exam, updatedSubjectResults, totalNet);

      // Soru bazlı answers listesini güncelle
      const updatedAnswers = (exam.subjects || []).flatMap(subject => {
        const subjectAnswers = [];
        for (let q = 1; q <= subject.questionCount; q++) {
          const isBookletB = res.bookletType === 'B';
          const correctAnswer = (isBookletB && subject.correctAnswersB?.[q - 1])
            ? subject.correctAnswersB[q - 1]
            : (subject.correctAnswers[q - 1] || 'A');

          const existingAns = res.answers?.find(
            a => a.subjectName === subject.name && a.questionNumber === q
          );
          const selectedOption = existingAns ? existingAns.selectedOption : null;
          const isCancelled = correctAnswer === '*' || correctAnswer === 'X' || correctAnswer === 'IPTAL';
          const isBlank = !isCancelled && (!selectedOption || selectedOption.trim() === '');
          const isCorrect = isCancelled || (!isBlank && selectedOption !== 'MULTIPLE' && selectedOption === correctAnswer);
          const outcome = subject.learningOutcomes?.[q - 1] || existingAns?.learningOutcome || '';

          subjectAnswers.push({
            subjectName: subject.name,
            questionNumber: q,
            selectedOption,
            correctAnswer,
            isCorrect,
            isBlank,
            isUncertain: existingAns?.isUncertain,
            learningOutcome: outcome
          });
        }
        return subjectAnswers;
      });

      // Kazanım analizlerini tekrar hesapla
      const outcomeMap = new Map<string, {
        subjectName: string;
        outcome: string;
        total: number;
        correct: number;
        wrong: number;
        empty: number;
      }>();

      updatedAnswers.forEach(ans => {
        let outcome = ans.learningOutcome;
        if (!outcome) {
          const sub = exam.subjects?.find(s => s.name === ans.subjectName);
          if (sub && sub.learningOutcomes && sub.learningOutcomes[ans.questionNumber - 1]) {
            outcome = sub.learningOutcomes[ans.questionNumber - 1];
          }
        }
        if (!outcome || !outcome.trim()) return;

        const key = `${ans.subjectName}:::${outcome.trim()}`;
        if (!outcomeMap.has(key)) {
          outcomeMap.set(key, {
            subjectName: ans.subjectName,
            outcome: outcome.trim(),
            total: 0,
            correct: 0,
            wrong: 0,
            empty: 0
          });
        }
        const item = outcomeMap.get(key)!;
        item.total++;
        if (ans.isCorrect) item.correct++;
        else if (ans.isBlank) item.empty++;
        else item.wrong++;
      });

      const updatedOutcomeAnalyses = Array.from(outcomeMap.values()).map(item => {
        const rate = item.total > 0 ? parseFloat(((item.correct / item.total) * 100).toFixed(1)) : 0;
        let status: 'SUCCESS' | 'WARNING' | 'DANGER' = 'SUCCESS';
        if (rate < 50) status = 'DANGER';
        else if (rate < 80) status = 'WARNING';

        return {
          subjectName: item.subjectName,
          outcome: item.outcome,
          totalQuestions: item.total,
          correctCount: item.correct,
          wrongCount: item.wrong,
          emptyCount: item.empty,
          successRate: rate,
          status
        };
      });

      const updatedResult: ScanResult = {
        ...res,
        examTitle: exam.title,
        totalCorrect,
        totalWrong,
        totalEmpty,
        totalNet,
        totalScore,
        subjectResults: updatedSubjectResults,
        answers: updatedAnswers,
        outcomeAnalyses: updatedOutcomeAnalyses
      };

      // Tekil olarak Firebase bulutuna da güncelle
      pushSingleResultToServer(updatedResult);

      return updatedResult;
    });

    setItem(KEYS.RESULTS, updatedAllResults);
    return examResults.length;
  },
  // Çöp Kutusuna Taşı (Soft Delete)
  deleteExam: (examId: string, userOverride?: User): boolean => {
    const currentUser = userOverride || storageService.getCurrentUser();
    const exam = storageService.getExamById(examId);
    if (!exam) return false;

    if (!storageService.canDeleteExam(exam, currentUser)) {
      console.warn(`[Security] Unauthorized delete attempt by ${currentUser?.name} (${currentUser?.role}) on exam ${exam.title} (${exam.id})`);
      alert('Bu sınav Sistem Yöneticisi (Merkezi) tarafından oluşturulmuştur. Kurumlar sistem sınavlarını silemez; sadece optik form basabilir, optik okuyabilir ve sonuçlarını inceleyebilir.');
      return false;
    }

    const list = getItem<Exam[]>(KEYS.EXAMS, initialExams).map(e => {
      if (e.id === examId) {
        return {
          ...e,
          isDeleted: true,
          deletedAt: new Date().toISOString()
        };
      }
      return e;
    });
    setItem(KEYS.EXAMS, list);
    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
    return true;
  },
  // Çöp Kutusundan Geri Yükle (Restore)
  restoreExam: (examId: string, userOverride?: User): boolean => {
    const currentUser = userOverride || storageService.getCurrentUser();
    const exam = storageService.getExamById(examId);
    if (!exam) return false;

    if (!storageService.canDeleteExam(exam, currentUser)) {
      alert('Bu sınavı geri yükleme yetkiniz bulunmuyor.');
      return false;
    }

    const list = getItem<Exam[]>(KEYS.EXAMS, initialExams).map(e => {
      if (e.id === examId) {
        const copy = { ...e };
        delete copy.isDeleted;
        delete copy.deletedAt;
        return copy;
      }
      return e;
    });
    setItem(KEYS.EXAMS, list);
    pushToServer();
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
    return true;
  },
  // Çöp Kutusundan Kalıcı Olarak Sil (Permanent Delete)
  permanentlyDeleteExam: (examId: string, userOverride?: User): boolean => {
    const currentUser = userOverride || storageService.getCurrentUser();
    const exam = storageService.getExamById(examId);
    if (!exam) return false;

    if (!storageService.canDeleteExam(exam, currentUser)) {
      alert('Bu sınav Sistem Yöneticisi (Merkezi) tarafından oluşturulmuştur. Kurumlar sistem sınavlarını silemez.');
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

        // 5. Misafir veya isimsiz taranan optik formlar (sınavın sonuçlarında daima görünür)
        if (
          isGenericStudentName(r.studentName) ||
          (r.studentId && (r.studentId.startsWith('std-opt-') || r.studentId === 'GENERIC'))
        ) {
          return true;
        }

        return false;
      });
    }
    return list;
  },
  saveScanResult: (result: ScanResult) => {
    // 1. Kurum ID Güvencesi: Eğer okuyan personelin kurumu varsa ve Super Admin değilse personelin kurumunu ata
    const currentUser = storageService.getCurrentUser();
    if (currentUser && currentUser.institutionId) {
      if (currentUser.role !== 'SUPER_ADMIN' || !result.institutionId || result.institutionId === 'ALL' || result.institutionId === 'SYSTEM' || result.institutionId === 'inst-1') {
        result.institutionId = currentUser.institutionId;
      }
    }

    // 1.1 Öğrenci Kaydı Güvencesi: Eğer öğrenci sistemde yoksa veya misafir optik ise öğrenci listesine de kaydet
    if (result.studentId && result.studentName) {
      const students = storageService.getStudents();
      const existingStudent = students.find(s => s.id === result.studentId);
      const cleanName = result.studentName.trim();
      const [fName, ...lNameParts] = cleanName.split(' ');
      const cleanFirstName = fName || 'Öğrenci';
      const cleanLastName = lNameParts.join(' ') || (result.studentNo ? `#${result.studentNo}` : '');
      const finalInstId = result.institutionId || currentUser?.institutionId || 'inst-1';

      if (!existingStudent) {
        const newStudent: Student = {
          id: result.studentId,
          institutionId: finalInstId,
          classId: 'cls-101',
          className: result.className || 'Genel',
          studentNo: result.studentNo || '',
          firstName: cleanFirstName,
          lastName: cleanLastName
        };
        storageService.addStudent(newStudent);
      } else if (
        cleanName &&
        !isGenericStudentName(cleanName) &&
        (existingStudent.firstName !== cleanFirstName || existingStudent.lastName !== cleanLastName || existingStudent.studentNo !== result.studentNo || existingStudent.className !== result.className)
      ) {
        existingStudent.firstName = cleanFirstName;
        existingStudent.lastName = cleanLastName;
        if (result.studentNo) existingStudent.studentNo = result.studentNo;
        if (result.className) existingStudent.className = result.className;
        if (finalInstId && finalInstId !== 'ALL' && finalInstId !== 'SYSTEM') existingStudent.institutionId = finalInstId;
        storageService.updateStudent(existingStudent);
      }
    }

    // 2. Fotoğraf Yükünü Temizle (LocalStorage kotasını koru, JSON boyutunu ~1.5 KB'a indir)
    const resultToSave: ScanResult = { ...result };
    if (resultToSave.rawImageBase64) {
      delete resultToSave.rawImageBase64;
    }

    let list = getItem<ScanResult[]>(KEYS.RESULTS, initialScanResults);

    // 3. Güvenli Eşleşme Kontrolü:
    // Eğer aynı sınavda aynı öğrencinin (öğrenci ID, öğrenci No veya isim eşleşmesiyle) önceki bir sonucu varsa:
    // Var olan sonucun ID'sini devralarak üzerine yazar.
    // Bu sayede hem LocalStorage'da tek kayıt kalır hem de Firebase PUT /results/{id}.json ile
    // buluttaki eski kayıt doğrudan ezilir ve hayalet çift kayıt oluşmaz!
    const existingIndex = list.findIndex(r => isSameStudentScanResult(r, resultToSave));

    if (existingIndex >= 0) {
      const existingResult = list[existingIndex];
      const targetId = existingResult.id;

      resultToSave.id = targetId;
      resultToSave.scannedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);

      // Daha önce silindi olarak işaretlendiyse dirilt (tombstone listesinden temizle)
      const deletedIds = getItem<string[]>(KEYS.DELETED_RESULT_IDS, []);
      if (deletedIds.includes(targetId)) {
        setItem(KEYS.DELETED_RESULT_IDS, deletedIds.filter(id => id !== targetId));
      }

      // Geçmişten kalan olası mükerrer kayıtları buluttan ve yerelden temizle
      const otherDuplicates = list.filter((r, idx) => idx !== existingIndex && isSameStudentScanResult(r, resultToSave));
      for (const dup of otherDuplicates) {
        deleteSingleResultFromServer(dup.id);
      }

      const updatedList = list.filter((r, idx) => idx === existingIndex || !isSameStudentScanResult(r, resultToSave));
      const finalIdx = updatedList.findIndex(r => r.id === targetId);
      if (finalIdx >= 0) {
        updatedList[finalIdx] = resultToSave;
      } else {
        updatedList.unshift(resultToSave);
      }
      list = updatedList;
      setItem(KEYS.RESULTS, list);
    } else {
      list.unshift(resultToSave);
      setItem(KEYS.RESULTS, list);
    }

    const exams = storageService.getExams();
    const exam = exams.find(e => e.id === resultToSave.examId);
    if (exam) {
      exam.totalExamsScanned = list.filter(r => r.examId === resultToSave.examId).length;
      setItem(KEYS.EXAMS, exams);
    }

    // 4. ATOMİK BULUT KAYDI:
    // Doğrudan Firebase'e tekil sonuç olarak gönder (PUT /results/{id}.json)
    // Var olan ID devralındığı için doğrudan eski sonucun üzerine yazar!
    pushSingleResultToServer(resultToSave);

    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
  },
  updateScanResultStudentInfo: (
    resultId: string,
    info: {
      studentName: string;
      studentNo?: string;
      className?: string;
      classId?: string;
      studentId?: string;
      institutionId?: string;
    }
  ): boolean => {
    let list = getItem<ScanResult[]>(KEYS.RESULTS, initialScanResults);
    const targetIdx = list.findIndex(r => r.id === resultId);
    if (targetIdx === -1) return false;

    const currentResult = list[targetIdx];
    const currentUser = storageService.getCurrentUser();
    const finalInstId = info.institutionId || currentResult.institutionId || currentUser?.institutionId || 'inst-1';

    const cleanName = info.studentName.trim();
    const [fName, ...lNameParts] = cleanName.split(' ');
    const firstName = fName || 'Öğrenci';
    const lastName = lNameParts.join(' ') || '';

    const finalStudentId = info.studentId || (currentResult.studentId && !currentResult.studentId.startsWith('std-opt-') && currentResult.studentId !== 'GENERIC' ? currentResult.studentId : `std-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`);

    const updatedResult: ScanResult = {
      ...currentResult,
      studentId: finalStudentId,
      studentName: cleanName,
      studentNo: info.studentNo !== undefined ? info.studentNo.trim() : currentResult.studentNo,
      className: info.className !== undefined ? info.className.trim() : currentResult.className,
      institutionId: finalInstId
    };

    list[targetIdx] = updatedResult;
    setItem(KEYS.RESULTS, list);

    // Öğrenciyi veritabanında da güncelle veya ekle
    const students = storageService.getStudents();
    const existingStudent = students.find(s => s.id === finalStudentId || (info.studentNo && isValidStudentNo(info.studentNo) && s.studentNo === info.studentNo.trim()));
    if (existingStudent) {
      existingStudent.firstName = firstName;
      existingStudent.lastName = lastName;
      if (info.studentNo !== undefined) existingStudent.studentNo = info.studentNo.trim();
      if (info.className !== undefined) existingStudent.className = info.className.trim();
      if (info.classId) existingStudent.classId = info.classId;
      existingStudent.institutionId = finalInstId;
      storageService.updateStudent(existingStudent);
    } else {
      const newStudent: Student = {
        id: finalStudentId,
        institutionId: finalInstId,
        classId: info.classId || 'cls-101',
        className: info.className || currentResult.className || 'Genel',
        studentNo: info.studentNo !== undefined ? info.studentNo.trim() : currentResult.studentNo,
        firstName,
        lastName
      };
      storageService.addStudent(newStudent);
    }

    pushSingleResultToServer(updatedResult);
    window.dispatchEvent(new CustomEvent('opticok-data-updated'));
    return true;
  },
  deleteScanResult: (resultId: string) => {
    // 1. Mark ID as deleted to prevent resurrection from cloud or other clients
    const deletedIds = getItem<string[]>(KEYS.DELETED_RESULT_IDS, []);
    if (!deletedIds.includes(resultId)) {
      deletedIds.push(resultId);
      // Keep list within sensible bounds (last 1000 deleted IDs)
      if (deletedIds.length > 1000) deletedIds.shift();
      setItem(KEYS.DELETED_RESULT_IDS, deletedIds);
    }

    const list = getItem<ScanResult[]>(KEYS.RESULTS, initialScanResults);
    const targetResult = list.find(r => r.id === resultId);
    const updatedList = list.filter(r => r.id !== resultId);
    setItem(KEYS.RESULTS, updatedList);

    if (targetResult) {
      const exams = getItem<Exam[]>(KEYS.EXAMS, initialExams);
      const exam = exams.find(e => e.id === targetResult.examId);
      if (exam) {
        exam.totalExamsScanned = updatedList.filter(r => r.examId === targetResult.examId).length;
        setItem(KEYS.EXAMS, exams);
      }
    }

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
