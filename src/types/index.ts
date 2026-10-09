export type UserRole = 'SUPER_ADMIN' | 'INSTITUTION_ADMIN' | 'TEACHER';

export interface User {
  id: string;
  name: string;
  username?: string;
  password?: string;
  email: string;
  phone?: string;
  role: UserRole;
  institutionId?: string; // Null if SUPER_ADMIN
  institutionName?: string;
  avatar?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
}

export interface SiteSettings {
  siteTitle: string;
  siteSubtitle: string;
  logoText: string;
  announcementText: string;
  isAnnouncementActive: boolean;
  netPenaltyRatio: number; // e.g., 4 for 4 wrongs cancel 1 correct
  defaultOptionCount: number; // 4 or 5
  cameraResolution: 'AUTO' | 'HD' | 'FHD';
  enableAutoScan: boolean;
  maintenanceMode: boolean;
}


export interface Institution {
  id: string;
  name: string;
  code: string;
  city: string;
  phone: string;
  email: string;
  logoUrl?: string; // Base64 data URI or image URL for official PDF reports
  studentCount: number;
  examCount: number;
  createdAt: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface SchoolClass {
  id: string;
  institutionId: string;
  name: string; // e.g. "8-A", "12-SAY-1"
  gradeLevel: number; // e.g. 8, 12
  studentCount: number;
}

export interface SystemGradeLevel {
  id: string; // e.g. "grade-5", "grade-8"
  level: number; // numeric grade level (e.g. 5, 6, 7, 8, 9, 10, 11, 12, 13)
  name: string; // e.g. "5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf (LGS)", "12. Sınıf (YKS)", "Mezun"
  category: 'İlkokul' | 'Ortaokul' | 'Lise' | 'Mezun / Diğer';
  description?: string;
  isActive: boolean;
  order?: number;
}

export interface GlobalClassTemplate {
  id: string;
  name: string; // e.g. "5-A", "8-A", "12-SAY", "Mezun"
  gradeLevel: number; // e.g. 5, 6, 7, 8, 9, 10, 11, 12
  description?: string; // e.g. "Ortaokul", "LGS Hazırlık", "YKS Sayısal"
  createdAt?: string;
}

export interface Student {
  id: string;
  institutionId: string;
  classId: string;
  className: string;
  studentNo: string;
  firstName: string;
  lastName: string;
  parentPhone?: string;
}

export interface SubjectConfig {
  id: string;
  name: string; // e.g. "Türkçe", "Matematik", "Fen Bilimleri"
  questionCount: number; // e.g. 20
  optionCount: number; // 4 (A-D) or 5 (A-E)
  correctAnswers: string[]; // ['A', 'C', 'B', 'D', ...] (A Kitapçığı veya Standart)
  correctAnswersB?: string[]; // B Kitapçığı cevap anahtarı (İsteğe bağlı)
  learningOutcomes?: string[]; // e.g. ['Üslü İfadeler', 'Çarpanlar ve Katlar', ...]
}

export interface Exam {
  id: string;
  institutionId: string;
  institutionName: string;
  title: string; // e.g. "8. Sınıf LGS Deneme Sınavı - 1"
  examCode: string; // e.g. "LGS-2026-01"
  date: string;
  gradeLevel?: number | string; // e.g. 8, 12, "8. Sınıf"
  netPenaltyRatio?: number; // e.g. 4 (4 wrong 1 correct), 3, or 0
  defaultOptionCount?: number; // 4 or 5
  hasBookletTypes?: boolean; // Kitapçık Türü (A / B) aktif mi?
  subjects: SubjectConfig[];
  totalQuestions: number;
  totalExamsScanned: number;
  isStudentSpecific: boolean;
  createdAt: string;
  createdByRole?: 'SUPER_ADMIN' | 'INSTITUTION_ADMIN' | 'TEACHER';
  createdByUserId?: string;
  createdByName?: string;
  isSystemExam?: boolean; // Sistem Admini (SuperAdmin) tarafından oluşturulmuş merkezi sınav
}

export interface ScannedAnswer {
  subjectName: string;
  questionNumber: number;
  selectedOption: string | null; // 'A', 'B', 'C', 'D', 'E', null (blank), or 'MULTIPLE'
  correctAnswer: string;
  isCorrect: boolean;
  isBlank: boolean;
  isUncertain?: boolean; // Silik veya şüpheli işaretleme uyarısı
  learningOutcome?: string; // Soruya ait konu / kazanım
}

export interface OutcomeAnalysis {
  subjectName: string;
  outcome: string; // Kazanım / Konu adı
  totalQuestions: number; // Bu kazanıma ait soru adedi
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  successRate: number; // 0 - 100 percentage
  status: 'SUCCESS' | 'WARNING' | 'DANGER'; // 🟢 Tam Kavrandı, 🟡 Tekrar Edilmeli, 🔴 Destek Gerekli
}

export interface SubjectResult {
  subjectName: string;
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  netCount: number;
}

export interface ScanResult {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  studentNo: string;
  className: string;
  institutionId: string;
  scannedAt: string;
  bookletType?: 'A' | 'B';
  totalCorrect: number;
  totalWrong: number;
  totalEmpty: number;
  totalNet: number;
  totalScore: number;
  subjectResults: SubjectResult[];
  answers: ScannedAnswer[];
  outcomeAnalyses?: OutcomeAnalysis[];
  rawImageBase64?: string;
}

export interface OMRQRLayoutSubject {
  n: string; // subject name
  q: number; // question count
  o: number; // option count
  k: string; // answer key, one char per question ('-' = no key)
}

export interface OMRQRData {
  examId: string;
  studentId?: string;
  examCode?: string;
  studentNo?: string;
  instId?: string;
  studentName?: string;
  examTitle?: string;
  bookletType?: 'A' | 'B';
  layout?: OMRQRLayoutSubject[];
  timestamp: number;
  version: string;
}
