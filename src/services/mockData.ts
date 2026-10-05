import { Institution, SchoolClass, Student, Exam, ScanResult, User, SiteSettings } from '../types';

export const initialSiteSettings: SiteSettings = {
  siteTitle: 'Opteno',
  siteSubtitle: 'Dijital Sınav Yönetim Sistemi',
  logoText: 'Opteno',
  announcementText: '📢 Hoş Geldiniz! Sisteminiz hazır. Kurumlarınızı ve Sınavlarınızı oluşturup test etmeye başlayabilirsiniz.',
  isAnnouncementActive: true,
  netPenaltyRatio: 4,
  defaultOptionCount: 4,
  cameraResolution: 'HD',
  enableAutoScan: true,
  maintenanceMode: false,
};

export const initialUsers: User[] = [
  {
    id: 'user-admin',
    name: 'Sistem Yöneticisi',
    username: 'admin',
    password: 'admin',
    email: 'admin@opteno.com',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  }
];

export const initialInstitutions: Institution[] = [];
export const initialClasses: SchoolClass[] = [];
export const initialStudents: Student[] = [];
export const initialExams: Exam[] = [];
export const initialScanResults: ScanResult[] = [];
